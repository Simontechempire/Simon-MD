// 🗑️ SIMON MD - ANTI GC STATUS DELETE - RESTORE DELETED STATUS - REAL - FIXED
const fs = require('fs')
const path = require('path')
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const DB_PATH = path.join(__dirname, '../database/antistatus.json')
const CACHE_DIR = path.join(__dirname, '../database/status_cache')

function loadCfg(){
  try{ return JSON.parse(fs.readFileSync(DB_PATH)) }catch{ return { antistatus: true, antigcstatusdelete: true, restoreTo: 'chat' } }
}
function saveCfg(d){
  if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), {recursive:true})
  fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2))
  global.simonDB = global.simonDB || {}
  global.simonDB.antistatus = d
  return d
}
function getCfg(){
  if(!global.simonDB?.antistatus) global.simonDB = { ...global.simonDB, antistatus: loadCfg() }
  return global.simonDB.antistatus
}
function ensureDir(){ if(!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, {recursive:true}) }
function safeFile(id){ return path.join(CACHE_DIR, String(id).replace(/[^a-zA-Z0-9_-]/g,'') + '.bin') }

async function downloadBuf(msg, type){
  try{
    const stream = await downloadContentFromMessage(msg, type)
    let buf = Buffer.from([])
    for await (const chunk of stream){ buf = Buffer.concat([buf, chunk]) }
    return buf.length ? buf : null
  }catch{ return null }
}

if(!global.statusCache) global.statusCache = new Map() // id -> entry
if(!global.lastDeletedStatus) global.lastDeletedStatus = new Map() // chat -> entry

async function cacheStatus(m){
  try{
    const jid = m.key.remoteJid
    if(!jid || !jid.endsWith('status@broadcast')) return
    if(m.key.fromMe) return
    const msg = m.message
    if(!msg || msg.protocolMessage) return
    const sender = m.key.participant || jid
    const text = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || ''
    let entry = { id: m.key.id, jid, sender, text, time: Date.now(), type: 'text', mediaPath: null, mimetype: null, caption: text }
    if(msg.imageMessage){
      entry.type = 'image'; entry.caption = msg.imageMessage.caption || ''
      const buf = await downloadBuf(msg.imageMessage, 'image')
      if(buf){ ensureDir(); const p = safeFile(m.key.id); fs.writeFileSync(p, buf); entry.mediaPath = p; entry.mimetype = msg.imageMessage.mimetype }
    } else if(msg.videoMessage){
      entry.type = 'video'; entry.caption = msg.videoMessage.caption || ''
      const buf = await downloadBuf(msg.videoMessage, 'video')
      if(buf){ ensureDir(); const p = safeFile(m.key.id); fs.writeFileSync(p, buf); entry.mediaPath = p; entry.mimetype = msg.videoMessage.mimetype }
    } else if(msg.audioMessage){
      entry.type = 'audio'
      const buf = await downloadBuf(msg.audioMessage, 'audio')
      if(buf){ ensureDir(); const p = safeFile(m.key.id); fs.writeFileSync(p, buf); entry.mediaPath = p; entry.mimetype = msg.audioMessage.mimetype }
    } else if(msg.stickerMessage){
      entry.type = 'sticker'
      const buf = await downloadBuf(msg.stickerMessage, 'sticker')
      if(buf){ ensureDir(); const p = safeFile(m.key.id); fs.writeFileSync(p, buf); entry.mediaPath = p }
    }
    global.statusCache.set(m.key.id, entry)
    if(global.statusCache.size > 200){
      const first = global.statusCache.keys().next().value
      const old = global.statusCache.get(first)
      if(old?.mediaPath) try{ fs.unlinkSync(old.mediaPath) }catch{}
      global.statusCache.delete(first)
    }
  }catch(e){ console.log('[ANTI STATUS CACHE]', e.message) }
}

