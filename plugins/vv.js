// 👁️ SIMON MD - View Once Bypass | Made for connection.js - NO EDIT NEEDED - FIXED Image/Video/Voice
const fs = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const DB_PATH = path.join(__dirname, '../database/auto.json')
function getAuto() { try { return JSON.parse(fs.readFileSync(DB_PATH)) } catch { return { autovv: true } } }
function saveAuto(d) {
  if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2))
  global.simonDB = global.simonDB || {}
  global.simonDB.auto = { ...(global.simonDB.auto || {}), ...d }
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

// Find VV in ANY wrapper - image / video / audio / sticker / document
function findVV(message, depth = 0) {
  if (!message || depth > 8) return null

  // 1. Direct wrappers
  if (message.viewOnceMessage?.message) {
    const r = findVV(message.viewOnceMessage.message, depth + 1)
    if (r) return r
  }
  if (message.viewOnceMessageV2?.message) {
    const r = findVV(message.viewOnceMessageV2.message, depth + 1)
    if (r) return r
  }
  if (message.viewOnceMessageV2Extension?.message) {
    const r = findVV(message.viewOnceMessageV2Extension.message, depth + 1)
    if (r) return r
  }
  if (message.ephemeralMessage?.message) {
    const r = findVV(message.ephemeralMessage.message, depth + 1)
    if (r) return r
  }
  if (message.documentWithCaptionMessage?.message) {
    const r = findVV(message.documentWithCaptionMessage.message, depth + 1)
    if (r) return r
  }
  if (message.editedMessage?.message) {
    const r = findVV(message.editedMessage.message, depth + 1)
    if (r) return r
  }

  // 2. Direct media with viewOnce flag OR normal media inside VV wrapper
  // After unwrap, we land here with { imageMessage: {...} } etc
  for (const type of ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']) {
    if (message[type]) {
      // If we came from a VV wrapper, OR it has viewOnce=true, accept it
      // For manual .vv, user replies to VV, so quotedMessage already IS the VV - we accept any media here
      return { type, media: message[type], raw: message }
    }
  }
  return null
}

async function downloadVV(found) {
  try {
    if (!found?.media) return null
    const typeMap = { imageMessage: 'image', videoMessage: 'video', audioMessage: 'audio', stickerMessage: 'sticker', documentMessage: 'document' }
    const dlType = typeMap[found.type] || 'image'
    const stream = await downloadContentFromMessage(found.media, dlType)
    let buf = Buffer.from([])
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk])
    return buf.length ? buf : null
  } catch (e) { console.log('[VV DOWNLOAD]', e.message); return null }
}

function attachEngine(sock) {
  if (!sock || !sock.ev) return
  if (sock.__vvEngineLoaded) return
  sock.__vvEngineLoaded = true

  // FIX 1: No type !== 'notify' filter. Listen to ALL types.
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const auto = getAuto()
    if (auto.autovv === false) return
    for (const m of messages) {
      try {
        if (m.key.fromMe) continue
        if (!m.message) continue
        const found = findVV(m.message)
        if (!found) continue
        const jid = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid
        const buf = await downloadVV(found)
        if (!buf) continue
        const cap = `👁️ View Once Auto Opened\nFrom: @${String(sender).split('@')[0]}`
        if (found.type === 'imageMessage') await sock.sendMessage(jid, { image: buf, caption: cap, mentions: [sender] }).catch(() => {})
        else if (found.type === 'videoMessage') await sock.sendMessage(jid, { video: buf, caption: cap, mentions: [sender] }).catch(() => {})
        else if (found.type === 'audioMessage') await sock.sendMessage(jid, { audio: buf, mimetype: found.media.mimetype || 'audio/ogg; codecs=opus', ptt: !!found.media.ptt }).catch(() => {})
        else if (found.type === 'stickerMessage') await sock.sendMessage(jid, { sticker: buf }).catch(() => {})
        else if (found.type === 'documentMessage') await sock.sendMessage(jid, { document: buf, fileName: found.media.fileName || 'file', mimetype: found.media.mimetype || 'application/octet-stream', caption: cap }).catch(() => {})
      } catch (e) { console.log('[AUTO VV]', e.message) }
    }
  })
  console.log('[VV] Auto View Once engine loaded ✅')
}

const COMMANDS = ['vv', 'viewonce', 'vv2', 'vv3', 'vvimage', 'vvvideo', 'vvaudio', 'vvall', 'autovv', 'antiviewonce']

