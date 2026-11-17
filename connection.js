// 🩺 SIMON MD - YOUR ZENITH WORKING LINK ENGINE - CONVERTED
// ===== REPLACEMENT - CONNECT ALL - MENU + QUIZ + PROTECTION + AUTO + GROUP + VV + CONVERT =====
// RULES: Don't change other files. This file only. Menu = menu only, not cmd.
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  downloadMediaMessage
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const chalk = require('chalk');
const express = require('express');
const path = require('path');
const fs = require('fs');

// SIMON CONFIG - YOUR NUMBER
let config;
try { config = require('./settings'); } catch {
  config = { botName: "SIMON MD", ownerName: "Simon", ownerNumber: "239166265317", prefix: ".", sessionName: "session", PORT: process.env.PORT || 10000 };
}
config.ownerNumber = "239166265317";
config.botName = "🩺 SIMON MD";
config.sessionName = "session";

global.sock = null; global.isConnected = false; global.connectionStatus = '⚠️ NOT LINKED'; global.pairingCode = null; global.currentPairingNumber = null; global.lastPairTime = 0; global.appStarted = false;

global.db = global.db || {};
global.db.groups = global.db.groups || {};
global.db.settings = global.db.settings || { prefix: ".", mode: "public", autoread: false, autostatus: true, autovv: true, autolike: false, autoreact: false, autotyping: false, autopresence: false, autoreply: false, anticall: true };
global.db.banned = global.db.banned || [];
global.db.warnings = global.db.warnings || {};
global.db.messages = global.db.messages || {};
global.db.spam = global.db.spam || {};
global.db.sudo = global.db.sudo || [config.ownerNumber + '@s.whatsapp.net', "239166265317@s.whatsapp.net"];

function getGroup(jid){
  global.db.groups[jid] = global.db.groups[jid] || { antilink:false, antibot:false, antispam:false, antiviewonce:true, antidelete:true, welcome:false, goodbye:false, welcomeText:"", goodbyeText:"" };
  return global.db.groups[jid];
}

global.plugins=new Map();
global.wolfCommands={};

// ===== ADDED - REAL ENGINE CONNECT - NO LOGIC CHANGED =====
function attachRealEngines(sock){
  try{
    if(!sock) return
    if(sock.__simonRealEnginesAttached) return
    sock.__simonRealEnginesAttached = true
    let attached = []
    for(let [name, pl] of global.plugins.entries()){
      try{
        if(pl && typeof pl.attachEngine === 'function'){
          pl.attachEngine(sock)
          if(!attached.includes(name)) attached.push(name)
        }
        if(pl && typeof pl.__call === 'function' && !pl.__engineCalled){
          pl.__call(sock)
          pl.__engineCalled = true
        }
      }catch(e){ console.log(chalk.red(`Engine err ${name}: ${e.message}`)) }
    }
    if(attached.length) console.log(chalk.green(`⚡ SIMON REAL ENGINES CONNECTED: ${attached.join(', ')}`))
    else console.log(chalk.yellow(`⚡ SIMON REAL ENGINES: no attachEngine found yet - check plugins have attachEngine`))
  }catch(e){ console.log(chalk.red(`attachRealEngines err: ${e.message}`)) }
}
// ===== END ADDED =====

// ===== ADDED - CONNECT ALL - FIND PLUGIN BY NAME FOR BUTTON/POLL HANDLING =====
// Your loader stores plugins by command (e.g. 'quiz' -> plugin, 'menu' -> plugin)
// So we find them by command key. No change to loader.
function getPluginByCmd(cmd){
  try{
    // global.plugins has keys = command names (from loadPlugins)
    // For files with pl.name, key = name. For files with pl.command, keys = each cmd.
    return global.plugins.get(cmd) || global.plugins.get(cmd.toLowerCase()) || null
  }catch{ return null }
}
// ===== END ADDED =====

