// 🛠️ SIMON MD - UTILITY - FREE, NO API, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style
const os = require('os')

let START_TIME = Date.now()
if(global.simonStart) START_TIME = global.simonStart
else global.simonStart = START_TIME

function formatUptime(ms){
  const s = Math.floor(ms/1000)
  const d = Math.floor(s/86400); const h = Math.floor((s%86400)/3600); const m = Math.floor((s%3600)/60); const sec = s%60
  if(d > 0) return `${d}d ${h}h ${m}m ${sec}s`
  if(h > 0) return `${h}h ${m}m ${sec}s`
  if(m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}
function formatBytes(bytes){
  if(bytes === 0) return '0 B'
  const k = 1024; const sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}
function getOwner(){
  try{
    const ow = require('./owner')
    if(ow.OWNER_NUMBERS) return ow.OWNER_NUMBERS
    if(ow.OWNER_NUMBER) return [ow.OWNER_NUMBER]
  }catch{}
  try{
    const cfg = require('../config')
    if(cfg.OWNER_NUMBER) return [cfg.OWNER_NUMBER]
    if(cfg.owner) return [cfg.owner]
  }catch{}
  return []
}

module.exports = {
  command: ['utility','ping','pings','speed','uptime','runtime','botinfo','info','about','owner','creator','dev','system','sysinfo','stats','status','version','ver','runtime2','alive','hi','hello2','id','myid','chatid','groupid','jid','whoami','me','profile','myprofile','getid','device','platform','os'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const isGroup = jid.endsWith('@g.us')
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines, mentions=[]) => {
      await sock.sendMessage(jid, { text: box(title, lines), mentions }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(command === 'utility'){
        await treply('Utility - Free Offline', [
          line('ping', '.ping'),
          line('uptime', '.uptime'),
          line('botinfo', '.botinfo'),
          line('system', '.system'),
          line('owner', '.owner'),
          line('whoami', '.whoami'),
          line('id', '.id'),
          line('alive', '.alive'),
          line('version', '.version')
        ])
        return
      }
      if(['ping','pings','speed'].includes(command)){
        const start = Date.now()
        // Real latency - send + measure
        await sock.sendMessage(jid, { text: tiny('Pinging...') }, { quoted: m }).catch(()=>{})
        const latency = Date.now() - start
        await treply('Ping', [line('latency', `${latency}ms`), line('speed', latency < 100 ? 'Fast' : latency < 300 ? 'Good' : 'Slow')])
        return
      }
      if(['uptime','runtime','runtime2'].includes(command)){
        const up = formatUptime(Date.now() - START_TIME)
        const mem = process.memoryUsage()
        await treply('Uptime', [line('uptime', up), line('started', new Date(START_TIME).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })), line('memory', formatBytes(mem.heapUsed))])
        return
      }
      if(['botinfo','info','about'].includes(command)){
        const up = formatUptime(Date.now() - START_TIME)
        const owner = getOwner()
        await treply('Bot Info', [
          line('name', 'SIMON MD'),
          line('uptime', up),
          line('platform', os.platform() + ' ' + os.arch()),
          line('node', process.version),
          line('memory', formatBytes(process.memoryUsage().heapUsed)),
          line('owner', owner.length ? owner.join(', ') : 'Not set'),
          line('mode', 'Free, No API, Offline'),
          line('commands', 'Try .menu for all')
        ])
        return
      }
      if(['system','sysinfo','stats'].includes(command)){
        const mem = process.memoryUsage()
        const totalMem = os.totalmem(); const freeMem = os.freemem()
        await treply('System Info', [
          line('platform', os.platform() + ' ' + os.arch()),
          line('cpu', os.cpus()[0]?.model || 'Unknown'),
          line('cpus', `${os.cpus().length}`),
          line('total-ram', formatBytes(totalMem)),
          line('free-ram', formatBytes(freeMem)),
          line('used-ram', formatBytes(totalMem - freeMem)),
          line('bot-memory', formatBytes(mem.heapUsed)),
          line('uptime', formatUptime(os.uptime() * 1000)),
          line('node', process.version)
        ])
        return
      }
      if(['owner','creator','dev'].includes(command)){
        const owner = getOwner()
        if(!owner.length){ await treply('Owner', [line('info', 'Owner not set in config')]); return }
        await treply('Owner', owner.map((o,i) => line(`owner ${i+1}`, `@${o.split('@')[0]}`)), owner.map(o => o + '@s.whatsapp.net'))
        // Also send contact if possible
        try{
          const num = owner[0].replace(/[^0-9]/g,'')
          await sock.sendMessage(jid, { contacts: { displayName: 'SIMON MD Owner', contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SIMON MD Owner\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD` }] } }, { quoted: m }).catch(()=>{})
        }catch{}
        return
      }
      if(['status'].includes(command)){
        await treply('Bot Status', [line('status', 'Online'), line('uptime', formatUptime(Date.now() - START_TIME)), line('mode', 'Free, No API')])
        return
      }
      if(['version','ver'].includes(command)){
        await treply('Version', [line('version', 'SIMON MD v2.0 - Free Offline'), line('node', process.version), line('updated', 'Nov 2026')])
        return
      }
      if(['alive'].includes(command)){
        await treply('Alive', [line('status', 'I dey alive! SIMON MD dey run.'), line('uptime', formatUptime(Date.now() - START_TIME))])
        return
      }
      if(['id','myid','chatid','groupid','jid','getid'].includes(command)){
        await treply('ID', [line('chat-id', jid), line('your-id', sender), line('is-group', isGroup ? 'Yes' : 'No')])
        return
      }
      if(['whoami','me','profile','myprofile'].includes(command)){
        const name = m.pushName || 'Unknown'
        await treply('Who Am I', [line('name', name), line('id', sender), line('chat', jid), line('is-group', isGroup ? 'Yes' : 'No')])
        return
      }
      if(['device','platform','os'].includes(command)){
        await treply('Device / Platform', [line('platform', os.platform()), line('arch', os.arch()), line('node', process.version), line('host', os.hostname())])
        return
      }
      if(['hi','hello2'].includes(command)){
        await treply('Hello', [line('hi', `Hello @${sender.split('@')[0]}, I dey here.`), line('try', '.menu for commands')], [sender])
        return
      }
    } catch(e){
      await sock.sendMessage(jid, { text: box('Utility Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
    }
