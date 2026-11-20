// 🛡️ SIMON MD - Anti Corruption (Anti NSFW)
// Detects nude images, videos, stickers & adult group links
// Delete + Warn → Kick on max warns

const fs = require('fs')
const path = require('path')

let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

const DB_PATH = path.join(__dirname, '../database/anticorruption.json')

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH))
  } catch {
    return { chats: {}, warnings: {} }
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
  if (!db.chats[jid]) {
    db.chats[jid] = {
      enabled: false,
      maxWarn: 3
    }
    saveDB(db)
  }
  return db.chats[jid]
}

function setChat(jid, data) {
  const db = loadDB()
  db.chats[jid] = { ...getChat(jid), ...data }
  saveDB(db)
}

function getWarns(jid, user) {
  const db = loadDB()
  if (!db.warnings[jid]) db.warnings[jid] = {}
  return db.warnings[jid][user] || 0
}

function addWarn(jid, user) {
  const db = loadDB()
  if (!db.warnings[jid]) db.warnings[jid] = {}
  db.warnings[jid][user] = (db.warnings[jid][user] || 0) + 1
  saveDB(db)
  return db.warnings[jid][user]
}

function resetWarn(jid, user) {
  const db = loadDB()
  if (db.warnings[jid]) {
    delete db.warnings[jid][user]
    saveDB(db)
  }
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

// Simple NSFW / adult detection (keywords + links)
const NSFW_KEYWORDS = [
  'nude', 'nudes', 'naked', 'sex', 'porn', 'xxx', 'onlyfans', 'nsfw',
  'pussy', 'dick', 'cock', 'boobs', 'tits', 'asshole', 'hentai',
  'blowjob', 'cum', 'sperm', 'fuck', 'fucking', 'horny', 'slut',
  'whore', 'milf', 'teen sex', 'leak', 'leaked'
]

const ADULT_LINK_REGEX = /(chat\.whatsapp\.com\/[A-Za-z0-9]+|onlyfans\.com|pornhub\.com|xvideos\.com|xnxx\.com|redtube\.com|xhamster\.com|spankbang\.com|nhentai\.net|hanime\.tv)/i

function isNSFWContent(text = '', hasMedia = false) {
  const lower = text.toLowerCase()

  // Adult links
  if (ADULT_LINK_REGEX.test(text)) return true

  // Keywords
  for (const word of NSFW_KEYWORDS) {
    if (lower.includes(word)) return true
  }

  return false
}

function attachEngine(sock) {
  if (sock.__anticorruptionLoaded) return
  sock.__anticorruptionLoaded = true

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const m of messages) {
      try {
        const jid = m.key.remoteJid
        if (!jid || !jid.endsWith('@g.us')) continue
        if (m.key.fromMe) continue

        const chat = getChat(jid)
        if (!chat.enabled) continue

        const sender = m.key.participant || m.key.remoteJid
        if (!sender) continue

        const msg = m.message
        if (!msg) continue

        // Extract text
        const text = msg.conversation ||
          msg.extendedTextMessage?.text ||
          msg.imageMessage?.caption ||
          msg.videoMessage?.caption ||
          msg.stickerMessage?.caption || ''

        // Detect media types
        const isImage = !!msg.imageMessage
        const isVideo = !!msg.videoMessage
        const isSticker = !!msg.stickerMessage
        const hasMedia = isImage || isVideo || isSticker

        // Check if content is NSFW
        const nsfw = isNSFWContent(text, hasMedia)

        // Also treat pure stickers + images with no caption carefully
        // (You can later connect real AI detection here)
        if (!nsfw && !hasMedia) continue
        if (!nsfw && hasMedia && !text) {
          // Optional: you can enable strict mode later
          // For now we only act when keywords or adult links are present
          continue
        }

        if (!nsfw) continue

        // Admin / Owner check
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

        if (senderIsAdmin || isOwner) continue
        if (!botIsAdmin) continue

        // === DELETE ===
        await sock.sendMessage(jid, { delete: m.key }).catch(() => {})

        // === WARN ===
        const warns = addWarn(jid, sender)
        const max = chat.maxWarn || 3

        if (warns >= max) {
          // Final warn → Kick
          await sock.sendMessage(jid, {
            text: tiny(`@${normId(sender)} reached ${max} corruption warnings → Kicked`),
            mentions: [sender]
          }).catch(() => {})

          await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {})
          resetWarn(jid, sender)
        } else {
          // Normal warn
          await sock.sendMessage(jid, {
            text: box('Anti Corruption', [
              line('user', `@${normId(sender)}`),
              line('reason', 'NSFW / Nude content'),
              line('warns', `\( {warns}/ \){max}`)
            ]),
            mentions: [sender]
          }).catch(() => {})
        }

      } catch (e) {
        console.log('[ANTI CORRUPTION]', e.message)
      }
    }
  })

  console.log('[ANTI CORRUPTION] Engine loaded')
}

