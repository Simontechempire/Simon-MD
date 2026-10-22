// 🎨 SIMON MD - LOGO MAKER
const axios = require('axios')

module.exports = {
  command: [
    'logo1','logo2','logo3','logo4','logo5','logo6','logo7','logo8','logo9','logo10',
    'logofire','logosimon','logogold','logosilver','logoneon','logoblood','logolava',
    'logoice','logogalaxy','logothunder','logopubg','logoff','logoanime','logomarvel',
    'logodc','logogaming','logo3d','logoname','logotext','textpro1','textpro2','textpro3',
    'textpro4','textpro5','textpro6','textpro7','textpro8','textpro9','textpro10',
    'ephoto1','ephoto2','ephoto3','ephoto4','ephoto5','banner','thumbnail','ytthumb',
    'cover','gaminglogo','simonpack'
  ],

  execute: async (sock, m, { command, text, reply }) => {
    if (!text) return reply(`🎨 Usage: .\( {command} <text>\n\nExample: . \){command} SIMON MD\n\n🩺 LOGO MAKER`)

    try {
      const apis = {
        logo1: `https://api.siputzx.my.id/api/textpro/blackpink?text=${encodeURIComponent(text)}`,
        logo2: `https://api.siputzx.my.id/api/textpro/neon?text=${encodeURIComponent(text)}`,
        logo3: `https://api.siputzx.my.id/api/textpro/glitch?text=${encodeURIComponent(text)}`,
        logo4: `https://api.siputzx.my.id/api/textpro/bear?text=${encodeURIComponent(text)}`,
        logo5: `https://api.siputzx.my.id/api/textpro/futuristic?text=${encodeURIComponent(text)}`,
        logo6: `https://api.siputzx.my.id/api/textpro/3d?text=${encodeURIComponent(text)}`,
        logo7: `https://api.siputzx.my.id/api/textpro/fire?text=${encodeURIComponent(text)}`,
        logo8: `https://api.siputzx.my.id/api/textpro/matrix?text=${encodeURIComponent(text)}`,
        logo9: `https://api.siputzx.my.id/api/textpro/metallic?text=${encodeURIComponent(text)}`,
        logo10: `https://api.siputzx.my.id/api/textpro/horror?text=${encodeURIComponent(text)}`,
        logofire: `https://api.siputzx.my.id/api/textpro/fire?text=${encodeURIComponent(text)}`,
        logosimon: `https://api.siputzx.my.id/api/textpro/simon?text=${encodeURIComponent(text)}`,
        logogold: `https://api.siputzx.my.id/api/textpro/golden?text=${encodeURIComponent(text)}`,
        logosilver: `https://api.siputzx.my.id/api/textpro/silver?text=${encodeURIComponent(text)}`,
        logoneon: `https://api.siputzx.my.id/api/textpro/neon?text=${encodeURIComponent(text)}`,
        logoblood: `https://api.siputzx.my.id/api/textpro/blood?text=${encodeURIComponent(text)}`,
        logolava: `https://api.siputzx.my.id/api/textpro/lava?text=${encodeURIComponent(text)}`,
        logo3d: `https://api.siputzx.my.id/api/textpro/3d?text=${encodeURIComponent(text)}`,
        logogaming: `https://api.siputzx.my.id/api/textpro/gaming?text=${encodeURIComponent(text)}`,
        banner: `https://api.siputzx.my.id/api/textpro/3d?text=${encodeURIComponent(text)}`,
        gaminglogo: `https://api.siputzx.my.id/api/textpro/gaming?text=${encodeURIComponent(text)}`,
        simonpack: `https://api.siputzx.my.id/api/textpro/simon?text=${encodeURIComponent(text)}`
      }

      let apiUrl = apis[command] || `https://api.siputzx.my.id/api/textpro/3d?text=${encodeURIComponent(text)}`

      try {
        const res = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 15000 })
        if (res.data && res.data.length > 1000) {
          await sock.sendMessage(m.key.remoteJid, {
            image: Buffer.from(res.data),
            caption: `🎨 *${command.toUpperCase()}*\nText: ${text}\n\n🩺 SIMON MD - LOGO MAKER`
          }, { quoted: m })
          return
        }
      } catch {}

      // Fallback
      const fallback = `https://image.pollinations.ai/prompt/${encodeURIComponent(command + ' logo with text ' + text)}?width=800&height=400&nologo=true`
      await sock.sendMessage(m.key.remoteJid, {
        image: { url: fallback },
        caption: `🎨 *${command.toUpperCase()}*\nText: ${text}\n\n🩺 SIMON MD LOGO MAKER`
      }, { quoted: m })

    } catch (e) {
      reply(`❌ Logo Error: ${e.message}\nTry again later 🩺`)
    }
  }
    }
