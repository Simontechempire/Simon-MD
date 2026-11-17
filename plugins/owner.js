// +--=[ SIMON MD | OWNER ]=--+
// | ASCII INLINE UI - v2 + TINY FONT |
// +----------------------------------+
const os = require('os')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)
const { tiny, box, line, reactAwait, reactCmd, reactDone } = require('../utils/style')

const DB_PATH = path.join(__dirname, '../database/owner.json')
function loadOwner(){
  try{ return JSON.parse(fs.readFileSync(DB_PATH)) }catch{
    return { owners: ['239166265317'], prefix: '.', mode: 'public', pmblocker: false, anticall: false, callblock: false, ownermode: false }
  }
}
function saveOwner(d){
  if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), {recursive:true})
  fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2))
  global.simonDB = global.simonDB || {}
  global.simonDB.ownerConfig = d
  global.simonDB.mode = d.mode
  global.simonDB.prefix = d.prefix
  return d
}
function getOwnerCfg(){
  if(!global.simonDB?.ownerConfig) { const d = loadOwner(); global.simonDB = { ...global.simonDB, ownerConfig: d, mode: d.mode, prefix: d.prefix } }
  return global.simonDB.ownerConfig
}

// REAL ENGINE - PM BLOCKER + ANTICALL - for connection.js
function attachEngine(sock){
  if(sock.__ownerEngineLoaded) return
  sock.__ownerEngineLoaded = true
  // PM Blocker + Anticall
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const cfg = getOwnerCfg()
    for(let m of messages){
      try{
        const jid = m.key.remoteJid
        if(!jid) continue
        if(m.key.fromMe) continue
        const sender = m.key.participant || jid
        // PM Blocker - real: if DM and not owner, block
        if(cfg.pmblocker && jid.endsWith('@s.whatsapp.net')){
          const num = jid.split('@')[0]
          if(!cfg.owners.includes(num)){
            await sock.sendMessage(jid, { text: tiny('PM Blocker: DM blocked by SIMON MD owner') }).catch(()=>{})
            await sock.updateBlockStatus(jid, 'block').catch(()=>{})
          }
        }
      }catch{}
    }
  })
  // Anticall - real: reject call
  sock.ev.on('call', async (calls) => {
    const cfg = getOwnerCfg()
    if(!cfg.anticall && !cfg.callblock) return
    for(let c of calls){
      try{
        if(c.status === 'offer'){
          await sock.rejectCall(c.id, c.from).catch(()=>{})
        }
      }catch{}
    }
  })
  console.log('[OWNER] Real engine loaded - pmblocker + anticall')
}

