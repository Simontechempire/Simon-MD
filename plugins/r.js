// 🛡️ SIMON MD - Delete For Everyone | Group + Status - FINAL
const fs = require('fs')
const path = require('path')

function normId(id = '') { return String(id).split(':')[0].split('@')[0] }
function cleanId(id = '') { return String(id).split(':')[0] }
function isOwner(sender) { return normId(sender) === '239166265317' }

function getAllIds(m, sender) {
  const ids = []
  if (sender) ids.push(sender)
  if (m.key?.participant) ids.push(m.key.participant)
  if (m.key?.participantAlt) ids.push(m.key.participantAlt)
  if (m.participant) ids.push(m.participant)
  if (m.participantAlt) ids.push(m.participantAlt)
  return [...new Set(ids)]
}

function isAdmin(participants, m, sender) {
  if (!participants || !sender) return false
  const myIds = getAllIds(m, sender).map(x => normId(x))
  for (const p of participants) {
    const pIds = [p.id, p.lid, p.jid].filter(Boolean).map(x => normId(x))
    if (pIds.some(id => myIds.includes(id))) {
      if (p.admin === 'admin' || p.admin === 'superadmin') return true
    }
  }
  return false
}

function resolveJid(participants, quotedParticipant) {
  if (!quotedParticipant) return null
  const target = normId(quotedParticipant)
  for (const p of participants) {
    if (normId(p.id) === target || normId(p.lid || '') === target || normId(p.jid || '') === target) {
      return cleanId(p.id)
    }
  }
  return cleanId(quotedParticipant)
}

const COMMANDS = ['r', 'del', 'delete', 'revoke']

module.exports = {
  name: 'r',
  alias: COMMANDS,
  command: COMMANDS,
  category: 'group',
  desc: 'Reply to anything delete from everyone - Group + Status',
  attachEngine: (sock) => { if (sock) console.log('[R] Engine loaded ✅') },
  __call: (sock) => { if (sock) console.log('[R] Engine loaded ✅') },

  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || m.key.remoteJid
    const cmd = (command || '').toLowerCase()
    const reply = async (txt, mentions = []) => { await sock.sendMessage(jid, { text: txt, mentions }, { quoted: m }) }

    const isStatus = jid === 'status@broadcast'
    const isGroup = jid.endsWith('@g.us')

    if (!isStatus && !isGroup) { await reply('❌ Use this in a group or on a Status'); return }

    let participants = []
    let senderAdmin = false
    let botAdmin = false

    if (isGroup) {
      let metadata
      try { metadata = await sock.groupMetadata(jid) } catch { metadata = { participants: [] } }
      participants = metadata.participants || []
      botAdmin = isAdmin(participants, m, sock.user.id) || isAdmin(participants, m, sock.user.lid)
      senderAdmin = isAdmin(participants, m, sender)
      const owner = isOwner(sender) || getAllIds(m, sender).some(id => normId(id) === '239166265317')
      if (!senderAdmin && !owner) { await reply('❌ Only admin can use this command'); return }
      if (!botAdmin) { await reply('❌ Bot needs admin to delete for everyone'); return }
    }

    try {
      if (COMMANDS.includes(cmd)) {
        const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || m.message?.stickerMessage?.contextInfo || m.message?.documentMessage?.contextInfo || m.message?.audioMessage?.contextInfo || {}
        
        const quotedId = ctx.stanzaId
        const quotedParticipant = ctx.participant

        if (!quotedId) {
          await reply('Usage: Reply to any message/status with .r')
          return
        }

        // ===== STATUS DELETE =====
        if (isStatus) {
          const botJid = cleanId(sock.user.id)
          await sock.sendMessage('status@broadcast', {
            delete: {
              remoteJid: 'status@broadcast',
              fromMe: true,
              id: quotedId,
              participant: botJid
            }
          })
          return
        }

        // ===== GROUP DELETE =====
        const realJid = resolveJid(participants, quotedParticipant)
        const botJid = cleanId(sock.user.id)

        await sock.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: false,
            id: quotedId,
            participant: realJid
          }
        })

        // Delete your .r command too
        await sock.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: true,
            id: m.key.id,
            participant: botJid
          }
        }).catch(() => {})

        return
      }

    } catch (e) {
      await reply(`❌ Delete Error: ${e.message}`)
    }
  }
    }
