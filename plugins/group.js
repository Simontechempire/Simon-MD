// 🛡️ SIMON MD - Group Management Plugin (Clean Version)
const fs = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

function normId(id = '') {
  return String(id).split(':')[0].split('@')[0]
}

function getTarget(m, text) {
  const ctx = m.message?.extendedTextMessage?.contextInfo ||
    m.message?.imageMessage?.contextInfo ||
    m.message?.videoMessage?.contextInfo || {}

  if (ctx.mentionedJid?.[0]) return ctx.mentionedJid[0]
  if (ctx.participant) return ctx.participant

  const num = String(text || '').replace(/[^0-9]/g, '')
  if (num.length >= 8) return num + '@s.whatsapp.net'
  return null
}

function isAdmin(participants, id) {
  if (!participants || !id) return false
  const base = normId(id)
  const p = participants.find(x => normId(x.id) === base || normId(x.lid || '') === base)
  return !!(p?.admin === 'admin' || p?.admin === 'superadmin')
}

module.exports = {
  command: [
    'kick', 'add', 'promote', 'demote', 'tagall', 'hidetag', 'admins', 'groupinfo',
    'mute', 'unmute', 'open', 'close', 'revoke', 'newlink', 'resetlink', 'invite',
    'join', 'leave', 'setname', 'setdesc', 'setsubject', 'setgrouppic', 'getgrouppic',
    'groupname', 'groupdesc', 'membercount', 'members', 'listonline', 'listadmin', 'listmember',
    'everyone', 'tagadmin', 'tagmember', 'kickall', 'promoteall', 'demoteall', 'group',
    'welcome', 'goodbye', 'setwelcome', 'setgoodbye', 'delwelcome', 'delgoodbye',
    'approve', 'reject', 'requests', 'poll', 'vote', 'gstatus'
  ],

  execute: async (sock, m, { command, text }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    try { await reactAwait(sock, jid, m.key) } catch {}

    // Group only
    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, {
        text: box('Group Only', [line('error', 'This command only works in groups')])
      }, { quoted: m })
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    let metadata
    try {
      metadata = await sock.groupMetadata(jid)
    } catch {
      metadata = { participants: [], subject: 'Unknown', desc: '' }
    }

    const participants = metadata.participants || []
    const botBase = normId(sock.user.id)
    const botJid = botBase + '@s.whatsapp.net'
    const botAdmin = isAdmin(participants, botJid) || isAdmin(participants, sock.user.lid)
    const senderAdmin = isAdmin(participants, sender)

    // Owner check
    let isOwner = false
    try {
      const ow = require('./owner')
      if (ow.isRealOwner) isOwner = ow.isRealOwner(sender, sock)
    } catch {}

    const adminOnly = [
      'kick', 'add', 'promote', 'demote', 'mute', 'unmute', 'open', 'close',
      'revoke', 'newlink', 'resetlink', 'setname', 'setdesc', 'setsubject',
      'setgrouppic', 'kickall', 'promoteall', 'demoteall', 'approve', 'reject'
    ]

    if (adminOnly.includes(command) && !senderAdmin && !isOwner) {
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    const treply = async (title, lines, mentions = []) => {
      const body = Array.isArray(lines) ? lines : [lines]
      await sock.sendMessage(jid, {
        text: box(title, body),
        mentions
      }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
    }

    try {
      // ==================== KICK ====================
      if (command === 'kick') {
        const target = getTarget(m, text)
        if (!target) return treply('Kick', [line('usage', '.kick @user or reply')])
        if (!botAdmin) return treply('Kick', [line('error', 'Bot needs admin')])
        if (isAdmin(participants, target)) return treply('Kick', [line('error', 'Cannot kick an admin')])
        if (normId(target) === botBase) return treply('Kick', [line('error', 'Cannot kick the bot')])

        await sock.groupParticipantsUpdate(jid, [target], 'remove')
        return treply('Kicked', [
          line('user', `@${normId(target)}`),
          line('status', 'Removed from group')
        ], [target])
      }

      // ==================== ADD ====================
      if (command === 'add') {
        if (!text) return treply('Add', [line('usage', '.add 234xxxxxxxxxx')])
        if (!botAdmin) return treply('Add', [line('error', 'Bot needs admin')])

        const user = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        await sock.groupParticipantsUpdate(jid, [user], 'add')
        return treply('Added', [
          line('user', `@${normId(user)}`),
          line('status', 'Added to group')
        ], [user])
      }

      // ==================== PROMOTE ====================
      if (command === 'promote') {
        const user = getTarget(m, text)
        if (!user) return treply('Promote', [line('usage', '.promote @user or reply')])
        if (!botAdmin) return treply('Promote', [line('error', 'Bot needs admin')])

        await sock.groupParticipantsUpdate(jid, [user], 'promote')
        return treply('Promoted', [
          line('user', `@${normId(user)}`),
          line('status', 'Now Admin')
        ], [user])
      }

      // ==================== DEMOTE ====================
      if (command === 'demote') {
        const user = getTarget(m, text)
        if (!user) return treply('Demote', [line('usage', '.demote @user or reply')])
        if (!botAdmin) return treply('Demote', [line('error', 'Bot needs admin')])

        await sock.groupParticipantsUpdate(jid, [user], 'demote')
        return treply('Demoted', [
          line('user', `@${normId(user)}`),
          line('status', 'Removed from Admin')
        ], [user])
      }

      // ==================== KICKALL ====================
      if (command === 'kickall') {
        if (!botAdmin) return treply('Kickall', [line('error', 'Bot needs admin')])
        const targets = participants.filter(p =>
          !p.admin &&
          normId(p.id) !== botBase &&
          normId(p.id) !== normId(sender)
        )
        for (const t of targets) {
          await sock.groupParticipantsUpdate(jid, [t.id], 'remove').catch(() => {})
        }
        return treply('Kickall', [line('status', `Kicked ${targets.length} members`)])
      }

      // ==================== PROMOTEALL ====================
      if (command === 'promoteall') {
        if (!botAdmin) return treply('Promoteall', [line('error', 'Bot needs admin')])
        const targets = participants.filter(p => !p.admin)
        for (const t of targets) {
          await sock.groupParticipantsUpdate(jid, [t.id], 'promote').catch(() => {})
        }
        return treply('Promoteall', [line('status', `Promoted ${targets.length} members`)])
      }

      // ==================== DEMOTEALL ====================
      if (command === 'demoteall') {
        if (!botAdmin) return treply('Demoteall', [line('error', 'Bot needs admin')])
        const targets = participants.filter(p => p.admin && normId(p.id) !== botBase)
        for (const t of targets) {
          await sock.groupParticipantsUpdate(jid, [t.id], 'demote').catch(() => {})
        }
        return treply('Demoteall', [line('status', `Demoted ${targets.length} admins`)])
      }

      // ==================== TAGALL / HIDETAG ====================
      if (['tagall', 'everyone', 'hidetag'].includes(command)) {
        const mentions = participants.map(p => p.id)
        const msg = text || 'Hello everyone!'

        if (command === 'hidetag') {
          await sock.sendMessage(jid, { text: tiny(msg), mentions }, { quoted: m })
        } else {
          const list = participants.map((p, i) =>
            `\( {String(i + 1).padStart(2, '0')} › @ \){normId(p.id)}`
          ).join('\n')
          await sock.sendMessage(jid, {
            text: box('Tag All', [
              line('members', `${participants.length}`),
              line('message', msg),
              '',
              list
            ]),
            mentions
          }, { quoted: m })
        }
        try { await reactCmd(sock, jid, m.key, command) } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

      // ==================== ADMINS ====================
      if (['admins', 'listadmin'].includes(command)) {
        const admins = participants.filter(p => p.admin)
        const body = admins.length
          ? admins.map((a, i) => `\( {String(i + 1).padStart(2, '0')} › @ \){normId(a.id)}`).join('\n')
          : 'No admins found'
        return treply(`Admins (${admins.length})`, body, admins.map(a => a.id))
      }

      // ==================== GROUP INFO ====================
      if (['groupinfo', 'group', 'gstatus'].includes(command)) {
        return treply('Group Info', [
          line('name', metadata.subject),
          line('owner', metadata.owner ? `@${normId(metadata.owner)}` : 'Unknown'),
          line('members', `${participants.length}`),
          line('admins', `${participants.filter(p => p.admin).length}`),
          line('created', metadata.creation ? new Date(metadata.creation * 1000).toLocaleString() : 'Unknown'),
          line('desc', metadata.desc || 'None')
        ])
      }

      if (command === 'groupname') return treply('Group Name', [line('name', metadata.subject)])
      if (command === 'groupdesc') return treply('Group Desc', [line('desc', metadata.desc || 'None')])

      // ==================== MEMBERS ====================
      if (['membercount', 'members', 'listmember'].includes(command)) {
        const body = participants.map((p, i) =>
          `\( {String(i + 1).padStart(2, '0')} › @ \){normId(p.id)}${p.admin ? ' [ADMIN]' : ''}`
        ).join('\n')
        return treply(`Members (${participants.length})`, body, participants.map(p => p.id))
      }

      if (command === 'listonline') {
        return treply('List Online', [
          line('info', 'Baileys cannot get real-time online list'),
          line('total', `${participants.length} members`),
          line('tip', 'Use .members to see everyone')
        ])
      }

      // ==================== MUTE / UNMUTE ====================
      if (['mute', 'close'].includes(command)) {
        if (!botAdmin) return treply('Mute', [line('error', 'Bot needs admin')])
        await sock.groupSettingUpdate(jid, 'announcement')
        return treply('Group Closed', [line('status', 'Only admins can send messages')])
      }

      if (['unmute', 'open'].includes(command)) {
        if (!botAdmin) return treply('Unmute', [line('error', 'Bot needs admin')])
        await sock.groupSettingUpdate(jid, 'not_announcement')
        return treply('Group Opened', [line('status', 'Everyone can send messages')])
      }

      // ==================== LINK ====================
      if (['revoke', 'newlink', 'resetlink', 'invite'].includes(command)) {
        if (!botAdmin) return treply('Link', [line('error', 'Bot needs admin')])
        await sock.groupRevokeInvite(jid)
        const code = await sock.groupInviteCode(jid)
        return treply('New Group Link', [line('link', `https://chat.whatsapp.com/${code}`)])
      }

      // ==================== LEAVE ====================
      if (command === 'leave') {
        await treply('Leave', [line('status', 'Leaving group...')])
        await sock.groupLeave(jid)
        return
      }

      // ==================== JOIN ====================
      if (command === 'join') {
        if (!text) return treply('Join', [line('usage', '.join https://chat.whatsapp.com/XXXX')])
        const code = String(text).split('/').pop().trim()
        try {
          await sock.groupAcceptInvite(code)
          return treply('Join', [line('status', 'Successfully joined the group')])
        } catch (e) {
          return treply('Join', [line('error', e.message)])
        }
      }

      // ==================== SET NAME / DESC ====================
      if (['setname', 'setsubject'].includes(command)) {
        if (!text) return treply('Set Name', [line('usage', `.${command} New Group Name`)])
        if (!botAdmin) return treply('Set Name', [line('error', 'Bot needs admin')])
        await sock.groupUpdateSubject(jid, text)
        return treply('Name Changed', [line('new', text)])
      }

      if (command === 'setdesc') {
        if (!text) return treply('Set Desc', [line('usage', '.setdesc New description')])
        if (!botAdmin) return treply('Set Desc', [line('error', 'Bot needs admin')])
        await sock.groupUpdateDescription(jid, text)
        return treply('Description Updated', [line('status', 'Success')])
      }

      // ==================== GROUP PICTURE ====================
      if (command === 'setgrouppic') {
        if (!botAdmin) return treply('Set Pic', [line('error', 'Bot needs admin')])

        const ctx = m.message?.extendedTextMessage?.contextInfo || {}
        const quoted = ctx.quotedMessage?.imageMessage ||
          ctx.quotedMessage?.viewOnceMessage?.message?.imageMessage ||
          ctx.quotedMessage?.viewOnceMessageV2?.message?.imageMessage
        const direct = m.message?.imageMessage
        const imgMsg = quoted || direct

        if (!imgMsg) return treply('Set Pic', [line('usage', 'Reply an image with .setgrouppic')])

        try {
          const stream = await downloadContentFromMessage(imgMsg, 'image')
          let buf = Buffer.from([])
          for await (const chunk of stream) buf = Buffer.concat([buf, chunk])
          await sock.updateProfilePicture(jid, buf)
          return treply('Group Picture', [line('status', 'Updated successfully')])
        } catch (e) {
          return treply('Group Picture', [line('error', e.message)])
        }
      }

      if (command === 'getgrouppic') {
        try {
          const url = await sock.profilePictureUrl(jid, 'image')
          await sock.sendMessage(jid, {
            image: { url },
            caption: box('Group Picture', [])
          }, { quoted: m })
          try { await reactCmd(sock, jid, m.key, command) } catch {}
          try { await reactDone(sock, jid, m.key) } catch {}
        } catch {
          return treply('Group Picture', [line('error', 'No picture or private')])
        }
        return
      }

      // ==================== TAG ADMIN / MEMBER ====================
      if (command === 'tagadmin') {
        const admins = participants.filter(p => p.admin)
        await sock.sendMessage(jid, {
          text: box('Tag Admins', [text || '']),
          mentions: admins.map(a => a.id)
        }, { quoted: m })
        try { await reactCmd(sock, jid, m.key, command) } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

      if (command === 'tagmember') {
        const members = participants.filter(p => !p.admin)
        await sock.sendMessage(jid, {
          text: box('Tag Members', [text || '']),
          mentions: members.map(a => a.id)
        }, { quoted: m })
        try { await reactCmd(sock, jid, m.key, command) } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

      // ==================== POLL ====================
      if (['poll', 'vote'].includes(command)) {
        if (!text || !text.includes('|')) {
          return treply('Poll', [line('usage', '.poll Question | Option1 | Option2')])
        }
        const parts = text.split('|').map(s => s.trim()).filter(Boolean)
        const q = parts.shift()
        if (!q || parts.length < 2) {
          return treply('Poll', [line('error', 'Need question + at least 2 options')])
        }
        await sock.sendMessage(jid, {
          poll: { name: q, values: parts, selectableCount: 1 }
        }, { quoted: m })
        try { await reactCmd(sock, jid, m.key, command) } catch {}
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }

      // ==================== WELCOME / GOODBYE ====================
      if (['welcome', 'goodbye', 'setwelcome', 'setgoodbye', 'delwelcome', 'delgoodbye'].includes(command)) {
        const dbPath = path.join(__dirname, '../database/welcome.json')
        let db = {}
        try { db = JSON.parse(fs.readFileSync(dbPath)) } catch {}

        const save = () => {
          if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true })
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
        }

        if (command === 'setwelcome') {
          if (!text) return treply('Set Welcome', [line('usage', '.setwelcome Hello @user welcome to the group')])
          db[jid] = db[jid] || {}
          db[jid].welcome = text
          save()
          return treply('Welcome Set', [line('text', text)])
        }

        if (command === 'setgoodbye') {
          if (!text) return treply('Set Goodbye', [line('usage', '.setgoodbye Bye @user')])
          db[jid] = db[jid] || {}
          db[jid].goodbye = text
          save()
          return treply('Goodbye Set', [line('text', text)])
        }

        if (command === 'delwelcome') {
          if (db[jid]) delete db[jid].welcome
          save()
          return treply('Welcome', [line('status', 'Deleted')])
        }

        if (command === 'delgoodbye') {
          if (db[jid]) delete db[jid].goodbye
          save()
          return treply('Goodbye', [line('status', 'Deleted')])
        }

        if (command === 'welcome') {
          return treply('Welcome Message', [line('text', db[jid]?.welcome || 'Not set. Use .setwelcome')])
        }

        if (command === 'goodbye') {
          return treply('Goodbye Message', [line('text', db[jid]?.goodbye || 'Not set. Use .setgoodbye')])
        }
      }

      // ==================== JOIN REQUESTS ====================
      if (['approve', 'reject', 'requests'].includes(command)) {
        if (!botAdmin) return treply('Requests', [line('error', 'Bot needs admin')])
        const reqs = await sock.groupRequestParticipantsList(jid).catch(() => [])

        if (command === 'requests') {
          return treply('Pending Requests', [
            line('count', `${reqs.length}`),
            reqs.length ? reqs.map(r => `› ${r.jid || r.id}`).join('\n') : 'None'
          ])
        }

        if (command === 'approve') {
          for (const r of reqs) {
            await sock.groupRequestParticipantsUpdate(jid, [r.jid || r.id], 'approve').catch(() => {})
          }
          return treply('Approved', [line('status', `Approved ${reqs.length} requests`)])
        }

        if (command === 'reject') {
          for (const r of reqs) {
            await sock.groupRequestParticipantsUpdate(jid, [r.jid || r.id], 'reject').catch(() => {})
          }
          return treply('Rejected', [line('status', `Rejected ${reqs.length} requests`)])
        }
      }

    } catch (e) {
      if (e.message?.includes('not admin') || e.message?.includes('403')) {
        try { await reactDone(sock, jid, m.key) } catch {}
        return
      }
      await treply('Group Error', [line('error', e.message)])
    }
  }
    }
