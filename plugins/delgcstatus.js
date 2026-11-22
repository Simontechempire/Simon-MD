// 🗑️ SIMON MD - DELSTATUS - Delete Group Status / Group Post For Everyone
let style
try { style = require('../utils/style') } catch { try { style = require('./style') } catch { style = { box: (t, lines) => t + '\n' + lines.join('\n'), line: (k, v) => k + ': ' + v, reactAwait: async () => {}, reactCmd: async () => {}, reactDone: async () => {} } } }
const { box, line, reactAwait, reactCmd, reactDone } = style

module.exports = {
  command: ['delgcstatus', 'deletestatus', 'delgcpost'],
  category: 'group',
  desc: 'Delete group status/post for everyone - reply to it',

  execute: async (sock, m, { command, text }) => {
    const jid = m.key.remoteJid
    const isGroup = jid.endsWith('@g.us')
    try { await reactAwait(sock, jid, m.key) } catch {}

    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
    }

    try {
      if (!isGroup) {
        await treply('DelStatus', [line('info', 'Use this in a group only'), line('usage', 'Reply to a group status/post then .delstatus')])
        return
      }

      // 1. Must reply to the status/post
      const ctx = m.message?.extendedTextMessage?.contextInfo
      const quoted = ctx?.quotedMessage
      const stanzaId = ctx?.stanzaId
      const quotedParticipant = ctx?.participant

      if (!quoted || !stanzaId) {
        await treply('DelStatus', [
          line('error', 'Reply to the status/post first'),
          line('usage', 'Reply to post -> .delstatus'),
          line('example', 'Long press post > Reply > type .delstatus')
        ])
        return
      }

      // 2. Build the key of the message to delete
      // For group status, participant is the sender, remoteJid is the group
      const targetKey = {
        remoteJid: jid,
        fromMe: false,
        id: stanzaId,
        participant: quotedParticipant || undefined
      }

      // 3. Delete For Everyone - Real Baileys revoke
      // This is same method antilink uses, so it works
      await sock.sendMessage(jid, { delete: targetKey })

      // 4. Fallback if first method fails - try protocolMessage revoke
      // We try both to make sure it deletes
      try {
        await sock.sendMessage(jid, {
          protocolMessage: {
            key: targetKey,
            type: 0
          }
        })
      } catch {}

      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}

      // Small confirm - will auto-delete too if you want, keep it for now
      await sock.sendMessage(jid, { text: box('DelStatus', [line('status', 'Deleted for everyone ✅'), line('info', 'Group status/post removed')]) }, { quoted: m })

    } catch (e) {
      console.log('[DELSTATUS]', e.message)
      // Common errors
      if (e.message.includes('admin') || e.message.includes('403') || e.message.includes('not-authorized')) {
        await treply('DelStatus Failed', [line('error', 'Bot must be ADMIN in this group to delete for everyone'), line('fix', 'Make bot admin then try again')])
      } else if (e.message.includes('too old') || e.message.includes('time')) {
        await treply('DelStatus Failed', [line('error', 'Post too old - WhatsApp only allows delete for everyone for recent posts')])
      } else {
        await treply('DelStatus Failed', [line('error', e.message)])
      }
      try { await reactDone(sock, jid, m.key) } catch {}
    }
  }
    }
