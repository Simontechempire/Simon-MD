// 🛡️ SIMON MD - Protection Plugin (Clean Version)
const fs = require('fs')
const path = require('path')

let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

const DB_PATH = path.join(__dirname, '../database/protection.json')

function defaultChat() {
  return {
    antilink: false, antispam: false, antibot: false, antitag: false, antiflood: false,
    antibadword: false, antimention: false, antifake: false, antiscam: false, antiphish: false,
    antivirtex: false, antiforward: false, antimedia: false, antisticker: false, antigif: false,
    antidocument: false, antiaudio: false, antivideo: false, antipicture: false, antipoll: false,
    antichannel: false, antigroup: false, antipromote: false, antidemote: false, raidmode: false,
    slowmode: 0, lock: false, maxWarn: 3
  }
}

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH))
  } catch {
    return { protection: {}, warnings: {}, badword: {}, modlogs: {}, ban: {}, slowmodeMsg: {} }
  }
}

function saveDB(data) {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  }
  let current = {}
  try { current = JSON.parse(fs.readFileSync(DB_PATH)) } catch {}
  const merged = { ...current, ...data }
  fs.writeFileSync(DB_PATH, JSON.stringify(merged, null, 2))
  return merged
}

function getDB() {
  const d = loadDB()
  return {
    protection: d.protection || {},
    warnings: d.warnings || {},
    badword: d.badword || {},
    modlogs: d.modlogs || {},
    ban: d.ban || {},
    slowmodeMsg: d.slowmodeMsg || {}
  }
}

function normId(id) {
  return String(id || '').split(':')[0].split('@')[0]
}

function isAdminInMeta(meta, id) {
  if (!meta?.participants) return false
  const base = normId(id)
  const p = meta.participants.find(x => normId(x.id) === base)
  return !!p?.admin
}

// Cache groupMetadata for 30 seconds
const metaCache = new Map()
async function getMetaCached(sock, jid) {
  const now = Date.now()
  const cached = metaCache.get(jid)
  if (cached && now - cached.t < 30000) return cached.meta
  try {
    const meta = await sock.groupMetadata(jid)
    metaCache.set(jid, { meta, t: now })
    return meta
  } catch {
    return { participants: [] }
  }
}

