// 🧠 SIMON MD - QUIZ - FREE, NO API, OFFLINE - BUTTON + POLL + TIMER
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

// Sessions: jid -> { user, subject, difficulty, total, questions, current, score, timer, pollId, started }
if(!global.quizSessions) global.quizSessions = new Map()
if(!global.quizPollMap) global.quizPollMap = new Map() // pollId -> { jid, qIndex }

const SUBJECTS = [
  { id: 'math', name: 'Math', emoji: '🔢' },
  { id: 'english', name: 'English', emoji: '📝' },
  { id: 'literature', name: 'Literature', emoji: '📚' },
  { id: 'geography', name: 'Geography', emoji: '🌍' },
  { id: 'biology', name: 'Biology', emoji: '🧬' },
  { id: 'chemistry', name: 'Chemistry', emoji: '⚗️' },
  { id: 'physics', name: 'Physics', emoji: '⚡' },
  { id: 'crs', name: 'CRS', emoji: '✝️' },
  { id: 'economics', name: 'Economy', emoji: '💰' },
  { id: 'marketing', name: 'Marketing', emoji: '📈' },
  { id: 'government', name: 'Government', emoji: '🏛️' },
  { id: 'sport', name: 'Sport', emoji: '⚽' },
  { id: 'computer', name: 'Computer', emoji: '💻' },
  { id: 'general', name: 'General Knowledge', emoji: '🧠' },
  { id: 'art', name: 'Art', emoji: '🎨' },
  { id: 'music', name: 'Music', emoji: '🎵' },
]
const DIFFICULTIES = ['easy','medium','hard']
const TIME_PER_Q = 15000 // 15 seconds per question - change to 10000 for 10s

function shuffle(arr){ return [...arr].sort(() => Math.random() - 0.5) }
function pickN(arr, n){ return shuffle(arr).slice(0, Math.min(n, arr.length)) }

