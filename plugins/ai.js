// 🤖 SIMON MD - FREE AI - NO API, NO KEY, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

// Per-chat memory - last 10
if(!global.aiMemory) global.aiMemory = new Map()
function getHistory(jid){
  if(!global.aiMemory.has(jid)) global.aiMemory.set(jid, [])
  return global.aiMemory.get(jid)
}
function pushHistory(jid, role, content){
  const h = getHistory(jid)
  h.push({ role, content: String(content).slice(0, 500) })
  if(h.length > 10) h.splice(0, h.length - 10)
}

function norm(s){ return String(s||'').toLowerCase().trim() }

function calcMath(prompt){
  // Safe math: only numbers + - * / ( ) . %
  const m = prompt.match(/(\d[\d\s\.\+\-\*\/\(\)\%]*\d|\d+)/)
  if(!m) return null
  // Only treat as math if prompt get math words or operators
  if(!/[\+\-\*\/\%\(\)]/.test(prompt) && !/(plus|minus|times|divide|calculate|solve|what is)/.test(prompt)) return null
  const expr = m[0].replace(/[^0-9\+\-\*\/\(\)\.\% ]/g,'').trim()
  if(!expr || expr.length < 2) return null
  try{
    // Block dangerous
    if(/[^0-9\+\-\*\/\(\)\.\% ]/.test(expr)) return null
    const val = Function('"use strict"; return (' + expr + ')')()
    if(typeof val === 'number' && isFinite(val)) return `${expr} = ${val}`
  }catch{}
  return null
}

function localAnswer(prompt, jid, m){
  const q = norm(prompt)
  const history = getHistory(jid)
  const lastUser = [...history].reverse().find(h => h.role === 'user')?.content || ''

  // 1) MATH
  const math = calcMath(prompt)
  if(math) return math

  // 2) TIME / DATE
  if(q.includes('time') || q.includes('what time')){
    const t = new Date().toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    return `Time now for Nigeria (Lagos) na ${t}.`
  }
  if(q.includes('date') || q.includes('today') || q.includes('day is')){
    const d = new Date().toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    return `Today na ${d}.`
  }

  // 3) WHO ARE YOU / BOT
  if(q.includes('who are you') || q === 'who are u' || q.includes('your name') || q.includes('what is your name')){
    return `I be SIMON MD — WhatsApp bot wey dey run for this number. I fit do sticker, VV, logo, group control, protection, and chat like this. No API, I dey run offline.`
  }
  if(q.includes('who is simon') || q.includes('who created') || q.includes('who made you') || q.includes('owner')){
    return `SIMON MD na bot built by Simon. Owner number dey for config. I dey serve owner and groups.`
  }
  if(q.includes('how are you') || q.includes('how far') || q.includes('wetin dey') || q === 'hi' || q === 'hello' || q === 'hey'){
    return `I dey alright, sharp sharp. Wetin you want make I do? Try .menu, .sticker, .ai <question>, .logo1 SIMON.`
  }
  if(q.includes('thank')){
    return `You welcome. Na my work. Anything else?`
  }
  if(q.includes('bye') || q.includes('goodbye')){
    return `Bye bye, talk later. If you need me, just type .ai <question>.`
  }

  // 4) MEMORY - what did I ask
  if(q.includes('what did i') && (q.includes('ask') || q.includes('say') || q.includes('just'))){
    if(lastUser && lastUser !== prompt) return `You just ask: "${lastUser}". You want make I answer am again?`
    return `You never ask me anything for this chat yet. Ask me something.`
  }

  // 5) JOKES
  if(q.includes('joke') || q.includes('funny') || q.includes('make me laugh')){
    const jokes = [
      `Why WhatsApp bot no dey sleep? Because e dey wait for .ai message from you.`,
      `My phone battery low, but my vibes full.`,
      `Why programmer no dey like sun? Because e dey cause too much light — e prefer dark mode.`,
      `If SIMON MD be human, e for don collect chieftaincy title for group control.`,
      `What do you call a bot wey no get API? Free AI — like me.`
    ]
    return jokes[Math.floor(Math.random() * jokes.length)]
  }

  // 6) ADVICE / MOTIVATION
  if(q.includes('sad') || q.includes('depress') || q.includes('tired') || q.includes('lonely')){
    return `E go better. Take small rest, drink water, talk to person wey you trust. If e heavy, no carry am alone. You fit still chat me, I dey here.`
  }
  if(q.includes('motivat') || q.includes('inspire')){
    return `Small small step still be progress. Do one thing today wey your future self go thank you for. No compare yourself to others, compare to yesterday you.`
  }

  // 7) HELP / COMMANDS
  if(q.includes('what can you do') || q.includes('help') || q.includes('menu') || q.includes('command')){
    return `I fit:\n- .menu - see all commands\n- .s - make sticker (reply image)\n- .vv - open view-once (reply VV)\n- .logo1 SIMON - make logo\n- .antilink on - protect group\n- .ai <question> - chat like this (offline, no API)\n- .ping - check speed\nTell me wetin you want.`
  }

  // 8) WHATSAPP / BOT HOW TO
  if(q.includes('how to') && q.includes('sticker')){
    return `To make sticker: send image or reply image with .s. To convert sticker to image: reply sticker with .toimg.`
  }
  if(q.includes('how to') && (q.includes('vv') || q.includes('view once'))){
    return `Reply a view-once message with .vv, or turn on .autovv on make e auto open.`
  }
  if(q.includes('how to') && q.includes('group')){
    return `For group: admin fit use .kick @user, .promote @user, .tagall, .antilink on, .mute / .unmute. Bot must be admin.`
  }

  // 9) LOVE / RELATIONSHIP - safe, general
  if(q.includes('love') || q.includes('crush') || q.includes('girlfriend') || q.includes('boyfriend')){
    return `Love na respect + communication + consistency. No rush am. If person no dey show you care, believe their action, no only their words.`
  }

  // 10) SCHOOL / STUDY
  if(q.includes('study') || q.includes('exam') || q.includes('school')){
    return `Study tip: 25 mins focus, 5 mins break. Write wetin you learn for your own words. Sleep well before exam, cramming last minute no dey help.`
  }

  // 11) MONEY / BUSINESS
  if(q.includes('money') || q.includes('business') || q.includes('make money')){
    return `Start small: solve one problem for people around you. Learn one skill well — sticker design, logo, content, or trading — then sell am consistently. No quick money, na consistency dey pay.`
  }

  // 12) DEFAULT SMART REPLY - echo + guide, no fake knowledge
  // If question long, break am into keywords and answer generally
  if(q.startsWith('what is') || q.startsWith('what are') || q.startsWith('who is') || q.startsWith('explain')){
    return `Good question: "${prompt}". I be offline Free AI, so I no get internet to search am now. But I fit help you break am down — tell me wetin you want use am for? School, business, or just gist? And I fit give you steps to find am.`
  }
  if(q.startsWith('why')){
    return `For "${prompt}" — e get many reasons. Tell me more context, make I give you clear answer. Example: why for school, for group, or for WhatsApp?`
  }
  if(q.startsWith('how')){
    return `To do "${prompt}" — first step na to break am small small. Tell me wetin you don try already, make I give you next step wey go work.`
  }
  // General chat
  return `I hear you: "${prompt}". I be Free AI, offline, no API. I fit chat, do math, tell time/date, give jokes, advice, and help with bot commands. Try: .ai tell me a joke, or .ai what can you do?`
}

