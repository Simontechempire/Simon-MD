// 🛡️ SIMON MD - Anti Corruption | Made for connection.js - NO EDIT NEEDED
// Detects nude images, videos, stickers & adult group links
// Delete + Warn → Kick on max warns
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../database/anticorruption.json')

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH)) } catch { return { chats: {}, warnings: {} } }
}
function saveDB(data) {
  if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}
function getChat(jid) {
  const db = loadDB()
  if (!db.chats[jid]) { db.chats[jid] = { enabled: false, maxWarn: 3 }; saveDB(db) }
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
  if (db.warnings[jid]) { delete db.warnings[jid][user]; saveDB(db) }
}
function normId(id = '') { return String(id).split(':')[0].split('@')[0] }
function isAdmin(meta, id) {
  if (!meta?.participants) return false
  const base = normId(id)
  const p = meta.participants.find(x => normId(x.id) === base || normId(x.lid || '') === base)
  return !!(p?.admin === 'admin' || p?.admin === 'superadmin')
}
function isOwner(sender) {
  return normId(sender) === '239166265317'
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

const NSFW_KEYWORDS = [
  'nude', 'nudes', 'naked', 'sex', 'porn', 'xxx', 'onlyfans', 'nsfw',
  'pussy', 'dick', 'cock', 'boobs', 'tits', 'asshole', 'hentai',
  'blowjob', 'cum', 'sperm', 'fuck', 'fucking', 'horny', 'slut',
  'whore', 'milf', 'teen sex', 'leak', 'leaked'
]
const ADULT_LINK_REGEX = /(chat\.whatsapp\.com\/[A-Za-z0-9]+|onlyfans\.com|pornhub\.com|xvideos\.com|xnxx\.com|redtube\.com|xhamster\.com|spankbang\.com|nhentai\.net|hanime\.tv)/i

function isNSFWContent(text = '') {
  const lower = text.toLowerCase()
  if (ADULT_LINK_REGEX.test(text)) return true
  for (const word of NSFW_KEYWORDS) {
    if (lower.includes(word)) return true
  }
  return false
}

function attachEngine(sock) {
  if (!sock || !sock.ev) return
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

        const text = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || msg.stickerMessage?.caption || ''

        // Skip commands so admin fit turn am off
        if (text.startsWith('.') || text.startsWith('!') || text.startsWith('/')) continue

        if (!isNSFWContent(text)) continue

        const meta = await getMeta(sock, jid)
        if (!meta) continue
        if (isAdmin(meta, sender) || isOwner(sender)) continue
        const botIsAdmin = isAdmin(meta, sock.user.id) || (sock.user.lid && isAdmin(meta, sock.user.lid))
        if (!botIsAdmin) continue

        // DELETE
        await sock.sendMessage(jid, { delete: m.key }).catch(() => {})

        // WARN
        const warns = addWarn(jid, sender)
        const max = chat.maxWarn || 3

        if (warns >= max) {
          await sock.sendMessage(jid, { text: `🚨 @${normId(sender)} reached ${max} corruption warnings → Kicked`, mentions: [sender] }).catch(() => {})
          await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {})
          resetWarn(jid, sender)
        } else {
          await sock.sendMessage(jid, { text: `⚠️ *Anti Corruption*\nUser: @${normId(sender)}\nReason: NSFW / Nude content\nWarns: ${warns}/${max}`, mentions: [sender] }).catch(() => {})
        }
      } catch (e) { console.log('[ANTI CORRUPTION]', e.message) }
    }
  })
  console.log('[ANTI CORRUPTION] Engine loaded ✅')
}

module.exports = {
  name: 'anticorruption',
  alias: ['antinudes', 'antinude', 'nsfw', 'setcorruptionwarn', 'corruptionwarns', 'resetcorruption'],
  command: ['anticorruption', 'antinudes', 'antinude', 'nsfw', 'setcorruptionwarn', 'corruptionwarns', 'resetcorruption'],
  category: 'group',
  desc: 'Delete NSFW + Warn -> Kick',
  attachEngine,
  __call: attachEngine,

  // connection.js go call am like execute(sock, m, {command, text, args})
  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const input = (text || args?.join(' ') || '').trim()
    const cmd = (command || '').toLowerCase()

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { text: '❌ Only works in groups' }, { quoted: m })
      return
    }

    const meta = await getMeta(sock, jid)
    const senderAdmin = isAdmin(meta, sender)
    const owner = isOwner(sender)
    if (!senderAdmin && !owner) {
      await sock.sendMessage(jid, { text: '❌ Only admin can use this' }, { quoted: m })
      return
    }

    const chat = getChat(jid)

    // Toggle
    if (['anticorruption', 'antinudes', 'antinude', 'nsfw'].includes(cmd)) {
      if (!input) {
        await sock.sendMessage(jid, { text: `🛡️ Anti Corruption: ${chat.enabled ? 'ON ✅' : 'OFF ❌'}\nMax Warn: ${chat.maxWarn}\n\n.anticorruption on / off\n.setcorruptionwarn 3\n.corruptionwarns\n.resetcorruption @user` }, { quoted: m })
        return
      }
      const arg = input.toLowerCase()
      if (arg === 'on' || arg === 'off') {
        setChat(jid, { enabled: arg === 'on' })
        await sock.sendMessage(jid, { text: `🛡️ Anti Corruption ${arg === 'on' ? 'ENABLED ✅' : 'DISABLED ❌'}` }, { quoted: m })
      } else {
        await sock.sendMessage(jid, { text: 'Use: .anticorruption on / off' }, { quoted: m })
      }
      return
    }

    // Set max warn
    if (cmd === 'setcorruptionwarn') {
      const num = parseInt(input)
      if (isNaN(num) || num < 1) {
        await sock.sendMessage(jid, { text: `Current max warn: ${chat.maxWarn}\nUsage: .setcorruptionwarn 3` }, { quoted: m })
        return
      }
      setChat(jid, { maxWarn: num })
      await sock.sendMessage(jid, { text: `✅ Max warn set to ${num}` }, { quoted: m })
      return
    }

    // Check warns
    if (cmd === 'corruptionwarns') {
      const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || sender
      const warns = getWarns(jid, user)
      await sock.sendMessage(jid, { text: `⚠️ Corruption Warns\nUser: @${normId(user)}\nWarns: ${warns}/${chat.maxWarn}`, mentions: [user] }, { quoted: m })
      return
    }

    // Reset warns
    if (cmd === 'resetcorruption') {
      const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
      if (!user) {
        await sock.sendMessage(jid, { text: '❌ Tag or reply the user\nUsage: .resetcorruption @user' }, { quoted: m })
        return
      }
      resetWarn(jid, user)
      await sock.sendMessage(jid, { text: `✅ Warns cleared for @${normId(user)}`, mentions: [user] }, { quoted: m })
      return
    }
  }
      }