function loadPlugins(){ 
  const possiblePaths = [path.join(__dirname,'plugins'), path.join(__dirname,'../plugins'), path.join(__dirname,'src/plugins')];
  let pPath = null;
  for(const pp of possiblePaths){ if(fs.existsSync(pp)){ pPath=pp; break; } }
  if(!pPath) { console.log(chalk.red('No plugins folder found')); return; }
  global.plugins.clear(); 
  global.wolfCommands={};
  let t=0; 
  function rd(dir){ 
    const items=fs.readdirSync(dir); 
    for(const it of items){ 
      const full=path.join(dir,it); 
      const st=fs.statSync(full); 
      if(st.isDirectory()) rd(full); 
      else if(it.endsWith('.js')){ 
        try{ 
          delete require.cache[require.resolve(full)]; 
          const d=require(full); 
          const arr=Array.isArray(d)?d:[d]; 
          for(const pl of arr){ 
            if(pl&&pl.name&&pl.execute){ 
              global.plugins.set(pl.name.toLowerCase(),pl); 
              global.wolfCommands[pl.name.toLowerCase()]=pl.execute;
              if(pl.alias) for(const a of pl.alias) {
                global.plugins.set(a.toLowerCase(),pl);
                global.wolfCommands[a.toLowerCase()]=pl.execute;
              }
              t++; 
            } else if(pl&&pl.command&&pl.execute){
              for(const cmd of pl.command){
                const clean=cmd.toLowerCase();
                global.plugins.set(clean, pl);
                global.wolfCommands[clean]=pl.execute;
                global.wolfCommands[clean.replace(/[^a-z0-9]/g,'')]=pl.execute;
              }
              t++;
            }
          } 
        }catch(e){ console.log(`Load err ${it}: ${e.message}`)} 
      } 
    } 
  } 
  rd(pPath); 
  console.log(chalk.green(`✅ SIMON WIRED ${t} files | ${Object.keys(global.wolfCommands).length} CMDS from ${pPath}`)); 
}
loadPlugins();

const groupCache=new Map();
async function getCachedMeta(sock,jid){
  const c=groupCache.get(jid); if(c && Date.now()-c.time<90000) return c.meta;
  try{ const meta=await sock.groupMetadata(jid); groupCache.set(jid,{meta,time:Date.now()}); if(groupCache.size>50) groupCache.delete(groupCache.keys().next().value); return meta; }catch{ return null; }
}