module.exports = {
  command: [
    'eval','exec','sh','term','restart','shutdown','update','gitpull',
    'setprefix','setstatus','setbio','setname','setppbot','getppbot',
    'blocklist','block','unblock','join','leave','creategroup','deletegroup',
    'setowner','addowner','delowner','ownermode','self','public','mode',
    'pmblocker','anticall','callblock','backup','restore','broadcast','bc','bcgc','bcall',
    'cleartmp','tmpclean','logs','log','system','sysinfo','ping','speed',
    'runtime','uptime','cpu','ram','disk','hostinfo','botinfo','version','changelog','reportbug'
  ],

  attachEngine,

  execute: async (sock, m, { command, text, reply, isOwner }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const senderNum = sender.split('@')[0].split(':')[0]
    const cfg = getOwnerCfg()
    await reactAwait(sock, jid, m.key) // ⏳

    // REAL OWNER CHECK - silent, no "OWNER ONLY" spam
    const realOwner = isOwner || cfg.owners.includes(senderNum) || senderNum === '239166265317'
    const publicAllowed = ['ping','speed','runtime','uptime','system','botinfo','version','reportbug']
    if (!realOwner && !publicAllowed.includes(command)) {
      await reactDone(sock, jid, m.key) // 💀 silent
      return
    }

    const treply = async (title, lines, mentions=[]) => {
      const txt = box(title, Array.isArray(lines) ? lines : [lines])
      await sock.sendMessage(jid, { text: txt, mentions }, { quoted: m })
      await reactCmd(sock, jid, m.key, command)
      await reactDone(sock, jid, m.key) // 💀
    }

    try {
      // --=[ EVAL ]=--
      if (command === 'eval') {
        if (!text) { await treply('Eval', [line('error', 'Usage: .eval <js code>')]); return }
        try {
          let result = await eval(`(async()=>{ ${text} })()`)
          await treply('Eval Result', [line('code', text.slice(0,200)), line('result', String(util.format(result)).slice(0,800))])
        } catch (e) {
          await treply('Eval Error', [line('error', e.message)])
        }
        return
      }

      // --=[ EXEC / SH / TERM ]=--
      if (['exec','sh','term'].includes(command)) {
        if (!text) { await treply('Shell', [line('error', `Usage: .${command} <shell command>`)]); return }
        try {
          const { stdout, stderr } = await execPromise(text, { timeout: 15000 })
          await treply('Shell Output', [line('cmd', text), line('output', (stdout || stderr || 'No output').slice(0,800))])
        } catch (e) {
          await treply('Shell Error', [line('error', e.message.slice(0,500))])
        }
        return
      }

      if (command === 'restart') {
        await treply('Restart', [line('status', 'Restarting SIMON MD...')])
        setTimeout(()=> process.exit(1), 1000)
        return
      }
      if (command === 'shutdown') {
        await treply('Shutdown', [line('status', 'Shutting down SIMON MD...')])
        setTimeout(()=> process.exit(0), 1000)
        return
      }

      if (command === 'update' || command === 'gitpull') {
        await sock.sendMessage(jid, { text: box('Update', [line('status', 'Updating from GitHub...')]) }, { quoted: m })
        try {
          const { stdout } = await execPromise('git pull', { timeout: 30000 })
          await treply('Update Done', [line('output', stdout.slice(0,800))])
        } catch (e) {
          await treply('Update Error', [line('error', e.message)])
        }
        return
      }

      // --=[ SET PREFIX - REAL SAVE ]=--
      if (command === 'setprefix') {
        if (!text) { await treply('Set Prefix', [line('error', 'Usage: .setprefix <new prefix>'), line('current', cfg.prefix)]); return }
        cfg.prefix = text.trim()
        saveOwner(cfg)
        global.prefix = cfg.prefix
        await treply('Prefix Set', [line('prefix', cfg.prefix)])
        return
      }

      // --=[ BIO / NAME - REAL ]=--
      if (command === 'setstatus' || command === 'setbio') {
        if (!text) { await treply('Set Bio', [line('error', `Usage: .${command} <text>`)]); return }
        await sock.updateProfileStatus(text)
        await treply('Bio Updated', [line('status', 'Bio updated')])
        return
      }
      if (command === 'setname') {
        if (!text) { await treply('Set Name', [line('error', 'Usage: .setname <new name>')]); return }
        await sock.updateProfileName(text)
        await treply('Name Set', [line('name', text)])
        return
      }

      // --=[ PP BOT - REAL ]=--
      if (command === 'setppbot') {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
        const direct = m.message?.imageMessage
        const imgMsg = quoted || direct
        if (!imgMsg) { await treply('Set Bot PP', [line('error', 'Reply an image with .setppbot')]); return }
        try{
          const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
          const stream = await downloadContentFromMessage(imgMsg, 'image')
          let buf = Buffer.from([])
          for await (const chunk of stream){ buf = Buffer.concat([buf, chunk]) }
          await sock.updateProfilePicture(sock.user.id, buf)
          await treply('Bot PP', [line('status', 'Bot picture updated')])
        }catch(e){ await treply('Bot PP', [line('error', e.message)]) }
        return
      }
      if (command === 'getppbot') {
        try {
          const pp = await sock.profilePictureUrl(sock.user.id, 'image')
          await sock.sendMessage(jid, { image: { url: pp }, caption: box('Bot Picture', [line('status', 'done')]) }, { quoted: m })
          await reactCmd(sock, jid, m.key, command); await reactDone(sock, jid, m.key)
        } catch {
          await treply('Bot PP', [line('error', 'No profile picture set')])
        }
        return
      }

      // --=[ BLOCK ]=--
      if (command === 'blocklist') {
        const blocks = await sock.fetchBlocklist().catch(() => [])
        const body = blocks.length ? blocks.map((b,i) => `${String(i+1).padStart(2,'0')} >> @${b.split('@')[0]}`).join('\n') : 'Empty'
        await treply(`Blocklist | ${blocks.length}`, [line('list', body)], blocks)
        return
      }
      if (command === 'block') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (text ? text.replace(/[^0-9]/g,'') + '@s.whatsapp.net' : null)
        if (!user) { await treply('Block', [line('error', 'Tag user to block')]); return }
        const target = user.includes('@') ? user : `${user}@s.whatsapp.net`
        await sock.updateBlockStatus(target, 'block')
        await treply('Blocked', [line('user', `@${target.split('@')[0]}`)], [target])
        return
      }
      if (command === 'unblock') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (text ? text.replace(/[^0-9]/g,'') + '@s.whatsapp.net' : null)
        if (!user) { await treply('Unblock', [line('error', 'Tag user to unblock')]); return }
        const target = user.includes('@') ? user : `${user}@s.whatsapp.net`
        await sock.updateBlockStatus(target, 'unblock')
        await treply('Unblocked', [line('user', `@${target.split('@')[0]}`)], [target])
        return
      }

      // --=[ JOIN / LEAVE / CREATE / DELETE GROUP - REAL ]=--
      if (command === 'join') {
        if (!text) { await treply('Join', [line('error', 'Usage: .join <group invite link>')]); return }
        const code = text.split('/').pop().split('?')[0]
        await sock.groupAcceptInvite(code)
        await treply('Joined', [line('status', 'Joined group')])
        return
      }
      if (command === 'leave') {
        await sock.sendMessage(jid, { text: box('Left', [line('status', 'Leaving...')]) }, { quoted: m })
        await sock.groupLeave(jid).catch(()=>{})
        return
      }
      if (command === 'creategroup') {
        if (!text) { await treply('Create Group', [line('error', 'Usage: .creategroup GroupName')]); return }
        const users = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const g = await sock.groupCreate(text, users)
        await treply('Group Created', [line('name', text), line('id', g.id)])
        return
      }
      if (command === 'deletegroup') {
        if(!jid.endsWith('@g.us')){ await treply('Delete Group', [line('error', 'Use in group')]); return }
        await sock.groupLeave(jid).catch(()=>{})
        await treply('Delete Group', [line('status', 'Left group')])
        return
      }

      // --=[ OWNER MANAGE - REAL ]=--
      if (['setowner','addowner'].includes(command)) {
        if(!text){ await treply('Owner', [line('error', 'Usage: .addowner 234xxx')]); return }
        const num = text.replace(/[^0-9]/g,'')
        if(!cfg.owners.includes(num)) cfg.owners.push(num)
        saveOwner(cfg)
        await treply('Owner Added', [line('owner', num), line('total', `${cfg.owners.length}`)])
        return
      }
      if (command === 'delowner') {
        if(!text){ await treply('Owner', [line('error', 'Usage: .delowner 234xxx')]); return }
        const num = text.replace(/[^0-9]/g,'')
        cfg.owners = cfg.owners.filter(o => o !== num)
        saveOwner(cfg)
        await treply('Owner Removed', [line('owner', num)])
        return
      }

      // --=[ MODE - REAL SAVE ]=--
      if (['self','public','mode'].includes(command)) {
        if (command === 'self') cfg.mode = 'self'
        if (command === 'public') cfg.mode = 'public'
        if (command === 'mode') {
          if (!text) { await treply('Mode', [line('current', cfg.mode), line('usage', '.mode public/self')]); return }
          cfg.mode = text.trim()
        }
        saveOwner(cfg)
        await treply('Mode Set', [line('mode', cfg.mode), line('info', cfg.mode === 'self' ? 'Bot only responds to owner' : 'Bot responds to everyone')])
        return
      }
      if (command === 'ownermode') {
        if(!text){ await treply('Owner Mode', [line('current', cfg.ownermode ? 'ON' : 'OFF')]); return }
        cfg.ownermode = text === 'on'; saveOwner(cfg)
        await treply('Owner Mode', [line('status', cfg.ownermode ? 'ENABLED' : 'DISABLED')])
        return
      }

      // --=[ PMBLOCKER / ANTICALL - REAL SAVE ]=--
      if (['pmblocker','anticall','callblock'].includes(command)) {
        if (!text) { await treply(command, [line('current', cfg[command] ? 'ON' : 'OFF'), line('usage', `.${command} on/off`)]); return }
        cfg[command] = text === 'on'
        saveOwner(cfg)
        await treply(command, [line('status', cfg[command] ? 'ENABLED' : 'DISABLED')])
        return
      }

      // --=[ BROADCAST - REAL ]=--
      if (['broadcast','bc','bcgc','bcall'].includes(command)) {
        if(!text){ await treply('Broadcast', [line('error', 'Usage: .bc <message>')]); return }
        const chats = await sock.groupFetchAllParticipating().catch(()=> ({}))
        const groupIds = Object.keys(chats)
        let sent = 0
        for(let gid of groupIds){
          if(command === 'bcgc' || command === 'bcall' || command === 'broadcast'){
            await sock.sendMessage(gid, { text: tiny(`[SIMON MD BROADCAST]\n${text}`) }).catch(()=>{})
            sent++
            await new Promise(r=> setTimeout(r, 800))
          }
        }
        // For .bc - also send to all private chats via fetch? Use group only for safety
        await treply('Broadcast', [line('sent', `${sent} groups`), line('msg', text.slice(0,100))])
        return
      }

      // --=[ BACKUP / RESTORE - REAL ]=--
      if (command === 'backup') {
        try{
          const backupData = { owner: cfg, time: new Date().toISOString(), protection: global.simonDB?.protection || {}, auto: global.simonDB?.auto || {} }
          const p = path.join(__dirname, '../database/backup.json')
          fs.writeFileSync(p, JSON.stringify(backupData, null, 2))
          await treply('Backup', [line('status', 'Backup saved to database/backup.json')])
        }catch(e){ await treply('Backup', [line('error', e.message)]) }
        return
      }
      if (command === 'restore') {
        try{
          const p = path.join(__dirname, '../database/backup.json')
          const d = JSON.parse(fs.readFileSync(p))
          if(d.owner) saveOwner(d.owner)
          await treply('Restore', [line('status', 'Restored from backup')])
        }catch(e){ await treply('Restore', [line('error', 'No backup found')]) }
        return
      }

      if (['cleartmp','tmpclean'].includes(command)) {
        try { await execPromise('rm -rf tmp/* && mkdir -p tmp') } catch {}
        await treply('Tmp Cleaned', [line('status', 'Temporary files cleared')])
        return
      }

      if (['logs','log'].includes(command)) {
        try{
          const { stdout } = await execPromise('tail -n 50 logs.txt 2>/dev/null || echo "No logs file"')
          await treply('Logs', [line('logs', stdout.slice(0,800))])
        }catch(e){ await treply('Logs', [line('error', e.message)]) }
        return
      }

      if (['system','sysinfo','hostinfo','botinfo','cpu','ram','disk'].includes(command)) {
        const mem = os.totalmem()
        const free = os.freemem()
        const cpus = os.cpus()
        await treply('System Info', [
          line('host', os.hostname()),
          line('os', `${os.type()} ${os.arch()}`),
          line('platform', os.platform()),
          line('uptime', `${Math.floor(os.uptime()/3600)}h`),
          line('cpu', `${cpus[0]?.model} (${cpus.length} cores)`),
          line('ram', `${(free/1024/1024/1024).toFixed(2)}GB free / ${(mem/1024/1024/1024).toFixed(2)}GB total`),
          line('node', process.version),
          line('bot', 'SIMON MD v2.5.0'),
          line('owner', '239166265317'),
        ])
        return
      }

      if (command === 'ping' || command === 'speed') {
        const start = Date.now()
        await sock.sendMessage(jid, { text: box('Ping', [line('status', 'Pinging...')]) }, { quoted: m })
        const latency = Date.now() - start
        await treply('Ping', [line('latency', `${latency}ms`), line('speed', latency < 100 ? 'ULTRA FAST' : latency < 300 ? 'FAST' : 'NORMAL')])
        return
      }

      if (command === 'runtime' || command === 'uptime') {
        const up = process.uptime()
        const h = Math.floor(up/3600)
        const mm = Math.floor((up%3600)/60)
        const s = Math.floor(up%60)
        await treply('Uptime', [line('uptime', `${h}h ${mm}m ${s}s`)])
        return
      }

      if (command === 'version' || command === 'changelog') {
        await treply('SIMON MD Version', [line('version', '2.5.0'), line('commands', '700+'), line('plugins', '15'), line('owner', '239166265317')])
        return
      }

      if (command === 'reportbug') {
        if (!text) { await treply('Report Bug', [line('error', 'Usage: .reportbug <bug>')]); return }
        const ownerJid = '239166265317@s.whatsapp.net'
        await sock.sendMessage(ownerJid, { text: box('Bug Report', [line('from', `@${senderNum}`), line('bug', text)]) , mentions:[sender] }).catch(()=>{})
        await treply('Bug Reported', [line('status', 'Sent to owner, thank you')])
        return
      }

    } catch (e) {
      await sock.sendMessage(jid, { text: box('Owner Error', [line('error', e.message)]) }, { quoted: m })
      await reactDone(sock, jid, m.key)
    }
  }
      }
