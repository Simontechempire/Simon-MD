// 🛡️ SIMON MD - Anti Group Status (Delete non-admin Group Status instantly)
const fs = require('fs')
const path = require('path')

let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

const DB_PATH = path.join(__dirname, '../database/antigcstatus.json')

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH))
  } catch {
    return {}
  }
}

function saveDB(data) {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

function getChat(jid) {
  const db = loadDB()
  if (!db[jid]) {
    db[jid] = { enabled: false }
    saveDB(db)
  }
  return db[jid]
}

function setChat(jid, data) {
  const db = loadDB()
  db[jid] = { ...getChat(jid), ...data }
  saveDB(db)
}

function normId(id) {
  return String(id || '').split(':')[0].split('@')[0]
}

function isAdmin(meta, id) {
  if (!meta?.participants) return false
  const base = normId(id)
  const p = meta.participants.find(x => normId(x.id) === base || normId(x.lid || '') === base)
  return !!(p?.admin === 'admin' || p?.admin === 'superadmin')
}

// Cache groupMetadata 30 seconds
const metaCache = new Map()
async function getMeta(sock, jid) {
  const now = Date.now()
  const cached = metaCache.get(jid)
  if (cached && now - cached.t < 30000) return cached.meta
  try {
    const meta = await sock.groupMetadata(jid)
    metaCache.set(jid, { meta, t: now })
    return meta
  } catch {
    return null
  }
}

function attachEngine(sock) {
  if (sock.__antigcstatusEngineLoaded) return
  sock.__antigcstatusEngineLoaded = true

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const m of messages) {
      try {
        const jid = m.key.remoteJid
        if (!jid || !jid.endsWith('@g.us')) continue          // only groups
        if (m.key.fromMe) continue

        const chat = getChat(jid)
        if (!chat.enabled) continue

        const sender = m.key.participant || m.key.remoteJid
        if (!sender) continue

        // Check if this message is a Group Status type
        // WhatsApp Group Status usually comes with these signs:
        const msg = m.message
        if (!msg) continue

        const isGroupStatus =
          msg.groupStatusMessage ||
          msg.protocolMessage?.type === 25 ||               // some versions use this
          msg.ephemeralMessage?.message?.groupStatusMessage ||
          (msg.extendedTextMessage?.contextInfo?.isGroupStatus) ||
          (msg.imageMessage?.contextInfo?.isGroupStatus) ||
          (msg.videoMessage?.contextInfo?.isGroupStatus)

        // Fallback detection (common pattern)
        const hasStatusContext =
          msg.extendedTextMessage?.contextInfo?.externalAdReply?.sourceUrl?.includes('status') ||
          msg.imageMessage?.contextInfo?.externalAdReply?.sourceUrl?.includes('status') ||
          msg.videoMessage?.contextInfo?.externalAdReply?.sourceUrl?.includes('status')

        if (!isGroupStatus && !hasStatusContext) continue

        // Now check admin
        const meta = await getMeta(sock, jid)
        if (!meta) continue

        const senderIsAdmin = isAdmin(meta, sender)
        const botIsAdmin = isAdmin(meta, sock.user.id) || (sock.user.lid && isAdmin(meta, sock.user.lid))

        // Owner check
        let isOwner = false
        try {
          const ow = require('./owner')
          if (ow.isRealOwner) isOwner = ow.isRealOwner(sender, sock)
        } catch {}

        if (senderIsAdmin || isOwner) continue
        if (!botIsAdmin) continue

        // DELETE instantly
        await sock.sendMessage(jid, { delete: m.key }).catch(() => {})

        // Optional warning (you can remove this if you want silent delete)
        await sock.sendMessage(jid, {
          text: tiny(`@${normId(sender)} Group Status from non-admin was deleted.`),
          mentions: [sender]
        }).catch(() => {})

      } catch (e) {
        console.log('[ANTI GC STATUS]', e.message)
      }
    }
  })

  console.log('[ANTI GC STATUS] Engine loaded')
}

module.exports = {
  command: ['antigcstatus', 'antigroupstatus', 'gcstatus'],
  attachEngine,

  execute: async (sock, m, { command, text }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid

    try { await reactAwait(sock, jid, m.key) } catch {}

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { text: box('Anti GC Status', [line('error', 'This command only works in groups')]) }, { quoted: m })
      return
    }

    // Admin / Owner check
    let senderAdmin = false
    let isOwner = false
    try {
      const meta = await getMeta(sock, jid)
      senderAdmin = isAdmin(meta, sender)
      try {
        const ow = require('./owner')
        if (ow.isRealOwner) isOwner = ow.isRealOwner(sender, sock)
      } catch {}
    } catch {}

    if (!senderAdmin && !isOwner) {
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    const chat = getChat(jid)

    if (!text) {
      await sock.sendMessage(jid, {
        text: box('Anti GC Status', [
          line('status', chat.enabled ? 'ON ✅' : 'OFF ❌'),
          line('usage', '.antigcstatus on / off'),
          line('info', 'Deletes Group Status posted by non-admins instantly')
        ])
      }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    if (text !== 'on' && text !== 'off') {
      await sock.sendMessage(jid, {
        text: box('Anti GC Status', [line('error', 'Use: .antigcstatus on  or  .antigcstatus off')])
      }, { quoted: m })
      return
    }

    setChat(jid, { enabled: text === 'on' })

    await sock.sendMessage(jid, {
      text: box('Anti GC Status', [
        line('status', text === 'on' ? 'ENABLED ✅' : 'DISABLED ❌')
      ])
    }, { quoted: m })

    try { await reactCmd(sock, jid, m.key, command) } catch {}
    try { await reactDone(sock, jid, m.key) } catch {}
  }
  }
