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
  if (copy) copy.textContent = 'Ask anything about schoolwork, studying, or brainstorming. Replies stay in chat unless you explicitly ask to make one a study note.';
  const actions = notesButton.closest('.ai-actions');
  if (actions) actions.style.display = 'none';
  reply.style.display = 'none';
  const layout = panel.closest('.study-with-ai');
  if (layout) {
    layout.style.display = 'block';
    panel.style.position = 'static';
    panel.style.marginTop = '18px';
  }

  const chat = document.createElement('div');
  chat.className = 'coach-chat-history';
  chat.style.cssText = 'display:flex;flex-direction:column;gap:12px;max-height:520px;min-height:180px;overflow:auto;margin:16px 0 12px;padding:8px 4px;';
  const privacyNote = document.createElement('p');
  privacyNote.className = 'small';
  privacyNote.textContent = 'Saved on this device for Coach context. Say “make that a study note” when you want to save a reply. Do not type private information.';
  prompt.placeholder = 'Ask anything';
  prompt.rows = 3;
  prompt.maxLength = 12000;
  prompt.style.cssText = 'width:100%;min-height:220px;margin:0;border:2px solid #dfe3f4;border-radius:24px;padding:22px 24px;font-size:18px;line-height:1.5;background:#fff;color:#182044;resize:vertical;outline:none;';
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
  function urgentSafetyReply(text) {
    if (!/(severe\s+chest\s+pain|chest\s+pain[\s\S]{0,50}(trouble|difficulty|problem)\s+breath|trouble\s+breath|difficulty\s+breath|can't\s+breath|cannot\s+breath|shortness\s+of\s+breath)/i.test(text)) return '';
    return 'Call 911 (or your local emergency number) now, and tell a trusted adult immediately. Severe chest pain or trouble breathing can be an emergency, so do not wait for an AI response or try to handle it alone.\n\nWhile help is coming:\n- Sit in a comfortable position, stay as still as you can, and avoid exertion.\n- Ask someone to stay with you and unlock the door if it is safe.\n- Do not drive yourself. Follow the dispatcher’s instructions and stay on the call until they tell you to hang up.\n- If the person becomes unresponsive or is not breathing normally, tell the dispatcher immediately and follow their CPR/AED instructions.\n\n(AI interpretations are not always accurate and cannot replace a doctor or emergency professional.)';
  }
  async function askCoach(studentText) {
    if (busy) return;
    const safeText = redactPrivate(studentText.trim());
    if (!safeText) return;
    busy = true;
    addMessage('student', safeText);
    const noteCommand = /\b(make|create|write|save|add|turn|convert)\b[\s\S]{0,100}\b(note|notes|nite|sticky\s+note|memo)\b/i;
    const asksForNote = noteCommand.test(safeText);
    const instruction = asksForNote
      ? 'The student is asking for a study note. Directly create the note and answer the request. Include every named detail exactly, use a short title and clear note body, and do not only say that it was saved. Do not shorten or remove requested details.'
      : 'Respond with personalized but open-ended feedback. Mention the student’s subject or idea, then offer a broad hint, idea starter, or guiding question and brief encouragement. Do not give exact steps, a detailed plan, a finished answer, or do the assignment.';
    const request = `${instruction}\n\nConversation so far:\n${historyText()}`;
    const thinking = document.createElement('div');
    thinking.style.cssText = 'align-self:flex-start;padding:12px 15px;border-radius:18px;background:#f5f6f8;color:#69738d;';
    thinking.textContent = 'Thinking…';
    chat.appendChild(thinking);
    chat.scrollTop = chat.scrollHeight;
    prompt.disabled = true;
    try {
      const urgentReply = urgentSafetyReply(safeText);
      if (urgentReply) {
        addMessage('coach', urgentReply);
        renderChat();
        return;
      }
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: request }) });
      const data = await response.json();
      if (!response.ok) {
        const problem = data.error || 'The Coach could not answer.';
        throw new Error(problem);
      }
      addMessage('coach', data.answer);
      renderChat();
      if (asksForNote && typeof brain !== 'undefined') {
        brain.notes.push({ id: Date.now(), title: 'AI study note', text: data.answer, tag: 'School', updated: Date.now() });
        saveBrain();
        renderBrain();
        const saved = document.createElement('div');
        saved.style.cssText = 'align-self:flex-start;padding:10px 14px;border-radius:16px;background:#fff8d8;color:#725b1a;';
        saved.textContent = 'Saved as a sticky note with your requested details.';
        chat.appendChild(saved);
        chat.scrollTop = chat.scrollHeight;
      }
    } catch (error) {
      conversation.pop();
      saveConversation();
      thinking.textContent = error.message === 'Failed to fetch'
        ? 'The Coach server is offline. Start Playground Arcade and keep its window open, then refresh this page.'
        : error.message;
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
