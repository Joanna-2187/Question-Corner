// Question Corner widget.
// Flow: ask questions -> end session -> see log + study guide -> new session.
// The session lives in sessionStorage, so a reload keeps it and closing the tab clears it.
(() => {
  const $ = (id) => document.getElementById(id);
  const AUTO_GUIDE_MIN_QUESTIONS = 3;

  const state = { log: [], guide: '' };

  // ---------- Storage ----------

  const store = {
    load() {
      try {
        const saved = JSON.parse(sessionStorage.getItem('qc-session') || '{}');
        state.log = Array.isArray(saved.log) ? saved.log : [];
        state.guide = saved.guide || '';
      } catch { /* storage blocked: start fresh */ }
    },
    save() {
      try { sessionStorage.setItem('qc-session', JSON.stringify(state)); } catch { /* ignore */ }
    },
  };

  // ---------- Server ----------

  async function api(path, body) {
    let res;
    try {
      res = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
    } catch {
      throw new Error('Could not reach the Question Corner server. Is it running?');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Server replied ${res.status} ${res.statusText}. Is this page served by "npm start"?`);
    }
    return data;
  }

  // ---------- Rendering (text only, never innerHTML) ----------

  function show(view) {
    for (const id of ['qc-ask', 'qc-summary']) $(id).hidden = id !== view;
    $('qc-end').hidden = view !== 'qc-ask';
  }

  function entryNode(entry) {
    const li = document.createElement('li');
    const q = document.createElement('div');
    q.className = 'qc-q';
    const tag = document.createElement('span');
    tag.className = 'qc-tag';
    tag.textContent = entry.mode === 'hint' ? 'Hint' : 'Answer';
    q.append(tag, entry.question);
    const a = document.createElement('div');
    a.className = 'qc-a';
    a.textContent = entry.answer;
    li.append(q, a);
    return li;
  }

  function renderList(listEl) {
    listEl.replaceChildren(...state.log.map(entryNode));
  }

  // "# heading" lines become <h3>, "- bullet" lines become <li>.
  function renderGuide(text) {
    const root = $('qc-guide');
    root.replaceChildren();
    let list = null;
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('#')) {
        const h = document.createElement('h3');
        h.textContent = line.replace(/^#+\s*/, '');
        root.append(h);
        list = null;
      } else {
        if (!list) {
          list = document.createElement('ul');
          root.append(list);
        }
        const li = document.createElement('li');
        li.textContent = line.replace(/^[-*]\s*/, '');
        list.append(li);
      }
    }
  }

  function setBusy(busy) {
    for (const b of document.querySelectorAll('#qc-form button, #qc-guide-btn')) b.disabled = busy;
  }

  function setGuideButton(hasGuide) {
    $('qc-guide-btn').textContent = hasGuide ? 'Regenerate study guide' : 'Generate study guide';
  }

  // ---------- Actions ----------

  function enterAsk() {
    renderList($('qc-thread'));
    show('qc-ask');
    $('qc-question').focus();
  }

  async function ask(e) {
    e.preventDefault();
    const error = $('qc-ask-error');
    error.textContent = '';
    const question = $('qc-question').value.trim();
    if (!question) return;
    const mode = e.submitter.value; // "hint" or "answer"
    setBusy(true);
    try {
      const { text } = await api('/api/ask', { question, mode });
      state.log.push({ question, mode, answer: text });
      store.save();
      $('qc-question').value = '';
      renderList($('qc-thread'));
      $('qc-thread').lastElementChild.scrollIntoView({ block: 'nearest' });
    } catch (err) {
      error.textContent = err.message;
    } finally {
      setBusy(false);
    }
  }

  async function makeGuide() {
    const error = $('qc-summary-error');
    error.textContent = '';
    $('qc-guide').textContent = 'Writing your study guide...';
    setBusy(true);
    try {
      const { guide } = await api('/api/study-guide', { log: state.log });
      state.guide = guide;
      store.save();
      renderGuide(guide);
      setGuideButton(true);
    } catch (err) {
      $('qc-guide').textContent = '';
      error.textContent = err.message;
    } finally {
      setBusy(false);
    }
  }

  function endSession() {
    show('qc-summary');
    $('qc-summary-error').textContent = '';
    const hasQuestions = state.log.length > 0;
    $('qc-empty').hidden = hasQuestions;
    $('qc-guide-wrap').hidden = !hasQuestions;
    $('qc-copy').hidden = !hasQuestions;
    renderList($('qc-log'));
    $('qc-guide').replaceChildren();
    setGuideButton(Boolean(state.guide));
    if (state.guide) {
      renderGuide(state.guide);
    } else if (state.log.length >= AUTO_GUIDE_MIN_QUESTIONS) {
      makeGuide();
    }
  }

  async function copyAll() {
    const log = state.log
      .map((e, i) => `${i + 1}. [${e.mode}] ${e.question}\n   ${e.answer}`)
      .join('\n\n');
    const text = `QUESTION LOG\n\n${log}${state.guide ? `\n\nSTUDY GUIDE\n\n${state.guide}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      $('qc-copy').textContent = 'Copied!';
    } catch {
      $('qc-summary-error').textContent = 'Copy failed. Select the text and copy it manually.';
    }
  }

  function newSession() {
    state.log = [];
    state.guide = '';
    $('qc-copy').textContent = 'Copy log + guide';
    store.save();
    enterAsk();
  }

  function setOpen(open) {
    $('qc-panel').hidden = !open;
    $('qc-launcher').setAttribute('aria-expanded', String(open));
    if (open && !$('qc-ask').hidden) $('qc-question').focus();
  }

  // ---------- Start-up ----------

  function init() {
    store.load();
    $('qc-launcher').addEventListener('click', () => setOpen($('qc-panel').hidden));
    $('qc-close').addEventListener('click', () => { setOpen(false); $('qc-launcher').focus(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('qc-panel').hidden) setOpen(false);
    });
    $('qc-form').addEventListener('submit', ask);
    $('qc-end').addEventListener('click', endSession);
    $('qc-guide-btn').addEventListener('click', makeGuide);
    $('qc-copy').addEventListener('click', copyAll);
    $('qc-new').addEventListener('click', newSession);

    renderList($('qc-thread'));
    show('qc-ask');
  }

  init();
})();
