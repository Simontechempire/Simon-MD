// 😂 SIMON MD - FUN - ULTRA RANDOM - NO API, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

// --- ULTRA RANDOM ENGINE ---
if(!global.funUsed) global.funUsed = new Map() // key -> Set of used indexes
function pickRandom(arr, key){
  if(!global.funUsed.has(key)) global.funUsed.set(key, new Set())
  const used = global.funUsed.get(key)
  if(used.size >= arr.length) used.clear() // reset when all don used - no repeat until cycle done
  let idx
  do { idx = Math.floor(Math.random() * arr.length) } while (used.has(idx))
  used.add(idx)
  return arr[idx]
}
function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }
function randEmoji(){ return pickRandom(['😂','💀','🔥','😭','🤣','😈','👀','⚡','🎲','🍕','👑','💥','🤡','🐐','🦁','🦅','🚀','💯','😹','🙈'], 'emoji') }
function randTitle(base){ return `${pickRandom(['😂','💀','🔥','🎲','⚡','👑','🤡','🚀'], 'title-emoji')} ${base} ${pickRandom(['😂','💀','🔥','🎲','⚡','👑','🤡','🚀'], 'title-emoji2')}` }

// --- BIG POOLS - 40+ each, no repeat ---
const JOKES = [
  `Why WhatsApp bot no dey sleep? Because e dey wait for your .fun message.`,`My battery low, but my vibes full.`,`Why programmer no like sun? E prefer dark mode.`,`If SIMON MD be human, e for don collect chieftaincy title.`,`What do you call a bot wey no get API? Free AI — like me.`,`Why did the phone go to therapy? Too many unread messages.`,`Naija NEPA take light, my joke still dey shine.`,`Why group admin no dey smile? Dem dey watch antilink.`,`I tell my phone make e rest, e say e get 100 notifications.`,`Why did the sticker cross the road? To become .s for other side.`,
  `Me and sleep na enemies, na why I dey online 2am.`,`My data finish, but my mouth no finish.`,`Why did the chicken cross the road? To dodge group admin wey wan kick am.`,`My brain na like browser — 99 tabs open, 1 dey play music.`,`If laziness be job, I for don be CEO.`,`Why did the math book look sad? E get too many problems.`,`My ex na like WiFi — e dey connect to everybody.`,`I no be photographer, but I fit picture us together.`,`Why did the tomato turn red? E see salad dressing.`,`My pocket dey empty, but my dreams dey full.`,
  `Why did the scarecrow win award? E outstanding for field.`,`I no dey late, time dey fast.`,`Why did the coffee file police report? E get mugged.`,`My bed na my best friend, e no dey judge me.`,`Why did the bike fall? E two-tired.`,`If money dey talk, my own dey whisper.`,`Why did the ghost go to party? E wan boo-gie.`,`My phone dey hot, like my gist.`,`Why did the banana go to doctor? E no dey peeling well.`,`I be like MTN — everywhere you go, I dey there, but network dey fail.`,
  `Why did the fisherman no catch fish? E no get net-work.`,`My landlord dey call, my phone dey silent mode.`,`Why did the lion eat the clown? E wan taste funny.`,`I no be lazy, I dey energy saving mode.`,`Why did the student eat homework? Teacher say e be piece of cake.`,`My crush reply "k" — I don die 10 times.`,`Why did the computer go to doctor? E get virus.`,`I go gym once, my muscle don dey brag.`,`Why did the clock go to therapy? E too much time on hand.`,`My mama say I be special, my teacher say I be case.`
]
const TRUTHS = [
  `Truth: Wetin be last thing you search for phone?`,`Truth: Who be last person you think about before sleep?`,`Truth: Have you ever chop person food without telling them?`,`Truth: Wetin be your biggest fear?`,`Truth: Have you ever pretend network fail to avoid reply?`,`Truth: Who be your crush for this group? No lie.`,`Truth: Most embarrassing thing wey don happen to you for school?`,`Truth: Have you ever stalk person profile for 1 hour?`,
  `Truth: Wetin be lie wey you tell your parents and dem believe?`,`Truth: Have you ever cry because of movie? Which movie?`,`Truth: Who be person wey you don block and unblock 5 times?`,`Truth: Wetin be your secret talent?`,`Truth: Have you ever send message to wrong person? Wetin e be?`,`Truth: If you get 1 million naira now, wetin you go do first?`,`Truth: Have you ever pretend say you dey sick to skip school/work?`,`Truth: Wetin be your most used emoji?`,
  `Truth: Have you ever eat food wey fall for ground? 5 sec rule?`,`Truth: Who be your favourite person for this group and why?`,`Truth: Have you ever cheat for exam? How?`,`Truth: Wetin be your guilty pleasure song?`,`Truth: Have you ever dream about person for this group?`,`Truth: Wetin be the last lie you tell today?`,`Truth: If you fit swap life with anybody for 1 day, who?`,`Truth: Have you ever laugh for serious moment?`
]
const DARES = [
  `Dare: Send voice note sing your favourite song for group.`,`Dare: Change DP to SIMON MD logo for 1 hour.`,`Dare: Type "I love SIMON MD" for group.`,`Dare: Send last emoji for your keyboard.`,`Dare: Call your best friend and tell them you miss them.`,`Dare: Do 10 push-ups and send video proof.`,`Dare: Text your crush "hi" now. No fear.`,`Dare: Send screenshot of your battery % now.`,
  `Dare: Speak only Pidgin for next 10 mins for group.`,`Dare: Send your last 3 screenshots (clean ones o).`,`Dare: Imitate your favourite teacher / pastor for voice note.`,`Dare: Send "I dey hungry, who go send me food?" for status.`,`Dare: Dance for 10 secs and send video.`,`Dare: Call your mama and tell her you love her.`,`Dare: Type with your eyes closed: "SIMON MD na the best bot".`,`Dare: Send a selfie with funny face.`,
  `Dare: Tell group your biggest secret (small one).`,`Dare: Send voice note with your best accent — British, American, or Indian.`,`Dare: Post "I just chop 5 plates of rice" for status.`,`Dare: Do 20 squats now.`,`Dare: Send your favourite meme.`,`Dare: Tell your crush you dream about them (dare o).`,`Dare: Speak like a baby for next 3 messages.`,`Dare: Send your lockscreen wallpaper.`
]
const ROASTS = [
  `Your network be like NEPA — e dey come when e like.`,`Your phone gallery full, but your sense of humour empty.`,`You dey type like person wey dey fight keyboard.`,`Your last seen na 2020, but you dey online dey watch status.`,`You be like free trial — everybody don test you, nobody wan pay.`,
  `Your brain na like free data — e dey finish quick.`,`You dey shine like MTN network for village — e no dey.`,`Your jokes dey dry like harmattan lip.`,`You be like WhatsApp status — everybody dey view you, nobody dey reply.`,`Your sense of fashion na like 2010.`,
  `You dey talk like person wey swallow radio.`,`Your face na like low battery — e need charging.`,`You be like group wey nobody dey talk — dead.`,`Your confidence high, your result low.`,`You dey form big boy, but your pocket dey cry.`,
  `Your DP fine pass you, na filter dey carry you.`,`You be like 2G network — slow but you dey try.`,`Your crush don leave you on read since 2021.`,`You dey like expired bread — nobody wan chop.`,`Your voice note long pass Nollywood film.`
]
const FACTS = [
  `Fact: Honey no dey spoil. Dem don find honey wey be 3000 years old, still good.`,`Fact: Your brain dey use about 20% of your body energy.`,`Fact: Octopus get 3 hearts.`,`Fact: Lagos na one of the biggest cities for Africa.`,`Fact: WhatsApp na the most used messaging app for Naija.`,`Fact: Bananas na berries, but strawberries no be berries.`,
  `Fact: You fit no sneeze with your eyes open — try am, I dare you.`,`Fact: Sharks don exist before trees.`,`Fact: Your tongue print na unique, like fingerprint.`,`Fact: Hot water fit freeze faster than cold water — Mpemba effect.`,`Fact: Cows get best friends, dem dey stress when dem separate.`,`Fact: The first computer bug na real moth for 1947.`,
  `Fact: Dolphins get names for each other.`,`Fact: You dey share 60% DNA with banana.`,`Fact: The moon dey move away from Earth 3.8cm every year.`,`Fact: There are more possible chess games than atoms for universe.`,`Fact: Your nose fit remember 1 trillion smells.`,`Fact: Wombats poop na cube shape.`,`Fact: A day for Venus long pass year for Venus.`,`Fact: Penguins dey propose with pebble.`
]
const EIGHTBALL = [`Yes, definitely.`,`No, no try am.`,`Maybe, wait small.`,`Ask again later.`,`100% yes.`,`My spirit say no.`,`E go happen, just patient.`,`No, e no go work.`,`Yes, but no tell anybody.`,`Signs point to yes.`,`Abeg, focus on something else.`,`If you believe, e go happen.`]
const MEMES = [
  `Me: I go sleep early today.\nAlso me by 2am: dey watch SIMON MD status.`,`Nobody:\nGroup admin when person send link: .antilink on`,`My phone: Battery 1%\nMe: Just one more .ai message.`,`Teacher: Who no do assignment?\nMe: Network fail, ma.`,
  `Me: I no go spend money this week.\nAlso me: *sees shawarma*`,`My brain during exam: *plays music*`,`Mama: Go and sleep.\nMe: *dey press phone under blanket*`,`When NEPA take light during your favourite show: 💀`,
  `Group: *silent for 3 days*\nOne person: "Hi"\nEverybody: *online*`,`Me when crush reply "k": *dey overthink for 3 hours*`,`My data: 10MB left\nMe: *dey watch TikTok*`,`When you send "Good morning" by 2pm: 😭`
]
const SLAP_LINES = [`slap — Ouch! E pain me for here.`,`slap with pillow — soft slap, but e count.`,`slap with fish — smelly slap!`,`slap like Nollywood — *PAH*`,`slap with broom — village slap.`]
const HUG_LINES = [`hug — Aww, sweet.`,`hug tight — no let go.`,`hug like mama — warm.`,`hug with tears — emotional.`]
const KISS_LINES = [`kiss — Wahala!`,`kiss for cheek — innocent.`,`kiss for forehead — caring.`,`kiss like movie — *wahala don start*`]

