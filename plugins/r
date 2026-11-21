// 🛡️ SIMON MD - Delete For Everyone | Made for connection.js - NO EDIT NEEDED
const fs = require('fs')
const path = require('path')

function normId(id = '') { return String(id).split(':')[0].split('@')[0] }
function isOwner(sender) { return normId(sender) === '239166265317' }

function isAdmin(participants, id) {
  if (!participants || !id) return false
  const base = normId(id)
  const p = participants.find(x => normId(x.id) === base || normId(x.lid || '') === base)
  return !!(p?.admin === 'admin' || p?.admin === 'superadmin')
}

const COMMANDS = ['r', 'del', 'delete', 'revoke']

module.exports = {
  name: 'r',
  alias: COMMANDS,
  command: COMMANDS,
  category: 'group',
  desc: 'Reply to anything delete from everyone instantly',
  attachEngine: (sock) => { if (sock) console.log('[R] Engine loaded ✅') },
  __call: (sock) => { if (sock) console.log('[R] Engine loaded ✅') },

  // connection.js go call am like execute(sock, m, {command, text, args})
  execute: async (sock, m, { command, text, args }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const cmd = (command || '').toLowerCase()
    const reply = async (txt, mentions = []) => { await sock.sendMessage(jid, { text: txt, mentions }, { quoted: m }) }

    if (!jid.endsWith('@g.us')) { await reply('❌ This command only works in groups'); return }

    let metadata
    try { metadata = await sock.groupMetadata(jid) } catch { metadata = { participants: [] } }
    const participants = metadata.participants || []
    const botAdmin = isAdmin(participants, sock.user.id) || (sock.user.lid && isAdmin(participants, sock.user.lid))
    const senderAdmin = isAdmin(participants, sender)
    const owner = isOwner(sender)

    // Only admin or owner can use it - WhatsApp rule
    if (!senderAdmin && !owner) { await reply('❌ Only admin can use this command'); return }
    if (!botAdmin) { await reply('❌ Bot needs admin to delete for everyone'); return }

    try {
      if (COMMANDS.includes(cmd)) {
        // Get the quoted message - reply to anything
        const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || m.message?.stickerMessage?.contextInfo || m.message?.documentMessage?.contextInfo || {}
        
        const quotedId = ctx.stanzaId
        const quotedParticipant = ctx.participant
        const quotedMessage = ctx.quotedMessage

        if (!quotedId || !quotedParticipant) {
          await reply('Usage: Reply to any message with .r')
          return
        }

        // Delete for everyone instantly
        await sock.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: false,
            id: quotedId,
            participant: quotedParticipant
          }
        })

        // Delete your .r command too so nobody sees it
        await sock.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: true,
            id: m.key.id,
            participant: sock.user.id
          }
        }).catch(() => {})

        return
      }

    } catch (e) {
      if (e.message?.includes('not admin') || e.message?.includes('403')) { await reply('❌ Bot is not admin, e no fit do am'); return }
      await reply(`❌ Delete Error: ${e.message}`)
    }
  }
}
