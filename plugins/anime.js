// 🎌 SIMON MD - ANIME - FREE, NO API, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

if(!global.animeUsed) global.animeUsed = new Set()
function pickNoRepeat(arr, key){
  if(!global.animeUsed.has(key)) global.animeUsed.set(key, new Set())
  const used = global.animeUsed.get(key)
  if(used.size >= arr.length) used.clear()
  let idx
  do { idx = Math.floor(Math.random() * arr.length) } while (used.has(idx))
  used.add(idx)
  return arr[idx]
}
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }

const ANIMES = [
  { name: 'Naruto', genre: 'Action, Ninja', main: 'Naruto Uzumaki', desc: 'A young ninja who dreams of becoming Hokage, despite being hated for the fox inside him.' },
  { name: 'One Piece', genre: 'Action, Adventure, Pirates', main: 'Monkey D. Luffy', desc: 'Luffy and his crew sail the Grand Line to find One Piece and become King of the Pirates.' },
  { name: 'Attack on Titan', genre: 'Action, Dark Fantasy', main: 'Eren Yeager', desc: 'Humanity fights Titans behind walls. Eren vows revenge after his mother dies.' },
  { name: 'Demon Slayer', genre: 'Action, Demons', main: 'Tanjiro Kamado', desc: 'Tanjiro becomes a demon slayer to save his sister Nezuko who turned demon.' },
  { name: 'Jujutsu Kaisen', genre: 'Action, Supernatural', main: 'Yuji Itadori', desc: 'Yuji eats a cursed finger and becomes host to Sukuna, the King of Curses.' },
  { name: 'Dragon Ball Z', genre: 'Action, Martial Arts', main: 'Goku', desc: 'Goku protects Earth from villains, always getting stronger.' },
  { name: 'Death Note', genre: 'Thriller, Supernatural', main: 'Light Yagami', desc: 'Light finds a notebook that kills anyone whose name is written in it.' },
  { name: 'My Hero Academia', genre: 'Action, Superhero', main: 'Izuku Midoriya', desc: 'In a world where everyone has quirks, Deku was born quirkless but dreams of being a hero.' },
  { name: 'Bleach', genre: 'Action, Shinigami', main: 'Ichigo Kurosaki', desc: 'Ichigo becomes a Soul Reaper to protect the living from Hollows.' },
  { name: 'One Punch Man', genre: 'Action, Comedy', main: 'Saitama', desc: 'Saitama can defeat any enemy with one punch, but he is bored.' },
  { name: 'Hunter x Hunter', genre: 'Adventure, Action', main: 'Gon Freecss', desc: 'Gon wants to become a Hunter to find his father.' },
  { name: 'Fullmetal Alchemist', genre: 'Action, Alchemy', main: 'Edward Elric', desc: 'Two brothers use alchemy to try to bring their mother back.' },
  { name: 'Tokyo Ghoul', genre: 'Dark, Horror', main: 'Ken Kaneki', desc: 'Kaneki becomes half-ghoul after an accident.' },
  { name: 'Solo Leveling', genre: 'Action, Fantasy', main: 'Sung Jinwoo', desc: 'Weakest hunter becomes strongest through a mysterious system.' },
  { name: 'Chainsaw Man', genre: 'Action, Demons', main: 'Denji', desc: 'Denji merges with his devil dog Pochita and becomes Chainsaw Man.' },
  { name: 'Spy x Family', genre: 'Comedy, Family', main: 'Loid Forger / Anya', desc: 'A spy builds a fake family, but his daughter can read minds.' },
  { name: 'Vinland Saga', genre: 'Action, Vikings', main: 'Thorfinn', desc: 'A young Viking seeks revenge, then seeks peace.' },
  { name: 'Naruto Shippuden', genre: 'Action, Ninja', main: 'Naruto Uzumaki', desc: 'Naruto returns stronger to save Sasuke and protect the village.' },
  { name: 'Black Clover', genre: 'Action, Magic', main: 'Asta', desc: 'Asta was born without magic in a world of magic, but he never gives up.' },
  { name: 'Fire Force', genre: 'Action, Fire', main: 'Shinra Kusakabe', desc: 'Shinra joins Fire Force to fight infernals.' },
]
const QUOTES = [
  { quote: 'Hard work is worthless for those that don\'t believe in themselves.', anime: 'Naruto', char: 'Naruto Uzumaki' },
  { quote: 'If you don\'t take risks, you can\'t create a future.', anime: 'One Piece', char: 'Monkey D. Luffy' },
  { quote: 'If you don\'t like your destiny, don\'t accept it. Instead, have the courage to change it.', anime: 'Naruto', char: 'Naruto Uzumaki' },
  { quote: 'The world is not beautiful, therefore it is.', anime: 'Kino\'s Journey', char: 'Kino' },
  { quote: 'Whatever you lose, you\'ll find it again. But what you throw away you\'ll never get back.', anime: 'Spirited Away', char: 'Haku' },
  { quote: 'Fear is not evil. It tells you what your weakness is.', anime: 'Fairy Tail', char: 'Gildarts Clive' },
  { quote: 'It\'s not the face that makes someone a monster, it\'s the choices they make.', anime: 'Naruto', char: 'Naruto Uzumaki' },
  { quote: 'If you want to know who you are, you have to look at your real self and acknowledge what you see.', anime: 'Naruto', char: 'Itachi Uchiha' },
  { quote: 'Power comes in response to a need, not a desire.', anime: 'Dragon Ball Z', char: 'Goku' },
  { quote: 'To know sorrow is not terrifying. What is terrifying is to know you can\'t go back to happiness you could have.', anime: 'Matsumoto Rangiku', char: 'Bleach' },
  { quote: 'I\'m not gonna run away, I never go back on my word! That\'s my nindo: my ninja way.', anime: 'Naruto', char: 'Naruto Uzumaki' },
  { quote: 'A lesson without pain is meaningless. That\'s because no one can gain without sacrificing something.', anime: 'Fullmetal Alchemist', char: 'Edward Elric' },
  { quote: 'The moment you think of giving up, think of the reason why you held on so long.', anime: 'Naruto', char: 'Natsu Dragneel' },
  { quote: 'If you are a wall, I will break you down.', anime: 'Attack on Titan', char: 'Eren Yeager' },
  { quote: 'Don\'t give up, there is no shame in falling down! True shame is to not stand up again!', anime: 'Naruto', char: 'Shintaro Midorima' },
  { quote: 'Whatever you do, enjoy it to the fullest. That is the secret of life.', anime: 'Naruto', char: 'Naruto Uzumaki' },
  { quote: 'Being alone is better than being with the wrong person.', anime: 'Naruto', char: 'L Lawliet' },
  { quote: 'You should enjoy the little detours. Because that is where you will find the things more important than what you want.', anime: 'Naruto', char: 'Ging Freecss' },
  { quote: 'If you can\'t find a reason to fight, then you shouldn\'t be fighting.', anime: 'Naruto', char: 'Akame ga Kill' },
  { quote: 'It is not the world that is cruel, it is the people in it.', anime: 'Attack on Titan', char: 'Mikasa Ackerman' },
]
const CHARACTERS = [
  { name: 'Naruto Uzumaki', anime: 'Naruto', power: 'Rasengan, Shadow Clone, Nine-Tails Chakra' },
  { name: 'Sasuke Uchiha', anime: 'Naruto', power: 'Sharingan, Chidori, Rinnegan' },
  { name: 'Monkey D. Luffy', anime: 'One Piece', power: 'Gomu Gomu no Mi, Gear 5' },
  { name: 'Zoro', anime: 'One Piece', power: 'Three Sword Style' },
  { name: 'Eren Yeager', anime: 'Attack on Titan', power: 'Attack Titan, Founding Titan' },
  { name: 'Tanjiro Kamado', anime: 'Demon Slayer', power: 'Water Breathing, Sun Breathing' },
  { name: 'Nezuko', anime: 'Demon Slayer', power: 'Demon Blood, Regeneration' },
  { name: 'Goku', anime: 'Dragon Ball Z', power: 'Kamehameha, Ultra Instinct' },
  { name: 'Vegeta', anime: 'Dragon Ball Z', power: 'Galick Gun, Ultra Ego' },
  { name: 'Gojo Satoru', anime: 'Jujutsu Kaisen', power: 'Six Eyes, Infinity, Hollow Purple' },
  { name: 'Yuji Itadori', anime: 'Jujutsu Kaisen', power: 'Cursed Energy, Sukuna' },
  { name: 'Saitama', anime: 'One Punch Man', power: 'One Punch' },
  { name: 'Levi Ackerman', anime: 'Attack on Titan', power: 'ODM Gear, Titan Slayer' },
  { name: 'Light Yagami', anime: 'Death Note', power: 'Death Note, Genius' },
  { name: 'L Lawliet', anime: 'Death Note', power: 'Genius Detective' },
  { name: 'Ichigo Kurosaki', anime: 'Bleach', power: 'Zangetsu, Bankai' },
  { name: 'Sung Jinwoo', anime: 'Solo Leveling', power: 'Shadow Monarch, System' },
  { name: 'Denji', anime: 'Chainsaw Man', power: 'Chainsaw Devil' },
  { name: 'Anya Forger', anime: 'Spy x Family', power: 'Mind Reading' },
  { name: 'Asta', anime: 'Black Clover', power: 'Anti-Magic, Demon Slayer Sword' },
]
const WAIFU = [
  'Mikasa Ackerman - Attack on Titan', 'Nezuko - Demon Slayer', 'Hinata Hyuga - Naruto', 'Nami - One Piece', 'Robin - One Piece', 'Asuna - Sword Art Online', 'Rem - Re:Zero', 'Emilia - Re:Zero', 'Zero Two - Darling in the FranXX', 'Anya Forger - Spy x Family', 'Makima - Chainsaw Man', 'Power - Chainsaw Man', 'Sakura Haruno - Naruto', 'Tsunade - Naruto', 'Erza Scarlet - Fairy Tail', 'Lucy Heartfilia - Fairy Tail', 'Mitsuri Kanroji - Demon Slayer', 'Shinobu Kocho - Demon Slayer', 'Kaguya Shinomiya - Kaguya-sama', 'Mai Sakurajima - Bunny Girl Senpai'
]
const HUSBANDO = [
  'Gojo Satoru - Jujutsu Kaisen', 'Levi Ackerman - Attack on Titan', 'Luffy - One Piece', 'Zoro - One Piece', 'Naruto Uzumaki - Naruto', 'Sasuke Uchiha - Naruto', 'Goku - Dragon Ball Z', 'Sung Jinwoo - Solo Leveling', 'Tanjiro Kamado - Demon Slayer', 'Denji - Chainsaw Man', 'Itachi Uchiha - Naruto', 'Kakashi Hatake - Naruto', 'Eren Yeager - Attack on Titan', 'Saitama - One Punch Man', 'Ichigo Kurosaki - Bleach', 'L Lawliet - Death Note', 'Killua Zoldyck - Hunter x Hunter', 'Loid Forger - Spy x Family', 'Asta - Black Clover', 'Yuji Itadori - Jujutsu Kaisen'
]

