// ⚙️ SIMON MD - Bot Settings Plugin | 16 Cmds - Sudo + Prefix + Mode + Health
const fs = require('fs')
const path = require('path')
const os = require('os')

const DB_PATH = path.join(__dirname, '../database/botsettings.json')
const CREATOR = '2349037483649'

function loadSettings() {
  try { return JSON.parse(fs.readFileSync(DB_PATH)) } catch {
    return {
      botName: 'SIMON MD',
      prefix: '.',
      welcome: 'ON',
      goodbye: 'ON',
      welcomeMsg: 'Welcome @user to @group 🎉',
      goodbyeMsg: 'Goodbye @user 👋',
      menuType: 'image',
      footer: '© SIMON MD',
      timezone: 'Africa/Lagos',
      language: 'en',
      autoReact: 'OFF',
      autoStatusView: 'OFF',
      sudo: [], // <-- Sudo owners list
      buttonMenu: 'normal', // normal / button
      mode: 'public' // public / private
    }
  }
}

function saveSettings(d) {
  if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2))
  global.simonDB = global.simonDB || {}
  global.simonDB.botSettings = d
  global.simonDB.prefix = d.prefix
  global.simonDB.mode = d.mode
  return d
}

function getSettings() {
  if (!global.simonDB?.botSettings) {
    const d = loadSettings()
    // fix old file wey no get new fields
    if (!d.sudo) d.sudo = []
    if (!d.buttonMenu) d.buttonMenu = 'normal'
    if (!d.mode) d.mode = 'public'
    global.simonDB = { ...global.simonDB, botSettings: d, prefix: d.prefix, mode: d.mode }
  }
  return global.simonDB.botSettings
}

function normNum(n) { return String(n || '').replace(/[^0-9]/g, '').replace(/^0+/, '') }
function normId(id) { return String(id || '').split(':')[0].split('@')[0] }

function isCreator(m, sock) {
  const candidates = []
  if (m.key?.participant) candidates.push(normNum(m.key.participant))
  if (m.key?.participantAlt) candidates.push(normNum(m.key.participantAlt))
  if (m.participant) candidates.push(normNum(m.participant))
  if (m.participantAlt) candidates.push(normNum(m.participantAlt))
  if (m.key?.remoteJid) candidates.push(normNum(m.key.remoteJid))
  return candidates.some(n => n && n === CREATOR)
}

function isOwnerOrSudo(m, sock) {
  const cfg = getSettings()
  const candidates = []
  if (m.key?.participant) candidates.push(normNum(m.key.participant))
  if (m.key?.participantAlt) candidates.push(normNum(m.key.participantAlt))
  if (m.participant) candidates.push(normNum(m.participant))
  if (m.participantAlt) candidates.push(normNum(m.participantAlt))
  if (m.key?.remoteJid) candidates.push(normNum(m.key.remoteJid))
  if (sock?.user?.id) candidates.push(normNum(sock.user.id))
  // Creator + Linker + Sudo list
  return candidates.some(n => n && (n === CREATOR || n === normNum(sock?.user?.id) || (cfg.sudo || []).map(x => normNum(x)).includes(n)))
}

// For your main index.js to check mode: if mode=private, only owner/sudo can use bot
function canUseBot(m, sock) {
  const cfg = getSettings()
  if (cfg.mode === 'public') return true
  // private: only owner + sudo
  return isOwnerOrSudo(m, sock)
}

const COMMANDS = [
  'botsettings',
  'setwelcome',
  'setgoodbye',
  'setbotname',
  'setmenu',
  'setfooter',
  'settimezone',
  'setlang',
  'setreact',
  'setstatusview',
  // NEW 6
  'addsudo',
  'desudo',
  'setprefix',
  'setbuttonmenu',
  'setmode',
  'health'
]

