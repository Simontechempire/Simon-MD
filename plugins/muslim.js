// ☪️ SIMON MD - MUSLIM - FREE, NO API, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

if(!global.muslimUsed) global.muslimUsed = new Set()
function pickNoRepeat(arr, key){
  if(!global.muslimUsed.has(key)) global.muslimUsed.set(key, new Set())
  const used = global.muslimUsed.get(key)
  if(used.size >= arr.length) used.clear()
  let idx
  do { idx = Math.floor(Math.random() * arr.length) } while (used.has(idx))
  used.add(idx)
  return arr[idx]
}
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }

const QURAN = [
  { ref: 'Al-Baqarah 2:152', text: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.', topic: 'gratitude' },
  { ref: 'Al-Baqarah 2:186', text: 'And when My servants ask you concerning Me, indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.', topic: 'prayer' },
  { ref: 'Ash-Sharh 94:6', text: 'Indeed, with hardship comes ease.', topic: 'hope' },
  { ref: 'At-Talaq 65:3', text: 'And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose.', topic: 'trust' },
  { ref: 'Al-Imran 3:139', text: 'So do not weaken and do not grieve, and you will be superior if you are true believers.', topic: 'strength' },
  { ref: 'Az-Zumar 39:53', text: 'Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.', topic: 'forgiveness' },
  { ref: 'Al-Ankabut 29:69', text: 'And those who strive for Us - We will surely guide them to Our ways.', topic: 'guidance' },
  { ref: 'Al-Fatihah 1:5', text: 'It is You we worship and You we ask for help.', topic: 'prayer' },
  { ref: 'Yusuf 12:87', text: 'And never give up hope of Allah\'s Mercy. Certainly no one despairs of Allah\'s Mercy, except the people who disbelieve.', topic: 'hope' },
  { ref: 'Ar-Ra\'d 13:28', text: 'Verily, in the remembrance of Allah do hearts find rest.', topic: 'peace' },
  { ref: 'Al-Baqarah 2:286', text: 'Allah does not charge a soul except with that within its capacity.', topic: 'strength' },
  { ref: 'Al-Hujurat 49:13', text: 'Indeed, the most noble of you in the sight of Allah is the most righteous of you.', topic: 'character' },
  { ref: 'An-Nahl 16:97', text: 'Whoever does righteousness, whether male or female, while he is a believer - We will surely cause him to live a good life.', topic: 'hope' },
  { ref: 'Al-Isra 17:23', text: 'And your Lord has decreed that you not worship except Him, and to parents, good treatment.', topic: 'parents' },
  { ref: 'Luqman 31:17', text: 'O my son, establish prayer, enjoin what is right, forbid what is wrong, and be patient over what befalls you.', topic: 'patience' },
  { ref: 'Al-Asr 103:1-3', text: 'By time, indeed, mankind is in loss, except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.', topic: 'patience' },
  { ref: 'Al-Mulk 67:2', text: 'He who created death and life to test you as to which of you is best in deed.', topic: 'guidance' },
  { ref: 'Al-Furqan 25:63', text: 'And the servants of the Most Merciful are those who walk upon the earth easily, and when the ignorant address them harshly, they say words of peace.', topic: 'character' },
  { ref: 'Al-Hashr 59:18', text: 'O you who have believed, fear Allah. And let every soul look to what it has put forth for tomorrow.', topic: 'guidance' },
  { ref: 'Yasin 36:58', text: 'Peace - a word from a Merciful Lord.', topic: 'peace' },
]
const HADITH = [
  `The Prophet (peace be upon him) said: "The best among you are those who learn the Quran and teach it." - Bukhari`,
  `The Prophet said: "None of you truly believes until he loves for his brother what he loves for himself." - Bukhari & Muslim`,
  `The Prophet said: "Kindness is not found in anything except that it adds beauty to it." - Muslim`,
  `The Prophet said: "The strong is not the one who overcomes people by wrestling, but the strong is the one who controls himself in anger." - Bukhari`,
  `The Prophet said: "Make things easy and do not make them difficult, give glad tidings and do not repel people." - Bukhari`,
  `The Prophet said: "The best of you are the best to their families." - Tirmidhi`,
  `The Prophet said: "Allah is Gentle and loves gentleness in all things." - Bukhari & Muslim`,
  `The Prophet said: "Whoever believes in Allah and the Last Day, let him speak good or remain silent." - Bukhari`,
  `The Prophet said: "Purity is half of faith." - Muslim`,
  `The Prophet said: "The most beloved deeds to Allah are the most consistent, even if small." - Bukhari`,
]
const DUAS = [
  { title: 'Dua for Strength', text: 'Allahumma inni as-aluka sabran wa thabatan. O Allah, I ask You for patience and steadfastness.' },
  { title: 'Dua for Forgiveness', text: 'Astaghfirullah al-azim alladhi la ilaha illa Huwa, al-Hayyul-Qayyum, wa atubu ilayh. I seek forgiveness from Allah, there is no god but Him.' },
  { title: 'Dua Before Eating', text: 'Bismillah wa ala barakatillah. In the name of Allah and upon the blessings of Allah.' },
  { title: 'Dua for Knowledge', text: 'Rabbi zidni ilma. My Lord, increase me in knowledge.' },
  { title: 'Dua for Parents', text: 'Rabbi irhamhuma kama rabbayani saghira. My Lord, have mercy on my parents as they raised me when I was small.' },
  { title: 'Dua for Peace', text: 'Allahumma anta as-salam, wa minka as-salam. O Allah, You are Peace, and from You comes peace.' },
  { title: 'Dua for Rizq', text: 'Allahumma inni as-aluka rizqan tayyiban, wa ilman nafi-an, wa amalan mutaqabbal. O Allah, I ask You for good provision, beneficial knowledge, and accepted deeds.' },
  { title: 'Dua for Travelling', text: 'Subhanalladhi sakhkhara lana hadha. Glory be to Him who has subjected this to us.' },
]
const NAMES99 = ['Ar-Rahman - The Most Merciful','Ar-Rahim - The Most Compassionate','Al-Malik - The King','Al-Quddus - The Most Holy','As-Salam - The Source of Peace','Al-Mu\'min - The Giver of Faith','Al-Aziz - The Almighty','Al-Hakim - The All-Wise','Al-Alim - The All-Knowing','Al-Basir - The All-Seeing','Al-Sami - The All-Hearing','Al-Ghaffar - The Great Forgiver','Ar-Razzaq - The Provider','Al-Fattah - The Opener','Al-Adl - The Just','Al-Latif - The Subtle One','Al-Khabir - The All-Aware','Al-Halim - The Forbearing','Al-Wadud - The Most Loving','As-Sabur - The Patient']

// Prayer times - Lagos, Nigeria - approximate, offline. For exact, use mosque timetable.
// These na standard Lagos times, e go shift small by season, but usable for reminder.
function getPrayerTimes(){
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }))
  // Simple Lagos schedule - update monthly if you want exact
  return [
    { name: 'Fajr', time: '05:30' },
    { name: 'Sunrise', time: '06:45' },
    { name: 'Dhuhr', time: '13:00' },
    { name: 'Asr', time: '16:15' },
    { name: 'Maghrib', time: '18:45' },
    { name: 'Isha', time: '20:00' },
  ]
}
function nextPrayer(){
  const times = getPrayerTimes()
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }))
  const nowMins = now.getHours() * 60 + now.getMinutes()
  for(const p of times){
    const [h,m] = p.time.split(':').map(Number)
    const mins = h*60+m
    if(mins > nowMins) return { ...p, inMins: mins - nowMins }
  }
  // Next na Fajr tomorrow
  return { name: 'Fajr (tomorrow)', time: times[0].time, inMins: (24*60 - nowMins) + 5*60+30 }
}
function getHijriApprox(){
  // Offline approx - no exact Hijri calc, show Gregorian + note
  const d = new Date().toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  return d
}

