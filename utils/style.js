// utils/style.js - SIMON MD UI STYLE - FIXED
// Tiny font + ASCII inline UI + Reactions
// Await = ⏳ , Cmd emoji, Complete = 💀

const tinyMap = {
  a:'ᵃ', b:'ᵇ', c:'ᶜ', d:'ᵈ', e:'ᵉ', f:'ᶠ', g:'ᵍ', h:'ʰ', i:'ⁱ', j:'ʲ', k:'ᵏ', l:'ˡ', m:'ᵐ',
  n:'ⁿ', o:'ᵒ', p:'ᵖ', q:'ᑫ', r:'ʳ', s:'ˢ', t:'ᵗ', u:'ᵘ', v:'ᵛ', w:'ʷ', x:'ˣ', y:'ʸ', z:'ᶻ',
  A:'ᴬ', B:'ᴮ', C:'ᶜ', D:'ᴰ', E:'ᴱ', F:'ᶠ', G:'ᴳ', H:'ᴴ', I:'ᴵ', J:'ᴶ', K:'ᴷ', L:'ᴸ', M:'ᴹ',
  N:'ᴺ', O:'ᴼ', P:'ᴾ', Q:'ᑫ', R:'ᴿ', S:'ˢ', T:'ᵀ', U:'ᵁ', V:'ⱽ', W:'ᵂ', X:'ˣ', Y:'ʸ', Z:'ᶻ',
  '0':'⁰', '1':'¹', '2':'²', '3':'³', '4':'⁴', '5':'⁵', '6':'⁶', '7':'⁷', '8':'⁸', '9':'⁹',
  ' ':' ', ':':':', '/':'/', '.':'.', '-':'-', '_':'_', '@':'@', '#':'#', '(':'(', ')':')',
  '[':'[', ']':']', '{':'{', '}':'}', ',':',', ';':';', '?':'?', '!':'!', '=':'=', '+':'+',
  '*':'*', "'":"'", '"':'"', '|':'|', '\\':'\\', '<':'<', '>':'>', '%':'%', '&':'&'
}

function tiny(text){
  if(text === null || text === undefined) return ''
  return String(text).split('').map(c => tinyMap[c] !== undefined ? tinyMap[c] : c).join('')
}

// ASCII inline UI box - pure ASCII, no unicode box chars
function box(title, lines){
  const arr = Array.isArray(lines) ? lines : [String(lines)]
  const head = '+----------------------------------------+'
  let out = head + '\n'
  out += '| [+] ' + tiny(title) + '\n'
  out += '| --------------------------------------\n'
  for(let l of arr){
    out += '| ' + String(l) + '\n'
  }
  out += '| --------------------------------------\n'
  out += '| [>] ' + tiny('SIMON MD') + '\n'
  out += head
  return out
}

function line(label, value){
  // label/value already tiny inside, keep > as ASCII
  return '> ' + tiny(label) + ' : ' + tiny(value)
}

// Each cmd has its own emoji reaction - FULL MAP, no default 💀 clash
const cmdReactions = {
  anti: '🛡️',
  antilink: '🔗',
  antistatus: '👁️',
  antigcstatus: '📱',
  antiedit: '✏️',
  antidelete: '🗑️',
  antitag: '🏷️',
  antisticker: '🩹',
  antinudes: '🔞',
  antiporn: '🔞',
  antibadword: '🤬',
  kick: '👢',
  ban: '⛔',
  promote: '⬆️',
  demote: '⬇️',
  tagall: '📢',
  group: '👥',
  ping: '⚡',
  menu: '📜',
  vv: '👁️',
  viewonce: '👁️',
  vv2: '👁️',
  vv3: '👁️',
  vvimage: '👁️',
  vvvideo: '👁️',
  vvaudio: '👁️',
  vvall: '👁️',
  autovv: '👁️',
  antiviewonce: '👁️',
  autoread: '👁️',
  autoreadgc: '👁️',
  autoreadpc: '👁️',
  autotyping: '⌨️',
  autorecording: '🎙️',
  autobio: '📝',
  autostatus: '👁️',
  autostatusview: '👁️',
  autostatuslike: '❤️',
  autostatusreact: '❤️',
  autoreact: '🩺',
  autolike: '❤️',
  autoreadstatus: '👁️',
  autodlstatus: '⬇️',
  setauto: '⚙️',
  auto: '⚙️',
  warn: '⚠️',
  unwarn: '⚠️',
  warnings: '⚠️',
  default: '⚡'
}

function normalizeKey(key){
  // react needs { remoteJid, id, fromMe, participant? }
  // m.key already correct, but guard if caller pass m instead
  if(!key) return null
  if(key.key) return key.key
  return key
}

async function reactAwait(sock, jid, key){
  try{
    const k = normalizeKey(key)
    if(!k) return
    await sock.sendMessage(jid, { react: { text: '⏳', key: k } })
  }catch{}
}

async function reactCmd(sock, jid, key, cmd){
  try{
    const k = normalizeKey(key)
    if(!k) return
    const emoji = cmdReactions[String(cmd || '').toLowerCase()] || cmdReactions.default
    await sock.sendMessage(jid, { react: { text: emoji, key: k } })
  }catch{}
}

async function reactDone(sock, jid, key){
  try{
    const k = normalizeKey(key)
    if(!k) return
    await sock.sendMessage(jid, { react: { text: '💀', key: k } })
  }catch{}
}

// Bot always use this to reply - tiny font + UI
async function replyTiny(sock, jid, title, lines, m){
  const text = box(title, lines)
  return sock.sendMessage(jid, { text }, { quoted: m })
}

async function replyTinyPlain(sock, jid, text, m){
  return sock.sendMessage(jid, { text: tiny(text) }, { quoted: m })
}

module.exports = { tiny, box, line, cmdReactions, reactAwait, reactCmd, reactDone, replyTiny, replyTinyPlain }
