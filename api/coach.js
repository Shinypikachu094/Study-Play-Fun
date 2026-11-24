const fs = require('fs');
const path = require('path');

function readText(name) {
  return fs.readFileSync(path.join(process.cwd(), name), 'utf8');
}

function readModel() {
  const notes = readText('NOTES.md');
  return notes.match(/gpt-[\w.-]*luna[\w.-]*/i)?.[0] || 'gpt-5.6-luna';
}

function latestStudentMessage(question) {
  const matches = [...question.matchAll(/(?:^|\n)Student:\s*([\s\S]*?)(?=\n(?:Coach|Student):|$)/g)];
  return (matches.length ? matches[matches.length - 1][1] : question).trim();
}

function json(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

module.exports = async function coach(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return json(res, 500, { error: 'OPENAI_API_KEY is not configured in Vercel.' });
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question || question.length > 40000) return json(res, 400, { error: 'Please send a shorter question.' });
  const latest = latestStudentMessage(question);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: readModel(),
        max_completion_tokens: 400,
        messages: [
          { role: 'system', content: `${readText('BRIEF.md')}\n\nAnswer the latest student message directly using the recent conversation for context. Understand long, informal, misspelled, emotional, and multi-part messages. Do not echo the student's message. Mention one concrete detail and give 2-4 personalized sentences. Never use “What part of that topic would you like to explore first?” or “I’m focusing on the specific details you gave me.” If the student asks for exactly three study goals for today, return exactly three short, specific, doable goals, one per line, with no long explanation. For normal schoolwork, give a broad hint or idea starter without doing the assignment. For emergencies, tell the student to contact emergency services or a trusted adult and explain that AI answers are not always accurate. For explicit note requests, create the note with every requested detail. Never request or repeat private information.` },
          { role: 'user', content: `LATEST STUDENT MESSAGE:\n<<<${latest}>>>\n\nRECENT CONVERSATION:\n<<<${question.slice(-12000)}>>>` },
        ],
      }),
    });
    if (!response.ok) return json(res, 502, { error: `OpenAI request failed (${response.status}).` });
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) return json(res, 502, { error: 'OpenAI returned an empty answer.' });
    return json(res, 200, { answer, provider: 'OpenAI' });
  } catch {
    return json(res, 502, { error: 'The OpenAI Coach could not be reached.' });
  }
};
