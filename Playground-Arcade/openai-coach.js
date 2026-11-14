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
  const replyButton = document.createElement('button');
  replyButton.type = 'button';
  replyButton.className = 'button secondary';
  replyButton.textContent = 'Reply to Coach';
  replyButton.disabled = true;
  adviceButton.insertAdjacentElement('afterend', replyButton);
  if (!prompt || !reply || !notesButton || !adviceButton) return;
  if (label) label.textContent = 'Real OpenAI coach';
  if (copy) copy.textContent = 'Ask about a school assignment, study goal, or brainstorming idea. Your question goes through the local helper, which keeps your key private.';
  let lastAnswer = '';
  async function ask(kind) {
    const question = prompt.value.trim();
    if (!question) { reply.textContent = 'Write an idea or assignment first.'; return; }
    reply.textContent = 'Thinking…';
    notesButton.disabled = true;
    adviceButton.disabled = true;
    const request = kind === 'reply'
      ? `The Coach previously said:\n${lastAnswer}\n\nThe student replies:\n${question}\n\nRespond with another broad hint, idea starter, or guiding question. Do not give exact steps or do the assignment.`
      : kind === 'notes'
      ? `Turn this exact educational idea into one broad idea starter for a sticky note. Use the subject and details I gave you, but do not write the assignment or give exact steps:\n${question}`
      : `Give personalized but open-ended feedback for this exact educational goal. Mention the subject or idea I gave you, then offer a broad hint or guiding question and one encouraging sentence. Do not solve it or give a detailed step-by-step plan:\n${question}`;
    try {
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: request }) });
      const data = await response.json();
      if (!response.ok) throw new Error('coach unavailable');
      reply.textContent = data.answer;
      lastAnswer = data.answer;
      replyButton.disabled = false;
      if (kind === 'notes' && typeof brain !== 'undefined') {
        brain.notes.push({ id: Date.now(), title: 'AI Coach note', text: data.answer, tag: 'Ideas', updated: Date.now() });
        saveBrain();
        renderBrain();
      }
    } catch (error) {
      reply.textContent = 'I couldn’t reach OpenAI. Check that the Playground server is running, your key is valid, and you have internet.';
    } finally {
      notesButton.disabled = false;
      adviceButton.disabled = false;
    }
  }
  notesButton.onclick = () => ask('notes');
  adviceButton.onclick = () => ask('advice');
  replyButton.onclick = () => ask('reply');
})();
