// 🗑️ SIMON MD - DELSTATUS AUTO - No need to turn on, bot is admin = auto delete
let style
try { style = require('../utils/style') } catch { try { style = require('./style') } catch { style = { box: (t, lines) => t + '\n' + lines.join('\n'), line: (k, v) => k + ': ' + v, reactAwait: async () => {}, reactCmd: async () => {}, reactDone: async () => {} } } }
const { box, line, reactAwait, reactCmd, reactDone } = style

// If true, bot deletes group status automatically when admin - NO COMMAND NEEDED
const AUTO_DELETE = true

async function isBotAdmin(sock, jid) {
  try {
    const meta = await sock.groupMetadata(jid)
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'
    const botLid = sock.user.id.split(':')[0] + '@lid'
    const me = meta.participants.find(p => p.id === botId || p.id === botLid || p.id.includes(sock.user.id.split(':')[0]))
    return me?.admin === 'admin' || me?.admin === 'superadmin'
  } catch { return false }
}

async function isSenderAdmin(sock, jid, sender) {
  try {
    const meta = await sock.groupMetadata(jid)
    const p = meta.participants.find(x => x.id === sender || x.id.includes(sender.split('@')[0]))
    return p?.admin === 'admin' || p?.admin === 'superadmin'
  } catch { return false }
}

// Detect group status post - WhatsApp sends group status as:
// 1. statusMessage / groupStatusMessage, OR
// 2. Forwarded status (isForwarded + high forwardingScore), OR
// 3. Message from status@broadcast forwarded to group
function isGroupStatus(m) {
  const msg = m.message
  if (!msg) return false
  if (msg.statusMessage || msg.groupStatusMessage) return true
  // Check all message types for forwarded status
  const types = ['conversation', 'extendedTextMessage', 'imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage']
  for (let t of types) {
    const content = msg[t]
    if (!content) continue
    const ctx = content.contextInfo
    if (ctx?.isForwarded && ctx?.forwardingScore >= 3) return true
    // Status mention / status forwarded
    if (ctx?.mentionedJid?.includes('status@broadcast')) return true
  }
  // If message was broadcasted status (key from status)
  if (m.key.remoteJid === 'status@broadcast') return true
  return false
}

async function deleteForEveryone(sock, jid, targetKey) {
  try { await sock.sendMessage(jid, { delete: targetKey }) } catch {}
  try { await sock.sendMessage(jid, { protocolMessage: { key: targetKey, type: 0 } }) } catch {}
}

function attachEngine(sock) {
  if (sock.__delstatusEngineLoaded) return
  sock.__delstatusEngineLoaded = true

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    if (!AUTO_DELETE) return
    for (let m of messages) {
      try {
        const jid = m.key.remoteJid
        if (!jid || !jid.endsWith('@g.us')) continue
        if (m.key.fromMe) continue
        // Don't delete bot's own commands
        const text = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
        if (text.startsWith('.')) continue

        // Only delete if it's a group status post
        if (!isGroupStatus(m)) continue

        const sender = m.key.participant || jid
        // Don't delete admin / owner status - only normal members
        if (await isSenderAdmin(sock, jid, sender)) continue

        // MAIN CHECK: Bot must be admin - if bot is admin, auto delete instantly
        const botAdmin = await isBotAdmin(sock, jid)
        if (!botAdmin) continue

        const targetKey = {
          remoteJid: jid,
          fromMe: false,
          id: m.key.id,
          participant: sender
        }
        await deleteForEveryone(sock, jid, targetKey)
        console.log('[DELSTATUS AUTO] Deleted group status from', sender, 'in', jid)
      } catch (e) { console.log('[DELSTATUS AUTO]', e.message) }
    }
  })
  console.log('[DELSTATUS] Auto engine loaded - bot admin = auto delete group status')
}

module.exports = {
  command: ['delstatus', 'delgcstatus', 'deletestatus', 'delgcpost'],
  category: 'group',
  desc: 'Auto delete group status if bot is admin + manual .delstatus',
  attachEngine,
  execute: async (sock, m, { command }) => {
    const jid = m.key.remoteJid
    const isGroup = jid.endsWith('@g.us')
    try { await reactAwait(sock, jid, m.key) } catch {}
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
    }
    try {
      if (!isGroup) {
        await treply('DelStatus', [line('info', 'Use in group only')])
        return
      }
      // Manual: reply to post -> .delstatus
      const ctx = m.message?.extendedTextMessage?.contextInfo
      if (!ctx?.stanzaId) {
        await treply('DelStatus Auto', [
          line('status', AUTO_DELETE ? 'AUTO ON ✅' : 'AUTO OFF'),
          line('info', 'No need to turn on - if bot is admin, group status deletes automatically'),
          line('manual', 'Or reply to post -> .delstatus')
        ])
        return
      }
      const targetKey = { remoteJid: jid, fromMe: false, id: ctx.stanzaId, participant: ctx.participant }
      await deleteForEveryone(sock, jid, targetKey)
      await sock.sendMessage(jid, { text: box('DelStatus', [line('status', 'Deleted for everyone ✅')]) }, { quoted: m })
      try { await reactDone(sock, jid, m.key) } catch {}
    } catch (e) {
      await treply('DelStatus Failed', [line('error', 'Bot must be ADMIN to delete for everyone')])
    }
  }
}
module.exports.__call = attachEngine
