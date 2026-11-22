// 🛡️ SIMON MD - Group Management | FIXED - No Crash
const fs = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

function normId(id = '') { return String(id).split(':')[0].split('@')[0] }
function isOwner(sender) { return normId(sender) === '239166265317' }

function getTarget(m, text) {
  const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || {}
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

const COMMANDS = [
  'kick', 'add', 'promote', 'demote', 'tagall', 'hidetag', 'admins', 'groupinfo',
  'closegc', 'mute', 'unmute', 'open', 'close', 'revoke', 'newlink', 'resetlink', 'invite',
  'join', 'leave', 'setname', 'setdesc', 'setsubject', 'setgrouppic', 'getgrouppic',
  'groupname', 'groupdesc', 'membercount', 'members', 'listonline', 'listadmin', 'listmember',
  'everyone', 'tagadmin', 'tagmember', 'kickall', 'promoteall', 'demoteall', 'group',
  'welcome', 'goodbye', 'setwelcome', 'setgoodbye', 'delwelcome', 'delgoodbye',
  'approve', 'reject', 'requests', 'poll', 'vote', 'gstatus'
]

module.exports = {
  name: 'group',
  alias: COMMANDS,
  command: COMMANDS,
  category: 'group',
  desc: 'Group management',
  attachEngine: (sock) => { if (sock) console.log('[GROUP] Engine loaded ✅') },
  __call: (sock) => { if (sock) console.log('[GROUP] Engine loaded ✅') },

  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const input = (text || args?.join(' ') || '').trim()
    const cmd = (command || '').toLowerCase()
    const reply = async (txt, mentions = []) => { await sock.sendMessage(jid, { text: txt, mentions }, { quoted: m }) }

    if (!jid.endsWith('@g.us')) { await reply('❌ This command only works in groups'); return }

    let metadata
    try { metadata = await sock.groupMetadata(jid) } catch { metadata = { participants: [], subject: 'Unknown', desc: '' } }
    const participants = metadata.participants || []
    const botBase = normId(sock.user.id)
    const botAdmin = isAdmin(participants, sock.user.id) || (sock.user.lid && isAdmin(participants, sock.user.lid))
    const senderAdmin = isAdmin(participants, sender)
    const owner = isOwner(sender)

    const adminOnly = ['kick', 'add', 'promote', 'demote', 'mute', 'unmute', 'open', 'close', 'closegc', 'revoke', 'newlink', 'resetlink', 'setname', 'setdesc', 'setsubject', 'setgrouppic', 'kickall', 'promoteall', 'demoteall', 'approve', 'reject', 'setwelcome', 'setgoodbye', 'delwelcome', 'delgoodbye']

    if (adminOnly.includes(cmd) && !senderAdmin && !owner) { await reply('❌ Only admin can use this command'); return }

    try {
      if (cmd === 'kick') {
        const target = getTarget(m, input)
        if (!target) return reply('Usage: .kick @user or reply')
        if (!botAdmin) return reply('❌ Bot needs admin')
        if (isAdmin(participants, target)) return reply('❌ Cannot kick an admin')
        if (normId(target) === botBase) return reply('❌ Cannot kick the bot')
        await sock.groupParticipantsUpdate(jid, [target], 'remove')
        return reply(`✅ Kicked @${normId(target)}`, [target])
      }

      if (cmd === 'add') {
        if (!input) return reply('Usage: .add 234xxxxxxxxxx')
        if (!botAdmin) return reply('❌ Bot needs admin')
        const user = input.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        await sock.groupParticipantsUpdate(jid, [user], 'add')
        return reply(`✅ Added @${normId(user)}`, [user])
      }

      if (cmd === 'promote') {
        const user = getTarget(m, input)
        if (!user) return reply('Usage: .promote @user or reply')
        if (!botAdmin) return reply('❌ Bot needs admin')
        await sock.groupParticipantsUpdate(jid, [user], 'promote')
        return reply(`✅ Promoted @${normId(user)} to Admin`, [user])
      }

      if (cmd === 'demote') {
        const user = getTarget(m, input)
        if (!user) return reply('Usage: .demote @user or reply')
        if (!botAdmin) return reply('❌ Bot needs admin')
        await sock.groupParticipantsUpdate(jid, [user], 'demote')
        return reply(`✅ Demoted @${normId(user)}`, [user])
      }

      if (cmd === 'kickall') {
        if (!botAdmin) return reply('❌ Bot needs admin')
        const targets = participants.filter(p => !p.admin && normId(p.id) !== botBase && normId(p.id) !== normId(sender))
        for (const t of targets) await sock.groupParticipantsUpdate(jid, [t.id], 'remove').catch(() => {})
        return reply(`✅ Kicked ${targets.length} members`)
      }

      if (cmd === 'promoteall') {
        if (!botAdmin) return reply('❌ Bot needs admin')
        const targets = participants.filter(p => !p.admin)
        for (const t of targets) await sock.groupParticipantsUpdate(jid, [t.id], 'promote').catch(() => {})
        return reply(`✅ Promoted ${targets.length} members`)
      }

      if (cmd === 'demoteall') {
        if (!botAdmin) return reply('❌ Bot needs admin')
        const targets = participants.filter(p => p.admin && normId(p.id) !== botBase)
        for (const t of targets) await sock.groupParticipantsUpdate(jid, [t.id], 'demote').catch(() => {})
        return reply(`✅ Demoted ${targets.length} admins`)
      }

      if (['tagall', 'everyone', 'hidetag'].includes(cmd)) {
        const mentions = participants.map(p => p.id)
        const msg = input || 'Hello everyone!'
        if (cmd === 'hidetag') {
          await sock.sendMessage(jid, { text: msg, mentions }, { quoted: m })
          return
        }
        const tinyMap = { a:'ᵃ', b:'ᵇ', c:'ᶜ', d:'ᵈ', e:'ᵉ', f:'ᶠ', g:'ᵍ', h:'ʰ', i:'ᶦ', j:'ʲ', k:'ᵏ', l:'ˡ', m:'ᵐ', n:'ⁿ', o:'ᵒ', p:'ᵖ', q:'ᑫ', r:'ʳ', s:'ˢ', t:'ᵗ', u:'ᵘ', v:'ᵛ', w:'ʷ', x:'ˣ', y:'ʸ', z:'ᶻ', A:'ᴬ', B:'ᴮ', C:'ᶜ', D:'ᴰ', E:'ᴱ', F:'ᶠ', G:'ᴳ', H:'ᴴ', I:'ᴵ', J:'ᴶ', K:'ᴷ', L:'ᴸ', M:'ᴹ', N:'ᴺ', O:'ᴼ', P:'ᴾ', Q:'ᑫ', R:'ᴿ', S:'ˢ', T:'ᵀ', U:'ᵁ', V:'ⱽ', W:'ᵂ', X:'ˣ', Y:'ʸ', Z:'ᶻ', 0:'⁰', 1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸', 9:'⁹' }
        const toTiny = (str = '') => String(str).split('').map(c => tinyMap[c] || c).join('')
        const emojis = ['🌸','🦋','🍓','⭐','🌙','🔥','💎','🦄','🍒','🌹','⚡','🍭','💫','🎀','🦊','🍑','🌺','🐝','🍩','🌻','🦚','🍇','💐','🐚','🌊','🍯','🦁','🌈','🍀','🎈','🐬','🌷','🦜','🍋','💜','🐳','🌼','🦒','🍂','🎶']
        const list = participants.map((p, i) => {
          const emoji = emojis[i % emojis.length]
          const num = String(i + 1).padStart(2, '0')
          return emoji + ' ' + num + ' › @' + normId(p.id)
        }).join('\n')
        const caption = '📢 ' + toTiny('Tag All') + '\n╭─────────────────╮\n│ ' + toTiny('Group') + ' : ' + participants.length + ' ' + toTiny('Members') + '\n│ ' + toTiny('Message') + ' : ' + toTiny(msg) + '\n╰─────────────────╯\n\n' + toTiny('Members List') + '\n' + list + '\n\n╰─ ' + toTiny('Simon Md') + ' ─╯'
        try {
          const pp = await sock.profilePictureUrl(jid, 'image')
          await sock.sendMessage(jid, { image: { url: pp }, caption, mentions }, { quoted: m })
        } catch {
          await sock.sendMessage(jid, { text: caption, mentions }, { quoted: m })
        }
        return
      }

      if (['admins', 'listadmin'].includes(cmd)) {
        const admins = participants.filter(p => p.admin)
        const body = admins.length ? admins.map((a, i) => `${String(i + 1).padStart(2, '0')} › @${normId(a.id)}`).join('\n') : 'No admins found'
        return reply(`*Admins (${admins.length})*\n${body}`, admins.map(a => a.id))
      }

      if (['groupinfo', 'group', 'gstatus'].includes(cmd)) {
        return reply(`*Group Info*\nName: ${metadata.subject}\nOwner: ${metadata.owner ? '@' + normId(metadata.owner) : 'Unknown'}\nMembers: ${participants.length}\nAdmins: ${participants.filter(p => p.admin).length}\nCreated: ${metadata.creation ? new Date(metadata.creation * 1000).toLocaleString() : 'Unknown'}\nDesc: ${metadata.desc || 'None'}`)
      }
      if (cmd === 'groupname') return reply(`Group Name: ${metadata.subject}`)
      if (cmd === 'groupdesc') return reply(`Group Desc: ${metadata.desc || 'None'}`)

      if (['membercount', 'members', 'listmember'].includes(cmd)) {
        const body = participants.map((p, i) => `${String(i + 1).padStart(2, '0')} › @${normId(p.id)}${p.admin ? ' [ADMIN]' : ''}`).join('\n')
        return reply(`*Members (${participants.length})*\n${body}`, participants.map(p => p.id))
      }

      if (cmd === 'listonline') return reply(`ℹ️ Baileys cannot get real-time online list\nTotal: ${participants.length} members\nUse .members to see everyone`)

      if (['mute', 'close', 'closegc'].includes(cmd)) {
        if (!botAdmin) return reply('❌ Bot needs admin')
        await sock.groupSettingUpdate(jid, 'announcement')
        return reply('🔒 Group Closed - Only admins can send messages')
      }
      if (['unmute', 'open'].includes(cmd)) {
        if (!botAdmin) return reply('❌ Bot needs admin')
        await sock.groupSettingUpdate(jid, 'not_announcement')
        return reply('🔓 Group Opened - Everyone can send messages')
      }

      if (['revoke', 'newlink', 'resetlink', 'invite'].includes(cmd)) {
        if (!botAdmin) return reply('❌ Bot needs admin')
        await sock.groupRevokeInvite(jid)
        const code = await sock.groupInviteCode(jid)
        return reply(`🔗 New Group Link:\nhttps://chat.whatsapp.com/${code}`)
      }

      if (cmd === 'leave') { await reply('👋 Leaving group...'); await sock.groupLeave(jid); return }

      if (cmd === 'join') {
        if (!input) return reply('Usage: .join https://chat.whatsapp.com/XXXX')
        const code = String(input).split('/').pop().trim()
        try { await sock.groupAcceptInvite(code); return reply('✅ Successfully joined the group') } catch (e) { return reply(`❌ ${e.message}`) }
      }

      if (['setname', 'setsubject'].includes(cmd)) {
        if (!input) return reply(`Usage: .${cmd} New Group Name`)
        if (!botAdmin) return reply('❌ Bot needs admin')
        await sock.groupUpdateSubject(jid, input)
        return reply(`✅ Name Changed to: ${input}`)
      }

      if (cmd === 'setdesc') {
        if (!input) return reply('Usage: .setdesc New description')
        if (!botAdmin) return reply('❌ Bot needs admin')
        await sock.groupUpdateDescription(jid, input)
        return reply('✅ Description Updated')
      }

      if (cmd === 'setgrouppic') {
        if (!botAdmin) return reply('❌ Bot needs admin')
        const ctx = m.message?.extendedTextMessage?.contextInfo || {}
        const quoted = ctx.quotedMessage?.imageMessage || ctx.quotedMessage?.viewOnceMessage?.message?.imageMessage || ctx.quotedMessage?.viewOnceMessageV2?.message?.imageMessage
        const direct = m.message?.imageMessage
        const imgMsg = quoted || direct
        if (!imgMsg) return reply('Usage: Reply an image with .setgrouppic')
        try {
          const stream = await downloadContentFromMessage(imgMsg, 'image')
          let buf = Buffer.from([])
          for await (const chunk of stream) buf = Buffer.concat([buf, chunk])
          await sock.updateProfilePicture(jid, buf)
          return reply('✅ Group Picture Updated')
        } catch (e) { return reply(`❌ ${e.message}`) }
      }

      if (cmd === 'getgrouppic') {
        try {
          const url = await sock.profilePictureUrl(jid, 'image')
          await sock.sendMessage(jid, { image: { url }, caption: '🖼️ Group Picture' }, { quoted: m })
        } catch { return reply('❌ No picture or private') }
        return
      }

      if (cmd === 'tagadmin') {
        const admins = participants.filter(p => p.admin)
        await sock.sendMessage(jid, { text: input || 'Admins 👇', mentions: admins.map(a => a.id) }, { quoted: m })
        return
      }

      if (cmd === 'tagmember') {
        const members = participants.filter(p => !p.admin)
        await sock.sendMessage(jid, { text: input || 'Members 👇', mentions: members.map(a => a.id) }, { quoted: m })
        return
      }

      if (['poll', 'vote'].includes(cmd)) {
        if (!input || !input.includes('|')) return reply('Usage: .poll Question | Option1 | Option2')
        const parts = input.split('|').map(s => s.trim()).filter(Boolean)
        const q = parts.shift()
        if (!q || parts.length < 2) return reply('❌ Need question + at least 2 options')
        await sock.sendMessage(jid, { poll: { name: q, values: parts, selectableCount: 1 } }, { quoted: m })
        return
      }

      if (['welcome', 'goodbye', 'setwelcome', 'setgoodbye', 'delwelcome', 'delgoodbye'].includes(cmd)) {
        const dbPath = path.join(__dirname, '../database/welcome.json')
        let db = {}
        try { db = JSON.parse(fs.readFileSync(dbPath)) } catch {}
        const save = () => { if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true }); fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)) }
        if (cmd === 'setwelcome') {
          if (!input) return reply('Usage: .setwelcome Hello @user welcome')
          db[jid] = db[jid] || {}; db[jid].welcome = input; save(); return reply(`✅ Welcome Set: ${input}`)
        }
        if (cmd === 'setgoodbye') {
          if (!input) return reply('Usage: .setgoodbye Bye @user')
          db[jid] = db[jid] || {}; db[jid].goodbye = input; save(); return reply(`✅ Goodbye Set: ${input}`)
        }
        if (cmd === 'delwelcome') { if (db[jid]) delete db[jid].welcome; save(); return reply('✅ Welcome Deleted') }
        if (cmd === 'delgoodbye') { if (db[jid]) delete db[jid].goodbye; save(); return reply('✅ Goodbye Deleted') }
        if (cmd === 'welcome') return reply(`Welcome: ${db[jid]?.welcome || 'Not set. Use .setwelcome'}`)
        if (cmd === 'goodbye') return reply(`Goodbye: ${db[jid]?.goodbye || 'Not set. Use .setgoodbye'}`)
      }

      if (['approve', 'reject', 'requests'].includes(cmd)) {
        if (!botAdmin) return reply('❌ Bot needs admin')
        const reqs = await sock.groupRequestParticipantsList(jid).catch(() => [])
        if (cmd === 'requests') return reply(`Pending Requests: ${reqs.length}\n${reqs.length ? reqs.map(r => `› ${r.jid || r.id}`).join('\n') : 'None'}`)
        if (cmd === 'approve') {
          for (const r of reqs) await sock.groupRequestParticipantsUpdate(jid, [r.jid || r.id], 'approve').catch(() => {})
          return reply(`✅ Approved ${reqs.length} requests`)
        }
        if (cmd === 'reject') {
          for (const r of reqs) await sock.groupRequestParticipantsUpdate(jid, [r.jid || r.id], 'reject').catch(() => {})
          return reply(`✅ Rejected ${reqs.length} requests`)
        }
      }

    } catch (e) {
      if (e.message?.includes('not admin') || e.message?.includes('403')) { await reply('❌ Bot is not admin, e no fit do am'); return }
      await reply(`❌ Group Error: ${e.message}`)
    }
  }
    }
