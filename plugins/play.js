// 🎵 SIMON MD - Play (Free Music - No API Key)
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

function tmpFile(ext = 'mp3') {
  const dir = path.join(__dirname, '../tmp')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `play_\( {Date.now()}_ \){Math.floor(Math.random() * 9999)}.${ext}`)
}

function cleanName(name = '') {
  return name.replace(/[^\w\s\-_.]/g, '').trim().slice(0, 60) || 'song'
}

async function checkTool(cmd) {
  try {
    await execPromise(`${cmd} --version`)
    return true
  } catch {
    return false
  }
}

async function itunesPreview(query) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.results?.length) return null

    return data.results.map(r => ({
      title: `${r.trackName} - ${r.artistName}`,
      preview: r.previewUrl,
      album: r.collectionName || '',
      image: r.artworkUrl100
    }))
  } catch {
    return null
  }
}

module.exports = {
  command: [
    'play', 'music', 'song', 'audio',
    'ytmp3', 'ytaudio', 'playaudio',
    'preview', 'downloadsong'
  ],

  execute: async (sock, m, { command, text }) => {
    const jid = m.key.remoteJid

    try { await reactAwait(sock, jid, m.key) } catch {}

    const treply = async (title, lines) => {
      await sock.sendMessage(jid, {
        text: box(title, Array.isArray(lines) ? lines : [lines])
      }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
    }

    try {
      // ==================== HELP ====================
      if (!text && ['play', 'music', 'song', 'audio'].includes(command)) {
        return treply('Play - Free Music', [
          line('play', '.play Asake Lonely At The Top'),
          line('preview', '.preview Asake  (30s free preview)'),
          line('note', 'No API key needed'),
          line('require', 'yt-dlp + ffmpeg must be installed')
        ])
      }

      // ==================== PREVIEW (iTunes 30s) ====================
      if (command === 'preview') {
        if (!text) return treply('Preview', [line('usage', '.preview Song Name')])

        const results = await itunesPreview(text)
        if (!results || !results[0]?.preview) {
          return treply('Preview', [
            line('error', `No preview found for "${text}"`),
            line('tip', `Try .play ${text}`)
          ])
        }

        const r = results[0]
        try {
          const res = await fetch(r.preview)
          const buf = Buffer.from(await res.arrayBuffer())

          await sock.sendMessage(jid, {
            audio: buf,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${cleanName(r.title)}.mp3`
          }, { quoted: m })

          return treply('iTunes Preview (30s)', [
            line('song', r.title),
            line('album', r.album || '-'),
            line('note', 'Free 30 seconds preview')
          ])
        } catch (e) {
          return treply('Preview Error', [line('error', e.message)])
        }
      }

      // ==================== PLAY (yt-dlp) ====================
      if (['play', 'music', 'song', 'audio', 'ytmp3', 'ytaudio', 'playaudio', 'downloadsong'].includes(command)) {
        if (!text) return treply('Play', [line('usage', '.play Song Name')])

        const hasYtDlp = await checkTool('yt-dlp')
        const hasFfmpeg = await checkTool('ffmpeg')

        if (!hasYtDlp) {
          return treply('Missing Tool', [
            line('error', 'yt-dlp is not installed'),
            line('termux', 'pkg install python && pip install yt-dlp'),
            line('ubuntu', 'pip install yt-dlp'),
            line('ffmpeg', 'Also install ffmpeg'),
            line('tip', `Try .preview ${text}`)
          ])
        }

        if (!hasFfmpeg) {
          return treply('Missing Tool', [
            line('error', 'ffmpeg is not installed'),
            line('install', 'pkg install ffmpeg   or   sudo apt install ffmpeg')
          ])
        }

        await sock.sendMessage(jid, {
          text: tiny(`Searching & downloading:\n${text}\n\nPlease wait 15-60 seconds...`)
        }, { quoted: m }).catch(() => {})

        const outputBase = tmpFile('mp3').replace(/\.mp3$/, '')
        const safeQuery = text.replace(/["'`]/g, '').slice(0, 90)

        // Better yt-dlp command
        const cmd = `yt-dlp -x --audio-format mp3 --audio-quality 5 --no-playlist --max-filesize 15M --match-filter "duration < 480" --default-search "ytsearch1:" -o "\( {outputBase}.%(ext)s" " \){safeQuery}"`

        try {
          await execPromise(cmd, { timeout: 120000, maxBuffer: 1024 * 1024 * 80 })

          // Find the downloaded file
          const dir = path.dirname(outputBase)
          const baseName = path.basename(outputBase)
          const files = fs.readdirSync(dir).filter(f => f.startsWith(baseName))

          if (!files.length) throw new Error('Download failed - file not found')

          const finalFile = path.join(dir, files[0])
          const stat = fs.statSync(finalFile)

          if (stat.size > 15 * 1024 * 1024) {
            try { fs.unlinkSync(finalFile) } catch {}
            return treply('Play Error', [
              line('error', 'File too big for WhatsApp (>15MB)'),
              line('tip', 'Try a shorter song or .preview')
            ])
          }

          const buffer = fs.readFileSync(finalFile)

          await sock.sendMessage(jid, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${cleanName(text)}.mp3`
          }, { quoted: m })

          await treply('Play Done', [
            line('song', text),
            line('size', `${(stat.size / 1024 / 1024).toFixed(2)} MB`)
          ])

          // Cleanup
          try { fs.unlinkSync(finalFile) } catch {}
          files.forEach(f => {
            try { fs.unlinkSync(path.join(dir, f)) } catch {}
          })

        } catch (e) {
          // Cleanup on error
          try {
            const dir = path.dirname(outputBase)
            const baseName = path.basename(outputBase)
            fs.readdirSync(dir)
              .filter(f => f.startsWith(baseName))
              .forEach(f => {
                try { fs.unlinkSync(path.join(dir, f)) } catch {}
              })
          } catch {}

          const msg = e.message || ''

          if (msg.includes('Video unavailable') || msg.includes('Private video') || msg.includes('not found')) {
            return treply('Play Error', [
              line('error', `No result for "${text}"`),
              line('tip', 'Try adding artist name')
            ])
          }

          if (msg.includes('Sign in') || msg.includes('bot') || msg.includes('confirm')) {
            return treply('Play Error', [
              line('error', 'YouTube temporarily blocked this IP'),
              line('tip', 'Wait 5-10 minutes or use .preview')
            ])
          }

          return treply('Play Error', [
            line('error', msg.slice(0, 180)),
            line('tip', `Try .preview ${text}`)
          ])
        }
      }

    } catch (e) {
      await sock.sendMessage(jid, {
        text: box('Play Error', [line('error', e.message)])
      }, { quoted: m })
      try { await reactDone(sock, jid, m.key) } catch {}
    }
  }
    }