async function startConnection(){
  if(!global.appStarted){
    const app=express(); 
    app.use(express.json()); 
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(__dirname));
    app.use(express.static(path.join(__dirname,'../public')));
    
    app.get('/',(req,res)=>{
      const idx1 = path.join(__dirname,'index.html');
      const idx2 = path.join(__dirname,'../public/index.html');
      if(fs.existsSync(idx1)) return res.sendFile(idx1);
      if(fs.existsSync(idx2)) return res.sendFile(idx2);
      res.send(`<h1>🩺 SIMON MD</h1><p>Owner: 239166265317</p><p>CMDS: ${Object.keys(global.wolfCommands).length}</p><p><a href="/api/status">Status</a> | <a href="/getcode?number=239166265317">Get Code</a></p>`);
    });
    app.get('/health',(req,res)=>res.send('SIMON LIVE'));
    app.get('/api/status',(req,res)=>res.json({ botName:"SIMON MD", owner:"239166265317", status:global.connectionStatus, isConnected:global.isConnected, pairingCode:global.pairingCode, plugins:Object.keys(global.wolfCommands).length }));
    
    app.post('/api/pair',async(req,res)=>{
      try{
        let phone=(req.body.phone||req.body.number||'').replace(/[^0-9]/g,''); 
        if(phone.length<10) return res.json({success:false,message:'Enter valid number e.g 239166265317'});
        if(!global.sock) return res.json({success:false,message:'Bot starting... wait 5 sec'});
        if(global.isConnected) return res.json({success:false,message:'Already linked!'});
        const code=await global.sock.requestPairingCode(phone); 
        global.pairingCode=code; 
        global.currentPairingNumber=phone;
        global.connectionStatus=`CODE: ${code}`; 
        console.log(chalk.yellow(`🔑 SIMON CODE ${phone}: ${code}`)); 
        res.json({success:true,code});
      }catch(e){ console.log('Pair fail',e.message); res.json({success:false,message:e.message}); }
    });
    
    app.get('/getcode',async(req,res)=>{
      try{
        let phone=(req.query.number||req.query.phone||'').replace(/[^0-9]/g,'');
        if(!phone) return res.json({success:false,message:'Add ?number=239166265317'});
        if(!global.sock) return res.json({success:false,message:'Bot starting... wait 5 sec'});
        if(global.isConnected) return res.json({success:false,message:'Already linked!'});
        const code=await global.sock.requestPairingCode(phone);
        global.pairingCode=code;
        global.currentPairingNumber=phone;
        global.connectionStatus=`CODE: ${code}`;
        console.log(chalk.green.bold(`🔑 SIMON CODE ${phone}: ${code}`));
        res.json({success:true, code, phone, codeFormatted: code.match(/.{1,4}/g)?.join("-")});
      }catch(e){ console.log('Pair fail',e.message); res.json({success:false,message:e.message}); }
    });

    app.post('/api/logout',async(req,res)=>{ try{ if(global.sock) await global.sock.logout().catch(()=>{}); }catch{} try{ fs.rmSync(`./${config.sessionName}`,{recursive:true,force:true}); fs.rmSync(`./auth`,{recursive:true,force:true}); }catch{} global.sock=null; global.isConnected=false; res.json({success:true}); setTimeout(()=>initBaileys(),2000); });
    
    const PORT=config.PORT||process.env.PORT||10000; 
    app.listen(PORT,'0.0.0.0',()=>console.log(chalk.cyan(`🌐 SIMON Dashboard ${PORT} | ${Object.keys(global.wolfCommands).length} CMDS`))); 
    global.appStarted=true;
  }

  async function initBaileys(){
    try{
      const authPath=`./${config.sessionName}`;
      if((!fs.existsSync(authPath)||fs.readdirSync(authPath).length===0)&&process.env.SESSION_DATA){
        fs.mkdirSync(authPath,{recursive:true}); let d; try{ d=JSON.parse(process.env.SESSION_DATA); }catch{ d=JSON.parse(Buffer.from(process.env.SESSION_DATA,'base64').toString()); } fs.writeFileSync(path.join(authPath,'creds.json'),JSON.stringify(d,null,2));
      }
    }catch(e){}
    const {state,saveCreds}=await useMultiFileAuthState(`./${config.sessionName}`); const {version}=await fetchLatestBaileysVersion();
    const sock=makeWASocket({ version, logger:pino({level:'silent'}), printQRInTerminal:false, browser:Browsers.macOS('Safari'), auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:'silent'}))}, markOnlineOnConnect:true, connectTimeoutMs:60000, keepAliveIntervalMs:10000, syncFullHistory:false, retryRequestDelayMs:2000 });
    global.sock=sock; sock.ev.on('creds.update',saveCreds);

    attachRealEngines(sock)

    sock.ev.on('call',async(calls)=>{ for(let c of calls){ try{ if(global.db.settings.anticall) await sock.rejectCall(c.id,c.from); }catch{} } });
    sock.ev.on('messages.update',async(updates)=>{ for(let up of updates){ if(up.update.message===null){ const saved=global.db.messages[up.key.id]; if(!saved) continue; const g=getGroup(saved.from); if(!g.antidelete) continue; try{ await sock.sendMessage(saved.from,{text:`*🔍 ANTI-DELETE SIMON*\nFrom: @${saved.sender.split('@')[0]}\n> ${saved.text?.slice(0,300)}`,mentions:[saved.sender]}); }catch{} } } });

    sock.ev.on('connection.update',async(update)=>{
      const {connection,lastDisconnect}=update;
      if(connection==='connecting') global.connectionStatus='Connecting SIMON...';
      if(connection==='open'){
        global.isConnected=true; global.connectionStatus='ONLINE ✅ SIMON'; console.log(chalk.green.bold(`\n✅ SIMON ONLINE! ${Object.keys(global.wolfCommands).length} CMDS\n`)); loadPlugins();
        sock.__simonRealEnginesAttached = false
        attachRealEngines(sock)
        try{ const jid=sock.user.id; await sock.sendMessage(jid,{text:`✅ *SIMON MD LINKED*\n\n👤 ${sock.user.name||'SIMON MD'}\n🔣 Prefix: .\n⚡ ${Object.keys(global.wolfCommands).length} CMDS\n\nType .menu - Owner 239166265317`}).catch(()=>{}); }catch{}
      }
      if(connection==='close'){
        const code=lastDisconnect?.error?.output?.statusCode; console.log(chalk.red(`❌ Closed ${code}`)); global.isConnected=false; global.sock=null; groupCache.clear();
        if([DisconnectReason.loggedOut,401,440,405].includes(code)){ try{ fs.rmSync(`./${config.sessionName}`,{recursive:true,force:true}); }catch{} global.connectionStatus='LOGGED OUT'; setTimeout(()=>initBaileys(),3000); }
        else{ global.connectionStatus='Reconnecting SIMON...'; setTimeout(()=>initBaileys(),5000); }
      }
    });

    sock.ev.on('messages.upsert',async({messages,type})=>{
      try{
        if(type!=='notify') return; const m=messages[0]; if(!m?.message) return; const from=m.key.remoteJid;
        if(from==='status@broadcast'){ if(global.db.settings.autostatus){ await sock.readMessages([m.key]).catch(()=>{}); } return; }
        const sender=m.key.participant||from; const isGroup=from.endsWith('@g.us'); const body=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||m.message.videoMessage?.caption||"";
        if(m.key.id){ global.db.messages[m.key.id]={text:body,sender,from,time:Date.now(), message:m.message}; if(Object.keys(global.db.messages).length>150) delete global.db.messages[Object.keys(global.db.messages)[0]]; }
        if(global.db.settings.autoread) await sock.readMessages([m.key]).catch(()=>{});

        // ===== ADDED - CONNECT ALL - AUTO PLUGIN (autoread / autoreact / autotype) =====
        // Runs on every message, even non-command. If auto plugin has onMessage, use it.
        // If not, fallback to global.db.settings (your existing settings).
        try{
          const autoPl = getPluginByCmd('auto') || getPluginByCmd('autoread')
          if(autoPl && typeof autoPl.onMessage === 'function'){ await autoPl.onMessage(sock, m).catch(()=>{}) }
          // Also support global.autoSettings from auto plugin
          if(global.autoSettings?.autotype) await sock.sendPresenceUpdate('composing', from).catch(()=>{})
          if(global.autoSettings?.autorecording) await sock.sendPresenceUpdate('recording', from).catch(()=>{})
        }catch{}
        // ===== END ADDED AUTO =====

        // ===== ADDED - CONNECT ALL - PROTECTION CHECK (antilink / antispam / antibot) =====
        // Runs BEFORE command. If protection plugin says delete, stop here.
        // Uses BOTH: your global.db.groups (antilink in getGroup) + protection plugin global.protection
        try{
          if(isGroup){
            const g = getGroup(from)
            const protPl = getPluginByCmd('protection') || getPluginByCmd('antilink')
            // 1) Plugin's own check (if it has .check)
            if(protPl && typeof protPl.check === 'function'){
              const blocked = await protPl.check(sock, m).catch(()=>false)
              if(blocked) return
            }
            // 2) Your existing db antilink - simple fallback, don't delete admin messages
            // We only delete if antilink is ON in db AND message has link AND sender is not admin/owner
            // To avoid false delete, we check admin via cached meta
            if(g.antilink && /https?:\/\/|wa\.me\/|chat\.whatsapp\.com/i.test(body)){
              const meta = await getCachedMeta(sock, from)
              const part = meta?.participants?.find(p => p.id === sender)
              const isAdmin = !!part?.admin
              const isOwner = sender.includes('239166265317') || global.db.sudo.includes(sender) || m.key.fromMe
              if(!isAdmin && !isOwner){
                try{ await sock.sendMessage(from, { delete: m.key }) }catch{}
                await sock.sendMessage(from, { text: `@${sender.split('@')[0]} - Link not allowed! ❌`, mentions: [sender] }).catch(()=>{})
                return
              }
            }
          }
        }catch{}
        // ===== END ADDED PROTECTION =====

        if(isGroup){
          const g=getGroup(from);
          if((global.db.settings.autovv||g.antiviewonce)&&(m.message.viewOnceMessage||m.message.viewOnceMessageV2||m.message.viewOnceMessageV2Extension)){
            try{ const q=m.message.viewOnceMessage||m.message.viewOnceMessageV2Extension; const inner=q?.message||q; if(inner?.imageMessage) await sock.sendMessage(from,{image:inner.imageMessage},{quoted:m}).catch(()=>{}); else if(inner?.videoMessage) await sock.sendMessage(from,{video:inner.videoMessage},{quoted:m}).catch(()=>{}); else await sock.sendMessage(from,{forward:q},{quoted:m}).catch(()=>{}); }catch{}
          }
        }

        // ===== ADDED - CONNECT ALL - BUTTON / LIST / POLL / NON-PREFIX REPLIES =====
        // THIS IS THE KEY FIX: .quiz and .menu use buttons/lists/polls, NOT .prefix commands.
        // Your old code did `if(!body.startsWith(prefix)) return;` so button taps were ignored.
        // Now we intercept them BEFORE prefix check.
        const isButtonOrList = !!(m.message?.listResponseMessage || m.message?.buttonsResponseMessage || m.message?.interactiveResponseMessage || m.message?.templateButtonReplyMessage)
        const isPollUpdate = !!m.message?.pollUpdateMessage
        const isPollCreation = !!m.message?.pollCreationMessage
        const isQuizTextAnswer = /^[a-dA-D]$/.test(body.trim()) || ['easy','medium','hard'].includes(body.trim().toLowerCase()) || /^\d+$/.test(body.trim())
        // Only try button/poll handling if it looks like button/poll OR user is in a quiz session
        const inQuiz = !!(global.quizSessions && global.quizSessions.has(from))
        if(isButtonOrList || isPollUpdate || isPollCreation || (inQuiz && isQuizTextAnswer)){
          // Prepare m helpers for plugins (same as below)
          m.body=body; m.text=body; m.args=body.split(/ +/); m.sender=sender; m.chat=from; m.from=from; m.isGroup=isGroup; m.fromMe=m.key.fromMe; m.pushName=m.pushName||"User";
          m.isOwner=sender.includes('239166265317') || global.db.sudo.includes(sender) || m.key.fromMe;
          m.reply=async(txt)=>await sock.sendMessage(from,{text:txt},{quoted:m});
          m.download=async()=>await downloadMediaMessage(m,'buffer',{},{logger:pino({level:"silent"}),reuploadRequest:sock.updateMediaMessage});

          // 1) MENU - list/button tap (menu_protection, menu_quiz, etc)
          try{
            const menuPl = getPluginByCmd('menu') || getPluginByCmd('help')
            if(menuPl && typeof menuPl.handleResponse === 'function'){
              const ok = await menuPl.handleResponse(sock, m).catch(()=>false)
              if(ok) return
            }
          }catch{}

          // 2) QUIZ - subject / difficulty / poll vote / A-B-C-D / number / easy-medium-hard
          try{
            const quizPl = getPluginByCmd('quiz') || getPluginByCmd('quizstart')
            if(quizPl && typeof quizPl.handleResponse === 'function'){
              const ok = await quizPl.handleResponse(sock, m).catch(()=>false)
              if(ok) return
            }
            // Quiz fallback: if quiz plugin has no handleResponse but session exists,
            // try its execute with text (for easy/medium/hard / number / A-D)
            // Your quiz.js execute already handles session fallback, so we call it via command path below if needed.
          }catch{}

          // 3) If it was ONLY a button/poll and neither menu nor quiz handled it, stop - don't treat as command
          if(isButtonOrList || isPollUpdate) return
          // If it was quiz text (A-D / easy / number) and quiz didn't handle, fall through to command check below
          // so quiz execute fallback can handle it (it checks global.quizSessions)
          if(inQuiz && isQuizTextAnswer){
            // Fall through - convert to fake .quiz command so execute() session logic runs
            // We set body to ".quiz <text>" style handling below by jumping to command logic
            // Simplest: call quiz execute directly
            try{
              const quizPl = getPluginByCmd('quiz')
              if(quizPl && typeof quizPl.execute === 'function'){
                await quizPl.execute(sock, m, { command: 'quiz', text: body.trim(), args: [body.trim()], reply: m.reply, isOwner: m.isOwner, prefix: '.' })
                return
              }
            }catch{}
          }
        }
        // ===== END ADDED BUTTON/POLL =====

        if(!body) return; const prefix=global.db.settings.prefix||config.prefix||'.'; if(!body.trim().startsWith(prefix)) return;
        const args=body.trim().slice(prefix.length).trim().split(/ +/); const rawCmd=args.shift()?.toLowerCase(); if(!rawCmd) return;
        const cmdName=rawCmd.replace(/[^a-z0-9]/g,'')||rawCmd;
        let plugin = global.plugins.get(rawCmd) || global.plugins.get(cmdName) || global.wolfCommands[rawCmd] || global.wolfCommands[cmdName];
        if(!plugin){
          const fn = global.wolfCommands[rawCmd] || global.wolfCommands[cmdName];
          if(fn && typeof fn === 'function'){ plugin = { execute: fn, isWolfStyle: true }; }
        }
        if(!plugin) return; 
        if(global.db.banned.includes(sender)) return;
        
        m.body=body; m.text=args.join(' '); m.args=args; m.sender=sender; m.chat=from; m.from=from; m.isGroup=isGroup; m.fromMe=m.key.fromMe; m.pushName=m.pushName||"User"; 
        m.isOwner=sender.includes('239166265317') || global.db.sudo.includes(sender) || m.key.fromMe;
        m.reply=async(txt)=>await sock.sendMessage(from,{text:txt},{quoted:m});
        m.download=async()=>await downloadMediaMessage(m,'buffer',{},{logger:pino({level:"silent"}),reuploadRequest:sock.updateMediaMessage});
        
        console.log(chalk.green(`▶️ ${rawCmd} ${sender.split('@')[0]}`));
        
        if(plugin.isWolfStyle || typeof plugin === 'function' || plugin.execute.length===3 || global.wolfCommands[rawCmd]){
          const execFn = typeof plugin === 'function' ? plugin : (plugin.execute || global.wolfCommands[rawCmd] || global.wolfCommands[cmdName]);
          if(typeof execFn === 'function'){
            await execFn(sock, m, {command:cmdName, text:args.join(' '), args, reply:m.reply, isOwner:m.isOwner, prefix});
          }
        } else {
          await plugin.execute(m,{sock,prefix,args,command:cmdName,config,plugins:global.plugins,from,sender,getGroup});
        }
      }catch(e){ console.log(chalk.red(`Exec err: ${e.message} ${e.stack}`)); }
    });
  }
  await initBaileys();
}

module.exports={startConnection};
module.exports.SimonMDConnection=startConnection;

// Auto start if run directly
if(require.main===module){
  startConnection().catch(e=>{ console.log(e.message); setTimeout(()=>startConnection(), 3000); });
}
