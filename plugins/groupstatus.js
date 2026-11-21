// 🛡️ SIMON MD - Post to Group Status
// Posts media/text to Group Status of all groups where bot is admin

const fs = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style

function normId(id = '') {
  return String(id).split(':')[0].split('@')[0]
}

function isAdmin(participants, id) {
  if (!participants || !id) return false
  const base = normId(id)
  const p = participants.find(x =>
    normId(x.id) === base || normId(x.lid || '') === base
  )
  return !!(p?.admin === 'admin' || p?.admin === 'superadmin')
}

module.exports = {
  command: ['groupstatus', 'gcstatus', 'postgcstatus', 'statusgc'],

  execute: async (sock, m, { command, text }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid

    try { await reactAwait(sock, jid, m.key) } catch {}

    // Owner only
    let isOwner = false
    try {
      const ow = require('./owner')
      if (ow.isRealOwner) isOwner = ow.isRealOwner(sender, sock)
    } catch {}

    if (!isOwner) {
      try { await reactDone(sock, jid, m.key) } catch {}
      return
    }

    const treply = async (title, lines) => {
      await sock.sendMessage(jid, {
        text: box(title, Array.isArray(lines) ? lines : [lines])
      }, { quoted: m })
      try { await reactCmd(sock, jid, m.key, command) } catch {}
      try { await reactDone(sock, jid, m.key) } catch {}
    }

    try {
      // Get media from reply or current message
      const ctx = m.message?.extendedTextMessage?.contextInfo || {}
      const quoted = ctx.quotedMessage

      let mediaType = null
      let mediaMsg = null
      let caption = text || ''

      if (quoted?.imageMessage) {
        mediaType = 'image'
        mediaMsg = quoted.imageMessage
        caption = caption || quoted.imageMessage.caption || ''
      } else if (quoted?.videoMessage) {
        mediaType = 'video'
        mediaMsg = quoted.videoMessage
        caption = caption || quoted.videoMessage.caption || ''
      } else if (m.message?.imageMessage) {
        mediaType = 'image'
        mediaMsg = m.message.imageMessage
        caption = caption || m.message.imageMessage.caption || ''
      } else if (m.message?.videoMessage) {
        mediaType = 'video'
        mediaMsg = m.message.videoMessage
        caption = caption || m.message.videoMessage.caption || ''
      }

      if (!mediaType && !text) {
        return treply('Group Status', [
          line('usage1', '.groupstatus <text>'),
          line('usage2', 'Reply image/video + .groupstatus'),
          line('info', 'Posts to Group Status of all groups where bot is admin')
        ])
      }

      // Download media if exists
      let buffer = null
      if (mediaMsg) {
        const stream = await downloadContentFromMessage(mediaMsg, mediaType)
        buffer = Buffer.from([])
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }
      }

      // Get all groups
      const groups = await sock.groupFetchAllParticipating().catch(() => ({}))
      const groupIds = Object.keys(groups)

      let success = 0
      let failed = 0
      let skipped = 0

      await treply('Group Status', [
        line('status', 'Starting to post...'),
        line('total', `${groupIds.length} groups found`)
      ])

      for (const gid of groupIds) {
        try {
          const meta = groups[gid]
          const participants = meta?.participants || []

          // Check if bot is admin
          const botIsAdmin = isAdmin(participants, sock.user.id) ||
            (sock.user.lid && isAdmin(participants, sock.user.lid))

          if (!botIsAdmin) {
            skipped++
            continue
          }

          // Post to Group Status
          // Note: True Group Status support in Baileys is still limited.
          // This sends as a normal message with status-like behavior where possible.

          if (mediaType === 'image' && buffer) {
            await sock.sendMessage(gid, {
              image: buffer,
              caption: caption || 'Group Status Update'
            })
          } else if (mediaType === 'video' && buffer) {
            await sock.sendMessage(gid, {
              video: buffer,
              caption: caption || 'Group Status Update'
            })
          } else {
            await sock.sendMessage(gid, {
              text: caption || text
            })
          }

          success++
          // Small delay to avoid spam detection
          await new Promise(r => setTimeout(r, 1200))

        } catch (e) {
          failed++
          console.log('[GROUP STATUS]', gid, e.message)
        }
      }

      return treply('Group Status Finished', [
        line('success', `${success}`),
        line('failed', `${failed}`),
        line('skipped', `${skipped} (bot not admin)`),
        line('note', 'Posted to groups where bot is admin')
      ])

    } catch (e) {
      return treply('Group Status Error', [line('error', e.message)])
    }
  }
}
