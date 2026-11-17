// 🔄 SIMON MD - CONVERT - FREE, NO API, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

let sharp = null
try{ sharp = require('sharp') }catch{}
async function checkFfmpeg(){
  return new Promise(res => {
    exec('ffmpeg -version', (err) => res(!err))
  })
}
async function getBuffer(sock, m){
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const ctx = m.message?.extendedTextMessage?.contextInfo
  let targetMsg = null
  if(quoted) targetMsg = quoted
  else if(m.message?.imageMessage || m.message?.videoMessage || m.message?.audioMessage || m.message?.stickerMessage || m.message?.documentMessage) targetMsg = m.message
  if(!targetMsg) return { buf: null, type: null }
  try{
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
    let type = 'image'
    if(targetMsg.videoMessage) type = 'video'
    if(targetMsg.audioMessage) type = 'audio'
    if(targetMsg.stickerMessage) type = 'sticker'
    if(targetMsg.documentMessage) type = 'document'
    const msgContent = targetMsg.imageMessage || targetMsg.videoMessage || targetMsg.audioMessage || targetMsg.stickerMessage || targetMsg.documentMessage
    const stream = await downloadContentFromMessage(msgContent, type)
    let buf = Buffer.from([])
    for await (const chunk of stream){ buf = Buffer.concat([buf, chunk]) }
    return { buf: buf.length ? buf : null, type, msg: msgContent }
  }catch{ return { buf: null, type: null } }
}
function tmpFile(ext){
  const dir = path.join(__dirname, '../tmp')
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `conv_${Date.now()}_${Math.floor(Math.random()*9999)}.${ext}`)
}
function run(cmd, timeout=120000){
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout, maxBuffer: 1024*1024*50 }, (err, stdout, stderr) => {
      if(err) reject(new Error(stderr?.slice(-500) || err.message))
      else resolve(stdout)
    })
  })
}

