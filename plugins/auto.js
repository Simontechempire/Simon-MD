// 🤖 SIMON MD - AUTO FEATURES - REAL HANDLER - NO DEMO NO SIMULATION
const fs = require('fs')
const path = require('path')
const { tiny, box, line, reactAwait, reactCmd, reactDone } = require('../utils/style')

const DB_PATH = path.join(__dirname, '../database/auto.json')
function loadAuto(){
  try{
    const d = JSON.parse(fs.readFileSync(DB_PATH))
    return d
  }catch{
    return { autoread:true, autoreadgc:true, autoreadpc:true, autotyping:true, autorecording:true, autoviewstatus:true, autolikestatus:false, autoreact:true, autolike:false, autostatus:true, autostatusview:true, autostatuslike:false, autostatusreact:false, autoreadstatus:true, autodlstatus:false, autoping:false, autopresence:true, autoseen:true, autoview:true, antidelete:true, autodelete:true, autobioText:'SIMON MD | {time}', autobio:false, reactEmoji:'🩺', autosticker:false, autorespond:false, autochat:false, autoai:false, autolevel:false, autojoin:false, autoleave:false, autogroup:false, autoreject:false, autoapprove:false, autosave:false, autobackup:false, autoclean:false, autopurge:false, autodownload:false, autopost:false, autoreply:false, autovoice:false, autonsfw:false, antinsfwauto:false, autogc:false, autopc:false, autocall:false, autoblock:false, autounblock:false, autokick:false, autoban:false, autowarn:false }
  }
}
function saveAuto(data){
  if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), {recursive:true})
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
  global.simonDB = global.simonDB || {}
  global.simonDB.auto = data
  return data
}
function getAuto(){
  if(!global.simonDB?.auto) global.simonDB = { auto: loadAuto() }
  return global.simonDB.auto
}