// --- QUESTION POOLS (offline, no API) ---
// Format: { q, options: [4], answer: 0-3, explain }
const POOLS = {
  english: [
    { q: 'Choose the correct spelling', options: ['Occurence','Occurrence','Ocurrence','Occurrance'], answer: 1, explain: 'Occurrence has double c + double r.' },
    { q: 'Synonym of "Happy"', options: ['Sad','Joyful','Angry','Tired'], answer: 1, explain: 'Joyful means happy.' },
    { q: 'Antonym of "Brave"', options: ['Bold','Fearless','Cowardly','Strong'], answer: 2, explain: 'Cowardly is opposite of brave.' },
    { q: 'She ___ to school every day.', options: ['go','goes','gone','going'], answer: 1, explain: 'She goes - singular + s.' },
    { q: 'Plural of "Child"', options: ['Childs','Childes','Children','Childrens'], answer: 2, explain: 'Children is irregular plural.' },
    { q: 'Which is a verb?', options: ['Quickly','Run','Beautiful','Table'], answer: 1, explain: 'Run is action word.' },
    { q: 'Past tense of "Eat"', options: ['Eated','Ate','Eatened','Eating'], answer: 1, explain: 'Ate is past tense.' },
    { q: 'Choose correct: "___ book is this?"', options: ['Who','Whose','Whom','Which'], answer: 1, explain: 'Whose shows possession.' },
    { q: 'Synonym of "Begin"', options: ['End','Start','Stop','Close'], answer: 1, explain: 'Start = begin.' },
    { q: 'Antonym of "Rich"', options: ['Wealthy','Poor','Money','Gold'], answer: 1, explain: 'Poor is opposite of rich.' },
  ],
  geography: [
    { q: 'Capital of Nigeria?', options: ['Lagos','Abuja','Kano','Port Harcourt'], answer: 1, explain: 'Abuja is capital since 1991.' },
    { q: 'Largest desert in the world?', options: ['Sahara','Gobi','Kalahari','Arabian'], answer: 0, explain: 'Sahara is largest hot desert.' },
    { q: 'River Niger flows into?', options: ['Atlantic Ocean','Pacific Ocean','Red Sea','Mediterranean'], answer: 0, explain: 'River Niger enters Atlantic via Delta.' },
    { q: 'Which country is in Africa?', options: ['Brazil','Kenya','India','Canada'], answer: 1, explain: 'Kenya is East Africa.' },
    { q: 'Longest river in the world?', options: ['Amazon','Nile','Niger','Yangtze'], answer: 1, explain: 'Nile ~6,650 km.' },
    { q: 'Capital of Ghana?', options: ['Accra','Lagos','Abidjan','Dakar'], answer: 0, explain: 'Accra is capital of Ghana.' },
    { q: 'Which is a continent?', options: ['Europe','Greenland','Madagascar','Borneo'], answer: 0, explain: 'Europe is continent.' },
    { q: 'Mount Everest is in?', options: ['Himalayas','Alps','Andes','Rockies'], answer: 0, explain: 'Everest is in Himalayas.' },
  ],
  biology: [
    { q: 'Powerhouse of the cell?', options: ['Nucleus','Mitochondria','Ribosome','Vacuole'], answer: 1, explain: 'Mitochondria produces energy.' },
    { q: 'Photosynthesis happens in?', options: ['Root','Leaf','Stem','Flower'], answer: 1, explain: 'Leaf has chlorophyll.' },
    { q: 'Human has how many bones (adult)?', options: ['206','196','226','186'], answer: 0, explain: 'Adult has 206 bones.' },
    { q: 'Blood is pumped by?', options: ['Liver','Heart','Lung','Kidney'], answer: 1, explain: 'Heart pumps blood.' },
    { q: 'DNA stands for?', options: ['Deoxyribonucleic Acid','Diribonucleic Acid','Deoxyribose Nucleic Atom','None'], answer: 0, explain: 'Deoxyribonucleic Acid.' },
    { q: 'Which is a mammal?', options: ['Shark','Dolphin','Penguin','Lizard'], answer: 1, explain: 'Dolphin is mammal.' },
  ],
  chemistry: [
    { q: 'Chemical symbol for Gold?', options: ['Ag','Au','Gd','Go'], answer: 1, explain: 'Au from Aurum.' },
    { q: 'H2O is?', options: ['Salt','Water','Acid','Oxygen'], answer: 1, explain: 'H2O = Water.' },
    { q: 'pH of neutral solution?', options: ['0','7','14','1'], answer: 1, explain: 'pH 7 = neutral.' },
    { q: 'Symbol for Sodium?', options: ['So','Na','Sd','N'], answer: 1, explain: 'Na from Natrium.' },
    { q: 'Gas used for breathing?', options: ['CO2','Oxygen','Nitrogen','Helium'], answer: 1, explain: 'Oxygen for respiration.' },
  ],
  physics: [
    { q: 'Unit of force?', options: ['Joule','Newton','Watt','Volt'], answer: 1, explain: 'Force = Newton.' },
    { q: 'Speed of light?', options: ['300,000 km/s','150,000 km/s','3,000 km/s','30,000 km/s'], answer: 0, explain: 'Approx 300,000 km/s.' },
    { q: 'Gravity was discovered by?', options: ['Einstein','Newton','Galileo','Tesla'], answer: 1, explain: 'Newton - apple story.' },
    { q: 'Unit of power?', options: ['Watt','Volt','Ohm','Ampere'], answer: 0, explain: 'Power = Watt.' },
  ],
  crs: [
    { q: 'First book of the Bible?', options: ['Exodus','Genesis','Psalms','Matthew'], answer: 1, explain: 'Genesis = beginning.' },
    { q: 'Jesus was born in?', options: ['Nazareth','Bethlehem','Jerusalem','Egypt'], answer: 1, explain: 'Bethlehem.' },
    { q: 'How many disciples did Jesus have?', options: ['10','12','7','11'], answer: 1, explain: '12 disciples.' },
    { q: 'Who built the Ark?', options: ['Moses','Noah','Abraham','David'], answer: 1, explain: 'Noah built Ark.' },
  ],
  economics: [
    { q: 'Demand increases when price?', options: ['Increases','Decreases','Stays same','Doubles'], answer: 1, explain: 'Lower price = higher demand.' },
    { q: 'Currency of Nigeria?', options: ['Cedi','Naira','Rand','Shilling'], answer: 1, explain: 'Naira (₦).' },
    { q: 'What is inflation?', options: ['Price fall','Price rise','No change','Money increase'], answer: 1, explain: 'Inflation = general price rise.' },
  ],
  government: [
    { q: 'Nigeria became independent in?', options: ['1960','1963','1970','1957'], answer: 0, explain: '1 Oct 1960.' },
    { q: 'Democracy means rule by?', options: ['One person','Rich','People','Army'], answer: 2, explain: 'Demos = people.' },
    { q: 'How many arms of government?', options: ['2','3','4','5'], answer: 1, explain: 'Executive, Legislature, Judiciary.' },
  ],
  sport: [
    { q: 'How many players in football team on field?', options: ['10','11','9','12'], answer: 1, explain: '11 players.' },
    { q: 'World Cup 2022 winner?', options: ['France','Brazil','Argentina','Croatia'], answer: 2, explain: 'Argentina beat France.' },
    { q: 'How many minutes in football match?', options: ['80','90','100','60'], answer: 1, explain: '90 mins + extra.' },
    { q: 'Which country won AFCON 2023?', options: ['Nigeria','Ivory Coast','Senegal','Ghana'], answer: 1, explain: 'Ivory Coast (host).' },
  ],
  computer: [
    { q: 'CPU stands for?', options: ['Central Processing Unit','Computer Personal Unit','Central Program Unit','None'], answer: 0, explain: 'Central Processing Unit.' },
    { q: 'Which is input device?', options: ['Monitor','Keyboard','Printer','Speaker'], answer: 1, explain: 'Keyboard = input.' },
    { q: '1 GB = ?', options: ['1000 MB','1024 MB','100 MB','1024 KB'], answer: 1, explain: '1024 MB.' },
    { q: 'WWW stands for?', options: ['World Wide Web','World Web Wide','Wide World Web','None'], answer: 0, explain: 'World Wide Web.' },
  ],
  general: [
    { q: 'Capital of France?', options: ['London','Paris','Rome','Berlin'], answer: 1, explain: 'Paris.' },
    { q: 'How many days in leap year?', options: ['365','366','364','367'], answer: 1, explain: '366 days.' },
    { q: 'Largest ocean?', options: ['Atlantic','Indian','Pacific','Arctic'], answer: 2, explain: 'Pacific is largest.' },
    { q: 'Who wrote Romeo and Juliet?', options: ['Charles Dickens','William Shakespeare','Chinua Achebe','Wole Soyinka'], answer: 1, explain: 'Shakespeare.' },
  ],
  literature: [
    { q: 'Author of Things Fall Apart?', options: ['Wole Soyinka','Chinua Achebe','Chimamanda','Ngugi'], answer: 1, explain: 'Chinua Achebe (1958).' },
    { q: 'Simile uses?', options: ['like / as','is','metaphor','personification'], answer: 0, explain: 'Simile uses like/as.' },
    { q: 'First African Nobel in Literature?', options: ['Wole Soyinka','Chinua Achebe','Nadine Gordimer','Ben Okri'], answer: 0, explain: 'Wole Soyinka 1986.' },
  ],
  marketing: [
    { q: '4 Ps of Marketing?', options: ['Product, Price, Place, Promotion','People, Price, Place, Product','Product, Profit, Place, Promotion','None'], answer: 0, explain: '4 Ps = Product, Price, Place, Promotion.' },
    { q: 'Target market means?', options: ['Everyone','Specific group to sell to','Competitors','Staff'], answer: 1, explain: 'Specific group.' },
  ],
  art: [
    { q: 'Who painted Mona Lisa?', options: ['Van Gogh','Da Vinci','Picasso','Rembrandt'], answer: 1, explain: 'Leonardo Da Vinci.' },
    { q: 'Primary colours?', options: ['Red, Blue, Yellow','Red, Green, Blue','Black, White, Red','None'], answer: 0, explain: 'Red, Blue, Yellow.' },
  ],
  music: [
    { q: 'Who sang "Calm Down"?', options: ['Burna Boy','Rema','Wizkid','Davido'], answer: 1, explain: 'Rema - Calm Down (2022).' },
    { q: 'How many notes in major scale?', options: ['5','7','8','12'], answer: 2, explain: '8 notes (including octave).' },
    { q: 'Afrobeats originated in?', options: ['Ghana','Nigeria','South Africa','Kenya'], answer: 1, explain: 'Nigeria - Fela Kuti pioneered Afrobeat.' },
    { q: 'Who is known as African Giant?', options: ['Wizkid','Davido','Burna Boy','Rema'], answer: 2, explain: 'Burna Boy - African Giant album.' },
    { q: 'Instrument with 88 keys?', options: ['Guitar','Piano','Violin','Drum'], answer: 1, explain: 'Piano has 88 keys.' },
  ],
}
function genMath(difficulty, count){
  const qs = []
  for(let i=0;i<count;i++){
    let a,b,ans,qText
    if(difficulty === 'easy'){ a = Math.floor(Math.random()*20)+1; b = Math.floor(Math.random()*20)+1; const op = ['+','-','x'][Math.floor(Math.random()*3)]; if(op==='+'){ ans=a+b; qText=`${a} + ${b} = ?` } else if(op==='-'){ ans=a-b; qText=`${a} - ${b} = ?` } else { a=Math.floor(Math.random()*9)+1; b=Math.floor(Math.random()*9)+1; ans=a*b; qText=`${a} x ${b} = ?` } }
    else if(difficulty === 'medium'){ a = Math.floor(Math.random()*50)+10; b = Math.floor(Math.random()*20)+2; const op = ['+','-','x','/'][Math.floor(Math.random()*4)]; if(op==='+'){ ans=a+b; qText=`${a} + ${b} = ?` } else if(op==='-'){ ans=a-b; qText=`${a} - ${b} = ?` } else if(op==='x'){ a=Math.floor(Math.random()*15)+2; b=Math.floor(Math.random()*15)+2; ans=a*b; qText=`${a} x ${b} = ?` } else { ans = Math.floor(Math.random()*12)+2; b = Math.floor(Math.random()*9)+2; a = ans*b; qText=`${a} / ${b} = ?` } }
    else { a = Math.floor(Math.random()*100)+20; b = Math.floor(Math.random()*50)+5; const op = ['x','/','%','^'][Math.floor(Math.random()*4)]; if(op==='x'){ a=Math.floor(Math.random()*20)+5; b=Math.floor(Math.random()*20)+5; ans=a*b; qText=`${a} x ${b} = ?` } else if(op==='/'){ ans=Math.floor(Math.random()*20)+2; b=Math.floor(Math.random()*12)+2; a=ans*b; qText=`${a} / ${b} = ?` } else if(op==='%'){ ans=a%b; qText=`${a} % ${b} = ?` } else { a=Math.floor(Math.random()*5)+2; b=2; ans=a*a; qText=`${a}^2 = ?` } }
    const opts = new Set([ans])
    while(opts.size < 4){ opts.add(ans + Math.floor(Math.random()*11)-5) }
    const options = shuffle([...opts]).map(String)
    qs.push({ q: qText, options, answer: options.indexOf(String(ans)), explain: `Answer is ${ans}.` })
  }
  return qs
}
function buildQuestions(subject, difficulty, total){
  if(subject === 'math') return genMath(difficulty, total)
  const pool = POOLS[subject] || POOLS.general
  // If pool small, repeat with shuffle + generate variations - no repeat same question twice if possible, else cycle
  let qs = []
  while(qs.length < total){
    const chunk = pickN(pool, Math.min(total - qs.length, pool.length))
    // Shuffle options per question so answer position random
    for(const c of chunk){
      const opts = shuffle(c.options)
      qs.push({ q: c.q, options: opts, answer: opts.indexOf(c.options[c.answer]), explain: c.explain })
      if(qs.length >= total) break
    }
    if(pool.length === 0) break
    if(qs.length < total && chunk.length === 0) break
  }
  return shuffle(qs).slice(0, total)
}

