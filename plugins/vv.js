// 👁️ SIMON MD - View Once Bypass (Clean + Fixed)
const fs = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

const DB_PATH = path.join(__dirname, '../database/auto.json')

function getAuto() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH))
  } catch {
    return { autovv: true }
  }
}

function saveAuto(d) {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2))
  global.simonDB = global.simonDB || {}
  global.simonDB.auto = { ...(global.simonDB.auto || {}), ...d }
}

function getOriginalByStanzaId(stanzaId) {
  try {
    if (!stanzaId) return null
    const saved = global.db?.messages?.[stanzaId]
    if (saved?.message) return saved.message
    if (saved?.m?.message) return saved.m.message
    return null
  } catch {
    return null
  }
}

// Strong recursive finder
function findVV(message, depth = 0) {
  if (!message || depth > 6) return null

  // Classic View Once
  if (message.viewOnceMessage?.message) {
    const inner = message.viewOnceMessage.message
    const type = Object.keys(inner)[0]
    return { type, media: inner[type], raw: inner }
  }

  // View Once V2
  if (message.viewOnceMessageV2?.message) {
    return findVV(message.viewOnceMessageV2.message, depth + 1)
  }

  // View Once V2 Extension
  if (message.viewOnceMessageV2Extension?.message) {
    return findVV(message.viewOnceMessageV2Extension.message, depth + 1)
  }

  // Ephemeral wrapper
  if (message.ephemeralMessage?.message) {
    return findVV(message.ephemeralMessage.message, depth + 1)
  }

  // Direct viewOnce flag on media
  if (message.imageMessage?.viewOnce) {
    return { type: 'imageMessage', media: message.imageMessage, raw: message }
  }
  if (message.videoMessage?.viewOnce) {
    return { type: 'videoMessage', media: message.videoMessage, raw: message }
  }
  if (message.audioMessage?.viewOnce) {
    return { type: 'audioMessage', media: message.audioMessage, raw: message }
  }

  return null
}

async function downloadVV(found) {
  try {
    if (!found?.media) return null

    // Prefer mediaKey / directPath
    if (!found.media.mediaKey && !found.media.directPath && !found.media.url) {
      return null
    }

    const typeMap = {
      imageMessage: 'image',
      videoMessage: 'video',
      audioMessage: 'audio',
      stickerMessage: 'sticker',
      documentMessage: 'document'
    }

    const dlType = typeMap[found.type] || found.type.replace('Message', '')

    const stream = await downloadContentFromMessage(found.media, dlType)
    let buf = Buffer.from([])
    for await (const chunk of stream) {
      buf = Buffer.concat([buf, chunk])
    }
    return buf.length ? buf : null
  } catch (e) {
    console.log('[VV DOWNLOAD]', e.message)
    return null
  }
}

function attachEngine(sock) {
  if (sock.__vvEngineLoaded) return
  sock.__vvEngineLoaded = true

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    const auto = getAuto()
    const enabled = auto.autovv !== false && (global.db?.settings?.autovv !== false)

    if (!enabled) return

    for (const m of messages) {
      try {
        if (m.key.fromMe) continue

        const found = findVV(m.message)
        if (!found) continue

        const jid = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid

        const buf = await downloadVV(found)
        if (!buf) continue

        const caption = tiny(`👁️ View Once Auto Opened\nFrom: @${sender.split('@')[0]}`)

        if (found.type === 'imageMessage') {
          await sock.sendMessage(jid, {
            image: buf,
            caption,
            mentions: [sender]
          }).catch(() => {})
        } else if (found.type === 'videoMessage') {
          await sock.sendMessage(jid, {
            video: buf,
            caption,
            mentions: [sender]
          }).catch(() => {})
        } else if (found.type === 'audioMessage') {
          await sock.sendMessage(jid, {
            audio: buf,
            mimetype: found.media.mimetype || 'audio/mp4',
            ptt: true
          }).catch(() => {})
        }
      } catch (e) {
        console.log('[AUTO VV]', e.message)
      }
    }
  })

  console.log('[VV] Auto View Once engine loaded')
}

