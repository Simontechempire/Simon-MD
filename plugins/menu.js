// ⚡ SIMON MD - Menu | Centered | PFP + Menu Together - 1 Message
const MENU_PFP = 'https://files.catbox.moe/4nbm9j.jpg'

const tinyMap = { a:'ᵃ', b:'ᵇ', c:'ᶜ', d:'ᵈ', e:'ᵉ', f:'ᶠ', g:'ᵍ', h:'ʰ', i:'ᶦ', j:'ʲ', k:'ᵏ', l:'ˡ', m:'ᵐ', n:'ⁿ', o:'ᵒ', p:'ᵖ', q:'ᑫ', r:'ʳ', s:'ˢ', t:'ᵗ', u:'ᵘ', v:'ᵛ', w:'ʷ', x:'ˣ', y:'ʸ', z:'ᶻ', A:'ᴬ', B:'ᴮ', C:'ᶜ', D:'ᴰ', E:'ᴱ', F:'ᶠ', G:'ᴳ', H:'ᴴ', I:'ᴵ', J:'ᴶ', K:'ᴷ', L:'ᴸ', M:'ᴹ', N:'ᴺ', O:'ᴼ', P:'ᴾ', Q:'ᑫ', R:'ᴿ', S:'ˢ', T:'ᵀ', U:'ᵁ', V:'ⱽ', W:'ᵂ', X:'ˣ', Y:'ʸ', Z:'ᶻ', 0:'⁰', 1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸', 9:'⁹' }
function toTiny(s = '') { return String(s).split('').map(c => tinyMap[c] || c).join('') }

// Center every line - WhatsApp no get real center, we use padding to push am middle
function center(s = '', w = 36) {
  s = String(s)
  if (s.length >= w) return s
  const pad = Math.floor((w - s.length) / 2)
  return ' '.repeat(pad) + s
}

module.exports = {
  name: 'menu',
  alias: ['menu', 'help', 'commands'],
  command: ['menu', 'help', 'commands'],
  category: 'general',
  desc: 'Show Simon MD Menu',
  attachEngine: (sock) => { if (sock) console.log('[MENU] Engine loaded ✅') },
  __call: (sock) => { if (sock) console.log('[MENU] Engine loaded ✅') },

  execute: async (sock, m, { command }) => {
    const jid = m.key.remoteJid
    const cmd = (command || '').toLowerCase()
    if (!['menu', 'help', 'commands'].includes(cmd)) return

    // ✅ ALL IN ONE CAPTION - So PFP + Menu no separate
    // ✅ CENTERED - No more ╭─ left / ─╮ right, everything for middle
    const caption =
center('⚡ SIMON MD ⚡') + '\n' +
center(toTiny('REAL ENGINES CONNECTED')) + '\n' +
center('━━━━━━━━━━━━━━━') + '\n\n' +

center('🛡️ ANTI CORRUPTION') + '\n' +
center('.anticorruption .antinudes') + '\n' +
center('.antinude .nsfw .corruptionwarns') + '\n\n' +

center('🛡️ ANTI GC STATUS') + '\n' +
center('.antigcstatus .antigroupstatus') + '\n' +
center('.statusmention') + '\n\n' +

center('🗑️ ANTI DELETE') + '\n' +
center('.antirestore .antidelete .restore') + '\n' +
center('.deleted .lastdeleted') + '\n\n' +

center('🛡️ PROTECTION') + '\n' +
center('.antilink .antispam .antibot') + '\n' +
center('.antitag .antiflood .warn') + '\n' +
center('.ban .unban .block .delete .purge') + '\n' +
center('.antibadword .antimention .antifake') + '\n' +
center('.antivirtex .antiforward .security') + '\n\n' +

center('👥 GROUP') + '\n' +
center('.kick .add .promote .demote') + '\n' +
center('.tagall .hidetag .groupinfo') + '\n' +
center('.mute .unmute .open .close') + '\n' +
center('.welcome .goodbye .poll') + '\n\n' +

center('🤖 AUTO ENGINES') + '\n' +
center('.autoread .autotyping .autobio') + '\n' +
center('.autostatus .autoreact .autolike') + '\n' +
center('.autochat .autoai .autolevel') + '\n\n' +

center('👑 OWNER') + '\n' +
center('.eval .exec .restart .shutdown') + '\n' +
center('.setprefix .broadcast .bc .backup') + '\n' +
center('.setppbot .blocklist .mode') + '\n\n' +

center('👁️ VIEWONCE') + '\n' +
center('.vv .viewonce .del .delete .revoke') + '\n\n' +

center('━━━━━━━━━━━━━━━') + '\n' +
center('✦ ' + toTiny('Simon Md') + ' ✦')

    try {
      // ✅ ONE MESSAGE ONLY - PFP + Menu together
      await sock.sendMessage(jid, { image: { url: MENU_PFP }, caption }, { quoted: m })
    } catch {
      await sock.sendMessage(jid, { text: caption }, { quoted: m })
    }
  }
    }
