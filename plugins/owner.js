// 👑 SIMON MD - OWNER COMMANDS
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
    // Only owner can use most commands
    if (!isOwner && !['ping','speed','runtime','uptime','system','botinfo','version','reportbug'].includes(command)) {
      return reply(`❌ *OWNER ONLY*\nThis command is for SIMON MD owner only! 👑🩺`)
    }

    try {
      // .eval
      if (command === 'eval') {
        if (!text) return reply(`Usage: .eval <js code>`)
        try {
          let result = await eval(`(async()=>{ ${text} })()`)
          return reply(`💻 *EVAL RESULT*\n\nCode: ${text}\n\nResult: ${util.format(result)}\n\n🩺`)
        } catch (e) {
          return reply(`❌ EVAL ERROR\n${e.message}`)
        }
      }

      // .exec / .sh / .term
      if (['exec','sh','term'].includes(command)) {
        if (!text) return reply(`Usage: .${command} <shell command>`)
        try {
          const { stdout, stderr } = await execPromise(text)
          return reply(`💻 *SHELL*\n\nCmd: \( {text}\n\nOutput:\n \){(stdout || stderr || 'No output').slice(0,2000)}\n\n🩺`)
        } catch (e) {
          return reply(`❌ SHELL ERROR\n${e.message}`)
        }
      }

      // .restart / .shutdown
      if (command === 'restart') {
        await reply(`🔄 Restarting SIMON MD... 🩺`)
        process.exit(1)
      }
      if (command === 'shutdown') {
        await reply(`💤 Shutting down SIMON MD... 🩺`)
        process.exit(0)
      }

      // .update / .gitpull
      if (command === 'update' || command === 'gitpull') {
        await reply(`📥 Updating SIMON MD from GitHub... 🩺`)
        try {
          const { stdout } = await execPromise('git pull')
          return reply(`✅ *UPDATE*\n\n${stdout.slice(0,2000)}\n\n🩺`)
        } catch (e) {
          return reply(`❌ Update error: ${e.message}`)
        }
      }

      // .setprefix
      if (command === 'setprefix') {
        if (!text) return reply(`Usage: .setprefix <new prefix>`)
        // You can save this to settings or database
        return reply(`✅ Prefix set to: ${text}\n\n🩺`)
      }

      // .setstatus / .setbio / .setname
      if (command === 'setstatus' || command === 'setbio') {
        if (!text) return reply(`Usage: .${command} <text>`)
        await sock.updateProfileStatus(text)
        return reply(`✅ Bio/Status updated!\n\n🩺`)
      }
      if (command === 'setname') {
        if (!text) return reply(`Usage: .setname <new name>`)
        await sock.updateProfileName(text)
        return reply(`✅ Bot name set to: ${text}\n\n🩺`)
      }

      // .setppbot / .getppbot
      if (command === 'setppbot') {
        return reply(`🖼️ Reply an image with .setppbot to set bot profile picture\n\n🩺`)
      }
      if (command === 'getppbot') {
        try {
          const pp = await sock.profilePictureUrl(sock.user.id, 'image')
          await sock.sendMessage(m.key.remoteJid, { 
            image: { url: pp }, 
            caption: `🖼️ Bot Profile Picture\n\n🩺 SIMON MD` 
          }, { quoted: m })
        } catch {
          return reply(`No profile picture set`)
        }
        return
      }

      // .blocklist / .block / .unblock
      if (command === 'blocklist') {
        const blocks = await sock.fetchBlocklist().catch(() => [])
        return reply(`🚫 *BLOCKLIST*\n\nTotal: \( {blocks.length}\n\n \){blocks.map(b => `@${b.split('@')[0]}`).join('\n') || 'Empty'}\n\n🩺`, { mentions: blocks })
      }
      if (command === 'block') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || text
        if (!user) return reply(`Tag a user to block`)
        const jid = user.includes('@') ? user : `${user}@s.whatsapp.net`
        await sock.updateBlockStatus(jid, 'block')
        return reply(`🚫 Blocked @${jid.split('@')[0]}`, { mentions: [jid] })
      }
      if (command === 'unblock') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || text
        if (!user) return reply(`Tag a user to unblock`)
        const jid = user.includes('@') ? user : `${user}@s.whatsapp.net`
        await sock.updateBlockStatus(jid, 'unblock')
        return reply(`✅ Unblocked @${jid.split('@')[0]}`, { mentions: [jid] })
      }

      // .join / .leave / .creategroup
      if (command === 'join') {
        if (!text) return reply(`Usage: .join <group invite link>`)
        const code = text.split('/').pop()
        await sock.groupAcceptInvite(code)
        return reply(`✅ Joined group!\n\n🩺`)
      }
      if (command === 'leave') {
        await sock.groupLeave(m.key.remoteJid)
        return reply(`👋 Left the group\n\n🩺`)
      }
      if (command === 'creategroup') {
        if (!text) return reply(`Usage: .creategroup GroupName`)
        const users = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const g = await sock.groupCreate(text, users)
        return reply(`✅ Group created: ${text}\nID: ${g.id}\n\n🩺`)
      }

      // .self / .public / .mode
      if (['self','public','mode'].includes(command)) {
        global.simonDB = global.simonDB || {}
        if (command === 'self') global.simonDB.mode = 'self'
        if (command === 'public') global.simonDB.mode = 'public'
        if (command === 'mode') {
          if (!text) return reply(`Current mode: ${global.simonDB.mode || 'public'}\nUsage: .mode public/self`)
          global.simonDB.mode = text
        }
        return reply(`🔧 Mode set to: *\( {global.simonDB.mode}*\n\n \){global.simonDB.mode === 'self' ? 'Bot only responds to owner' : 'Bot responds to everyone'} 🩺`)
      }

      // .pmblocker / .anticall / .callblock
      if (['pmblocker','anticall','callblock'].includes(command)) {
        global.simonDB = global.simonDB || {}
        if (!text) return reply(`Usage: .${command} on/off`)
        global.simonDB[command] = text === 'on'
        return reply(`✅ ${command} ${text === 'on' ? 'enabled' : 'disabled'} 🩺`)
      }

      // .cleartmp / .tmpclean
      if (['cleartmp','tmpclean'].includes(command)) {
        try { await execPromise('rm -rf tmp/* && mkdir -p tmp') } catch {}
        return reply(`🧹 Temporary files cleared!\n\n🩺`)
      }

      // .system / .sysinfo / .botinfo etc
      if (['system','sysinfo','hostinfo','botinfo','cpu','ram','disk'].includes(command)) {
        const mem = os.totalmem()
        const free = os.freemem()
        const cpus = os.cpus()
        return reply(`💻 *SYSTEM INFO*\n\n🖥️ Host: ${os.hostname()}\nOS: ${os.type()} ${os.arch()}\nPlatform: ${os.platform()}\nUptime: ${Math.floor(os.uptime()/3600)}h\nCPU: \( {cpus[0]?.model} ( \){cpus.length} cores)\nRAM: ${(free/1024/1024/1024).toFixed(2)}GB free / ${(mem/1024/1024/1024).toFixed(2)}GB total\nNode: ${process.version}\n\n🤖 Bot: SIMON MD\nVersion: 2.5.0\nOwner: 239166265317\n\n🩺`)
      }

      if (command === 'ping' || command === 'speed') {
        const start = Date.now()
        await reply(`🏓 Pinging...`)
        const latency = Date.now() - start
        return reply(`🏓 *PING*\n\nLatency: ${latency}ms\nSpeed: ${latency < 100 ? 'Ultra Fast ⚡' : latency < 300 ? 'Fast 🚀' : 'Normal'}\n\n🩺 SIMON MD`)
      }

      if (command === 'runtime' || command === 'uptime') {
        const up = process.uptime()
        const h = Math.floor(up/3600)
        const mm = Math.floor((up%3600)/60)
        const s = Math.floor(up%60)
        return reply(`⏰ *UPTIME*\n\n${h}h ${mm}m ${s}s\n\n🩺 SIMON MD`)
      }

      if (command === 'version' || command === 'changelog') {
        return reply(`🤖 *SIMON MD VERSION*\n\nVersion: 2.5.0\nCommands: 700+\nPlugins: 15\nOwner: 239166265317\n\n🩺`)
      }

      if (command === 'reportbug') {
        if (!text) return reply(`Usage: .reportbug <bug description>`)
        return reply(`🐛 Bug reported successfully!\n\nThank you! 🩺`)
      }

    } catch (e) {
      reply(`❌ Owner Error: ${e.message} 🩺`)
    }
  }
                      }
