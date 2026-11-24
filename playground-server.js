// Serves the attached Playground Arcade copy and keeps the OpenAI key server-side.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'Playground-Arcade');
const PORT = 3002;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/plain; charset=utf-8' };

function readEnv() {
  const text = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const match = text.match(/^OPENAI_API_KEY=(.*)$/m);
  return match && match[1].trim();
}
function readModel() {
  const text = fs.readFileSync(path.join(__dirname, 'NOTES.md'), 'utf8');
  const match = text.match(/gpt-[\w.-]*luna[\w.-]*/i);
  return match ? match[0] : 'gpt-5.6-luna';
}
function readBrief() { return fs.readFileSync(path.join(__dirname, 'BRIEF.md'), 'utf8'); }
function reply(res, status, body, type = 'application/json; charset=utf-8') { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); }
function escapeRegExp(text) { return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function latestStudentMessage(question) {
  const matches = [...question.matchAll(/(?:^|\n)Student:\s*([\s\S]*?)(?=\n(?:Coach|Student):|$)/g)];
  return (matches.length ? matches[matches.length - 1][1] : question).trim();
}
function emergencySafetyMessage(latest, context = '') {
  const breathingEmergency = /(severe\s+chest\s+pain|chest\s+pain[\s\S]{0,50}(trouble|difficulty|problem)\s+breath|trouble\s+breath|difficulty\s+breath|can't\s+breath|cannot\s+breath|shortness\s+of\s+breath)/i.test(latest);
  const dangerEmergency = /(hostage|kidnap|kidnapped|abduct|abduction|taken\s+against\s+(?:my|their)\s+will|arms?\s+and\s+legs?\s+(?:are|were)?\s*(?:all\s+)?broken|both\s+arms?\s+broken|both\s+legs?\s+broken)/i.test(latest);
  const lifeThreat = /about\s+to\s+die|going\s+to\s+die|i(?:'m|\s+am)\s+dying|kill\s+myself|hurt\s+myself|suicid/i.test(latest);
  const generalEmergency = /help[\s\S]{0,35}(?:call\s*911|emergency)|(?:call\s*911|emergency)[\s\S]{0,35}help|need\s+emergency\s+help|can't\s+call\s*911/i.test(latest);
  const priorEmergency = /(?:hostage|kidnap|abduct|severe\s+chest\s+pain|trouble\s+breath|about\s+to\s+die|call\s*911|emergency)/i.test(context);
  const noPhoneFollowUp = /(?:don['’]?t|do not|no|without)\s+(?:have\s+)?a?\s*phone|no\s+phone|phone\s+(?:is\s+)?dead/i.test(latest) && priorEmergency;
  if (!breathingEmergency && !dangerEmergency && !lifeThreat && !generalEmergency) return '';
  if (lifeThreat && !dangerEmergency && !breathingEmergency) return 'Call 911 (or your local emergency number) now if you are in immediate danger, and tell a trusted adult right away. If you might hurt yourself, move away from anything you could use to hurt yourself and stay with another person. In the U.S. or Canada, call or text 988 for immediate crisis support; elsewhere, contact your local crisis line. (AI interpretations are not always accurate and cannot replace emergency professionals.)';
  if (noPhoneFollowUp) return 'If you do not have a phone, ask a nearby adult, teacher, staff member, neighbor, security worker, or open business to call 911 for you. If you are in immediate danger, move toward a safer place or other people if you can do so safely, and clearly say that you need emergency help. (AI answers are not always accurate and cannot replace emergency professionals.)';
  if (generalEmergency && !dangerEmergency && !breathingEmergency) return 'Call 911 (or your local emergency number) now if there is immediate danger. If it is safe, move to a safer place, tell the dispatcher your location and what happened, ask a trusted adult to stay with you, and follow the dispatcher’s instructions without hanging up. (AI answers are not always accurate and cannot replace emergency professionals.)';
  const detail = latest.replace(/\s+/g, ' ').slice(0, 140);
  const safety = /hostage|kidnap|abduct|taken\s+against/i.test(latest)
    ? 'Call 911 (or your local emergency number) now if you can do so safely, and tell a trusted adult or emergency dispatcher exactly where you are. Do not confront the person holding you or make a risky move to reach a phone. Stay as calm and quiet as you can, follow immediate safety instructions, and share your location or send a quiet alert only if it is safe.'
    : 'Call 911 (or your local emergency number) now, and tell a trusted adult immediately. Do not move the injured person unless there is immediate danger. Keep broken limbs in the position you found them, do not straighten bones, and use a clean cloth for bleeding while following the dispatcher’s instructions.';
  const breathing = breathingEmergency ? '\n\nFor breathing trouble or severe chest pain: sit in a comfortable position, avoid exertion, ask someone to stay nearby, and do not drive yourself. If the person becomes unresponsive or is not breathing normally, tell the dispatcher and follow CPR/AED instructions.' : '';
  return `You mentioned: ${detail}\n\n${safety}${breathing}\n\n(AI interpretations are not always accurate and cannot replace emergency professionals or a doctor.)`;
}

async function askAI(question) {
  const latest = latestStudentMessage(question);
  const urgentReply = emergencySafetyMessage(latest, question);
  if (urgentReply) return urgentReply;
  const key = readEnv();
  if (!key || key === 'paste-your-key-here') throw new Error('missing-key');
  const payload = { model: readModel(), max_completion_tokens: 400, messages: [
    { role: 'system', content: `${readBrief()}\n\nUnderstand natural student messages even when they are long, informal, misspelled, emotional, or combine several thoughts. Use the full conversation for context, but answer the latest student message itself. If the student adds a constraint or follow-up such as “I don’t have a phone,” adapt the advice to that constraint instead of repeating the earlier response. Identify the student's educational goal, subject, requested format, and important details before answering. Your answer must respond to the latest student message itself, not just repeat it or copy its wording as the answer. Never begin by echoing the student’s full message. Mention at least one concrete detail from that message and give 2-4 personalized sentences. Never use the stock phrases “What part of that topic would you like to explore first?” or “I’m focusing on the specific details you gave me.” If the latest message asks for exactly three study goals for today, return exactly three short, specific, doable goals, one per line, with no long explanation. If the latest message contains a clear subject, topic, object, or question, use it immediately and do not ask what topic they want to learn. Only ask a question when it is tied to a specific missing detail in the student's message. For a normal study-help question, offer a broad hint, idea starter, or guiding question instead of doing the assignment. For possible emergencies or serious medical symptoms, give direct safety guidance first, tell the student to contact emergency services or a trusted adult, and say in parentheses that AI interpretations are not always accurate and cannot replace a medical professional. Never respond to a serious medical message with a generic study question. When the student asks to make a study note, directly create the requested note: answer the note request, include every named detail exactly, and format it with a short title and clear note body. Do not only say that it was saved. If the student specifically asks to create or save a note, preserve every detail they requested and do not tell them to use fewer words unless they ask. Keep it useful and do not invent missing details. For off-topic requests, briefly redirect to schoolwork; for unsafe or medical requests, give a brief safety warning and suggest a trusted adult or qualified professional. Never request or repeat private information.` },
    { role: 'user', content: `LATEST STUDENT MESSAGE (answer this):\n<<<${latest}>>>\n\nOLDER CONVERSATION FOR CONTEXT ONLY:\n<<<${question}>>>` },
  ] };
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`api-${response.status}`);
  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim();
  const detail = latest.replace(/\s+/g, ' ').slice(0, 140);
  const cleanedAnswer = answer?.replace(new RegExp(`^${escapeRegExp(latest)}[\\s.!?:-]*`, 'i'), '').replace(/\s*What part of that topic would you like to explore first\??\s*/gi, ' ').replace(/\s*I[’']m focusing on the specific details you gave me instead of asking you to choose a topic\.?\s*/gi, ' ').replace(/\s+Student:\s+[^\n]*(?=\n|$)/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  return cleanedAnswer || `I’m responding to the specific details in your message: ${detail}.`;
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/coach') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 50000) req.destroy(); });
    req.on('end', async () => {
      try {
        const question = JSON.parse(body).question?.trim();
        if (!question || question.length > 40000) return reply(res, 400, JSON.stringify({ error: 'That conversation is too long. Start a new chat in this browser.' }));
        reply(res, 200, JSON.stringify({ answer: await askAI(question) }));
      } catch (error) { reply(res, 502, JSON.stringify({ error: 'coach-unavailable' })); }
    });
    return;
  }
  if (req.method !== 'GET') return reply(res, 405, 'Method not allowed', 'text/plain; charset=utf-8');
  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  const relative = requested === '/' ? 'index.html' : requested.slice(1);
  const file = path.resolve(ROOT, relative);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return reply(res, 404, 'Not found', 'text/plain; charset=utf-8');
  let content = fs.readFileSync(file);
  if (path.basename(file) === 'study.html') content = Buffer.from(content.toString('utf8').replace('</body>', '<script src="openai-coach.js?v=20261115-3"></script></body>'));
  if (path.basename(file) === 'coin-pusher.html') content = Buffer.from(content.toString('utf8').replace('</body>', '<script src="coin-pusher-upgrade.js"></script></body>'));
  reply(res, 200, content, MIME[path.extname(file)] || 'application/octet-stream');
});

server.listen(PORT, () => console.log(`Playground Arcade with OpenAI running at http://localhost:${PORT}`));
