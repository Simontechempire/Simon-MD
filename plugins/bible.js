// 📖 SIMON MD - BIBLE - FREE, NO API, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

if(!global.bibleUsed) global.bibleUsed = new Set()
function pickNoRepeat(arr, key){
  if(!global.bibleUsed.has(key)) global.bibleUsed.set(key, new Set())
  const used = global.bibleUsed.get(key)
  if(used.size >= arr.length) used.clear()
  let idx
  do { idx = Math.floor(Math.random() * arr.length) } while (used.has(idx))
  used.add(idx)
  return arr[idx]
}
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }

const VERSES = [
  { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', topic: 'love' },
  { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.', topic: 'peace' },
  { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.', topic: 'strength' },
  { ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.', topic: 'hope' },
  { ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', topic: 'hope' },
  { ref: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.', topic: 'fear' },
  { ref: 'Proverbs 3:5', text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.', topic: 'trust' },
  { ref: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', topic: 'peace' },
  { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.', topic: 'strength' },
  { ref: 'Joshua 1:9', text: 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.', topic: 'courage' },
  { ref: '1 Corinthians 13:4', text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.', topic: 'love' },
  { ref: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.', topic: 'guidance' },
  { ref: 'Matthew 6:33', text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.', topic: 'trust' },
  { ref: 'Romans 10:9', text: 'That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.', topic: 'salvation' },
  { ref: 'Psalm 34:18', text: 'The Lord is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.', topic: 'peace' },
  { ref: 'Isaiah 40:31', text: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.', topic: 'strength' },
  { ref: '2 Timothy 1:7', text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', topic: 'fear' },
  { ref: 'Proverbs 22:6', text: 'Train up a child in the way he should go: and when he is old, he will not depart from it.', topic: 'guidance' },
  { ref: 'Matthew 5:16', text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.', topic: 'hope' },
  { ref: 'Psalm 37:4', text: 'Delight thyself also in the Lord; and he shall give thee the desires of thine heart.', topic: 'hope' },
  { ref: 'John 14:6', text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.', topic: 'salvation' },
  { ref: 'Romans 15:13', text: 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope.', topic: 'hope' },
  { ref: 'Psalm 121:1-2', text: 'I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the Lord, which made heaven and earth.', topic: 'help' },
  { ref: '1 Peter 5:7', text: 'Casting all your care upon him; for he careth for you.', topic: 'peace' },
  { ref: 'Hebrews 11:1', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.', topic: 'faith' },
  { ref: 'James 1:5', text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.', topic: 'guidance' },
  { ref: 'Psalm 100:4', text: 'Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.', topic: 'thanksgiving' },
  { ref: 'Galatians 5:22', text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.', topic: 'love' },
  { ref: 'Ephesians 6:11', text: 'Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.', topic: 'strength' },
  { ref: 'Psalm 27:1', text: 'The Lord is my light and my salvation; whom shall I fear? the Lord is the strength of my life; of whom shall I be afraid?', topic: 'fear' },
  { ref: 'Matthew 7:7', text: 'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.', topic: 'prayer' },
  { ref: 'Mark 11:24', text: 'Therefore I say unto you, What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them.', topic: 'prayer' },
  { ref: 'Psalm 51:10', text: 'Create in me a clean heart, O God; and renew a right spirit within me.', topic: 'prayer' },
  { ref: '1 John 4:19', text: 'We love him, because he first loved us.', topic: 'love' },
  { ref: 'Deuteronomy 31:6', text: 'Be strong and of a good courage, fear not, nor be afraid of them: for the Lord thy God, he it is that doth go with thee.', topic: 'courage' },
  { ref: 'Psalm 91:1', text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.', topic: 'peace' },
  { ref: 'Proverbs 18:10', text: 'The name of the Lord is a strong tower: the righteous runneth into it, and is safe.', topic: 'strength' },
  { ref: 'Isaiah 43:2', text: 'When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee.', topic: 'hope' },
  { ref: 'John 10:10', text: 'I am come that they might have life, and that they might have it more abundantly.', topic: 'hope' },
  { ref: 'Psalm 19:14', text: 'Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O Lord, my strength, and my redeemer.', topic: 'prayer' },
  { ref: 'Colossians 3:23', text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.', topic: 'guidance' },
  { ref: 'Psalm 118:24', text: 'This is the day which the Lord hath made; we will rejoice and be glad in it.', topic: 'thanksgiving' },
  { ref: '2 Corinthians 5:7', text: 'For we walk by faith, not by sight.', topic: 'faith' },
  { ref: 'Psalm 30:5', text: 'Weeping may endure for a night, but joy cometh in the morning.', topic: 'hope' },
  { ref: 'Romans 12:2', text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind.', topic: 'guidance' },
  { ref: 'Matthew 19:26', text: 'With men this is impossible; but with God all things are possible.', topic: 'faith' },
  { ref: 'Psalm 139:14', text: 'I will praise thee; for I am fearfully and wonderfully made.', topic: 'love' },
  { ref: 'John 1:1', text: 'In the beginning was the Word, and the Word was with God, and the Word was God.', topic: 'faith' },
  { ref: 'Psalm 84:11', text: 'For the Lord God is a sun and shield: the Lord will give grace and glory.', topic: 'hope' },
  { ref: '1 Thessalonians 5:18', text: 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.', topic: 'thanksgiving' },
]

const TOPICS = ['love','peace','strength','hope','fear','trust','courage','guidance','salvation','faith','prayer','help','thanksgiving']

function formatVerse(v){
  return box('BIBLE VERSE', [line('ref', v.ref), line('verse', v.text), line('topic', v.topic)])
}

module.exports = {
  command: ['bible','verse','bibleverse','dailyverse','votd','scripture','bibletopic','biblesearch','psalm','proverb','gospel','devotion','prayer'],
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
      // --=[ RANDOM VERSE - no repeat until cycle done ]=--
      if(['bible','verse','bibleverse','dailyverse','votd','scripture'].includes(command)){
        // If user send topic: .bible love / .verse hope
        if(text){
          const q = text.toLowerCase().trim()
          const filtered = VERSES.filter(v => v.topic === q || v.ref.toLowerCase().includes(q) || v.text.toLowerCase().includes(q))
          if(filtered.length){
            const v = pickNoRepeat(filtered, jid+':bible:'+q)
            await sock.sendMessage(jid, { text: formatVerse(v) }, { quoted: m })
            try{ await reactCmd(sock, jid, m.key, command) }catch{}
            try{ await reactDone(sock, jid, m.key) }catch{}
            return
          }
          // No match - tell topics
          await treply('Bible Search', [line('error', `No verse for "${text}"`), line('topics', TOPICS.join(', ')), line('usage', '.bible <topic> e.g. .bible love')])
          return
        }
        const v = pickNoRepeat(VERSES, jid+':bible:all')
        await sock.sendMessage(jid, { text: formatVerse(v) }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }

      // --=[ TOPIC ]=--
      if(command === 'bibletopic'){
        if(!text){ await treply('Bible Topic', [line('topics', TOPICS.join(', ')), line('usage', '.bibletopic love')]); return }
        const q = text.toLowerCase().trim()
        const filtered = VERSES.filter(v => v.topic === q)
        if(!filtered.length){ await treply('Bible Topic', [line('error', 'Topic not found'), line('topics', TOPICS.join(', '))]); return }
        const v = pickNoRepeat(filtered, jid+':bible:'+q)
        await sock.sendMessage(jid, { text: formatVerse(v) }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }

      // --=[ SEARCH ]=--
      if(['biblesearch','psalm','proverb','gospel'].includes(command)){
        let q = text || ''
        if(command === 'psalm') q = 'Psalm ' + (text || '')
        if(command === 'proverb') q = 'Proverbs ' + (text || '')
        if(command === 'gospel') q = text || 'John'
        if(!q.trim()){ await treply('Bible Search', [line('usage', '.biblesearch love / .psalm 23 / .proverb 3')]); return }
        const filtered = VERSES.filter(v => v.ref.toLowerCase().includes(q.toLowerCase()) || v.text.toLowerCase().includes(q.toLowerCase()) || v.topic === q.toLowerCase())
        if(!filtered.length){ await treply('Bible Search', [line('error', `No verse for "${q}"`), line('tip', 'Try .bible for random verse')]); return }
        // If multiple, show up to 3, random order
        const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 3)
        for(const v of shuffled){ await sock.sendMessage(jid, { text: formatVerse(v) }, { quoted: m }) }
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }

      // --=[ DEVOTION - verse + short message, random ]=--
      if(command === 'devotion'){
        const v = pickNoRepeat(VERSES, jid+':bible:devotion')
        const devotions = [
          `Today, hold this verse for heart. No matter wetin dey happen, God dey with you. Take one step at a time.`,
          `This verse na reminder: you no dey alone. Pray small, breathe, and trust.`,
          `Start your day with this. Let am guide your words and actions today.`,
          `When e hard, remember this verse. E go better.`
        ]
        const d = devotions[randInt(0, devotions.length - 1)]
        await sock.sendMessage(jid, { text: box('DEVOTION', [line('ref', v.ref), line('verse', v.text), line('message', d)]) }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }

      // --=[ PRAYER - random prayer, no API ]=--
      if(command === 'prayer'){
        const prayers = [
          `Lord, thank You for today. Give me peace, strength, and wisdom. Guide my steps and protect my family. Amen.`,
          `Father, I cast all my worries on You. Fill my heart with hope. Help me trust You even when I no understand. Amen.`,
          `Lord, bless my work today. Open doors no man fit close. Give me favour before people. Amen.`,
          `God, when I dey afraid, remind me You dey with me. Give me courage to face today. Amen.`
        ]
        const p = prayers[randInt(0, prayers.length - 1)]
        await sock.sendMessage(jid, { text: box('PRAYER', [p]) }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }

    } catch(e){
      await sock.sendMessage(jid, { text: box('Bible Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
   }
