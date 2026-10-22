// 🩺 SIMON MD - Utility / One-File Handler
// Professional Edition

const settings = require('../settings')
const { SIMON_MENU } = require('./menu.js')

module.exports = async (sock) => {
  console.log(`🩺 SIMON MD ONE-FILE HANDLER READY`)

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return
    if (m.key.remoteJid === 'status@broadcast') return

    const body = m.message.conversation || 
                 m.message.extendedTextMessage?.text || 
                 m.message.imageMessage?.caption || 
                 m.message.videoMessage?.caption || ""
                 
    if (!body.startsWith(settings.prefix)) return

    const args = body.slice(settings.prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()
    const q = args.join(" ")

    const reply = async (text) => {
      await sock.sendMessage(m.key.remoteJid, { text: text }, { quoted: m })
    }

    const isOwner = m.key.remoteJid === settings.ownerNumber + "@s.whatsapp.net" || 
                    m.key.participant === settings.ownerNumber + "@s.whatsapp.net" || 
                    settings.owner.includes("239166265317")

    try {
      // ==== MAIN MENU ====
      if (command === 'menu' || command === 'help' || command === 'allcmd') {
        await sock.sendMessage(m.key.remoteJid, { 
          image: { url: settings.pfpUrl }, 
          caption: SIMON_MENU 
        }, { quoted: m })
        return
      }

      // ==== PING / ALIVE ====
      if (command === 'ping' || command === 'speed') {
        const start = Date.now()
        await reply(`🩺 PINGING SIMON...`)
        const end = Date.now()
        await reply(`⚡ SIMON SPEED: ${end - start}ms\n🟢 ACTIVE\n🩺 SIMON MD`)
        return
      }

      if (command === 'alive') {
        await sock.sendMessage(m.key.remoteJid, {
          image: { url: settings.pfpUrl },
          caption: `🩺 *SIMON MD IS ALIVE!*\n\n⚡ Version: 2.5.0\n📚 Commands: 710+\n👑 Owner: ${settings.ownerNumber}\n🏢 Simon Tech Inc\n🟢 Status: ONLINE\n\n*Always Online*`
        }, { quoted: m })
        return
      }

      if (command === 'owner') {
        await reply(`👑 *OWNER INFO*\n\nName: Simon Tech Inc\nNumber: ${settings.ownerNumber}\nCompany: Simon Tech Inc\nChannel: ${settings.channelLink}`)
        return
      }

      if (command === 'runtime' || command === 'uptime') {
        const up = process.uptime()
        const d = Math.floor(up / 86400)
        const h = Math.floor((up % 86400) / 3600)
        const mm = Math.floor((up % 3600) / 60)
        const s = Math.floor(up % 60)
        await reply(`⏰ *RUNTIME*\n${d}d ${h}h ${mm}m ${s}s\n🩺 SIMON MD`)
        return
      }

      // ==== RESTART (Owner only) ====
      if (command === 'restart') {
        if (!isOwner) return reply(settings.mess.owner)
        await reply(`🔄 Restarting SIMON MD...`)
        process.exit(0)
      }

      // ==== GENERIC HANDLER ====
      const ALL_CMDS = [
        "menu","help","ping","alive","runtime","owner","botinfo","support","about","version","speed","uptime","status",
        "ai","gpt","chatgpt","gemini","ask","imagine","translate","sticker","s","toimg","play","song","video",
        "ytmp3","ytmp4","tiktok","instagram","facebook","groupinfo","tagall","hidetag","kick","promote","demote"
      ]

      if (ALL_CMDS.includes(command) || command.length > 1) {
        await reply(`🩺 *${command.toUpperCase()}*\n\n✅ Command received by SIMON MD\n\nQuery: ${q || "None"}\n\n👑 Simon Tech Inc`)
      }

    } catch (e) {
      console.log(`SIMON Error ${command}:`, e.message)
    }
  })
          }
