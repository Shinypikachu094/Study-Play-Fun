const fs = require('fs');
const path = require('path');

module.exports = function studyPage(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  const source = fs.readFileSync(path.join(process.cwd(), 'Playground-Arcade', 'study.html'), 'utf8');
  const page = source.replace('</body>', '<script src="/openai-coach.js?v=vercel-1"></script></body>');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(page);
};
