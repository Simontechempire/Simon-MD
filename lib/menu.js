// ============================================
// SIMON MD - Menu System
// Professional Design
// ============================================
const settings = require('../settings')

const SIMON_MENU = `
🩺 SIMON MD
                ⚡ SIMON MD ⚡

╭━━〔 👑 BOT INFORMATION 〕━━╮
┃ 🩺 Bot      : SIMON MD
┃ ⚡ Version  : 2.5.0
┃ 🔰 Prefix   : ${settings.prefix}
┃ 📱 Platform : WhatsApp
┃ 💻 Runtime  : Node.js
┃ 🛡️ Status   : ACTIVE
┃ 📚 Commands : 710
┃ 👑 Owner    : ${settings.ownerNumber}
┃ 🏢 Company  : Simon Tech Inc
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🩺 1. MAIN & GENERAL 〕━━╮
┃ .menu .help .ping .alive .runtime .owner .botinfo .support .about .version .speed .uptime .status .repository .script .dashboard .listcmd .allcmd .command .prefix .system .server .host .platform .device .users .groups .chats .time .date .timezone .language .feedback .report .suggest .contact .donate .terms .privacy .disclaimer .credits .thanks .rules .guide .tutorial .faq .statusbot .check .info
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🤖 2. AI & CHATBOTS 〕━━╮
┃ .ai .gpt .chatgpt .gemini .llama .deepseek .claude .copilot .perplexity .ask .imagine .translate .summarize .define .explain .rewrite .grammar .paraphrase .essay .story .poem .code .debug .javascript .python .html .css .nodejs .sql .regex .math .solve .homework .quiz .tutor .languageai .emailai .caption .bioai .businessai .marketingai .resumeai .interviewai .ideas .plan .recipeai .travelai .sentiment .aiclear
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🎨 3. IMAGE & STICKER 〕━━╮
┃ .sticker .s .toimg .take .blur .enhance .removebg .photo .meme .logo .attp .ttp .emojimix .circle .crop .resize .rotate .flip .greyscale .sepia .wanted .trigger .wasted .jail .passed .beautiful .facepalm .deletebg .remini .upscale .compress .png .jpg .webp .gif .tojpeg .tomp4 .togif .stickerinfo .stickerpack .extract .pixelate .invert .brightness .contrast .sharpen .sketch .cartoon .anime .wallpaperai
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 📥 4. DOWNLOADS & MUSIC 〕━━╮
┃ .play .song .video .ytmp3 .ytmp4 .tiktok .facebook .instagram .mediafire .spotify .youtube .twitter .xvideo .pinterest .threads .reddit .gdrive .mega .soundcloud .audiomack .lyrics .shazam .ytaudio .ytvideo .ytsearch .ttsearch .igstory .igprofile .fbvideo .fbphoto .twvideo .pinsearch .pinvideo .pinaudio .direct .fetch .download .dl .media .audio .document .fileinfo .filesize .compressvideo .convertmp3 .convertmp4 .trim .mergeaudio .videoinfo .playlist
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 👥 5. GROUP ADMINISTRATION 〕━━╮
┃ .kick .add .promote .demote .tagall .hidetag .admins .groupinfo .mute .unmute .open .close .link .revoke .setname .setdesc .setppgc .leave .join .invite .welcome .goodbye .setwelcome .setgoodbye .antilink .antibot .antispam .antiviewonce .antidelete
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🛡️ 6. PROTECTION 〕━━╮
┃ .antilink .antibot .antispam .antiviewonce .antidelete .antitag .anticall .antiimage .antivideo .antiaudio .antidoc .antisticker .antipromote .antidemote .raidmode .security .modlogs .setwarn .resetprotection
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🔍 7. SEARCH & INFORMATION 〕━━╮
┃ .google .wikipedia .weather .news .lyrics .github .npm .movie .anime .wallpaper .image .images .search .web .bing .duckduckgo .defineword .dictionary .synonym .antonym .meaning .pronounce .country .capital .currency .exchange .timein .calendar .holidays .football .scores .fixtures .standings .cricket .technology .trending .hashtag .domain .iplookup .dnslookup .whois .shorturl .expandurl .qrread .barcode
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🎮 8. FUN & GAMES 〕━━╮
┃ .joke .quote .fact .riddle .ship .character .truth .dare .compliment .roast .8ball .flip .coin .dice .roll .guess .trivia .quizgame .wordgame .mathgame .rps .tictactoe .hangman .scramble .wordle .chess .checkers .slots .lottery .number .random .choose .rate .shiprate .lovecalc .friend .personality .roastme .complimentme .pickup .insult .motivate .inspire .dailyquote .darkjoke .memes .factoftheday .wouldyourather .neverhaveiever
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 👑 9. OWNER & BOT MANAGEMENT 〕━━╮
┃ .setprefix .togcstatus .setname .setbio .restart .shutdown .broadcast .bc .blockuser .unblockuser .clearsession .ownerinfo .setowner .setppbot .setmenu .setthumb .setstatus .public .private .self .mode .maintenance .autoupdate .update .checkupdate .install .uninstall .plugin .plugins .addplugin .delplugin .reload .eval .exec .shell .getfile .savefile .delfile .backup .restore .cleardb .stats .botstats .userstats .groupstats .banuser .unbanuser .setbotpic .logs
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 ⚙️ 10. TOOLS & UTILITIES 〕━━╮
┃ .settings .autotyping .autorecording .autoreact .autostatus .readmessage .settimezone .setlanguage .calculator .convert .unit .percentage .bmi .stopwatch .timer .remind .note .notes .todo .qr .qrcode .shorten .password .uuid .base64 .encode .decode .binary .hex .hash .md5 .sha256 .json .formatjson .urlencode .urldecode .color .randomcolor .textcount .wordcount .reverse .uppercase .lowercase .repeat .translatefile .screenshot .systeminfo .memory .cpu
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🩺 SIMON SYSTEM 〕━━╮
┃ ⚡ POWERED BY SIMON MD
┃ 🩺 Professional WhatsApp Bot
┃ 👑 OWNER: ${settings.ownerNumber}
┃ 🔰 PREFIX: ${settings.prefix}
┃ 💻 NODE.JS + BAILEYS
┃ 🔗 ${settings.channelLink}
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

       🩺 SIMON MD 🩺
         Always Online
`

module.exports = { SIMON_MENU }
