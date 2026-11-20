// 🛡️ SIMON MD - Anti Group Status Mention (Silent Kick)
const fs = require('fs')
const path = require('path')

let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { box, line, reactAwait, reactCmd, reactDone } = style

const DB_PATH = path.join(__dirname, '../database/antigcstatusmention.json')

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

function normId(id = '') {
  return String(id).split(':')[0].split('@')[0]
}

function isAdmin(meta, id) {
  if (!meta?.participants) return false
  const base = normId(id)
  const p = meta.participants.find(x =>
    normId(x.id) === base || normId(x.lid || '') === base
  )
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
  } catch {
    return null
  }
}

function attachEngine(sock) {
  if (sock.__antigcstatusmentionLoaded) return
  sock.__antigcstatusmentionLoaded = true

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const m of messages) {
      try {
        const jid = m.key.remoteJid
        if (!jid || !jid.endsWith('@g.us')) continue
        if (m.key.fromMe) continue

        const chat = getChat(jid)
        if (!chat.enabled) continue

        const msg = m.message
        if (!msg) continue

        const text = (msg.conversation ||
          msg.extendedTextMessage?.text ||
          msg.imageMessage?.caption ||
          msg.videoMessage?.caption || '').toLowerCase()

        // Detect status mention of the group
        const isStatusMention =
          text.includes('mentioned this group in their status') ||
          text.includes('mentioned the group in their status') ||
          text.includes('mentioned this group in status') ||
          text.includes('tagged this group in their status') ||
          text.includes('mentioned this group') ||
          (msg.protocolMessage && msg.protocolMessage.type === 14)

        if (!isStatusMention) continue

        const sender = m.key.participant || m.key.remoteJid
        if (!sender) continue

        const meta = await getMeta(sock, jid)
        if (!meta) continue

        const senderIsAdmin = isAdmin(meta, sender)
        const botIsAdmin = isAdmin(meta, sock.user.id) ||
          (sock.user.lid && isAdmin(meta, sock.user.lid))

        let isOwner = false
        try {
          const ow = require('./owner')
          if (ow.isRealOwner) isOwner = ow.isRealOwner(sender, sock)
        } catch {}

        // Skip admins and owner
        if (senderIsAdmin || isOwner) continue
        if (!botIsAdmin) continue

        // Silent kick
        await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {})

      } catch (e) {
        console.log('[ANTI GC STATUS MENTION]', e.message)
      }
    }
  })

  console.log('[ANTI GC STATUS MENTION] Silent engine loaded')
}

module.exports = {
  command: ['antigcstatusmention', 'antistatusmention', 'statusmention'],
  attachEngine,

  execute: async (sock, m, { command, text }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid

    try { await reactAwait(sock, jid, m.key) } catch {}

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, {
        text: box('Anti Status Mention', [line('error', 'Only works in groups')])
      }, { quoted: m })
      return
    }

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
        text: box('Anti Group Status Mention', [
          line('status', chat.enabled ? 'ON ✅' : 'OFF ❌'),
          line('mode', 'SILENT KICK'),
          line('usage', '.antigcstatusmention on / off'),
          line('info', 'Silently kicks members who mention this group in their Status')
        ])
      }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    const arg = text.toLowerCase().trim()

    if (arg === 'on' || arg === 'off') {
      setChat(jid, { enabled: arg === 'on' })
      await sock.sendMessage(jid, {
        text: box('Anti Status Mention', [
          line('status', arg === 'on' ? 'ENABLED ✅ (Silent Kick)' : 'DISABLED ❌')
        ])
      }, { quoted: m })
    } else {
      await sock.sendMessage(jid, {
        text: box('Anti Status Mention', [
          line('error', 'Use: .antigcstatusmention on / off')
        ])
      }, { quoted: m })
    }

    try { await reactCmd(sock, jid, m.key, command) } catch {}
    try { await reactDone(sock, jid, m.key) } catch {}
  }
  }
