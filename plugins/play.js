// 🎵 SIMON MD - PLAY - FREE MUSIC, NO API KEY - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

// Install needed: pip install yt-dlp  +  pkg install ffmpeg / sudo apt install ffmpeg
// yt-dlp = free, no API key. ffmpeg = convert to mp3.

async function checkTool(cmd){
  return new Promise(res => {
    exec(`${cmd} --version`, (err) => res(!err))
  })
}
function run(cmd, timeout=180000){
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout, maxBuffer: 1024*1024*100 }, (err, stdout, stderr) => {
      if(err) reject(new Error(stderr?.slice(-800) || err.message))
      else resolve(stdout)
    })
  })
}
function tmpFile(ext){
  const dir = path.join(__dirname, '../tmp')
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `play_${Date.now()}_${Math.floor(Math.random()*9999)}.${ext}`)
}
function cleanName(s){ return s.replace(/[^\w\s-]/g,'').trim().slice(0,60) || 'song' }

// iTunes free preview - no key, no download, legal 30s preview
async function itunesPreview(query){
  try{
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=3`
    const res = await fetch(url)
    if(!res.ok) return null
    const data = await res.json()
    if(!data.results?.length) return null
    return data.results.map(r => ({ title: `${r.trackName} - ${r.artistName}`, link: r.previewUrl, album: r.collectionName, image: r.artworkUrl100 }))
  }catch{ return null }
}

module.exports = {
  command: ['play','music','song','audio','ytmp3','ytaudio','playaudio','preview','spotify','soundcloud','downloadsong'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(['play','music','song','audio'].includes(command) && !text){
        await treply('Play - Free Music No API Key', [
          line('play', '.play Asake Lonely At The Top'),
          line('preview', '.preview Asake - 30s free preview, no download'),
          line('install', 'pip install yt-dlp + ffmpeg'),
          line('note', 'yt-dlp = free, no key. Use for free / your own music'),
          line('limit', 'WhatsApp audio max ~16MB, long song go fail')
        ])
        return
      }

      // --=[ PREVIEW - iTunes free, no yt-dlp needed ]=--
      if(command === 'preview'){
        if(!text){ await treply('Preview', [line('usage', '.preview Asake')]); return }
        const results = await itunesPreview(text)
        if(!results){ await treply('Preview', [line('error', `No preview for "${text}"`), line('tip', 'Try .play ' + text)]); return }
        const r = results[0]
        // Download preview mp3 (30s, free from Apple) and send
        try{
          const res = await fetch(r.link)
          const buf = Buffer.from(await res.arrayBuffer())
          await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mpeg', ptt: false, fileName: `${cleanName(r.title)}.mp3` }, { quoted: m })
          await treply('Preview - iTunes 30s', [line('song', r.title), line('album', r.album || ''), line('note', '30s preview, free, legal')])
        }catch(e){ await treply('Preview', [line('error', e.message)]) }
        return
      }

      // --=[ PLAY - yt-dlp, no API key ]=--
      if(['play','music','song','audio','ytmp3','ytaudio','playaudio','downloadsong'].includes(command)){
        if(!text){ await treply('Play', [line('usage', '.play Asake Lonely At The Top')]); return }

        const hasYtDlp = await checkTool('yt-dlp')
        const hasFfmpeg = await checkTool('ffmpeg')
        if(!hasYtDlp){
          await treply('Play', [
            line('error', 'yt-dlp not installed'),
            line('termux', 'pip install yt-dlp'),
            line('ubuntu', 'pip install yt-dlp'),
            line('windows', 'pip install yt-dlp'),
            line('ffmpeg', 'pkg install ffmpeg / sudo apt install ffmpeg'),
            line('then', 'Restart bot'),
            line('fast', 'Try .preview ' + text + ' - no install needed')
          ])
          return
        }
        if(!hasFfmpeg){
          await treply('Play', [line('error', 'ffmpeg not installed'), line('install', 'pkg install ffmpeg / sudo apt install ffmpeg')])
          return
        }

        await sock.sendMessage(jid, { text: tiny(`Searching: ${text}... please wait 20-60s`) }, { quoted: m }).catch(()=>{})

        const outputBase = tmpFile('mp3').replace('.mp3','')
        const output = outputBase + '.mp3'
        // yt-dlp search 1 result, extract audio, mp3, max 10 mins, no playlist
        // --no-playlist, --max-filesize 16M (WhatsApp limit)
        const safeQuery = text.replace(/"/g,'').replace(/'/g,'').replace(/`/g,'').slice(0,100)
        const cmd = `yt-dlp -x --audio-format mp3 --audio-quality 5 --no-playlist --max-filesize 16M --match-filter "duration < 600" --default-search "ytsearch1:" -o "${outputBase}.%(ext)s" "${safeQuery}"`

        try{
          await run(cmd, 180000)
          // yt-dlp may create .mp3 or .webm etc - find file
          let finalFile = output
          if(!fs.existsSync(finalFile)){
            const dir = path.dirname(outputBase)
            const files = fs.readdirSync(dir).filter(f => f.startsWith(path.basename(outputBase)))
            if(files.length) finalFile = path.join(dir, files[0])
          }
          if(!fs.existsSync(finalFile)){ throw new Error('Download failed - song not found or too big') }
          const stat = fs.statSync(finalFile)
          if(stat.size > 16*1024*1024){ try{ fs.unlinkSync(finalFile) }catch{}; await treply('Play', [line('error', 'Song too big >16MB for WhatsApp'), line('tip', 'Try shorter song or .preview')]); return }
          const buf = fs.readFileSync(finalFile)
          // Send as audio + voice option? Send as audio file, not ptt so user fit save
          await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mpeg', ptt: false, fileName: `${cleanName(text)}.mp3` }, { quoted: m })
          await treply('Play Done', [line('song', text), line('size', `${(stat.size/1024/1024).toFixed(1)} MB`)])
          try{ await reactCmd(sock, jid, m.key, command) }catch{}
          try{ await reactDone(sock, jid, m.key) }catch{}
          try{ fs.unlinkSync(finalFile) }catch{}
          // cleanup other tmp files with same base
          try{ fs.readdirSync(path.dirname(outputBase)).filter(f => f.startsWith(path.basename(outputBase))).forEach(f => { try{ fs.unlinkSync(path.join(path.dirname(outputBase), f)) }catch{} }) }catch{}
          return
        }catch(e){
          // Cleanup
          try{ fs.readdirSync(path.dirname(outputBase)).filter(f => f.startsWith(path.basename(outputBase))).forEach(f => { try{ fs.unlinkSync(path.join(path.dirname(outputBase), f)) }catch{} }) }catch{}
          const msg = e.message || ''
          if(msg.includes('Video unavailable') || msg.includes('Private video') || msg.includes('not found')){
            await treply('Play Error', [line('error', `No song for "${text}"`), line('tip', 'Try full name + artist, e.g. .play Asake Lonely At The Top')])
          } else if(msg.includes('16M') || msg.includes('filesize')){
            await treply('Play Error', [line('error', 'Song too big >16MB'), line('tip', 'Try shorter song')])
          } else if(msg.includes('Sign in') || msg.includes('bot')){
            await treply('Play Error', [line('error', 'YouTube blocked yt-dlp for this IP'), line('tip', 'Wait 10 mins or try .preview ' + text), line('note', 'YouTube dey block bot IP sometimes')])
          } else {
            await treply('Play Error', [line('error', msg.slice(0,200)), line('tip', 'Try .preview ' + text)])
          }
          return
        }
      }

      // --=[ SPOTIFY / SOUNDCLOUD - honest, no fake download ]=--
      if(['spotify','soundcloud'].includes(command)){
        await treply(command, [
          line('info', `${command} needs paid API / login for full download`),
          line('tip', `Try .play ${text || 'song name'} - yt-dlp search`),
          line('preview', `Try .preview ${text || 'song name'} - 30s free`)
        ])
        return
      }

    } catch(e){
      await sock.sendMessage(jid, { text: box('Play Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
  }
