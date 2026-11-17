// 🎬 SIMON MD - VIDEO EDITING - FREE, NO API, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

let ffmpegAvailable = null
async function checkFfmpeg(){
  if(ffmpegAvailable !== null) return ffmpegAvailable
  try{ await execAsync('ffmpeg -version'); ffmpegAvailable = true }catch{ ffmpegAvailable = false }
  return ffmpegAvailable
}
function run(cmd, timeout = 120000){
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout, maxBuffer: 1024*1024*50 }, (err, stdout, stderr) => {
      if(err) reject(new Error(stderr?.slice(-500) || err.message))
      else resolve(stdout)
    })
  })
}
async function getVideoBuffer(sock, m){
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const ctx = m.message?.extendedTextMessage?.contextInfo
  let targetMsg = null
  if(quoted) targetMsg = quoted
  else if(m.message?.videoMessage) targetMsg = m.message
  else if(m.message?.stickerMessage) targetMsg = m.message
  if(!targetMsg) return null
  try{
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
    let type = 'video'
    if(targetMsg.stickerMessage) type = 'sticker'
    const stream = await downloadContentFromMessage(targetMsg.videoMessage || targetMsg.stickerMessage, type)
    let buf = Buffer.from([])
    for await (const chunk of stream){ buf = Buffer.concat([buf, chunk]) }
    return buf.length ? buf : null
  }catch{ return null }
}
function tmpFile(ext='mp4'){
  const dir = path.join(__dirname, '../tmp')
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `vid_${Date.now()}_${Math.floor(Math.random()*9999)}.${ext}`)
}
function parseTime(str){
  // 10, 00:10, 0:30, 90s
  if(!str) return null
  str = str.trim().toLowerCase().replace('s','')
  if(/^\d+$/.test(str)) return parseInt(str)
  const parts = str.split(':').map(Number)
  if(parts.length === 2) return parts[0]*60 + parts[1]
  if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2]
  return null
}

