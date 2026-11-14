// Chat-style Real OpenAI Coach for Study Quest. The API key stays in the local server.
(function () {
  const panel = document.querySelector('.ai-panel');
  if (!panel) return;
  const label = panel.querySelector('.eyebrow');
  const copy = panel.querySelector('.small');
  const prompt = document.getElementById('ai-prompt');
  const reply = document.getElementById('ai-reply');
  const notesButton = document.getElementById('ai-notes');
  const adviceButton = document.getElementById('ai-advice');
  if (!prompt || !reply || !notesButton || !adviceButton) return;

  const CHAT_KEY = 'studyQuestCoachConversationV1';
  const redactPrivate = (text) => String(text)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[private email removed]')
    .replace(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-])\d{3}[\s.-]\d{4}/g, '[private phone removed]');
  let conversation = [];
  try { conversation = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]'); } catch { conversation = []; }
  if (!Array.isArray(conversation)) conversation = [];
  const saveConversation = () => localStorage.setItem(CHAT_KEY, JSON.stringify(conversation));
  const addMessage = (role, content) => { conversation.push({ role, content: redactPrivate(content), at: Date.now() }); saveConversation(); };
  const historyText = () => conversation.slice(-16).map((message) => `${message.role === 'student' ? 'Student' : 'Coach'}: ${message.content}`).join('\n');

  if (label) label.textContent = 'Real OpenAI coach';
  if (copy) copy.textContent = 'Ask anything about schoolwork, studying, or brainstorming. The saved chat stays on this device; do not include private information.';
  const actions = notesButton.closest('.ai-actions');
  if (actions) actions.style.display = 'none';
  reply.style.display = 'none';

  const chat = document.createElement('div');
  chat.className = 'coach-chat-history';
  chat.style.cssText = 'display:flex;flex-direction:column;gap:10px;max-height:280px;overflow:auto;margin:16px 0 12px;padding:4px 2px;';
  const privacyNote = document.createElement('p');
  privacyNote.className = 'small';
  privacyNote.textContent = 'Saved on this device for Coach context. Do not type private information.';
  prompt.placeholder = 'Ask anything';
  prompt.rows = 3;
  prompt.style.cssText = 'width:100%;min-height:110px;margin:0;border:2px solid #dfe3f4;border-radius:24px;padding:18px 20px;font-size:17px;background:#fff;color:#182044;resize:vertical;outline:none;';
  panel.appendChild(chat);
  panel.appendChild(prompt);
  panel.appendChild(privacyNote);

  function renderChat() {
    chat.replaceChildren();
    if (!conversation.length) {
      const empty = document.createElement('p');
      empty.className = 'small';
      empty.textContent = 'Your conversation will appear here.';
      chat.appendChild(empty);
      return;
    }
    conversation.forEach((message) => {
      const bubble = document.createElement('div');
      bubble.style.cssText = `align-self:${message.role === 'student' ? 'flex-end' : 'flex-start'};max-width:92%;padding:12px 15px;border-radius:18px;background:${message.role === 'student' ? '#eef0ff' : '#f5f6f8'};color:#182044;white-space:pre-wrap;line-height:1.45;text-align:left;`;
      bubble.textContent = message.content;
      chat.appendChild(bubble);
    });
    chat.scrollTop = chat.scrollHeight;
  }
  renderChat();

  let busy = false;
  async function askCoach(studentText) {
    if (busy) return;
    const safeText = redactPrivate(studentText.trim());
    if (!safeText) return;
    busy = true;
    addMessage('student', safeText);
    const request = `Respond to the student's latest message with personalized but open-ended feedback. Mention the student's subject or idea, then offer a broad hint, idea starter, or guiding question and brief encouragement. Do not give exact steps, a detailed plan, a finished answer, or do the assignment.\n\nConversation so far:\n${historyText()}`;
    const thinking = document.createElement('div');
    thinking.style.cssText = 'align-self:flex-start;padding:12px 15px;border-radius:18px;background:#f5f6f8;color:#69738d;';
    thinking.textContent = 'Thinking…';
    chat.appendChild(thinking);
    chat.scrollTop = chat.scrollHeight;
    prompt.disabled = true;
    try {
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: request }) });
      const data = await response.json();
      if (!response.ok) throw new Error('coach unavailable');
      addMessage('coach', data.answer);
      renderChat();
    } catch (error) {
      conversation.pop();
      saveConversation();
      thinking.textContent = 'I couldn’t reach OpenAI. Check that the Playground server is running, your key is valid, and you have internet.';
    } finally {
      busy = false;
      prompt.disabled = false;
      prompt.focus();
    }
  }
  prompt.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const text = prompt.value;
      prompt.value = '';
      askCoach(text);
    }
  });
})();