async function sendSubjectMenu(sock, jid, m, total){
  // WhatsApp Buttons - Baileys buttons format
  // Use list for many subjects (buttons max 3) - so use list + text fallback
  const text = `✨ 𝗤𝘂𝗶𝘇 𝗠𝗼𝗱𝗲\n━━━━━━━━━━━━━━━━━━\n🧠 𝗖𝗛𝗢𝗢𝗦𝗘 𝗔 𝗦𝗨𝗕𝗝𝗘𝗖𝗧\n\n┊◆ Questions: ${total}\n┊◆ Timer: ${TIME_PER_Q/1000} seconds each\n┊◆ Options: A · B · C · D\n\nTap a subject below to begin.\n━━━━━━━━━━━━━━━━━━`
  // Try list message
  try{
    await sock.sendMessage(jid, {
      text,
      footer: 'SIMON MD Quiz',
      title: 'Choose Subject',
      buttonText: '🚀 Choose Subject',
      sections: [{
        title: 'Subjects',
        rows: SUBJECTS.map(s => ({ title: `${s.emoji} ${s.name}`, rowId: `quiz_subject_${s.id}`, description: `${total} questions` }))
      }]
    }, { quoted: m })
    return
  }catch(e){
    // Fallback: text + numbers - user reply number
    const list = SUBJECTS.map((s,i) => `${i+1}. ${s.emoji} ${s.name}`).join('\n')
    await sock.sendMessage(jid, { text: text + '\n\n' + list + '\n\nReply with number, e.g. 1 for Math, or tap list above.' }, { quoted: m })
  }
}
async function sendDifficultyMenu(sock, jid, m, subjectId, total){
  const subj = SUBJECTS.find(s => s.id === subjectId)
  const text = `✨ 𝗤𝘂𝗶𝘇 𝗠𝗼𝗱𝗲\n━━━━━━━━━━━━━━━━━━\n📚 Subject: ${subj.emoji} ${subj.name}\n🔢 Questions: ${total}\n\n🎚 𝗖𝗛𝗢𝗢𝗦𝗘 𝗗𝗜𝗙𝗙𝗜𝗖𝗨𝗟𝗧𝗬\n━━━━━━━━━━━━━━━━━━`
  try{
    await sock.sendMessage(jid, {
      text, footer: 'SIMON MD Quiz', title: 'Choose Difficulty', buttonText: '🚀 Choose Difficulty',
      sections: [{
        title: 'Difficulty',
        rows: [
          { title: '🟢 Easy', rowId: `quiz_diff_easy_${subjectId}`, description: 'Simple questions' },
          { title: '🟡 Medium', rowId: `quiz_diff_medium_${subjectId}`, description: 'Average questions' },
          { title: '🔴 Hard', rowId: `quiz_diff_hard_${subjectId}`, description: 'Tough questions' },
        ]
      }]
    }, { quoted: m })
  }catch{
    await sock.sendMessage(jid, { text: text + '\n\nReply: easy / medium / hard' }, { quoted: m })
  }
}
async function sendQuestion(sock, jid, session){
  const idx = session.current
  const q = session.questions[idx]
  const subj = SUBJECTS.find(s => s.id === session.subject)
  // Clear old timer
  if(session.timer) clearTimeout(session.timer)

  const qText = `🧠 𝗤𝘂𝗶𝘇 - ${subj.emoji} ${subj.name} (${session.difficulty})\n━━━━━━━━━━━━━━━━━━\n❓ Q${idx+1}/${session.total}: ${q.q}\n⏱️ Timer: ${TIME_PER_Q/1000}s - answer fast!\n━━━━━━━━━━━━━━━━━━\nVote in poll below 👇`
  const options = q.options.map((opt,i) => `${['A','B','C','D'][i]}. ${opt}`)
  // Poll - Baileys pollCreationMessage
  try{
    const sent = await sock.sendMessage(jid, { poll: { name: qText, values: options, selectableCount: 1 } })
    const pollId = sent.key.id
    global.quizPollMap.set(pollId, { jid, qIndex: idx, user: session.user })
    session.pollId = pollId
    // Timer - auto next if no answer
    session.timer = setTimeout(async () => {
      // Check if still same question (not answered)
      const cur = global.quizSessions.get(jid)
      if(!cur || cur.current !== idx) return
      await sock.sendMessage(jid, { text: `⏰ Time up! Correct answer: ${['A','B','C','D'][q.answer]}. ${q.options[q.answer]}\n💡 ${q.explain}` }).catch(()=>{})
      cur.current++
      if(cur.current >= cur.total) return finishQuiz(sock, jid, cur)
      await sendQuestion(sock, jid, cur)
    }, TIME_PER_Q)
  }catch(e){
    // Fallback: text + A/B/C/D reply
    await sock.sendMessage(jid, { text: qText + '\n\n' + options.join('\n') + '\n\nReply A / B / C / D' })
    session.timer = setTimeout(async () => {
      const cur = global.quizSessions.get(jid)
      if(!cur || cur.current !== idx) return
      await sock.sendMessage(jid, { text: `⏰ Time up! Correct: ${['A','B','C','D'][q.answer]}. ${q.options[q.answer]}\n💡 ${q.explain}` }).catch(()=>{})
      cur.current++
      if(cur.current >= cur.total) return finishQuiz(sock, jid, cur)
      await sendQuestion(sock, jid, cur)
    }, TIME_PER_Q)
  }
}
async function finishQuiz(sock, jid, session){
  if(session.timer) clearTimeout(session.timer)
  global.quizSessions.delete(jid)
  if(session.pollId) global.quizPollMap.delete(session.pollId)
  const pct = Math.round((session.score / session.total) * 100)
  const rank = pct >= 90 ? '🏆 Genius!' : pct >= 70 ? '🥇 Excellent!' : pct >= 50 ? '🥈 Good!' : pct >= 30 ? '🥉 Keep Trying!' : '📚 Study More!'
  const subj = SUBJECTS.find(s => s.id === session.subject)
  await sock.sendMessage(jid, { text: `✨ 𝗤𝘂𝗶𝘇 𝗙𝗶𝗻𝗶𝘀𝗵𝗲𝗱!\n━━━━━━━━━━━━━━━━━━\n📚 Subject: ${subj.emoji} ${subj.name}\n🎚 Difficulty: ${session.difficulty}\n✅ Score: ${session.score}/${session.total}\n📊 Percent: ${pct}%\n🏅 Rank: ${rank}\n\nPlay again: .quiz ${session.total}` }).catch(()=>{})
}