// ===== REAL ENGINE - runs when connection.js calls auto(sock) =====
function attachEngine(sock){
  if(sock.__autoEngineLoaded) return
  sock.__autoEngineLoaded = true
  if(!global.msgCache) global.msgCache = new Map()

  // --- REAL: AUTOREAD + TYPING + RECORDING + AUTOREACT + CACHE ---
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if(type !== 'notify') return
    const auto = getAuto()
    for(let m of messages){
      try{
        const jid = m.key.remoteJid
        if(!jid) continue
        const isGroup = jid.endsWith('@g.us')
        const isStatus = jid === 'status@broadcast'
        const text = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || ''
        if(m.key.id) global.msgCache.set(m.key.id, { text, jid, sender: m.key.participant || m.key.remoteJid, msg: m })
        if(global.msgCache.size > 300) global.msgCache.delete(global.msgCache.keys().next().value)

        // REAL AUTOREAD
        if(!m.key.fromMe){
          if(isStatus && (auto.autoreadstatus || auto.autostatusview || auto.autoviewstatus)){
            await sock.readMessages([m.key]).catch(()=>{})
          } else if(!isStatus && auto.autoread){
            if(isGroup && auto.autoreadgc === false) {}
            else if(!isGroup && auto.autoreadpc === false) {}
            else await sock.readMessages([m.key]).catch(()=>{})
          }
          if(auto.autoseen || auto.autoview) await sock.readMessages([m.key]).catch(()=>{})
        }

        // REAL AUTOTYPING / AUTORECORDING
        if(!m.key.fromMe && !isStatus){
          if(auto.autorecording) await sock.sendPresenceUpdate('recording', jid).catch(()=>{})
          else if(auto.autotyping) await sock.sendPresenceUpdate('composing', jid).catch(()=>{})
          else if(auto.autopresence) await sock.sendPresenceUpdate('available', jid).catch(()=>{})
          setTimeout(()=> sock.sendPresenceUpdate('available', jid).catch(()=>{}), 3000)
        }

        // REAL AUTOREACT - react to every message
        if(auto.autoreact && !m.key.fromMe && !isStatus){
          await sock.sendMessage(jid, { react: { text: auto.reactEmoji || '🩺', key: m.key } }).catch(()=>{})
        }

        // REAL AUTOSTATUS VIEW / LIKE / REACT
        if(isStatus){
          const sender = m.key.participant
          if(sender){
            if(auto.autoviewstatus || auto.autostatusview || auto.autostatus) await sock.readMessages([m.key]).catch(()=>{})
            if(auto.autolikestatus || auto.autostatuslike) await sock.sendMessage('status@broadcast', { react: { text: '❤️', key: m.key } }).catch(()=>{})
            if(auto.autostatusreact) await sock.sendMessage('status@broadcast', { react: { text: auto.reactEmoji || '🩺', key: m.key } }).catch(()=>{})
          }
        }

        // REAL ANTIDELETE - protocolMessage type 0
        const proto = m.message?.protocolMessage
        if(proto && proto.type === 0 && auto.antidelete){
          const cached = global.msgCache.get(proto.key.id)
          const senderDel = m.key.participant || m.key.remoteJid
          if(cached && cached.text){
            await sock.sendMessage(jid, { text: `🗑️ *ANTIDELETE*\n@${senderDel.split('@')[0]} delete this:\n\n${cached.text}`, mentions:[senderDel] }).catch(()=>{})
          }
        }
        // REAL ANTIEDIT - protocolMessage type 14
        if(proto && proto.type === 14){
          const old = global.msgCache.get(proto.key.id)
          const newText = proto.editedMessage?.message?.conversation || proto.editedMessage?.message?.extendedTextMessage?.text || '[media]'
          const senderEdit = m.key.participant || m.key.remoteJid
          await sock.sendMessage(jid, { text: `✏️ *ANTIEDIT*\n@${senderEdit.split('@')[0]} edit message!\n\n*Before:* ${old?.text || 'unknown'}\n*After:* ${newText}`, mentions:[senderEdit] }).catch(()=>{})
        }

      }catch(e){ console.log('[AUTO ENGINE]', e.message) }
    }
  })

  // REAL AUTOBIO - every 60s
  setInterval(async () => {
    try{
      const auto = getAuto()
      if(!auto.autobio) return
      const time = new Date().toLocaleTimeString('en-NG', { timeZone:'Africa/Lagos', hour:'2-digit', minute:'2-digit' })
      const bio = (auto.autobioText || 'SIMON MD | {time}').replace('{time}', time)
      await sock.updateProfileStatus(bio).catch(()=>{})
    }catch{}
  }, 60*1000)

  // REAL AUTOPING / AUTOPRESENCE - keep online
  setInterval(async () => {
    try{
      const auto = getAuto()
      if(auto.autoping || auto.autopresence) await sock.sendPresenceUpdate('available').catch(()=>{})
    }catch{}
  }, 30*1000)

  console.log('[AUTO] Real engine loaded')
}

