// 👁️ SIMON MD - VIEW ONCE BYPASS - REAL HANDLER
const fs = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

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

function getOriginalByStanzaId(stanzaId){
  try{
    if(!stanzaId) return null
    const saved = global.db?.messages?.[stanzaId]
    if(saved?.message) return saved.message
    if(saved?.m?.message) return saved.m.message
    return null
  }catch{ return null }
}

function attachEngine(sock){
  if(sock.__vvEngineLoaded) return
  sock.__vvEngineLoaded = true
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if(type !== 'notify') return
    const auto = getAuto()
    if(auto.autovv === false && global.db?.settings?.autovv !== true) return
    for(let m of messages){
      try{
        if(m.key.fromMe) continue
        const found = findVV(m.message)
        if(!found) continue
        const jid = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid
        const buf = await downloadVV(found)
        if(!buf) continue
        if(found.type === 'imageMessage') await sock.sendMessage(jid, { image: buf, caption: tiny(`View Once Auto Opened\nFrom: @${sender.split('@')[0]}`), mentions:[sender] }).catch(()=>{})
        if(found.type === 'videoMessage') await sock.sendMessage(jid, { video: buf, caption: tiny(`View Once Video Auto Opened\nFrom: @${sender.split('@')[0]}`), mentions:[sender] }).catch(()=>{})
        if(found.type === 'audioMessage') await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: true }).catch(()=>{})
      }catch(e){ console.log('[AUTO VV]', e.message) }
    }
  })
  console.log('[VV] Real auto VV engine loaded')
}

function findVV(message){
  if(!message) return null
  if(message.viewOnceMessage){
    const inner = message.viewOnceMessage.message
    if(inner) return { type: Object.keys(inner)[0], media: inner[Object.keys(inner)[0]], msg: inner }
  }
  if(message.viewOnceMessageV2){
    const inner = message.viewOnceMessageV2.message
    if(inner){
      if(inner.ephemeralMessage) return findVV(inner.ephemeralMessage.message)
      return { type: Object.keys(inner)[0], media: inner[Object.keys(inner)[0]], msg: inner }
    }
  }
  if(message.viewOnceMessageV2Extension){
    const inner = message.viewOnceMessageV2Extension.message
    if(inner){
      if(inner.ephemeralMessage) return findVV(inner.ephemeralMessage.message)
      const k = Object.keys(inner)[0]
      return { type: k, media: inner[k], msg: inner }
    }
  }
  if(message.ephemeralMessage) return findVV(message.ephemeralMessage.message)
  if(message.imageMessage?.viewOnce) return { type: 'imageMessage', media: message.imageMessage, msg: message }
  if(message.videoMessage?.viewOnce) return { type: 'videoMessage', media: message.videoMessage, msg: message }
  if(message.audioMessage?.viewOnce) return { type: 'audioMessage', media: message.audioMessage, msg: message }
  if(message.imageMessage) return { type: 'imageMessage', media: message.imageMessage, msg: message }
  if(message.videoMessage) return { type: 'videoMessage', media: message.videoMessage, msg: message }
  if(message.audioMessage) return { type: 'audioMessage', media: message.audioMessage, msg: message }
  return null
}

