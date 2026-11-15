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
  const progressCard = document.createElement('section');
  progressCard.className = 'card study-progress';
  progressCard.style.cssText = 'margin:0 0 18px;padding:18px 22px;background:linear-gradient(135deg,#fff8d8,#eef0ff);';
  progressCard.innerHTML = '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><div class="eyebrow">Your progress</div><h2 style="margin:4px 0 2px">Level <span id="study-level">1</span> · <span id="study-level-name">Getting started</span></h2></div><div style="font-weight:900;color:#4d3b0c">⭐ <span id="study-points">0</span> points · ✨ <span id="study-xp">0</span> XP</div></div><div style="height:12px;background:#ffffffaa;border-radius:999px;overflow:hidden;margin-top:14px"><div id="study-xp-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#6d70ff,#ff6fa8);border-radius:999px;transition:width .25s"></div></div><p class="small" id="study-milestone" style="margin:9px 0 0">0 / 100 XP to the next level</p>';
  if (layout && layout.parentNode) layout.parentNode.insertBefore(progressCard, layout);
  const levelNames = ['Getting started', 'Curious learner', 'Study builder', 'Focused scholar', 'Knowledge champion'];
  function renderProgress() {
    if (typeof arcadeState !== 'function') return;
    const state = arcadeState();
    const level = state.level || 1;
    const xpIntoLevel = state.xp % 100;
    document.getElementById('study-level').textContent = level;
    document.getElementById('study-level-name').textContent = levelNames[Math.min(level - 1, levelNames.length - 1)] || `Level ${level}`;
    document.getElementById('study-points').textContent = state.points;
    document.getElementById('study-xp').textContent = state.xp;
    document.getElementById('study-xp-bar').style.width = `${xpIntoLevel}%`;
    document.getElementById('study-milestone').textContent = `${xpIntoLevel} / 100 XP to Level ${level + 1} · Complete a task (+25 XP), add a task (+5 XP), or save a brainstorm idea (+10 XP).`;
  }
  renderProgress();
  const addTask = document.getElementById('add');
  const taskInput = document.getElementById('task-input');
  if (addTask && taskInput) addTask.addEventListener('click', () => { if (taskInput.value.trim()) { arcadeAddXP(5, 'studyTask'); setTimeout(renderProgress, 0); } }, true);
  const taskList = document.getElementById('tasks');
  if (taskList) taskList.addEventListener('change', () => setTimeout(renderProgress, 0));
  const addIdea = document.getElementById('add-idea');
  const ideaText = document.getElementById('idea-text');
  if (addIdea && ideaText) addIdea.addEventListener('click', () => { if (ideaText.value.trim()) { arcadeAddXP(10, 'brainstorm'); setTimeout(renderProgress, 0); } }, true);

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
  function saveCoachNote(noteText) {
    if (typeof brain === 'undefined') return;
    brain.notes.push({ id: Date.now(), title: 'AI study note', text: noteText, tag: 'School', updated: Date.now() });
    saveBrain();
    renderBrain();
    arcadeAddXP(15, 'coachNote');
    renderProgress();
  }
  function urgentSafetyReply(text) {
    const breathingEmergency = /(severe\s+chest\s+pain|chest\s+pain[\s\S]{0,50}(trouble|difficulty|problem)\s+breath|trouble\s+breath|difficulty\s+breath|can't\s+breath|cannot\s+breath|shortness\s+of\s+breath)/i.test(text);
    const dangerEmergency = /(hostage|kidnap|kidnapped|abduct|abduction|taken\s+against\s+(?:my|their)\s+will|arms?\s+and\s+legs?\s+(?:are|were)?\s*(?:all\s+)?broken|both\s+arms?\s+broken|both\s+legs?\s+broken)/i.test(text);
    if (!breathingEmergency && !dangerEmergency) return '';
    const safety = /hostage|kidnap|abduct|taken\s+against/i.test(text)
      ? 'Call 911 (or your local emergency number) now if you can do so safely, and tell a trusted adult or emergency dispatcher exactly where you are. Do not confront the person holding you or make a risky move to reach a phone. Stay as calm and quiet as you can, follow immediate safety instructions, and share your location or send a quiet alert only if it is safe.'
      : 'Call 911 (or your local emergency number) now, and tell a trusted adult immediately. Do not move the injured person unless there is immediate danger. Keep broken limbs in the position you found them, do not straighten bones, and use a clean cloth for bleeding while following the dispatcher’s instructions.';
    const breathing = breathingEmergency ? '\n\nFor breathing trouble or severe chest pain: sit in a comfortable position, avoid exertion, ask someone to stay nearby, and do not drive yourself. If the person becomes unresponsive or is not breathing normally, tell the dispatcher and follow CPR/AED instructions.' : '';
    return `${safety}${breathing}\n\n(AI interpretations are not always accurate and cannot replace emergency professionals or a doctor.)`;
  }
  function cleanCoachAnswer(answer) {
    const cleaned = String(answer || '').replace(/\s*What part of that topic would you like to explore first\??\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim();
    return cleaned || 'I’m focusing on the specific details in your message and will respond to those directly.';
  }
  async function askCoach(studentText) {
    if (busy) return;
    const safeText = redactPrivate(studentText.trim());
    if (!safeText) return;
    busy = true;
    const previousCoach = [...conversation].reverse().find((message) => message.role === 'coach' && !/what part of that topic would you like to explore first/i.test(message.content));
    addMessage('student', safeText);
    const noteCommand = /\b(make|create|write|save|add|turn|convert)\b[\s\S]{0,100}\b(note|notes|nite|sticky\s+note|memo)\b/i;
    const asksForNote = noteCommand.test(safeText);
    const noteFollowUp = asksForNote && /\b(that|this|it|above|previous|last)\b/i.test(safeText);
    const instruction = asksForNote
      ? 'The student is asking for a study note. Directly create the note and answer the request. Include every named detail exactly, use a short title and clear note body, and do not only say that it was saved. Do not ask what part of the topic the student wants to explore, and do not shorten or remove requested details.'
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
      if (noteFollowUp && previousCoach) {
        const noteText = `Study note\n\n${previousCoach.content}`;
        addMessage('coach', noteText);
        saveCoachNote(noteText);
        renderChat();
        const saved = document.createElement('div');
        saved.style.cssText = 'align-self:flex-start;padding:10px 14px;border-radius:16px;background:#fff8d8;color:#725b1a;';
        saved.textContent = 'Saved the previous Coach response as a study note.';
        chat.appendChild(saved);
        chat.scrollTop = chat.scrollHeight;
        return;
      }
      if (noteFollowUp) {
        const noContext = 'I do not have a useful previous Coach answer to turn into a note yet. Ask your question again, then say “make that a study note.”';
        addMessage('coach', noContext);
        renderChat();
        return;
      }
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: request }) });
      const data = await response.json();
      if (!response.ok) {
        const problem = data.error || 'The Coach could not answer.';
        throw new Error(problem);
      }
      const coachAnswer = cleanCoachAnswer(data.answer);
      addMessage('coach', coachAnswer);
      renderChat();
      if (asksForNote && typeof brain !== 'undefined') {
        saveCoachNote(coachAnswer);
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
