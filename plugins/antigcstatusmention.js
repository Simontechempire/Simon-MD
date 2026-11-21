// 🛡️ SIMON MD - Anti Group Status Mention (Silent Kick) | Made for connection.js - NO EDIT NEEDED
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

// Unwrap ephemeral / viewOnce / edited etc
function unwrap(msg) {
  if (!msg) return null
  if (msg.ephemeralMessage) return unwrap(msg.ephemeralMessage.message)
  if (msg.viewOnceMessage) return unwrap(msg.viewOnceMessage.message)
  if (msg.viewOnceMessageV2) return unwrap(msg.viewOnceMessageV2.message)
  if (msg.documentWithCaptionMessage) return unwrap(msg.documentWithCaptionMessage.message)
  return msg
}

function isStatusMention(m) {
  const raw = m.message
  if (!raw) return false
  const msg = unwrap(raw)
  if (!msg) return false

  // 1. Real WhatsApp status mention types - Baileys
  if (msg.groupStatusMessage) return true
  if (msg.groupStatusMessageV2) return true
  if (msg.statusMentionMessage) return true
  if (raw.groupStatusMessage) return true
  if (raw.groupStatusMessageV2) return true

  // 2. Protocol message type 14 = status mention / group status
  if (msg.protocolMessage && msg.protocolMessage.type === 14) return true
  if (raw.protocolMessage && raw.protocolMessage.type === 14) return true

  // 3. Text fallback - WhatsApp sometimes send as system text
  const text = (msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || '').toLowerCase()
  if (
    text.includes('mentioned this group in their status') ||
    text.includes('mentioned the group in their status') ||
    text.includes('mentioned this group in status') ||
    text.includes('tagged this group in their status') ||
    text.includes('mentioned this group') ||
    text.includes('mentioned the group') ||
    text.includes('status mention') ||
    text.includes('mentioned your group')
  ) return true

  return false
}

function attachEngine(sock) {
  if (!sock || !sock.ev) return
  if (sock.__antigcstatusmentionLoaded) return
  sock.__antigcstatusmentionLoaded = true

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const m of messages) {
      try {
        const jid = m.key.remoteJid
        if (!jid || !jid.endsWith('@g.us')) continue
        if (m.key.fromMe) continue
        if (!getChat(jid).enabled) continue
        if (!m.message) continue
        if (!isStatusMention(m)) continue

        const sender = m.key.participant || m.key.remoteJid
        if (!sender) continue

        const meta = await getMeta(sock, jid)
        if (!meta) continue
        if (isAdmin(meta, sender) || isOwner(sender)) continue

        const botIsAdmin = isAdmin(meta, sock.user.id) || (sock.user.lid && isAdmin(meta, sock.user.lid))
        if (!botIsAdmin) continue

        // SILENT KICK - no message, no warn
        await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {})
        console.log(`[ANTI GC STATUS MENTION] Silent kicked ${normId(sender)} in ${jid}`)
      } catch (e) { console.log('[ANTI GC STATUS MENTION]', e.message) }
    }
  })
  console.log('[ANTI GC STATUS MENTION] Silent engine loaded ✅')
}

module.exports = {
  name: 'antigcstatusmention',
  alias: ['antistatusmention', 'statusmention'],
  command: ['antigcstatusmention', 'antistatusmention', 'statusmention'],
  category: 'group',
  desc: 'Silently kick members who mention group in Status',
  attachEngine,
  __call: attachEngine,

  // connection.js go call am like execute(sock, m, {command, text, args})
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
      await sock.sendMessage(jid, { text: `🛡️ Anti Group Status Mention: ${chat.enabled ? 'ON ✅' : 'OFF ❌'}\nMode: SILENT KICK 🤫\n\n.antigcstatusmention on - Kick anybody wey mention group for Status\n.antigcstatusmention off - Allow am` }, { quoted: m })
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
