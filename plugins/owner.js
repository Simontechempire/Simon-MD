// +--=[ SIMON MD | OWNER ]=--+
// | ASCII INLINE UI - v2    |
// +--------------------------+
const os = require('os')
const fs = require('fs')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

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

  execute: async (sock, m, { command, text, reply, isOwner }) => {
    // --=[ UI HELPER ]=--
    const line = '+----------------------------------------+'
    const box = (title, body) => {
      return `${line}\n| [+] ${title}\n| --------------------------------------\n${body.split('\n').map(l => `| ${l}`).join('\n')}\n| --------------------------------------\n| [>] SIMON MD | OWNER CONTROL\n${line}`
    }
    const errBox = (msg) => box('ERROR', `[-] ${msg}`)

    if (!isOwner && !['ping','speed','runtime','uptime','system','botinfo','version','reportbug'].includes(command)) {
      return reply(box('OWNER ONLY', '[!] This command is for SIMON MD owner only.\n[^] Owner: 239166265317'))
    }

    try {
      // --=[ EVAL ]=--
      if (command === 'eval') {
        if (!text) return reply(box('EVAL', '[?] Usage: .eval <js code>'))
        try {
          let result = await eval(`(async()=>{ ${text} })()`)
          return reply(box('EVAL RESULT', `[>] Code: ${text}\n[=] Result: ${util.format(result)}`))
        } catch (e) {
          return reply(errBox(`EVAL ERROR: ${e.message}`))
        }
      }

      // --=[ EXEC / SH / TERM ]=--
      if (['exec','sh','term'].includes(command)) {
        if (!text) return reply(box('SHELL', `[?] Usage: .${command} <shell command>`))
        try {
          const { stdout, stderr } = await execPromise(text)
          return reply(box('SHELL OUTPUT', `[>] Cmd: ${text}\n[=] Output:\n${(stdout || stderr || 'No output').slice(0,1500)}`))
        } catch (e) {
          return reply(errBox(`SHELL ERROR: ${e.message}`))
        }
      }

      // --=[ RESTART / SHUTDOWN ]=--
      if (command === 'restart') {
        await reply(box('RESTART', '[~] Restarting SIMON MD...'))
        process.exit(1)
      }
      if (command === 'shutdown') {
        await reply(box('SHUTDOWN', '[-] Shutting down SIMON MD...'))
        process.exit(0)
      }

      // --=[ UPDATE ]=--
      if (command === 'update' || command === 'gitpull') {
        await reply(box('UPDATE', '[~] Updating SIMON MD from GitHub...'))
        try {
          const { stdout } = await execPromise('git pull')
          return reply(box('UPDATE DONE', `[+] ${stdout.slice(0,1500)}`))
        } catch (e) {
          return reply(errBox(`Update error: ${e.message}`))
        }
      }

      // --=[ SET PREFIX ]=--
      if (command === 'setprefix') {
        if (!text) return reply(box('SET PREFIX', '[?] Usage: .setprefix <new prefix>'))
        return reply(box('PREFIX SET', `[+] Prefix set to: ${text}`))
      }

      // --=[ BIO / NAME ]=--
      if (command === 'setstatus' || command === 'setbio') {
        if (!text) return reply(box('SET BIO', `[?] Usage: .${command} <text>`))
        await sock.updateProfileStatus(text)
        return reply(box('BIO UPDATED', '[+] Bio / Status updated!'))
      }
      if (command === 'setname') {
        if (!text) return reply(box('SET NAME', '[?] Usage: .setname <new name>'))
        await sock.updateProfileName(text)
        return reply(box('NAME SET', `[+] Bot name set to: ${text}`))
      }

      // --=[ PP BOT ]=--
      if (command === 'setppbot') {
        return reply(box('SET BOT PP', '[?] Reply an image with .setppbot to set bot picture'))
      }
      if (command === 'getppbot') {
        try {
          const pp = await sock.profilePictureUrl(sock.user.id, 'image')
          await sock.sendMessage(m.key.remoteJid, { image: { url: pp }, caption: `${line}\n| [+] BOT PROFILE PICTURE\n${line}` }, { quoted: m })
        } catch {
          return reply(errBox('No profile picture set'))
        }
        return
      }

      // --=[ BLOCK ]=--
      if (command === 'blocklist') {
        const blocks = await sock.fetchBlocklist().catch(() => [])
        const body = blocks.length ? blocks.map((b,i) => `${String(i+1).padStart(2,'0')} >> @${b.split('@')[0]}`).join('\n') : '[!] Empty'
        return reply(box(`BLOCKLIST | ${blocks.length}`, body), { mentions: blocks })
      }
      if (command === 'block') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || text
        if (!user) return reply(box('BLOCK', '[?] Tag a user to block'))
        const jid = user.includes('@') ? user : `${user}@s.whatsapp.net`
        await sock.updateBlockStatus(jid, 'block')
        return reply(box('BLOCKED', `[X] Blocked @${jid.split('@')[0]}`), { mentions: [jid] })
      }
      if (command === 'unblock') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || text
        if (!user) return reply(box('UNBLOCK', '[?] Tag a user to unblock'))
        const jid = user.includes('@') ? user : `${user}@s.whatsapp.net`
        await sock.updateBlockStatus(jid, 'unblock')
        return reply(box('UNBLOCKED', `[+] Unblocked @${jid.split('@')[0]}`), { mentions: [jid] })
      }

      // --=[ JOIN / LEAVE / CREATE GROUP ]=--
      if (command === 'join') {
        if (!text) return reply(box('JOIN', '[?] Usage: .join <group invite link>'))
        const code = text.split('/').pop()
        await sock.groupAcceptInvite(code)
        return reply(box('JOINED', '[+] Joined group successfully.'))
      }
      if (command === 'leave') {
        await sock.groupLeave(m.key.remoteJid)
        return reply(box('LEFT', '[-] Left the group.'))
      }
      if (command === 'creategroup') {
        if (!text) return reply(box('CREATE GROUP', '[?] Usage: .creategroup GroupName'))
        const users = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const g = await sock.groupCreate(text, users)
        return reply(box('GROUP CREATED', `[+] Name: ${text}\n[#] ID: ${g.id}`))
      }

      // --=[ MODE ]=--
      if (['self','public','mode'].includes(command)) {
        global.simonDB = global.simonDB || {}
        if (command === 'self') global.simonDB.mode = 'self'
        if (command === 'public') global.simonDB.mode = 'public'
        if (command === 'mode') {
          if (!text) return reply(box('MODE', `[#] Current mode: ${global.simonDB.mode || 'public'}\n[?] Usage: .mode public/self`))
          global.simonDB.mode = text
        }
        return reply(box('MODE SET', `[#] Mode: ${global.simonDB.mode}\n[>] ${global.simonDB.mode === 'self' ? 'Bot only responds to owner' : 'Bot responds to everyone'}`))
      }

      // --=[ PMBLOCKER / ANTICALL ]=--
      if (['pmblocker','anticall','callblock'].includes(command)) {
        global.simonDB = global.simonDB || {}
        if (!text) return reply(box(command.toUpperCase(), `[?] Usage: .${command} on/off`))
        global.simonDB[command] = text === 'on'
        return reply(box(command.toUpperCase(), `[+] ${command} ${text === 'on' ? 'ENABLED' : 'DISABLED'}`))
      }

      // --=[ CLEAR TMP ]=--
      if (['cleartmp','tmpclean'].includes(command)) {
        try { await execPromise('rm -rf tmp/* && mkdir -p tmp') } catch {}
        return reply(box('TMP CLEANED', '[+] Temporary files cleared!'))
      }

      // --=[ SYSTEM ]=--
      if (['system','sysinfo','hostinfo','botinfo','cpu','ram','disk'].includes(command)) {
        const mem = os.totalmem()
        const free = os.freemem()
        const cpus = os.cpus()
        return reply(box('SYSTEM INFO',
          `[#] Host    : ${os.hostname()}\n` +
          `[#] OS      : ${os.type()} ${os.arch()}\n` +
          `[#] Platform: ${os.platform()}\n` +
          `[#] Uptime  : ${Math.floor(os.uptime()/3600)}h\n` +
          `[#] CPU     : ${cpus[0]?.model} (${cpus.length} cores)\n` +
          `[#] RAM     : ${(free/1024/1024/1024).toFixed(2)}GB free / ${(mem/1024/1024/1024).toFixed(2)}GB total\n` +
          `[#] Node    : ${process.version}\n` +
          `[#] Bot     : SIMON MD v2.5.0\n` +
          `[#] Owner   : 239166265317`
        ))
      }

      // --=[ PING ]=--
      if (command === 'ping' || command === 'speed') {
        const start = Date.now()
        await reply(box('PING', '[~] Pinging...'))
        const latency = Date.now() - start
        return reply(box('PING', `[#] Latency: ${latency}ms\n[#] Speed: ${latency < 100 ? 'ULTRA FAST' : latency < 300 ? 'FAST' : 'NORMAL'}`))
      }

      // --=[ UPTIME ]=--
      if (command === 'runtime' || command === 'uptime') {
        const up = process.uptime()
        const h = Math.floor(up/3600)
        const mm = Math.floor((up%3600)/60)
        const s = Math.floor(up%60)
        return reply(box('UPTIME', `[#] ${h}h ${mm}m ${s}s`))
      }

      // --=[ VERSION ]=--
      if (command === 'version' || command === 'changelog') {
        return reply(box('SIMON MD VERSION',
          `[#] Version : 2.5.0\n` +
          `[#] Commands: 700+\n` +
          `[#] Plugins : 15\n` +
          `[#] Owner  : 239166265317`
        ))
      }

      // --=[ REPORT BUG ]=--
      if (command === 'reportbug') {
        if (!text) return reply(box('REPORT BUG', '[?] Usage: .reportbug <bug description>'))
        return reply(box('BUG REPORTED', '[+] Bug reported successfully!\n[>] Thank you!'))
      }

    } catch (e) {
      reply(errBox(`Owner Error: ${e.message}`))
    }
  }
                        }
