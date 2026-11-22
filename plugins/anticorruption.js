// 🛡️ SIMON MD - Anti Corruption | FIXED - LID + Delete + Kick + Warns
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
function cleanId(id = '') { return String(id).split(':')[0] }

// FIXED: Check JID + LID + participantAlt
function isAdmin(meta, m, sender) {
  if (!meta?.participants || !sender) return false
  const myIds = [normId(sender)]
  if (m?.key?.participant) myIds.push(normId(m.key.participant))
  if (m?.key?.participantAlt) myIds.push(normId(m.key.participantAlt))
  if (m?.participant) myIds.push(normId(m.participant))
  if (m?.participantAlt) myIds.push(normId(m.participantAlt))
  for (const p of meta.participants) {
    const pIds = [p.id, p.lid, p.jid].filter(Boolean).map(x => normId(x))
    if (pIds.some(id => myIds.includes(id))) return !!(p.admin === 'admin' || p.admin === 'superadmin')
  }
  return false
}
// FIXED: Owner check with participantAlt
function isOwner(m, sender) {
  const candidates = [normId(sender)]
  if (m?.key?.participantAlt) candidates.push(normId(m.key.participantAlt))
  if (m?.participantAlt) candidates.push(normId(m.participantAlt))
  if (m?.key?.participant) candidates.push(normId(m.key.participant))
  return candidates.includes('239166265317')
}
// FIXED: LID -> Real JID
function resolveJid(participants, sender) {
  if (!sender) return null
  const target = normId(sender)
  for (const p of participants || []) {
    if (normId(p.id) === target || normId(p.lid || '') === target || normId(p.jid || '') === target) return cleanId(p.id)
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
    if (type !== 'notify' && type !== 'append') return
    for (const m of messages) {
      try {
        const jid = m.key.remoteJid
        if (!jid || !jid.endsWith('@g.us')) continue
        if (m.key.fromMe) continue
        const chat = getChat(jid)
        if (!chat.enabled) continue
        const sender = m.key.participant || m.participant || m.key.remoteJid
        if (!sender) continue
        const msg = m.message
        if (!msg) continue

        const text = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || msg.stickerMessage?.caption || ''

        if (text.startsWith('.') || text.startsWith('!') || text.startsWith('/')) continue
        if (!isNSFWContent(text)) continue

        const meta = await getMeta(sock, jid)
        if (!meta) continue
        if (isAdmin(meta, m, sender) || isOwner(m, sender)) continue
        const botIsAdmin = isAdmin(meta, m, sock.user.id) || isAdmin(meta, m, sock.user.lid)
        if (!botIsAdmin) continue

        // FIXED: Delete + Kick with real JID, warns keyed by real JID
        const realJid = resolveJid(meta.participants, sender)
        await sock.sendMessage(jid, { delete: { remoteJid: jid, fromMe: false, id: m.key.id, participant: realJid } }).catch(() => {})

        const warns = addWarn(jid, realJid)
        const max = chat.maxWarn || 3

        if (warns >= max) {
          await sock.sendMessage(jid, { text: `🚨 @${realJid.split('@')[0]} reached ${max} corruption warnings → Kicked`, mentions: [realJid] }).catch(() => {})
          await sock.groupParticipantsUpdate(jid, [realJid], 'remove').catch(() => {})
          resetWarn(jid, realJid)
        } else {
          await sock.sendMessage(jid, { text: `⚠️ *Anti Corruption*\nUser: @${realJid.split('@')[0]}\nReason: NSFW / Nude content\nWarns: ${warns}/${max}`, mentions: [realJid] }).catch(() => {})
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

  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participantAlt || m.key.participant || m.participant || jid
    const input = (text || args?.join(' ') || '').trim()
    const cmd = (command || '').toLowerCase()

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { text: '❌ Only works in groups' }, { quoted: m })
      return
    }

    const meta = await getMeta(sock, jid)
    const senderAdmin = isAdmin(meta, m, sender)
    const owner = isOwner(m, sender)
    if (!senderAdmin && !owner) {
      await sock.sendMessage(jid, { text: '❌ Only admin can use this' }, { quoted: m })
      return
    }

    const chat = getChat(jid)

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

    if (cmd === 'corruptionwarns') {
      const rawUser = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || sender
      const user = resolveJid(meta?.participants, rawUser)
      const warns = getWarns(jid, user)
      await sock.sendMessage(jid, { text: `⚠️ Corruption Warns\nUser: @${user.split('@')[0]}\nWarns: ${warns}/${chat.maxWarn}`, mentions: [user] }, { quoted: m })
      return
    }

    if (cmd === 'resetcorruption') {
      const rawUser = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
      if (!rawUser) {
        await sock.sendMessage(jid, { text: '❌ Tag or reply the user\nUsage: .resetcorruption @user' }, { quoted: m })
        return
      }
      const user = resolveJid(meta?.participants, rawUser)
      resetWarn(jid, user)
      await sock.sendMessage(jid, { text: `✅ Warns cleared for @${user.split('@')[0]}`, mentions: [user] }, { quoted: m })
      return
    }
  }
          }
