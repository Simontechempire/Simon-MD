// 🛡️ SIMON MD - Owner Plugin (Clean + Fixed)
const os = require('os')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

const DB_PATH = path.join(__dirname, '../database/owner.json')

function loadOwner() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH))
  } catch {
    return {
      owners: ['239166265317'],
      prefix: '.',
      mode: 'public',
      pmblocker: false,
      anticall: false,
      callblock: false,
      ownermode: false
    }
  }
}

function saveOwner(d) {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  }
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

function normNum(n) {
  return String(n || '').replace(/[^0-9]/g, '').replace(/^0+/, '')
}

function getOwnerNumbers() {
  const cfg = getOwnerCfg()
  const list = []

  // 1. Environment variables (highest priority)
  const envRaw = process.env.OWNER_NUMBER || process.env.OWNER_NUMBERS || process.env.OWNER || ''
  if (envRaw) {
    String(envRaw).split(/[,;|\s]+/).forEach(x => {
      const n = normNum(x)
      if (n) list.push(n)
    })
  }

  // 2. config file
  try {
    const cfgFile = require('../config') || require('../settings')
    const cOwners = cfgFile.owner || cfgFile.owners || cfgFile.OWNER_NUMBER
    if (cOwners) {
      (Array.isArray(cOwners) ? cOwners : [cOwners]).forEach(x => {
        const n = normNum(x)
        if (n) list.push(n)
      })
    }
  } catch {}

  // 3. database
  if (cfg.owners && Array.isArray(cfg.owners)) {
    cfg.owners.forEach(x => {
      const n = normNum(x)
      if (n) list.push(n)
    })
  }

  // 4. Fallback
  if (!list.length) list.push('239166265317')

  return [...new Set(list)]
}

function isRealOwner(sender, sock = null) {
  const num = normNum(sender)
  if (!num) return false
  return getOwnerNumbers().includes(num)
}

function getBotNum(sock) {
  try {
    return normNum(sock?.user?.id)
  } catch {
    return ''
  }
}

function attachEngine(sock) {
  if (sock.__ownerEngineLoaded) return
  sock.__ownerEngineLoaded = true

  // PM Blocker
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const cfg = getOwnerCfg()
    if (!cfg.pmblocker) return

    for (const m of messages) {
      try {
        if (m.key.fromMe) continue
        const jid = m.key.remoteJid
        if (!jid || !jid.endsWith('@s.whatsapp.net')) continue

        const sender = m.key.participant || jid
        if (isRealOwner(sender, sock)) continue

        await sock.updateBlockStatus(jid, 'block').catch(() => {})
      } catch {}
    }
  })

  // Anti Call
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

  console.log('[OWNER] Engine loaded')
}

