// Serves the attached Playground Arcade copy and keeps the OpenAI key server-side.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'Playground-Arcade');
const PORT = 3001;
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

async function askAI(question) {
  const key = readEnv();
  if (!key || key === 'paste-your-key-here') throw new Error('missing-key');
  const payload = { model: readModel(), max_completion_tokens: 120, messages: [
    { role: 'system', content: `${readBrief()}\n\nGive personalized feedback based on the student's exact subject, idea, or goal. Refer to the specific details they shared, then give one doable next step and one short encouragement. Keep it brief and useful. Only help with educational studying or brainstorming. Never request or repeat private information.` },
    { role: 'user', content: question },
  ] };
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`api-${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Try turning your idea into one small next step.';
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/coach') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 10000) req.destroy(); });
    req.on('end', async () => {
      try {
        const question = JSON.parse(body).question?.trim();
        if (!question || question.length > 500) return reply(res, 400, JSON.stringify({ error: 'Please ask a short question.' }));
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
  reply(res, 200, content, MIME[path.extname(file)] || 'application/octet-stream');
});

server.listen(PORT, () => console.log(`Playground Arcade with OpenAI running at http://localhost:${PORT}`));
