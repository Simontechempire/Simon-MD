// 🎀 SIMON MD - Welcome & Goodbye | FIXED - OFF by default, only for groups you turn ON
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../database/wlc.json')

function loadDB() { try { return JSON.parse(fs.readFileSync(DB_PATH)) } catch { return {} } }
function saveDB(d) {
  if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2))
}
// FIX: No auto-create with true. If group never set, return OFF.
function getChat(jid) {
  const db = loadDB()
  return db[jid] || { welcome: false, goodbye: false }
}
function setChat(jid, data) {
  const db = loadDB()
  db[jid] = { welcome: false, goodbye: false, ...(db[jid] || {}), ...data }
  saveDB(db)
  return db[jid]
}

function welcomeText(user, groupName, count) {
  return `╭━━━〔 ✨ NEW MEMBER ALERT 〕━━━╮\n\n   🦋 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐓𝐇𝐄 𝐅𝐀𝐌𝐈𝐋𝐘 🦋\n\n  ┏━━━━━━━━━━━━━━━━━━┓\n    👤 𝐍𝐚𝐦𝐞: @${user}\n    🌸 𝐆𝐫𝐨𝐮𝐩: ${groupName}\n    💌 𝐌𝐞𝐦𝐛𝐞𝐫: ${count}\n  ┗━━━━━━━━━━━━━━━━━━┛\n\n  🎉 A fresh face, a new vibe!\n  💫 We're glad to have you here.\n\n  📌 Read the group rules.\n  🤝 Respect every member.\n  💬 Stay active and have fun.\n\n  ❤️ MAKE YOURSELF AT HOME!\n\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯`
}

function goodbyeText(user, groupName) {
  return `╭━━━〔 🥀 MEMBER DEPARTURE 〕━━━╮\n\n      💔 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 & 𝐓𝐀𝐊𝐄 𝐂𝐀𝐑𝐄 💔\n\n  ┏━━━━━━━━━━━━━━━━━━┓\n    👤 𝐍𝐚𝐦𝐞: @${user}\n    🌸 𝐆𝐫𝐨𝐮𝐩: ${groupName}\n  ┗━━━━━━━━━━━━━━━━━━┛\n\n  😔 Someone has left the family.\n\n  🌹 Thanks for being part of us.\n  💫 Your presence was appreciated.\n  🦋 Wishing you happiness and success.\n\n       ❤️ UNTIL WE MEET AGAIN!\n\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯`
}

function attachEngine(sock) {
  if (!sock || !sock.ev) return
  if (sock.__wlcEngineLoaded) return
  sock.__wlcEngineLoaded = true

  sock.ev.on('group-participants.update', async (update) => {
    try {
      const jid = update.id
      if (!jid || !jid.endsWith('@g.us')) return

      // FIX: Check DB directly, do NOT create entry. If group never turn am ON, stop here.
      const db = loadDB()
      const cfg = db[jid]
      if (!cfg) return
      if (!cfg.welcome && !cfg.goodbye) return

      let groupName = 'Group'
      let count = 0
      try {
        const meta = await sock.groupMetadata(jid)
        groupName = meta.subject || 'Group'
        count = meta.participants?.length || 0
      } catch {}

      for (const p of update.participants || []) {
        const num = String(p).split('@')[0].split(':')[0]
        let pp = null
        try { pp = await sock.profilePictureUrl(p, 'image') } catch {}

        if (update.action === 'add' && cfg.welcome) {
          const txt = welcomeText(num, groupName, count)
          if (pp) await sock.sendMessage(jid, { image: { url: pp }, caption: txt, mentions: [p] }).catch(() => sock.sendMessage(jid, { text: txt, mentions: [p] }))
          else await sock.sendMessage(jid, { text: txt, mentions: [p] }).catch(() => {})
        }

        if ((update.action === 'remove' || update.action === 'leave') && cfg.goodbye) {
          const txt = goodbyeText(num, groupName)
          if (pp) await sock.sendMessage(jid, { image: { url: pp }, caption: txt, mentions: [p] }).catch(() => sock.sendMessage(jid, { text: txt, mentions: [p] }))
          else await sock.sendMessage(jid, { text: txt, mentions: [p] }).catch(() => {})
        }
      }
    } catch (e) { console.log('[WLC]', e.message) }
  })

  console.log('[WLC] Welcome & Goodbye engine loaded ✅ - OFF by default')
}

const COMMANDS = ['gcwelcome', 'gcgoodbye', 'welcome', 'goodbye', 'wlc']

module.exports = {
  name: 'wlc',
  alias: COMMANDS,
  command: COMMANDS,
  category: 'group',
  desc: 'Welcome & Goodbye - OFF by default',
  attachEngine,
  __call: attachEngine,

  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    const input = (text || args?.join(' ') || '').trim().toLowerCase()
    const cmd = (command || '').toLowerCase()
    const reply = async (txt) => { await sock.sendMessage(jid, { text: txt }, { quoted: m }) }

    if (!jid.endsWith('@g.us')) { await reply('❌ Only works in groups'); return }

    let isAdmin = false
    try {
      const meta = await sock.groupMetadata(jid)
      const sender = m.key.participant || jid
      const base = String(sender).split(':')[0].split('@')[0]
      const p = meta.participants.find(x => String(x.id).split(':')[0].split('@')[0] === base || String(x.lid || '').split(':')[0].split('@')[0] === base)
      isAdmin = !!(p?.admin === 'admin' || p?.admin === 'superadmin')
    } catch {}
    const isOwner = String(m.key.participant || jid).split(':')[0].split('@')[0] === '239166265317'
    if (!isAdmin && !isOwner) { await reply('❌ Only admin can use this'); return }

    const cfg = getChat(jid)

    if (cmd === 'gcwelcome' || cmd === 'welcome' || cmd === 'wlc') {
      if (!input) return reply(`🎀 *GC Welcome: ${cfg.welcome ? 'ON ✅' : 'OFF ❌'}*\n\n.gcwelcome on - Turn ON for THIS group only\n.gcwelcome off - Turn OFF`)
      if (input === 'on' || input === 'off') {
        setChat(jid, { welcome: input === 'on' })
        return reply(`🎀 GC Welcome ${input === 'on' ? 'ENABLED ✅ for THIS group only' : 'DISABLED ❌'}`)
      }
      return reply('Usage: .gcwelcome on / off')
    }

    if (cmd === 'gcgoodbye' || cmd === 'goodbye') {
      if (!input) return reply(`🥀 *GC Goodbye: ${cfg.goodbye ? 'ON ✅' : 'OFF ❌'}*\n\n.gcgoodbye on - Turn ON for THIS group only\n.gcgoodbye off - Turn OFF`)
      if (input === 'on' || input === 'off') {
        setChat(jid, { goodbye: input === 'on' })
        return reply(`🥀 GC Goodbye ${input === 'on' ? 'ENABLED ✅ for THIS group only' : 'DISABLED ❌'}`)
      }
      return reply('Usage: .gcgoodbye on / off')
    }
  }
}