function attachEngine(sock) {
  if (sock.__protectionEngineLoaded) return
  sock.__protectionEngineLoaded = true

  const floodMap = new Map()
  const spamMap = new Map()

  // Stronger link detection
  const LINK_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|chat\.whatsapp\.com\/[A-Za-z0-9]+|wa\.me\/\d+|t\.me\/[^\s]+|discord\.gg\/[^\s]+|bit\.ly\/[^\s]+|tinyurl\.com\/[^\s]+)/i

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const db = loadDB()

    for (const m of messages) {
      try {
        const jid = m.key.remoteJid
        if (!jid || !jid.endsWith('@g.us')) continue
        if (m.key.fromMe) continue

        const sender = m.key.participant || m.key.remoteJid
        if (!sender) continue

        if (!db.protection[jid]) db.protection[jid] = defaultChat()
        const p = db.protection[jid]

        const msg = m.message
        if (!msg) continue

        const text = msg.conversation ||
          msg.extendedTextMessage?.text ||
          msg.imageMessage?.caption ||
          msg.videoMessage?.caption || ''
        const lower = text.toLowerCase()
        const ctx = msg.extendedTextMessage?.contextInfo ||
          msg.imageMessage?.contextInfo ||
          msg.videoMessage?.contextInfo || {}
        const mentioned = ctx.mentionedJid || []

        const meta = await getMetaCached(sock, jid)
        const botJid = normId(sock.user.id) + '@s.whatsapp.net'
        const botAdmin = isAdminInMeta(meta, botJid)
        const senderAdmin = isAdminInMeta(meta, sender)

        let isOwner = false
        try {
          const ow = require('./owner')
          if (ow.isRealOwner) isOwner = ow.isRealOwner(sender, sock)
        } catch {}

        // Skip admins & owner
        if (senderAdmin || isOwner) continue
        if (!botAdmin) continue

        const doDelete = async () => {
          try { await sock.sendMessage(jid, { delete: m.key }) } catch {}
        }

        const doWarn = async (reason) => {
          db.warnings[jid] = db.warnings[jid] || {}
          db.warnings[jid][sender] = (db.warnings[jid][sender] || 0) + 1
          const warns = db.warnings[jid][sender]
          const max = p.maxWarn || 3
          saveDB(db)

          if (warns >= max) {
            await sock.sendMessage(jid, {
              text: tiny(`@${sender.split('@')[0]} reached ${max} warnings → kicked`),
              mentions: [sender]
            }).catch(() => {})
            await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {})
            db.warnings[jid][sender] = 0
            saveDB(db)
          } else {
            await sock.sendMessage(jid, {
              text: box('Warn', [
                line('user', `@${sender.split('@')[0]}`),
                line('reason', reason),
                line('warns', `\( {warns}/ \){max}`)
              ]),
              mentions: [sender]
            }).catch(() => {})
          }
        }

        // === PROTECTIONS ===
        if (p.antilink && LINK_REGEX.test(text)) {
          await doDelete()
          await doWarn('Antilink')
          continue
        }

        if (p.antibadword) {
          const list = db.badword[jid] || []
          const found = list.find(w => lower.includes(String(w).toLowerCase()))
          if (found) {
            await doDelete()
            await doWarn(`Badword: ${found}`)
            continue
          }
        }

        if (p.antitag && mentioned.length >= 5) {
          await doDelete()
          await doWarn('Antitag')
          continue
        }

        if (p.antisticker && msg.stickerMessage) {
          await doDelete()
          await doWarn('Antisticker')
          continue
        }

        if (p.antigif && msg.videoMessage?.gifPlayback) {
          await doDelete()
          await doWarn('Antigif')
          continue
        }

        if (p.antidocument && msg.documentMessage) {
          await doDelete()
          await doWarn('Antidocument')
          continue
        }

        if (p.antiaudio && msg.audioMessage) {
          await doDelete()
          await doWarn('Antiaudio')
          continue
        }

        if (p.antivideo && msg.videoMessage && !msg.videoMessage.gifPlayback) {
          await doDelete()
          await doWarn('Antivideo')
          continue
        }

        if (p.antipicture && msg.imageMessage) {
          await doDelete()
          await doWarn('Antipicture')
          continue
        }

        if (p.antipoll && msg.pollCreationMessage) {
          await doDelete()
          await doWarn('Antipoll')
          continue
        }

        if (p.antiforward && ctx.isForwarded) {
          await doDelete()
          await doWarn('Antiforward')
          continue
        }

        if (p.antivirtex && text.length > 3000) {
          await doDelete()
          await doWarn('Antivirtex')
          continue
        }

        if (p.antifake) {
          const num = sender.split('@')[0]
          if (!num.startsWith('234')) {
            await doDelete()
            await doWarn('Antifake')
            continue
          }
        }

        if (p.antiflood) {
          const now = Date.now()
          const fKey = jid + ':' + sender
          const arr = floodMap.get(fKey) || []
          const recent = arr.filter(t => now - t < 5000)
          recent.push(now)
          floodMap.set(fKey, recent)
          if (recent.length >= 5) {
            await doDelete()
            await doWarn('Antiflood')
            floodMap.set(fKey, [])
            continue
          }
        }

        if (p.antispam && text) {
          const key = jid + ':' + sender + ':' + text
          const c = (spamMap.get(key) || 0) + 1
          spamMap.set(key, c)
          if (c >= 3) {
            await doDelete()
            await doWarn('Antispam')
            spamMap.set(key, 0)
            continue
          }
        }

        if ((p.antichannel || p.antigroup) && /chat\.whatsapp\.com|whatsapp\.com\/channel/i.test(text)) {
          await doDelete()
          await doWarn('Antichannel/Group link')
          continue
        }

        if (p.antimention && mentioned.map(normId).includes(normId(sock.user.id))) {
          await doDelete()
          await doWarn('Antimention')
          continue
        }

        // Ban list
        if (db.ban && db.ban[sender]) {
          await doDelete()
          await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {})
          continue
        }

      } catch (e) {
        console.log('[PROTECTION ENGINE]', e.message)
      }
    }
  })

  console.log('[PROTECTION] Engine loaded successfully')
}

