// utils/style.js - SIMON MD UI STYLE
// Tiny keyboard font + ASCII inline UI + Reactions
// Await = ⏳ , Complete = 💀

const tinyMap = {
  a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ꜰ', g:'ɢ', h:'ʜ', i:'ɪ', j:'ᴊ', k:'ᴋ', l:'ʟ', m:'ᴍ',
  n:'ɴ', o:'ᴏ', p:'ᴘ', q:'ǫ', r:'ʀ', s:'ꜱ', t:'ᴛ', u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ',
  A:'ᴀ', B:'ʙ', C:'ᴄ', D:'ᴅ', E:'ᴇ', F:'ꜰ', G:'ɢ', H:'ʜ', I:'ɪ', J:'ᴊ', K:'ᴋ', L:'ʟ', M:'ᴍ',
  N:'ɴ', O:'ᴏ', P:'ᴘ', Q:'ǫ', R:'ʀ', S:'ꜱ', T:'ᴛ', U:'ᴜ', V:'ᴠ', W:'ᴡ', X:'x', Y:'ʏ', Z:'ᴢ',
  0:'0', 1:'1', 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 8:'8', 9:'9'
}

function tiny(text){
  return String(text).split('').map(c => tinyMap[c] || c).join('')
}

// ASCII inline UI box
function box(title, lines){
  // lines = array of strings, already tiny or normal
  let out = `┌─ ${tiny(title)} ─\n`
  for(let l of lines){
    out += `│ ${l}\n`
  }
  out += `└────────────`
  return out
}

function line(label, value){
  return `› ${tiny(label)} : ${tiny(value)}`
}

// Each cmd has its own emoji reaction
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
  default: '💀'
}

async function reactAwait(sock, jid, key){
  try{
    await sock.sendMessage(jid, { react: { text: '⏳', key } })
  }catch{}
}

async function reactCmd(sock, jid, key, cmd){
  try{
    const emoji = cmdReactions[cmd?.toLowerCase()] || cmdReactions.default
    await sock.sendMessage(jid, { react: { text: emoji, key } })
  }catch{}
}

async function reactDone(sock, jid, key){
  try{
    await sock.sendMessage(jid, { react: { text: '💀', key } })
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
