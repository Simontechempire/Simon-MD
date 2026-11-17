// 🎨 SIMON MD - LOGO MAKER - FIXED
const axios = require('axios')
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

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
    const jid = m.key.remoteJid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }

    if (!text) {
      await treply('Logo Maker', [line('usage', `.${command} SIMON MD`), line('example', `.${command} SIMON`), line('info', 'Text max 20 chars')])
      return
    }
    if (text.length > 20) {
      await treply('Logo Maker', [line('error', 'Text too long, max 20 chars')])
      return
    }
    const clean = text.trim()

    // FIX: every command get real mapping, no silent fallback to 3d for all
    const BASE = 'https://api.siputzx.my.id/api/textpro'
    const apis = {
      logo1: `${BASE}/blackpink?text=${encodeURIComponent(clean)}`,
      logo2: `${BASE}/neon?text=${encodeURIComponent(clean)}`,
      logo3: `${BASE}/glitch?text=${encodeURIComponent(clean)}`,
      logo4: `${BASE}/bear?text=${encodeURIComponent(clean)}`,
      logo5: `${BASE}/futuristic?text=${encodeURIComponent(clean)}`,
      logo6: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      logo7: `${BASE}/fire?text=${encodeURIComponent(clean)}`,
      logo8: `${BASE}/matrix?text=${encodeURIComponent(clean)}`,
      logo9: `${BASE}/metallic?text=${encodeURIComponent(clean)}`,
      logo10: `${BASE}/horror?text=${encodeURIComponent(clean)}`,
      logofire: `${BASE}/fire?text=${encodeURIComponent(clean)}`,
      logosimon: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      logogold: `${BASE}/golden?text=${encodeURIComponent(clean)}`,
      logosilver: `${BASE}/silver?text=${encodeURIComponent(clean)}`,
      logoneon: `${BASE}/neon?text=${encodeURIComponent(clean)}`,
      logoblood: `${BASE}/blood?text=${encodeURIComponent(clean)}`,
      logolava: `${BASE}/lava?text=${encodeURIComponent(clean)}`,
      logoice: `${BASE}/ice?text=${encodeURIComponent(clean)}`,
      logogalaxy: `${BASE}/galaxy?text=${encodeURIComponent(clean)}`,
      logothunder: `${BASE}/thunder?text=${encodeURIComponent(clean)}`,
      logopubg: `${BASE}/pubg?text=${encodeURIComponent(clean)}`,
      logoff: `${BASE}/ff?text=${encodeURIComponent(clean)}`,
      logoanime: `${BASE}/anime?text=${encodeURIComponent(clean)}`,
      logomarvel: `${BASE}/marvel?text=${encodeURIComponent(clean)}`,
      logodc: `${BASE}/dc?text=${encodeURIComponent(clean)}`,
      logogaming: `${BASE}/gaming?text=${encodeURIComponent(clean)}`,
      logo3d: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      logoname: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      logotext: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      textpro1: `${BASE}/blackpink?text=${encodeURIComponent(clean)}`,
      textpro2: `${BASE}/neon?text=${encodeURIComponent(clean)}`,
      textpro3: `${BASE}/glitch?text=${encodeURIComponent(clean)}`,
      textpro4: `${BASE}/bear?text=${encodeURIComponent(clean)}`,
      textpro5: `${BASE}/futuristic?text=${encodeURIComponent(clean)}`,
      textpro6: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      textpro7: `${BASE}/fire?text=${encodeURIComponent(clean)}`,
      textpro8: `${BASE}/matrix?text=${encodeURIComponent(clean)}`,
      textpro9: `${BASE}/metallic?text=${encodeURIComponent(clean)}`,
      textpro10: `${BASE}/horror?text=${encodeURIComponent(clean)}`,
      ephoto1: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      ephoto2: `${BASE}/neon?text=${encodeURIComponent(clean)}`,
      ephoto3: `${BASE}/fire?text=${encodeURIComponent(clean)}`,
      ephoto4: `${BASE}/golden?text=${encodeURIComponent(clean)}`,
      ephoto5: `${BASE}/galaxy?text=${encodeURIComponent(clean)}`,
      banner: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      thumbnail: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      ytthumb: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      cover: `${BASE}/3d?text=${encodeURIComponent(clean)}`,
      gaminglogo: `${BASE}/gaming?text=${encodeURIComponent(clean)}`,
      simonpack: `${BASE}/3d?text=${encodeURIComponent(clean)}`
    }
    const apiUrl = apis[command] || apis.logo3d

    try {
      // FIX: check content-type is image, no send JSON error as image
      const res = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 20000, validateStatus: () => true })
      const ctype = String(res.headers?.['content-type'] || '')
      if (res.status === 200 && ctype.includes('image') && res.data && res.data.length > 1000) {
        await sock.sendMessage(jid, {
          image: Buffer.from(res.data),
          caption: box(command.toUpperCase(), [line('text', clean), line('by', 'SIMON MD')])
        }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      // If Siputzx return JSON error, fall through to Pollinations
      console.log('[LOGO] Siputzx failed', command, res.status, ctype)
    } catch(e) { console.log('[LOGO] Siputzx error', e.message) }

    // Fallback - Pollinations
    try {
      const fallback = `https://image.pollinations.ai/prompt/${encodeURIComponent(command + ' logo with text ' + clean + ', high quality, centered') }?width=800&height=400&nologo=true`
      const fres = await axios.get(fallback, { responseType: 'arraybuffer', timeout: 20000, validateStatus: () => true })
      const ftype = String(fres.headers?.['content-type'] || '')
      if (fres.status === 200 && ftype.includes('image') && fres.data?.length > 1000) {
        await sock.sendMessage(jid, {
          image: Buffer.from(fres.data),
          caption: box(command.toUpperCase(), [line('text', clean), line('by', 'SIMON MD - FALLBACK')])
        }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      throw new Error('Fallback no return image')
    } catch(e) {
      await treply('Logo Error', [line('error', 'Logo API down, try again later'), line('command', command)])
    }
  }
    }
