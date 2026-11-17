// 🖼️ SIMON MD - PHOTO EDITING - FREE, NO API, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style
const fs = require('fs')
const path = require('path')

// Try local libs - no API. Install one: npm i sharp  OR  npm i jimp
let sharp = null, Jimp = null
try{ sharp = require('sharp') }catch{}
try{ Jimp = require('jimp') }catch{}

async function getImageBuffer(sock, m){
  // Reply image / sticker / own image
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const ctx = m.message?.extendedTextMessage?.contextInfo
  let targetMsg = null, targetKey = null
  if(quoted){
    targetMsg = quoted
    targetKey = { remoteJid: m.key.remoteJid, id: ctx?.stanzaId, participant: ctx?.participant }
  } else if(m.message?.imageMessage){
    targetMsg = m.message
    targetKey = m.key
  } else if(m.message?.stickerMessage){
    targetMsg = m.message
    targetKey = m.key
  }
  if(!targetMsg) return null
  try{
    // Baileys download
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
    let type = 'image'
    if(targetMsg.stickerMessage) type = 'sticker'
    if(targetMsg.videoMessage) type = 'video'
    const stream = await downloadContentFromMessage(targetMsg.imageMessage || targetMsg.stickerMessage || targetMsg.videoMessage, type)
    let buf = Buffer.from([])
    for await (const chunk of stream){ buf = Buffer.concat([buf, chunk]) }
    return buf.length ? buf : null
  }catch(e){ return null }
}

async function applyEffect(buf, effect){
  // 1) sharp - fastest, best
  if(sharp){
    let pipeline = sharp(buf)
    if(effect === 'grayscale') pipeline = pipeline.grayscale()
    if(effect === 'invert') pipeline = pipeline.negate()
    if(effect === 'blur') pipeline = pipeline.blur(5)
    if(effect === 'sharpen') pipeline = pipeline.sharpen()
    if(effect === 'flip') pipeline = pipeline.flip()
    if(effect === 'flop') pipeline = pipeline.flop()
    if(effect === 'rotate90') pipeline = pipeline.rotate(90)
    if(effect === 'rotate180') pipeline = pipeline.rotate(180)
    if(effect === 'sepia') pipeline = pipeline.modulate({ brightness: 1.1, saturation: 0.6, hue: 30 })
    if(effect === 'bright') pipeline = pipeline.modulate({ brightness: 1.5 })
    if(effect === 'dark') pipeline = pipeline.modulate({ brightness: 0.6 })
    if(effect === 'contrast') pipeline = pipeline.linear(1.5, -50)
    if(effect === 'pixelate') {
      const meta = await sharp(buf).metadata()
      const w = Math.max(10, Math.floor((meta.width||500)/20))
      pipeline = pipeline.resize(w, null).resize(meta.width||500, null, { kernel: 'nearest' })
    }
    if(effect === 'resize') pipeline = pipeline.resize(512, 512, { fit: 'cover' })
    if(effect === 'circle'){
      // Circle crop - need composite, use sharp with svg mask
      const meta = await sharp(buf).metadata()
      const size = Math.min(meta.width||500, meta.height||500)
      const svg = `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" /></svg>`
      pipeline = pipeline.resize(size, size, { fit: 'cover' }).composite([{ input: Buffer.from(svg), blend: 'dest-in' }]).png()
    }
    return await pipeline.png().toBuffer()
  }
  // 2) jimp fallback
  if(Jimp){
    const img = await Jimp.read(buf)
    if(effect === 'grayscale') img.grayscale()
    if(effect === 'invert') img.invert()
    if(effect === 'blur') img.blur(5)
    if(effect === 'flip') img.flip(false, true)
    if(effect === 'flop') img.flip(true, false)
    if(effect === 'rotate90') img.rotate(90)
    if(effect === 'rotate180') img.rotate(180)
    if(effect === 'sepia') img.sepia()
    if(effect === 'bright') img.brightness(0.3)
    if(effect === 'dark') img.brightness(-0.3)
    if(effect === 'contrast') img.contrast(0.5)
    if(effect === 'pixelate') img.pixelate(10)
    if(effect === 'resize') img.resize(512, 512)
    if(effect === 'sharpen') img.convolute([[0,-1,0],[-1,5,-1],[0,-1,0]])
    if(effect === 'circle') img.circle()
    return await img.getBufferAsync(Jimp.MIME_PNG)
  }
  return null // no lib
}