module.exports = {
  command: [
    'anticorruption', 'antinudes', 'antinude', 'nsfw',
    'setcorruptionwarn', 'corruptionwarns', 'resetcorruption'
  ],
  attachEngine,

  execute: async (sock, m, { command, text }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid

    try { await reactAwait(sock, jid, m.key) } catch {}

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, {
        text: box('Anti Corruption', [line('error', 'Only works in groups')])
      }, { quoted: m })
      return
    }

    // Admin check
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

    // Toggle
    if (['anticorruption', 'antinudes', 'antinude', 'nsfw'].includes(command)) {
      if (!text) {
        await sock.sendMessage(jid, {
          text: box('Anti Corruption', [
            line('status', chat.enabled ? 'ON ✅' : 'OFF ❌'),
            line('maxWarn', `${chat.maxWarn}`),
            line('usage', '.anticorruption on / off'),
            line('set', '.setcorruptionwarn 3'),
            line('info', 'Deletes nude images, videos, stickers & adult links')
          ])
        }, { quoted: m })
        try { await reactCmd(sock, jid, m.key, command) } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

      const arg = text.toLowerCase()
      if (arg === 'on' || arg === 'off') {
        setChat(jid, { enabled: arg === 'on' })
        await sock.sendMessage(jid, {
          text: box('Anti Corruption', [
            line('status', arg === 'on' ? 'ENABLED ✅' : 'DISABLED ❌')
          ])
        }, { quoted: m })
      } else {
        await sock.sendMessage(jid, {
          text: box('Anti Corruption', [line('error', 'Use on / off')])
        }, { quoted: m })
      }
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    // Set max warn
    if (command === 'setcorruptionwarn') {
      const num = parseInt(text)
      if (isNaN(num) || num < 1) {
        await sock.sendMessage(jid, {
          text: box('Set Warn', [
            line('current', `${chat.maxWarn}`),
            line('usage', '.setcorruptionwarn 3')
          ])
        }, { quoted: m })
        return
      }
      setChat(jid, { maxWarn: num })
      await sock.sendMessage(jid, {
        text: box('Set Warn', [line('maxWarn', `${num}`)])
      }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    // Check warns
    if (command === 'corruptionwarns') {
      const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        m.message?.extendedTextMessage?.contextInfo?.participant || sender
      const warns = getWarns(jid, user)
      await sock.sendMessage(jid, {
        text: box('Corruption Warns', [
          line('user', `@${normId(user)}`),
          line('warns', `\( {warns}/ \){chat.maxWarn}`)
        ]),
        mentions: [user]
      }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    // Reset warns
    if (command === 'resetcorruption') {
      const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        m.message?.extendedTextMessage?.contextInfo?.participant
      if (!user) {
        await sock.sendMessage(jid, {
          text: box('Reset', [line('error', 'Tag or reply the user')])
        }, { quoted: m })
        return
      }
      resetWarn(jid, user)
      await sock.sendMessage(jid, {
        text: box('Reset', [
          line('user', `@${normId(user)}`),
          line('status', 'Warns cleared')
        ]),
        mentions: [user]
      }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
    }
  }
    }
