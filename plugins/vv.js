// 👁️ SIMON MD - VIEW ONCE BYPASS - REAL HANDLER
const fs = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { tiny, box, line, reactAwait, reactCmd, reactDone } = require('../utils/style')

const DB_PATH = path.join(__dirname, '../database/auto.json')
function getAuto(){
  try{ return JSON.parse(fs.readFileSync(DB_PATH)) }catch{ return { autovv: true } }
}
function saveAuto(d){
  if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), {recursive:true})
  fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2))
  global.simonDB = global.simonDB || {}
  global.simonDB.auto = { ...(global.simonDB.auto||{}), ...d }
}

// REAL ENGINE - auto open VV when someone send am
function attachEngine(sock){
  if(sock.__vvEngineLoaded) return
  sock.__vvEngineLoaded = true
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if(type !== 'notify') return
    const auto = getAuto()
    if(!auto.autovv) return
    for(let m of messages){
      try{
        if(m.key.fromMe) continue
        const found = findVV(m.message)
        if(!found) continue
        const jid = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid
        const buf = await downloadVV(found)
        if(!buf) continue
        // Real: send back to same chat + owner
        if(found.type === 'imageMessage') await sock.sendMessage(jid, { image: buf, caption: tiny(`View Once Auto Opened\nFrom: @${sender.split('@')[0]}`), mentions:[sender] }).catch(()=>{})
        if(found.type === 'videoMessage') await sock.sendMessage(jid, { video: buf, caption: tiny(`View Once Video Auto Opened\nFrom: @${sender.split('@')[0]}`), mentions:[sender] }).catch(()=>{})
        if(found.type === 'audioMessage') await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: true }).catch(()=>{})
      }catch(e){ console.log('[AUTO VV]', e.message) }
    }
  })
  console.log('[VV] Real auto VV engine loaded')
}

// Find VV inside any wrapper - ephemeral, viewOnce, viewOnceV2, etc - REAL
function findVV(message){
  if(!message) return null
  // Direct
  if(message.viewOnceMessage) return { type: Object.keys(message.viewOnceMessage.message)[0], media: message.viewOnceMessage.message[Object.keys(message.viewOnceMessage.message)[0]], msg: message.viewOnceMessage.message }
  if(message.viewOnceMessageV2) return { type: Object.keys(message.viewOnceMessageV2.message)[0], media: message.viewOnceMessageV2.message[Object.keys(message.viewOnceMessageV2.message)[0]], msg: message.viewOnceMessageV2.message }
  if(message.viewOnceMessageV2Extension) return { type: Object.keys(message.viewOnceMessageV2Extension.message)[0], media: message.viewOnceMessageV2Extension.message[Object.keys(message.viewOnceMessageV2Extension.message)[0]], msg: message.viewOnceMessageV2Extension.message }
  // Inside ephemeral
  if(message.ephemeralMessage) return findVV(message.ephemeralMessage.message)
  // Direct media with viewOnce flag
  if(message.imageMessage?.viewOnce) return { type: 'imageMessage', media: message.imageMessage, msg: message }
  if(message.videoMessage?.viewOnce) return { type: 'videoMessage', media: message.videoMessage, msg: message }
  if(message.audioMessage?.viewOnce) return { type: 'audioMessage', media: message.audioMessage, msg: message }
  return null
}

async function downloadVV(found){
  try{
    const stream = await downloadContentFromMessage(found.media, found.type.replace('Message',''))
    let buf = Buffer.from([])
    for await (const chunk of stream){ buf = Buffer.concat([buf, chunk]) }
    return buf.length ? buf : null
  }catch(e){ console.log('[VV DOWNLOAD]', e.message); return null }
}

