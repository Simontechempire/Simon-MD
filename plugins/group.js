// +--=[ SIMON MD | GROUP ]=--+
// | ASCII INLINE UI - v2 + TINY FONT |
// +----------------------------------+
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box: tinyBox, reactAwait, reactCmd, reactDone } = style
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')

function getTarget(m, text){
  const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || {}
  // 1) tagged 2) replied user 3) number in text
  if(ctx.mentionedJid?.[0]) return ctx.mentionedJid[0]
  if(ctx.participant) return ctx.participant
  if(ctx.quotedMessage && ctx.participant) return ctx.participant
  const num = String(text||'').replace(/[^0-9]/g,'')
  if(num.length >= 7) return num + '@s.whatsapp.net'
  return null
}

module.exports = {
  command: [
    'kick','add','promote','demote','tagall','hidetag','admins','groupinfo',
    'mute','unmute','open','close','revoke','newlink','resetlink','invite',
    'join','leave','setname','setdesc','setsubject','setgrouppic','getgrouppic',
    'groupname','groupdesc','membercount','members','listonline','listadmin','listmember',
    'everyone','tagadmin','tagmember','kickall','promoteall','demoteall','group',
    'antidelete','welcome','goodbye','setwelcome','setgoodbye','delwelcome','delgoodbye',
    'approve','reject','requests','poll','vote','gstatus'
  ],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    try{ await reactAwait(sock, jid, m.key) }catch{}

    const box = (title, body) => {
      // tinyBox already tiny title, body na string with \n
      const lines = String(body||'').split('\n')
      return tinyBox(title, lines)
    }
    const silentFail = async () => { try{ await reactDone(sock, jid, m.key) }catch{} }

    const isGroup = jid.endsWith('@g.us')
    if (!isGroup) {
      await sock.sendMessage(jid, { text: box('Group Only', '[!] This command works in groups only.') }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
      return
    }

    let metadata
    try { metadata = await sock.groupMetadata(jid) } catch { metadata = { participants: [], subject: 'Unknown' } }
    const participants = metadata.participants || []
    const isAdmin = (jid2) => {
      if(!jid2) return false
      const base = String(jid2).split(':')[0].split('@')[0]
      const p = participants.find(x => String(x.id).split(':')[0].split('@')[0] === base)
      return !!p?.admin
    }
    // FIX: normalize botJid - remove :xx suffix
    const botBase = String(sock.user.id||'').split(':')[0].split('@')[0]
    const botJid = botBase + '@s.whatsapp.net'
    const botAdmin = isAdmin(botJid)
    const senderAdmin = isAdmin(sender)

    const adminOnly = ['kick','add','promote','demote','mute','unmute','open','close','revoke','newlink','resetlink','setname','setdesc','setsubject','setgrouppic','kickall','promoteall','demoteall','approve','reject']
    if (adminOnly.includes(command) && !senderAdmin) {
      await silentFail()
      return
    }

    const treply = async (title, body, mentions = []) => {
      const txt = box(title, body)
      await sock.sendMessage(jid, { text: txt, mentions }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }

    try {
      if (command === 'kick') {
        const target = getTarget(m, text)
        if (!target) { await treply('Kick', '[?] Usage: .kick @user / reply user'); return }
        if (!botAdmin) return silentFail()
        if (isAdmin(target)) { await treply('Kick', '[!] Cannot kick admin'); return }
        if (target.split('@')[0] === botBase) { await treply('Kick', '[!] Cannot kick bot'); return }
        await sock.groupParticipantsUpdate(jid, [target], 'remove')
        await treply('Kicked', `[+] User removed\n[@] @${target.split('@')[0]}`, [target])
        return
      }
      if (command === 'add') {
        if (!text) { await treply('Add', '[?] Usage: .add 234xxxxxxxx'); return }
        if (!botAdmin) return silentFail()
        const user = text.replace(/[^0-9]/g,'') + '@s.whatsapp.net'
        await sock.groupParticipantsUpdate(jid, [user], 'add')
        await treply('Added', `[+] ${text}\n[@] Added to group`, [user])
        return
      }
      if (command === 'promote') {
        const user = getTarget(m, text)
        if (!user) { await treply('Promote', '[?] Tag / reply user to promote'); return }
        if (!botAdmin) return silentFail()
        await sock.groupParticipantsUpdate(jid, [user], 'promote')
        await treply('Promoted', `[+] @${user.split('@')[0]}\n[^] Now ADMIN`, [user])
        return
      }
      if (command === 'demote') {
        const user = getTarget(m, text)
        if (!user) { await treply('Demote', '[?] Tag / reply user to demote'); return }
        if (!botAdmin) return silentFail()
        await sock.groupParticipantsUpdate(jid, [user], 'demote')
        await treply('Demoted', `[+] @${user.split('@')[0]}\n[v] Removed from ADMIN`, [user])
        return
      }
      if (command === 'kickall') {
        if (!botAdmin) return silentFail()
        const targets = participants.filter(p => !p.admin && String(p.id).split('@')[0] !== botBase && String(p.id).split('@')[0] !== String(sender).split('@')[0])
        for(let t of targets) await sock.groupParticipantsUpdate(jid, [t.id], 'remove').catch(()=>{})
        await treply('Kickall', `[+] Kicked ${targets.length} members`)
        return
      }
      if (command === 'promoteall') {
        if (!botAdmin) return silentFail()
        const targets = participants.filter(p => !p.admin)
        for(let t of targets) await sock.groupParticipantsUpdate(jid, [t.id], 'promote').catch(()=>{})
        await treply('Promoteall', `[+] Promoted ${targets.length} members`)
        return
      }
      if (command === 'demoteall') {
        if (!botAdmin) return silentFail()
        const targets = participants.filter(p => p.admin && String(p.id).split('@')[0] !== botBase)
        for(let t of targets) await sock.groupParticipantsUpdate(jid, [t.id], 'demote').catch(()=>{})
        await treply('Demoteall', `[+] Demoted ${targets.length} admins`)
        return
      }
      if (['tagall', 'everyone', 'hidetag'].includes(command)) {
        const mentions = participants.map(p => p.id)
        const msg = text || 'Hello everyone!'
        if (command === 'hidetag') {
          await sock.sendMessage(jid, { text: tiny(msg), mentions }, { quoted: m })
        } else {
          let txt = box('Tag All', `${participants.length} Members\n${msg}\n` + participants.map((p,i) => `${String(i+1).padStart(2,'0')} >> @${p.id.split('@')[0]}`).join('\n'))
          await sock.sendMessage(jid, { text: txt, mentions }, { quoted: m })
        }
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if (['admins', 'listadmin'].includes(command)) {
        const admins = participants.filter(p => p.admin)
        const body = admins.length ? admins.map((a,i) => `${String(i+1).padStart(2,'0')} >> @${a.id.split('@')[0]} [ADMIN]`).join('\n') : '[!] No admins found'
        await treply(`Admins | ${admins.length}`, body, admins.map(a => a.id))
        return
      }
      if (['groupinfo','group','gstatus'].includes(command)) {
        await treply('Group Info',
          `[#] Name   : ${metadata.subject}\n` +
          `[#] Owner  : ${metadata.owner ? '@' + metadata.owner.split('@')[0] : 'Unknown'}\n` +
          `[#] Members: ${participants.length}\n` +
          `[#] Admins : ${participants.filter(p => p.admin).length}\n` +
          `[#] Created: ${metadata.creation ? new Date(metadata.creation * 1000).toLocaleString() : 'Unknown'}\n` +
          `[#] Desc   : ${metadata.desc || 'None'}`
        )
        return
      }
      if (command === 'groupname') { await treply('Group Name', `[#] ${metadata.subject}`); return }
      if (command === 'groupdesc') { await treply('Group Desc', `[#] ${metadata.desc || 'None'}`); return }
      if (['membercount', 'members', 'listmember'].includes(command)) {
        const body = participants.map((p,i) => `${String(i+1).padStart(2,'0')} >> @${p.id.split('@')[0]} ${p.admin ? '[ADMIN]' : ''}`).join('\n')
        await treply(`Members | ${participants.length}`, body, participants.map(p => p.id))
        return
      }
      if (command === 'listonline') {
        // FIX: honest - Baileys no expose online list via groupMetadata
        await treply('List Online', `[#] Total: ${participants.length}\n[!] Online list no dey available for Baileys - use .members to see all`)
        return
      }
      if (['mute', 'close'].includes(command)) {
        if (!botAdmin) return silentFail()
        await sock.groupSettingUpdate(jid, 'announcement')
        await treply('Group Closed', '[X] Only ADMINS can send messages now.')
        return
      }
      if (['unmute', 'open'].includes(command)) {
        if (!botAdmin) return silentFail()
        await sock.groupSettingUpdate(jid, 'not_announcement')
        await treply('Group Opened', '[+] Everyone can send messages now.')
        return
      }
      if (['revoke', 'newlink', 'resetlink', 'invite'].includes(command)) {
        if (!botAdmin) return silentFail()
        await sock.groupRevokeInvite(jid)
        const code = await sock.groupInviteCode(jid)
        await treply('New Group Link', `[>] https://chat.whatsapp.com/${code}`)
        return
      }
      if (command === 'leave') {
        await treply('Leave', '[+] Leaving group...')
        await sock.groupLeave(jid)
        return
      }
      if (command === 'join') {
        // FIX: real join - .join <link/code>
        if(!text){ await treply('Join', '[?] Usage: .join https://chat.whatsapp.com/XXXX'); return }
        const code = String(text).split('/').pop().trim()
        if(!code){ await treply('Join', '[?] Invalid link'); return }
        try{
          await sock.groupAcceptInvite(code)
          await treply('Join', '[+] Joined group')
        }catch(e){ await treply('Join', `[!] Failed: ${e.message}`) }
        return
      }
      if (['setname', 'setsubject'].includes(command)) {
        if (!text) { await treply('Set Name', `[?] Usage: .${command} <new name>`); return }
        if (!botAdmin) return silentFail()
        await sock.groupUpdateSubject(jid, text)
        await treply('Name Changed', `[+] New name: ${text}`)
        return
      }
      if (command === 'setdesc') {
        if (!text) { await treply('Set Desc', '[?] Usage: .setdesc <new description>'); return }
        if (!botAdmin) return silentFail()
        await sock.groupUpdateDescription(jid, text)
        await treply('Desc Updated', '[+] Description updated successfully.')
        return
      }
      if (command === 'setgrouppic') {
        if (!botAdmin) return silentFail()
        const ctx = m.message?.extendedTextMessage?.contextInfo || {}
        const quoted = ctx.quotedMessage?.imageMessage || ctx.quotedMessage?.viewOnceMessage?.message?.imageMessage || ctx.quotedMessage?.viewOnceMessageV2?.message?.imageMessage
        const direct = m.message?.imageMessage
        const imgMsg = quoted || direct
        if (!imgMsg) { await treply('Set Group Pic', '[?] Reply an image with .setgrouppic'); return }
        try{
          const stream = await downloadContentFromMessage(imgMsg, 'image')
          let buf = Buffer.from([])
          for await (const chunk of stream){ buf = Buffer.concat([buf, chunk]) }
          await sock.updateProfilePicture(jid, buf)
          await treply('Group Pic', '[+] Group picture updated')
        }catch(e){ await treply('Group Pic', `[!] Failed: ${e.message}`) }
        return
      }
      if (command === 'getgrouppic') {
        try {
          const url = await sock.profilePictureUrl(jid, 'image')
          await sock.sendMessage(jid, { image: { url }, caption: box('Group Picture', '') }, { quoted: m })
          try{ await reactCmd(sock, jid, m.key, command) }catch{}
          try{ await reactDone(sock, jid, m.key) }catch{}
        } catch { await treply('Group Pic', '[!] No group picture or it is private') }
        return
      }
      if (command === 'tagadmin') {
        const admins = participants.filter(p => p.admin)
        await sock.sendMessage(jid, { text: box('Tag Admins', text || ''), mentions: admins.map(a => a.id) }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if (command === 'tagmember') {
        const members = participants.filter(p => !p.admin)
        await sock.sendMessage(jid, { text: box('Tag Members', text || ''), mentions: members.map(a => a.id) }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if (['poll','vote'].includes(command)) {
        if (!text || !text.includes('|')) { await treply('Poll', '[?] Usage: .poll Question | Option1 | Option2'); return }
        const [q, ...opts] = text.split('|').map(s => s.trim()).filter(Boolean)
        if(!q || opts.length < 2){ await treply('Poll', '[?] Need question + at least 2 options'); return }
        await sock.sendMessage(jid, { poll: { name: q, values: opts, selectableCount: 1 } }, { quoted: m })
        try{ await reactCmd(sock, jid, m.key, command) }catch{}
        try{ await reactDone(sock, jid, m.key) }catch{}
        return
      }
      if (['welcome','goodbye','setwelcome','setgoodbye','delwelcome','delgoodbye'].includes(command)) {
        const dbPath = path.join(__dirname, '../database/welcome.json')
        let db = {}
        try{ db = JSON.parse(fs.readFileSync(dbPath)) }catch{}
        const save = () => { if(!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), {recursive:true}); fs.writeFileSync(dbPath, JSON.stringify(db,null,2)) }
        if(command === 'setwelcome'){ if(!text){ await treply('Set Welcome', '[?] .setwelcome Hello @user welcome'); return } db[jid] = db[jid] || {}; db[jid].welcome = text; save(); await treply('Welcome Set', `[+] ${text}`); return }
        if(command === 'setgoodbye'){ if(!text){ await treply('Set Goodbye', '[?] .setgoodbye Bye @user'); return } db[jid] = db[jid] || {}; db[jid].goodbye = text; save(); await treply('Goodbye Set', `[+] ${text}`); return }
        if(command === 'delwelcome'){ if(db[jid]) delete db[jid].welcome; save(); await treply('Welcome', '[-] Welcome deleted'); return }
        if(command === 'delgoodbye'){ if(db[jid]) delete db[jid].goodbye; save(); await treply('Goodbye', '[-] Goodbye deleted'); return }
        if(command === 'welcome'){ await treply('Welcome', db[jid]?.welcome || '[!] No welcome set. Use .setwelcome'); return }
        if(command === 'goodbye'){ await treply('Goodbye', db[jid]?.goodbye || '[!] No goodbye set. Use .setgoodbye'); return }
      }
      if (['approve', 'reject', 'requests'].includes(command)) {
        if (!botAdmin) return silentFail()
        const reqs = await sock.groupRequestParticipantsList(jid).catch(() => [])
        if (command === 'requests') { await treply('Pending Requests', `[#] Count: ${reqs.length}\n${reqs.map(r => `[>] ${r.jid || r.id}`).join('\n') || '[!] None'}`); return }
        if (command === 'approve') {
          for (let r of reqs) await sock.groupRequestParticipantsUpdate(jid, [r.jid || r.id], 'approve').catch(()=>{})
          await treply('Approved', `[+] Approved ${reqs.length} requests`); return
        }
        if (command === 'reject') {
          for (let r of reqs) await sock.groupRequestParticipantsUpdate(jid, [r.jid || r.id], 'reject').catch(()=>{})
          await treply('Rejected', `[-] Rejected ${reqs.length} requests`); return
        }
      }
      if (command === 'antidelete') {
        await treply('AntiDelete', '[>] Use .antidelete on/off - go to anti plugin')
        return
      }
    } catch (e) {
      if(e.message?.includes('not admin') || e.message?.includes('403')){ await silentFail(); return }
      await treply('Error', `[-] Group Error: ${e.message}`)
    }
  }
        }
