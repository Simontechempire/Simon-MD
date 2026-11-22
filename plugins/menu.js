// ⚡ SIMON MD - Menu | Full - No Crash
const MENU_PFP = 'https://files.catbox.moe/4nbm9j.jpg'

const tinyMap = { a:'ᵃ', b:'ᵇ', c:'ᶜ', d:'ᵈ', e:'ᵉ', f:'ᶠ', g:'ᵍ', h:'ʰ', i:'ᶦ', j:'ʲ', k:'ᵏ', l:'ˡ', m:'ᵐ', n:'ⁿ', o:'ᵒ', p:'ᵖ', q:'ᑫ', r:'ʳ', s:'ˢ', t:'ᵗ', u:'ᵘ', v:'ᵛ', w:'ʷ', x:'ˣ', y:'ʸ', z:'ᶻ', A:'ᴬ', B:'ᴮ', C:'ᶜ', D:'ᴰ', E:'ᴱ', F:'ᶠ', G:'ᴳ', H:'ᴴ', I:'ᴵ', J:'ᴶ', K:'ᴷ', L:'ᴸ', M:'ᴹ', N:'ᴺ', O:'ᴼ', P:'ᴾ', Q:'ᑫ', R:'ᴿ', S:'ˢ', T:'ᵀ', U:'ᵁ', V:'ⱽ', W:'ᵂ', X:'ˣ', Y:'ʸ', Z:'ᶻ', 0:'⁰', 1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸', 9:'⁹' }
function toTiny(s = '') { return String(s).split('').map(c => tinyMap[c] || c).join('') }

module.exports = {
  name: 'menu',
  alias: ['menu', 'help', 'commands'],
  command: ['menu', 'help', 'commands'],
  category: 'general',
  desc: 'Show Simon MD Menu',

  attachEngine: (sock) => { if (sock) console.log('[MENU] Engine loaded ✅') },
  __call: (sock) => { if (sock) console.log('[MENU] Engine loaded ✅') },

  // FIXED: await is INSIDE async execute - no more top-level await error
  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    const cmd = (command || '').toLowerCase()
    if (!['menu', 'help', 'commands'].includes(cmd)) return

    const caption =
`⚡ ${toTiny('SIMON REAL ENGINES CONNECTED')}

╭─ 🛡️ ${toTiny('Anti Corruption')} ─╮
│ 🌸 .anticorruption
│ 🦋 .antinudes
│ 🍓 .antinude
│ ⭐ .nsfw
│ 🌙 .setcorruptionwarn
│ 🔥 .corruptionwarns
│ 💎 .resetcorruption
╰─────────────────╯

╭─ 🛡️ ${toTiny('Anti GC Status')} ─╮
│ 🦄 .antigcstatus
│ 🍒 .antigroupstatus
│ 🌹 .antigcstatusmention
│ ⚡ .antistatusmention
│ 🍭 .statusmention
╰─────────────────╯

╭─ 🗑️ ${toTiny('Anti Delete')} ─╮
│ 💫 .antirestore
│ 🎀 .antidelete
│ 🦊 .restore
│ 🍑 .deleted
│ 🌺 .lastdeleted
│ 🐝 .deletedmsg
╰─────────────────╯

╭─ 🛡️ ${toTiny('Protection')} ─╮
│ 🔗 .antilink
│ 📢 .antispam
│ 🤖 .antibot
│ 🏷️ .antitag
│ 🌊 .antiflood
│ ⚠️ .warn
│ 📋 .warnings
│ 🔄 .resetwarn
│ 🧹 .clearwarn
│ 🚫 .ban
│ ✅ .unban
│ 🔒 .block
│ 🔓 .unblock
│ 🗑️ .delete
│ 🗑️ .del
│ 🧹 .purge
│ 🧹 .clear
│ 🐢 .slowmode
│ 🔒 .lock
│ 🔓 .unlock
│ 🤬 .antibadword
│ 🤬 .badword
│ ➕ .addbadword
│ ➖ .delbadword
│ 📋 .listbadword
│ 📣 .antimention
│ 🎭 .antifake
│ 🕵️ .antiscam
│ 🎣 .antiphish
│ 💥 .antivirtex
│ ↗️ .antiforward
│ 🎬 .antimedia
│ 🏷️ .antisticker
│ 🎞️ .antigif
│ 📄 .antidocument
│ 🎙️ .antiaudio
│ 🎥 .antivideo
│ 🖼️ .antipicture
│ 📊 .antipoll
│ 📢 .antichannel
│ 👥 .antigroup
│ ⬆️ .antipromote
│ ⬇️ .antidemote
│ 🚨 .raidmode
│ 🛡️ .security
│ 📜 .modlogs
│ ⚙️ .setwarn
│ ♻️ .resetprotection
│ 📊 .gstatus
╰─────────────────╯

╭─ 👥 ${toTiny('Group')} ─╮
│ 🦶 .kick
│ ➕ .add
│ ⬆️ .promote
│ ⬇️ .demote
│ 📢 .tagall
│ 👻 .hidetag
│ 👑 .admins
│ ℹ️ .groupinfo
│ 🔒 .closegc
│ 🔇 .mute
│ 🔊 .unmute
│ 🔓 .open
│ 🔒 .close
│ 🔗 .revoke
│ 🔗 .newlink
│ 🔗 .resetlink
│ ✉️ .invite
│ ➡️ .join
│ 👋 .leave
│ 🏷️ .setname
│ 📝 .setdesc
│ 🏷️ .setsubject
│ 🖼️ .setgrouppic
│ 🖼️ .getgrouppic
│ 🏷️ .groupname
│ 📝 .groupdesc
│ 🔢 .membercount
│ 👥 .members
│ 🟢 .listonline
│ 👑 .listadmin
│ 👥 .listmember
│ 📢 .everyone
│ 👑 .tagadmin
│ 👥 .tagmember
│ 🦶 .kickall
│ ⬆️ .promoteall
│ ⬇️ .demoteall
│ 👥 .group
│ 👋 .welcome
│ 👋 .goodbye
│ 👋 .setwelcome
│ 👋 .setgoodbye
│ 🗑️ .delwelcome
│ 🗑️ .delgoodbye
│ ✅ .approve
│ ❌ .reject
│ 📩 .requests
│ 📊 .poll
│ 🗳️ .vote
╰─────────────────╯

╭─ 🤖 ${toTiny('Auto Engines')} ─╮
│ 👁️ .autoread
│ ⌨️ .autotyping
│ 🎙️ .autorecording
│ 🧬 .autobio
│ 📱 .autostatus
│ 👀 .autostatusview
│ ❤️ .autostatuslike
│ 😍 .autostatusreact
│ 😀 .autoreact
│ ❤️ .autolike
│ 👁️ .autoreadstatus
│ ⬇️ .autodlstatus
│ 🚫 .autoblock
│ ✅ .autounblock
│ 🦶 .autokick
│ 🚫 .autoban
│ ⚠️ .autowarn
│ 🗑️ .autodelete
│ 🏷️ .autosticker
│ 💬 .autorespond
│ 🤖 .autochat
│ 🧠 .autoai
│ 📈 .autolevel
│ ➡️ .autojoin
│ 👋 .autoleave
│ 👥 .autogroup
│ ❌ .autoreject
│ ✅ .autoapprove
│ 💾 .autosave
│ 💾 .autobackup
│ 🧹 .autoclean
│ 🧨 .autopurge
│ 📶 .autoping
│ 👁️ .autopresence
│ 👥 .autoreadgc
│ 💬 .autoreadpc
│ ⬇️ .autodownload
│ 👀 .autoview
│ ✔️ .autoseen
│ 📝 .autopost
│ ↩️ .autoreply
│ 🎙️ .autovoice
│ ⚙️ .setauto
│ 🔞 .autonsfw
│ 🚫 .antinsfwauto
│ 🏠 .autogc
│ 📱 .autopc
│ 📞 .autocall
╰─────────────────╯

╭─ 👑 ${toTiny('Owner')} ─╮
│ 🛠️ .eval
│ 💻 .exec
│ ⌨️ .sh
│ 🖥️ .term
│ 🔄 .restart
│ 🛑 .shutdown
│ ⬇️ .update
│ 📥 .gitpull
│ 🔤 .setprefix
│ 📝 .setstatus
│ 🧬 .setbio
│ 🏷️ .setname
│ 🖼️ .setppbot
│ 👤 .getppbot
│ 🚫 .blocklist
│ 🔒 .block
│ 🔓 .unblock
│ ➕ .join
│ 👋 .leave
│ 👥 .creategroup
│ 👑 .setowner
│ ➕ .addowner
│ ➖ .delowner
│ 👁️ .ownermode
│ 🔒 .self
│ 🌍 .public
│ ⚙️ .mode
│ 📵 .pmblocker
│ 📞 .anticall
│ 📵 .callblock
│ 💾 .backup
│ 📣 .broadcast
│ 📢 .bc
│ 📣 .bcgc
│ 📞 .bcall
│ 🧹 .cleartmp
│ 🧹 .tmpclean
│ 📜 .logs
│ 📜 .log
│ 🖥️ .cpu
│ 💾 .ram
│ 💽 .disk
│ 🌐 .hostinfo
│ 📜 .changelog
│ 🐛 .reportbug
╰─────────────────╯

╭─ 👁️ ${toTiny('Delete / ViewOnce')} ─╮
│ 🗑️ .r
│ 🗑️ .del
│ 🗑️ .delete
│ ↩️ .revoke
│ 👁️ .vv
│ 👁️ .viewonce
│ 👁️ .vv2
│ 👁️ .vv3
│ 🖼️ .vvimage
│ 🎥 .vvvideo
│ 🎙️ .vvaudio
│ 📂 .vvall
│ 🤖 .autovv
│ 🚫 .antiviewonce
╰─────────────────╯

╭─ 👋 ${toTiny('Welcome')} ─╮
│ 👋 .wlc
│ 👋 .gcwelcome
│ 👋 .gcgoodbye
│ 👋 .welcome
│ 👋 .goodbye
╰─────────────────╯

╰─ ${toTiny('Simon Md')} ─╯`

    try {
      await sock.sendMessage(jid, { image: { url: MENU_PFP }, caption: `⚡ ${toTiny('SIMON REAL ENGINES CONNECTED')}\n\n╰─ ${toTiny('Simon Md')} ─╯` }, { quoted: m })
      await sock.sendMessage(jid, { text: caption }, { quoted: m })
    } catch {
      await sock.sendMessage(jid, { text: caption }, { quoted: m })
    }
  }
}
