// 🛡️ SIMON MD - Anti Group Status Mention (Silent Kick) | FIXED - Catches ALL Status Mentions
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../database/antigcstatusmention.json')

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH)) } catch { return {} }
}
function saveDB(data) {
  if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}
function getChat(jid) {
  const db = loadDB()
  if (!db[jid]) { db[jid] = { enabled: false }; saveDB(db) }
  return db[jid]
}
function setChat(jid, data) {
  const db = loadDB()
  db[jid] = { ...getChat(jid), ...data }
  saveDB(db)
}
function normId(id = '') { return String(id).split(':')[0].split('@')[0] }
function isAdmin(meta, id) {
  if (!meta?.participants) return false
  const base = normId(id)
  const p = meta.participants.find(x => normId(x.id) === base || normId(x.lid || '') === base)
  return !!(p?.admin === 'admin' || p?.admin === 'superadmin')
}
function isOwner(sender) { return normId(sender) === '239166265317' }

const metaCache = new Map()
async function getMeta(sock, jid) {
  const now = Date.now()
  const cached = metaCache.get(jid)
  if (cached && now - cached.t < 30000) return cached.meta
  try {
    const meta = await sock.groupMetadata(jid)
    metaCache.set(jid, { meta, t: now })
    return meta
  } catch { return null }
}

function unwrap(msg) {
  if (!msg) return null
  if (msg.ephemeralMessage) return unwrap(msg.ephemeralMessage.message)
  if (msg.viewOnceMessage) return unwrap(msg.viewOnceMessage.message)
  if (msg.viewOnceMessageV2) return unwrap(msg.viewOnceMessageV2.message)
  if (msg.viewOnceMessageV2Extension) return unwrap(msg.viewOnceMessageV2Extension.message)
  if (msg.documentWithCaptionMessage) return unwrap(msg.documentWithCaptionMessage.message)
  if (msg.editedMessage) return unwrap(msg.editedMessage.message)
  return msg
}

// Returns { isMention: true/false, groupJid: 'xxx@g.us' or null }
function checkStatusMention(m) {
  const raw = m.message
  if (!raw) return { isMention: false, groupJid: null }
  const msg = unwrap(raw) || {}
  const keys = Object.keys(msg).join(',') + '|' + Object.keys(raw).join(',')

  // DEBUG - uncomment to see what WhatsApp dey send
  // console.log('[STATUS MENTION DEBUG]', m.key.remoteJid, keys)

  // 1. Direct groupStatusMessage types
  if (msg.groupStatusMessage || msg.groupStatusMessageV2 || msg.statusMentionMessage || raw.groupStatusMessage || raw.groupStatusMessageV2) {
    // Try to get group Jid from inside the message
    const g = msg.groupStatusMessage?.groupJid || msg.groupStatusMessageV2?.groupJid || msg.statusMentionMessage?.groupJid || raw.groupStatusMessage?.groupJid || m.key.remoteJid
    return { isMention: true, groupJid: g }
  }

  // 2. Protocol type 14 = status / group status
  if ((msg.protocolMessage && msg.protocolMessage.type === 14) || (raw.protocolMessage && raw.protocolMessage.type === 14)) {
    return { isMention: true, groupJid: m.key.remoteJid }
  }

  // 3. Status broadcast - person post status wey mention group
  // In this case, the status message itself get group mention inside contextInfo
  if (m.key.remoteJid === 'status@broadcast') {
    const ctx = msg.extendedTextMessage?.contextInfo || msg.imageMessage?.contextInfo || msg.videoMessage?.contextInfo || {}
    // If status get group mention, WhatsApp dey put am for mentionedJid / groupMentions
    const groupMentions = ctx.groupMentions || ctx.groupMention || []
    if (groupMentions.length > 0) {
      for (const gm of groupMentions) {
        const gj = gm.groupJid || gm.jid
        if (gj && getChat(gj).enabled) return { isMention: true, groupJid: gj, fromStatus: true }
      }
    }
    // Fallback: text inside status wey talk about group
    const txt = (msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || '').toLowerCase()
    if (txt.includes('mentioned') && txt.includes('group')) return { isMention: true, groupJid: null, fromStatus: true }
    return { isMention: false, groupJid: null }
  }

  // 4. Normal group message - system text
  const text = (msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || '').toLowerCase()
  if (
    text.includes('mentioned this group in their status') ||
    text.includes('mentioned the group in their status') ||
    text.includes('mentioned this group in status') ||
    text.includes('tagged this group in their status') ||
    text.includes('mentioned this group') ||
    text.includes('mentioned the group') ||
    text.includes('mentioned your group')
  ) {
    return { isMention: true, groupJid: m.key.remoteJid }
  }

  return { isMention: false, groupJid: null }
}