module.exports = {
  command: ['vv','viewonce','vv2','vv3','vvimage','vvvideo','vvaudio','vvall','autovv','antiviewonce'],

  attachEngine,

  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    await reactAwait(sock, jid, m.key) // ⏳
    global.simonDB = global.simonDB || { auto: getAuto() }
    if(!global.simonDB.auto) global.simonDB.auto = getAuto()

    const treply = async (title, lines) => {
      const txt = box(title, Array.isArray(lines) ? lines : [lines])
      await sock.sendMessage(jid, { text: txt }, { quoted: m })
      await reactCmd(sock, jid, m.key, command)
      await reactDone(sock, jid, m.key) // 💀
    }

    try {
      // Toggle Auto VV - REAL SAVE TO FILE
      if (['autovv','antiviewonce'].includes(command)) {
        if (!text) {
          await treply('Auto VV', [line('status', global.simonDB.auto.autovv ? 'ON' : 'OFF'), line('usage', '.autovv on/off'), line('info', 'When ON, view-once auto open')])
          return
        }
        global.simonDB.auto.autovv = text === 'on'
        saveAuto(global.simonDB.auto)
        await treply('Auto VV', [line('status', text === 'on' ? 'ENABLED' : 'DISABLED')])
        return
      }

      if (command === 'vvall') {
        await treply('View Once Commands', [
          line('vv', 'Open view-once'),
          line('vv2', 'Open + save info'),
          line('vv3', 'Open + send to owner'),
          line('vvimage', 'Extract image only'),
          line('vvvideo', 'Extract video only'),
          line('vvaudio', 'Extract audio only'),
          line('autovv', 'Auto bypass on/off'),
        ])
        return
      }

      // Find view-once media - quoted or direct
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      let found = null
      if (quoted) found = findVV(quoted)
      if (!found) found = findVV(m.message)
      // Also check quoted inside ephemeral
      if (!found && quoted?.ephemeralMessage) found = findVV(quoted.ephemeralMessage.message)

      if (!found) {
        await treply('View Once Bypass', [line('info', 'Reply to a view-once image/video/voice with .vv')])
        return
      }

      const type = found.type
      const media = found.media

      // Real download first - NO DEMO
      const buf = await downloadVV(found)
      if (!buf) {
        await treply('View Once', [line('error', 'Failed to download - message expired or already opened')])
        return
      }

      const owner = '239166265317@s.whatsapp.net'

      // Basic .vv - REAL
      if (command === 'vv' || command === 'viewonce') {
        if (type === 'imageMessage') {
          await sock.sendMessage(jid, { image: buf, caption: box('View Once Opened', [line('type', 'image')]) }, { quoted: m })
        } else if (type === 'videoMessage') {
          await sock.sendMessage(jid, { video: buf, caption: box('View Once Opened', [line('type', 'video')]) }, { quoted: m })
        } else if (type === 'audioMessage') {
          await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
        } else {
          await sock.sendMessage(jid, { text: tiny('View-once bypassed - unsupported type') }, { quoted: m })
        }
        await reactCmd(sock, jid, m.key, 'vv')
        await reactDone(sock, jid, m.key)
        return
      }

      // .vv2 - REAL + save info
      if (command === 'vv2') {
        if (type === 'imageMessage') {
          await sock.sendMessage(jid, { image: buf, caption: box('VV2 Saved', [line('status', 'ViewOnce bypassed'), line('saved', 'yes')]) }, { quoted: m })
        } else if (type === 'videoMessage') {
          await sock.sendMessage(jid, { video: buf, caption: box('VV2 Saved', [line('status', 'Video saved')]) }, { quoted: m })
        } else if (type === 'audioMessage') {
          await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
        }
        await reactCmd(sock, jid, m.key, 'vv2')
        await reactDone(sock, jid, m.key)
        return
      }

      // .vv3 - also send to owner - REAL
      if (command === 'vv3') {
        if (type === 'imageMessage') {
          await sock.sendMessage(owner, { image: buf, caption: tiny(`VV3 from ${jid}`) }).catch(()=>{})
          await sock.sendMessage(jid, { image: buf, caption: box('VV3', [line('info', 'Also sent to owner')]) }, { quoted: m })
        } else if (type === 'videoMessage') {
          await sock.sendMessage(owner, { video: buf, caption: tiny(`VV3 video from ${jid}`) }).catch(()=>{})
          await sock.sendMessage(jid, { video: buf, caption: box('VV3', [line('info', 'Also sent to owner')]) }, { quoted: m })
        } else if (type === 'audioMessage') {
          await sock.sendMessage(owner, { audio: buf, mimetype: 'audio/mp4', ptt: true }).catch(()=>{})
          await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
        }
        await reactCmd(sock, jid, m.key, 'vv3')
        await reactDone(sock, jid, m.key)
        return
      }

      // Specific extractors - REAL
      if (command === 'vvimage') {
        if (type !== 'imageMessage') { await treply('VV Image', [line('error', 'This is not an image view-once')]); return }
        await sock.sendMessage(jid, { image: buf, caption: box('Image Extracted', [line('status', 'done')]) }, { quoted: m })
        await reactCmd(sock, jid, m.key, command)
        await reactDone(sock, jid, m.key)
        return
      }

      if (command === 'vvvideo') {
        if (type !== 'videoMessage') { await treply('VV Video', [line('error', 'This is not a video view-once')]); return }
        await sock.sendMessage(jid, { video: buf, caption: box('Video Extracted', [line('status', 'done')]) }, { quoted: m })
        await reactCmd(sock, jid, m.key, command)
        await reactDone(sock, jid, m.key)
        return
      }

      if (command === 'vvaudio') {
        if (type !== 'audioMessage') { await treply('VV Audio', [line('error', 'This is not an audio view-once')]); return }
        await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
        await reactCmd(sock, jid, m.key, command)
        await reactDone(sock, jid, m.key)
        return
      }

    } catch (e) {
      await sock.sendMessage(jid, { text: box('VV Error', [line('error', e.message), line('info', 'Reply to a view-once message')]) }, { quoted: m })
      await reactDone(sock, jid, m.key)
    }
  }
          }
