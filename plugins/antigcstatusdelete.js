// 🛡️ SIMON MD - Anti GC Status | Made for connection.js - FIXED LID + Delete
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../database/antigcstatus.json')

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
function normId(id) { return String(id || '').split(':')[0].split('@')[0] }
function cleanId(id) { return String(id || '').split(':')[0] }
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

// FIXED: Convert LID to real JID before delete
function resolveJid(participants, quotedParticipant) {
  if (!quotedParticipant) return null
  const target = normId(quotedParticipant)
  for (const p of participants) {
    if (normId(p.id) === target || normId(p.lid || '') === target || normId(p.jid || '') === target) {
      return cleanId(p.id)
    }
  }
  return cleanId(quotedParticipant)
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

function attachEngine(sock) {
  if (!sock || !sock.ev) return
  if (sock.__antigcstatusEngineLoaded) return
  sock.__antigcstatusEngineLoaded = true

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return
    for (const m of messages) {
      try {
        const jid = m.key?.remoteJid
        if (!jid || !jid.endsWith('@g.us')) continue
        if (m.key.fromMe) continue
        if (!m.message) continue

        // Skip commands so admin fit turn am off
        const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ""
        if (text.startsWith('.') || text.startsWith('!') || text.startsWith('/')) continue

        if (!getChat(jid).enabled) continue

        const sender = m.key.participant || m.participant || m.key.remoteJid
        if (!sender) continue

        const meta = await getMeta(sock, jid)
        if (!meta) continue

        // FIXED: Don't delete admin / owner messages
        if (isAdmin(meta, m, sender)) continue
        if (isOwner(sender) || normId(m.key.participantAlt || '') === '239166265317') continue

        const botIsAdmin = isAdmin(meta, m, sock.user.id) || isAdmin(meta, m, sock.user.lid)
        if (!botIsAdmin) continue

        // FIXED DELETE: Use real JID, not LID, not m.key directly
        const realJid = resolveJid(meta.participants, sender)
        await sock.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: false,
            id: m.key.id,
            participant: realJid
          }
        }).catch(() => {})
      } catch {}
    }
  })
  console.log('[ANTI GC STATUS] Engine loaded ✅')
}

module.exports = {
  name: 'antigcstatus',
  alias: ['antigroupstatus', 'gcstatus'],
  command: ['antigcstatus', 'antigroupstatus', 'gcstatus'],
  category: 'group',
  desc: 'Delete all messages from non-admins',
  attachEngine,
  __call: attachEngine,

  execute: async (sock, m, { text, args }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const input = (text || args?.join(' ') || '').toLowerCase().trim()

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { text: '❌ This command only works in groups' }, { quoted: m })
      return
    }

    const meta = await getMeta(sock, jid)
    if (!isAdmin(meta, m, sender) && !isOwner(sender)) {
      await sock.sendMessage(jid, { text: '❌ Only admin can use this' }, { quoted: m })
      return
    }

    const chat = getChat(jid)

    if (!input) {
      await sock.sendMessage(jid, { text: `🛡️ Anti GC Status: ${chat.enabled ? 'ON ✅' : 'OFF ❌'}\n\n.antigcstatus on - Only admins can post\n.antigcstatus off - Allow everybody` }, { quoted: m })
      return
    }

    if (input !== 'on' && input !== 'off') {
      await sock.sendMessage(jid, { text: 'Use: .antigcstatus on  or  .antigcstatus off' }, { quoted: m })
      return
    }

    setChat(jid, { enabled: input === 'on' })
    await sock.sendMessage(jid, { text: `🛡️ Anti GC Status ${input === 'on' ? 'ENABLED ✅\nOnly admins can post now' : 'DISABLED ❌\nEverybody can post now'}` }, { quoted: m })
  }
                             }
