// 🗑️ SIMON MD - ANTISTORE ONLY - antidelete DISABLED, use .antirestore
const fs = require('fs')
const path = require('path')
let style
try { style = require('../utils/style') } catch { try { style = require('./style') } catch { style = { tiny: (s) => s, box: (t, lines) => t + '\n' + lines.join('\n'), line: (k, v) => k + ': ' + v, reactAwait: async () => {}, reactCmd: async () => {}, reactDone: async () => {} } } }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const DB_PATH = path.join(__dirname, '../database/antirestore.json')
const CACHE_DIR = path.join(__dirname, '../database/deleted_cache')

function loadCfg(){
  try{ return JSON.parse(fs.readFileSync(DB_PATH)) }catch{ return { antirestore: true, antidelete: false, sendToOwner: false, saveMedia: true } }
}
function saveCfg(d){
  if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), {recursive:true})
  fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2))
  if(global.simonDB) delete global.simonDB.antirestore
  return d
}
function getCfg(){ return loadCfg() }
function ensureCacheDir(){
  if(!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, {recursive:true})
}
function safeFile(id){ return path.join(CACHE_DIR, String(id).replace(/[^a-zA-Z0-9_-]/g,'') + '.bin') }

async function downloadMediaBuffer(msg, type){
  try{
    const stream = await downloadContentFromMessage(msg, type)
    let buf = Buffer.from([])
    for await (const chunk of stream){ buf = Buffer.concat([buf, chunk]) }
    return buf.length ? buf : null
  }catch{ return null }
}

if(!global.deletedCache) global.deletedCache = new Map()
if(!global.lastDeleted) global.lastDeleted = new Map()

async function cacheMessage(m){
  try{
    const jid = m.key.remoteJid
    if(!jid || m.key.fromMe) return
    const msg = m.message
    if(!msg) return
    if(msg.protocolMessage) return
    const sender = m.key.participant || jid
    const text = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || msg.documentMessage?.caption || ''
    let entry = { id: m.key.id, jid, sender, text, time: Date.now(), type: 'text', mediaPath: null, mimetype: null, caption: text }
    if(msg.imageMessage){
      entry.type = 'image'; entry.caption = msg.imageMessage.caption || ''
      const buf = await downloadMediaBuffer(msg.imageMessage, 'image')
      if(buf){ ensureCacheDir(); const p = safeFile(m.key.id); fs.writeFileSync(p, buf); entry.mediaPath = p; entry.mimetype = msg.imageMessage.mimetype }
    } else if(msg.videoMessage){
      entry.type = 'video'; entry.caption = msg.videoMessage.caption || ''
      const buf = await downloadMediaBuffer(msg.videoMessage, 'video')
      if(buf){ ensureCacheDir(); const p = safeFile(m.key.id); fs.writeFileSync(p, buf); entry.mediaPath = p; entry.mimetype = msg.videoMessage.mimetype }
    } else if(msg.audioMessage){
      entry.type = 'audio'; entry.caption = ''
      const buf = await downloadMediaBuffer(msg.audioMessage, 'audio')
      if(buf){ ensureCacheDir(); const p = safeFile(m.key.id); fs.writeFileSync(p, buf); entry.mediaPath = p; entry.mimetype = msg.audioMessage.mimetype }
    } else if(msg.stickerMessage){
      entry.type = 'sticker'
      const buf = await downloadMediaBuffer(msg.stickerMessage, 'sticker')
      if(buf){ ensureCacheDir(); const p = safeFile(m.key.id); fs.writeFileSync(p, buf); entry.mediaPath = p }
    } else if(msg.documentMessage){
      entry.type = 'document'; entry.caption = msg.documentMessage.caption || msg.documentMessage.fileName || ''
      const buf = await downloadMediaBuffer(msg.documentMessage, 'document')
      if(buf){ ensureCacheDir(); const p = safeFile(m.key.id); fs.writeFileSync(p, buf); entry.mediaPath = p; entry.mimetype = msg.documentMessage.mimetype; entry.fileName = msg.documentMessage.fileName }
    }
    global.deletedCache.set(m.key.id, entry)
    if(!global.msgCache) global.msgCache = new Map()
    global.msgCache.set(m.key.id, { text: entry.text, jid, sender, msg: m, message: msg })
    if(global.deletedCache.size > 500){
      const first = global.deletedCache.keys().next().value
      const old = global.deletedCache.get(first)
      if(old?.mediaPath) try{ fs.unlinkSync(old.mediaPath) }catch{}
      global.deletedCache.delete(first)
    }
  }catch(e){ console.log('[ANTISTORE CACHE]', e.message) }
}