async function downloadVV(found){
  try{
    if(!found?.media?.mediaKey && !found?.media?.directPath) return null
    const dlType = found.type.replace('Message','')
    const stream = await downloadContentFromMessage(found.media, dlType)
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
    try{ await reactAwait(sock, jid, m.key) }catch{}
    global.simonDB = global.simonDB || { auto: getAuto() }
    if(!global.simonDB.auto) global.simonDB.auto = getAuto()
    const treply = async (title, lines) => {
      const txt = box(title, Array.isArray(lines) ? lines : [lines])
      await sock.sendMessage(jid, { text: txt }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if (['autovv','antiviewonce'].includes(command)) {
        if (!text) {
          await treply('Auto VV', [line('status', global.simonDB.auto.autovv ? 'ON' : 'OFF'), line('usage', '.autovv on/off'), line('info', 'When ON, view-once auto open')])
          return
        }
        global.simonDB.auto.autovv = text === 'on'
        saveAuto(global.simonDB.auto)
        if(global.db?.settings) global.db.settings.autovv = text === 'on'
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
      const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || {}
      const quoted = ctx.quotedMessage
      const stanzaId = ctx.stanzaId
      let found = null
      if(stanzaId){
        const orig = getOriginalByStanzaId(stanzaId)
        if(orig) found = findVV(orig)
      }
      if (!found && quoted) found = findVV(quoted)
      if (!found) found = findVV(m.message)
      if (!found) {
        await treply('View Once Bypass', [line('info', 'Reply to a view-once image/video/voice with .vv')])
        return
      }
      const buf = await downloadVV(found)
      if (!buf) {
        await treply('View Once', [line('error', 'Failed download - VV don expire or bot no cache am. Send VV again, then .vv quick, or use .autovv on')])
        return
      }
      const owner = '239166265317@s.whatsapp.net'
      const is = (t) => found.type === t
      if (command === 'vv' || command === 'viewonce') {
        if (is('imageMessage')) await sock.sendMessage(jid, { image: buf, caption: box('View Once Opened', [line('type', 'image')]) }, { quoted: m })
        else if (is('videoMessage')) await sock.sendMessage(jid, { video: buf, caption: box('View Once Opened', [line('type', 'video')]) }, { quoted: m })
        else if (is('audioMessage')) await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
        else await sock.sendMessage(jid, { text: tiny('View-once bypassed - unsupported type') }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, 'vv') }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if (command === 'vv2') {
        if (is('imageMessage')) await sock.sendMessage(jid, { image: buf, caption: box('VV2 Saved', [line('status', 'ViewOnce bypassed'), line('saved', 'yes')]) }, { quoted: m })
        else if (is('videoMessage')) await sock.sendMessage(jid, { video: buf, caption: box('VV2 Saved', [line('status', 'Video saved')]) }, { quoted: m })
        else if (is('audioMessage')) await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, 'vv2') }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if (command === 'vv3') {
        if (is('imageMessage')) {
          await sock.sendMessage(owner, { image: buf, caption: tiny(`VV3 from ${jid}`) }).catch(()=>{})
          await sock.sendMessage(jid, { image: buf, caption: box('VV3', [line('info', 'Also sent to owner')]) }, { quoted: m })
        } else if (is('videoMessage')) {
          await sock.sendMessage(owner, { video: buf, caption: tiny(`VV3 video from ${jid}`) }).catch(()=>{})
          await sock.sendMessage(jid, { video: buf, caption: box('VV3', [line('info', 'Also sent to owner')]) }, { quoted: m })
        } else if (is('audioMessage')) {
          await sock.sendMessage(owner, { audio: buf, mimetype: 'audio/mp4', ptt: true }).catch(()=>{})
          await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
        }
        try{ await reactCmd(sock, jid, m.key, 'vv3') }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if (command === 'vvimage') {
        if (!is('imageMessage')) { await treply('VV Image', [line('error', 'This is not an image view-once')]); return }
        await sock.sendMessage(jid, { image: buf, caption: box('Image Extracted', [line('status', 'done')]) }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if (command === 'vvvideo') {
        if (!is('videoMessage')) { await treply('VV Video', [line('error', 'This is not a video view-once')]); return }
        await sock.sendMessage(jid, { video: buf, caption: box('Video Extracted', [line('status', 'done')]) }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if (command === 'vvaudio') {
        if (!is('audioMessage')) { await treply('VV Audio', [line('error', 'This is not an audio view-once')]); return }
        await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
    } catch (e) {
      await sock.sendMessage(jid, { text: box('VV Error', [line('error', e.message), line('info', 'Reply to a view-once message')]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
     }
