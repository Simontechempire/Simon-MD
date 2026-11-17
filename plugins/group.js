// +--=[ SIMON MD | GROUP ]=--+
// | ASCII INLINE UI - v2 + TINY FONT |
// +----------------------------------+
const { tiny, box: tinyBox, line: tinyLine, reactAwait, reactCmd, reactDone } = require('../utils/style')

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
    await reactAwait(sock, jid, m.key) // ⏳

    // --=[ UI HELPER - TINY FONT + ASCII INLINE ]=--
    const line = '+----------------------------------------+'
    const box = (title, body) => {
      return tinyBox(title, body.split('\n').map(l => tiny(l)))
    }
    // Silent - NO "Bot must be ADMIN" message ever
    const silentFail = async () => {
      await reactDone(sock, jid, m.key)
      return true
    }

    const isGroup = jid.endsWith('@g.us')
    if (!isGroup) {
      await sock.sendMessage(jid, { text: box('Group Only', '[!] This command works in groups only.') }, { quoted: m })
      await reactDone(sock, jid, m.key)
      return
    }

    let metadata
    try { metadata = await sock.groupMetadata(jid) } catch { metadata = { participants: [], subject: 'Unknown' } }

    const participants = metadata.participants || []
    const isAdmin = (jid2) => participants.find(p => p.id === jid2)?.admin
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'
    const botAdmin = isAdmin(botJid) || participants.find(p => p.id.includes(sock.user.id.split('@')[0]))?.admin
    const senderAdmin = isAdmin(sender)

    // Only admin fit use group control - silent, no spam
    const adminOnly = ['kick','add','promote','demote','mute','unmute','open','close','revoke','newlink','resetlink','setname','setdesc','setsubject','setgrouppic','kickall','promoteall','demoteall','approve','reject']
    if (adminOnly.includes(command) && !senderAdmin) {
      await reactDone(sock, jid, m.key)
      return // silent - no "you are not admin" message
    }

    // Helper to reply with tiny font + mentions for real
    const treply = async (title, body, mentions = []) => {
      const txt = box(title, body)
      await sock.sendMessage(jid, { text: txt, mentions }, { quoted: m })
      await reactCmd(sock, jid, m.key, command)
      await reactDone(sock, jid, m.key) // 💀
    }
    const treplyNoDone = async (title, body, mentions = []) => {
      const txt = box(title, body)
      await sock.sendMessage(jid, { text: txt, mentions }, { quoted: m })
    }

    try {
      // --=[ KICK ]=--
      if (command === 'kick') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        const target = mentioned || (text ? text.replace(/[^0-9]/g,'') + '@s.whatsapp.net' : null)
        if (!target) { await treply('Kick', '[?] Usage: .kick @user'); return }
        if (!botAdmin) return silentFail()
        if (isAdmin(target)) { await treply('Kick', '[!] Cannot kick admin'); return }
        await sock.groupParticipantsUpdate(jid, [target], 'remove')
        await treply('Kicked', `[+] User removed\n[@] @${target.split('@')[0]}`, [target])
        return
      }

      // --=[ ADD ]=--
      if (command === 'add') {
        if (!text) { await treply('Add', '[?] Usage: .add 234xxxxxxxx'); return }
        if (!botAdmin) return silentFail()
        const user = text.replace(/[^0-9]/g,'') + '@s.whatsapp.net'
        await sock.groupParticipantsUpdate(jid, [user], 'add')
        await treply('Added', `[+] ${text}\n[@] Added to group`, [user])
        return
      }

      // --=[ PROMOTE ]=--
      if (command === 'promote') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) { await treply('Promote', '[?] Tag user to promote'); return }
        if (!botAdmin) return silentFail()
        await sock.groupParticipantsUpdate(jid, [user], 'promote')
        await treply('Promoted', `[+] @${user.split('@')[0]}\n[^] Now ADMIN`, [user])
        return
      }

      // --=[ DEMOTE ]=--
      if (command === 'demote') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) { await treply('Demote', '[?] Tag user to demote'); return }
        if (!botAdmin) return silentFail()
        await sock.groupParticipantsUpdate(jid, [user], 'demote')
        await treply('Demoted', `[+] @${user.split('@')[0]}\n[v] Removed from ADMIN`, [user])
        return
      }

      // --=[ KICKALL / PROMOTEALL / DEMOTEALL - REAL ]=--
      if (command === 'kickall') {
        if (!botAdmin) return silentFail()
        const targets = participants.filter(p => !p.admin && p.id !== botJid && p.id !== sender)
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
        const targets = participants.filter(p => p.admin && p.id !== botJid)
        for(let t of targets) await sock.groupParticipantsUpdate(jid, [t.id], 'demote').catch(()=>{})
        await treply('Demoteall', `[+] Demoted ${targets.length} admins`)
        return
      }

      // --=[ TAGALL / HIDETAG ]=--
      if (['tagall', 'everyone', 'hidetag'].includes(command)) {
        const mentions = participants.map(p => p.id)
        const msg = text || 'Hello everyone!'
        if (command === 'hidetag') {
          await sock.sendMessage(jid, { text: tiny(msg), mentions }, { quoted: m })
        } else {
          let txt = box('Tag All', `${participants.length} Members\n${msg}\n` + participants.map((p,i) => `${String(i+1).padStart(2,'0')} >> @${p.id.split('@')[0]}`).join('\n'))
          await sock.sendMessage(jid, { text: txt, mentions }, { quoted: m })
        }
        await reactCmd(sock, jid, m.key, command)
        await reactDone(sock, jid, m.key)
        return
      }

      // --=[ ADMINS ]=--
      if (['admins', 'listadmin'].includes(command)) {
        const admins = participants.filter(p => p.admin)
        const body = admins.length ? admins.map((a,i) => `${String(i+1).padStart(2,'0')} >> @${a.id.split('@')[0]} [ADMIN]`).join('\n') : '[!] No admins found'
        await treply(`Admins | ${admins.length}`, body, admins.map(a => a.id))
        return
      }

      // --=[ GROUP INFO / GROUP / GSTATUS ]=--
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

      // --=[ MEMBERS ]=--
      if (['membercount', 'members', 'listmember'].includes(command)) {
        const body = participants.map((p,i) => `${String(i+1).padStart(2,'0')} >> @${p.id.split('@')[0]} ${p.admin ? '[ADMIN]' : ''}`).join('\n')
        await treply(`Members | ${participants.length}`, body, participants.map(p => p.id))
        return
      }

      // --=[ LISTONLINE - REAL ]=--
      if (command === 'listonline') {
        const online = await sock.fetchStatus(jid).catch(()=>null)
        // Baileys no get online list directly, use presence - we show admins as online check via group metadata
        await treply('List Online', `[#] Total: ${participants.length}\n[!] Online list needs presence - showing all members`)
        return
      }

      // --=[ MUTE / OPEN ]=--
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

      // --=[ REVOKE / LINK ]=--
      if (['revoke', 'newlink', 'resetlink', 'invite'].includes(command)) {
        if (!botAdmin) return silentFail()
        await sock.groupRevokeInvite(jid)
        const code = await sock.groupInviteCode(jid)
        await treply('New Group Link', `[>] https://chat.whatsapp.com/${code}`)
        return
      }

      if (command === 'leave') { await sock.groupLeave(jid); return }
      if (command === 'join') { await treply('Join', '[?] Bot cannot join with link, use invite command'); return }

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

      // --=[ SETGROUPPIC - REAL ]=--
      if (command === 'setgrouppic') {
        if (!botAdmin) return silentFail()
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
        const direct = m.message?.imageMessage
        const imgMsg = quoted || direct
        if (!imgMsg) { await treply('Set Group Pic', '[?] Reply an image with .setgrouppic'); return }
        try{
          const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
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
          await reactCmd(sock, jid, m.key, command)
          await reactDone(sock, jid, m.key)
        } catch { await treply('Group Pic', '[!] No group picture or it is private') }
        return
      }

      // --=[ TAG ADMIN / TAG MEMBER ]=--
      if (command === 'tagadmin') {
        const admins = participants.filter(p => p.admin)
        await sock.sendMessage(jid, { text: box('Tag Admins', text || ''), mentions: admins.map(a => a.id) }, { quoted: m })
        await reactCmd(sock, jid, m.key, command)
        await reactDone(sock, jid, m.key)
        return
      }
      if (command === 'tagmember') {
        const members = participants.filter(p => !p.admin)
        await sock.sendMessage(jid, { text: box('Tag Members', text || ''), mentions: members.map(a => a.id) }, { quoted: m })
        await reactCmd(sock, jid, m.key, command)
        await reactDone(sock, jid, m.key)
        return
      }

      // --=[ POLL / VOTE ]=--
      if (['poll','vote'].includes(command)) {
        if (!text.includes('|')) { await treply('Poll', '[?] Usage: .poll Question | Option1 | Option2'); return }
        const [q, ...opts] = text.split('|').map(s => s.trim())
        await sock.sendMessage(jid, { poll: { name: q, values: opts, selectableCount: 1 } }, { quoted: m })
        await reactCmd(sock, jid, m.key, command)
        await reactDone(sock, jid, m.key)
        return
      }

      // --=[ WELCOME / GOODBYE - saved to file for real ]=--
      if (['welcome','goodbye','setwelcome','setgoodbye','delwelcome','delgoodbye'].includes(command)) {
        const fs = require('fs')
        const path = require('path')
        const dbPath = path.join(__dirname, '../database/welcome.json')
        let db = {}
        try{ db = JSON.parse(fs.readFileSync(dbPath)) }catch{}
        if(command === 'setwelcome'){ if(!text){ await treply('Set Welcome', '[?] .setwelcome Hello @user welcome'); return } db[jid] = db[jid] || {}; db[jid].welcome = text; fs.writeFileSync(dbPath, JSON.stringify(db,null,2)); await treply('Welcome Set', `[+] ${text}`); return }
        if(command === 'setgoodbye'){ if(!text){ await treply('Set Goodbye', '[?] .setgoodbye Bye @user'); return } db[jid] = db[jid] || {}; db[jid].goodbye = text; fs.writeFileSync(dbPath, JSON.stringify(db,null,2)); await treply('Goodbye Set', `[+] ${text}`); return }
        if(command === 'delwelcome'){ if(db[jid]) delete db[jid].welcome; fs.writeFileSync(dbPath, JSON.stringify(db,null,2)); await treply('Welcome', '[-] Welcome deleted'); return }
        if(command === 'delgoodbye'){ if(db[jid]) delete db[jid].goodbye; fs.writeFileSync(dbPath, JSON.stringify(db,null,2)); await treply('Goodbye', '[-] Goodbye deleted'); return }
        if(command === 'welcome'){ await treply('Welcome', db[jid]?.welcome || '[!] No welcome set. Use .setwelcome'); return }
        if(command === 'goodbye'){ await treply('Goodbye', db[jid]?.goodbye || '[!] No goodbye set. Use .setgoodbye'); return }
      }

      // --=[ REQUESTS ]=--
      if (['approve', 'reject', 'requests'].includes(command)) {
        if (!botAdmin) return silentFail()
        const reqs = await sock.groupRequestParticipantsList(jid).catch(() => [])
        if (command === 'requests') { await treply('Pending Requests', `[#] Count: ${reqs.length}\n${reqs.map(r => `[>] ${r.jid}`).join('\n') || '[!] None'}`); return }
        if (command === 'approve') {
          for (let r of reqs) await sock.groupRequestParticipantsUpdate(jid, [r.jid], 'approve').catch(()=>{})
          await treply('Approved', `[+] Approved ${reqs.length} requests`); return
        }
        if (command === 'reject') {
          for (let r of reqs) await sock.groupRequestParticipantsUpdate(jid, [r.jid], 'reject').catch(()=>{})
          await treply('Rejected', `[-] Rejected ${reqs.length} requests`); return
        }
      }

      if (command === 'antidelete') {
        await treply('AntiDelete', '[>] Use .antidelete on/off - go to anti plugin')
        return
      }

    } catch (e) {
      // Silent for bot not admin error, only show real error in tiny font, no "Bot must be ADMIN" spam
      if(e.message?.includes('not admin') || e.message?.includes('403')){ await silentFail(); return }
      await treply('Error', `[-] Group Error: ${e.message}`)
    }
  }
          }