module.exports = {
  command: [
    'antilink', 'antispam', 'antibot', 'antitag', 'antiflood', 'warn', 'warnings', 'resetwarn', 'clearwarn',
    'ban', 'unban', 'block', 'unblock', 'delete', 'del', 'purge', 'clear', 'slowmode', 'lock', 'unlock',
    'antibadword', 'badword', 'addbadword', 'delbadword', 'listbadword', 'antimention', 'antifake',
    'antiscam', 'antiphish', 'antivirtex', 'antiforward', 'antimedia', 'antisticker', 'antigif',
    'antidocument', 'antiaudio', 'antivideo', 'antipicture', 'antipoll', 'antichannel', 'antigroup',
    'antipromote', 'antidemote', 'raidmode', 'security', 'modlogs', 'setwarn', 'resetprotection', 'gstatus'
  ],

  attachEngine,

  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    try { await reactAwait(sock, jid, m.key) } catch {}

    let db = getDB()
    if (!db.protection[jid]) {
      db.protection[jid] = defaultChat()
      saveDB(db)
      db = getDB()
    }
    if (!db.protection[jid].maxWarn) db.protection[jid].maxWarn = 3

    const treply = async (title, lines, mentions = []) => {
      const txt = box(title, Array.isArray(lines) ? lines : [lines])
      await sock.sendMessage(jid, { text: txt, mentions }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
    }

    const done = async () => {
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
    }

    let botAdmin = false, senderAdmin = false, isOwner = false
    try {
      if (jid.endsWith('@g.us')) {
        const meta = await getMetaCached(sock, jid)
        botAdmin = isAdminInMeta(meta, normId(sock.user.id) + '@s.whatsapp.net')
        senderAdmin = isAdminInMeta(meta, sender)
      } else {
        senderAdmin = true
      }
      try {
        const ow = require('./owner')
        if (ow.isRealOwner) isOwner = ow.isRealOwner(sender, sock)
      } catch {}
    } catch {}

    // Admin-only commands
    const adminOnlyCmds = [
      'antilink', 'antispam', 'antibot', 'antitag', 'antiflood', 'antibadword', 'antimention',
      'antifake', 'antiscam', 'antiphish', 'antivirtex', 'antiforward', 'antimedia', 'antisticker',
      'antigif', 'antidocument', 'antiaudio', 'antivideo', 'antipicture', 'antipoll', 'antichannel',
      'antigroup', 'antipromote', 'antidemote', 'raidmode', 'warn', 'resetwarn', 'clearwarn',
      'ban', 'unban', 'delete', 'del', 'purge', 'clear', 'slowmode', 'lock', 'unlock',
      'addbadword', 'delbadword', 'setwarn', 'resetprotection'
    ]

    if (jid.endsWith('@g.us') && adminOnlyCmds.includes(command) && !senderAdmin && !isOwner) {
      await done()
      return
    }

    try {
      const toggleProtections = [
        'antilink', 'antispam', 'antibot', 'antitag', 'antiflood', 'antibadword', 'antimention',
        'antifake', 'antiscam', 'antiphish', 'antivirtex', 'antiforward', 'antimedia', 'antisticker',
        'antigif', 'antidocument', 'antiaudio', 'antivideo', 'antipicture', 'antipoll', 'antichannel',
        'antigroup', 'antipromote', 'antidemote', 'raidmode'
      ]

      if (toggleProtections.includes(command)) {
        if (!text) {
          await treply(command, [
            line('current', db.protection[jid][command] ? 'ON' : 'OFF'),
            line('usage', `.${command} on/off`)
          ])
          return
        }
        if (text !== 'on' && text !== 'off') {
          await treply(command, [line('error', 'Use on / off')])
          return
        }
        db.protection[jid][command] = text === 'on'
        db.modlogs[jid] = db.modlogs[jid] || []
        db.modlogs[jid].push(`${new Date().toLocaleTimeString()} - ${command} → ${text} by ${sender}`)
        saveDB(db)
        await treply(command, [line('status', text === 'on' ? 'ENABLED ✅' : 'DISABLED ❌')])
        return
      }

      // === WARN SYSTEM ===
      if (command === 'warn') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
          m.message?.extendedTextMessage?.contextInfo?.participant
        if (!user) {
          await treply('Warn', [line('error', 'Tag or reply user')])
          return
        }
        if (!botAdmin && jid.endsWith('@g.us')) { await done(); return }

        db.warnings[jid] = db.warnings[jid] || {}
        db.warnings[jid][user] = (db.warnings[jid][user] || 0) + 1
        const warns = db.warnings[jid][user]
        const max = db.protection[jid].maxWarn || 3
        saveDB(db)

        if (warns >= max) {
          await sock.groupParticipantsUpdate(jid, [user], 'remove').catch(() => {})
          delete db.warnings[jid][user]
          saveDB(db)
          await treply('Warn', [
            line('user', `@${user.split('@')[0]}`),
            line('status', `Reached ${max} warnings → kicked`)
          ], [user])
          return
        }
        await treply('Warn', [
          line('user', `@${user.split('@')[0]}`),
          line('warns', `\( {warns}/ \){max}`)
        ], [user])
        return
      }

      if (command === 'warnings') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
          m.message?.extendedTextMessage?.contextInfo?.participant || sender
        const warns = db.warnings[jid]?.[user] || 0
        await treply('Warnings', [
          line('user', `@${user.split('@')[0]}`),
          line('warns', `${warns}`)
        ], [user])
        return
      }

      if (['resetwarn', 'clearwarn'].includes(command)) {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
          m.message?.extendedTextMessage?.contextInfo?.participant
        if (!user) {
          await treply('Reset Warn', [line('error', 'Tag or reply user')])
          return
        }
        if (db.warnings[jid]) delete db.warnings[jid][user]
        saveDB(db)
        await treply('Reset Warn', [
          line('user', `@${user.split('@')[0]}`),
          line('status', 'Warnings cleared')
        ], [user])
        return
      }

      // === BAN SYSTEM ===
      if (command === 'ban') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
          m.message?.extendedTextMessage?.contextInfo?.participant
        if (!user) {
          await treply('Ban', [line('error', 'Tag or reply user')])
          return
        }
        db.ban[user] = true
        saveDB(db)
        if (botAdmin) await sock.groupParticipantsUpdate(jid, [user], 'remove').catch(() => {})
        await treply('Ban', [
          line('user', `@${user.split('@')[0]}`),
          line('status', 'Banned + kicked')
        ], [user])
        return
      }

      if (command === 'unban') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
          m.message?.extendedTextMessage?.contextInfo?.participant
        if (!user) {
          await treply('Unban', [line('error', 'Tag or reply user')])
          return
        }
        delete db.ban[user]
        saveDB(db)
        await treply('Unban', [
          line('user', `@${user.split('@')[0]}`),
          line('status', 'Unbanned')
        ], [user])
        return
      }

      // === OTHER COMMANDS ===
      if (['delete', 'del'].includes(command)) {
        const ctx = m.message?.extendedTextMessage?.contextInfo
        if (!ctx?.stanzaId) {
          await treply('Delete', [line('error', 'Reply to a message')])
          return
        }
        await sock.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: false,
            id: ctx.stanzaId,
            participant: ctx.participant
          }
        }).catch(() => {})
        await done()
        return
      }

      if (command === 'slowmode') {
        if (!botAdmin && jid.endsWith('@g.us')) { await done(); return }
        const sec = parseInt(text) || 0
        db.protection[jid].slowmode = sec
        saveDB(db)
        await treply('Slowmode', [line('seconds', `${sec}`)])
        return
      }

      if (command === 'lock') {
        if (!botAdmin && jid.endsWith('@g.us')) { await done(); return }
        await sock.groupSettingUpdate(jid, 'announcement').catch(() => {})
        db.protection[jid].lock = true
        saveDB(db)
        await treply('Lock', [line('status', 'Group locked')])
        return
      }

      if (command === 'unlock') {
        if (!botAdmin && jid.endsWith('@g.us')) { await done(); return }
        await sock.groupSettingUpdate(jid, 'not_announcement').catch(() => {})
        db.protection[jid].lock = false
        saveDB(db)
        await treply('Unlock', [line('status', 'Group unlocked')])
        return
      }

      if (['badword', 'addbadword', 'delbadword', 'listbadword'].includes(command)) {
        db.badword[jid] = db.badword[jid] || []
        if (command === 'addbadword') {
          if (!text) {
            await treply('Add Badword', [line('error', 'Usage: .addbadword <word>')])
            return
          }
          db.badword[jid].push(text.toLowerCase())
          saveDB(db)
          await treply('Add Badword', [
            line('added', text),
            line('total', `${db.badword[jid].length}`)
          ])
          return
        }
        if (command === 'delbadword') {
          if (!text) {
            await treply('Del Badword', [line('error', 'Usage: .delbadword <word>')])
            return
          }
          db.badword[jid] = db.badword[jid].filter(w => w !== text.toLowerCase())
          saveDB(db)
          await treply('Del Badword', [line('removed', text)])
          return
        }
        if (command === 'listbadword' || command === 'badword') {
          await treply('Badword List', [
            line('list', db.badword[jid].join(', ') || 'None'),
            line('total', `${db.badword[jid].length}`)
          ])
          return
        }
      }

      if (command === 'security') {
        const p = db.protection[jid]
        const lines = []
        Object.entries(p).forEach(([k, v]) => {
          if (typeof v === 'boolean') lines.push(line(k, v ? 'ON' : 'OFF'))
        })
        await treply('Security Status', lines)
        return
      }

      if (command === 'modlogs') {
        const logs = db.modlogs[jid] || []
        await treply('Mod Logs', [
          line('logs', logs.slice(-10).join(' | ') || 'No logs yet')
        ])
        return
      }

      if (command === 'setwarn') {
        if (!text) {
          await treply('Set Warn', [
            line('current', `${db.protection[jid].maxWarn || 3}`),
            line('usage', '.setwarn <number>')
          ])
          return
        }
        const num = parseInt(text)
        if (isNaN(num)) {
          await treply('Set Warn', [line('error', 'Enter a valid number')])
          return
        }
        db.protection[jid].maxWarn = num
        saveDB(db)
        await treply('Set Warn', [line('max', `${num}`)])
        return
      }

      if (command === 'resetprotection') {
        db.protection[jid] = defaultChat()
        saveDB(db)
        await treply('Reset Protection', [line('status', 'All protections reset to OFF')])
        return
      }

      if (command === 'gstatus') {
        await treply('Group Status', [
          line('antigroup', db.protection[jid].antigroup ? 'ON' : 'OFF'),
          line('use', '.antigroup on/off')
        ])
        return
      }

    } catch (e) {
      await sock.sendMessage(jid, {
        text: box('Protection Error', [line('error', e.message)])
      }, { quoted: m })
      try { await reactDone(sock, jid, m.key) } catch {}
    }
  }
}