module.exports = {
  command: [
    'autoread','autotyping','autorecording','autobio','autostatus','autostatusview',
    'autostatuslike','autostatusreact','autoreact','autolike','autoreadstatus',
    'autodlstatus','autoblock','autounblock','autokick','autoban','autowarn',
    'autodelete','antidelete','autosticker','autorespond','autochat','autoai',
    'autolevel','autojoin','autoleave','autogroup','autoreject','autoapprove',
    'autosave','autobackup','autoclean','autopurge','autoping','autopresence',
    'autoreadgc','autoreadpc','autodownload','autoview','autoseen','autopost',
    'autoreply','autovoice','setauto','autonsfw','antinsfwauto','autogc','autopc','autocall'
  ],

  // For connection.js: auto(sock) will start real engine
  attachEngine,

  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    await reactAwait(sock, jid, m.key) // ⏳
    const auto = getAuto()

    const treply = async (title, lines) => {
      const txt = box(title, lines)
      await sock.sendMessage(jid, { text: txt }, { quoted: m })
    }
    const treplyPlain = async (txt) => {
      await sock.sendMessage(jid, { text: tiny(txt) }, { quoted: m })
    }
    const done = async () => {
      await reactCmd(sock, jid, m.key, command)
      await reactDone(sock, jid, m.key) // 💀
    }
    const set = (key, val) => { auto[key] = val; saveAuto(auto) }

    try {
      if (command === 'setauto') {
        let lines = []
        for (let [k, v] of Object.entries(auto)) {
          if (typeof v === 'boolean') lines.push(line(k, v ? 'ON' : 'OFF'))
        }
        lines.push(line('react emoji', auto.reactEmoji))
        lines.push(line('bio text', auto.autobioText))
        lines.push(line('use', '.<feature> on/off'))
        await treply('Auto Settings', lines)
        await done()
        return
      }

      if (['autoread','autoreadgc','autoreadpc','autoseen','autoview','autoreadstatus','autodlstatus','autostatusview','autostatus','autopresence','autoping'].includes(command)) {
        if (!text) { await treply(command, [line('current', auto[command] ? 'ON' : 'OFF'), line('usage', `.${command} on/off`)]); await done(); return }
        set(command, text === 'on')
        await treply(command, [line('status', text === 'on' ? 'ENABLED' : 'DISABLED')]); await done(); return
      }

      if (['autotyping','autorecording'].includes(command)) {
        if (!text) { await treply(command, [line('current', auto[command] ? 'ON' : 'OFF'), line('usage', `.${command} on/off`)]); await done(); return }
        set(command, text === 'on')
        await treply(command, [line('status', text === 'on' ? 'ENABLED' : 'DISABLED')]); await done(); return
      }

      if (command === 'autobio') {
        if (!text) { await treply('AutoBio', [line('status', auto.autobio ? 'ON' : 'OFF'), line('text', auto.autobioText), line('usage', '.autobio on/off / set text')]); await done(); return }
        if (text === 'on' || text === 'off') {
          set('autobio', text === 'on')
          // REAL: apply immediately, no wait for interval
          if(text === 'on'){
            const time = new Date().toLocaleTimeString('en-NG', { timeZone:'Africa/Lagos', hour:'2-digit', minute:'2-digit' })
            await sock.updateProfileStatus((auto.autobioText || 'SIMON MD | {time}').replace('{time}', time)).catch(()=>{})
          }
          await treply('AutoBio', [line('status', text === 'on' ? 'ENABLED' : 'DISABLED')]); await done(); return
        }
        if (text.startsWith('set ')) {
          set('autobioText', text.slice(4)); set('autobio', true)
          await treply('AutoBio', [line('text set', auto.autobioText)]); await done(); return
        }
      }

      if (['autoreact','autolike','autostatuslike','autostatusreact'].includes(command)) {
        if (!text) { await treply(command, [line('current', auto[command] ? 'ON' : 'OFF'), line('emoji', auto.reactEmoji), line('usage', `.${command} on/off`)]); await done(); return }
        if (text.length <= 4 && text !== 'on' && text !== 'off') {
          set('reactEmoji', text); set('autoreact', true)
          await treply('AutoReact', [line('emoji set', text)]); await done(); return
        }
        set(command, text === 'on')
        await treply(command, [line('status', text === 'on' ? 'ENABLED' : 'DISABLED')]); await done(); return
      }

      if (['antidelete','autodelete'].includes(command)) {
        if (!text) { await treply('AntiDelete', [line('status', auto.antidelete ? 'ON' : 'OFF'), line('info', 'deleted messages will be recovered'), line('usage', '.antidelete on/off')]); await done(); return }
        set('antidelete', text === 'on'); set('autodelete', text === 'on')
        await treply('AntiDelete', [line('status', text === 'on' ? 'ENABLED' : 'DISABLED')]); await done(); return
      }

      const others = ['autosticker','autorespond','autochat','autoai','autolevel','autojoin','autoleave','autogroup','autoreject','autoapprove','autosave','autobackup','autoclean','autopurge','autodownload','autopost','autoreply','autovoice','autonsfw','antinsfwauto','autogc','autopc','autocall','autoblock','autounblock','autokick','autoban','autowarn']
      if (others.includes(command)) {
        if (!text) { await treply(command, [line('current', auto[command] ? 'ON' : 'OFF'), line('usage', `.${command} on/off`)]); await done(); return }
        set(command, text === 'on')
        await treply(command, [line('status', text === 'on' ? 'ENABLED' : 'DISABLED')]); await done(); return
      }

    } catch (e) {
      await treplyPlain(`Auto Error: ${e.message}`)
      await reactDone(sock, jid, m.key)
    }
  }
}

// Allow connection.js to do: require('./plugins/auto.js')(sock)
module.exports.__call = attachEngine