module.exports = {
  command: ['muslim','quran','quranverse','hadith','dua','prayer','prayertime','salah','salah-time','hijri','allah','names99','asmaulhusna','islamic','ramadan','eid','tasbih','dhikr','bismillah'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(['muslim','islamic'].includes(command)){
        await treply('Muslim', [
          line('quran', '.quran / .quran <topic>'),
          line('hadith', '.hadith'),
          line('dua', '.dua'),
          line('prayer', '.prayer - Lagos times'),
          line('names', '.names99'),
          line('tasbih', '.tasbih'),
          line('info', 'Free, offline, no API')
        ])
        return
      }
      if(['quran','quranverse'].includes(command)){
        if(text){
          const q = text.toLowerCase().trim()
          const filtered = QURAN.filter(v => v.topic === q || v.ref.toLowerCase().includes(q) || v.text.toLowerCase().includes(q))
          if(filtered.length){
            const v = pickNoRepeat(filtered, jid+':quran:'+q)
            await sock.sendMessage(jid, { text: box('QURAN', [line('ref', v.ref), line('verse', v.text), line('topic', v.topic)]) }, { quoted: m })
            try{ await reactCmd(sock, jid, m.key, command) }catch{}
            try{ await reactDone(sock, jid, m.key) }catch{}
            return
          }
          await treply('Quran', [line('error', `No verse for "${text}"`), line('topics', 'gratitude, prayer, hope, trust, strength, forgiveness, guidance, peace, character, parents, patience')])
          return
        }
        const v = pickNoRepeat(QURAN, jid+':quran:all')
        await sock.sendMessage(jid, { text: box('QURAN', [line('ref', v.ref), line('verse', v.text), line('topic', v.topic)]) }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if(command === 'hadith'){
        await treply('Hadith', [pickNoRepeat(HADITH, jid+':hadith')])
        return
      }
      if(command === 'dua'){
        const d = pickNoRepeat(DUAS, jid+':dua')
        await treply(d.title, [d.text])
        return
      }
      if(['prayer','prayertime','salah','salah-time'].includes(command)){
        const times = getPrayerTimes()
        const next = nextPrayer()
        const lines = times.map(t => line(t.name, t.time))
        lines.push(line('next', `${next.name} in ${Math.floor(next.inMins/60)}h ${next.inMins%60}m`))
        lines.push(line('city', 'Lagos, Nigeria - approx, confirm with mosque'))
        lines.push(line('date', getHijriApprox()))
        await treply('Prayer Times - Lagos', lines)
        return
      }
      if(command === 'hijri'){
        await treply('Date', [line('gregorian', getHijriApprox()), line('note', 'Hijri calc needs internet for exact date, use mosque calendar for exact Hijri')])
        return
      }
      if(['allah','names99','asmaulhusna'].includes(command)){
        // 5 random names each time, no repeat cycle
        const shuffled = [...NAMES99].sort(() => Math.random() - 0.5).slice(0, 5)
        await treply('Asmaul Husna - 99 Names', shuffled.map((n,i) => line(`name ${i+1}`, n)))
        return
      }
      if(['tasbih','dhikr'].includes(command)){
        const dhikr = ['SubhanAllah - Glory be to Allah (33x)','Alhamdulillah - All praise is for Allah (33x)','Allahu Akbar - Allah is Greatest (33x)','Astaghfirullah - I seek forgiveness from Allah','La ilaha illallah - There is no god but Allah','SubhanAllahi wa bihamdihi - Glory be to Allah and praise be to Him']
        const d = dhikr[randInt(0, dhikr.length - 1)]
        await treply('Tasbih / Dhikr', [d, line('count', '33x / 100x')])
        return
      }
      if(command === 'bismillah'){
        await treply('Bismillah', ['Bismillahir Rahmanir Rahim - In the name of Allah, the Most Gracious, the Most Merciful.'])
        return
      }
      if(command === 'ramadan'){
        await treply('Ramadan', [line('info', 'Ramadan na month of fasting, prayer, and charity.'), line('tip', 'Fast from Fajr to Maghrib, pray Taraweeh, read Quran daily.'), line('dua', 'Allahumma innaka afuwwun tuhibbul afwa fa\'fu anni.')])
        return
      }
      if(command === 'eid'){
        await treply('Eid', [line('info', 'Eid Mubarak! Taqabbalallahu minna wa minkum.'), line('meaning', 'May Allah accept from us and from you.')])
        return
      }
    } catch(e){
      await sock.sendMessage(jid, { text: box('Muslim Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
                                                        }