module.exports = {
  command: ['quiz','quizstart'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    try {
      // If user dey in middle of quiz and reply with number / easy etc (fallback)
      const sess = global.quizSessions.get(jid)
      if(sess && !sess.subject && text){
        const num = parseInt(text)
        if(num >= 1 && num <= SUBJECTS.length){
          const subj = SUBJECTS[num-1]
          sess.subject = subj.id
          await sendDifficultyMenu(sock, jid, m, subj.id, sess.total)
          return
        }
      }
      if(sess && sess.subject && !sess.started && text){
        const d = text.toLowerCase().trim()
        if(DIFFICULTIES.includes(d)){
          sess.difficulty = d
          sess.started = true
          await sock.sendMessage(jid, { text: `⏳ Building your ${d} ${SUBJECTS.find(s=>s.id===sess.subject).emoji} ${SUBJECTS.find(s=>s.id===sess.subject).name} quiz…` })
          sess.questions = buildQuestions(sess.subject, d, sess.total)
          sess.current = 0; sess.score = 0
          await sendQuestion(sock, jid, sess)
          return
        }
      }
      // If user reply A/B/C/D in fallback mode (no poll)
      if(sess && sess.started && text && /^[a-dA-D]$/.test(text.trim())){
        // Handled via handleResponse too, but fallback here
        const handled = await module.exports.handleResponse(sock, m, text.trim().toUpperCase())
        if(handled) return
      }

      if(command === 'quiz' && !text){
        await sock.sendMessage(jid, { text: box('Quiz', [line('usage', '.quiz 10 - 10 questions'), line('usage2', '.quiz 20 - 20 questions'), line('max', 'Max 100')]) }, { quoted: m })
        return
      }
      let total = parseInt(text) || 10
      if(total < 1) total = 10
      if(total > 100) total = 100
      // Start new session - cancel old
      const old = global.quizSessions.get(jid)
      if(old && old.timer) clearTimeout(old.timer)
      global.quizSessions.set(jid, { user: sender, subject: null, difficulty: null, total, questions: [], current: 0, score: 0, started: false, timer: null, pollId: null })
      await sendSubjectMenu(sock, jid, m, total)
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    } catch(e){
      await sock.sendMessage(jid, { text: box('Quiz Error', [line('error', e.message)]) }, { quoted: m })
    }
  },
  // Call this from main handler for button / list / poll votes / text answers
  handleResponse: async (sock, m, directAnswer=null) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    try{
      // 1) List / Button response - subject / difficulty
      let selectedId = null
      if(m.message?.listResponseMessage) selectedId = m.message.listResponseMessage.singleSelectReply?.selectedRowId
      if(m.message?.buttonsResponseMessage) selectedId = m.message.buttonsResponseMessage.selectedButtonId
      if(m.message?.interactiveResponseMessage) selectedId = m.message.interactiveResponseMessage.body?.text || m.message.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson
      if(m.message?.templateButtonReplyMessage) selectedId = m.message.templateButtonReplyMessage.selectedId

      if(selectedId && selectedId.startsWith('quiz_subject_')){
        const subjectId = selectedId.replace('quiz_subject_','')
        const sess = global.quizSessions.get(jid)
        if(!sess) return false
        sess.subject = subjectId
        await sendDifficultyMenu(sock, jid, m, subjectId, sess.total)
        return true
      }
      if(selectedId && selectedId.startsWith('quiz_diff_')){
        // quiz_diff_easy_math
        const parts = selectedId.replace('quiz_diff_','').split('_')
        const diff = parts[0]; const subjectId = parts.slice(1).join('_')
        const sess = global.quizSessions.get(jid)
        if(!sess) return false
        sess.subject = subjectId; sess.difficulty = diff; sess.started = true
        const subj = SUBJECTS.find(s => s.id === subjectId)
        await sock.sendMessage(jid, { text: `⏳ Building your ${diff} ${subj.emoji} ${subj.name} quiz…` })
        sess.questions = buildQuestions(subjectId, diff, sess.total)
        sess.current = 0; sess.score = 0
        await sendQuestion(sock, jid, sess)
        return true
      }

      // 2) Poll vote - Baileys pollUpdateMessage
      if(m.message?.pollUpdateMessage){
        const pollUpdate = m.message.pollUpdateMessage
        const pollId = pollUpdate.pollCreationMessageKey?.id
        const info = global.quizPollMap.get(pollId)
        if(!info) return false
        const sess = global.quizSessions.get(info.jid)
        if(!sess || sess.current !== info.qIndex) return false
        // Get selected option - pollUpdate has vote
        const vote = pollUpdate.vote
        let selectedOpt = null
        if(vote?.selectedOptions?.length) selectedOpt = vote.selectedOptions[0]
        else if(vote?.encValue) { /* encrypted, fallback - use pollUpdateMessage pollUpdates */ }
        // Baileys sometimes sends pollUpdates array
        if(!selectedOpt && pollUpdate.pollUpdates){
          for(const u of pollUpdate.pollUpdates){ if(u.vote?.selectedOptions?.length) selectedOpt = u.vote.selectedOptions[0] }
        }
        if(selectedOpt === null || selectedOpt === undefined) return false
        // selectedOpt is index (0-3) or string
        let idx = -1
        if(typeof selectedOpt === 'number') idx = selectedOpt
        else {
          const q = sess.questions[sess.current]
          idx = q.options.findIndex(o => selectedOpt.includes(o))
          if(idx === -1){ const m2 = selectedOpt.match(/^([A-D])\./); if(m2) idx = ['A','B','C','D'].indexOf(m2[1]) }
        }
        if(idx === -1) return false
        // Only first voter (the quiz user) counts - check sender
        if(sender !== sess.user && m.key.participant !== sess.user) return true // ignore others, but mark handled
        return await answerQuestion(sock, info.jid, sess, idx)
      }

      // 3) Text answer A/B/C/D fallback
      if(directAnswer){
        const sess = global.quizSessions.get(jid)
        if(!sess || !sess.started) return false
        const idx = ['A','B','C','D'].indexOf(directAnswer)
        if(idx === -1) return false
        return await answerQuestion(sock, jid, sess, idx)
      }
      const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
      if(txt && /^[a-dA-D]$/.test(txt.trim())){
        const sess = global.quizSessions.get(jid)
        if(!sess || !sess.started) return false
        const idx = ['A','B','C','D'].indexOf(txt.trim().toUpperCase())
        return await answerQuestion(sock, jid, sess, idx)
      }
      return false
    }catch(e){ return false }
  }
}

async function answerQuestion(sock, jid, sess, chosenIdx){
  if(sess.timer) clearTimeout(sess.timer)
  const q = sess.questions[sess.current]
  const correct = chosenIdx === q.answer
  if(correct) sess.score++
  const msg = correct
    ? `✅ Correct! ${['A','B','C','D'][q.answer]}. ${q.options[q.answer]}\n💡 ${q.explain}`
    : `❌ Wrong! You chose ${['A','B','C','D'][chosenIdx]}. ${q.options[chosenIdx]}\n✅ Correct: ${['A','B','C','D'][q.answer]}. ${q.options[q.answer]}\n💡 ${q.explain}`
  await sock.sendMessage(jid, { text: msg }).catch(()=>{})
  sess.current++
  if(sess.current >= sess.total) return finishQuiz(sock, jid, sess)
  await sendQuestion(sock, jid, sess)
  return true
}