async function restoreStatus(sock, targetJid, cached, deleter){
  const header = box('Anti Status Delete - Restored', [
    line('from', '@' + cached.sender.split('@')[0]),
    line('type', cached.type),
    line('time', new Date(cached.time).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos' })),
    line('text', cached.text || cached.caption || '(media status)')
  ])
  await sock.sendMessage(targetJid, { text: header, mentions: [cached.sender] }).catch(()=>{})
  try{
    if(cached.type === 'image' && cached.mediaPath && fs.existsSync(cached.mediaPath)){
      await sock.sendMessage(targetJid, { image: fs.readFileSync(cached.mediaPath), caption: tiny(cached.caption || 'Deleted status image restored') }).catch(()=>{})
    } else if(cached.type === 'video' && cached.mediaPath && fs.existsSync(cached.mediaPath)){
      await sock.sendMessage(targetJid, { video: fs.readFileSync(cached.mediaPath), caption: tiny(cached.caption || 'Deleted status video restored') }).catch(()=>{})
    } else if(cached.type === 'audio' && cached.mediaPath && fs.existsSync(cached.mediaPath)){
      await sock.sendMessage(targetJid, { audio: fs.readFileSync(cached.mediaPath), mimetype: cached.mimetype || 'audio/mp4', ptt: true }).catch(()=>{})
    } else if(cached.type === 'sticker' && cached.mediaPath && fs.existsSync(cached.mediaPath)){
      await sock.sendMessage(targetJid, { sticker: fs.readFileSync(cached.mediaPath) }).catch(()=>{})
    }
  }catch(e){ console.log('[ANTI STATUS RESTORE]', e.message) }
}

function attachEngine(sock){
  if(sock.__antigcstatusEngineLoaded) return
  sock.__antigcstatusEngineLoaded = true
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if(type !== 'notify') return
    const cfg = getCfg()
    for(let m of messages){
      try{
        const msg = m.message
        if(!msg) continue
        const proto = msg.protocolMessage
        // DELETE - type 0
        if(proto && proto.type === 0){
          if(!cfg.antistatus && !cfg.antigcstatusdelete) continue
          const deletedId = proto.key?.id
          const deleter = m.key.participant || m.key.remoteJid
          // Only handle if deleted ID na status we cache - else let antirestore handle group
          const cached = global.statusCache.get(deletedId)
          if(!cached) continue // not status, skip - antirestore go handle am
          // Save for .restorestatus
          global.lastDeletedStatus.set('status', cached)
          // FIX: restore to where? Bot DM / owner chat - status@broadcast no fit send message to.
          // We send to owner DM (first owner) + also to deleter DM if possible.
          // If you want am for group, use .restorestatus in group.
          let target = null
          try{
            const ow = require('./owner')
            if(ow.OWNER_NUMBERS) target = ow.OWNER_NUMBERS[0] + '@s.whatsapp.net'
            else if(ow.OWNER_NUMBER) target = ow.OWNER_NUMBER + '@s.whatsapp.net'
          }catch{}
          if(!target) target = deleter
          await restoreStatus(sock, target, cached, deleter)
          continue
        }
        // Normal status - cache am
        if(m.key.remoteJid?.endsWith('status@broadcast')) await cacheStatus(m)
      }catch(e){ console.log('[ANTI STATUS ENGINE]', e.message) }
    }
  })
  console.log('[ANTI GC STATUS DELETE] Engine loaded - restore deleted status')
}

module.exports = {
  command: ['antigcstatusdelete','antistatus','antistatusdelete','restorestatus','deletedstatus','laststatus','delstatus','deletestatus'],
  attachEngine,
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const cfg = getCfg()
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(['antigcstatusdelete','antistatus','antistatusdelete'].includes(command)){
        if(!text){ await treply('Anti Status Delete', [line('status', cfg.antistatus ? 'ON' : 'OFF'), line('usage', '.antistatus on/off'), line('info', 'Deleted status go restore to owner DM')]); return }
        cfg.antistatus = text === 'on'; cfg.antigcstatusdelete = text === 'on'; saveCfg(cfg)
        await treply('Anti Status Delete', [line('status', text === 'on' ? 'ENABLED' : 'DISABLED')]); return
      }
      if(['restorestatus','deletedstatus','laststatus'].includes(command)){
        const last = global.lastDeletedStatus?.get('status')
        if(!last){ await treply('Restore Status', [line('info', 'No deleted status yet')]); return }
        // Send last deleted status to THIS chat (group or DM) on demand
        await restoreStatus(sock, jid, last, last.sender)
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if(['delstatus','deletestatus'].includes(command)){
        // REAL: you can only delete YOUR OWN status, not person own.
        // Usage: .delstatus <status_id> OR reply your status? WhatsApp API: delete via protocolMessage
        // Baileys: sock.sendMessage(status@broadcast, { delete: { id, remoteJid: 'status@broadcast', fromMe: true } })
        // For now, explain + try if user give ID
        const statusId = text?.trim()
        if(!statusId){
          await treply('Delete Status', [line('info', 'WhatsApp no allow bot delete person status'), line('usage', '.delstatus <your_status_id>'), line('note', 'Only your own status fit delete')])
          return
        }
        try{
          await sock.sendMessage('status@broadcast', { delete: { remoteJid: 'status@broadcast', fromMe: true, id: statusId } })
          await treply('Delete Status', [line('status', 'Tried delete your status'), line('id', statusId)])
        }catch(e){
          await treply('Delete Status', [line('error', 'Failed - only your own status ID fit work')])
        }
        return
      }
    } catch(e){
      await sock.sendMessage(jid, { text: box('Anti Status Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
}
module.exports.__call = attachEngine
