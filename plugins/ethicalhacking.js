// 🛡️ SIMON MD - ETHICAL HACKING (DEFENSIVE) - FREE, NO API, OFFLINE - FIXED
let style
try { style = require('../utils/style') } catch { style = require('./style') }
const { tiny, box, line, reactAwait, reactCmd, reactDone } = style
const crypto = require('crypto')
const dns = require('dns').promises

// Defensive only - no hacking others, no password cracking, no phishing links
function passwordStrength(pw){
  let score = 0
  if(pw.length >= 8) score += 20
  if(pw.length >= 12) score += 20
  if(/[a-z]/.test(pw)) score += 15
  if(/[A-Z]/.test(pw)) score += 15
  if(/[0-9]/.test(pw)) score += 15
  if(/[^a-zA-Z0-9]/.test(pw)) score += 15
  if(score >= 80) return { level: 'Strong', color: 'Green' }
  if(score >= 50) return { level: 'Medium', color: 'Yellow' }
  return { level: 'Weak', color: 'Red' }
}
function checkPhishingUrl(url){
  const flags = []
  const lower = url.toLowerCase()
  if(lower.includes('@')) flags.push('Contains @ - hides real domain')
  if(/http:\/\//.test(lower)) flags.push('Uses http, not https - not secure')
  if(/(\d+\.){3}\d+/.test(lower)) flags.push('Uses IP address, not domain name - suspicious')
  if(lower.includes('login') && (lower.includes('free') || lower.includes('verify') || lower.includes('urgent'))) flags.push('Urgent login / verify - common phishing')
  if(lower.length > 80) flags.push('Very long URL - hides real site')
  if(/\.tk$|\.ml$|\.ga$|\.cf$|\.gq$/.test(lower)) flags.push('Free domain .tk/.ml/.ga - often abused')
  // Homograph / typosquat check for popular sites
  const typos = ['facebok','instagrm','whatsap','paypa1','goog1e','arnazon','netf1ix']
  for(const t of typos){ if(lower.includes(t)) flags.push(`Looks like typo of real site (${t}) - possible fake`) }
  return flags
}
const LESSONS = [
  { title: '1. What is Ethical Hacking?', text: 'Ethical hacking = testing YOUR OWN system with permission to find weakness, then fix am. No permission = crime. Always get written permission before testing any site/app.' },
  { title: '2. CIA Triad', text: 'Confidentiality (only allowed people see data), Integrity (data no change), Availability (system dey up). Every hack breaks one of these. Your job na protect all 3.' },
  { title: '3. Password Security', text: 'Use 12+ chars, upper + lower + number + symbol, different password per site, use password manager, turn on 2FA. Never reuse password. Use .passcheck to test strength.' },
  { title: '4. Phishing', text: 'Phishing = fake link / email wey look like real site to steal password. Check domain, check https, no click urgent login links. Use .phishcheck <link> to check.' },
  { title: '5. Social Engineering', text: 'Attacker go call / chat you, pretend to be bank / support, ask for OTP / code. Real bank NEVER ask OTP. Never share OTP, even to friend account wey say "send me code".' },
  { title: '6. WiFi Safety', text: 'No login bank for public WiFi. Use VPN if you must. Turn off auto-connect. Forget public WiFi after use. Your home WiFi: use WPA2/WPA3 + strong password.' },
  { title: '7. Updates & Patches', text: 'Update phone, WhatsApp, browser always. Most hacks use old bugs wey update don fix. Turn on auto-update.' },
  { title: '8. 2FA / MFA', text: 'Turn on 2FA for WhatsApp, Google, Facebook, Bank. Use Authenticator app, not SMS if possible. Save backup codes for safe place.' },
  { title: '9. Legal Labs to Practice', text: 'Practice legally: TryHackMe, HackTheBox, PortSwigger Web Security Academy, OWASP Juice Shop (your own lab). Never test real site without permission.' },
  { title: '10. Career Path', text: 'Learn: Networking > Linux > Python > Web (HTML/JS) > OWASP Top 10 > Burp Suite > TryHackMe. Certs: CompTIA Security+, CEH, OSCP. No shortcut.' },
]
const OWASP = [
  '1. Broken Access Control - user fit access admin page / other user data',
  '2. Cryptographic Failures - password / card stored plain, no https',
  '3. Injection - SQL / Command injection via input box',
  '4. Insecure Design - no rate limit, no lockout after wrong password',
  '5. Security Misconfiguration - default password, open S3 bucket',
  '6. Vulnerable Components - old library with known bug',
  '7. Auth Failures - weak password, no 2FA, session no expire',
  '8. Data Integrity Failures - no check for tampered update / file',
  '9. Logging Failures - no log, so hack no dey detected',
  '10. SSRF - server tricked to call internal site',
]
const TOOLS_DEF = [
  'Wireshark - see YOUR network traffic (learn packets)',
  'Nmap - scan YOUR OWN server / home network (with permission)',
  'Burp Suite Community - test YOUR OWN website',
  'OWASP ZAP - free scanner for YOUR OWN website',
  'Kali Linux - lab OS, use in VM, not to attack others',
  'TryHackMe / HackTheBox - legal practice labs',
]

module.exports = {
  command: ['ethicalhacking','hacking','hack','cyber','security','cybersecurity','passcheck','passwordcheck','phishcheck','urlcheck','dnscheck','iplookup','owasp','lesson','labs','pentest'],
  execute: async (sock, m, { command, text, reply }) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    try{ await reactAwait(sock, jid, m.key) }catch{}
    const treply = async (title, lines) => {
      await sock.sendMessage(jid, { text: box(title, lines) }, { quoted: m })
      try{ await reactCmd(sock, jid, m.key, command) }catch{}
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
    try {
      if(['ethicalhacking','hacking','cyber','security','cybersecurity','pentest'].includes(command)){
        await treply('Ethical Hacking - Defensive Only', [
          line('lesson', '.lesson 1-10 - learn ethical hacking'),
          line('passcheck', '.passcheck MyPass123! - check YOUR password strength'),
          line('phishcheck', '.phishcheck https://... - check suspicious link'),
          line('dnscheck', '.dnscheck google.com - check YOUR domain DNS'),
          line('owasp', '.owasp - Top 10 web risks'),
          line('labs', '.labs - legal practice labs'),
          line('rule', 'Only test YOUR OWN system with permission. Hacking others = crime.')
        ])
        return
      }
      if(command === 'lesson'){
        const num = parseInt(text) || 1
        const idx = Math.min(Math.max(num, 1), LESSONS.length) - 1
        const l = LESSONS[idx]
        await treply(l.title, [l.text, line('next', `.lesson ${idx+2 <= LESSONS.length ? idx+2 : 1}`)])
        return
      }
      if(['passcheck','passwordcheck'].includes(command)){
        if(!text){ await treply('Password Check', [line('usage', '.passcheck YourPasswordHere'), line('warning', 'No send real password for group - use test password, bot no save am')]); return }
        // Never log / save password - just check in memory, then discard
        const pw = text.trim().split(/\s+/)[0]
        const s = passwordStrength(pw)
        const tips = []
        if(pw.length < 12) tips.push('Make am 12+ chars')
        if(!/[A-Z]/.test(pw)) tips.push('Add uppercase')
        if(!/[0-9]/.test(pw)) tips.push('Add number')
        if(!/[^a-zA-Z0-9]/.test(pw)) tips.push('Add symbol !@#$')
        await treply('Password Check - NOT Saved', [
          line('strength', `${s.level} (${s.color})`),
          line('length', `${pw.length} chars`),
          line('tip', tips.length ? tips.join(', ') : 'Good password, use different one per site + 2FA'),
          line('warning', 'Bot no save your password. Change am if you use am for real.')
        ])
        return
      }
      if(['phishcheck','urlcheck'].includes(command)){
        if(!text){ await treply('Phish Check', [line('usage', '.phishcheck https://example.com/login')]); return }
        const url = text.trim().split(/\s+/)[0]
        const flags = checkPhishingUrl(url)
        await treply('Phish Check - Defensive', [
          line('url', url),
          line('risk', flags.length === 0 ? 'Low - looks clean, but still verify' : flags.length >= 3 ? 'HIGH - Do NOT login' : 'Medium - Be careful'),
          ...(flags.length ? flags.map((f,i) => line(`flag ${i+1}`, f)) : [line('flag', 'No obvious red flag')]),
          line('rule', 'If bank / WhatsApp ask you login via link, go to official app, no click link')
        ])
        return
      }
      if(command === 'dnscheck'){
        if(!text){ await treply('DNS Check', [line('usage', '.dnscheck google.com - YOUR domain only')]); return }
        const domain = text.trim().split(/\s+/)[0].replace(/^https?:\/\//,'').split('/')[0]
        try{
          const ips = await dns.lookup(domain, { all: true })
          await treply('DNS Check', [line('domain', domain), line('ips', ips.map(i => i.address).join(', ')), line('note', 'DNS lookup only, no port scan of others')])
        }catch(e){ await treply('DNS Check', [line('error', `Cannot resolve ${domain}`)]) }
        return
      }
      if(command === 'iplookup'){
        // Defensive: only show YOUR IP info via local, no lookup of others
        await treply('IP Lookup', [line('info', 'Bot no lookup other person IP - that na doxxing'), line('tip', 'To check YOUR IP, open whatismyip.com'), line('tip2', 'Use VPN to hide your IP on public WiFi')])
        return
      }
      if(command === 'owasp'){
        await treply('OWASP Top 10 - 2021', OWASP.map((o,i) => line(`risk ${i+1}`, o)))
        return
      }
      if(command === 'labs'){
        await treply('Legal Labs - Practice Safely', [
          line('lab1', 'TryHackMe - tryhackme.com - beginner friendly'),
          line('lab2', 'HackTheBox - hackthebox.com'),
          line('lab3', 'PortSwigger Academy - portswigger.net/web-security'),
          line('lab4', 'OWASP Juice Shop - own lab, install locally'),
          line('lab5', 'Google Gruyere - google-gruyere.appspot.com'),
          line('rule', 'Only test these labs + YOUR OWN sites. Never test real site without written permission.')
        ])
        return
      }
      // Block illegal requests - hack, crack, phishing, etc
      if(command === 'hack'){
        await treply('Blocked', [line('info', 'I no help hack WhatsApp / Instagram / Facebook / bank'), line('try', 'Use .lesson, .passcheck, .phishcheck for defensive learning')])
        return
      }
    } catch(e){
      await sock.sendMessage(jid, { text: box('Security Error', [line('error', e.message)]) }, { quoted: m })
      try{ await reactDone(sock, jid, m.key) }catch{}
    }
  }
}