module.exports = {
  name: 'vv',
  alias: COMMANDS,
  command: COMMANDS,
  category: 'tools',
  desc: 'View Once bypass - image / video / voice',
  attachEngine,
  __call: attachEngine,

  // connection.js go call am like execute(sock, m, {command, text, args})
  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    const input = (text || args?.join(' ') || '').trim().toLowerCase()
    const cmd = (command || '').toLowerCase()
    const reply = async (txt) => { await sock.sendMessage(jid, { text: txt }, { quoted: m }) }
    global.simonDB = global.simonDB || { auto: getAuto() }
    if (!global.simonDB.auto) global.simonDB.auto = getAuto()

    try {
      if (['autovv', 'antiviewonce'].includes(cmd)) {
        if (!input) return reply(`👁️ Auto VV: ${global.simonDB.auto.autovv !== false ? 'ON ✅' : 'OFF ❌'}\nUsage: .autovv on / off\nWhen ON, View Once go open automatically`)
        const on = input === 'on'
        global.simonDB.auto.autovv = on; saveAuto(global.simonDB.auto)
        return reply(`👁️ Auto VV: ${on ? 'ENABLED ✅' : 'DISABLED ❌'}`)
      }

      if (cmd === 'vvall') return reply(`👁️ *View Once Commands*\n.vv - Reply to View Once to open\n.vv2 - Open + extra info\n.vv3 - Open + send to owner\n.vvimage - Force image\n.vvvideo - Force video\n.vvaudio - Force voice\n.autovv on/off - Auto open`)

      // MANUAL VV - must reply to VV message
      const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || {}
      const quoted = ctx.quotedMessage

      let found = null
      // 1. Quoted first - this is the normal way: reply .vv to VV
      if (quoted) found = findVV(quoted)
      // 2. Current message itself (if user forward VV + type .vv for same message - rare)
      if (!found) found = findVV(m.message)

      if (!found) return reply('❌ No View Once found\n\nReply to a View Once image / video / voice with .vv\nOr turn on .autovv on so e go open automatically')

      const buf = await downloadVV(found)
      if (!buf) return reply('❌ View Once Failed - Media don expire or no cache\n\nSend the View Once again, then quickly reply with .vv\nOr enable .autovv on')

      const isImage = found.type === 'imageMessage'
      const isVideo = found.type === 'videoMessage'
      const isAudio = found.type === 'audioMessage'
      const owner = '239166265317@s.whatsapp.net'

      if (cmd === 'vv' || cmd === 'viewonce' || cmd === 'vv2') {
        if (isImage) await sock.sendMessage(jid, { image: buf, caption: '👁️ View Once Opened - Image' }, { quoted: m })
        else if (isVideo) await sock.sendMessage(jid, { video: buf, caption: '👁️ View Once Opened - Video' }, { quoted: m })
        else if (isAudio) await sock.sendMessage(jid, { audio: buf, mimetype: found.media.mimetype || 'audio/ogg; codecs=opus', ptt: !!found.media.ptt }, { quoted: m })
        else if (found.type === 'stickerMessage') await sock.sendMessage(jid, { sticker: buf }, { quoted: m })
        else if (found.type === 'documentMessage') await sock.sendMessage(jid, { document: buf, fileName: found.media.fileName || 'file', mimetype: found.media.mimetype || 'application/octet-stream' }, { quoted: m })
        else await reply('❌ Unsupported View Once type')
        return
      }

      if (cmd === 'vv3') {
        if (isImage) { await sock.sendMessage(owner, { image: buf, caption: `VV3 from ${jid}` }).catch(() => {}); await sock.sendMessage(jid, { image: buf, caption: '👁️ VV3 - Also sent to owner' }, { quoted: m }) }
        else if (isVideo) { await sock.sendMessage(owner, { video: buf, caption: `VV3 video from ${jid}` }).catch(() => {}); await sock.sendMessage(jid, { video: buf, caption: '👁️ VV3 - Also sent to owner' }, { quoted: m }) }
        else if (isAudio) { await sock.sendMessage(owner, { audio: buf, mimetype: found.media.mimetype || 'audio/ogg; codecs=opus', ptt: !!found.media.ptt }).catch(() => {}); await sock.sendMessage(jid, { audio: buf, mimetype: found.media.mimetype || 'audio/ogg; codecs=opus', ptt: !!found.media.ptt }, { quoted: m }) }
        return
      }

      if (cmd === 'vvimage') {
        if (!isImage) return reply('❌ This is not an image View Once')
        await sock.sendMessage(jid, { image: buf, caption: '👁️ Image Extracted' }, { quoted: m }); return
      }
      if (cmd === 'vvvideo') {
        if (!isVideo) return reply('❌ This is not a video View Once')
        await sock.sendMessage(jid, { video: buf, caption: '👁️ Video Extracted' }, { quoted: m }); return
      }
      if (cmd === 'vvaudio') {
        if (!isAudio) return reply('❌ This is not a voice View Once')
        await sock.sendMessage(jid, { audio: buf, mimetype: found.media.mimetype || 'audio/ogg; codecs=opus', ptt: !!found.media.ptt }, { quoted: m }); return
      }

    } catch (e) { await reply(`❌ VV Error: ${e.message}\nReply to a View Once message`) }
  }
          }