async function doKick(sock, groupJid, sender) {
  if (!groupJid || !groupJid.endsWith('@g.us')) return
  if (!getChat(groupJid).enabled) return
  if (!sender) return
  const meta = await getMeta(sock, groupJid)
  if (!meta) return
  if (isAdmin(meta, sender) || isOwner(sender)) return
  const botIsAdmin = isAdmin(meta, sock.user.id) || (sock.user.lid && isAdmin(meta, sock.user.lid))
  if (!botIsAdmin) {
    console.log('[ANTI STATUS MENTION] Bot no be admin for', groupJid)
    return
  }
  console.log(`[ANTI STATUS MENTION] Kicking ${normId(sender)} from ${groupJid}`)
  await sock.groupParticipantsUpdate(groupJid, [sender], 'remove').catch(e => console.log('[KICK FAIL]', e.message))
}

function attachEngine(sock) {
  if (!sock || !sock.ev) return
  if (sock.__antigcstatusmentionLoaded) return
  sock.__antigcstatusmentionLoaded = true

  // FIX: No filter type === 'notify' again. Listen to ALL types.
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const m of messages) {
      try {
        if (m.key.fromMe) continue
        if (!m.message) continue

        const { isMention, groupJid } = checkStatusMention(m)
        if (!isMention) continue

        // Case A: Mention came inside the group itself
        if (groupJid && groupJid.endsWith('@g.us')) {
          const sender = m.key.participant || m.key.remoteJid
          await doKick(sock, groupJid, sender)
          continue
        }

        // Case B: Mention came via status@broadcast - sender na the status owner
        // We need to check ALL groups wey this person dey, but we use groupJid if we get am
        // If we no get groupJid, check all enabled groups for this sender
        if (m.key.remoteJid === 'status@broadcast' && !groupJid) {
          const sender = m.key.participant || m.key.remoteJid
          const db = loadDB()
          for (const gj of Object.keys(db)) {
            if (db[gj]?.enabled) await doKick(sock, gj, sender)
          }
          continue
        }

        // Case C: Mention came but groupJid na the group itself
        const sender = m.key.participant || m.key.remoteJid
        const jid = m.key.remoteJid
        if (jid.endsWith('@g.us')) await doKick(sock, jid, sender)

      } catch (e) { console.log('[ANTI GC STATUS MENTION]', e.message) }
    }
  })

  // Also listen to messages.update - some status mentions dey come as update
  sock.ev.on('messages.update', async (updates) => {
    for (const up of updates) {
      try {
        if (!up.key) continue
        // If update na groupStatus, treat as mention
        if (up.update?.status === 14 || up.update?.message) {
          const jid = up.key.remoteJid
          if (jid && jid.endsWith('@g.us') && getChat(jid).enabled) {
            const sender = up.key.participant || up.key.remoteJid
            await doKick(sock, jid, sender)
          }
        }
      } catch {}
    }
  })

  console.log('[ANTI GC STATUS MENTION] Fixed engine loaded ✅ - No more only react')
}

module.exports = {
  name: 'antigcstatusmention',
  alias: ['antistatusmention', 'statusmention'],
  command: ['antigcstatusmention', 'antistatusmention', 'statusmention'],
  category: 'group',
  desc: 'Silently kick members who mention group in Status',
  attachEngine,
  __call: attachEngine,

  execute: async (sock, m, { text, args }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const input = (text || args?.join(' ') || '').toLowerCase().trim()

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { text: '❌ Only works in groups' }, { quoted: m })
      return
    }
    const meta = await getMeta(sock, jid)
    if (!isAdmin(meta, sender) && !isOwner(sender)) {
      await sock.sendMessage(jid, { text: '❌ Only admin can use this' }, { quoted: m })
      return
    }
    const chat = getChat(jid)
    if (!input) {
      await sock.sendMessage(jid, { text: `🛡️ Anti Group Status Mention: ${chat.enabled ? 'ON ✅' : 'OFF ❌'}\nMode: SILENT KICK 🤫\n\n.antigcstatusmention on\n.antigcstatusmention off` }, { quoted: m })
      return
    }
    if (input === 'on' || input === 'off') {
      setChat(jid, { enabled: input === 'on' })
      await sock.sendMessage(jid, { text: `🛡️ Anti Status Mention ${input === 'on' ? 'ENABLED ✅ (Silent Kick)' : 'DISABLED ❌'}` }, { quoted: m })
    } else {
      await sock.sendMessage(jid, { text: 'Use: .antigcstatusmention on / off' }, { quoted: m })
    }
  }
  }
