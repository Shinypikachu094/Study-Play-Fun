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
function reply(res, status, body, type = 'application/json; charset=utf-8') { res.writeHead(status, { 'Content-Type': type }); res.end(body); }
function latestStudentMessage(question) {
  const matches = [...question.matchAll(/Student:\s*([\s\S]*?)(?=\nCoach:|$)/g)];
  return (matches.length ? matches[matches.length - 1][1] : question).trim();
}

async function askAI(question) {
  const key = readEnv();
  if (!key || key === 'paste-your-key-here') throw new Error('missing-key');
  const latest = latestStudentMessage(question);
  const payload = { model: readModel(), max_completion_tokens: 120, messages: [
    { role: 'system', content: `${readBrief()}\n\nUnderstand natural student messages even when they are long, informal, misspelled, emotional, or combine several thoughts. Identify the student's educational goal, subject, requested format, and important details before answering. Start by naming one concrete detail from the latest student message, so the student can tell the answer is meant for them. Never give a generic tip. If important context is missing, ask one short clarifying question before giving advice. For a normal study-help question, offer a broad hint, idea starter, or guiding question instead of doing the assignment. When the student asks to make a study note, directly create the requested note: answer the note request, include every named detail exactly, and format it with a short title and clear note body. Do not only say that it was saved. If the student specifically asks to create or save a note, preserve every detail they requested and do not tell them to use fewer words unless they ask. Keep it useful and do not invent missing details. For off-topic requests, briefly redirect to schoolwork; for unsafe or medical requests, give a brief safety warning and suggest a trusted adult or qualified professional. Never request or repeat private information.` },
    { role: 'user', content: `Latest student message to personalize to:\n${latest}\n\nFull conversation:\n${question}` },
  ] };
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`api-${response.status}`);
  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim();
  const detail = latest.replace(/\s+/g, ' ').slice(0, 140);
  return answer ? `You mentioned: ${detail}\n\n${answer}` : `You mentioned: ${detail}\n\nWhat part of that topic would you like to explore first?`;
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
  if (path.basename(file) === 'study.html') content = Buffer.from(content.toString('utf8').replace('</body>', '<script src="openai-coach.js"></script></body>'));
  if (path.basename(file) === 'coin-pusher.html') content = Buffer.from(content.toString('utf8').replace('</body>', '<script src="coin-pusher-upgrade.js"></script></body>'));
  reply(res, 200, content, MIME[path.extname(file)] || 'application/octet-stream');
});

server.listen(PORT, () => console.log(`Playground Arcade with OpenAI running at http://localhost:${PORT}`));