module.exports = {
  command: [
    'vv', 'viewonce', 'vv2', 'vv3',
    'vvimage', 'vvvideo', 'vvaudio',
    'vvall', 'autovv', 'antiviewonce'
  ],
  attachEngine,

  execute: async (sock, m, { command, text }) => {
    const jid = m.key.remoteJid

    try { await reactAwait(sock, jid, m.key) } catch {}

    global.simonDB = global.simonDB || { auto: getAuto() }
    if (!global.simonDB.auto) global.simonDB.auto = getAuto()

    const treply = async (title, lines) => {
      await sock.sendMessage(jid, {
        text: box(title, Array.isArray(lines) ? lines : [lines])
      }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
    }

    try {
      // ===== AUTO VV TOGGLE =====
      if (['autovv', 'antiviewonce'].includes(command)) {
        if (!text) {
          return treply('Auto VV', [
            line('status', global.simonDB.auto.autovv ? 'ON ✅' : 'OFF ❌'),
            line('usage', '.autovv on / off'),
            line('info', 'When ON, View Once opens automatically')
          ])
        }

        const on = text.toLowerCase() === 'on'
        global.simonDB.auto.autovv = on
        saveAuto(global.simonDB.auto)
        if (global.db?.settings) global.db.settings.autovv = on

        return treply('Auto VV', [
          line('status', on ? 'ENABLED ✅' : 'DISABLED ❌')
        ])
      }

      // ===== HELP =====
      if (command === 'vvall') {
        return treply('View Once Commands', [
          line('vv', 'Open view-once'),
          line('vv2', 'Open + extra info'),
          line('vv3', 'Open + send to owner'),
          line('vvimage', 'Force image'),
          line('vvvideo', 'Force video'),
          line('vvaudio', 'Force audio'),
          line('autovv', 'Auto open on/off')
        ])
      }

      // ===== MANUAL VV =====
      const ctx = m.message?.extendedTextMessage?.contextInfo ||
        m.message?.imageMessage?.contextInfo ||
        m.message?.videoMessage?.contextInfo || {}

      const quoted = ctx.quotedMessage
      const stanzaId = ctx.stanzaId

      let found = null

      // 1. Try from saved original message (best chance)
      if (stanzaId) {
        const orig = getOriginalByStanzaId(stanzaId)
        if (orig) found = findVV(orig)
      }

      // 2. Try quoted message
      if (!found && quoted) found = findVV(quoted)

      // 3. Try current message
      if (!found) found = findVV(m.message)

      if (!found) {
        return treply('View Once', [
          line('info', 'Reply to a View Once image / video / voice'),
          line('tip', 'Or turn on .autovv on')
        ])
      }

      const buf = await downloadVV(found)

      if (!buf) {
        return treply('View Once Failed', [
          line('error', 'Media already expired or not cached'),
          line('tip1', 'Send the View Once again'),
          line('tip2', 'Then quickly reply with .vv'),
          line('tip3', 'Or enable .autovv on')
        ])
      }

      const owner = '239166265317@s.whatsapp.net'
      const isImage = found.type === 'imageMessage'
      const isVideo = found.type === 'videoMessage'
      const isAudio = found.type === 'audioMessage'

      // ===== .vv / .viewonce =====
      if (command === 'vv' || command === 'viewonce') {
        if (isImage) {
          await sock.sendMessage(jid, {
            image: buf,
            caption: box('View Once Opened', [line('type', 'Image')])
          }, { quoted: m })
        } else if (isVideo) {
          await sock.sendMessage(jid, {
            video: buf,
            caption: box('View Once Opened', [line('type', 'Video')])
          }, { quoted: m })
        } else if (isAudio) {
          await sock.sendMessage(jid, {
            audio: buf,
            mimetype: found.media.mimetype || 'audio/mp4',
            ptt: true
          }, { quoted: m })
        } else {
          await sock.sendMessage(jid, {
            text: tiny('Unsupported View Once type')
          }, { quoted: m })
        }
        try { await reactCmd(sock, jid, m.key, 'vv') } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

      // ===== .vv2 =====
      if (command === 'vv2') {
        if (isImage) {
          await sock.sendMessage(jid, {
            image: buf,
            caption: box('VV2', [line('status', 'Bypassed + Saved')])
          }, { quoted: m })
        } else if (isVideo) {
          await sock.sendMessage(jid, {
            video: buf,
            caption: box('VV2', [line('status', 'Video saved')])
          }, { quoted: m })
        } else if (isAudio) {
          await sock.sendMessage(jid, {
            audio: buf,
            mimetype: found.media.mimetype || 'audio/mp4',
            ptt: true
          }, { quoted: m })
        }
        try { await reactCmd(sock, jid, m.key, 'vv2') } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

      // ===== .vv3 (also send to owner) =====
      if (command === 'vv3') {
        if (isImage) {
          await sock.sendMessage(owner, {
            image: buf,
            caption: tiny(`VV3 from ${jid}`)
          }).catch(() => {})
          await sock.sendMessage(jid, {
            image: buf,
            caption: box('VV3', [line('info', 'Also sent to owner')])
          }, { quoted: m })
        } else if (isVideo) {
          await sock.sendMessage(owner, {
            video: buf,
            caption: tiny(`VV3 video from ${jid}`)
          }).catch(() => {})
          await sock.sendMessage(jid, {
            video: buf,
            caption: box('VV3', [line('info', 'Also sent to owner')])
          }, { quoted: m })
        } else if (isAudio) {
          await sock.sendMessage(owner, {
            audio: buf,
            mimetype: found.media.mimetype || 'audio/mp4',
            ptt: true
          }).catch(() => {})
          await sock.sendMessage(jid, {
            audio: buf,
            mimetype: found.media.mimetype || 'audio/mp4',
            ptt: true
          }, { quoted: m })
        }
        try { await reactCmd(sock, jid, m.key, 'vv3') } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

      // ===== Specific type commands =====
      if (command === 'vvimage') {
        if (!isImage) return treply('VV Image', [line('error', 'This is not an image View Once')])
        await sock.sendMessage(jid, {
          image: buf,
          caption: box('Image Extracted', [line('status', 'Done')])
        }, { quoted: m })
        try { await reactCmd(sock, jid, m.key, command) } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

      if (command === 'vvvideo') {
        if (!isVideo) return treply('VV Video', [line('error', 'This is not a video View Once')])
        await sock.sendMessage(jid, {
          video: buf,
          caption: box('Video Extracted', [line('status', 'Done')])
        }, { quoted: m })
        try { await reactCmd(sock, jid, m.key, command) } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

      if (command === 'vvaudio') {
        if (!isAudio) return treply('VV Audio', [line('error', 'This is not an audio View Once')])
        await sock.sendMessage(jid, {
          audio: buf,
          mimetype: found.media.mimetype || 'audio/mp4',
          ptt: true
        }, { quoted: m })
        try { await reactCmd(sock, jid, m.key, command) } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

    } catch (e) {
      await sock.sendMessage(jid, {
        text: box('VV Error', [
          line('error', e.message),
          line('tip', 'Reply to a View Once message')
        ])
      }, { quoted: m })
      try { await reactDone(sock, jid, m.key) } catch {}
    }
  }
    }
