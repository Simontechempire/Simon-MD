// 🩹 SIMON MD - STICKER - REAL HANDLER - FIXED
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

async function downloadMedia(msg, type){
  const stream = await downloadContentFromMessage(msg, type)
  let buf = Buffer.from([])
  for await (const chunk of stream){ buf = Buffer.concat([buf, chunk]) }
  return buf
}
function getQuoted(m){
  const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || m.message?.stickerMessage?.contextInfo || {}
  return { quoted: ctx.quotedMessage, participant: ctx.participant, stanzaId: ctx.stanzaId }
}

module.exports = {
  command: [
    'sticker','s','sticker2','sgif','stickergif','toimg','toimage','tovideo','tosticker',
    'take','steal','wm','setwm','getsticker','stickerinfo','emojimix','emoji','qc','quote'
  ],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    const done = async () => { try{ await reactCmd(sock, jid, m.key, command) }catch{}; try{ await reactDone(sock, jid, m.key) }catch{} }

    try {
      // --=[ STICKER / S ]=--
      if (['sticker','s','sticker2'].includes(command)) {
        const { quoted } = getQuoted(m)
        // 1) direct image/video 2) quoted image/video/sticker 3) quoted viewOnce image/video
        const directImg = m.message?.imageMessage
        const directVid = m.message?.videoMessage
        const qImg = quoted?.imageMessage || quoted?.viewOnceMessage?.message?.imageMessage || quoted?.viewOnceMessageV2?.message?.imageMessage || quoted?.viewOnceMessageV2?.message?.ephemeralMessage?.message?.imageMessage
        const qVid = quoted?.videoMessage || quoted?.viewOnceMessage?.message?.videoMessage || quoted?.viewOnceMessageV2?.message?.videoMessage
        const qSticker = quoted?.stickerMessage

        // FIX: old code only check direct image, so reply image no work. Now check all.
        if (qSticker && command === 'sticker2') {
          // sticker -> sticker again with new pack
          const buf = await downloadMedia(qSticker, 'sticker')
          await sock.sendMessage(jid, { sticker: buf, packname: 'SIMON MD', author: 'SIMON' }, { quoted: m })
          await done(); return
        }
        if (directImg || qImg) {
          const buf = await downloadMedia(directImg || qImg, 'image')
          if(!buf?.length){ await treply('Sticker', [line('error', 'Failed download image')]); return }
          await sock.sendMessage(jid, { sticker: buf, packname: 'SIMON MD', author: text || 'SIMON' }, { quoted: m })
          await done(); return
        }
        if (directVid || qVid) {
          const vidMsg = directVid || qVid
          // FIX: video > 10s go fail as sticker, warn user
          if(vidMsg.seconds && vidMsg.seconds > 10){
            await treply('Sticker', [line('error', 'Video too long, max 10s for sticker'), line('seconds', `${vidMsg.seconds}`)]); return
          }
          const buf = await downloadMedia(vidMsg, 'video')
          if(!buf?.length){ await treply('Sticker', [line('error', 'Failed download video')]); return }
          await sock.sendMessage(jid, { sticker: buf, packname: 'SIMON MD', author: text || 'SIMON' }, { quoted: m })
          await done(); return
        }
        await treply('Sticker', [line('usage', 'Send / reply image/video with .s'), line('example', '.s SIMON')])
        return
      }

      // --=[ SGIF / STICKERGIF ]=--
      if (['sgif','stickergif'].includes(command)) {
        const { quoted } = getQuoted(m)
        const vid = m.message?.videoMessage || quoted?.videoMessage
        if(!vid){ await treply('Sticker GIF', [line('error', 'Reply a video / GIF with .sgif')]); return }
        if(vid.seconds && vid.seconds > 10){ await treply('Sticker GIF', [line('error', 'Video too long, max 10s')]); return }
        const buf = await downloadMedia(vid, 'video')
        await sock.sendMessage(jid, { sticker: buf, packname: 'SIMON MD', author: 'SIMON' }, { quoted: m })
        await done(); return
      }

      // --=[ TOIMG / TOIMAGE - sticker -> image ]=--
      if (['toimg','toimage'].includes(command)) {
        const { quoted } = getQuoted(m)
        const st = m.message?.stickerMessage || quoted?.stickerMessage
        if(!st){ await treply('To Image', [line('error', 'Reply a sticker with .toimg')]); return }
        const buf = await downloadMedia(st, 'sticker')
        // Sticker na webp, WhatsApp go show am as image if we send as image
        await sock.sendMessage(jid, { image: buf, caption: box('Sticker to Image', [line('status', 'done')]) }, { quoted: m })
        await done(); return
      }

      // --=[ TOVIDEO - sticker -> video ]=--
      if (['tovideo'].includes(command)) {
        const { quoted } = getQuoted(m)
        const st = m.message?.stickerMessage || quoted?.stickerMessage
        if(!st){ await treply('To Video', [line('error', 'Reply a sticker with .tovideo')]); return }
        const buf = await downloadMedia(st, 'sticker')
        await sock.sendMessage(jid, { video: buf, caption: box('Sticker to Video', [line('status', 'done')]) }, { quoted: m })
        await done(); return
      }

      // --=[ TAKE / STEAL / WM - change pack/author ]=--
      if (['take','steal','wm','setwm'].includes(command)) {
        const { quoted } = getQuoted(m)
        const st = m.message?.stickerMessage || quoted?.stickerMessage
        if(!st){ await treply('Take Sticker', [line('error', 'Reply a sticker with .take <name>')]); return }
        const buf = await downloadMedia(st, 'sticker')
        const pack = text || 'SIMON MD'
        await sock.sendMessage(jid, { sticker: buf, packname: pack, author: 'SIMON MD' }, { quoted: m })
        await done(); return
      }

      // --=[ EMOJIMIX ]=--
      if (['emojimix','emoji'].includes(command)) {
        // .emojimix 😂+😭  - use tenor API, fallback to pollinations
        if(!text || !text.includes('+')){
          await treply('Emoji Mix', [line('usage', '.emojimix 😂+😭')]); return
        }
        const [e1, e2] = text.split('+').map(s => s.trim())
        if(!e1 || !e2){ await treply('Emoji Mix', [line('error', 'Need 2 emojis with +')]); return }
        try{
          const axios = require('axios')
          const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v6&q=${encodeURIComponent(e1 + '_' + e2)}`
          const res = await axios.get(url, { timeout: 15000 })
          const imgUrl = res.data?.results?.[0]?.media_formats?.png_transparent?.url
          if(imgUrl){
            await sock.sendMessage(jid, { sticker: { url: imgUrl }, packname: 'SIMON MD', author: 'EMOJI MIX' }, { quoted: m })
            await done(); return
          }
          throw new Error('No mix found')
        }catch(e){
          await treply('Emoji Mix', [line('error', 'No mix for those emojis, try another pair')])
        }
        return
      }

      // --=[ QC / QUOTE - fake quote image via API ]=--
      if (['qc','quote'].includes(command)) {
        const { quoted } = getQuoted(m)
        const qText = quoted?.conversation || quoted?.extendedTextMessage?.text || text
        if(!qText){ await treply('Quote', [line('error', 'Reply message or .qc <text>')]); return }
        // Use quotly API
        try{
          const axios = require('axios')
          const senderName = m.pushName || 'User'
          const avatar = await sock.profilePictureUrl(m.key.participant || jid, 'image').catch(()=> 'https://i.pravatar.cc/100')
          const payload = { type: 'quote', format: 'png', backgroundColor: '#000000', width: 512, height: 768, scale: 2, messages: [{ entities: [], avatar: true, from: { id: 1, name: senderName, photo: { url: avatar } }, text: qText, replyMessage: {} }] }
          const res = await axios.post('https://bot.lyo.su/quote/generate', payload, { responseType: 'arraybuffer', timeout: 20000 })
          if(res.data?.length > 1000){
            await sock.sendMessage(jid, { sticker: Buffer.from(res.data), packname: 'SIMON MD', author: 'QUOTE' }, { quoted: m })
            await done(); return
          }
          throw new Error('Quote failed')
        }catch(e){
          await treply('Quote', [line('error', 'Quote API down, try again later')])
        }
        return
      }

      if (['getsticker','stickerinfo'].includes(command)) {
        await treply('Sticker Info', [line('usage', '.s reply image/video'), line('toimg', '.toimg reply sticker'), line('take', '.take <pack> reply sticker')])
        return
      }

    } catch (e) {
      await sock.sendMessage(jid, { text: box('Sticker Error', [line('error', e.message), line('info', 'Send / reply image/video with .s')]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
      }
