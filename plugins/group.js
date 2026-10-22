// 👥 SIMON MD - GROUP COMMANDS
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
    const isGroup = m.key.remoteJid.endsWith('@g.us')
    if (!isGroup) return reply(`👥 This command is for groups only!\n\n🩺 SIMON MD`)

    let metadata
    try { 
      metadata = await sock.groupMetadata(m.key.remoteJid) 
    } catch { 
      metadata = { participants: [], subject: 'Unknown' } 
    }

    const participants = metadata.participants || []
    const isAdmin = (jid) => participants.find(p => p.id === jid)?.admin
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'
    const botAdmin = isAdmin(botJid) || participants.find(p => p.id.includes(sock.user.id.split('@')[0]))?.admin

    try {
      // .kick
      if (command === 'kick') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        const target = mentioned || (text ? text.replace(/[^0-9]/g,'') + '@s.whatsapp.net' : null)
        if (!target) return reply(`Usage: .kick @user`)
        if (!botAdmin) return reply(`❌ Bot needs to be admin`)
        await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'remove')
        return reply(`✅ Kicked @${target.split('@')[0]}`, { mentions: [target] })
      }

      // .add
      if (command === 'add') {
        if (!text) return reply(`Usage: .add 234xxxxxxxx`)
        const user = text.replace(/[^0-9]/g,'') + '@s.whatsapp.net'
        await sock.groupParticipantsUpdate(m.key.remoteJid, [user], 'add')
        return reply(`✅ Added ${text}`)
      }

      // .promote
      if (command === 'promote') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) return reply(`Tag the user to promote`)
        if (!botAdmin) return reply(`❌ Bot needs to be admin`)
        await sock.groupParticipantsUpdate(m.key.remoteJid, [user], 'promote')
        return reply(`✅ Promoted @${user.split('@')[0]} to admin`, { mentions: [user] })
      }

      // .demote
      if (command === 'demote') {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!user) return reply(`Tag the user to demote`)
        if (!botAdmin) return reply(`❌ Bot needs to be admin`)
        await sock.groupParticipantsUpdate(m.key.remoteJid, [user], 'demote')
        return reply(`✅ Demoted @${user.split('@')[0]}`, { mentions: [user] })
      }

      // .tagall / .everyone / .hidetag
      if (['tagall', 'everyone', 'hidetag'].includes(command)) {
        const mentions = participants.map(p => p.id)
        const msg = text || 'Hello everyone!'
        if (command === 'hidetag') {
          await sock.sendMessage(m.key.remoteJid, { text: msg, mentions }, { quoted: m })
        } else {
          let txt = `📢 *TAG ALL*\n\n${msg}\n\n`
          participants.forEach((p, i) => txt += `\( {i + 1}. @ \){p.id.split('@')[0]}\n`)
          await sock.sendMessage(m.key.remoteJid, { text: txt, mentions }, { quoted: m })
        }
        return
      }

      // .admins / .listadmin
      if (['admins', 'listadmin'].includes(command)) {
        const admins = participants.filter(p => p.admin)
        return reply(`👑 *GROUP ADMINS*\n\n\( {admins.map(a => `@ \){a.id.split('@')[0]}`).join('\n') || 'No admins'}`, { mentions: admins.map(a => a.id) })
      }

      // .groupinfo
      if (command === 'groupinfo') {
        return reply(`📋 *GROUP INFO*\n\nName: ${metadata.subject}\nOwner: ${metadata.owner ? '@' + metadata.owner.split('@')[0] : 'Unknown'}\nMembers: ${participants.length}\nAdmins: ${participants.filter(p => p.admin).length}\nCreated: ${new Date(metadata.creation * 1000).toLocaleString()}\nDesc: ${metadata.desc || 'None'}\n\n🩺 SIMON MD`)
      }

      // .groupname / .groupdesc / .membercount
      if (command === 'groupname') return reply(`📛 Group Name: ${metadata.subject}`)
      if (command === 'groupdesc') return reply(`📝 Description: ${metadata.desc || 'None'}`)
      if (['membercount', 'members'].includes(command)) {
        return reply(`👥 Members: \( {participants.length}\n\n \){participants.map(p => `@${p.id.split('@')[0]}`).join('\n')}`, { mentions: participants.map(p => p.id) })
      }

      // .mute / .close / .open / .unmute
      if (['mute', 'close'].includes(command)) {
        await sock.groupSettingUpdate(m.key.remoteJid, 'announcement')
        return reply(`🔒 Group closed — Only admins can send messages`)
      }
      if (['unmute', 'open'].includes(command)) {
        await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement')
        return reply(`🔓 Group opened — Everyone can send messages`)
      }

      // .revoke / .newlink / .resetlink / .invite
      if (['revoke', 'newlink', 'resetlink', 'invite'].includes(command)) {
        await sock.groupRevokeInvite(m.key.remoteJid)
        const code = await sock.groupInviteCode(m.key.remoteJid)
        return reply(`🔗 *NEW GROUP LINK*\n\nhttps://chat.whatsapp.com/${code}\n\n🩺 SIMON MD`)
      }

      // .leave
      if (command === 'leave') {
        await sock.groupLeave(m.key.remoteJid)
        return
      }

      // .setname / .setsubject
      if (['setname', 'setsubject'].includes(command)) {
        if (!text) return reply(`Usage: .${command} <new name>`)
        await sock.groupUpdateSubject(m.key.remoteJid, text)
        return reply(`✅ Group name changed to: ${text}`)
      }

      // .setdesc
      if (command === 'setdesc') {
        if (!text) return reply(`Usage: .setdesc <new description>`)
        await sock.groupUpdateDescription(m.key.remoteJid, text)
        return reply(`✅ Description updated!`)
      }

      // .setgrouppic
      if (command === 'setgrouppic') {
        return reply(`Reply an image with .setgrouppic to change group photo\n\n🩺`)
      }

      // .getgrouppic
      if (command === 'getgrouppic') {
        try {
          const url = await sock.profilePictureUrl(m.key.remoteJid, 'image')
          await sock.sendMessage(m.key.remoteJid, { 
            image: { url }, 
            caption: `🖼️ Group Profile Picture\n\n🩺 SIMON MD` 
          }, { quoted: m })
        } catch {
          reply(`❌ No group picture or it's private`)
        }
        return
      }

      // .listmember
      if (command === 'listmember') {
        let txt = `👥 *ALL MEMBERS*\n${metadata.subject}\n\n`
        participants.forEach((p, i) => txt += `\( {i + 1}. @ \){p.id.split('@')[0]} ${p.admin ? '(ADMIN)' : ''}\n`)
        await sock.sendMessage(m.key.remoteJid, { text: txt, mentions: participants.map(p => p.id) }, { quoted: m })
        return
      }

      // .tagadmin
      if (command === 'tagadmin') {
        const admins = participants.filter(p => p.admin)
        await sock.sendMessage(m.key.remoteJid, { 
          text: `👑 *TAG ADMINS*\n\n\( {text || ''}\n\n \){admins.map(a => `@${a.id.split('@')[0]}`).join(' ')}`, 
          mentions: admins.map(a => a.id) 
        }, { quoted: m })
        return
      }

      // .poll
      if (command === 'poll') {
        if (!text.includes('|')) return reply(`Usage: .poll Question | Option1 | Option2 | Option3`)
        const [q, ...opts] = text.split('|').map(s => s.trim())
        await sock.sendMessage(m.key.remoteJid, { 
          poll: { name: q, values: opts, selectableCount: 1 } 
        }, { quoted: m })
        return
      }

      // .approve / .reject / .requests
      if (['approve', 'reject', 'requests'].includes(command)) {
        if (command === 'requests') {
          const reqs = await sock.groupRequestParticipantsList(m.key.remoteJid).catch(() => [])
          return reply(`📩 Pending Requests: \( {reqs.length}\n\n \){reqs.map(r => r.jid).join('\n') || 'None'}`)
        }
        if (command === 'approve') {
          const reqs = await sock.groupRequestParticipantsList(m.key.remoteJid).catch(() => [])
          for (let r of reqs) await sock.groupRequestParticipantsUpdate(m.key.remoteJid, [r.jid], 'approve')
          return reply(`✅ Approved ${reqs.length} requests`)
        }
        if (command === 'reject') {
          const reqs = await sock.groupRequestParticipantsList(m.key.remoteJid).catch(() => [])
          for (let r of reqs) await sock.groupRequestParticipantsUpdate(m.key.remoteJid, [r.jid], 'reject')
          return reply(`❌ Rejected ${reqs.length} requests`)
        }
      }

    } catch (e) {
      reply(`❌ Group Error: ${e.message}\nMake sure the bot is admin! 🩺`)
    }
  }
  }
