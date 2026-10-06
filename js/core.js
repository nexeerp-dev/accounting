/* BrainLedger core: namespace, helpers, progress & gamification */
(function () {
  const HF = (window.HF = window.HF || {});
  HF.parts = [];
  HF.chapters = [];
  HF.widgets = {};
  HF.glossary = [];

  /* ---------- registration ---------- */
  HF.addPart = function (part) {
    HF.parts.push(part);
  };
  HF.addChapter = function (ch) {
    ch.num = HF.chapters.length + 1;
    HF.chapters.push(ch);
    const part = HF.parts.find((p) => p.id === ch.part);
    if (part) (part.chapters = part.chapters || []).push(ch.id);
  };
  HF.chapter = (id) => HF.chapters.find((c) => c.id === id);

  /* ---------- DOM helpers ---------- */
  HF.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    kids.flat(Infinity).forEach((k) => {
      if (k == null || k === false) return;
      el.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k);
    });
    return el;
  };
  HF.$ = (sel, root) => (root || document).querySelector(sel);
  HF.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  HF.money = function (n, opts) {
    if (n == null || isNaN(n)) return '';
    const neg = n < 0;
    const s = Math.abs(Math.round(n * 100) / 100).toLocaleString('en-US', {
      minimumFractionDigits: opts && opts.dec ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return (neg ? '−' : '') + (opts && opts.sym === false ? '' : '$') + s;
  };
  HF.num = (n, d = 2) => (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US');
  HF.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- progress storage ---------- */
  const KEY = 'brainledger.v1';
  const blank = () => ({ read: {}, quiz: {}, xp: 0, badges: [], streak: { last: null, count: 0 }, sessions: 0, cards: {}, name: '' });
  let state;
  try {
    state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch (e) {
    state = blank();
  }
  HF.state = state;
  HF.save = function () {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
    HF.emit('progress');
  };
  HF.resetProgress = function () {
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, blank());
    HF.save();
  };

  /* ---------- tiny event bus ---------- */
  const listeners = {};
  HF.on = (ev, fn) => (listeners[ev] = listeners[ev] || []).push(fn);
  HF.emit = (ev, data) => (listeners[ev] || []).forEach((fn) => fn(data));

  /* ---------- gamification ---------- */
  HF.LEVELS = [
    [0, 'Shoebox Keeper'],
    [100, 'Petty-Cash Padawan'],
    [300, 'Journal Junior'],
    [600, 'Ledger Lieutenant'],
    [1000, 'Trial-Balance Tamer'],
    [1600, 'Statement Sculptor'],
    [2400, 'Ratio Ranger'],
    [3400, 'Close Commander'],
    [4800, 'Chief Number Wizard'],
  ];
  HF.level = function (xp = state.xp) {
    let idx = 0;
    HF.LEVELS.forEach((l, i) => {
      if (xp >= l[0]) idx = i;
    });
    const cur = HF.LEVELS[idx];
    const next = HF.LEVELS[idx + 1];
    return {
      n: idx + 1,
      name: cur[1],
      floor: cur[0],
      next: next ? next[0] : null,
      pct: next ? Math.round(((xp - cur[0]) / (next[0] - cur[0])) * 100) : 100,
    };
  };

  HF.BADGES = {
    first_steps: { icon: '👣', name: 'First Steps', desc: 'Finished your first chapter' },
    balanced: { icon: '⚖️', name: 'Perfectly Balanced', desc: 'Balanced the accounting equation' },
    quiz_ace: { icon: '🎯', name: 'Quiz Ace', desc: 'Scored 100% on a chapter quiz' },
    part1: { icon: '🧱', name: 'Foundation Builder', desc: 'Completed every Part 1 chapter' },
    part2: { icon: '📊', name: 'Statement Maker', desc: 'Completed every Part 2 chapter' },
    part3: { icon: '🏦', name: 'Balance Sheet Boss', desc: 'Completed every Part 3 chapter' },
    part4: { icon: '🧠', name: 'Big Brain', desc: 'Completed every Part 4 chapter' },
    part5: { icon: '🟣', name: 'Odoo Operator', desc: 'Completed every Odoo chapter' },
    session3: { icon: '🔥', name: 'On a Roll', desc: 'Finished 3 quick sessions' },
    streak3: { icon: '📅', name: 'Habit Forming', desc: '3-day learning streak' },
    cards50: { icon: '🃏', name: 'Card Shark', desc: 'Reviewed 50 flashcards' },
    exam: { icon: '🎓', name: 'Graduate', desc: 'Passed the final exam (70%+)' },
    widget10: { icon: '🕹️', name: 'Button Pusher', desc: 'Solved 10 interactive exercises' },
  };

  HF.toast = function (html, kind) {
    let wrap = HF.$('#toasts');
    if (!wrap) {
      wrap = HF.h('div', { id: 'toasts', 'aria-live': 'polite' });
      document.body.appendChild(wrap);
    }
    const t = HF.h('div', { class: 'toast ' + (kind || ''), html });
    wrap.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3800);
  };

  HF.award = function (badge) {
    if (state.badges.includes(badge) || !HF.BADGES[badge]) return;
    state.badges.push(badge);
    const b = HF.BADGES[badge];
    HF.toast(`<span class="toast-icon">${b.icon}</span><b>Badge unlocked:</b> ${b.name}`, 'badge');
    HF.confetti();
    HF.save();
  };

  HF.addXP = function (n, why) {
    const before = HF.level().n;
    state.xp += n;
    touchStreak();
    HF.save();
    if (why) HF.toast(`<b>+${n} XP</b> ${why}`, 'xp');
    const after = HF.level();
    if (after.n > before) {
      setTimeout(() => HF.toast(`<span class="toast-icon">⬆️</span><b>Level ${after.n}!</b> You are now a <i>${after.name}</i>`, 'badge'), 400);
      HF.confetti();
    }
  };

  // award XP for an interactive exercise once per id
  HF.solved = function (id, xp = 15) {
    state.solved = state.solved || {};
    if (state.solved[id]) return;
    state.solved[id] = 1;
    HF.addXP(xp, 'exercise solved');
    if (Object.keys(state.solved).length >= 10) HF.award('widget10');
  };

  function touchStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const s = state.streak;
    if (s.last === today) return;
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.count = s.last === y ? s.count + 1 : 1;
    s.last = today;
    if (s.count >= 3) HF.award('streak3');
  }

  HF.markRead = function (id) {
    if (state.read[id]) return;
    state.read[id] = Date.now();
    HF.addXP(50, 'chapter complete');
    if (Object.keys(state.read).length === 1) HF.award('first_steps');
    HF.parts.forEach((p) => {
      if (p.badge && p.chapters && p.chapters.every((c) => state.read[c])) HF.award(p.badge);
    });
    HF.save();
  };

  HF.recordQuiz = function (id, pct) {
    const prev = state.quiz[id] || 0;
    if (pct > prev) {
      state.quiz[id] = pct;
      const gained = Math.round(((pct - prev) / 100) * 60);
      if (gained > 0) HF.addXP(gained, 'quiz score');
    }
    if (pct === 100) HF.award('quiz_ace');
    HF.save();
  };

  /* ---------- confetti ---------- */
  HF.confetti = function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#e4572e', '#f2c14e', '#2e86ab', '#3a9d5d', '#8e5ea2'];
    const box = HF.h('div', { class: 'confetti' });
    for (let i = 0; i < 70; i++) {
      const s = HF.h('i');
      s.style.left = Math.random() * 100 + 'vw';
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random() * 0.4 + 's';
      s.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
      s.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3500);
  };

  /* ---------- widgets ---------- */
  HF.widget = function (name, fn) {
    HF.widgets[name] = fn;
  };
  HF.renderWidget = function (name, opts) {
    const wrap = HF.h('div', { class: 'widget' });
    const fn = HF.widgets[name];
    if (!fn) {
      wrap.textContent = 'Missing widget: ' + name;
      return wrap;
    }
    try {
      fn(wrap, opts || {});
    } catch (e) {
      console.error(e);
      wrap.textContent = 'Widget failed to load: ' + name;
    }
    return wrap;
  };
})();