function getMention(m){ return m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || null }

module.exports = {
  command: ['fun','joke','jokes','meme','truth','dare','truthordare','tod','roast','insult','fact','facts','8ball','magic8ball','coinflip','flip','dice','roll','pick','choose','ship','love','compatibility','slap','hug','kiss','pat','rate','howgay','howcool','simp','random','spin','fortune'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const chatKey = jid // per-chat no-repeat
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines, mentions=[]) => {
      // Random title emoji every time
      await sock.sendMessage(jid, { text: box(randTitle(title), lines), mentions }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(['joke','jokes','fun'].includes(command)){ await treply('Joke', [pickRandom(JOKES, chatKey+':joke')]); return }
      if(command === 'meme'){ await treply('Meme', [pickRandom(MEMES, chatKey+':meme')]); return }
      if(command === 'truth'){ await treply('Truth', [pickRandom(TRUTHS, chatKey+':truth')]); return }
      if(command === 'dare'){ await treply('Dare', [pickRandom(DARES, chatKey+':dare')]); return }
      if(['truthordare','tod'].includes(command)){
        const isTruth = Math.random() > 0.5
        // Random: sometimes give both, sometimes one
        if(Math.random() > 0.8){ await treply('Truth or Dare - BOTH', [line('truth', pickRandom(TRUTHS, chatKey+':truth')), line('dare', pickRandom(DARES, chatKey+':dare'))]); return }
        await treply(isTruth ? 'Truth' : 'Dare', [isTruth ? pickRandom(TRUTHS, chatKey+':truth') : pickRandom(DARES, chatKey+':dare')]); return
      }
      if(['roast','insult'].includes(command)){
        const target = getMention(m)
        const name = target ? `@${target.split('@')[0]}` : `@${sender.split('@')[0]}`
        // Random roast + random extra line
        const extra = pickRandom(['No vex, na joke o.', 'E pain you? Sorry o.', 'SIMON MD send me, no be me.', 'Na love I take roast you.'], 'roast-extra')
        await treply('Roast', [line('target', name), pickRandom(ROASTS, chatKey+':roast'), line('note', extra)], target ? [target] : [sender]); return
      }
      if(['fact','facts'].includes(command)){ await treply('Did You Know', [pickRandom(FACTS, chatKey+':fact')]); return }
      if(['8ball','magic8ball'].includes(command)){
        if(!text){ await treply('8Ball', [line('usage', '.8ball will I pass exam?')]); return }
        // Random 8ball + random lucky number
        await treply('8Ball', [line('question', text), line('answer', pickRandom(EIGHTBALL, chatKey+':8ball')), line('lucky', `${randInt(1,99)}`)]); return
      }
      if(['coinflip','flip'].includes(command)){
        const res = Math.random() > 0.5 ? 'Heads' : 'Tails'
        const times = randInt(1,5)
        // Random: sometimes flip multiple times
        if(Math.random() > 0.7){ const flips = Array.from({length: times}, () => Math.random() > 0.5 ? 'H' : 'T').join(' - '); await treply('Coin Flip x'+times, [line('flips', flips)]); return }
        await treply('Coin Flip', [line('result', res)]); return
      }
      if(['dice','roll'].includes(command)){
        const max = parseInt(text) || 6
        const rolls = Array.from({length: randInt(1,3)}, () => randInt(1, max))
        await treply('Dice', [line('rolled', rolls.join(' + ')), line('total', `${rolls.reduce((a,b)=>a+b,0)}`), line('max', `${max}`)]); return
      }
      if(['pick','choose'].includes(command)){
        if(!text || !text.includes(',')){ await treply('Pick', [line('usage', '.pick pizza, shawarma, rice')]); return }
        const opts = shuffle(text.split(',').map(s => s.trim()).filter(Boolean))
        // Random: pick 1, or rank all
        if(Math.random() > 0.5){ await treply('Pick - Ranked', opts.map((o,i) => line(`#${i+1}`, o))); return }
        await treply('Pick', [line('options', opts.join(', ')), line('picked', pickRandom(opts, chatKey+':pick') + ' ' + randEmoji())]); return
      }
      if(['ship','love','compatibility'].includes(command)){
        const target = getMention(m)
        if(!target){ await treply('Ship', [line('usage', '.ship @user')]); return }
        const pct = randInt(0,100)
        const bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10 - Math.floor(pct/10))
        const verdicts = pct > 80 ? ['Perfect match! Go marry.', 'Soulmates! No waste time.', 'Wedding date when?'] : pct > 50 ? ['E get hope, try small.', 'Small small, e go work.', 'Friendship first, love later.'] : pct > 30 ? ['Friend zone loading...', 'E go hard small.', 'Try another person.'] : ['Abeg, no waste time.', 'Run! Run! Run!', 'Na friendship be that.']
        await treply('Ship', [line('pair', `@${sender.split('@')[0]} + @${target.split('@')[0]}`), line('love', `${pct}%`), line('bar', bar), line('verdict', pickRandom(verdicts, chatKey+':ship-verdict')), line('lucky', `Lucky day: ${pickRandom(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], 'ship-day')}`)], [sender, target]); return
      }
      if(['slap','hug','kiss','pat'].includes(command)){
        const target = getMention(m)
        if(!target){ await treply(command, [line('usage', `.${command} @user`)]); return }
        const acts = {
          slap: pickRandom(SLAP_LINES, chatKey+':slap'),
          hug: pickRandom(HUG_LINES, chatKey+':hug'),
          kiss: pickRandom(KISS_LINES, chatKey+':kiss'),
          pat: pickRandom(['pat — Good boy/girl.', 'pat for head — you try.', 'pat like cat — purrr.'], chatKey+':pat')
        }
        await treply(command.toUpperCase(), [`@${sender.split('@')[0]} ${acts[command]} @${target.split('@')[0]} ${randEmoji()}`], [sender, target]); return
      }
      if(['rate','howgay','howcool','simp'].includes(command)){
        const target = getMention(m) || sender
        const pct = randInt(0,100)
        const labels = { rate: 'Rate', howgay: 'How Gay', howcool: 'How Cool', simp: 'Simp Level' }
        // Random comment based on score
        const comment = pct > 80 ? 'Top tier!' : pct > 50 ? 'Average, e get hope.' : 'Low, but no wahala.'
        await treply(labels[command], [line('user', `@${target.split('@')[0]}`), line('score', `${pct}%`), line('comment', comment)], [target]); return
      }
      // NEW: RANDOM / SPIN / FORTUNE - pure random
      if(['random','spin','fortune'].includes(command)){
        const fortunes = [`Today na your lucky day, go try something new.`,`Person wey you think about go message you today.`,`Money dey road, but you go need work for am.`,`No trust everybody wey smile for you today.`,`Your crush dey think about you too.`,`E go better, just no give up today.`,`You go hear good news before night.`,`Avoid person wey dey ask for urgent 2k today.`]
        const all = [...JOKES, ...FACTS, ...fortunes]
        await treply('Random', [pickRandom(all, chatKey+':random')]); return
      }
    } catch(e){
      await sock.sendMessage(jid, { text: box('Fun Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
                                             }
