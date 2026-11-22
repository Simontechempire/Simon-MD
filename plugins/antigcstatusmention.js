// 🛡️ SIMON MD - Anti Group Status Mention (Silent Kick) | FIXED - LID Kick Fix
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
function cleanId(id = '') { return String(id).split(':')[0] }
function isOwner(sender) { return normId(sender) === '239166265317' }

// FIXED: Check JID + LID + participantAlt
function isAdmin(meta, m, sender) {
  if (!meta?.participants || !sender) return false
  const myIds = []
  if (sender) myIds.push(normId(sender))
  if (m?.key?.participant) myIds.push(normId(m.key.participant))
  if (m?.key?.participantAlt) myIds.push(normId(m.key.participantAlt))
  if (m?.participant) myIds.push(normId(m.participant))
  if (m?.participantAlt) myIds.push(normId(m.participantAlt))
  for (const p of meta.participants) {
    const pIds = [p.id, p.lid, p.jid].filter(Boolean).map(x => normId(x))
    if (pIds.some(id => myIds.includes(id))) {
      if (p.admin === 'admin' || p.admin === 'superadmin') return true
    }
  }
  return false
}

// FIXED: Convert LID to real JID for kicking
function resolveJid(participants, sender) {
  if (!sender) return null
  const target = normId(sender)
  for (const p of participants) {
    if (normId(p.id) === target || normId(p.lid || '') === target || normId(p.jid || '') === target) {
      return cleanId(p.id)
    }
  }
  return cleanId(sender)
}

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

function checkStatusMention(m) {
  const raw = m.message
  if (!raw) return { isMention: false, groupJid: null }
  const msg = unwrap(raw) || {}

  // 1. Direct groupStatusMessage types
  if (msg.groupStatusMessage || msg.groupStatusMessageV2 || msg.statusMentionMessage || raw.groupStatusMessage || raw.groupStatusMessageV2) {
    const g = msg.groupStatusMessage?.groupJid || msg.groupStatusMessageV2?.groupJid || msg.statusMentionMessage?.groupJid || raw.groupStatusMessage?.groupJid || m.key.remoteJid
    return { isMention: true, groupJid: g }
  }

  // 2. Protocol type 14 = status / group status
  if ((msg.protocolMessage && msg.protocolMessage.type === 14) || (raw.protocolMessage && raw.protocolMessage.type === 14)) {
    return { isMention: true, groupJid: m.key.remoteJid }
  }

  // 3. Status broadcast with group mention in contextInfo
  if (m.key.remoteJid === 'status@broadcast') {
    const ctx = msg.extendedTextMessage?.contextInfo || msg.imageMessage?.contextInfo || msg.videoMessage?.contextInfo || {}
    const groupMentions = ctx.groupMentions || ctx.groupMention || []
    if (groupMentions.length > 0) {
      for (const gm of groupMentions) {
        const gj = gm.groupJid || gm.jid
        if (gj && getChat(gj).enabled) return { isMention: true, groupJid: gj, fromStatus: true }
      }
      // If status mentions a group but we don't know which, return first one
      if (groupMentions.length > 0) {
        const gj = groupMentions[0].groupJid || groupMentions[0].jid
        if (gj) return { isMention: true, groupJid: gj, fromStatus: true }
      }
    }
    return { isMention: false, groupJid: null }
  }

  // 4. System message inside group
  const text = (msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || '').toLowerCase()
  if (
    text.includes('mentioned this group in their status') ||
    text.includes('mentioned the group in their status') ||
    text.includes('mentioned this group in status') ||
    text.includes('tagged this group in their status') ||
    text.includes('mentioned this group') ||
    text.includes('mentioned the group')
  ) {
    return { isMention: true, groupJid: m.key.remoteJid }
  }

  return { isMention: false, groupJid: null }
}

async function doKick(sock, groupJid, m, sender) {
  if (!groupJid || !groupJid.endsWith('@g.us')) return
  if (!getChat(groupJid).enabled) return
  if (!sender) return
  const meta = await getMeta(sock, groupJid)
  if (!meta) return
  if (isAdmin(meta, m, sender) || isOwner(sender)) return
  const botIsAdmin = isAdmin(meta, m, sock.user.id) || isAdmin(meta, m, sock.user.lid)
  if (!botIsAdmin) {
    console.log('[ANTI STATUS MENTION] Bot no be admin for', groupJid)
    return
  }
  // FIXED: Kick with real JID, not LID
  const realJid = resolveJid(meta.participants, sender)
  console.log(`[ANTI STATUS MENTION] Kicking ${realJid} from ${groupJid}`)
  await sock.groupParticipantsUpdate(groupJid, [realJid], 'remove').catch(e => console.log('[KICK FAIL]', e.message))
}

function attachEngine(sock) {
  if (!sock || !sock.ev) return
  if (sock.__antigcstatusmentionLoaded) return
  sock.__antigcstatusmentionLoaded = true

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const m of messages) {
      try {
        if (m.key.fromMe) continue
        if (!m.message) continue

        const { isMention, groupJid } = checkStatusMention(m)
        if (!isMention) continue

        // Case A: Mention came inside the group itself
        if (groupJid && groupJid.endsWith('@g.us')) {
          const sender = m.key.participant || m.key.participantAlt || m.participant || m.key.remoteJid
          await doKick(sock, groupJid, m, sender)
          continue
        }

        // Case B: Mention came via status - ONLY kick from the mentioned group, NOT all groups
        if (m.key.remoteJid === 'status@broadcast' && groupJid) {
          const sender = m.key.participant || m.key.participantAlt || m.participant || m.key.remoteJid
          await doKick(sock, groupJid, m, sender)
          continue
        }

      } catch (e) { console.log('[ANTI GC STATUS MENTION]', e.message) }
    }
  })

  console.log('[ANTI GC STATUS MENTION] Fixed engine loaded ✅')
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
    const sender = m.key.participant || m.participant || jid
    const input = (text || args?.join(' ') || '').toLowerCase().trim()

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { text: '❌ Only works in groups' }, { quoted: m })
      return
    }
    const meta = await getMeta(sock, jid)
    if (!isAdmin(meta, m, sender) && !isOwner(sender)) {
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