module.exports = {
  name: 'botsettings',
  alias: COMMANDS,
  command: COMMANDS,
  category: 'settings',
  desc: 'Bot Settings - 16 cmds',
  getSettings,
  saveSettings,
  isOwnerOrSudo,
  canUseBot,

  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    const input = (text || args?.join(' ') || '').trim()
    const cmd = (command || '').toLowerCase()
    const cfg = getSettings()

    // All botsettings cmds na owner/sudo only
    if (!isOwnerOrSudo(m, sock)) return

    const reply = async (txt) => { await sock.sendMessage(jid, { text: txt }, { quoted: m }) }
    const getTarget = () => {
      const ctx = m.message?.extendedTextMessage?.contextInfo || {}
      if (ctx.mentionedJid?.[0]) return normNum(ctx.mentionedJid[0])
      if (ctx.participant) return normNum(ctx.participant)
      if (input) return normNum(input)
      return null
    }

    try {
      if (cmd === 'botsettings') {
        const sudoList = cfg.sudo?.length ? cfg.sudo.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'None'
        return reply(
          `*⚙️ SIMON MD - BOT SETTINGS*\n\n` +
          `🤖 Bot Name: ${cfg.botName}\n` +
          `🔣 Prefix: ${cfg.prefix}\n` +
          `🔒 Mode: ${cfg.mode.toUpperCase()}\n` +
          `🔘 Button Menu: ${cfg.buttonMenu}\n` +
          `👑 Sudo: \n${sudoList}\n\n` +
          `👋 Welcome: ${cfg.welcome}\n` +
          `👋 Goodbye: ${cfg.goodbye}\n` +
          `📋 Menu Type: ${cfg.menuType}\n` +
          `🦶 Footer: ${cfg.footer}\n` +
          `🌍 Timezone: ${cfg.timezone}\n` +
          `🗣️ Language: ${cfg.language}\n` +
          `❤️ Auto React: ${cfg.autoReact}\n` +
          `👀 Status View: ${cfg.autoStatusView}`
        )
      }

      if (cmd === 'setwelcome') {
        if (!input) return reply(`Welcome: ${cfg.welcome}\nMsg: ${cfg.welcomeMsg}`)
        if (['on', 'off'].includes(input.toLowerCase())) { cfg.welcome = input.toUpperCase(); saveSettings(cfg); return reply(`✅ Welcome: ${cfg.welcome}`) }
        cfg.welcomeMsg = input; saveSettings(cfg); return reply(`✅ Welcome Msg:\n${input}`)
      }

      if (cmd === 'setgoodbye') {
        if (!input) return reply(`Goodbye: ${cfg.goodbye}\nMsg: ${cfg.goodbyeMsg}`)
        if (['on', 'off'].includes(input.toLowerCase())) { cfg.goodbye = input.toUpperCase(); saveSettings(cfg); return reply(`✅ Goodbye: ${cfg.goodbye}`) }
        cfg.goodbyeMsg = input; saveSettings(cfg); return reply(`✅ Goodbye Msg:\n${input}`)
      }

      if (cmd === 'setbotname') {
        if (!input) return reply(`Bot Name: ${cfg.botName}`)
        cfg.botName = input; saveSettings(cfg); return reply(`✅ Bot Name: ${cfg.botName}`)
      }

      if (cmd === 'setmenu') {
        if (!input) return reply(`Menu: ${cfg.menuType}\nUse: .setmenu image / text / video`)
        const v = input.toLowerCase()
        if (!['image', 'text', 'video'].includes(v)) return reply('❌ Use: image / text / video')
        cfg.menuType = v; saveSettings(cfg); return reply(`✅ Menu Type: ${cfg.menuType}`)
      }

      if (cmd === 'setfooter') {
        if (!input) return reply(`Footer: ${cfg.footer}`)
        cfg.footer = input; saveSettings(cfg); return reply(`✅ Footer: ${cfg.footer}`)
      }

      if (cmd === 'settimezone') {
        if (!input) return reply(`Timezone: ${cfg.timezone}`)
        cfg.timezone = input; saveSettings(cfg); return reply(`✅ Timezone: ${cfg.timezone}`)
      }

      if (cmd === 'setlang') {
        if (!input) return reply(`Lang: ${cfg.language}`)
        const v = input.toLowerCase()
        if (!['en', 'pidgin'].includes(v)) return reply('❌ Use: en / pidgin')
        cfg.language = v; saveSettings(cfg); return reply(`✅ Language: ${cfg.language}`)
      }

      if (cmd === 'setreact') {
        if (!input) return reply(`Auto React: ${cfg.autoReact}`)
        if (!['on', 'off'].includes(input.toLowerCase())) return reply('❌ Use: on / off')
        cfg.autoReact = input.toUpperCase(); saveSettings(cfg); return reply(`✅ Auto React: ${cfg.autoReact}`)
      }

      if (cmd === 'setstatusview') {
        if (!input) return reply(`Status View: ${cfg.autoStatusView}`)
        if (!['on', 'off'].includes(input.toLowerCase())) return reply('❌ Use: on / off')
        cfg.autoStatusView = input.toUpperCase(); saveSettings(cfg); return reply(`✅ Status View: ${cfg.autoStatusView}`)
      }

      // ===== NEW 6 =====

      // 11 - ADDSUDO - Add person as sudo owner, even if e no be owner, bot go respond to am, even for private mode
      if (cmd === 'addsudo') {
        if (!isCreator(m, sock)) return reply('❌ Only Creator can addsudo')
        const target = getTarget()
        if (!target) return reply('Usage: .addsudo 234xxxxxxxxxx  OR  reply/tag person\nExample: .addsudo 2349037483649')
        if (target === CREATOR) return reply('❌ E don be Creator already')
        if (!cfg.sudo.includes(target)) cfg.sudo.push(target)
        saveSettings(cfg)
        return reply(`✅ Sudo Added: ${target}\n\nE don become owner now.\nBot go respond to am even if mode na PRIVATE.\nTotal Sudo: ${cfg.sudo.length}`)
      }

      // 12 - DESUDO - Remove person from sudo
      if (cmd === 'desudo') {
        if (!isCreator(m, sock)) return reply('❌ Only Creator can desudo')
        const target = getTarget()
        if (!target) return reply('Usage: .desudo 234xxxxxxxxxx  OR  reply/tag person')
        if (target === CREATOR) return reply('❌ Cannot desudo Creator')
        cfg.sudo = (cfg.sudo || []).filter(x => normNum(x) !== target)
        saveSettings(cfg)
        return reply(`✅ Sudo Removed: ${target}\nBot no go respond to am again for private mode.\nTotal Sudo: ${cfg.sudo.length}`)
      }

      // 13 - SETPREFIX - Default prefix, abandon old prefix
      if (cmd === 'setprefix') {
        if (!input) return reply(`Current Prefix: ${cfg.prefix}\nUsage: .setprefix !  OR  .setprefix /`)
        const newPrefix = input.trim().split(' ')[0]
        if (newPrefix.length > 2) return reply('❌ Prefix must be 1-2 characters, e.g: . ! / # $')
        const old = cfg.prefix
        cfg.prefix = newPrefix; saveSettings(cfg)
        global.prefix = newPrefix
        return reply(`✅ Prefix Changed!\nOld: ${old} ❌ ABANDONED\nNew: ${newPrefix} ✅\n\nFrom now, bot go only respond to ${newPrefix}ping, ${newPrefix}menu etc.\nOld prefix ${old} no go work again.`)
      }

      // 14 - SETBUTTONMENU - Button menu or normal menu
      if (cmd === 'setbuttonmenu') {
        if (!input) return reply(`Button Menu: ${cfg.buttonMenu}\nUsage:\n.setbuttonmenu button\n.setbuttonmenu normal`)
        const v = input.toLowerCase()
        if (!['button', 'normal'].includes(v)) return reply('❌ Use: button / normal')
        cfg.buttonMenu = v; saveSettings(cfg)
        return reply(
          v === 'button'
            ? `✅ Button Menu ON 🔘\nMenu go show with buttons now.`
            : `✅ Normal Menu ON 📋\nMenu go show as normal text/image.`
        )
      }

      // 15 - SETMODE - Private or Public
      if (cmd === 'setmode') {
        if (!input) return reply(`Mode: ${cfg.mode.toUpperCase()}\nUsage:\n.setmode private\n.setmode public`)
        const v = input.toLowerCase()
        if (!['private', 'public'].includes(v)) return reply('❌ Use: private / public')
        cfg.mode = v; saveSettings(cfg)
        return reply(
          v === 'private'
            ? `🔒 Mode: PRIVATE\nBot no go reply public again.\nOnly Creator + Linker + Sudo fit use am.`
            : `🌍 Mode: PUBLIC\nEverybody fit use bot now.`
        )
      }

      // 16 - HEALTH - Show bot stats + logs
      if (cmd === 'health') {
        const up = process.uptime()
        const h = Math.floor(up / 3600), mm = Math.floor((up % 3600) / 60), s = Math.floor(up % 60)
        const mem = process.memoryUsage()
        const totalMem = os.totalmem() / 1024 / 1024 / 1024
        const freeMem = os.freemem() / 1024 / 1024 / 1024
        const healthText =
          `*🩺 SIMON MD - HEALTH CHECK*\n\n` +
          `🤖 Bot: ${cfg.botName}\n` +
          `🔣 Prefix: ${cfg.prefix}\n` +
          `🔒 Mode: ${cfg.mode.toUpperCase()}\n` +
          `👑 Sudo Count: ${cfg.sudo.length}\n\n` +
          `⏱️ Uptime: ${h}h ${mm}m ${s}s\n` +
          `💾 RAM Used: ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB\n` +
          `🧠 RAM Free: ${freeMem.toFixed(2)} GB / ${totalMem.toFixed(2)} GB\n` +
          `⚙️ CPU: ${os.cpus()[0]?.model?.slice(0, 25)}\n` +
          `🖥️ Host: ${os.hostname()}\n` +
          `📦 Node: ${process.version}\n` +
          `🌍 Timezone: ${cfg.timezone}\n\n` +
          `✅ Status: ONLINE - All systems working`

        // Try send with video if you get health video for status - if no video, send text only
        const videoPath = path.join(__dirname, '../media/health.mp4')
        try {
          if (fs.existsSync(videoPath)) {
            await sock.sendMessage(jid, { video: fs.readFileSync(videoPath), caption: healthText, gifPlayback: false }, { quoted: m })
            return
          }
        } catch {}
        return reply(healthText + `\n\n_Tip: Put health.mp4 inside media/ folder, health go send with video next time._`)
      }

    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ BotSettings Error: ${e.message}` }, { quoted: m })
    }
  }
      }
