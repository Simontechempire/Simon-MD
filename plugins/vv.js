// 👁️ SIMON MD - VIEW ONCE BYPASS
module.exports = {
  command: ['vv','viewonce','vv2','vv3','vvimage','vvvideo','vvaudio','vvall','autovv','antiviewonce'],

  execute: async (sock, m, { command, text, reply }) => {
    global.simonDB = global.simonDB || { auto: { autovv: true } }
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

    try {
      // Toggle Auto VV
      if (['autovv','antiviewonce'].includes(command)) {
        if (!text) {
          return reply(`👁️ AutoVV: ${global.simonDB.auto.autovv ? 'ON 🟢' : 'OFF 🔴'}\n\nUsage: .autovv on/off\n\nWhen ON, view-once messages are auto opened.`)
        }
        global.simonDB.auto.autovv = text === 'on'
        return reply(`✅ AutoVV ${text === 'on' ? 'ENABLED 🟢' : 'DISABLED 🔴'} 🩺`)
      }

      if (command === 'vvall') {
        return reply(`👁️ *VIEW ONCE COMMANDS*\n\n.vv - Open view-once\n.vv2 - Open + save info\n.vv3 - Open + send to owner\n.vvimage - Extract image only\n.vvvideo - Extract video only\n.vvaudio - Extract audio only\n.autovv on/off - Auto bypass\n\n🩺 SIMON MD`)
      }

      // Find view-once media
      let mediaMessage = null

      if (quoted) {
        if (quoted.viewOnceMessage) mediaMessage = quoted.viewOnceMessage.message
        else if (quoted.viewOnceMessageV2) mediaMessage = quoted.viewOnceMessageV2.message
        else if (quoted.viewOnceMessageV2Extension) mediaMessage = quoted.viewOnceMessageV2Extension.message
        else mediaMessage = quoted
      }

      if (!mediaMessage && m.message?.viewOnceMessage) mediaMessage = m.message.viewOnceMessage.message
      if (!mediaMessage && m.message?.viewOnceMessageV2) mediaMessage = m.message.viewOnceMessageV2.message

      if (!mediaMessage) {
        return reply(`👁️ *VIEW ONCE BYPASS*\n\nReply to a view-once image/video/voice note with .vv\n\n🩺 SIMON MD`)
      }

      const type = Object.keys(mediaMessage)[0]
      const media = mediaMessage[type]

      // Basic .vv
      if (command === 'vv' || command === 'viewonce') {
        if (type === 'imageMessage') {
          await sock.sendMessage(m.key.remoteJid, { image: media, caption: `👁️ View Once Opened\n\n🩺 SIMON MD` }, { quoted: m })
        } else if (type === 'videoMessage') {
          await sock.sendMessage(m.key.remoteJid, { video: media, caption: `👁️ View Once Video Opened\n\n🩺` }, { quoted: m })
        } else if (type === 'audioMessage') {
          await sock.sendMessage(m.key.remoteJid, { audio: media, mimetype: 'audio/mp4', ptt: media.ptt || false }, { quoted: m })
        } else {
          await sock.sendMessage(m.key.remoteJid, { forward: mediaMessage }, { quoted: m })
        }
        return reply(`✅ View-once bypassed! 🩺`)
      }

      // .vv2
      if (command === 'vv2') {
        if (type === 'imageMessage') {
          await sock.sendMessage(m.key.remoteJid, { image: media, caption: `👁️ *VV2 - SAVED*\n\nViewOnce bypassed ✅\n\n🩺` }, { quoted: m })
        } else if (type === 'videoMessage') {
          await sock.sendMessage(m.key.remoteJid, { video: media, caption: `👁️ VV2 - Video saved 🩺` }, { quoted: m })
        }
        return
      }

      // .vv3 - also send to owner
      if (command === 'vv3') {
        const owner = '239166265317@s.whatsapp.net'
        if (type === 'imageMessage') {
          await sock.sendMessage(owner, { image: media, caption: `👁️ VV3 from group` })
          await sock.sendMessage(m.key.remoteJid, { image: media, caption: `👁️ Also sent to owner 🩺` }, { quoted: m })
        } else {
          await sock.sendMessage(owner, { forward: mediaMessage })
          await sock.sendMessage(m.key.remoteJid, { text: `✅ Forwarded to owner + here 🩺` })
        }
        return
      }

      // Specific extractors
      if (command === 'vvimage') {
        if (type !== 'imageMessage') return reply(`❌ This is not an image view-once`)
        await sock.sendMessage(m.key.remoteJid, { image: media, caption: `👁️ Image extracted 🩺` }, { quoted: m })
        return
      }

      if (command === 'vvvideo') {
        if (type !== 'videoMessage') return reply(`❌ This is not a video view-once`)
        await sock.sendMessage(m.key.remoteJid, { video: media, caption: `👁️ Video extracted 🩺` }, { quoted: m })
        return
      }

      if (command === 'vvaudio') {
        if (type !== 'audioMessage') return reply(`❌ This is not an audio view-once`)
        await sock.sendMessage(m.key.remoteJid, { audio: media, mimetype: 'audio/mp4', ptt: media.ptt || false }, { quoted: m })
        return
      }

    } catch (e) {
      reply(`❌ VV Error: ${e.message}\nMake sure you reply to a view-once message. 🩺`)
    }
  }
            }