module.exports = {
  command: ['ai','chat','gpt','gpt4','chatgpt','ask','simon','askai','aichat','gemini','copilot','deepseek','aiask','freeai'],
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
      if(text && text.trim().toLowerCase() === 'clear'){
        global.aiMemory.set(jid, [])
        await treply('AI Memory', [line('status', 'Cleared')])
        return
      }
      let prompt = text
      if(!prompt){
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        prompt = quoted?.conversation || quoted?.extendedTextMessage?.text || quoted?.imageMessage?.caption || ''
      }
      if(!prompt){
        await treply('Free AI - No API', [
          line('usage', `.${command} <question>`),
          line('example', `.ai who are you?`),
          line('example2', `.ai 12 + 34`),
          line('example3', `.ai tell me a joke`),
          line('memory', 'Bot remember last 10 msgs'),
          line('clear', `.${command} clear`),
          line('info', 'Offline, no API, no key, no internet needed')
        ])
        return
      }
      if(prompt.length > 1000){
        await treply('Free AI', [line('error', 'Question too long, max 1000 chars')])
        return
      }

      pushHistory(jid, 'user', prompt)
      // NO API CALL - 100% local
      const answer = localAnswer(prompt, jid, m)
      pushHistory(jid, 'assistant', answer)

      await sock.sendMessage(jid, { text: box('SIMON AI - FREE', [answer]) }, { quoted: m })
      await done()
      return
    } catch(e){
      await sock.sendMessage(jid, { text: box('AI Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  },
  // For connection.js autochat - no API
  askAI: (prompt, jid) => localAnswer(prompt, jid, null),
  getHistory
    }