const EFFECTS = ['grayscale','invert','blur','sharpen','flip','flop','rotate90','rotate180','sepia','bright','dark','contrast','pixelate','resize','circle']

module.exports = {
  command: ['photoediting','edit','filter','grayscale','grey','invert','blur','sharpen','flip','flop','rotate','sepia','bright','dark','contrast','pixelate','resize','circle','sticker','s','toimg','toimage','tovideo','tosticker','togif'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(['photoediting','edit','filter'].includes(command)){
        await treply('Photo Editing - Free No API', [
          line('usage', 'Reply image with .<effect>'),
          line('effects', EFFECTS.join(', ')),
          line('example', 'Reply image with .grayscale'),
          line('sticker', '.s - reply image to sticker'),
          line('toimg', '.toimg - reply sticker to image'),
          line('install', 'npm i sharp  (for filters)'),
          line('note', 'No API, no key - local only')
        ])
        return
      }
      // --=[ STICKER / TOIMG - no lib needed, Baileys only ]=--
      if(['sticker','s'].includes(command)){
        const buf = await getImageBuffer(sock, m)
        if(!buf){ await treply('Sticker', [line('usage', 'Reply image / send image with .s')]); return }
        // If video, send as sticker video - Baileys handle
        await sock.sendMessage(jid, { sticker: buf }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if(['toimg','toimage'].includes(command)){
        const buf = await getImageBuffer(sock, m)
        if(!buf){ await treply('To Image', [line('usage', 'Reply sticker with .toimg')]); return }
        await sock.sendMessage(jid, { image: buf, caption: tiny('Converted to image') }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if(['tovideo','togif'].includes(command)){
        const buf = await getImageBuffer(sock, m)
        if(!buf){ await treply('To Video', [line('usage', 'Reply sticker with .tovideo')]); return }
        await sock.sendMessage(jid, { video: buf, gifPlayback: true, caption: tiny('Converted to video') }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if(['tosticker'].includes(command)){
        const buf = await getImageBuffer(sock, m)
        if(!buf){ await treply('To Sticker', [line('usage', 'Reply image with .tosticker')]); return }
        await sock.sendMessage(jid, { sticker: buf }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      // --=[ FILTERS - need sharp or jimp ]=--
      let effect = command
      if(command === 'grey') effect = 'grayscale'
      if(command === 'rotate'){
        const deg = parseInt(text) || 90
        effect = deg === 180 ? 'rotate180' : 'rotate90'
      }
      if(!EFFECTS.includes(effect)){ await treply('Photo Edit', [line('error', `Unknown effect ${command}`), line('effects', EFFECTS.join(', '))]); return }

      const buf = await getImageBuffer(sock, m)
      if(!buf){ await treply('Photo Edit', [line('usage', `Reply image with .${effect}`)]); return }

      if(!sharp && !Jimp){
        await treply('Photo Edit', [
          line('error', 'No image lib installed'),
          line('install', 'npm i sharp'),
          line('or', 'npm i jimp'),
          line('then', 'Restart bot and try again'),
          line('note', 'Sticker / ToImg still work without lib')
        ])
        return
      }
      const out = await applyEffect(buf, effect)
      if(!out){ await treply('Photo Edit', [line('error', 'Failed to edit image')]); return }
      await sock.sendMessage(jid, { image: out, caption: tiny(`Effect: ${effect}`) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
      return

    } catch(e){
      await sock.sendMessage(jid, { text: box('Photo Edit Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
       }