module.exports = {
  command: ['videoediting','videoedit','vedit','trim','cut','compress','mute','unmute','speed','slowmo','fast','reverse','rotatevideo','flipvideo','tomp3','toaudio','tovideo2','gif','togif2','thumbnail','thumb','volume','watermark'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(['videoediting','videoedit','vedit'].includes(command)){
        const hasFfmpeg = await checkFfmpeg()
        await treply('Video Editing - Free No API', [
          line('ffmpeg', hasFfmpeg ? 'Installed ✅' : 'Not installed ❌ - run: apt install ffmpeg'),
          line('trim', '.trim 0 10 - reply video, cut 0-10s'),
          line('compress', '.compress - reply video'),
          line('mute', '.mute - reply video'),
          line('speed', '.speed 2x / .speed 0.5x'),
          line('reverse', '.reverse - reply video'),
          line('rotate', '.rotatevideo 90'),
          line('tomp3', '.tomp3 - reply video to audio'),
          line('gif', '.gif - reply video to gif'),
          line('thumb', '.thumb - get thumbnail'),
          line('note', 'Local ffmpeg only, no API, no upload')
        ])
        return
      }

      // Commands wey no need ffmpeg - toaudio via Baileys? Still need ffmpeg for mp3, but we check
      const needsVideo = ['trim','cut','compress','mute','unmute','speed','slowmo','fast','reverse','rotatevideo','flipvideo','tomp3','toaudio','gif','togif2','thumbnail','thumb','volume','watermark']
      if(needsVideo.includes(command)){
        const hasFfmpeg = await checkFfmpeg()
        if(!hasFfmpeg){
          await treply('Video Edit', [
            line('error', 'ffmpeg not installed'),
            line('termux', 'pkg install ffmpeg'),
            line('ubuntu', 'sudo apt install ffmpeg'),
            line('windows', 'Download ffmpeg from ffmpeg.org and add to PATH'),
            line('then', 'Restart bot')
          ])
          return
        }
        const buf = await getVideoBuffer(sock, m)
        if(!buf){ await treply('Video Edit', [line('usage', `Reply video with .${command}`)]); return }

        const input = tmpFile('mp4')
        const output = tmpFile(command === 'tomp3' || command === 'toaudio' ? 'mp3' : command === 'gif' || command === 'togif2' ? 'gif' : command === 'thumbnail' || command === 'thumb' ? 'jpg' : 'mp4')
        fs.writeFileSync(input, buf)

        try{
          let ffmpegCmd = ''
          let caption = ''
          if(['trim','cut'].includes(command)){
            // .trim 0 10  or .trim 10
            const parts = text.split(/\s+/).filter(Boolean)
            const start = parseTime(parts[0]) || 0
            const end = parseTime(parts[1])
            const dur = end ? end - start : 10
            if(dur <= 0){ await treply('Trim', [line('usage', '.trim 0 10 - start end in seconds')]); fs.unlinkSync(input); return }
            ffmpegCmd = `ffmpeg -y -ss ${start} -i "${input}" -t ${dur} -c:v libx264 -c:a aac "${output}"`
            caption = `Trimmed ${start}s - ${start+dur}s`
          } else if(command === 'compress'){
            ffmpegCmd = `ffmpeg -y -i "${input}" -vcodec libx264 -crf 28 -preset fast -c:a aac -b:a 128k "${output}"`
            caption = 'Compressed video'
          } else if(command === 'mute'){
            ffmpegCmd = `ffmpeg -y -i "${input}" -c:v copy -an "${output}"`
            caption = 'Muted video'
          } else if(command === 'unmute'){
            ffmpegCmd = `ffmpeg -y -i "${input}" -c:v copy -c:a aac "${output}"`
            caption = 'Video (audio kept)'
          } else if(['speed','slowmo','fast'].includes(command)){
            let sp = 2
            if(command === 'slowmo') sp = 0.5
            else {
              const match = text.match(/(\d+\.?\d*)/)
              sp = match ? parseFloat(match[1]) : 2
              if(sp <= 0 || sp > 4) sp = 2
            }
            // video + audio speed
            ffmpegCmd = `ffmpeg -y -i "${input}" -filter:v "setpts=${1/sp}*PTS" -filter:a "atempo=${sp}" "${output}"`
            caption = `Speed ${sp}x`
          } else if(command === 'reverse'){
            ffmpegCmd = `ffmpeg -y -i "${input}" -vf reverse -af areverse "${output}"`
            caption = 'Reversed video'
          } else if(command === 'rotatevideo'){
            const deg = parseInt(text) || 90
            const transpose = deg === 90 ? 'transpose=1' : deg === 180 ? 'transpose=2,transpose=2' : deg === 270 ? 'transpose=2' : 'transpose=1'
            ffmpegCmd = `ffmpeg -y -i "${input}" -vf "${transpose}" -c:a copy "${output}"`
            caption = `Rotated ${deg}°`
          } else if(command === 'flipvideo'){
            ffmpegCmd = `ffmpeg -y -i "${input}" -vf hflip -c:a copy "${output}"`
            caption = 'Flipped video'
          } else if(['tomp3','toaudio'].includes(command)){
            ffmpegCmd = `ffmpeg -y -i "${input}" -vn -c:a libmp3lame -q:a 4 "${output}"`
            caption = 'Audio extracted'
          } else if(['gif','togif2'].includes(command)){
            ffmpegCmd = `ffmpeg -y -i "${input}" -t 5 -vf "fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${output}"`
            caption = 'GIF (first 5s)'
          } else if(['thumbnail','thumb'].includes(command)){
            ffmpegCmd = `ffmpeg -y -ss 1 -i "${input}" -vframes 1 "${output}"`
            caption = 'Thumbnail'
          } else if(command === 'volume'){
            const vol = parseFloat(text) || 2
            ffmpegCmd = `ffmpeg -y -i "${input}" -filter:a "volume=${vol}" -c:v copy "${output}"`
            caption = `Volume ${vol}x`
          } else if(command === 'watermark'){
            // Text watermark - uses drawtext, needs font, fallback to simple
            const wm = text || 'SIMON MD'
            ffmpegCmd = `ffmpeg -y -i "${input}" -vf "drawtext=text='${wm.replace(/'/g,"")}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:x=10:y=10" -c:a copy "${output}"`
            caption = `Watermark: ${wm}`
          }

          if(!ffmpegCmd){ fs.unlinkSync(input); return }
          await sock.sendMessage(jid, { text: tiny('Processing video... please wait') }, { quoted: m }).catch(()=>{})
          await run(ffmpegCmd, 180000)
          if(!fs.existsSync(output)){ throw new Error('ffmpeg failed - output not created') }
          const outBuf = fs.readFileSync(output)
          if(command === 'tomp3' || command === 'toaudio'){
            await sock.sendMessage(jid, { audio: outBuf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m })
          } else if(command === 'gif' || command === 'togif2'){
            await sock.sendMessage(jid, { video: outBuf, gifPlayback: true, caption: tiny(caption) }, { quoted: m })
          } else if(command === 'thumbnail' || command === 'thumb'){
            await sock.sendMessage(jid, { image: outBuf, caption: tiny(caption) }, { quoted: m })
          } else {
            await sock.sendMessage(jid, { video: outBuf, caption: tiny(caption) }, { quoted: m })
          }
          try{ await reactCmd(sock, jid, m.key, command) }catch{}
          try{ await reactDone(sock, jid, m.key) }catch{}
          // cleanup
          try{ fs.unlinkSync(input); fs.unlinkSync(output) }catch{}
          return
        }catch(e){
          try{ if(fs.existsSync(input)) fs.unlinkSync(input); if(fs.existsSync(output)) fs.unlinkSync(output) }catch{}
          await treply('Video Edit Error', [line('error', e.message.slice(0,200)), line('tip', 'Video too big? Try short video < 30s')])
          return
        }
      }
      if(command === 'tovideo2'){
        const buf = await getVideoBuffer(sock, m)
        if(!buf){ await treply('To Video', [line('usage', 'Reply sticker/gif with .tovideo2')]); return }
        await sock.sendMessage(jid, { video: buf, gifPlayback: false }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }

    } catch(e){
      await sock.sendMessage(jid, { text: box('Video Edit Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
                                      }
