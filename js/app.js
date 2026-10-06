/* BrainLedger app: router, block renderers, pages, quiz & session engine */
(function () {
  const HF = window.HF;
  const h = HF.h;
  const main = () => HF.$('#main');

  /* =========================================================
     BLOCK RENDERERS — the "Head First" page vocabulary
     ========================================================= */
  const B = {};
  B.h = (b, ctx) => {
    ctx.toc.push(b.text);
    return h('h2', { class: 'sec', id: 'sec-' + ctx.toc.length }, h('span', { class: 'sec-n' }, ctx.toc.length), b.text);
  };
  B.h3 = (b) => h('h3', { class: 'sub', html: b.text });
  B.p = (b) => h('p', { html: b.html });
  B.lead = (b) => h('p', { class: 'lead', html: b.html });
  B.list = (b) => h(b.ordered ? 'ol' : 'ul', { class: 'list' }, b.items.map((i) => h('li', { html: i })));
  B.sticky = (b) => h('div', { class: 'sticky ' + (b.side || '') + (b.color ? ' ' + b.color : ''), html: b.html });
  B.formula = (b) => h('div', { class: 'formula' }, h('div', { class: 'formula-eq', html: b.html }), b.note ? h('div', { class: 'formula-note', html: b.note }) : null);
  B.brain = (b) => box('brain', 'BRAIN POWER', 'brain', b.html);
  B.watch = (b) => box('watch', 'Watch it!', 'warn', b.html);
  B.relax = (b) => box('relax', 'RELAX', 'flame', b.html);
  B.odoo = (b) =>
    h(
      'div',
      { class: 'odoo-tip' },
      h('div', { class: 'odoo-tip-head' }, h('span', { class: 'odoo-dot' }), b.title || 'In Odoo'),
      b.path ? h('div', { class: 'odoo-path', html: b.path.split('>').map((s) => `<span>${s.trim()}</span>`).join('<i>›</i>') }) : null,
      h('div', { html: b.html })
    );
  function box(cls, label, icon, html) {
    return h('div', { class: 'box ' + cls }, h('div', { class: 'box-head' }, h('span', { class: 'box-icon', html: HF.icon(icon) }), h('span', { class: 'box-label' }, label)), h('div', { class: 'box-body', html }));
  }
  B.nodumb = (b) =>
    h(
      'div',
      { class: 'nodumb' },
      h('div', { class: 'nodumb-head', html: '<small>there are no</small><br>Dumb Questions' }),
      b.qa.map(([q, a]) => h('div', { class: 'qa' }, h('p', { class: 'q', html: '<b>Q:</b> ' + q }), h('p', { class: 'a', html: '<b>A:</b> ' + a })))
    );
  B.pencil = (b) => {
    const el = h('div', { class: 'box pencil' }, h('div', { class: 'box-head' }, h('span', { class: 'box-icon', html: HF.icon('pencil') }), h('span', { class: 'box-label' }, 'Sharpen your pencil')), h('div', { class: 'box-body', html: b.html || '' }));
    const list = h('ol', { class: 'pencil-list' });
    (b.items || []).forEach((it, i) => {
      const ans = h('div', { class: 'pencil-a', html: it.a });
      const inp = it.input ? h('input', { class: 'pencil-in', placeholder: 'your answer…', 'aria-label': 'Your answer' }) : null;
      const btn = h('button', { class: 'btn tiny ghost', type: 'button' }, 'Show answer');
      btn.addEventListener('click', () => {
        ans.classList.toggle('show');
        btn.textContent = ans.classList.contains('show') ? 'Hide answer' : 'Show answer';
        if (ans.classList.contains('show')) HF.solved('pencil-' + it.q.slice(0, 40), 3);
      });
      list.appendChild(h('li', {}, h('div', { class: 'pencil-q', html: it.q }), inp, btn, ans));
    });
    el.querySelector('.box-body').appendChild(list);
    return el;
  };
  B.bullets = (b) => h('div', { class: 'bullets' }, h('div', { class: 'bullets-head' }, 'BULLET POINTS'), h('ul', {}, b.items.map((i) => h('li', { html: i }))));
  B.chat = (b) =>
    h(
      'div',
      { class: 'chat' },
      h('div', { class: 'chat-head', html: `<span class="chat-icon">${HF.icon('chat')}</span><div><small>Fireside Chats</small><br><b>${b.title}</b></div>` }),
      h('div', { class: 'chat-who' }, h('span', {}, b.left), h('span', {}, b.right)),
      b.lines.map(([side, text]) => h('div', { class: 'chat-line ' + (side === 'L' ? 'l' : 'r') }, h('div', { class: 'chat-bubble', html: text })))
    );
  B.say = (b) => h('div', { class: 'callout ' + (b.right ? 'right' : '') }, h('div', { class: 'callout-av', html: HF.avatar(b.who, 72) + `<span class="callout-name">${(HF.chars[b.who] || {}).name || ''}</span>` }), h('div', { class: 'bubble' + (b.think ? ' think' : ''), html: b.html }));
  B.story = (b) =>
    h(
      'div',
      { class: 'story' },
      b.panels.map((p, i) => h('div', { class: 'panel', style: { animationDelay: i * 0.15 + 's' } }, p.art ? h('div', { class: 'panel-art', html: HF.art(p.art) }) : h('div', { class: 'panel-av', html: HF.avatar(p.who, 64) }), h('div', { class: 'panel-text' + (p.think ? ' think' : ''), html: p.text })))
    );
  B.art = (b) => {
    const fig = h('figure', { class: 'figure ' + (b.side || '') }, h('div', { class: 'fig-art', html: HF.art(b.name) }));
    (b.notes || []).forEach((n) => fig.appendChild(h('div', { class: 'annot', style: { left: n.x + '%', top: n.y + '%' }, html: n.t })));
    if (b.caption) fig.appendChild(h('figcaption', { html: b.caption }));
    return fig;
  };
  B.table = (b) =>
    h(
      'div',
      { class: 'table-wrap' },
      b.caption ? h('div', { class: 'table-cap', html: b.caption }) : null,
      h('table', { class: 'data' + (b.compact ? ' compact' : '') }, h('thead', {}, h('tr', {}, b.head.map((c) => h('th', { html: c })))), h('tbody', {}, b.rows.map((r) => h('tr', { class: r._cls || '' }, (r.cells || r).map((c) => h('td', { html: String(c) }))))))
    );
  B.entry = (b) => {
    const el = h('div', { class: 'je' }, b.title ? h('div', { class: 'je-title', html: b.title }) : null, b.date ? h('div', { class: 'je-date' }, b.date) : null);
    b.lines.forEach(([acct, dr, cr]) => el.appendChild(h('div', { class: 'je-line' + (cr ? ' cr' : '') }, h('span', { html: (cr ? 'To ' : '') + acct }), h('span', {}, dr ? HF.money(dr, { sym: false }) : ''), h('span', {}, cr ? HF.money(cr, { sym: false }) : ''))));
    if (b.narr) el.appendChild(h('div', { class: 'je-narr', html: '(' + b.narr + ')' }));
    return el;
  };
  B.cards = (b) => h('div', { class: 'cards cols-' + (b.cols || 3) }, b.items.map((c) => h('div', { class: 'card ' + (c.color || '') }, c.icon ? h('div', { class: 'card-icon' }, c.icon) : null, h('h4', { html: c.t }), h('p', { html: c.d }))));
  B.compare = (b) => h('div', { class: 'compare' }, b.cols.map((c) => h('div', { class: 'compare-col ' + (c.color || '') }, h('h4', { html: c.t }), h('ul', {}, c.items.map((i) => h('li', { html: i }))))));
  B.steps = (b) => h('ol', { class: 'steps' }, b.items.map((s, i) => h('li', { style: { animationDelay: i * 0.1 + 's' } }, h('div', { class: 'step-n' }, i + 1), h('div', {}, h('b', { html: s.t }), h('p', { html: s.d })))));
  B.widget = (b) => HF.renderWidget(b.name, b.opts);
  B.flow = (b) => h('div', { class: 'flow' }, b.items.map((it, i) => [i ? h('div', { class: 'flow-arrow' }, '➜') : null, h('div', { class: 'flow-node', style: it.c ? { background: it.c } : null, html: it.t || it })]));
  B.reveal = (b) => {
    const d = h('details', { class: 'reveal' }, h('summary', { html: b.q }), h('div', { html: b.a }));
    return d;
  };
  B.html = (b) => h('div', { html: b.html });

  HF.renderBlocks = function (blocks, ctx) {
    ctx = ctx || { toc: [] };
    const frag = h('div', { class: 'blocks' });
    blocks.forEach((b) => {
      const r = B[b.t];
      if (!r) return console.warn('Unknown block', b.t);
      const el = r(b, ctx);
      el.classList.add('reveal-on-scroll');
      frag.appendChild(el);
    });
    return frag;
  };

  /* =========================================================
     ROUTER
     ========================================================= */
  const routes = [];
  const route = (re, fn) => routes.push([re, fn]);
  function go() {
    const hash = location.hash.replace(/^#/, '') || '/';
    for (const [re, fn] of routes) {
      const m = hash.match(re);
      if (m) {
        main().innerHTML = '';
        window.onscroll = null;
        window.scrollTo(0, 0);
        fn(...m.slice(1));
        HF.$$('.nav-links a').forEach((a) => a.classList.toggle('on', hash.startsWith(a.getAttribute('href').slice(1)) && a.getAttribute('href') !== '#/'));
        HF.$('#nav').classList.remove('open');
        observe();
        return;
      }
    }
    location.hash = '#/';
  }
  window.addEventListener('hashchange', go);

  function observe() {
    if (!('IntersectionObserver' in window)) return HF.$$('.reveal-on-scroll').forEach((e) => e.classList.add('in'));
    const io = new IntersectionObserver(
      (ents) =>
        ents.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -40px 0px' }
    );
    HF.$$('.reveal-on-scroll:not(.in)').forEach((e) => io.observe(e));
  }

  /* =========================================================
     SHARED BITS
     ========================================================= */
  const chStatus = (c) => (HF.state.read[c.id] ? (HF.state.quiz[c.id] >= 70 ? 'mastered' : 'read') : 'new');
  const nextChapter = () => HF.chapters.find((c) => !HF.state.read[c.id]) || HF.chapters[0];
  function chapterCard(c) {
    const st = chStatus(c);
    const q = HF.state.quiz[c.id];
    return h(
      'a',
      { class: 'ch-card ' + st, href: '#/ch/' + c.id },
      h('div', { class: 'ch-card-art', html: HF.art(c.art) }),
      h('div', { class: 'ch-card-body' }, h('div', { class: 'ch-card-num' }, 'Chapter ' + c.num), h('h4', {}, c.title), h('p', {}, c.subtitle), h('div', { class: 'ch-card-meta' }, h('span', { class: 'lvl ' + c.level.toLowerCase() }, c.level), h('span', {}, '⏱ ' + c.minutes + ' min'), q != null ? h('span', {}, '🎯 ' + q + '%') : null)),
      h('div', { class: 'ch-card-badge' }, st === 'mastered' ? '★' : st === 'read' ? '✔' : '')
    );
  }
  function updateNav() {
    const lv = HF.level();
    const chip = HF.$('#xpchip');
    if (chip) chip.innerHTML = `<span class="xp-lvl">Lv ${lv.n}</span><span class="xp-bar"><i style="width:${lv.pct}%"></i></span><span class="xp-n">${HF.state.xp} XP</span>`;
    const st = HF.$('#streak');
    if (st) st.innerHTML = HF.state.streak.count ? `🔥 ${HF.state.streak.count}` : '';
  }
  HF.on('progress', updateNav);

  /* =========================================================
     HOME
     ========================================================= */
  route(/^\/$/, () => {
    const nx = nextChapter();
    const read = Object.keys(HF.state.read).length;
    const m = main();
    m.append(
      h(
        'section',
        { class: 'hero' },
        h(
          'div',
          { class: 'hero-text' },
          h('div', { class: 'hero-kicker' }, 'A Brain-Friendly Guide'),
          h('h1', { html: 'Accounting<br><span>the fun way.</span>' }),
          h('p', { class: 'lead', html: 'From your very first debit to closing the books in <b>Odoo</b>. Pictures, puzzles, stories, simulators and quizzes — because your brain remembers what it <i>plays with</i>, not what it skims.' }),
          h(
            'div',
            { class: 'hero-cta' },
            h('a', { class: 'btn big', href: '#/ch/' + nx.id }, read ? `Continue: Ch ${nx.num} →` : 'Start Chapter 1 →'),
            h('a', { class: 'btn big ghost', href: '#/session' }, '⚡ 10-minute session')
          ),
          h('div', { class: 'hero-stats', html: `<span><b>${HF.chapters.length}</b> chapters</span><span><b>${HF.chapters.reduce((s, c) => s + (c.quiz || []).length, 0)}</b> quiz questions</span><span><b>${HF.glossary.length}</b> glossary terms</span><span><b>15+</b> simulators</span>` })
        ),
        h('div', { class: 'hero-art' }, h('div', { class: 'hero-scene', html: HF.art('shop') }), h('div', { class: 'callout hero-callout' }, h('div', { class: 'callout-av', html: HF.avatar('max', 70) }), h('div', { class: 'bubble', html: 'I sell bikes. I just want to know: <b>am I actually making money?!</b>' })))
      )
    );
    // "How to use this site" — the metacognition page
    m.append(
      h(
        'section',
        { class: 'howto' },
        h('h2', { class: 'marker' }, 'How to use this site'),
        h('p', { class: 'center lead', html: 'We know what you’re thinking: <i>“Accounting? Fun? Is this some kind of joke?”</i>' }),
        HF.renderBlocks(
          [
            {
              t: 'cards',
              cols: 4,
              items: [
                { icon: '👀', t: 'Pictures first', d: 'Your brain is tuned for visuals. Every idea comes with a drawing, a diagram or a simulator.' },
                { icon: '🗣️', t: 'Conversational', d: 'We talk to you like a friend at the coffee shop, not like a 900-page standards manual.' },
                { icon: '✏️', t: 'Do the exercises', d: 'Sharpen-your-pencil, drag-and-drop, journal builders. Learning sticks when your hands are busy.' },
                { icon: '🔁', t: 'Repeat & quiz', d: 'Flashcards, chapter quizzes, quick sessions and a final exam lock it into long-term memory.' },
              ],
            },
          ],
          { toc: [] }
        )
      )
    );
    // parts
    const parts = h('section', { class: 'parts' }, h('h2', { class: 'marker' }, 'Your road map'));
    HF.parts.forEach((p) => {
      const chs = (p.chapters || []).map(HF.chapter);
      const done = chs.filter((c) => HF.state.read[c.id]).length;
      parts.appendChild(
        h(
          'a',
          { class: 'part-card', href: '#/learn#' + p.id, style: { '--pc': p.color } },
          h('div', { class: 'part-n' }, 'Part ' + p.n),
          h('h3', {}, p.title),
          h('p', {}, p.desc),
          h('div', { class: 'part-prog' }, h('i', { style: { width: (chs.length ? (done / chs.length) * 100 : 0) + '%' } })),
          h('small', {}, `${done}/${chs.length} chapters`)
        )
      );
    });
    m.append(parts);
    m.append(
      h(
        'section',
        { class: 'meet' },
        h('h2', { class: 'marker' }, 'Meet the cast'),
        h(
          'div',
          { class: 'cast' },
          ['max', 'penny', 'sam', 'audrey', 'robo'].map((k) =>
            h('div', { class: 'cast-m' }, h('div', { html: HF.avatar(k, 96) }), h('b', {}, HF.chars[k].name), h('small', {}, HF.chars[k].role), h('p', {}, { max: 'Runs a bike shop. Great at bikes, scared of numbers.', penny: 'Bookkeeper. Has a rule for everything and a pencil behind her ear.', sam: 'Commerce student. Asks the questions you were too shy to ask.', audrey: 'Auditor. Trusts nobody. Especially not round numbers.', robo: 'An ERP robot who lives inside Odoo and loves automation.' }[k]))
          )
        )
      )
    );
  });

  /* =========================================================
     LEARN — curriculum map
     ========================================================= */
  route(/^\/learn/, () => {
    const m = main();
    m.append(h('div', { class: 'page-head' }, h('h1', { class: 'marker' }, 'The Curriculum'), h('p', { class: 'lead' }, 'Five parts, basic to advanced. Go in order, or jump to whatever is bugging you today.')));
    HF.parts.forEach((p) => {
      const sec = h('section', { class: 'part', id: p.id, style: { '--pc': p.color } }, h('div', { class: 'part-head' }, h('span', { class: 'part-n' }, 'Part ' + p.n), h('h2', {}, p.title), h('p', {}, p.desc)));
      const grid = h('div', { class: 'ch-grid' });
      (p.chapters || []).forEach((id) => grid.appendChild(chapterCard(HF.chapter(id))));
      sec.appendChild(grid);
      m.appendChild(sec);
    });
    const anchor = location.hash.split('#')[2];
    if (anchor) setTimeout(() => HF.$('#' + anchor) && HF.$('#' + anchor).scrollIntoView({ behavior: 'smooth' }), 50);
  });

  /* =========================================================
     CHAPTER
     ========================================================= */
  route(/^\/ch\/([\w-]+)$/, (id) => {
    const c = HF.chapter(id);
    if (!c) return (location.hash = '#/learn');
    const m = main();
    const part = HF.parts.find((p) => p.id === c.part);
    const prev = HF.chapters[c.num - 2],
      next = HF.chapters[c.num];
    const ctx = { toc: [] };
    const blocks = HF.renderBlocks(c.blocks, ctx);
    m.append(
      h(
        'header',
        { class: 'ch-hero', style: { '--pc': part ? part.color : '#e4572e' } },
        h('div', { class: 'ch-hero-text' }, h('a', { class: 'ch-part', href: '#/learn#' + c.part }, part ? `Part ${part.n}: ${part.title}` : ''), h('div', { class: 'ch-num' }, c.num), h('h1', {}, c.title), h('p', { class: 'ch-sub' }, c.subtitle), h('div', { class: 'ch-meta' }, h('span', { class: 'lvl ' + c.level.toLowerCase() }, c.level), h('span', {}, '⏱ ' + c.minutes + ' min read'), HF.state.read[c.id] ? h('span', { class: 'done-tag' }, '✔ completed') : null)),
        h('div', { class: 'ch-hero-art', html: HF.art(c.art) }),
        c.quote ? h('div', { class: 'ch-quote', html: c.quote }) : null
      )
    );
    const layout = h('div', { class: 'ch-layout' });
    const toc = h(
      'nav',
      { class: 'ch-toc', 'aria-label': 'In this chapter' },
      h('button', { class: 'toc-head', type: 'button', 'aria-expanded': 'false', onclick: (e) => { const nav = e.currentTarget.parentNode; nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', nav.classList.contains('open')); } }, 'In this chapter (' + ctx.toc.length + ' sections)'),
      h(
        'ol',
        {},
        ctx.toc.map((t, i) =>
          h(
            'li',
            {},
            h(
              'a',
              {
                href: '#/ch/' + c.id,
                onclick: (e) => {
                  e.preventDefault();
                  e.currentTarget.closest('.ch-toc').classList.remove('open');
                  HF.$('#sec-' + (i + 1)).scrollIntoView({ behavior: 'smooth', block: 'start' });
                },
              },
              t
            )
          )
        )
      ),
      h('a', { class: 'btn tiny', href: '#/ch/' + c.id + '/quiz' }, '🎯 Chapter quiz')
    );
    const article = h('article', { class: 'ch-body' });
    if (c.goals) article.appendChild(h('div', { class: 'goals' }, h('div', { class: 'goals-head' }, 'By the end of this chapter you’ll be able to…'), h('ul', {}, c.goals.map((g) => h('li', { html: g })))));
    article.appendChild(blocks);
    const done = h('button', { class: 'btn big', type: 'button' }, HF.state.read[c.id] ? '✔ Completed' : 'I’ve got it! Mark complete (+50 XP)');
    done.addEventListener('click', () => {
      HF.markRead(c.id);
      done.textContent = '✔ Completed';
    });
    article.appendChild(
      h(
        'div',
        { class: 'ch-end' },
        h('h2', { class: 'marker' }, 'Chapter ' + c.num + ' — done?'),
        h('p', {}, 'Lock it in: mark the chapter complete, then prove it with the quiz. Score 70%+ to master it ★.'),
        h('div', { class: 'w-actions center' }, done, h('a', { class: 'btn big ghost', href: '#/ch/' + c.id + '/quiz' }, '🎯 Take the quiz (' + (c.quiz || []).length + ' Qs)')),
        c.cards && c.cards.length ? HF.renderWidget('flashcards', { title: 'Chapter flashcards', cards: c.cards }) : null,
        h('div', { class: 'ch-nav' }, prev ? h('a', { href: '#/ch/' + prev.id, class: 'btn ghost' }, '← ' + prev.title) : h('span'), next ? h('a', { href: '#/ch/' + next.id, class: 'btn ghost' }, next.title + ' →') : h('a', { href: '#/exam', class: 'btn' }, 'Final exam 🎓'))
      )
    );
    layout.append(toc, article);
    m.append(h('div', { class: 'readbar' }, h('i')), layout);
    // reading progress & auto-complete near the end
    const bar = HF.$('.readbar i');
    const onScroll = () => {
      const r = article.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      bar.style.width = pct * 100 + '%';
      HF.$$('.ch-toc li').forEach((li, i) => {
        const s = HF.$('#sec-' + (i + 1));
        li.classList.toggle('on', s && s.getBoundingClientRect().top < innerHeight * 0.4);
      });
    };
    window.onscroll = onScroll;
  });

  /* =========================================================
     QUIZ engine (shared by chapter quiz, session, exam)
     ========================================================= */
  function runQuiz(container, questions, opts) {
    let i = 0,
      score = 0;
    const answers = [];
    const box = h('div', { class: 'quiz' });
    container.appendChild(box);
    function render() {
      box.innerHTML = '';
      if (i >= questions.length) return finish();
      const q = questions[i];
      const prog = h('div', { class: 'quiz-prog' }, h('i', { style: { width: (i / questions.length) * 100 + '%' } }));
      const opts2 = q.o.map((t, k) => ({ t, k }));
      const order = q.keep ? opts2 : HF.shuffle(opts2);
      const exp = h('div', { class: 'quiz-exp' });
      const nextBtn = h('button', { class: 'btn', type: 'button', style: { visibility: 'hidden' }, onclick: () => (i++, render()) }, i === questions.length - 1 ? 'See results →' : 'Next →');
      const list = h(
        'div',
        { class: 'quiz-opts' },
        order.map(({ t, k }, idx) => {
          const b = h('button', { class: 'quiz-opt', type: 'button' }, h('span', { class: 'quiz-key' }, 'ABCDEF'[idx]), h('span', { html: t }));
          b.addEventListener('click', () => {
            if (box.dataset.answered) return;
            box.dataset.answered = '1';
            const right = k === q.a;
            if (right) score++;
            answers.push({ q, right });
            b.classList.add(right ? 'right' : 'wrong');
            HF.$$('.quiz-opt', list).forEach((x, j) => order[j].k === q.a && x.classList.add('right'));
            exp.innerHTML = (right ? '<b class="pos">✔ Correct!</b> ' : '<b class="neg">✘ Not quite.</b> ') + (q.e || '');
            exp.classList.add('show');
            nextBtn.style.visibility = 'visible';
            nextBtn.focus();
          });
          return b;
        })
      );
      delete box.dataset.answered;
      box.append(prog, h('div', { class: 'quiz-count' }, `Question ${i + 1} of ${questions.length}` + (q.ch ? ` · from “${q.ch}”` : '')), h('h3', { class: 'quiz-q', html: q.q }), list, exp, h('div', { class: 'w-actions' }, nextBtn));
    }
    function finish() {
      const pct = Math.round((score / questions.length) * 100);
      const pass = pct >= 70;
      if (pass) HF.confetti();
      box.append(
        h(
          'div',
          { class: 'quiz-result' },
          h('div', { class: 'quiz-score ' + (pass ? 'pass' : 'fail') }, pct + '%'),
          h('h3', {}, pct === 100 ? 'Flawless! Your brain is a ledger.' : pass ? 'Nice work — you’ve got this!' : 'Not bad — review and try again.'),
          h('p', {}, `${score} of ${questions.length} correct.`),
          answers.some((a) => !a.right) ? h('details', { class: 'reveal' }, h('summary', {}, 'Review the ones you missed'), h('ul', {}, answers.filter((a) => !a.right).map((a) => h('li', { html: `<b>${a.q.q}</b><br>✔ ${a.q.o[a.q.a]}<br><i>${a.q.e || ''}</i>` })))) : null,
          h('div', { class: 'w-actions center' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => ((i = 0), (score = 0), answers.splice(0), render()) }, '↺ Retry'), ...(opts.after ? opts.after(pct) : []))
        )
      );
      if (opts.onDone) opts.onDone(pct);
    }
    render();
  }
  HF.runQuiz = runQuiz;

  route(/^\/ch\/([\w-]+)\/quiz$/, (id) => {
    const c = HF.chapter(id);
    if (!c) return (location.hash = '#/learn');
    const m = main();
    m.append(h('div', { class: 'page-head' }, h('a', { href: '#/ch/' + c.id, class: 'ch-part' }, '← back to chapter ' + c.num), h('h1', { class: 'marker' }, 'Quiz: ' + c.title), h('p', { class: 'lead' }, 'Score 70% or more to master this chapter.')));
    const next = HF.chapters[c.num];
    runQuiz(m, c.quiz || [], {
      onDone: (pct) => {
        HF.recordQuiz(c.id, pct);
        if (pct >= 70) HF.markRead(c.id);
      },
      after: () => [next ? h('a', { class: 'btn', href: '#/ch/' + next.id }, 'Next chapter →') : h('a', { class: 'btn', href: '#/exam' }, 'Final exam 🎓')],
    });
  });

  /* =========================================================
     QUICK SESSION — warm-up cards → learn → mini quiz
     ========================================================= */
  route(/^\/session$/, () => {
    const m = main();
    m.append(h('div', { class: 'page-head' }, h('h1', { class: 'marker' }, '⚡ Quick Session'), h('p', { class: 'lead' }, 'Got 10 minutes? Hop on. Each session = a flashcard warm-up, a mini quiz mixed from what you’ve studied, and a pointer to what to learn next.')));
    const paths = h('div', { class: 'paths' });
    const presets = [
      { id: 'mix', icon: '🎲', t: 'Smart mix', d: 'Questions from chapters you’ve read + the next one.' },
      { id: 'basics', icon: '🧱', t: 'Basics sprint', d: 'Part 1 only: equation, debits & credits, journals.' },
      { id: 'statements', icon: '📊', t: 'Statements & balance sheet', d: 'Parts 2 & 3.' },
      { id: 'advanced', icon: '🧠', t: 'Advanced drill', d: 'Tax, ratios, costing, IFRS.' },
      { id: 'odoo', icon: '🟣', t: 'Odoo practitioner', d: 'Everything about doing it in Odoo.' },
      { id: 'weak', icon: '🩹', t: 'Fix my weak spots', d: 'Chapters where your best quiz score is under 70%.' },
    ];
    presets.forEach((p) => paths.appendChild(h('button', { class: 'path-card', type: 'button', onclick: () => start(p.id) }, h('div', { class: 'path-icon' }, p.icon), h('h4', {}, p.t), h('p', {}, p.d))));
    const stage = h('div', { class: 'session-stage' });
    m.append(paths, stage);
    function pool(kind) {
      const byPart = (ids) => HF.chapters.filter((c) => ids.includes(c.part));
      let chs;
      if (kind === 'basics') chs = byPart(['p1']);
      else if (kind === 'statements') chs = byPart(['p2', 'p3']);
      else if (kind === 'advanced') chs = byPart(['p4']);
      else if (kind === 'odoo') chs = byPart(['p5']);
      else if (kind === 'weak') chs = HF.chapters.filter((c) => HF.state.read[c.id] && (HF.state.quiz[c.id] || 0) < 70);
      else {
        chs = HF.chapters.filter((c) => HF.state.read[c.id]);
        chs.push(nextChapter());
      }
      if (!chs.length) chs = [nextChapter()];
      return chs;
    }
    function start(kind) {
      paths.style.display = 'none';
      stage.innerHTML = '';
      const chs = pool(kind);
      const cards = HF.shuffle(chs.flatMap((c) => c.cards || [])).slice(0, 6);
      const qs = HF.shuffle(chs.flatMap((c) => (c.quiz || []).map((q) => Object.assign({ ch: c.title }, q)))).slice(0, 7);
      const steps = h('div', { class: 'session-steps', html: '<span class="on">1 · Warm-up</span><span>2 · Mini quiz</span><span>3 · Next up</span>' });
      stage.append(steps);
      const s1 = h('div');
      stage.append(s1);
      s1.append(
        HF.renderWidget('flashcards', {
          title: 'Warm-up: 6 flashcards',
          cards: cards.length ? cards : [['Accounting equation?', 'Assets = Liabilities + Equity']],
          onDone: () => {
            setTimeout(toQuiz, 700);
          },
        }),
        h('div', { class: 'w-actions center' }, h('button', { class: 'btn ghost', type: 'button', onclick: toQuiz }, 'Skip to quiz →'))
      );
      let quizzed = false;
      function toQuiz() {
        if (quizzed) return;
        quizzed = true;
        s1.remove();
        HF.$$('span', steps)[1].classList.add('on');
        runQuiz(stage, qs, {
          onDone: (pct) => {
            HF.state.sessions = (HF.state.sessions || 0) + 1;
            HF.addXP(20 + Math.round(pct / 5), 'session finished');
            if (HF.state.sessions >= 3) HF.award('session3');
            HF.$$('span', steps)[2].classList.add('on');
            const nx = nextChapter();
            const weak = HF.chapters.filter((c) => HF.state.read[c.id] && (HF.state.quiz[c.id] || 0) < 70).slice(0, 3);
            stage.append(h('div', { class: 'session-next' }, h('h3', { class: 'marker' }, 'Next up'), chapterCard(nx), weak.length ? h('div', {}, h('p', {}, 'Worth a re-read (quiz under 70%):'), h('div', { class: 'ch-grid small' }, weak.map(chapterCard))) : null));
          },
          after: () => [h('button', { class: 'btn', type: 'button', onclick: () => go() }, 'New session')],
        });
      }
    }
  });

  /* =========================================================
     FINAL EXAM
     ========================================================= */
  route(/^\/exam$/, () => {
    const m = main();
    m.append(h('div', { class: 'page-head' }, h('h1', { class: 'marker' }, '🎓 The Final Exam'), h('p', { class: 'lead' }, '30 questions drawn from every chapter, basic to Odoo. 70% to graduate. No peeking at your ledger!')));
    const startBtn = h('button', { class: 'btn big', type: 'button' }, 'Start the exam');
    const wrap = h('div', { class: 'center' }, startBtn);
    m.append(wrap);
    startBtn.addEventListener('click', () => {
      wrap.remove();
      const per = {};
      const qs = HF.shuffle(HF.chapters.flatMap((c) => (c.quiz || []).map((q) => Object.assign({ ch: c.title }, q))))
        .filter((q) => (per[q.ch] = (per[q.ch] || 0) + 1) <= 2)
        .slice(0, 30);
      runQuiz(m, qs, {
        onDone: (pct) => {
          HF.state.examBest = Math.max(HF.state.examBest || 0, pct);
          HF.addXP(Math.round(pct), 'final exam');
          if (pct >= 70) HF.award('exam');
        },
        after: (pct) => (pct >= 70 ? [h('a', { class: 'btn', href: '#/me' }, 'See your certificate 🎓')] : []),
      });
    });
  });

  /* =========================================================
     FLASHCARDS page
     ========================================================= */
  route(/^\/cards$/, () => {
    const m = main();
    m.append(h('div', { class: 'page-head' }, h('h1', { class: 'marker' }, '🃏 Flashcards'), h('p', { class: 'lead' }, 'Pick a deck. Flip, rate yourself, repeat. Ten minutes a day beats a five-hour cram.')));
    const sel = h('select', { 'aria-label': 'Deck' }, h('option', { value: 'all' }, 'All chapters'), HF.parts.map((p) => h('option', { value: 'part:' + p.id }, `Part ${p.n}: ${p.title}`)), HF.chapters.map((c) => h('option', { value: c.id }, `Ch ${c.num}: ${c.title}`)));
    const area = h('div');
    const draw = () => {
      area.innerHTML = '';
      const v = sel.value;
      const chs = v === 'all' ? HF.chapters : v.startsWith('part:') ? HF.chapters.filter((c) => c.part === v.slice(5)) : [HF.chapter(v)];
      area.appendChild(HF.renderWidget('flashcards', { title: 'Deck: ' + sel.selectedOptions[0].text, cards: chs.flatMap((c) => c.cards || []) }));
    };
    sel.addEventListener('change', draw);
    m.append(h('div', { class: 'center' }, h('label', { class: 'deck-pick' }, 'Deck: ', sel)), area);
    draw();
  });

  /* =========================================================
     GLOSSARY
     ========================================================= */
  route(/^\/glossary$/, () => {
    const m = main();
    m.append(h('div', { class: 'page-head' }, h('h1', { class: 'marker' }, '📖 Glossary'), h('p', { class: 'lead' }, `${HF.glossary.length} accounting terms in plain English.`)));
    const q = h('input', { type: 'search', class: 'search', placeholder: 'Search a term… (e.g. accrual, reconcile, fiscal position)', 'aria-label': 'Search glossary' });
    const list = h('div', { class: 'gloss' });
    const terms = HF.glossary.slice().sort((a, b) => a[0].localeCompare(b[0]));
    const draw = () => {
      const s = q.value.toLowerCase();
      list.innerHTML = '';
      let letter = '';
      terms
        .filter(([t, d]) => !s || t.toLowerCase().includes(s) || d.toLowerCase().includes(s))
        .forEach(([t, d]) => {
          const L = t[0].toUpperCase();
          if (L !== letter) {
            letter = L;
            list.appendChild(h('div', { class: 'gloss-letter' }, L));
          }
          list.appendChild(h('div', { class: 'gloss-item' }, h('dt', {}, t), h('dd', { html: d })));
        });
      if (!list.children.length) list.appendChild(h('p', { class: 'center' }, 'No match. Try another word.'));
    };
    q.addEventListener('input', draw);
    m.append(q, list);
    draw();
  });

  /* =========================================================
     LAB — all simulators in one place
     ========================================================= */
  route(/^\/lab$/, () => {
    const m = main();
    m.append(h('div', { class: 'page-head' }, h('h1', { class: 'marker' }, '🧪 The Lab'), h('p', { class: 'lead' }, 'Every simulator in one place. Break things. Push sliders to extremes. That’s how you build intuition.')));
    const items = [
      ['odoo', {}, 'Odoo: invoice to cash'],
      ['odoo', { mode: 'purchase' }, 'Odoo: bill to payment'],
      ['accrual', {}, 'Cash vs accrual'],
      ['depreciation', {}, 'Depreciation'],
      ['inventory', {}, 'Inventory FIFO/LIFO/AVCO'],
      ['ratios', {}, 'Financial ratios'],
      ['breakeven', {}, 'Break-even'],
      ['variance', {}, 'Variances'],
      ['loan', {}, 'Loan amortization'],
      ['tvm', {}, 'Time value of money'],
      ['tax', {}, 'VAT / GST chain'],
      ['fx', {}, 'Foreign exchange'],
      ['revrec', {}, 'Revenue recognition'],
    ];
    const nav = h('div', { class: 'lab-nav' });
    const area = h('div');
    items.forEach(([w, o, t], i) => {
      const b = h('button', { class: 'chip' + (i === 0 ? ' on' : ''), type: 'button' }, t);
      b.addEventListener('click', () => {
        HF.$$('.chip', nav).forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        area.innerHTML = '';
        area.appendChild(HF.renderWidget(w, o));
      });
      nav.appendChild(b);
    });
    area.appendChild(HF.renderWidget(items[0][0], items[0][1]));
    m.append(nav, area);
  });

  /* =========================================================
     ME — progress, badges, certificate
     ========================================================= */
  route(/^\/me$/, () => {
    const m = main();
    const s = HF.state;
    const lv = HF.level();
    const read = Object.keys(s.read).length;
    const name = h('input', { value: s.name || '', placeholder: 'Your name (for the certificate)', 'aria-label': 'Your name' });
    name.addEventListener('change', () => {
      s.name = name.value.trim();
      HF.save();
      go();
    });
    m.append(
      h('div', { class: 'page-head' }, h('h1', { class: 'marker' }, 'My Progress')),
      h(
        'div',
        { class: 'me-top' },
        h('div', { class: 'me-level' }, h('div', { class: 'me-lv' }, 'Level ' + lv.n), h('h3', {}, lv.name), h('div', { class: 'xp-bar big' }, h('i', { style: { width: lv.pct + '%' } })), h('small', {}, lv.next ? `${s.xp} / ${lv.next} XP to next level` : `${s.xp} XP — max level!`)),
        h('div', { class: 'me-stats', html: `<div><b>${read}</b>/${HF.chapters.length}<small>chapters</small></div><div><b>${Object.values(s.quiz).filter((x) => x >= 70).length}</b><small>quizzes mastered</small></div><div><b>${s.streak.count || 0}</b><small>day streak</small></div><div><b>${s.sessions || 0}</b><small>sessions</small></div><div><b>${s.examBest || 0}%</b><small>exam best</small></div>` })
      ),
      h('h2', { class: 'marker' }, 'Badges'),
      h('div', { class: 'badges' }, Object.entries(HF.BADGES).map(([k, b]) => h('div', { class: 'badge ' + (s.badges.includes(k) ? 'got' : '') }, h('div', { class: 'badge-i' }, b.icon), h('b', {}, b.name), h('small', {}, b.desc)))),
      h('h2', { class: 'marker' }, 'Chapters'),
      h('div', { class: 'ch-grid small' }, HF.chapters.map(chapterCard))
    );
    if (s.badges.includes('exam')) {
      m.append(
        h('h2', { class: 'marker' }, 'Your certificate'),
        h('label', { class: 'deck-pick' }, 'Name: ', name),
        h('div', { class: 'cert', html: `<div class="cert-in"><small>BrainLedger certifies that</small><h2>${(s.name || 'A Determined Learner').replace(/[<>&]/g, '')}</h2><p>has completed the brain-friendly journey through accounting — from the accounting equation to closing the books in Odoo — and passed the final exam with <b>${s.examBest}%</b>.</p><div class="cert-foot"><span>${new Date().toLocaleDateString()}</span><span>${HF.icon('brain')}</span><span>${lv.name}</span></div></div>` }),
        h('div', { class: 'center' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => window.print() }, '🖨 Print certificate'))
      );
    }
    m.append(
      h(
        'div',
        { class: 'center danger-zone' },
        h(
          'button',
          {
            class: 'btn ghost',
            type: 'button',
            onclick: () => {
              if (confirm('Erase all progress, XP and badges on this device?')) {
                HF.resetProgress();
                go();
              }
            },
          },
          'Reset my progress'
        )
      )
    );
  });

  /* =========================================================
     BOOT
     ========================================================= */
  function boot() {
    HF.$('#burger').addEventListener('click', () => HF.$('#nav').classList.toggle('open'));
    const themeBtn = HF.$('#theme');
    const applyTheme = (t) => {
      if (t) document.documentElement.dataset.theme = t;
      else delete document.documentElement.dataset.theme;
    };
    let t = null;
    try {
      t = localStorage.getItem('brainledger.theme');
    } catch (e) {}
    applyTheme(t);
    themeBtn.addEventListener('click', () => {
      const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
      const nt = dark ? 'light' : 'dark';
      applyTheme(nt);
      try {
        localStorage.setItem('brainledger.theme', nt);
      } catch (e) {}
    });
    updateNav();
    go();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
