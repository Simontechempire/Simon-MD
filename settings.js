// ============================================
// SIMON MD - WhatsApp Bot Settings
// Professional • Clean • Powerful
// ============================================

module.exports = {
  // BOT INFORMATION
  botName: "SIMON MD",
  botFull: "🩺 SIMON MD",
  version: "2.5.0",
  prefix: ".",

  // OWNER (unchanged)
  ownerNumber: "239166265317",
  owner: ["239166265317", "239166265317@s.whatsapp.net", "239166265317"],
  ownerName: "Simon Tech Inc",
  company: "Simon Tech Inc",

  // LINKS
  pfpUrl: "https://files.catbox.moe/gqz6zv.jpg",
  channelLink: "https://whatsapp.com/channel/0029Vb97vPwChq6GqI44n61S",
  channelJid: "120363405065075853@newsletter",

  // SYSTEM
  totalCmd: 710,
  port: process.env.PORT || 3000,
  pairing: true,
  autoJoinChannel: true,

  // STICKER
  packName: "SIMON MD",
  packAuthor: "Simon Tech Inc",
  pack: "🩺 SIMON MD",

  // AUTO FEATURES
  auto: {
    autovv: true,
    antidelete: true,
    autoread: false,
    autotyping: false,
    autoreact: true,
    reactEmoji: "🩺"
  },

  // NSFW
  nsfw: false,

  // ECONOMY
  economy: {
    startMoney: 1000,
    dailyAmount: 5000
  },

  // MESSAGES (Clean Design)
  mess: {
    owner: "🩺 *Owner Only*\nThis command is restricted to Simon Tech Inc.",
    group: "👥 *Group Only*\nThis command can only be used in groups.",
    admin: "👑 *Admin Only*\nYou need to be a group admin.",
    botAdmin: "🤖 *Bot Admin Required*\nPlease make the bot an admin first.",
    wait: "⏳ *Processing...*\nSIMON MD is working on it.",
    done: "✅ *Done*\nCompleted by SIMON MD.",
    nsfw: "🔞 *NSFW Disabled*\nUse `.antinsfw off` to enable (Owner only).",
    viewonce: "👁️ Reply to a view-once message with `.vv` to open it."
  }
};