async function restoreDeleted(sock, m, cached){
  const jid = m.key.remoteJid
  const sender = cached.sender
  const header = box('AntiStore - Deleted Restored', [
    line('from', '@' + sender.split('@')[0]),
    line('type', cached.type),
    line('time', new Date(cached.time).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos' })),
    line('text', cached.text || cached.caption || '(media)')
  ])
  await sock.sendMessage(jid, { text: header, mentions: [sender] }).catch(()=>{})
  try{
    if(cached.type === 'image' && cached.mediaPath && fs.existsSync(cached.mediaPath)){
      await sock.sendMessage(jid, { image: fs.readFileSync(cached.mediaPath), caption: tiny(cached.caption || 'Deleted image restored') }, { quoted: m }).catch(()=>{})
    } else if(cached.type === 'video' && cached.mediaPath && fs.existsSync(cached.mediaPath)){
      await sock.sendMessage(jid, { video: fs.readFileSync(cached.mediaPath), caption: tiny(cached.caption || 'Deleted video restored') }, { quoted: m }).catch(()=>{})
    } else if(cached.type === 'audio' && cached.mediaPath && fs.existsSync(cached.mediaPath)){
      await sock.sendMessage(jid, { audio: fs.readFileSync(cached.mediaPath), mimetype: cached.mimetype || 'audio/mp4', ptt: true }, { quoted: m }).catch(()=>{})
    } else if(cached.type === 'sticker' && cached.mediaPath && fs.existsSync(cached.mediaPath)){
      await sock.sendMessage(jid, { sticker: fs.readFileSync(cached.mediaPath) }, { quoted: m }).catch(()=>{})
    } else if(cached.type === 'document' && cached.mediaPath && fs.existsSync(cached.mediaPath)){
      await sock.sendMessage(jid, { document: fs.readFileSync(cached.mediaPath), fileName: cached.fileName || 'deleted-file', mimetype: cached.mimetype || 'application/octet-stream', caption: tiny(cached.caption || '') }, { quoted: m }).catch(()=>{})
    }
  }catch(e){ console.log('[ANTISTORE RESTORE]', e.message) }
}

function attachEngine(sock){
  if(sock.__antirestoreEngineLoaded) return
  sock.__antirestoreEngineLoaded = true
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if(type !== 'notify') return
    for(let m of messages){
      try{
        const msg = m.message
        if(!msg) continue
        const proto = msg.protocolMessage
        const cfg = loadCfg()
        // FIXED: Only antirestore controls restore now. antidelete is ignored.
        if(proto && proto.type === 0){
          if(!cfg.antirestore) continue
          const deletedId = proto.key?.id
          if(!deletedId) continue
          const cached = global.deletedCache.get(deletedId)
          const deleter = m.key.participant || m.key.remoteJid
          if(!cached){
            await sock.sendMessage(m.key.remoteJid, { text: box('AntiStore', [line('from', '@' + deleter.split('@')[0]), line('info', 'Deleted message, but bot no cache am - send before bot restart / bot no see am')]), mentions: [deleter] }).catch(()=>{})
            continue
          }
          global.lastDeleted.set(m.key.remoteJid, cached)
          await restoreDeleted(sock, m, cached)
          continue
        }
        if(proto && proto.type === 14){
          if(!cfg.antirestore) continue
          const editedId = proto.key?.id
          const old = global.deletedCache.get(editedId)
          const newText = proto.editedMessage?.message?.conversation || proto.editedMessage?.message?.extendedTextMessage?.text || '[media]'
          const editor = m.key.participant || m.key.remoteJid
          await sock.sendMessage(m.key.remoteJid, { text: box('AntiEdit', [line('from', '@' + editor.split('@')[0]), line('before', old?.text || old?.caption || 'unknown'), line('after', newText)]), mentions: [editor] }).catch(()=>{})
          continue
        }
        if(!cfg.antirestore) continue
        await cacheMessage(m)
      }catch(e){ console.log('[ANTISTORE ENGINE]', e.message) }
    }
  })
  console.log('[ANTISTORE] Engine loaded - antirestore only')
}

module.exports = {
  // FIXED: antidelete still listed so we can catch it and tell user to use antirestore
  command: ['antirestore','antidelete','restore','deleted','lastdeleted','deletedmsg'],
  attachEngine,
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const cfg = getCfg()
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      // FIXED: antidelete is DISABLED - redirect to antirestore
      if(command === 'antidelete'){
        await treply('AntiDelete Disabled', [line('info', 'Antidelete is disabled'), line('use', 'Use .antirestore on/off instead')])
        return
      }
      if(command === 'antirestore'){
        if(!text){ await treply('AntiStore', [line('status', cfg.antirestore ? 'ON' : 'OFF'), line('usage', '.antirestore on/off')]); return }
        const val = String(text).toLowerCase().trim() === 'on'
        cfg.antirestore = val; cfg.antidelete = false; saveCfg(cfg)
        await treply('AntiStore', [line('status', val ? 'ENABLED' : 'DISABLED')]); return
      }
      if(['restore','deleted','lastdeleted','deletedmsg'].includes(command)){
        const last = global.lastDeleted?.get(jid)
        if(!last){ await treply('Restore', [line('info', 'No deleted message for this chat yet')]); return }
        await restoreDeleted(sock, m, last)
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
    } catch(e){
      await sock.sendMessage(jid, { text: box('AntiStore Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
}
module.exports.__call = attachEngine