module.exports = {
  command: ['anime','animequote','animequotes','animesearch','animeinfo','character','waifu','husbando','manga','otaku','animepic','animeimage','neko','naruto','onepiece','aot'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines, mentions=[]) => {
      await sock.sendMessage(jid, { text: box(title, lines), mentions }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(command === 'anime'){
        await treply('Anime - Free No API', [
          line('random', '.animequote'),
          line('search', '.animesearch Naruto'),
          line('character', '.character Gojo'),
          line('waifu', '.waifu'),
          line('husbando', '.husbando'),
          line('pic', '.animepic Naruto - link, no API'),
          line('info', 'Offline, no Jikan/Waifu API')
        ])
        return
      }
      if(['animequote','animequotes'].includes(command)){
        const q = pickNoRepeat(QUOTES, jid+':animequote')
        await treply('Anime Quote', [line('quote', `"${q.quote}"`), line('char', q.char), line('anime', q.anime)])
        return
      }
      if(['animesearch','animeinfo','manga'].includes(command)){
        if(!text){ await treply('Anime Search', [line('usage', '.animesearch Naruto')]); return }
        const q = text.toLowerCase()
        const found = ANIMES.filter(a => a.name.toLowerCase().includes(q) || a.main.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q))
        if(!found.length){
          await treply('Anime Search', [line('error', `No anime for "${text}" in offline list`), line('tip', 'Try: Naruto, One Piece, Demon Slayer, Jujutsu Kaisen, Attack on Titan'), line('search-link', `https://myanimelist.net/anime.php?cat=anime&q=${encodeURIComponent(text)}`)])
          return
        }
        const a = found[0]
        await treply(`Anime - ${a.name}`, [line('genre', a.genre), line('main', a.main), line('desc', a.desc), line('more', `https://myanimelist.net/anime.php?cat=anime&q=${encodeURIComponent(a.name)}`)])
        return
      }
      if(command === 'character'){
        if(!text){ await treply('Character', [line('usage', '.character Gojo')]); return }
        const q = text.toLowerCase()
        const found = CHARACTERS.filter(c => c.name.toLowerCase().includes(q) || c.anime.toLowerCase().includes(q))
        if(!found.length){ await treply('Character', [line('error', `No character for "${text}"`), line('tip', 'Try: Naruto, Gojo, Luffy, Goku')]); return }
        const c = found[0]
        await treply(`Character - ${c.name}`, [line('anime', c.anime), line('power', c.power)])
        return
      }
      if(command === 'waifu'){
        const w = pickNoRepeat(WAIFU, jid+':waifu')
        const pct = randInt(50,100)
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender
        await treply('Waifu', [line('waifu', w), line('match', `${pct}%`), line('user', `@${target.split('@')[0]}`)], [target])
        return
      }
      if(command === 'husbando'){
        const h = pickNoRepeat(HUSBANDO, jid+':husbando')
        const pct = randInt(50,100)
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender
        await treply('Husbando', [line('husbando', h), line('match', `${pct}%`), line('user', `@${target.split('@')[0]}`)], [target])
        return
      }
      if(['animepic','animeimage','neko','naruto','onepiece','aot'].includes(command)){
        // Honest: image needs API, we give free search link, no fake broken image
        let query = text || command
        if(command === 'naruto') query = 'Naruto Uzumaki'
        if(command === 'onepiece') query = 'Monkey D Luffy One Piece'
        if(command === 'aot') query = 'Attack on Titan Eren'
        if(command === 'neko') query = 'Neko anime girl'
        await treply('Anime Pic', [
          line('search', query),
          line('link', `https://duckduckgo.com/?q=${encodeURIComponent(query + ' anime')}&iax=images&ia=images`),
          line('mal', `https://myanimelist.net/anime.php?cat=anime&q=${encodeURIComponent(query)}`),
          line('note', 'Open link for image - no API key, no broken image')
        ])
        return
      }
      if(command === 'otaku'){
        const level = randInt(1,100)
        const ranks = level > 80 ? 'Otaku King/Queen' : level > 50 ? 'True Otaku' : level > 30 ? 'Casual Watcher' : 'Newbie - start with Naruto'
        await treply('Otaku Level', [line('user', `@${sender.split('@')[0]}`), line('level', `${level}%`), line('rank', ranks)], [sender])
        return
      }
    } catch(e){
      await sock.sendMessage(jid, { text: box('Anime Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
    }
