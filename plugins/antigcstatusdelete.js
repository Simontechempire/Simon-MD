// 🛡️ SIMON MD - Anti GC Status | Delete ALL messages from non-admin
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

function isAdmin(meta, id) {
  if (!meta?.participants) return false
  const base = normId(id)
  const p = meta.participants.find(x => normId(x.id) === base || normId(x.lid || '') === base)
  return !!(p?.admin === 'admin' || p?.admin === 'superadmin')
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
  if (sock.__antigcstatusEngineLoaded) return
  sock.__antigcstatusEngineLoaded = true

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const m of messages) {
      try {
        const jid = m.key.remoteJid
        if (!jid || !jid.endsWith('@g.us')) continue
        if (m.key.fromMe) continue
        if (!m.message) continue

        // Skip bot commands - so admin can still use .antigcstatus off
        const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ""
        if (text.startsWith('.') || text.startsWith('!')) continue

        if (!getChat(jid).enabled) continue

        const sender = m.key.participant || m.key.remoteJid
        if (!sender) continue

        const meta = await getMeta(sock, jid)
        if (!meta) continue

        // If sender na admin, allow am
        if (isAdmin(meta, sender)) continue

        // If bot no be admin, e no fit delete
        const botIsAdmin = isAdmin(meta, sock.user.id) || (sock.user.lid && isAdmin(meta, sock.user.lid))
        if (!botIsAdmin) continue

        // DELETE ALL from non-admin instantly
        await sock.sendMessage(jid, { delete: m.key }).catch(() => {})

      } catch (e) { console.log('[ANTI GC STATUS]', e.message) }
    }
  })
  console.log('[ANTI GC STATUS] Engine loaded')
}

module.exports = {
  command: ['antigcstatus', 'antigroupstatus', 'gcstatus'],
  attachEngine,

  execute: async (sock, m, { text }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { text: '❌ This command only works in groups' }, { quoted: m })
      return
    }

    const meta = await getMeta(sock, jid)
    if (!isAdmin(meta, sender)) {
      await sock.sendMessage(jid, { text: '❌ Only admin can use this' }, { quoted: m })
      return
    }

    const chat = getChat(jid)

    if (!text) {
      await sock.sendMessage(jid, { text: `🛡️ Anti GC Status: ${chat.enabled ? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.antigcstatus on - Only admins can talk\n.antigcstatus off - Allow everybody` }, { quoted: m })
      return
    }

    if (text !== 'on' && text !== 'off') {
      await sock.sendMessage(jid, { text: 'Use: .antigcstatus on  or  .antigcstatus off' }, { quoted: m })
      return
    }

    setChat(jid, { enabled: text === 'on' })
    await sock.sendMessage(jid, { text: `🛡️ Anti GC Status ${text === 'on' ? 'ENABLED ✅\nOnly admins can post now' : 'DISABLED ❌\nEverybody can post now'}` }, { quoted: m })
  }
    }
