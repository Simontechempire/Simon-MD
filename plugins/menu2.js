// ⚡ SIMON MD - Menu 2 | DIFFERENT FUNCTION | Category Menu + Search
// Menu 1 = Protection / Anti / Group
// Menu 2 = Tools / AI / Fun / Downloader / Settings / Economy
const fs = require('fs')
const path = require('path')

const MENU2_PFP = 'https://files.catbox.moe/4nbm9j.jpg'

function getSettings() {
  try {
    if (global.simonDB?.botSettings) return global.simonDB.botSettings
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../database/botsettings.json')))
  } catch {
    return { botName: 'SIMON MD', prefix: '.', footer: '© SIMON MD', buttonMenu: 'normal', mode: 'public', timezone: 'Africa/Lagos' }
  }
}

const tinyMap = { a:'ᵃ', b:'ᵇ', c:'ᶜ', d:'ᵈ', e:'ᵉ', f:'ᶠ', g:'ᵍ', h:'ʰ', i:'ᶦ', j:'ʲ', k:'ᵏ', l:'ˡ', m:'ᵐ', n:'ⁿ', o:'ᵒ', p:'ᵖ', q:'ᑫ', r:'ʳ', s:'ˢ', t:'ᵗ', u:'ᵘ', v:'ᵛ', w:'ʷ', x:'ˣ', y:'ʸ', z:'ᶻ', A:'ᴬ', B:'ᴮ', C:'ᶜ', D:'ᴰ', E:'ᴱ', F:'ᶠ', G:'ᴳ', H:'ᴴ', I:'ᴵ', J:'ᴶ', K:'ᴷ', L:'ᴸ', M:'ᴹ', N:'ᴺ', O:'ᴼ', P:'ᴾ', Q:'ᑫ', R:'ᴿ', S:'ˢ', T:'ᵀ', U:'ᵁ', V:'ⱽ', W:'ᵂ', X:'ˣ', Y:'ʸ', Z:'ᶻ', 0:'⁰', 1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸', 9:'⁹' }
function toTiny(s = '') { return String(s).split('').map(c => tinyMap[c] || c).join('') }

module.exports = {
  name: 'menu2',
  alias: ['menu2', 'help2', 'tools', 'funmenu'],
  command: ['menu2', 'help2', 'tools', 'funmenu'],
  category: 'general',
  desc: 'Menu 2 - Tools / AI / Fun - Different from Menu 1',
  attachEngine: (sock) => { if (sock) console.log('[MENU2] Engine loaded ✅') },
  __call: (sock) => { if (sock) console.log('[MENU2] Engine loaded ✅') },

  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    const cmd = (command || '').toLowerCase()
    if (!['menu2', 'help2', 'tools', 'funmenu'].includes(cmd)) return

    const cfg = getSettings()
    const p = cfg.prefix || '.'
    const botName = (cfg.botName || 'SIMON MD').toUpperCase()
    const footer = cfg.footer || '© SIMON MD'
    const buttonMenu = (cfg.buttonMenu || 'normal').toLowerCase()
    const mode = (cfg.mode || 'public').toUpperCase()
    const category = (text || args?.join(' ') || '').trim().toLowerCase()

    // ===== CATEGORY MENUS - NEW FUNCTION =====
    const categories = {
      ai: `*🤖 AI MENU*\n\n${p}ai <ask anything>\n${p}chatgpt <question>\n${p}gpt <question>\n${p}imagine <prompt> - AI image\n${p}ask <question>\n${p}autochat on/off\n${p}autoai on/off`,
      tools: `*🛠️ TOOLS MENU*\n\n${p}sticker - Photo to sticker\n${p}toimg - Sticker to photo\n${p}qr <text> - Make QR\n${p}shortlink <url>\n${p}translate <text>\n${p}calc 2+2\n${p}weather Lagos\n${p}remind <time> <msg>`,
      downloader: `*⬇️ DOWNLOADER MENU*\n\n${p}play <song> - Music\n${p}video <name> - Video\n${p}ytmp3 <link>\n${p}ytmp4 <link>\n${p}tiktok <link>\n${p}ig <link>\n${p}fb <link>`,
      fun: `*🎮 FUN MENU*\n\n${p}joke\n${p}quote\n${p}truth\n${p}dare\n${p}ship @user @user\n${p}8ball <question>\n${p}dice\n${p}slot\n${p}meme`,
      economy: `*💰 ECONOMY MENU*\n\n${p}balance\n${p}daily - Claim daily\n${p}work\n${p}transfer @user 100\n${p}leaderboard\n${p}shop`,
      settings: `*⚙️ SETTINGS MENU*\n\n${p}botsettings\n${p}setprefix <new>\n${p}setmode private/public\n${p}setbuttonmenu button/normal\n${p}addsudo <num>\n${p}desudo <num>\n${p}setbotname <name>\n${p}setwelcome / setgoodbye\n${p}setmenu image/text/video\n${p}health`,
      owner: `*👑 OWNER MENU*\n\n${p}eval <code>\n${p}exec <cmd>\n${p}restart\n${p}shutdown\n${p}broadcast <msg>\n${p}block / unblock\n${p}backup / restore\n${p}setppbot`
    }

    // If user type .menu2 fun / ai / tools etc - show only that category
    if (category && categories[category]) {
      const cap = `╭─── *${botName} - MENU 2* ───╮\n│ Category: ${category.toUpperCase()}\n│ Prefix: ${p} | Mode: ${mode}\n╰─────────────────╯\n\n${categories[category]}\n\n${footer}\nBack: ${p}menu2`
      try { await sock.sendMessage(jid, { image: { url: MENU2_PFP }, caption: cap }, { quoted: m }) }
      catch { await sock.sendMessage(jid, { text: cap }, { quoted: m }) }
      return
    }

    // ===== MAIN MENU 2 - DIFFERENT LAYOUT: BOX, NOT CENTERED =====
    const main =
      `╭─── *⚡ ${botName} - MENU 2* ───╮\n` +
      `│ 🧩 Type: Tools / AI / Fun\n` +
      `│ 🔣 Prefix: ${p}\n` +
      `│ 🔒 Mode: ${mode}\n` +
      `│ 📋 Menu 1 = Protection\n` +
      `│ 📋 Menu 2 = Tools & Fun\n` +
      `╰─────────────────╯\n\n` +
      `*Pick one category:*\n` +
      `Type ${p}menu2 <name>\n\n` +
      `🤖 *AI* - ${p}menu2 ai\n` +
      `   AI chat, imagine, ask\n\n` +
      `🛠️ *TOOLS* - ${p}menu2 tools\n` +
      `   Sticker, QR, translate, calc\n\n` +
      `⬇️ *DOWNLOADER* - ${p}menu2 downloader\n` +
      `   Music, video, tiktok, IG\n\n` +
      `🎮 *FUN* - ${p}menu2 fun\n` +
      `   Joke, truth, dare, ship, game\n\n` +
      `💰 *ECONOMY* - ${p}menu2 economy\n` +
      `   Balance, daily, work, shop\n\n` +
      `⚙️ *SETTINGS* - ${p}menu2 settings\n` +
      `   Prefix, mode, sudo, bot name\n\n` +
      `👑 *OWNER* - ${p}menu2 owner\n` +
      `   Eval, restart, broadcast\n\n` +
      `*Example:*\n` +
      `${p}menu2 fun\n` +
      `${p}menu2 ai\n` +
      `${p}menu2 downloader\n\n` +
      `${footer}`

    try {
      if (buttonMenu === 'button') {
        const buttons = [
          { buttonId: `${p}menu2 ai`, buttonText: { displayText: '🤖 AI' }, type: 1 },
          { buttonId: `${p}menu2 fun`, buttonText: { displayText: '🎮 Fun' }, type: 1 },
          { buttonId: `${p}menu2 downloader`, buttonText: { displayText: '⬇️ Downloader' }, type: 1 }
        ]
        await sock.sendMessage(jid, { image: { url: MENU2_PFP }, caption: main, footer: footer, buttons: buttons, headerType: 4 }, { quoted: m })
        return
      }
      await sock.sendMessage(jid, { image: { url: MENU2_PFP }, caption: main }, { quoted: m })
    } catch {
      await sock.sendMessage(jid, { text: main }, { quoted: m })
    }
  }
  }
