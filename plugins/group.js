// +--=[ SIMON MD | GROUP ]=--+
// | ASCII INLINE UI - v2    |
// +--------------------------+
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
    // --=[ UI HELPER ]=--
    const line = '+----------------------------------------+'
    const box = (title, body) => {
      return `${line}\n| [+] ${title}\n| --------------------------------------\n${body.split('\n').map(l => `| ${l}`).join('\n')}\n| --------------------------------------\n| [>] SIMON MD | GROUP CONTROL\n${line}`
    }
    const errBox = (msg) => box('ERROR', `[-] ${msg}\n[!] Bot must be ADMIN to do this.`)

    const isGroup = m.key.remoteJid.endsWith('@g.us')
    if (!isGroup) return reply(box('GROUP ONLY', '[!] This command works in groups only.'))

    let metadata
    try { metadata = await sock.groupMetadata(m.key.remoteJid) } catch { metadata = { participants: [], subject: 'Unknown' } }

    const participants = metadata.participants || []
    const isAdmin = (jid) => participants.find(p => p.id === jid)?.admin
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'
    const botAdmin = isAdmin(botJid) || participants.find(p => p.id.includes(sock.user.id.split('@')[0]))?.admin

    try {
      // --=[ KICK ]=--
      if (command === 'kick') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        const target = mentioned || (text ? text.replace(/[^0-9]/g,'') + '@s.whatsapp.net' : null)
        if (!target) return reply(box('KICK', '[?] Usage: .kick @user'))
        if (!botAdmin) return reply(errBox('Bot needs to be ADMIN'))
        await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'remove')
        return reply(box('KICKED', `[+] User removed\n[@] @${target.split('@')[0]}`), { mentions: [target] })
      }

      // --=[ ADD ]=--
      if (command === 'add') {
        if (!text) return reply(box('ADD', '[?] Usage: .add 234xxxxxxxx'))
        const user = text.replace(/[^0-9]/g,'') + '@s.whatsapp.net'
        await sock.groupParticipantsUpdate(m.key.remoteJid, [user], 'add')
        return reply(box('ADDED', `[+] ${text}\n[@] Added to group`))
      }

      // --=[ PROMOTE ]=--
      if (command === 'promote') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) return reply(box('PROMOTE', '[?] Tag user to promote'))
        if (!botAdmin) return reply(errBox('Bot needs to be ADMIN'))
        await sock.groupParticipantsUpdate(m.key.remoteJid, [user], 'promote')
        return reply(box('PROMOTED', `[+] @${user.split('@')[0]}\n[^] Now ADMIN`), { mentions: [user] })
      }

      // --=[ DEMOTE ]=--
      if (command === 'demote') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) return reply(box('DEMOTE', '[?] Tag user to demote'))
        if (!botAdmin) return reply(errBox('Bot needs to be ADMIN'))
        await sock.groupParticipantsUpdate(m.key.remoteJid, [user], 'demote')
        return reply(box('DEMOTED', `[+] @${user.split('@')[0]}\n[v] Removed from ADMIN`), { mentions: [user] })
      }

      // --=[ TAGALL / HIDETAG ]=--
      if (['tagall', 'everyone', 'hidetag'].includes(command)) {
        const mentions = participants.map(p => p.id)
        const msg = text || 'Hello everyone!'
        if (command === 'hidetag') {
          // Invisible tag: text only, mentions hidden
          await sock.sendMessage(m.key.remoteJid, { text: `${msg}\n\n[SIMON MD :: HIDETAG]`, mentions }, { quoted: m })
        } else {
          let txt = `${line}\n| [+] TAG ALL | ${participants.length} MEMBERS\n| --------------------------------------\n| ${msg}\n| --------------------------------------\n`
          participants.forEach((p, i) => { txt += `| ${String(i+1).padStart(2,'0')} >> @${p.id.split('@')[0]}\n` })
          txt += line
          await sock.sendMessage(m.key.remoteJid, { text: txt, mentions }, { quoted: m })
        }
        return
      }

      // --=[ ADMINS ]=--
      if (['admins', 'listadmin'].includes(command)) {
        const admins = participants.filter(p => p.admin)
        const body = admins.length ? admins.map((a,i) => `${String(i+1).padStart(2,'0')} >> @${a.id.split('@')[0]} [ADMIN]`).join('\n') : '[!] No admins found'
        return reply(box(`ADMINS | ${admins.length}`, body), { mentions: admins.map(a => a.id) })
      }

      // --=[ GROUP INFO ]=--
      if (command === 'groupinfo') {
        return reply(box('GROUP INFO',
          `[#] Name   : ${metadata.subject}\n` +
          `[#] Owner  : ${metadata.owner ? '@' + metadata.owner.split('@')[0] : 'Unknown'}\n` +
          `[#] Members: ${participants.length}\n` +
          `[#] Admins : ${participants.filter(p => p.admin).length}\n` +
          `[#] Created: ${new Date(metadata.creation * 1000).toLocaleString()}\n` +
          `[#] Desc   : ${metadata.desc || 'None'}`
        ))
      }

      if (command === 'groupname') return reply(box('GROUP NAME', `[#] ${metadata.subject}`))
      if (command === 'groupdesc') return reply(box('GROUP DESC', `[#] ${metadata.desc || 'None'}`))

      // --=[ MEMBERS ]=--
      if (['membercount', 'members'].includes(command)) {
        const body = participants.map((p,i) => `${String(i+1).padStart(2,'0')} >> @${p.id.split('@')[0]} ${p.admin ? '[ADMIN]' : ''}`).join('\n')
        return reply(box(`MEMBERS | ${participants.length}`, body), { mentions: participants.map(p => p.id) })
      }

      // --=[ MUTE / OPEN ]=--
      if (['mute', 'close'].includes(command)) {
        await sock.groupSettingUpdate(m.key.remoteJid, 'announcement')
        return reply(box('GROUP CLOSED', '[X] Only ADMINS can send messages now.'))
      }
      if (['unmute', 'open'].includes(command)) {
        await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement')
        return reply(box('GROUP OPENED', '[+] Everyone can send messages now.'))
      }

      // --=[ REVOKE / LINK ]=--
      if (['revoke', 'newlink', 'resetlink', 'invite'].includes(command)) {
        await sock.groupRevokeInvite(m.key.remoteJid)
        const code = await sock.groupInviteCode(m.key.remoteJid)
        return reply(box('NEW GROUP LINK', `[>] https://chat.whatsapp.com/${code}`))
      }

      if (command === 'leave') { await sock.groupLeave(m.key.remoteJid); return }

      if (['setname', 'setsubject'].includes(command)) {
        if (!text) return reply(box('SET NAME', `[?] Usage: .${command} <new name>`))
        await sock.groupUpdateSubject(m.key.remoteJid, text)
        return reply(box('NAME CHANGED', `[+] New name: ${text}`))
      }

      if (command === 'setdesc') {
        if (!text) return reply(box('SET DESC', '[?] Usage: .setdesc <new description>'))
        await sock.groupUpdateDescription(m.key.remoteJid, text)
        return reply(box('DESC UPDATED', '[+] Description updated successfully.'))
      }

      if (command === 'setgrouppic') return reply(box('SET GROUP PIC', '[?] Reply an image with .setgrouppic'))

      if (command === 'getgrouppic') {
        try {
          const url = await sock.profilePictureUrl(m.key.remoteJid, 'image')
          await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `${line}\n| [+] GROUP PROFILE PICTURE\n${line}` }, { quoted: m })
        } catch { reply(errBox('No group picture or it is private')) }
        return
      }

      // --=[ LIST MEMBER ]=--
      if (command === 'listmember') {
        let txt = `${line}\n| [+] ALL MEMBERS | ${metadata.subject}\n| --------------------------------------\n`
        participants.forEach((p,i) => { txt += `| ${String(i+1).padStart(2,'0')} >> @${p.id.split('@')[0]} ${p.admin ? '[ADMIN]' : ''}\n` })
        txt += line
        await sock.sendMessage(m.key.remoteJid, { text: txt, mentions: participants.map(p => p.id) }, { quoted: m })
        return
      }

      // --=[ TAG ADMIN ]=--
      if (command === 'tagadmin') {
        const admins = participants.filter(p => p.admin)
        await sock.sendMessage(m.key.remoteJid, { 
          text: `${line}\n| [+] TAG ADMINS\n| --------------------------------------\n| ${text || ''}\n| ${admins.map(a => `@${a.id.split('@')[0]}`).join(' ')}\n${line}`, 
          mentions: admins.map(a => a.id) 
        }, { quoted: m })
        return
      }

      // --=[ POLL ]=--
      if (command === 'poll') {
        if (!text.includes('|')) return reply(box('POLL', '[?] Usage: .poll Question | Option1 | Option2'))
        const [q, ...opts] = text.split('|').map(s => s.trim())
        await sock.sendMessage(m.key.remoteJid, { poll: { name: q, values: opts, selectableCount: 1 } }, { quoted: m })
        return
      }

      // --=[ REQUESTS ]=--
      if (['approve', 'reject', 'requests'].includes(command)) {
        if (command === 'requests') {
          const reqs = await sock.groupRequestParticipantsList(m.key.remoteJid).catch(() => [])
          return reply(box('PENDING REQUESTS', `[#] Count: ${reqs.length}\n${reqs.map(r => `[>] ${r.jid}`).join('\n') || '[!] None'}`))
        }
        if (command === 'approve') {
          const reqs = await sock.groupRequestParticipantsList(m.key.remoteJid).catch(() => [])
          for (let r of reqs) await sock.groupRequestParticipantsUpdate(m.key.remoteJid, [r.jid], 'approve')
          return reply(box('APPROVED', `[+] Approved ${reqs.length} requests`))
        }
        if (command === 'reject') {
          const reqs = await sock.groupRequestParticipantsList(m.key.remoteJid).catch(() => [])
          for (let r of reqs) await sock.groupRequestParticipantsUpdate(m.key.remoteJid, [r.jid], 'reject')
          return reply(box('REJECTED', `[-] Rejected ${reqs.length} requests`))
        }
      }

    } catch (e) {
      reply(errBox(`Group Error: ${e.message}`))
    }
  }
      }
