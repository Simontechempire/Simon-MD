// 🛡️ SIMON MD - PROTECTION / MODERATION
module.exports = {
  command: [
    'antilink','antispam','antibot','antitag','antiflood','warn','warnings','resetwarn','clearwarn',
    'ban','unban','block','unblock','delete','del','purge','clear','slowmode','lock','unlock',
    'antibadword','badword','addbadword','delbadword','listbadword','antimention','antifake',
    'antiscam','antiphish','antivirtex','antiforward','antimedia','antisticker','antigif',
    'antidocument','antiaudio','antivideo','antipicture','antipoll','antichannel','antigroup',
    'antipromote','antidemote','raidmode','security','modlogs','setwarn','resetprotection','gstatus'
  ],

  execute: async (sock, m, { command, text, reply }) => {
    global.simonDB = global.simonDB || { 
      protection: {}, 
      warnings: {}, 
      badword: {}, 
      modlogs: {}, 
      ban: {} 
    }

    const chat = m.key.remoteJid

    // Initialize protection settings for this chat
    if (!global.simonDB.protection[chat]) {
      global.simonDB.protection[chat] = {
        antilink: false,
        antispam: false,
        antibot: false,
        antitag: false,
        antiflood: false,
        antibadword: false,
        antimention: false,
        antifake: false,
        antiscam: false,
        antiphish: false,
        antivirtex: false,
        antiforward: false,
        antimedia: false,
        antisticker: false,
        antigif: false,
        antidocument: false,
        antiaudio: false,
        antivideo: false,
        antipicture: false,
        antipoll: false,
        antichannel: false,
        antigroup: false,
        antipromote: false,
        antidemote: false,
        raidmode: false,
        slowmode: 0,
        lock: false,
        maxWarn: 3
      }
    }

    try {
      // Toggle protection features
      const toggleProtections = [
        'antilink','antispam','antibot','antitag','antiflood','antibadword','antimention',
        'antifake','antiscam','antiphish','antivirtex','antiforward','antimedia','antisticker',
        'antigif','antidocument','antiaudio','antivideo','antipicture','antipoll','antichannel',
        'antigroup','antipromote','antidemote','raidmode'
      ]

      if (toggleProtections.includes(command)) {
        if (!text) {
          return reply(`🛡️ Usage: .${command} on/off\nCurrent: ${global.simonDB.protection[chat][command] ? 'ON 🟢' : 'OFF 🔴'}\n\n🩺 SIMON MD Protection`)
        }
        if (text !== 'on' && text !== 'off') return reply(`Please use: on / off`)

        global.simonDB.protection[chat][command] = text === 'on'

        // Save log
        global.simonDB.modlogs[chat] = global.simonDB.modlogs[chat] || []
        global.simonDB.modlogs[chat].push(`${new Date().toLocaleTimeString()} - ${command} set to ${text} by ${m.key.participant || m.key.remoteJid}`)

        return reply(`🛡️ *${command.toUpperCase()}* ${text === 'on' ? 'ENABLED 🟢' : 'DISABLED 🔴'}\n\n🩺 SIMON MD`)
      }

      // .warn
      if (command === 'warn') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) return reply(`Tag a user to warn\nExample: .warn @user`)

        global.simonDB.warnings[chat] = global.simonDB.warnings[chat] || {}
        global.simonDB.warnings[chat][user] = (global.simonDB.warnings[chat][user] || 0) + 1

        const warns = global.simonDB.warnings[chat][user]
        const max = global.simonDB.protection[chat].maxWarn || 3

        if (warns >= max) {
          await sock.groupParticipantsUpdate(chat, [user], 'remove').catch(() => {})
          delete global.simonDB.warnings[chat][user]
          return reply(`🚫 @${user.split('@')[0]} reached ${max} warnings and has been kicked!`, { mentions: [user] })
        }

        return reply(`⚠️ @${user.split('@')[0]} has been warned!\nWarnings: \( {warns}/ \){max}`, { mentions: [user] })
      }

      // .warnings
      if (command === 'warnings') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) return reply(`Tag a user to check warnings`)

        const warns = global.simonDB.warnings[chat]?.[user] || 0
        return reply(`⚠️ @${user.split('@')[0]} has ${warns} warning(s)`, { mentions: [user] })
      }

      // .resetwarn / .clearwarn
      if (['resetwarn', 'clearwarn'].includes(command)) {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) return reply(`Tag a user to reset warnings`)

        if (global.simonDB.warnings[chat]) {
          delete global.simonDB.warnings[chat][user]
        }
        return reply(`✅ Warnings cleared for @${user.split('@')[0]}`, { mentions: [user] })
      }

      // .ban / .unban
      if (command === 'ban') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) return reply(`Tag a user to ban`)
        global.simonDB.ban[user] = true
        return reply(`🚫 @${user.split('@')[0]} has been banned from using the bot`, { mentions: [user] })
      }

      if (command === 'unban') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) return reply(`Tag a user to unban`)
        delete global.simonDB.ban[user]
        return reply(`✅ @${user.split('@')[0]} has been unbanned`, { mentions: [user] })
      }

      // Badword system
      if (['badword', 'addbadword', 'delbadword', 'listbadword'].includes(command)) {
        global.simonDB.badword[chat] = global.simonDB.badword[chat] || []

        if (command === 'addbadword') {
          if (!text) return reply(`Usage: .addbadword <word>`)
          global.simonDB.badword[chat].push(text.toLowerCase())
          return reply(`✅ Added badword: *${text}*\nTotal: ${global.simonDB.badword[chat].length}`)
        }

        if (command === 'delbadword') {
          if (!text) return reply(`Usage: .delbadword <word>`)
          global.simonDB.badword[chat] = global.simonDB.badword[chat].filter(w => w !== text.toLowerCase())
          return reply(`✅ Removed badword: *${text}*`)
        }

        if (command === 'listbadword' || command === 'badword') {
          return reply(`📜 *BADWORD LIST*\n\n${global.simonDB.badword[chat].join(', ') || 'None'}\n\nTotal: ${global.simonDB.badword[chat].length}\n\n🩺`)
        }
      }

      // .security - show all protection status
      if (command === 'security') {
        const p = global.simonDB.protection[chat]
        let txt = `🛡️ *SECURITY STATUS*\n\n`
        Object.entries(p).forEach(([k, v]) => {
          if (typeof v === 'boolean') {
            txt += `${v ? '🟢' : '🔴'} ${k}: ${v ? 'ON' : 'OFF'}\n`
          }
        })
        txt += `\n🩺 SIMON MD Protection`
        return reply(txt)
      }

      // .modlogs
      if (command === 'modlogs') {
        const logs = global.simonDB.modlogs[chat] || []
        return reply(`📋 *MOD LOGS*\n\n${logs.slice(-20).join('\n') || 'No logs yet'}\n\n🩺`)
      }

      // .setwarn
      if (command === 'setwarn') {
        if (!text) return reply(`Usage: .setwarn <number>\nCurrent max: ${global.simonDB.protection[chat].maxWarn || 3}`)
        const num = parseInt(text)
        if (isNaN(num)) return reply(`Please enter a valid number`)
        global.simonDB.protection[chat].maxWarn = num
        return reply(`✅ Max warnings set to *${num}*`)
      }

      // .resetprotection
      if (command === 'resetprotection') {
        global.simonDB.protection[chat] = {
          antilink: false, antispam: false, antibot: false, antitag: false,
          antiflood: false, antibadword: false, maxWarn: 3
        }
        return reply(`🔄 All protections have been reset to OFF\n\n🩺`)
      }

      // .gstatus
      if (command === 'gstatus') {
        return reply(`🛡️ Group Status Protection: ${global.simonDB.protection[chat].antigroup ? 'ON 🟢' : 'OFF 🔴'}\n\nUse .antigroup on/off\n\n🩺`)
      }

    } catch (e) {
      reply(`❌ Protection Error: ${e.message} 🩺`)
    }
  }
  }
