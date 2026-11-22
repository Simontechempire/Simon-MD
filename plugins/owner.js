// 🛡️ SIMON MD - Owner Plugin | FIXED - LID Owner Check + Syntax Error
const os = require('os')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const DB_PATH = path.join(__dirname, '../database/owner.json')

function loadOwner() {
  try { return JSON.parse(fs.readFileSync(DB_PATH)) } catch {
    return { owners: ['239166265317'], prefix: '.', mode: 'public', pmblocker: false, anticall: false, callblock: false, ownermode: false }
  }
}
function saveOwner(d) {
  if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2))
  global.simonDB = global.simonDB || {}
  global.simonDB.ownerConfig = d
  global.simonDB.mode = d.mode
  global.simonDB.prefix = d.prefix
  return d
}
function getOwnerCfg() {
  if (!global.simonDB?.ownerConfig) {
    const d = loadOwner()
    global.simonDB = { ...global.simonDB, ownerConfig: d, mode: d.mode, prefix: d.prefix }
  }
  return global.simonDB.ownerConfig
}
function normNum(n) { return String(n || '').replace(/[^0-9]/g, '').replace(/^0+/, '') }
function normId(id) { return String(id || '').split(':')[0].split('@')[0] }
function cleanId(id) { return String(id || '').split(':')[0] }

function getOwnerNumbers() {
  const cfg = getOwnerCfg()
  const list = []
  const envRaw = process.env.OWNER_NUMBER || process.env.OWNER_NUMBERS || process.env.OWNER || ''
  if (envRaw) String(envRaw).split(/[,;|\s]+/).forEach(x => { const n = normNum(x); if (n) list.push(n) })
  try {
    const cfgFile = require('../config')
    const cOwners = cfgFile.owner || cfgFile.owners || cfgFile.OWNER_NUMBER
    if (cOwners) (Array.isArray(cOwners) ? cOwners : [cOwners]).forEach(x => { const n = normNum(x); if (n) list.push(n) })
  } catch {}
  try {
    const cfgFile2 = require('../settings')
    const cOwners2 = cfgFile2.owner || cfgFile2.owners
    if (cOwners2) (Array.isArray(cOwners2) ? cOwners2 : [cOwners2]).forEach(x => { const n = normNum(x); if (n) list.push(n) })
  } catch {}
  if (cfg.owners && Array.isArray(cfg.owners)) cfg.owners.forEach(x => { const n = normNum(x); if (n) list.push(n) })
  if (!list.length) list.push('239166265317')
  return [...new Set(list)]
}

// FIXED: Check ALL possible IDs - participant + participantAlt + remoteJid
// This fixes owner check in groups where participant is LID
function isRealOwner(sender, sock = null, m = null) {
  const owners = getOwnerNumbers()
  const candidates = []
  // If first arg is a message object
  if (sender && typeof sender === 'object') { m = sender; sender = null }
  if (m) {
    if (m.key?.participant) candidates.push(normNum(m.key.participant))
    if (m.key?.participantAlt) candidates.push(normNum(m.key.participantAlt))
    if (m.participant) candidates.push(normNum(m.participant))
    if (m.participantAlt) candidates.push(normNum(m.participantAlt))
    if (m.key?.remoteJid) candidates.push(normNum(m.key.remoteJid))
  }
  if (sender) candidates.push(normNum(sender))
  if (sock?.user?.id) candidates.push(normNum(sock.user.id))
  // Also check sock user lid if owner is using bot account
  return candidates.some(n => n && owners.includes(n))
}

function getSenderCandidates(m) {
  const arr = []
  if (m.key?.participant) arr.push(m.key.participant)
  if (m.key?.participantAlt) arr.push(m.key.participantAlt)
  if (m.participant) arr.push(m.participant)
  if (m.participantAlt) arr.push(m.participantAlt)
  if (m.key?.remoteJid) arr.push(m.key.remoteJid)
  return [...new Set(arr)]
}

function getBotNum(sock) { try { return normNum(sock?.user?.id) } catch { return '' } }

function attachEngine(sock) {
  if (!sock || !sock.ev) return
  if (sock.__ownerEngineLoaded) return
  sock.__ownerEngineLoaded = true

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const cfg = getOwnerCfg()
    if (!cfg.pmblocker) return
    for (const m of messages) {
      try {
        if (m.key.fromMe) continue
        const jid = m.key.remoteJid
        if (!jid || !jid.endsWith('@s.whatsapp.net')) continue
        if (isRealOwner(null, sock, m)) continue
        await sock.updateBlockStatus(jid, 'block').catch(() => {})
      } catch {}
    }
  })

  sock.ev.on('call', async (calls) => {
    const cfg = getOwnerCfg()
    if (!cfg.anticall && !cfg.callblock) return
    for (const c of calls) {
      try {
        if (c.status === 'offer') {
          if (isRealOwner(c.from, sock)) continue
          await sock.rejectCall(c.id, c.from).catch(() => {})
        }
      } catch {}
    }
  })
  console.log('[OWNER] Engine loaded ✅')
}

