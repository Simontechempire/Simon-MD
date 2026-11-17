// 📋 SIMON MD - MENU ONLY - NO CMD INSIDE
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

module.exports = {
  command: ['menu','help','allmenu','commands','cmd','list','allcmd','all'],
  execute: async (sock, m, { command, text }) => {
    const jid = m.key.remoteJid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    try {
      const menuText = `✨ 𝗦𝗜𝗠𝗢𝗡 𝗠𝗗 - 𝗠𝗘𝗡𝗨
━━━━━━━━━━━━━━━━━━

🛡️ 𝗣𝗥𝗢𝗧𝗘𝗖𝗧𝗜𝗢𝗡
┊◆ .protection
┊◆ .antilink on / off
┊◆ .antilink2 on / off
┊◆ .antispam on / off
┊◆ .antibot on / off
┊◆ .antiviewonce on / off
┊◆ .antidelete on / off

👥 𝗚𝗥𝗢𝗨𝗣
┊◆ .group
┊◆ .groupinfo
┊◆ .kick @user
┊◆ .add 2348012345678
┊◆ .promote @user
┊◆ .demote @user
┊◆ .tagall hello
┊◆ .hidetag hello
┊◆ .mute / .unmute
┊◆ .link / .revoke
┊◆ .setname / .setdesc
┊◆ .poll Q | Opt1 | Opt2

👁️ 𝗩𝗩 - 𝗩𝗜𝗘𝗪 𝗢𝗡𝗖𝗘
┊◆ .vv
┊◆ .viewonce

🧠 𝗤𝗨𝗜𝗭
┊◆ .quiz 10
┊◆ .quiz 100
┊◆ Subjects: Math, English, Literature,
┊◆ Geography, Biology, Chemistry, Physics,
┊◆ CRS, Economy, Marketing, Government,
┊◆ Sport, Computer, General, Art, Music

🔄 𝗖𝗢𝗡𝗩𝗘𝗥𝗧
┊◆ .convert
┊◆ .tosticker
┊◆ .toimg / .tojpg / .topng
┊◆ .towebp / .tovideo
┊◆ .tomp3 / .tovoice / .toopus
┊◆ .towav / .tom4a / .togif

🤖 𝗔𝗨𝗧𝗢
┊◆ .auto
┊◆ .autoread on / off
┊◆ .autoreact on / off
┊◆ .autotype on / off
┊◆ .autorecording on / off
┊◆ .autoview on / off
┊◆ .autostatus on / off

📸 𝗣𝗛𝗢𝗧𝗢 𝗘𝗗𝗜𝗧𝗜𝗡𝗚
┊◆ .photoediting
┊◆ .grayscale .sepia .invert .blur
┊◆ .sharpen .flip .flop .rotate90
┊◆ .bright .dark .contrast .pixelate
┊◆ .resize .circle .s

🎬 𝗩𝗜𝗗𝗘𝗢 𝗘𝗗𝗜𝗧𝗜𝗡𝗚
┊◆ .videoediting
┊◆ .trim 0 10 .compress .mute
┊◆ .speed 2x .reverse .rotatevideo
┊◆ .flipvideo .volume .watermark
┊◆ .tomp3 .gif .thumb

🎵 𝗣𝗟𝗔𝗬
┊◆ .play Asake Lonely At The Top
┊◆ .preview Asake

🛡️ 𝗘𝗧𝗛𝗜𝗖𝗔𝗟 𝗛𝗔𝗖𝗞𝗜𝗡𝗚
┊◆ .ethicalhacking
┊◆ .lesson 1-10 .passcheck
┊◆ .phishcheck .dnscheck .owasp .labs

👑 𝗢𝗪𝗡𝗘𝗥
┊◆ .owner .ping .uptime
┊◆ .broadcast .restart .mode

📥 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗
┊◆ .download .tiktok .ig .ytdl .fbdl

🔍 𝗦𝗘𝗔𝗥𝗖𝗛
┊◆ .search .google .image .wiki
┊◆ .define .lyrics .news

😂 𝗙𝗨𝗡
┊◆ .fun .joke .dare .truth .ship
┊◆ .rate .roast .quote .pickup .meme

🛠️ 𝗨𝗧𝗜𝗟𝗜𝗧𝗬
┊◆ .utility .calc .weather .translate
┊◆ .qr .time .coin .dice

🤖 𝗔𝗜
┊◆ .ai <question> .imagine <prompt>

🏷️ 𝗦𝗧𝗜𝗖𝗞𝗘𝗥
┊◆ .sticker .smeme .ttp .attp

⚙️ 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦
┊◆ .settings .setprefix .setmode
┊◆ .setname .botinfo

━━━━━━━━━━━━━━━━━━
💡 Type any cmd above to use am
💡 .menu again to see this`

      try{
        await sock.sendMessage(jid, {
          text: menuText,
          footer: 'SIMON MD - Menu Only',
          title: 'SIMON MD Menu',
          buttonText: '🚀 Open Menu',
          sections: [
            { title: '🛡️ Protection & Group', rows: [
              { title: '🛡️ Protection', rowId: 'menu_protection', description: 'antilink, antispam, antibot' },
              { title: '👥 Group', rowId: 'menu_group', description: 'kick, add, tagall, poll' },
              { title: '👁️ VV', rowId: 'menu_vv', description: '.vv save view once' },
              { title: '🤖 Auto', rowId: 'menu_auto', description: 'autoread, autoreact' },
              { title: '👑 Owner', rowId: 'menu_owner', description: 'ping, broadcast' },
              { title: '⚙️ Settings', rowId: 'menu_settings', description: 'prefix, mode' },
            ]},
            { title: '🧠 Quiz & Convert', rows: [
              { title: '🧠 Quiz', rowId: 'menu_quiz', description: '.quiz 10' },
              { title: '🔄 Convert', rowId: 'menu_convert', description: 'sticker, image, audio' },
              { title: '📥 Download', rowId: 'menu_download', description: 'tiktok, ig, yt' },
              { title: '🔍 Search', rowId: 'menu_search', description: 'google, wiki' },
            ]},
            { title: '📸 Media & Fun', rows: [
              { title: '📸 Photo', rowId: 'menu_photo', description: 'grayscale, sepia' },
              { title: '🎬 Video', rowId: 'menu_video', description: 'trim, compress' },
              { title: '🎵 Play', rowId: 'menu_play', description: '.play song' },
              { title: '😂 Fun', rowId: 'menu_fun', description: 'joke, dare, ship' },
              { title: '🛠️ Utility', rowId: 'menu_utility', description: 'calc, qr, weather' },
              { title: '🤖 AI', rowId: 'menu_ai', description: '.ai, .imagine' },
              { title: '🏷️ Sticker', rowId: 'menu_sticker', description: 'ttp, attp' },
              { title: '🛡️ Hacking', rowId: 'menu_hack', description: 'lesson, passcheck' },
            ]}
          ]
        }, { quoted: m })
      }catch{
        await sock.sendMessage(jid, { text: menuText }, { quoted: m })
      }
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    } catch(e){
      await sock.sendMessage(jid, { text: box('Menu Error', [line('error', e.message)]) }, { quoted: m })
    }
  },
  handleResponse: async (sock, m) => {
    const jid = m.key.remoteJid
    let id = null
    if(m.message?.listResponseMessage) id = m.message.listResponseMessage.singleSelectReply?.selectedRowId
    if(m.message?.buttonsResponseMessage) id = m.message.buttonsResponseMessage.selectedButtonId
    if(!id || !id.startsWith('menu_')) return false
    const map = {
      menu_protection: '🛡️ PROTECTION\n.protection\n.antilink on/off\n.antilink2 on/off\n.antispam on/off\n.antibot on/off\n.antiviewonce on/off\n.antidelete on/off',
      menu_group: '👥 GROUP\n.group\n.groupinfo\n.kick @user\n.add 234...\n.promote @user\n.demote @user\n.tagall hello\n.hidetag hello\n.mute / .unmute\n.link / .revoke\n.setname / .setdesc\n.poll Q | Opt1 | Opt2',
      menu_vv: '👁️ VV\n.vv - reply view-once to save\n.viewonce - same',
      menu_quiz: '🧠 QUIZ\n.quiz 10\n.quiz 100\nTap subject → Tap Easy/Medium/Hard → Vote Poll',
      menu_convert: '🔄 CONVERT\n.convert\n.tosticker\n.toimg / .tojpg / .topng\n.towebp / .tovideo\n.tomp3 / .tovoice / .toopus\n.towav / .tom4a / .togif',
      menu_auto: '🤖 AUTO\n.auto\n.autoread on/off\n.autoreact on/off\n.autotype on/off\n.autorecording on/off\n.autoview on/off\n.autostatus on/off',
      menu_photo: '📸 PHOTO EDITING\n.photoediting\nReply image:\n.grayscale .sepia .invert .blur .sharpen .flip .flop .rotate90 .bright .dark .contrast .pixelate .resize .circle .s',
      menu_video: '🎬 VIDEO EDITING\n.videoediting\nReply video:\n.trim 0 10 .compress .mute .speed 2x .reverse .rotatevideo .flipvideo .volume .watermark .tomp3 .gif .thumb',
      menu_play: '🎵 PLAY\n.play Asake Lonely At The Top\n.preview Asake',
      menu_hack: '🛡️ ETHICAL HACKING\n.ethicalhacking\n.lesson 1-10\n.passcheck\n.phishcheck\n.dnscheck\n.owasp\n.labs',
      menu_owner: '👑 OWNER\n.owner\n.ping\n.uptime\n.broadcast\n.restart\n.mode',
      menu_download: '📥 DOWNLOAD\n.download\n.tiktok <link>\n.ig <link>\n.ytdl <link>\n.fbdl <link>',
      menu_search: '🔍 SEARCH\n.search\n.google <query>\n.image <query>\n.wiki <query>\n.define <word>\n.lyrics <song>\n.news',
      menu_fun: '😂 FUN\n.fun\n.joke\n.dare\n.truth\n.ship\n.rate\n.roast\n.quote\n.pickup\n.meme',
      menu_utility: '🛠️ UTILITY\n.utility\n.calc 2+2\n.weather Lagos\n.translate\n.qr Hello\n.time\n.coin\n.dice',
      menu_ai: '🤖 AI\n.ai What is photosynthesis?\n.imagine cat in space',
      menu_sticker: '🏷️ STICKER\n.sticker\n.smeme\n.ttp Hello\n.attp Hello',
      menu_settings: '⚙️ SETTINGS\n.settings\n.setprefix !\n.setmode public/self\n.setname SIMON\n.botinfo',
    }
    if(!map[id]) return false
    await sock.sendMessage(jid, { text: box('Menu', [line('info', map[id])]) }, { quoted: m })
    return true
  }
              }
