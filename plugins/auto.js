// 🤖 SIMON MD - AUTO FEATURES
module.exports = {
  command: [
    'autoread','autotyping','autorecording','autobio','autostatus','autostatusview',
    'autostatuslike','autostatusreact','autoreact','autolike','autoreadstatus',
    'autodlstatus','autoblock','autounblock','autokick','autoban','autowarn',
    'autodelete','antidelete','autosticker','autorespond','autochat','autoai',
    'autolevel','autojoin','autoleave','autogroup','autoreject','autoapprove',
    'autosave','autobackup','autoclean','autopurge','autoping','autopresence',
    'autoreadgc','autoreadpc','autodownload','autoview','autoseen','autopost',
    'autoreply','autovoice','setauto','autonsfw','antinsfwauto','autogc','autopc','autocall'
  ],

  execute: async (sock, m, { command, text, reply }) => {
    global.simonDB = global.simonDB || { 
      auto: { 
        autoread: true, 
        autotyping: true, 
        autorecording: true, 
        autoviewstatus: true, 
        autolikestatus: false, 
        autoreact: true, 
        antidelete: true, 
        autobioText: '🩺 SIMON MD | {time}', 
        autobio: false, 
        reactEmoji: '🩺' 
      } 
    }

    try {
      // .setauto - show all settings
      if (command === 'setauto') {
        let txt = `🤖 *AUTO SETTINGS*\n\n`
        for (let [k, v] of Object.entries(global.simonDB.auto)) {
          if (typeof v === 'boolean') {
            txt += `${v ? '🟢' : '🔴'} ${k}: ${v ? 'ON' : 'OFF'}\n`
          }
        }
        txt += `\nReact Emoji: ${global.simonDB.auto.reactEmoji}\nBio Text: ${global.simonDB.auto.autobioText}\n\nUse .<feature> on/off\n\n🩺 SIMON MD`
        return reply(txt)
      }

      // Read / View / Presence related
      if (['autoread','autoreadgc','autoreadpc','autoseen','autoview','autoreadstatus','autodlstatus','autostatusview','autostatus','autopresence','autoping'].includes(command)) {
        if (!text) {
          return reply(`Current *${command}*: \( {global.simonDB.auto[command] ? 'ON 🟢' : 'OFF 🔴'}\n\nUsage: . \){command} on/off\n\n🩺`)
        }
        global.simonDB.auto[command] = text === 'on'
        return reply(`✅ *${command}* ${text === 'on' ? 'ENABLED 🟢' : 'DISABLED 🔴'}\n\n🩺`)
      }

      // Typing / Recording / Bio
      if (['autotyping','autorecording'].includes(command)) {
        if (!text) {
          return reply(`Current *${command}*: \( {global.simonDB.auto[command] ? 'ON 🟢' : 'OFF 🔴'}\n\nUsage: . \){command} on/off`)
        }
        global.simonDB.auto[command] = text === 'on'
        return reply(`✅ *${command}* ${text === 'on' ? 'ENABLED 🟢' : 'DISABLED 🔴'}\n\n🩺`)
      }

      // Auto Bio
      if (command === 'autobio') {
        if (!text) {
          return reply(`AutoBio: ${global.simonDB.auto.autobio ? 'ON 🟢' : 'OFF 🔴'}\nText: ${global.simonDB.auto.autobioText}\n\nUsage:\n.autobio on/off\n.autobio set Your text {time}`)
        }
        if (text === 'on' || text === 'off') {
          global.simonDB.auto.autobio = text === 'on'
          return reply(`✅ AutoBio ${text === 'on' ? 'ENABLED 🟢' : 'DISABLED 🔴'}`)
        }
        if (text.startsWith('set ')) {
          global.simonDB.auto.autobioText = text.slice(4)
          global.simonDB.auto.autobio = true
          return reply(`✅ AutoBio text set to:\n${global.simonDB.auto.autobioText}`)
        }
      }

      // Auto React / Like
      if (['autoreact','autolike','autostatuslike','autostatusreact'].includes(command)) {
        if (!text) {
          return reply(`Current *${command}*: ${global.simonDB.auto[command] ? 'ON 🟢' : 'OFF 🔴'}\nEmoji: \( {global.simonDB.auto.reactEmoji}\n\nUsage: . \){command} on/off\nor .autoreact 🩺`)
        }
        if (text.length <= 2 && text !== 'on' && text !== 'off') {
          // Set emoji
          global.simonDB.auto.reactEmoji = text
          global.simonDB.auto.autoreact = true
          return reply(`✅ AutoReact emoji set to ${text} 🩺`)
        }
        global.simonDB.auto[command] = text === 'on'
        return reply(`✅ *${command}* ${text === 'on' ? 'ENABLED 🟢' : 'DISABLED 🔴'} 🩺`)
      }

      // Anti Delete
      if (['antidelete','autodelete'].includes(command)) {
        if (!text) {
          return reply(`AntiDelete: ${global.simonDB.auto.antidelete ? 'ON 🟢' : 'OFF 🔴'}\n\nWhen ON, deleted messages will be recovered.\n\nUsage: .antidelete on/off`)
        }
        global.simonDB.auto.antidelete = text === 'on'
        return reply(`✅ AntiDelete ${text === 'on' ? 'ENABLED 🟢' : 'DISABLED 🔴'} 🩺`)
      }

      // Other auto features
      const others = [
        'autosticker','autorespond','autochat','autoai','autolevel','autojoin',
        'autoleave','autogroup','autoreject','autoapprove','autosave','autobackup',
        'autoclean','autopurge','autodownload','autopost','autoreply','autovoice',
        'autonsfw','antinsfwauto','autogc','autopc','autocall'
      ]

      if (others.includes(command)) {
        if (!text) {
          return reply(`Current *${command}*: \( {global.simonDB.auto[command] ? 'ON 🟢' : 'OFF 🔴'}\n\nUsage: . \){command} on/off`)
        }
        global.simonDB.auto[command] = text === 'on'
        return reply(`✅ *${command}* ${text === 'on' ? 'ENABLED 🟢' : 'DISABLED 🔴'}\n\n🩺`)
      }

    } catch (e) {
      reply(`❌ Auto Error: ${e.message} 🩺`)
    }
  }
        }