const COMMANDS = [
  'eval', 'exec', 'sh', 'term', 'restart', 'shutdown', 'update', 'gitpull',
  'setprefix', 'setstatus', 'setbio', 'setname', 'setppbot', 'getppbot',
  'blocklist', 'block', 'unblock', 'join', 'leave', 'creategroup',
  'setowner', 'addowner', 'delowner', 'ownermode', 'self', 'public', 'mode',
  'pmblocker', 'anticall', 'callblock', 'backup', 'restore', 'broadcast', 'bc', 'bcgc', 'bcall',
  'cleartmp', 'tmpclean', 'logs', 'log', 'system', 'sysinfo', 'ping', 'speed',
  'runtime', 'uptime', 'cpu', 'ram', 'disk', 'hostinfo', 'botinfo', 'version', 'changelog', 'reportbug'
]

module.exports = {
  name: 'owner',
  alias: COMMANDS,
  command: COMMANDS,
  category: 'owner',
  desc: 'Owner controls',
  attachEngine,
  __call: attachEngine,
  isRealOwner,
  getOwnerNumbers,
  getBotNum,

  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    // FIXED: Get all candidates, use participantAlt for real number
    const sender = m.key.participantAlt || m.key.participant || m.participant || jid
    const senderNum = normNum(sender)
    const input = (text || args?.join(' ') || '').trim()
    const cmd = (command || '').toLowerCase()
    const cfg = getOwnerCfg()
    // FIXED: Pass m so it can check participantAlt (LID fix)
    const realOwner = isRealOwner(null, sock, m)
    const publicAllowed = ['ping', 'speed', 'runtime', 'uptime', 'system', 'botinfo', 'version', 'reportbug']

    if (!realOwner && !publicAllowed.includes(cmd)) return
    if (cfg.mode === 'self' && !realOwner) return

    const reply = async (txt) => { await sock.sendMessage(jid, { text: txt }, { quoted: m }) }

    try {
      if (cmd === 'eval') {
        if (!input) return reply('Usage: .eval <js code>')
        try {
          const result = await eval(`(async () => { ${input} })()`)
          return reply(`*Eval Result*\n${String(util.format(result)).slice(0, 700)}`)
        } catch (e) { return reply(`*Eval Error*\n${e.message}`) }
      }

      if (['exec', 'sh', 'term'].includes(cmd)) {
        if (!input) return reply(`Usage: .${cmd} <command>`)
        try {
          const { stdout, stderr } = await execPromise(input, { timeout: 20000 })
          return reply(`*Shell Output*\n${(stdout || stderr || 'No output').slice(0, 800)}`)
        } catch (e) { return reply(`*Shell Error*\n${e.message.slice(0, 500)}`) }
      }

      if (cmd === 'restart') { await reply('🔄 Restarting SIMON MD...'); setTimeout(() => process.exit(1), 1200); return }
      if (cmd === 'shutdown') { await reply('🛑 Shutting down...'); setTimeout(() => process.exit(0), 1200); return }

      if (['update', 'gitpull'].includes(cmd)) {
        await reply('⬇️ Pulling from GitHub...')
        try { const { stdout } = await execPromise('git pull', { timeout: 30000 }); return reply(`*Update Done*\n${stdout.slice(0, 700)}`) } catch (e) { return reply(`*Update Error*\n${e.message}`) }
      }

      if (cmd === 'setprefix') {
        if (!input) return reply(`Current prefix: ${cfg.prefix}\nUsage: .setprefix <new>`)
        cfg.prefix = input.trim(); saveOwner(cfg); global.prefix = cfg.prefix
        return reply(`✅ Prefix updated to: ${cfg.prefix}`)
      }

      if (['setstatus', 'setbio'].includes(cmd)) {
        if (!input) return reply(`Usage: .${cmd} <text>`)
        await sock.updateProfileStatus(input); return reply('✅ Bio updated')
      }

      if (cmd === 'setname') {
        if (!input) return reply('Usage: .setname <new name>')
        await sock.updateProfileName(input); return reply(`✅ Name updated to: ${input}`)
      }

      if (cmd === 'setppbot') {
        const ctx = m.message?.extendedTextMessage?.contextInfo || {}
        const quoted = ctx.quotedMessage?.imageMessage
        const direct = m.message?.imageMessage
        const imgMsg = quoted || direct
        if (!imgMsg) return reply('❌ Reply an image with .setppbot')
        try {
          const stream = await downloadContentFromMessage(imgMsg, 'image')
          let buf = Buffer.from([])
          for await (const chunk of stream) buf = Buffer.concat([buf, chunk])
          await sock.updateProfilePicture(cleanId(sock.user.id), buf)
          return reply('✅ Bot PP updated')
        } catch (e) { return reply(`❌ ${e.message}`) }
      }

      if (cmd === 'getppbot') {
        try {
          const pp = await sock.profilePictureUrl(cleanId(sock.user.id), 'image')
          await sock.sendMessage(jid, { image: { url: pp }, caption: '🤖 Current Bot PP' }, { quoted: m })
        } catch { return reply('❌ No profile picture') }
        return
      }

      if (cmd === 'blocklist') {
        const blocks = await sock.fetchBlocklist().catch(() => [])
        const body = blocks.length ? blocks.map((b, i) => `${String(i + 1).padStart(2, '0')} › @${normNum(b)}`).join('\n') : 'Empty'
        return reply(`*Blocklist (${blocks.length})*\n${body}`)
      }

      if (cmd === 'block' || cmd === 'unblock') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || (input ? normNum(input) + '@s.whatsapp.net' : null)
        if (!user) return reply('❌ Tag or reply user')
        const target = user.includes('@') ? cleanId(user) : user + '@s.whatsapp.net'
        if (cmd === 'block' && isRealOwner(target, sock)) return reply('❌ Cannot block owner')
        await sock.updateBlockStatus(target, cmd)
        return reply(`${cmd === 'block' ? '🚫 Blocked' : '✅ Unblocked'} @${normNum(target)}`)
      }

      if (cmd === 'join') {
        if (!input) return reply('Usage: .join <invite link>')
        const code = input.split('/').pop().split('?')[0]
        await sock.groupAcceptInvite(code); return reply('✅ Joined successfully')
      }

      if (cmd === 'leave') {
        if (!jid.endsWith('@g.us')) return reply('❌ Use inside a group')
        await reply('👋 Leaving group...'); await sock.groupLeave(jid).catch(() => {}); return
      }

      if (cmd === 'creategroup') {
        if (!input) return reply('Usage: .creategroup Group Name')
        const users = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const g = await sock.groupCreate(input, users)
        return reply(`✅ Group Created\nName: ${input}\nID: ${g.id}`)
      }

      if (['setowner', 'addowner'].includes(cmd)) {
        if (!input) return reply('Usage: .addowner 234xxxxxxxxxx')
        const num = normNum(input)
        if (!num) return reply('❌ Invalid number')
        if (!cfg.owners.includes(num)) cfg.owners.push(num)
        saveOwner(cfg); return reply(`✅ Owner Added: ${num}\nTotal: ${cfg.owners.length}`)
      }

      if (cmd === 'delowner') {
        if (!input) return reply('Usage: .delowner 234xxxxxxxxxx')
        const num = normNum(input)
        if (getOwnerNumbers().length <= 1) return reply('❌ Cannot delete last owner')
        cfg.owners = cfg.owners.filter(o => normNum(o) !== num); saveOwner(cfg)
        return reply(`✅ Owner Removed: ${num}`)
      }

      if (['self', 'public', 'mode'].includes(cmd)) {
        if (cmd === 'self') cfg.mode = 'self'
        else if (cmd === 'public') cfg.mode = 'public'
        else if (cmd === 'mode') {
          if (!input) return reply(`Current mode: ${cfg.mode}\nUsage: .mode public / self`)
          cfg.mode = input.trim().toLowerCase()
        }
        saveOwner(cfg); return reply(`✅ Mode: ${cfg.mode}\n${cfg.mode === 'self' ? 'Only owner can use bot' : 'Everyone can use bot'}`)
      }

      if (cmd === 'ownermode') {
        if (!input) return reply(`Owner Mode: ${cfg.ownermode ? 'ON' : 'OFF'}`)
        cfg.ownermode = input.toLowerCase() === 'on'; saveOwner(cfg)
        return reply(`Owner Mode: ${cfg.ownermode ? 'ENABLED ✅' : 'DISABLED ❌'}`)
      }

      if (['pmblocker', 'anticall', 'callblock'].includes(cmd)) {
        if (!input) return reply(`${cmd}: ${cfg[cmd] ? 'ON ✅' : 'OFF ❌'}\nUsage: .${cmd} on / off`)
        cfg[cmd] = input.toLowerCase() === 'on'; saveOwner(cfg)
        return reply(`${cmd}: ${cfg[cmd] ? 'ENABLED ✅' : 'DISABLED ❌'}`)
      }

      if (['broadcast', 'bc', 'bcgc', 'bcall'].includes(cmd)) {
        if (!input) return reply('Usage: .bc <message>')
        const chats = await sock.groupFetchAllParticipating().catch(() => ({}))
        const groupIds = Object.keys(chats)
        let sent = 0
        for (const gid of groupIds) {
          await sock.sendMessage(gid, { text: `[SIMON MD BROADCAST]\n\n${input}` }).catch(() => {})
          sent++; await new Promise(r => setTimeout(r, 700))
        }
        return reply(`✅ Broadcast sent to ${sent} groups`)
      }

      if (cmd === 'backup') {
        try {
          const backupData = { owner: cfg, time: new Date().toISOString(), protection: global.simonDB?.protection || {}, auto: global.simonDB?.auto || {} }
          fs.writeFileSync(path.join(__dirname, '../database/backup.json'), JSON.stringify(backupData, null, 2))
          return reply('✅ Backup saved to database/backup.json')
        } catch (e) { return reply(`❌ ${e.message}`) }
      }

      if (cmd === 'restore') {
        try {
          const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/backup.json')))
          if (d.owner) saveOwner(d.owner)
          return reply('✅ Restored successfully')
        } catch { return reply('❌ No backup found') }
      }

      if (['cleartmp', 'tmpclean'].includes(cmd)) {
        try { await execPromise('rm -rf tmp/* && mkdir -p tmp') } catch {}
        return reply('✅ Tmp cleaned')
      }

      if (['logs', 'log'].includes(cmd)) {
        try { const { stdout } = await execPromise('tail -n 40 logs.txt 2>/dev/null || echo "No logs"'); return reply(`*Logs*\n${stdout.slice(0, 700)}`) } catch (e) { return reply(`❌ ${e.message}`) }
      }

      if (['system', 'sysinfo', 'hostinfo', 'botinfo', 'cpu', 'ram', 'disk'].includes(cmd)) {
        const mem = os.totalmem(); const free = os.freemem(); const cpus = os.cpus()
        return reply(`*System Info*\nHost: ${os.hostname()}\nOS: ${os.type()} ${os.arch()}\nPlatform: ${os.platform()}\nUptime: ${Math.floor(os.uptime() / 3600)}h\nCPU: ${cpus[0]?.model?.slice(0, 30)} (${cpus.length} cores)\nRAM: ${(free / 1024 / 1024 / 1024).toFixed(2)} GB free / ${(mem / 1024 / 1024 / 1024).toFixed(2)} GB\nNode: ${process.version}\nBot: SIMON MD\nOwners: ${getOwnerNumbers().join(', ')}`)
      }

      if (['ping', 'speed'].includes(cmd)) {
        const start = Date.now()
        await sock.sendMessage(jid, { text: '🏓 Pinging...' }, { quoted: m })
        const latency = Date.now() - start
        return reply(`*Ping*\nLatency: ${latency}ms\nSpeed: ${latency < 120 ? 'ULTRA FAST' : latency < 300 ? 'FAST' : 'NORMAL'}`)
      }

      if (['runtime', 'uptime'].includes(cmd)) {
        const up = process.uptime(); const h = Math.floor(up / 3600); const mm = Math.floor((up % 3600) / 60); const s = Math.floor(up % 60)
        return reply(`*Uptime*\n${h}h ${mm}m ${s}s`)
      }

      if (['version', 'changelog'].includes(cmd)) {
        return reply(`*SIMON MD*\nVersion: 2.5.0\nOwners: ${getOwnerNumbers().join(', ')}`)
      }

      if (cmd === 'reportbug') {
        if (!input) return reply('Usage: .reportbug <description>')
        const ownerJid = getOwnerNumbers()[0] + '@s.whatsapp.net'
        await sock.sendMessage(ownerJid, { text: `*Bug Report*\nFrom: @${senderNum}\nBug: ${input}`, mentions: [sender] }).catch(() => {})
        return reply('✅ Bug Reported - Sent to owner')
      }

    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Owner Error: ${e.message}` }, { quoted: m })
    }
  }
        }
