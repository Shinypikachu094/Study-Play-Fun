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
  if (label) label.textContent = 'Real OpenAI coach';
  if (copy) copy.textContent = 'Ask about a school assignment, study goal, or brainstorming idea. Your question goes through the local helper, which keeps your key private.';
  async function ask(kind) {
    const question = prompt.value.trim();
    if (!question) { reply.textContent = 'Write an idea or assignment first.'; return; }
    reply.textContent = 'Thinking…';
    notesButton.disabled = true;
    adviceButton.disabled = true;
    const request = kind === 'notes'
      ? `Turn this exact educational idea into one sticky note. Use the subject and details I gave you, add one specific next step, and make the note useful for me:\n${question}`
      : `Give personalized feedback for this exact educational goal. Mention the subject or idea I gave you, then give one specific next step and one encouraging sentence:\n${question}`;
    try {
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: request }) });
      const data = await response.json();
      if (!response.ok) throw new Error('coach unavailable');
      reply.textContent = data.answer;
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
})();
