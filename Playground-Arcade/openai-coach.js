// Real OpenAI Coach for Study Quest. The API key stays in the local server.
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
  if (copy) copy.textContent = 'Ask about a school assignment, study goal, or brainstorming idea. Your local chat is saved for context; do not include private information.';

  const chat = document.createElement('div');
  chat.className = 'coach-chat-history';
  chat.style.cssText = 'max-height:180px;overflow:auto;margin:12px 0;padding:10px;border-radius:12px;background:#f5f6ff;color:#4f587c;font-size:13px;line-height:1.45;white-space:pre-wrap;';
  const replyInput = document.createElement('textarea');
  replyInput.className = 'notes coach-reply-input';
  replyInput.rows = 2;
  replyInput.maxLength = 500;
  replyInput.placeholder = 'After the Coach answers, type a reply here and press Enter…';
  replyInput.style.marginTop = '10px';
  const privacyNote = document.createElement('p');
  privacyNote.className = 'small';
  privacyNote.textContent = 'Saved on this device for Coach context. Do not type private information.';
  adviceButton.insertAdjacentElement('afterend', chat);
  chat.insertAdjacentElement('afterend', replyInput);
  replyInput.insertAdjacentElement('afterend', privacyNote);

  function renderChat() {
    chat.textContent = conversation.length
      ? conversation.map((message) => `${message.role === 'student' ? 'You' : 'Coach'}: ${message.content}`).join('\n\n')
      : 'Your Coach conversation will appear here.';
    chat.scrollTop = chat.scrollHeight;
  }
  renderChat();
  if (conversation.length) reply.textContent = conversation[conversation.length - 1].content;

  let busy = false;
  async function askCoach(instruction, studentText, makeNote = false) {
    if (busy) return;
    const safeText = redactPrivate(studentText.trim());
    if (!safeText) { reply.textContent = 'Type an educational question or idea first.'; return; }
    busy = true;
    reply.textContent = 'Thinking…';
    notesButton.disabled = true;
    adviceButton.disabled = true;
    replyInput.disabled = true;
    addMessage('student', safeText);
    const request = `${instruction}\n\nConversation so far:\n${historyText()}`;
    try {
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: request }) });
      const data = await response.json();
      if (!response.ok) throw new Error('coach unavailable');
      addMessage('coach', data.answer);
      reply.textContent = data.answer;
      renderChat();
      if (makeNote && typeof brain !== 'undefined') {
        brain.notes.push({ id: Date.now(), title: 'AI Coach idea starter', text: data.answer, tag: 'Ideas', updated: Date.now() });
        saveBrain();
        renderBrain();
      }
    } catch (error) {
      conversation.pop();
      saveConversation();
      reply.textContent = 'I couldn’t reach OpenAI. Check that the Playground server is running, your key is valid, and you have internet.';
    } finally {
      busy = false;
      notesButton.disabled = false;
      adviceButton.disabled = false;
      replyInput.disabled = false;
      replyInput.focus();
    }
  }

  notesButton.onclick = () => askCoach('Suggest one broad idea starter for this educational topic. Do not write the assignment or give exact steps:', prompt.value, true);
  adviceButton.onclick = () => askCoach('Give open-ended feedback for this educational goal. Offer a broad hint or guiding question and encouragement, not a detailed plan or finished answer:', prompt.value);
  replyInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      askCoach('Respond to the student’s latest message with another broad hint, idea starter, or guiding question. Do not give exact steps or do the assignment:', replyInput.value);
      replyInput.value = '';
    }
  });
})();
