// 🛠️ SIMON MD - TOOLS - FREE, NO API, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style
const crypto = require('crypto')

function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }

// Simple QR as text - no external lib, use ASCII block for short text? We do link to qr via text instead
// Real QR image needs qrcode lib - if not installed, we fallback to text + instructions

function genPassword(len = 16){
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const nums = '0123456789'
  const syms = '!@#$%^&*_-+='
  const all = upper + lower + nums + syms
  let p = upper[randInt(0,25)] + lower[randInt(0,25)] + nums[randInt(0,9)] + syms[randInt(0,syms.length-1)]
  for(let i=4;i<len;i++) p += all[randInt(0, all.length-1)]
  // shuffle
  return p.split('').sort(()=>Math.random()-0.5).join('')
}
function calcSafe(expr){
  const clean = expr.replace(/[^0-9\+\-\*\/\(\)\.\% ]/g,'').trim()
  if(!clean) return null
  try{
    const val = Function('"use strict"; return (' + clean + ')')()
    if(typeof val === 'number' && isFinite(val)) return `${clean} = ${val}`
  }catch{}
  return null
}
function toBinary(str){ return str.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ') }
function fromBinary(str){
  try{ return str.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b,2))).join('') }catch{ return null }
}
function toHex(str){ return Buffer.from(str).toString('hex') }
function fromHex(str){ try{ return Buffer.from(str, 'hex').toString('utf8') }catch{ return null } }
function toMorse(str){
  const map = {a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',' ':'/'}
  return str.toLowerCase().split('').map(c => map[c] || c).join(' ')
}
function fromMorse(str){
  const rev = {'.-':'a','-...':'b','-.-.':'c','-..':'d','.':'e','..-.':'f','--.':'g','....':'h','..':'i','.---':'j','-.-':'k','.-..':'l','--':'m','-.':'n','---':'o','.--.':'p','--.-':'q','.-.':'r','...':'s','-':'t','..-':'u','...-':'v','.--':'w','-..-':'x','-.--':'y','--..':'z','-----':'0','.----':'1','..---':'2','...--':'3','....-':'4','.....':'5','-....':'6','--...':'7','---..':'8','----.':'9','/':' '}
  return str.split(' ').map(c => rev[c] || c).join('')
}

module.exports = {
  command: ['tools','tool','calc','calculator','password','passgen','genpass','base64','encode','decode','binary','hex','morse','reverse','upper','lower','count','wordcount','charcount','random','rand','dice','coin','age','bmi','temp','convert','currency','qr','qrcode','shorten','tinyurl','uuid','hash','md5','sha256','color','colour','emojimix','tts','translate','time','date','day','week','timer','stopwatch'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(['tools','tool'].includes(command)){
        await treply('Tools - Free Offline', [
          line('calc', '.calc 12 + 34 * 2'),
          line('password', '.password 16'),
          line('base64', '.encode hello / .decode aGVsbG8='),
          line('binary', '.binary hello'),
          line('hex', '.hex hello'),
          line('morse', '.morse hello'),
          line('reverse', '.reverse hello'),
          line('upper/lower', '.upper hello'),
          line('count', '.count hello world'),
          line('random', '.random 1 100'),
          line('uuid/hash', '.uuid / .hash hello'),
          line('bmi', '.bmi 70 1.75'),
          line('age', '.age 2005-05-20'),
          line('temp', '.temp 30c / .temp 86f'),
          line('time/date', '.time / .date'),
          line('color', '.color'),
          line('qr', '.qr hello - text QR link')
        ])
        return
      }
      if(['calc','calculator'].includes(command)){
        if(!text){ await treply('Calculator', [line('usage', '.calc 12 + 34')]); return }
        const res = calcSafe(text)
        if(!res){ await treply('Calculator', [line('error', 'Invalid math')]); return }
        await treply('Calculator', [res]); return
      }
      if(['password','passgen','genpass'].includes(command)){
        const len = Math.min(Math.max(parseInt(text) || 16, 6), 64)
        const p1 = genPassword(len)
        const p2 = genPassword(len)
        await treply('Password Generator', [line('pass1', p1), line('pass2', p2), line('length', `${len}`)]); return
      }
      if(command === 'encode'){
        if(!text){ await treply('Base64 Encode', [line('usage', '.encode hello')]); return }
        await treply('Base64 Encode', [line('input', text), line('output', Buffer.from(text).toString('base64'))]); return
      }
      if(command === 'decode'){
        if(!text){ await treply('Base64 Decode', [line('usage', '.decode aGVsbG8=')]); return }
        try{ await treply('Base64 Decode', [line('input', text), line('output', Buffer.from(text, 'base64').toString('utf8'))]) }catch{ await treply('Base64 Decode', [line('error', 'Invalid base64')]) }
        return
      }
      if(command === 'binary'){
        if(!text){ await treply('Binary', [line('usage', '.binary hello')]); return }
        // If input na binary, decode am, else encode
        if(/^[01\s]+$/.test(text) && text.includes('0')){ await treply('Binary Decode', [line('output', fromBinary(text) || 'Invalid')]); return }
        await treply('Binary Encode', [line('output', toBinary(text))]); return
      }
      if(command === 'hex'){
        if(!text){ await treply('Hex', [line('usage', '.hex hello')]); return }
        if(/^[0-9a-fA-F\s]+$/.test(text) && text.length > 3){ const d = fromHex(text.replace(/\s/g,'')); if(d && /^[\x20-\x7E]+$/.test(d)){ await treply('Hex Decode', [line('output', d)]); return } }
        await treply('Hex Encode', [line('output', toHex(text))]); return
      }
      if(command === 'morse'){
        if(!text){ await treply('Morse', [line('usage', '.morse hello')]); return }
        if(/^[.\- \/]+$/.test(text)){ await treply('Morse Decode', [line('output', fromMorse(text))]); return }
        await treply('Morse Encode', [line('output', toMorse(text))]); return
      }
      if(command === 'reverse'){
        if(!text){ await treply('Reverse', [line('usage', '.reverse hello')]); return }
        await treply('Reverse', [line('output', text.split('').reverse().join(''))]); return
      }
      if(command === 'upper'){ if(!text){ await treply('Upper', [line('usage', '.upper hello')]); return } await treply('Upper', [text.toUpperCase()]); return }
      if(command === 'lower'){ if(!text){ await treply('Lower', [line('usage', '.lower HELLO')]); return } await treply('Lower', [text.toLowerCase()]); return }
      if(['count','wordcount','charcount'].includes(command)){
        if(!text){ await treply('Count', [line('usage', '.count hello world')]); return }
        const words = text.trim().split(/\s+/).length
        await treply('Count', [line('chars', `${text.length}`), line('words', `${words}`), line('no-space', `${text.replace(/\s/g,'').length}`)]); return
      }
      if(['random','rand'].includes(command)){
        const parts = text.split(/\s+/).filter(Boolean)
        const min = parseInt(parts[0]) || 1
        const max = parseInt(parts[1]) || 100
        await treply('Random', [line('range', `${min} - ${max}`), line('result', `${randInt(Math.min(min,max), Math.max(min,max))}`)]); return
      }
      if(command === 'uuid'){ await treply('UUID', [crypto.randomUUID()]); return }
      if(command === 'hash'){
        if(!text){ await treply('Hash', [line('usage', '.hash hello')]); return }
        await treply('Hash', [line('md5', crypto.createHash('md5').update(text).digest('hex')), line('sha256', crypto.createHash('sha256').update(text).digest('hex'))]); return
      }
      if(['md5','sha256'].includes(command)){
        if(!text){ await treply('Hash', [line('usage', `.${command} hello`)]); return }
        await treply(command.toUpperCase(), [crypto.createHash(command).update(text).digest('hex')]); return
      }
      if(command === 'bmi'){
        const parts = text.split(/[\s,]+/).filter(Boolean)
        const weight = parseFloat(parts[0]); const height = parseFloat(parts[1])
        if(!weight || !height){ await treply('BMI', [line('usage', '.bmi 70 1.75  (kg, m)')]); return }
        const bmi = (weight / (height*height)).toFixed(1)
        const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
        await treply('BMI', [line('bmi', bmi), line('category', cat)]); return
      }
      if(command === 'age'){
        if(!text){ await treply('Age', [line('usage', '.age 2005-05-20')]); return }
        const dob = new Date(text); if(isNaN(dob)){ await treply('Age', [line('error', 'Use YYYY-MM-DD')]); return }
        const now = new Date()
        let age = now.getFullYear() - dob.getFullYear()
        const mDiff = now.getMonth() - dob.getMonth()
        if(mDiff < 0 || (mDiff === 0 && now.getDate() < dob.getDate())) age--
        await treply('Age', [line('dob', text), line('age', `${age} years`)]); return
      }
      if(command === 'temp'){
        if(!text){ await treply('Temp', [line('usage', '.temp 30c / .temp 86f')]); return }
        const match = text.match(/(-?\d+\.?\d*)\s*([cCfF])/)
        if(!match){ await treply('Temp', [line('error', 'Use .temp 30c or .temp 86f')]); return }
        const val = parseFloat(match[1]); const unit = match[2].toLowerCase()
        if(unit === 'c'){ await treply('Temp Convert', [line('celsius', `${val} C`), line('fahrenheit', `${(val*9/5+32).toFixed(1)} F`)]); return }
        await treply('Temp Convert', [line('fahrenheit', `${val} F`), line('celsius', `${((val-32)*5/9).toFixed(1)} C`)]); return
      }
      if(command === 'time'){
        const t = new Date().toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        await treply('Time', [line('lagos', t), line('utc', new Date().toISOString())]); return
      }
      if(command === 'date' || command === 'day'){
        const d = new Date().toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        await treply('Date', [d]); return
      }
      if(command === 'week'){
        const d = new Date(); const start = new Date(d); start.setDate(d.getDate() - d.getDay())
        await treply('Week', [line('today', d.toDateString()), line('week-start', start.toDateString())]); return
      }
      if(['color','colour'].includes(command)){
        const hex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
        await treply('Random Color', [line('hex', hex), line('rgb', `${r}, ${g}, ${b}`)]); return
      }
      if(['qr','qrcode'].includes(command)){
        if(!text){ await treply('QR', [line('usage', '.qr hello / .qr https://example.com')]); return }
        // No qrcode lib - give free QR API link as text, but also try local lib if installed
        try{
          const QR = require('qrcode')
          const buf = await QR.toBuffer(text, { width: 512 })
          await sock.sendMessage(jid, { image: buf, caption: tiny(`QR for: ${text}`) }, { quoted: m })
          try{ await reactCmd(sock, jid, m.key, command) }catch{}
          try{ await reactDone(sock, jid, m.key) }catch{}
          return
        }catch{
          // Fallback - no lib, give link user fit open
          const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}`
          await treply('QR', [line('text', text), line('link', qrLink), line('note', 'Open link to see QR, or install qrcode: npm i qrcode')])
          return
        }
      }
      if(['shorten','tinyurl'].includes(command)){
        await treply('Shorten', [line('info', 'Shorten needs internet API, offline no fit'), line('tip', 'Use bit.ly or tinyurl.com for free')]); return
      }
      if(command === 'translate'){
        await treply('Translate', [line('info', 'Translate needs internet API, offline no fit'), line('tip', 'Use .ai for Pidgin / English help offline')]); return
      }
      if(command === 'tts'){
        await treply('TTS', [line('info', 'TTS needs internet API'), line('tip', 'Use phone voice note for now')]); return
      }
      if(command === 'emojimix'){
        await treply('Emoji Mix', [line('info', 'Emoji mix needs internet API'), line('tip', 'Try .fun for emoji')]); return
      }
      if(['timer','stopwatch'].includes(command)){
        await treply('Timer', [line('info', 'Timer started - I no fit ping you later without task system'), line('tip', 'Use phone timer')]); return
      }
    } catch(e){
      await sock.sendMessage(jid, { text: box('Tools Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
      }