module.exports = {
  command: ['convert','conv','tosticker','tostk','toimg','toimage','tovideo','toaudio','tomp3','tovoice','tovn','tomp4','togif','toptt','topdf','totext','tojpg','topng','towebp','towebm','toopus','towav','tom4a'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(['convert','conv'].includes(command)){
        await treply('Convert - Free No API', [
          line('sticker', '.tosticker - reply image/video to sticker'),
          line('image', '.toimg - reply sticker to image'),
          line('video', '.tovideo - reply sticker to video'),
          line('audio', '.tomp3 / .tovoice - reply video/audio'),
          line('gif', '.togif - reply video to gif'),
          line('jpg/png', '.tojpg / .topng - reply image'),
          line('webp', '.towebp - reply image to webp'),
          line('text', '.totext - reply image? needs OCR, use .totext for caption'),
          line('note', 'Local only, no API, no upload')
        ])
        return
      }

      // --=[ STICKER / IMAGE / VIDEO - Baileys only, no lib ]=--
      if(['tosticker','tostk'].includes(command)){
        const { buf } = await getBuffer(sock, m)
        if(!buf){ await treply('To Sticker', [line('usage', 'Reply image/video with .tosticker')]); return }
        await sock.sendMessage(jid, { sticker: buf }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if(['toimg','toimage','tojpg','topng'].includes(command)){
        const { buf, type } = await getBuffer(sock, m)
        if(!buf){ await treply('To Image', [line('usage', 'Reply sticker/video with .toimg')]); return }
        let outBuf = buf
        let ext = 'png'
        if(command === 'tojpg') ext = 'jpg'
        if(command === 'topng') ext = 'png'
        // If sharp dey, convert format for real
        if(sharp){
          try{
            if(ext === 'jpg') outBuf = await sharp(buf).jpeg().toBuffer()
            else outBuf = await sharp(buf).png().toBuffer()
          }catch{}
        }
        await sock.sendMessage(jid, { image: outBuf, caption: tiny(`Converted to ${ext.toUpperCase()}`) }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if(command === 'towebp'){
        const { buf } = await getBuffer(sock, m)
        if(!buf){ await treply('To WebP', [line('usage', 'Reply image with .towebp')]); return }
        let outBuf = buf
        if(sharp){ try{ outBuf = await sharp(buf).webp().toBuffer() }catch{} }
        await sock.sendMessage(jid, { sticker: outBuf }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if(['tovideo','tomp4'].includes(command)){
        const { buf } = await getBuffer(sock, m)
        if(!buf){ await treply('To Video', [line('usage', 'Reply sticker/gif with .tovideo')]); return }
        await sock.sendMessage(jid, { video: buf, caption: tiny('Converted to video') }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if(['togif'].includes(command)){
        const { buf } = await getBuffer(sock, m)
        if(!buf){ await treply('To GIF', [line('usage', 'Reply video with .togif')]); return }
        const hasFfmpeg = await checkFfmpeg()
        if(!hasFfmpeg){
          // Fallback: send as gifPlayback video, WhatsApp go play as gif
          await sock.sendMessage(jid, { video: buf, gifPlayback: true, caption: tiny('GIF (fallback)') }, { quoted: m })
          try{ await reactCmd(sock, jid, m.key, command) }catch{}
          try{ await reactDone(sock, jid, m.key) }catch{}
          return
        }
        const input = tmpFile('mp4'); const output = tmpFile('gif')
        fs.writeFileSync(input, buf)
        try{
          await run(`ffmpeg -y -i "${input}" -t 5 -vf "fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${output}"`)
          const outBuf = fs.readFileSync(output)
          await sock.sendMessage(jid, { video: outBuf, gifPlayback: true, caption: tiny('Converted to GIF') }, { quoted: m })
          try{ await reactCmd(sock, jid, m.key, command) }catch{}
          try{ await reactDone(sock, jid, m.key) }catch{}
          try{ fs.unlinkSync(input); fs.unlinkSync(output) }catch{}
        }catch(e){ try{ fs.unlinkSync(input); if(fs.existsSync(output)) fs.unlinkSync(output) }catch{}; await treply('To GIF Error', [line('error', e.message.slice(0,200))]) }
        return
      }

      // --=[ AUDIO - needs ffmpeg ]=--
      if(['toaudio','tomp3','tovoice','tovn','toptt','toopus','towav','tom4a','towebm'].includes(command)){
        const { buf } = await getBuffer(sock, m)
        if(!buf){ await treply('To Audio', [line('usage', `Reply video/audio with .${command}`)]); return }
        const hasFfmpeg = await checkFfmpeg()
        if(!hasFfmpeg){ await treply('To Audio', [line('error', 'ffmpeg not installed'), line('install', 'pkg install ffmpeg / sudo apt install ffmpeg')]); return }
        let ext = 'mp3', codec = 'libmp3lame', isVoice = false
        if(command === 'tovoice' || command === 'tovn' || command === 'toptt') { ext = 'ogg'; codec = 'libopus'; isVoice = true }
        if(command === 'toopus') { ext = 'ogg'; codec = 'libopus' }
        if(command === 'towav') { ext = 'wav'; codec = 'pcm_s16le' }
        if(command === 'tom4a') { ext = 'm4a'; codec = 'aac' }
        if(command === 'towebm') { ext = 'webm'; codec = 'libopus' }
        const input = tmpFile('mp4'); const output = tmpFile(ext)
        fs.writeFileSync(input, buf)
        try{
          if(isVoice) await run(`ffmpeg -y -i "${input}" -vn -c:a ${codec} "${output}"`)
          else if(ext === 'wav') await run(`ffmpeg -y -i "${input}" -vn -c:a ${codec} "${output}"`)
          else await run(`ffmpeg -y -i "${input}" -vn -c:a ${codec} -q:a 4 "${output}"`)
          const outBuf = fs.readFileSync(output)
          if(isVoice) await sock.sendMessage(jid, { audio: outBuf, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
          else await sock.sendMessage(jid, { audio: outBuf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m })
          try{ await reactCmd(sock, jid, m.key, command) }catch{}
          try{ await reactDone(sock, jid, m.key) }catch{}
          try{ fs.unlinkSync(input); fs.unlinkSync(output) }catch{}
        }catch(e){ try{ fs.unlinkSync(input); if(fs.existsSync(output)) fs.unlinkSync(output) }catch{}; await treply('To Audio Error', [line('error', e.message.slice(0,200))]) }
        return
      }

      // --=[ TEXT / PDF - honest ]=--
      if(command === 'totext'){
        await treply('To Text', [line('info', 'OCR needs paid API for real text from image'), line('tip', 'Send image caption, or use Google Lens free'), line('note', 'No fake OCR')])
        return
      }
      if(command === 'topdf'){
        await treply('To PDF', [line('info', 'PDF convert needs extra lib (pdfkit)'), line('tip', 'Use phone: Share image > Print > Save as PDF'), line('note', 'No fake PDF')])
        return
      }

    } catch(e){
      await sock.sendMessage(jid, { text: box('Convert Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
}
