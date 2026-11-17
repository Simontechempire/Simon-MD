// 🔍 SIMON MD - SEARCH - FREE, NO API KEY - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

// Free search - DuckDuckGo Instant Answer, no key, no signup
async function ddgSearch(query){
  try{
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'SIMON-MD/2.0' } })
    if(!res.ok) return null
    const data = await res.json()
    const out = []
    if(data.AbstractText) out.push({ title: data.Heading || query, desc: data.AbstractText, link: data.AbstractURL })
    if(data.Answer) out.push({ title: 'Answer', desc: data.Answer, link: '' })
    if(data.RelatedTopics){
      for(const t of data.RelatedTopics){
        if(t.Text && t.FirstURL) out.push({ title: t.Text.split(' - ')[0] || t.Text.slice(0,60), desc: t.Text, link: t.FirstURL })
        if(t.Topics) for(const sub of t.Topics){ if(sub.Text) out.push({ title: sub.Text.split(' - ')[0] || sub.Text.slice(0,60), desc: sub.Text, link: sub.FirstURL }) }
        if(out.length >= 5) break
      }
    }
    return out.slice(0, 5)
  }catch(e){ return null }
}

// Wikipedia free, no key
async function wikiSearch(query){
  try{
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'SIMON-MD/2.0' } })
    if(!res.ok) return null
    const data = await res.json()
    if(!data.extract) return null
    return { title: data.title, desc: data.extract, link: data.content_urls?.desktop?.page || '' }
  }catch{ return null }
}

module.exports = {
  command: ['search','google','bing','wiki','wikipedia','define','meaning','dictionary','searchcmd','findcmd','searchgroup','find','web','websearch','image','imagesearch','lyrics','movie','song'],
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
      if(command === 'search' && !text){
        await treply('Search - Free No Key', [
          line('web', '.search <query>'),
          line('wiki', '.wiki <query>'),
          line('define', '.define <word>'),
          line('cmd', '.searchcmd <name>'),
          line('group', '.searchgroup <word> - search cached messages'),
          line('note', 'Uses DuckDuckGo + Wikipedia, no key')
        ])
        return
      }
      // --=[ WEB SEARCH - DuckDuckGo free ]=--
      if(['search','google','bing','web','websearch'].includes(command)){
        if(!text){ await treply('Search', [line('usage', '.search who is Elon Musk')]); return }
        const results = await ddgSearch(text)
        if(!results || !results.length){
          // Fallback to Wikipedia
          const wiki = await wikiSearch(text)
          if(wiki){
            await treply('Search - Wikipedia', [line('title', wiki.title), line('desc', wiki.desc.slice(0, 800)), line('link', wiki.link)])
            return
          }
          await treply('Search', [line('error', `No result for "${text}"`), line('tip', 'Try .wiki ' + text), line('note', 'Check internet - DuckDuckGo needs data')])
          return
        }
        const lines = [line('query', text)]
        results.forEach((r,i) => {
          lines.push(line(`result ${i+1}`, r.title))
          lines.push(line('desc', r.desc.slice(0, 300)))
          if(r.link) lines.push(line('link', r.link))
        })
        await treply('Search Results', lines)
        return
      }
      // --=[ WIKIPEDIA ]=--
      if(['wiki','wikipedia'].includes(command)){
        if(!text){ await treply('Wikipedia', [line('usage', '.wiki Lagos')]); return }
        const wiki = await wikiSearch(text)
        if(!wiki){ await treply('Wikipedia', [line('error', `No page for "${text}"`)]); return }
        await treply('Wikipedia', [line('title', wiki.title), line('desc', wiki.desc.slice(0, 900)), line('link', wiki.link)])
        return
      }
      // --=[ DEFINE - free dictionary, no key ]=--
      if(['define','meaning','dictionary'].includes(command)){
        if(!text){ await treply('Define', [line('usage', '.define love')]); return }
        try{
          const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text.trim().split(/\s+/)[0])}`)
          if(!res.ok){ await treply('Define', [line('error', `No definition for "${text}"`)]); return }
          const data = await res.json()
          const entry = data[0]
          const defs = []
          for(const meaning of entry.meanings?.slice(0,2) || []){
            for(const d of meaning.definitions?.slice(0,2) || []){
              defs.push(line(meaning.partOfSpeech, d.definition.slice(0, 300)))
              if(d.example) defs.push(line('example', d.example.slice(0, 200)))
            }
          }
          await treply(`Define - ${entry.word}`, [line('phonetic', entry.phonetic || ''), ...defs])
        }catch(e){ await treply('Define', [line('error', 'Dictionary needs internet')]) }
        return
      }
      // --=[ SEARCH CMD - local, offline ]=--
      if(['searchcmd','findcmd'].includes(command)){
        if(!text){ await treply('Search Cmd', [line('usage', '.searchcmd sticker')]); return }
        // Try to list commands from plugins folder
        const fs = require('fs'); const path = require('path')
        const pluginsDir = path.join(__dirname)
        let found = []
        try{
          const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))
          for(const f of files){
            try{
              const mod = require(path.join(pluginsDir, f))
              if(mod.command){
                const cmds = Array.isArray(mod.command) ? mod.command : [mod.command]
                for(const c of cmds){ if(c.toLowerCase().includes(text.toLowerCase())) found.push(`.${c} - ${f}`) }
              }
            }catch{}
          }
        }catch{}
        if(!found.length){ await treply('Search Cmd', [line('error', `No command for "${text}"`), line('tip', 'Try .menu')]); return }
        await treply('Search Cmd', found.slice(0, 15).map((f,i) => line(`cmd ${i+1}`, f)))
        return
      }
      // --=[ SEARCH GROUP - local cache, offline ]=--
      if(['searchgroup','find'].includes(command)){
        if(!text){ await treply('Search Group', [line('usage', '.searchgroup hello - search last cached messages')]); return }
        // Use aiMemory / group cache if available
        const cache = global.groupMsgCache?.get(jid) || global.aiMemory?.get(jid) || []
        const q = text.toLowerCase()
        const matches = []
        if(Array.isArray(cache)){
          for(const item of cache){
            const txt = typeof item === 'string' ? item : (item.content || item.text || '')
            if(txt.toLowerCase().includes(q)) matches.push(txt.slice(0, 200))
          }
        }
        if(!matches.length){ await treply('Search Group', [line('info', `No cached message for "${text}"`), line('tip', 'Bot only search messages since e start')]); return }
        await treply('Search Group', matches.slice(0, 5).map((t,i) => line(`match ${i+1}`, t)))
        return
      }
      // --=[ IMAGE SEARCH - honest, no fake ]=--
      if(['image','imagesearch'].includes(command)){
        if(!text){ await treply('Image Search', [line('usage', '.image cat')]); return }
        await treply('Image Search', [line('link', `https://duckduckgo.com/?q=${encodeURIComponent(text)}&iax=images&ia=images`), line('note', 'Open link to see images - no API key needed')])
        return
      }
      // --=[ LYRICS / MOVIE / SONG - honest ]=--
      if(['lyrics','movie','song'].includes(command)){
        await treply(command, [line('info', `${command} needs paid API for full data`), line('search', `https://duckduckgo.com/?q=${encodeURIComponent(text || command)}`), line('tip', `Try .search ${text || 'song name'}`)])
        return
      }
    } catch(e){
      await sock.sendMessage(jid, { text: box('Search Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
          }