module.exports = {
  command: [
    'eval', 'exec', 'sh', 'term', 'restart', 'shutdown', 'update', 'gitpull',
    'setprefix', 'setstatus', 'setbio', 'setname', 'setppbot', 'getppbot',
    'blocklist', 'block', 'unblock', 'join', 'leave', 'creategroup', 'deletegroup',
    'setowner', 'addowner', 'delowner', 'ownermode', 'self', 'public', 'mode',
    'pmblocker', 'anticall', 'callblock', 'backup', 'restore', 'broadcast', 'bc', 'bcgc', 'bcall',
    'cleartmp', 'tmpclean', 'logs', 'log', 'system', 'sysinfo', 'ping', 'speed',
    'runtime', 'uptime', 'cpu', 'ram', 'disk', 'hostinfo', 'botinfo', 'version', 'changelog', 'reportbug'
  ],

  attachEngine,
  isRealOwner,
  getOwnerNumbers,
  getBotNum,

  execute: async (sock, m, { command, text }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const senderNum = normNum(sender)
    const cfg = getOwnerCfg()

    try { await reactAwait(sock, jid, m.key) } catch {}

    const realOwner = isRealOwner(senderNum, sock)

    // Public commands that anyone can use
    const publicAllowed = ['ping', 'speed', 'runtime', 'uptime', 'system', 'botinfo', 'version', 'reportbug']

    if (!realOwner && !publicAllowed.includes(command)) {
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    // Self mode
    if (cfg.mode === 'self' && !realOwner) {
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    const treply = async (title, lines, mentions = []) => {
      await sock.sendMessage(jid, {
        text: box(title, Array.isArray(lines) ? lines : [lines]),
        mentions
      }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
    }

    try {
      // ==================== EVAL ====================
      if (command === 'eval') {
        if (!text) return treply('Eval', [line('usage', '.eval <js code>')])
        try {
          const result = await eval(`(async () => { ${text} })()`)
          return treply('Eval Result', [
            line('code', text.slice(0, 150)),
            line('result', String(util.format(result)).slice(0, 700))
          ])
        } catch (e) {
          return treply('Eval Error', [line('error', e.message)])
        }
      }

      // ==================== EXEC / SHELL ====================
      if (['exec', 'sh', 'term'].includes(command)) {
        if (!text) return treply('Shell', [line('usage', `.${command} <command>`)])
        try {
          const { stdout, stderr } = await execPromise(text, { timeout: 20000 })
          return treply('Shell Output', [
            line('cmd', text),
            line('output', (stdout || stderr || 'No output').slice(0, 800))
          ])
        } catch (e) {
          return treply('Shell Error', [line('error', e.message.slice(0, 500))])
        }
      }

      // ==================== RESTART / SHUTDOWN ====================
      if (command === 'restart') {
        await treply('Restart', [line('status', 'Restarting SIMON MD...')])
        setTimeout(() => process.exit(1), 1200)
        return
      }

      if (command === 'shutdown') {
        await treply('Shutdown', [line('status', 'Shutting down...')])
        setTimeout(() => process.exit(0), 1200)
        return
      }

      // ==================== UPDATE ====================
      if (['update', 'gitpull'].includes(command)) {
        await sock.sendMessage(jid, {
          text: box('Update', [line('status', 'Pulling from GitHub...')])
        }, { quoted: m })
        try {
          const { stdout } = await execPromise('git pull', { timeout: 30000 })
          return treply('Update Done', [line('output', stdout.slice(0, 700))])
        } catch (e) {
          return treply('Update Error', [line('error', e.message)])
        }
      }

      // ==================== SET PREFIX ====================
      if (command === 'setprefix') {
        if (!text) return treply('Set Prefix', [
          line('current', cfg.prefix),
          line('usage', '.setprefix <new>')
        ])
        cfg.prefix = text.trim()
        saveOwner(cfg)
        global.prefix = cfg.prefix
        return treply('Prefix Updated', [line('prefix', cfg.prefix)])
      }

      // ==================== SET BIO / NAME ====================
      if (['setstatus', 'setbio'].includes(command)) {
        if (!text) return treply('Set Bio', [line('usage', `.${command} <text>`)])
        await sock.updateProfileStatus(text)
        return treply('Bio Updated', [line('status', 'Success')])
      }

      if (command === 'setname') {
        if (!text) return treply('Set Name', [line('usage', '.setname <new name>')])
        await sock.updateProfileName(text)
        return treply('Name Updated', [line('name', text)])
      }

      // ==================== BOT PROFILE PICTURE ====================
      if (command === 'setppbot') {
        const ctx = m.message?.extendedTextMessage?.contextInfo || {}
        const quoted = ctx.quotedMessage?.imageMessage
        const direct = m.message?.imageMessage
        const imgMsg = quoted || direct

        if (!imgMsg) return treply('Set Bot PP', [line('error', 'Reply an image with .setppbot')])

        try {
          const stream = await downloadContentFromMessage(imgMsg, 'image')
          let buf = Buffer.from([])
          for await (const chunk of stream) buf = Buffer.concat([buf, chunk])
          await sock.updateProfilePicture(sock.user.id, buf)
          return treply('Bot PP', [line('status', 'Profile picture updated')])
        } catch (e) {
          return treply('Bot PP', [line('error', e.message)])
        }
      }

      if (command === 'getppbot') {
        try {
          const pp = await sock.profilePictureUrl(sock.user.id, 'image')
          await sock.sendMessage(jid, {
            image: { url: pp },
            caption: box('Bot Picture', [line('status', 'Current PP')])
          }, { quoted: m })
          try { await reactCmd(sock, jid, m.key, command) } catch {}
          try { await reactDone(sock, jid, m.key) } catch {}
        } catch {
          return treply('Bot PP', [line('error', 'No profile picture')])
        }
        return
      }

      // ==================== BLOCK SYSTEM ====================
      if (command === 'blocklist') {
        const blocks = await sock.fetchBlocklist().catch(() => [])
        const body = blocks.length
          ? blocks.map((b, i) => `\( {String(i + 1).padStart(2, '0')} › @ \){normNum(b)}`).join('\n')
          : 'Empty'
        return treply(`Blocklist (${blocks.length})`, [line('list', body)], blocks)
      }

      if (command === 'block') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
          m.message?.extendedTextMessage?.contextInfo?.participant ||
          (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

        if (!user) return treply('Block', [line('error', 'Tag or reply user')])
        const target = user.includes('@') ? user : user + '@s.whatsapp.net'

        if (isRealOwner(target)) return treply('Block', [line('error', 'Cannot block owner')])

        await sock.updateBlockStatus(target, 'block')
        return treply('Blocked', [line('user', `@${normNum(target)}`)], [target])
      }

      if (command === 'unblock') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
          m.message?.extendedTextMessage?.contextInfo?.participant ||
          (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

        if (!user) return treply('Unblock', [line('error', 'Tag or reply user')])
        const target = user.includes('@') ? user : user + '@s.whatsapp.net'

        await sock.updateBlockStatus(target, 'unblock')
        return treply('Unblocked', [line('user', `@${normNum(target)}`)], [target])
      }

      // ==================== JOIN / LEAVE ====================
      if (command === 'join') {
        if (!text) return treply('Join', [line('usage', '.join <invite link>')])
        const code = text.split('/').pop().split('?')[0]
        await sock.groupAcceptInvite(code)
        return treply('Joined', [line('status', 'Successfully joined')])
      }

      if (command === 'leave') {
        if (!jid.endsWith('@g.us')) return treply('Leave', [line('error', 'Use inside a group')])
        await treply('Leave', [line('status', 'Leaving group...')])
        await sock.groupLeave(jid).catch(() => {})
        return
      }

      // ==================== CREATE GROUP ====================
      if (command === 'creategroup') {
        if (!text) return treply('Create Group', [line('usage', '.creategroup Group Name')])
        const users = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const g = await sock.groupCreate(text, users)
        return treply('Group Created', [
          line('name', text),
          line('id', g.id)
        ])
      }

      // ==================== OWNER MANAGEMENT ====================
      if (['setowner', 'addowner'].includes(command)) {
        if (!text) return treply('Add Owner', [line('usage', '.addowner 234xxxxxxxxxx')])
        const num = normNum(text)
        if (!num) return treply('Add Owner', [line('error', 'Invalid number')])

        if (!cfg.owners.includes(num)) cfg.owners.push(num)
        saveOwner(cfg)
        return treply('Owner Added', [
          line('owner', num),
          line('total', `${cfg.owners.length}`)
        ])
      }

      if (command === 'delowner') {
        if (!text) return treply('Del Owner', [line('usage', '.delowner 234xxxxxxxxxx')])
        const num = normNum(text)

        if (getOwnerNumbers().length <= 1) {
          return treply('Del Owner', [line('error', 'Cannot delete the last owner')])
        }

        cfg.owners = cfg.owners.filter(o => normNum(o) !== num)
        saveOwner(cfg)
        return treply('Owner Removed', [line('owner', num)])
      }

      // ==================== MODE ====================
      if (['self', 'public', 'mode'].includes(command)) {
        if (command === 'self') cfg.mode = 'self'
        else if (command === 'public') cfg.mode = 'public'
        else if (command === 'mode') {
          if (!text) return treply('Mode', [
            line('current', cfg.mode),
            line('usage', '.mode public / self')
          ])
          cfg.mode = text.trim().toLowerCase()
        }

        saveOwner(cfg)
        return treply('Mode Updated', [
          line('mode', cfg.mode),
          line('info', cfg.mode === 'self' ? 'Only owner can use the bot' : 'Everyone can use the bot')
        ])
      }

      if (command === 'ownermode') {
        if (!text) return treply('Owner Mode', [line('current', cfg.ownermode ? 'ON' : 'OFF')])
        cfg.ownermode = text === 'on'
        saveOwner(cfg)
        return treply('Owner Mode', [line('status', cfg.ownermode ? 'ENABLED' : 'DISABLED')])
      }

      // ==================== PM BLOCKER / ANTICALL ====================
      if (['pmblocker', 'anticall', 'callblock'].includes(command)) {
        if (!text) return treply(command, [
          line('current', cfg[command] ? 'ON' : 'OFF'),
          line('usage', `.${command} on / off`)
        ])
        cfg[command] = text === 'on'
        saveOwner(cfg)
        return treply(command, [line('status', cfg[command] ? 'ENABLED ✅' : 'DISABLED ❌')])
      }

      // ==================== BROADCAST ====================
      if (['broadcast', 'bc', 'bcgc', 'bcall'].includes(command)) {
        if (!text) return treply('Broadcast', [line('usage', '.bc <message>')])
        const chats = await sock.groupFetchAllParticipating().catch(() => ({}))
        const groupIds = Object.keys(chats)
        let sent = 0

        for (const gid of groupIds) {
          await sock.sendMessage(gid, {
            text: tiny(`[SIMON MD BROADCAST]\n\n${text}`)
          }).catch(() => {})
          sent++
          await new Promise(r => setTimeout(r, 700))
        }

        return treply('Broadcast', [
          line('sent', `${sent} groups`),
          line('message', text.slice(0, 80))
        ])
      }

      // ==================== BACKUP / RESTORE ====================
      if (command === 'backup') {
        try {
          const backupData = {
            owner: cfg,
            time: new Date().toISOString(),
            protection: global.simonDB?.protection || {},
            auto: global.simonDB?.auto || {}
          }
          const p = path.join(__dirname, '../database/backup.json')
          fs.writeFileSync(p, JSON.stringify(backupData, null, 2))
          return treply('Backup', [line('status', 'Saved to database/backup.json')])
        } catch (e) {
          return treply('Backup', [line('error', e.message)])
        }
      }

      if (command === 'restore') {
        try {
          const p = path.join(__dirname, '../database/backup.json')
          const d = JSON.parse(fs.readFileSync(p))
          if (d.owner) saveOwner(d.owner)
          return treply('Restore', [line('status', 'Restored successfully')])
        } catch {
          return treply('Restore', [line('error', 'No backup found')])
        }
      }

      // ==================== SYSTEM ====================
      if (['cleartmp', 'tmpclean'].includes(command)) {
        try { await execPromise('rm -rf tmp/* && mkdir -p tmp') } catch {}
        return treply('Tmp Cleaned', [line('status', 'Temporary files cleared')])
      }

      if (['logs', 'log'].includes(command)) {
        try {
          const { stdout } = await execPromise('tail -n 40 logs.txt 2>/dev/null || echo "No logs"')
          return treply('Logs', [line('logs', stdout.slice(0, 700))])
        } catch (e) {
          return treply('Logs', [line('error', e.message)])
        }
      }

      if (['system', 'sysinfo', 'hostinfo', 'botinfo', 'cpu', 'ram', 'disk'].includes(command)) {
        const mem = os.totalmem()
        const free = os.freemem()
        const cpus = os.cpus()

        return treply('System Info', [
          line('host', os.hostname()),
          line('os', `${os.type()} ${os.arch()}`),
          line('platform', os.platform()),
          line('uptime', `${Math.floor(os.uptime() / 3600)}h`),
          line('cpu', `\( {cpus[0]?.model?.slice(0, 30)} ( \){cpus.length} cores)`),
          line('ram', `${(free / 1024 / 1024 / 1024).toFixed(2)} GB free / ${(mem / 1024 / 1024 / 1024).toFixed(2)} GB`),
          line('node', process.version),
          line('bot', 'SIMON MD'),
          line('owners', getOwnerNumbers().join(', '))
        ])
      }

      if (['ping', 'speed'].includes(command)) {
        const start = Date.now()
        await sock.sendMessage(jid, { text: box('Ping', [line('status', 'Pinging...')]) }, { quoted: m })
        const latency = Date.now() - start
        return treply('Ping', [
          line('latency', `${latency}ms`),
          line('speed', latency < 120 ? 'ULTRA FAST' : latency < 300 ? 'FAST' : 'NORMAL')
        ])
      }

      if (['runtime', 'uptime'].includes(command)) {
        const up = process.uptime()
        const h = Math.floor(up / 3600)
        const m = Math.floor((up % 3600) / 60)
        const s = Math.floor(up % 60)
        return treply('Uptime', [line('uptime', `${h}h ${m}m ${s}s`)])
      }

      if (['version', 'changelog'].includes(command)) {
        return treply('SIMON MD', [
          line('version', '2.5.0'),
          line('owners', getOwnerNumbers().join(', '))
        ])
      }

      if (command === 'reportbug') {
        if (!text) return treply('Report Bug', [line('usage', '.reportbug <description>')])
        const ownerJid = getOwnerNumbers()[0] + '@s.whatsapp.net'
        await sock.sendMessage(ownerJid, {
          text: box('Bug Report', [
            line('from', `@${senderNum}`),
            line('bug', text)
          ]),
          mentions: [sender]
        }).catch(() => {})
        return treply('Bug Reported', [line('status', 'Sent to owner')])
      }

    } catch (e) {
      await sock.sendMessage(jid, {
        text: box('Owner Error', [line('error', e.message)])
      }, { quoted: m })
      try { await reactDone(sock, jid, m.key) } catch {}
    }
  }
    }
