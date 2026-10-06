/* BrainLedger interactive widgets.
   Each widget: HF.widget(name, (root, opts) => { ...build UI inside root... }) */
(function () {
  const HF = window.HF;
  const h = HF.h;
  const money = HF.money;

  function frame(root, title, sub) {
    root.appendChild(
      h('div', { class: 'w-head' }, h('span', { class: 'w-tape' }, 'TRY IT'), h('h4', { class: 'w-title' }, title), sub ? h('p', { class: 'w-sub', html: sub }) : null)
    );
    const body = h('div', { class: 'w-body' });
    root.appendChild(body);
    return body;
  }
  function feedback() {
    return h('div', { class: 'w-feedback', 'aria-live': 'polite' });
  }
  function say(fb, html, kind) {
    fb.className = 'w-feedback show ' + (kind || '');
    fb.innerHTML = html;
  }
  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }
  const sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);

  /* ---------- tiny SVG chart helper ---------- */
  HF.chartSVG = function (opts) {
    // opts: {w,h, series:[{name,color,values:[..], type:'line'|'bar'}], labels:[..], yFmt, marks:[{x,y,label}]}
    const narrow = window.innerWidth < 600;
    const W = opts.w || (narrow ? 380 : 560),
      H = opts.h || (narrow ? 270 : 240),
      P = { l: narrow ? 50 : 56, r: 12, t: 14, b: 30 };
    const all = opts.series.flatMap((s) => s.values).concat(opts.yMin != null ? [opts.yMin] : [0]);
    let max = Math.max(...all),
      min = Math.min(0, ...all);
    if (max === min) max = min + 1;
    const n = opts.labels.length;
    const x = (i) => P.l + (n === 1 ? 0.5 : i / (n - 1)) * (W - P.l - P.r);
    const xb = (i) => P.l + ((i + 0.5) / n) * (W - P.l - P.r);
    const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
    const fmt = opts.yFmt || ((v) => money(v));
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const v = min + ((max - min) * k) / 4;
      g += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${P.l - 6}" y="${y(v) + 4}" text-anchor="end" class="tick">${fmt(v)}</text>`;
    }
    const step = Math.ceil(n / (narrow ? 7 : 12));
    opts.labels.forEach((l, i) => {
      if (i % step === 0) g += `<text x="${opts.series.some((s) => s.type === 'bar') ? xb(i) : x(i)}" y="${H - 10}" text-anchor="middle" class="tick">${l}</text>`;
    });
    const bars = opts.series.filter((s) => s.type === 'bar');
    const bw = ((W - P.l - P.r) / n) * 0.7;
    bars.forEach((s, si) => {
      s.values.forEach((v, i) => {
        const w = bw / bars.length;
        const bx = xb(i) - bw / 2 + si * w;
        const y0 = y(Math.max(0, v)),
          y1 = y(Math.min(0, v));
        g += `<rect class="bar" x="${bx}" y="${y0}" width="${w - 2}" height="${Math.max(1, y1 - y0)}" fill="${s.color}"><title>${s.name}: ${fmt(v)}</title></rect>`;
      });
    });
    opts.series
      .filter((s) => s.type !== 'bar')
      .forEach((s) => {
        g += `<polyline fill="none" stroke="${s.color}" stroke-width="3" stroke-linejoin="round" points="${s.values.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/>`;
      });
    (opts.marks || []).forEach((m) => {
      g += `<circle cx="${x(m.x)}" cy="${y(m.y)}" r="7" class="mark"/><text x="${x(m.x) + 10}" y="${y(m.y) - 10}" class="mark-label">${m.label}</text>`;
    });
    const legend = opts.series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('');
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg><div class="legend">${legend}</div></div>`;
  };

  /* =========================================================
     SORT: drag/tap cards into bins (Dr/Cr, A/L/E/R/X, ...)
     ========================================================= */
  HF.widget('sort', function (root, o) {
    const body = frame(root, o.title || 'Sort it out!', o.sub);
    const pool = h('div', { class: 'sort-pool' });
    const binsWrap = h('div', { class: 'sort-bins', style: { gridTemplateColumns: `repeat(${Math.min(o.bins.length, 5)}, 1fr)` } });
    const fb = feedback();
    let selected = null,
      mistakes = 0,
      placed = 0;
    const bins = {};
    o.bins.forEach((b) => {
      const zone = h('div', { class: 'sort-zone' });
      const tot = o.totals ? h('div', { class: 'sort-total' }, money(0)) : null;
      const bin = h('div', { class: 'sort-bin', 'data-bin': b.id, style: b.color ? { borderColor: b.color } : null, tabindex: 0 }, h('div', { class: 'sort-bin-label', style: b.color ? { background: b.color } : null }, b.label), zone, tot);
      bin.addEventListener('click', () => selected && drop(selected, b.id, bin));
      bin.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && selected && drop(selected, b.id, bin));
      bin.addEventListener('dragover', (e) => {
        e.preventDefault();
        bin.classList.add('over');
      });
      bin.addEventListener('dragleave', () => bin.classList.remove('over'));
      bin.addEventListener('drop', (e) => {
        e.preventDefault();
        bin.classList.remove('over');
        const card = pool.querySelector(`[data-i="${e.dataTransfer.getData('text')}"]`);
        if (card) drop(card, b.id, bin);
      });
      bins[b.id] = { bin, zone, tot, total: 0 };
      binsWrap.appendChild(bin);
    });
    const items = o.shuffle === false ? o.items : HF.shuffle(o.items);
    items.forEach((it, i) => {
      const card = h('button', { class: 'sort-card', draggable: 'true', 'data-i': i, type: 'button' }, h('span', { html: it.text }), it.amt != null ? h('b', {}, ' ' + money(it.amt)) : null);
      card._it = it;
      card.addEventListener('click', (e) => {
        if (card.classList.contains('ok')) return; // placed cards let the click reach their bin
        e.stopPropagation();
        HF.$$('.sort-card.sel', pool).forEach((c) => c.classList.remove('sel'));
        selected = card;
        card.classList.add('sel');
        say(fb, 'Now tap the box where <b>' + it.text + '</b> belongs.', 'info');
      });
      card.addEventListener('dragstart', (e) => e.dataTransfer.setData('text', String(i)));
      pool.appendChild(card);
    });
    function drop(card, binId, binEl) {
      const it = card._it;
      if (it.bin === binId) {
        card.classList.remove('sel');
        card.classList.add('ok');
        card.draggable = false;
        card.tabIndex = -1;
        card.setAttribute('aria-disabled', 'true');
        bins[binId].zone.appendChild(card);
        placed++;
        if (o.totals) {
          bins[binId].total += it.amt;
          bins[binId].tot.textContent = money(bins[binId].total);
        }
        say(fb, '✔ Correct! ' + (it.why || ''), 'good');
        selected = null;
        if (placed === items.length) finish();
      } else {
        mistakes++;
        shake(card);
        shake(binEl);
        say(fb, '✘ Not quite. ' + (it.hint || it.why || 'Think about what increases or decreases here.'), 'bad');
      }
    }
    function finish() {
      let msg = `🎉 All sorted with <b>${mistakes}</b> mistake${mistakes === 1 ? '' : 's'}.`;
      if (o.totals) {
        const vals = Object.values(bins).map((b) => b.total);
        msg += vals.every((v) => Math.abs(v - vals[0]) < 0.01) ? ` Totals match at <b>${money(vals[0])}</b> — it balances!` : '';
      }
      say(fb, msg + (o.done ? ' ' + o.done : ''), 'good');
      if (mistakes <= 2) HF.solved(o.id || 'sort-' + o.title);
      if (mistakes === 0) HF.confetti();
    }
    body.append(h('p', { class: 'w-hint' }, o.instructions || 'Tap a card, then tap the box it belongs in (or drag it).'), pool, binsWrap, fb, h('div', { class: 'w-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => rebuild() }, '↺ Start over')));
    function rebuild() {
      root.innerHTML = '';
      HF.widgets.sort(root, o);
    }
  });

  /* =========================================================
     EQUATION: animated balance scale A = L + E
     ========================================================= */
  HF.widget('equation', function (root, o) {
    const body = frame(root, o.title || 'Keep the scale balanced', o.sub || 'Click a transaction and watch <b>both sides</b> move. Every transaction touches at least two accounts — that\'s why the scale never tips for long.');
    const txs = o.transactions;
    const accts = { a: {}, l: {}, e: {} };
    const tot = () => ({ a: sum(Object.values(accts.a)), l: sum(Object.values(accts.l)), e: sum(Object.values(accts.e)) });
    const scale = h('div', { class: 'eq-scale', html: HF.art('scale', 'art-svg eq-art') });
    const cols = h('div', { class: 'eq-cols' });
    const fb = feedback();
    const list = h('div', { class: 'eq-tx' });
    let done = 0,
      busy = false;
    function draw() {
      const t = tot();
      const diff = t.l + t.e - t.a;
      const ang = Math.max(-14, Math.min(14, (diff / Math.max(1000, Math.abs(t.a) + Math.abs(t.l + t.e))) * 40));
      const beam = scale.querySelector('.beam');
      if (beam) {
        beam.style.transformOrigin = '100px 40px';
        beam.style.transform = `rotate(${ang}deg)`;
      }
      scale.classList.toggle('tilted', Math.abs(diff) > 0.001);
      cols.innerHTML = '';
      [
        ['a', 'Assets', '#2e86ab'],
        ['=', '', ''],
        ['l', 'Liabilities', '#e4572e'],
        ['+', '', ''],
        ['e', 'Equity', '#3a9d5d'],
      ].forEach(([k, label, c]) => {
        if (k === '=' || k === '+') return cols.appendChild(h('div', { class: 'eq-op' }, k));
        const box = h('div', { class: 'eq-box', style: { borderColor: c } }, h('div', { class: 'eq-label', style: { background: c } }, label), h('div', { class: 'eq-total' }, money(t[k])));
        Object.entries(accts[k]).forEach(([n, v]) => box.appendChild(h('div', { class: 'eq-acct' }, h('span', {}, n), h('span', {}, money(v)))));
        cols.appendChild(box);
      });
    }
    txs.forEach((tx, i) => {
      const b = h('button', { class: 'eq-btn', type: 'button' }, h('span', { class: 'eq-n' }, i + 1), tx.text);
      b.addEventListener('click', () => {
        if (busy || b.disabled) return;
        busy = true;
        b.disabled = true;
        b.classList.add('used');
        let k = 0;
        const step = () => {
          const ef = tx.effects[k];
          accts[ef.k][ef.acct] = (accts[ef.k][ef.acct] || 0) + ef.v;
          draw();
          const box = cols.querySelectorAll('.eq-box')[{ a: 0, l: 1, e: 2 }[ef.k]];
          if (box) {
            box.classList.add('pulse');
            setTimeout(() => box.classList.remove('pulse'), 600);
          }
          k++;
          if (k < tx.effects.length) {
            say(fb, `<b>${ef.acct}</b> ${ef.v >= 0 ? 'goes up' : 'goes down'} by ${money(Math.abs(ef.v))}… ${tot().a !== tot().l + tot().e ? '<i>the scale tips!</i> Wait for the other half…' : ''}`, 'info');
            setTimeout(step, 900);
          } else {
            busy = false;
            done++;
            say(fb, '⚖️ Balanced again. ' + (tx.note || ''), 'good');
            if (done === txs.length) {
              say(fb, `🎉 ${txs.length} transactions and the equation <b>never broke</b>. Assets ${money(tot().a)} = Liabilities ${money(tot().l)} + Equity ${money(tot().e)}.`, 'good');
              HF.award('balanced');
              HF.solved(o.id || 'equation');
            }
          }
        };
        step();
      });
      list.appendChild(b);
    });
    body.append(h('div', { class: 'eq-grid' }, h('div', {}, scale, cols), list), fb, h('div', { class: 'w-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => ((root.innerHTML = ''), HF.widgets.equation(root, o)) }, '↺ Reset')));
    draw();
  });

  /* =========================================================
     JOURNAL: build a journal entry & get it checked
     ========================================================= */
  HF.widget('journal', function (root, o) {
    const body = frame(root, o.title || 'Journal entry workshop', o.sub || 'Pick the accounts, put the amounts in the <b>Debit</b> or <b>Credit</b> column, then hit <b>Check</b>.');
    let idx = 0;
    const solvedSet = new Set();
    const wrap = h('div');
    body.appendChild(wrap);
    function render() {
      const sc = o.scenarios[idx];
      wrap.innerHTML = '';
      const dots = h('div', { class: 'dots' }, o.scenarios.map((_, i) => h('span', { class: (i === idx ? 'cur ' : '') + (solvedSet.has(i) ? 'done' : '') })));
      const table = h('table', { class: 'je-table' }, h('thead', {}, h('tr', {}, h('th', {}, 'Account'), h('th', {}, 'Debit'), h('th', {}, 'Credit'), h('th', {}, ''))));
      const tb = h('tbody');
      table.appendChild(tb);
      const totals = h('tr', { class: 'je-tot' });
      table.appendChild(h('tfoot', {}, totals));
      const fb = feedback();
      const addLine = () => {
        const sel = h('select', { 'aria-label': 'Account' }, h('option', { value: '' }, '— choose account —'), (sc.accounts || o.accounts).map((a) => h('option', { value: a }, a)));
        const dr = h('input', { type: 'number', inputmode: 'decimal', min: 0, step: 'any', placeholder: 'Debit', 'aria-label': 'Debit' });
        const cr = h('input', { type: 'number', inputmode: 'decimal', min: 0, step: 'any', placeholder: 'Credit', 'aria-label': 'Credit' });
        dr.addEventListener('input', () => {
          if (dr.value) cr.value = '';
          tot();
        });
        cr.addEventListener('input', () => {
          if (cr.value) dr.value = '';
          tot();
        });
        const tr = h('tr', {}, h('td', {}, sel), h('td', {}, dr), h('td', {}, cr), h('td', {}, h('button', { class: 'x', type: 'button', title: 'remove line', onclick: () => (tr.remove(), tot()) }, '×')));
        tb.appendChild(tr);
      };
      const read = () =>
        HF.$$('tr', tb)
          .map((tr) => {
            const [s, d, c] = HF.$$('select,input', tr);
            return { acct: s.value, dr: +d.value || 0, cr: +c.value || 0 };
          })
          .filter((l) => l.acct && (l.dr || l.cr));
      const tot = () => {
        const ls = read();
        const d = sum(ls, (l) => l.dr),
          c = sum(ls, (l) => l.cr);
        totals.innerHTML = `<td>Totals</td><td class="${d === c && d ? 'eqok' : ''}">${money(d)}</td><td class="${d === c && d ? 'eqok' : ''}">${money(c)}</td><td></td>`;
      };
      const check = () => {
        const ls = read();
        const agg = (arr) => {
          const m = {};
          arr.forEach((l) => {
            m[l.acct] = (m[l.acct] || 0) + (l.dr || 0) - (l.cr || 0);
          });
          return m;
        };
        const want = agg(sc.lines),
          got = agg(ls);
        const d = sum(ls, (l) => l.dr),
          c = sum(ls, (l) => l.cr);
        if (!ls.length) return say(fb, 'Add at least two lines first.', 'bad');
        if (Math.abs(d - c) > 0.001) return say(fb, `✘ Debits (${money(d)}) don’t equal credits (${money(c)}). Every entry must balance!`, 'bad');
        const issues = [];
        Object.keys(want).forEach((a) => {
          if (got[a] == null) issues.push(`You’re missing an account. ${sc.hint ? '' : ''}`);
          else if (Math.sign(got[a]) !== Math.sign(want[a])) issues.push(`<b>${a}</b> is on the wrong side.`);
          else if (Math.abs(got[a] - want[a]) > 0.01) issues.push(`Check the amount for <b>${a}</b>.`);
        });
        Object.keys(got).forEach((a) => {
          if (want[a] == null) issues.push(`<b>${a}</b> isn’t affected by this transaction.`);
        });
        if (issues.length) {
          say(fb, '✘ ' + Array.from(new Set(issues)).join(' ') + (sc.hint ? `<br><i>Hint: ${sc.hint}</i>` : ''), 'bad');
          shake(table);
        } else {
          solvedSet.add(idx);
          say(fb, '✔ Spot on! ' + (sc.why || ''), 'good');
          HF.solved((o.id || 'journal') + '-' + idx, 10);
          dots.children[idx].classList.add('done');
        }
      };
      const answer = () => {
        tb.innerHTML = '';
        sc.lines.forEach((l) => {
          addLine();
          const tr = tb.lastChild;
          const [s, d, c] = HF.$$('select,input', tr);
          s.value = l.acct;
          if (l.dr) d.value = l.dr;
          if (l.cr) c.value = l.cr;
        });
        tot();
        say(fb, '👀 Here’s the answer. ' + (sc.why || ''), 'info');
      };
      addLine();
      addLine();
      tot();
      wrap.append(
        dots,
        h('div', { class: 'je-scenario' }, h('span', { class: 'je-date' }, sc.date || 'Transaction ' + (idx + 1)), h('p', { html: sc.text })),
        table,
        h(
          'div',
          { class: 'w-actions' },
          h('button', { class: 'btn ghost', type: 'button', onclick: addLine }, '+ line'),
          h('button', { class: 'btn', type: 'button', onclick: check }, 'Check ✓'),
          h('button', { class: 'btn ghost', type: 'button', onclick: answer }, 'Show answer'),
          idx > 0 ? h('button', { class: 'btn ghost', type: 'button', onclick: () => (idx--, render()) }, '← Prev') : null,
          idx < o.scenarios.length - 1 ? h('button', { class: 'btn ghost', type: 'button', onclick: () => (idx++, render()) }, 'Next →') : null
        ),
        fb
      );
    }
    render();
  });

  /* =========================================================
     TACCOUNT: click the correct side of the correct T-account
     ========================================================= */
  HF.widget('taccount', function (root, o) {
    const body = frame(root, o.title || 'Post it to the T-accounts', o.sub || 'For each transaction, click the side of the T-account that gets the <b class="dr">DEBIT</b>, then the side that gets the <b class="cr">CREDIT</b>.');
    const accts = {};
    const grid = h('div', { class: 't-grid' });
    const fb = feedback();
    const txBox = h('div', { class: 't-tx' });
    let i = 0,
      phase = 'dr',
      mistakes = 0;
    o.accounts.forEach((a) => {
      const L = h('div', { class: 't-side t-l', 'data-a': a, 'data-s': 'dr' });
      const R = h('div', { class: 't-side t-r', 'data-a': a, 'data-s': 'cr' });
      const bal = h('div', { class: 't-bal' });
      const t = h('div', { class: 't-acct' }, h('div', { class: 't-name' }, a), h('div', { class: 't-body' }, L, R), bal);
      accts[a] = { L, R, bal, dr: 0, cr: 0 };
      [L, R].forEach((side) => side.addEventListener('click', () => clickSide(a, side.dataset.s, side)));
      grid.appendChild(t);
    });
    function showTx() {
      if (i >= o.txs.length) {
        txBox.innerHTML = '<b>All posted!</b> Look at the balances under each account.';
        say(fb, `🎉 Done with ${mistakes} mistake${mistakes === 1 ? '' : 's'}. ` + (o.done || ''), 'good');
        if (mistakes <= 2) HF.solved(o.id || 'taccount');
        return;
      }
      const tx = o.txs[i];
      txBox.innerHTML = `<span class="je-date">#${i + 1}</span> ${tx.text} <b>${money(tx.amt)}</b><div class="t-phase">Click the <b class="${phase}">${phase === 'dr' ? 'DEBIT' : 'CREDIT'}</b> side…</div>`;
    }
    function post(a, s, amt) {
      const A = accts[a];
      const el = s === 'dr' ? A.L : A.R;
      el.appendChild(h('div', { class: 't-amt pop' }, money(amt, { sym: false })));
      A[s] += amt;
      const b = A.dr - A.cr;
      A.bal.innerHTML = b === 0 ? 'Bal: 0' : `Bal: <b class="${b > 0 ? 'dr' : 'cr'}">${money(Math.abs(b), { sym: false })} ${b > 0 ? 'Dr' : 'Cr'}</b>`;
    }
    function clickSide(a, s, el) {
      if (i >= o.txs.length) return;
      const tx = o.txs[i];
      const want = phase === 'dr' ? tx.dr : tx.cr;
      if (a === want && s === phase) {
        post(a, s, tx.amt);
        if (phase === 'dr') {
          phase = 'cr';
          say(fb, `✔ Debit ${a}. Now where’s the credit?`, 'good');
        } else {
          phase = 'dr';
          i++;
          say(fb, '✔ Posted! ' + (tx.why || ''), 'good');
        }
        showTx();
      } else {
        mistakes++;
        shake(el);
        const msg = a !== want ? `Hmm, is <b>${a}</b> really affected the way you think?` : `Right account, wrong side! ${phase === 'dr' ? 'Debits go on the LEFT.' : 'Credits go on the RIGHT.'}`;
        say(fb, '✘ ' + msg, 'bad');
      }
    }
    const auto = h('button', { class: 'btn ghost', type: 'button' }, 'Just show me ▶');
    auto.addEventListener('click', () => {
      const tick = () => {
        if (i >= o.txs.length) return;
        const tx = o.txs[i];
        clickSide(phase === 'dr' ? tx.dr : tx.cr, phase, null);
        setTimeout(tick, 700);
      };
      mistakes += 3;
      tick();
    });
    body.append(txBox, grid, fb, h('div', { class: 'w-actions' }, auto, h('button', { class: 'btn ghost', type: 'button', onclick: () => ((root.innerHTML = ''), HF.widgets.taccount(root, o)) }, '↺ Reset')));
    showTx();
  });

  /* =========================================================
     CYCLE: clickable step wheel
     ========================================================= */
  HF.widget('cycle', function (root, o) {
    const body = frame(root, o.title || 'Spin the wheel', o.sub || 'Click any step (or press play) to see what happens there.');
    const n = o.steps.length,
      R = 130,
      C = 170;
    const colors = ['#e4572e', '#f2c14e', '#3a9d5d', '#2e86ab', '#8e5ea2', '#d1495b', '#00798c', '#edae49', '#66a182', '#30638e'];
    let svg = `<svg viewBox="0 0 340 340" class="cycle-svg"><circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="8 8" class="cycle-ring"/>`;
    o.steps.forEach((s, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = C + R * Math.cos(a),
        y = C + R * Math.sin(a);
      svg += `<g class="cyc-node" data-i="${i}" tabindex="0" role="button" aria-label="${s.t}"><circle cx="${x}" cy="${y}" r="24" fill="${colors[i % colors.length]}" stroke="var(--ink)" stroke-width="2.5"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Permanent Marker" font-size="18" fill="#fff">${i + 1}</text></g>`;
    });
    svg += `<text x="${C}" y="${C - 4}" text-anchor="middle" class="cyc-center" font-family="Permanent Marker" font-size="20">${o.center || 'The Cycle'}</text><text x="${C}" y="${C + 20}" text-anchor="middle" class="cyc-center-sub" font-family="Kalam" font-size="14">repeat every period</text></svg>`;
    const wheel = h('div', { class: 'cycle-wheel', html: svg });
    const panel = h('div', { class: 'cycle-panel' });
    const show = (i) => {
      HF.$$('.cyc-node', wheel).forEach((g) => g.classList.toggle('on', +g.dataset.i === i));
      const s = o.steps[i];
      panel.innerHTML = `<div class="cyc-step">Step ${i + 1} of ${n}</div><h5>${s.t}</h5><p>${s.d}</p>${s.ex ? `<div class="cyc-ex"><b>Example:</b> ${s.ex}</div>` : ''}`;
      panel.classList.remove('pop');
      void panel.offsetWidth;
      panel.classList.add('pop');
    };
    HF.$$('.cyc-node', wheel).forEach((g) => {
      g.addEventListener('click', () => show(+g.dataset.i));
      g.addEventListener('keydown', (e) => e.key === 'Enter' && show(+g.dataset.i));
    });
    let timer = null;
    const play = h('button', { class: 'btn', type: 'button' }, '▶ Play the cycle');
    play.addEventListener('click', () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
        play.textContent = '▶ Play the cycle';
        return;
      }
      let i = 0;
      show(0);
      play.textContent = '❚❚ Pause';
      timer = setInterval(() => {
        i++;
        if (i >= n) {
          clearInterval(timer);
          timer = null;
          play.textContent = '▶ Play again';
          HF.solved(o.id || 'cycle', 5);
          return;
        }
        show(i);
      }, 2600);
    });
    body.append(h('div', { class: 'cycle-grid' }, wheel, panel), h('div', { class: 'w-actions' }, play));
    show(0);
  });

  /* =========================================================
     DEPRECIATION: SL / DDB / SYD calculator + chart
     ========================================================= */
  HF.widget('depreciation', function (root, o) {
    const body = frame(root, 'Depreciation machine', 'Change the numbers and the method — watch the book value slide.');
    const cost = h('input', { type: 'number', value: o.cost || 50000, min: 0 });
    const salvage = h('input', { type: 'number', value: o.salvage || 5000, min: 0 });
    const life = h('input', { type: 'number', value: o.life || 5, min: 1, max: 30 });
    const method = h('select', {}, h('option', { value: 'sl' }, 'Straight-line'), h('option', { value: 'ddb' }, 'Double-declining balance'), h('option', { value: 'syd' }, 'Sum-of-the-years’ digits'));
    const out = h('div');
    const compute = (m, C, S, N) => {
      const rows = [];
      let bv = C;
      const sydSum = (N * (N + 1)) / 2;
      for (let y = 1; y <= N; y++) {
        let dep;
        if (m === 'sl') dep = (C - S) / N;
        else if (m === 'syd') dep = ((C - S) * (N - y + 1)) / sydSum;
        else {
          dep = bv * (2 / N);
          if (bv - dep < S) dep = bv - S;
          if (y === N) dep = bv - S; // plug final year to salvage
        }
        dep = Math.max(0, dep);
        bv -= dep;
        rows.push({ y, dep, bv });
      }
      return rows;
    };
    function draw() {
      const C = +cost.value || 0,
        S = Math.min(+salvage.value || 0, C),
        N = Math.max(1, Math.min(30, Math.round(+life.value || 1)));
      const rows = compute(method.value, C, S, N);
      let acc = 0;
      const table = `<div class="o-scroll"><table class="data"><thead><tr><th>Year</th><th>Depreciation expense</th><th>Accumulated</th><th>Book value (end)</th></tr></thead><tbody>${rows
        .map((r) => {
          acc += r.dep;
          return `<tr><td>${r.y}</td><td>${money(r.dep)}</td><td>${money(acc)}</td><td>${money(r.bv)}</td></tr>`;
        })
        .join('')}</tbody></table></div>`;
      const all = ['sl', 'ddb', 'syd'].map((m) => [0, ...compute(m, C, S, N).map((r) => r.bv)].map((v, i) => (i === 0 ? C : v)));
      const chart = HF.chartSVG({
        labels: ['Start', ...rows.map((r) => 'Y' + r.y)],
        series: [
          { name: 'Straight-line', color: '#2e86ab', values: all[0] },
          { name: 'Double-declining', color: '#e4572e', values: all[1] },
          { name: 'Sum-of-years', color: '#3a9d5d', values: all[2] },
        ],
      });
      const first = rows[0] ? rows[0].dep : 0;
      out.innerHTML = `<div class="w-two"><div>${chart}</div><div>${table}</div></div><div class="je mini"><div class="je-line"><span>Depreciation Expense</span><span>${money(first)}</span><span></span></div><div class="je-line cr"><span>Accumulated Depreciation</span><span></span><span>${money(first)}</span></div><div class="je-narr">(Year 1 entry, ${method.selectedOptions[0].text})</div></div>`;
    }
    [cost, salvage, life, method].forEach((el) => el.addEventListener('input', () => (draw(), HF.solved('depr', 5))));
    body.append(h('div', { class: 'w-form' }, h('label', {}, 'Cost ', cost), h('label', {}, 'Salvage value ', salvage), h('label', {}, 'Useful life (yrs) ', life), h('label', {}, 'Method ', method)), out);
    draw();
  });

  /* =========================================================
     INVENTORY: FIFO / LIFO / Moving Average side by side
     ========================================================= */
  HF.widget('inventory', function (root, o) {
    const body = frame(root, 'Inventory cost-flow race', 'Same purchases, same sales — three different answers. Step through the events and watch the cost layers.');
    const events = o.events || [
      { type: 'buy', qty: 10, cost: 10, t: 'Jan 1: Buy 10 helmets @ $10' },
      { type: 'buy', qty: 10, cost: 12, t: 'Jan 8: Buy 10 helmets @ $12' },
      { type: 'sell', qty: 12, price: 25, t: 'Jan 15: Sell 12 helmets @ $25' },
      { type: 'buy', qty: 10, cost: 15, t: 'Jan 20: Buy 10 helmets @ $15' },
      { type: 'sell', qty: 8, price: 25, t: 'Jan 28: Sell 8 helmets @ $25' },
    ];
    const colors = ['#bfe0f2', '#f2c14e', '#f7c6d0', '#b5e3c4', '#d9c7f0'];
    function run(method, upto) {
      let layers = [],
        cogs = 0,
        sales = 0,
        batch = 0;
      events.slice(0, upto).forEach((e) => {
        if (e.type === 'buy') {
          if (method === 'avg') {
            const q = sum(layers, (l) => l.q) + e.qty;
            const v = sum(layers, (l) => l.q * l.c) + e.qty * e.cost;
            layers = [{ q, c: v / q, b: 'avg' }];
          } else layers.push({ q: e.qty, c: e.cost, b: batch });
          batch++;
        } else {
          sales += e.qty * e.price;
          let need = e.qty;
          while (need > 0 && layers.length) {
            const L = method === 'lifo' ? layers[layers.length - 1] : layers[0];
            const take = Math.min(need, L.q);
            cogs += take * L.c;
            L.q -= take;
            need -= take;
            if (L.q <= 0.0001) method === 'lifo' ? layers.pop() : layers.shift();
          }
        }
      });
      return { layers, cogs, sales, end: sum(layers, (l) => l.q * l.c) };
    }
    let step = events.length;
    const out = h('div', { class: 'inv-cols' });
    const evList = h('ol', { class: 'inv-events' });
    const slider = h('input', { type: 'range', min: 0, max: events.length, value: step, 'aria-label': 'Step through events' });
    function draw() {
      evList.innerHTML = '';
      events.forEach((e, i) => evList.appendChild(h('li', { class: i < step ? 'on' : '' }, e.t)));
      out.innerHTML = '';
      [
        ['fifo', 'FIFO', 'First in, first out'],
        ['lifo', 'LIFO', 'Last in, first out'],
        ['avg', 'Moving Average', 'Blend every purchase'],
      ].forEach(([m, name, sub]) => {
        const r = run(m, step);
        const stack = h('div', { class: 'inv-stack' });
        r.layers
          .slice()
          .reverse()
          .forEach((l) => {
            const blk = h('div', { class: 'inv-layer', style: { height: Math.max(14, l.q * 7) + 'px', background: l.b === 'avg' ? 'linear-gradient(90deg,#bfe0f2,#f2c14e,#f7c6d0)' : colors[l.b % colors.length] } }, `${HF.num(l.q, 1)} × ${money(l.c, { dec: true })}`);
            stack.appendChild(blk);
          });
        if (!r.layers.length) stack.appendChild(h('div', { class: 'inv-empty' }, 'empty shelf'));
        out.appendChild(
          h(
            'div',
            { class: 'inv-col' },
            h('h5', {}, name),
            h('div', { class: 'inv-sub' }, sub),
            stack,
            h('div', { class: 'inv-stats', html: `<div>Sales <b>${money(r.sales)}</b></div><div>COGS <b>${money(r.cogs, { dec: true })}</b></div><div>Gross profit <b>${money(r.sales - r.cogs, { dec: true })}</b></div><div>Ending inventory <b>${money(r.end, { dec: true })}</b></div>` })
          )
        );
      });
    }
    slider.addEventListener('input', () => {
      step = +slider.value;
      draw();
      if (step === events.length) HF.solved('inventory', 5);
    });
    body.append(h('div', { class: 'inv-top' }, evList, h('label', { class: 'inv-slider' }, 'Step through events: ', slider)), out, h('p', { class: 'w-hint' }, 'Notice: prices are rising, so FIFO shows the highest profit and LIFO the lowest. Total goods available is the same — only the split between COGS and ending inventory changes.'));
    draw();
  });

  /* =========================================================
     BANKREC: match bank vs book lines, auto-build statement
     ========================================================= */
  HF.widget('bankrec', function (root, o) {
    const body = frame(root, 'Bank reconciliation matcher', 'Click a line on the <b>bank statement</b>, then the same transaction in <b>your books</b>. Leftovers become reconciling items.');
    const bank = o.bank,
      book = o.book;
    let selBank = null;
    const matched = new Set();
    const fb = feedback();
    const L = h('div', { class: 'rec-list' }, h('h5', {}, '🏦 Bank statement'));
    const R = h('div', { class: 'rec-list' }, h('h5', {}, o.mode === 'odoo' ? '🟣 Open items in Odoo' : '📒 Your cash book'));
    const stmt = h('div', { class: 'rec-stmt' });
    const row = (x, side) => {
      const el = h('button', { class: 'rec-row', type: 'button' }, h('span', {}, x.d), h('span', {}, x.desc), h('b', { class: x.amt < 0 ? 'neg' : 'pos' }, money(x.amt)));
      el._x = x;
      el.addEventListener('click', () => {
        if (matched.has(x.id + side)) return;
        if (side === 'bank') {
          HF.$$('.rec-row.sel', L).forEach((r) => r.classList.remove('sel'));
          selBank = el;
          el.classList.add('sel');
          say(fb, 'Now click the matching line in your books.', 'info');
        } else if (selBank) {
          if (selBank._x.m && selBank._x.m === x.m) {
            selBank.classList.remove('sel');
            selBank.classList.add('matched');
            el.classList.add('matched');
            matched.add(selBank._x.id + 'bank');
            matched.add(x.id + 'book');
            selBank = null;
            say(fb, '✔ Matched!', 'good');
            check();
          } else {
            shake(el);
            say(fb, '✘ Those aren’t the same transaction — check amount and description.', 'bad');
          }
        } else say(fb, 'Start from the bank side.', 'info');
      });
      return el;
    };
    bank.forEach((x) => L.appendChild(row(x, 'bank')));
    book.forEach((x) => R.appendChild(row(x, 'book')));
    function check() {
      const pairs = bank.filter((x) => x.m).length;
      if (HF.$$('.rec-row.matched', L).length < pairs) return;
      const bankOnly = bank.filter((x) => !x.m);
      const bookOnly = book.filter((x) => !x.m);
      if (o.mode === 'odoo') {
        stmt.innerHTML = `<h5>What’s left to do</h5><div class="w-two"><table class="data"><tr><th colspan=2>Bank lines still in suspense → create counterpart entries</th></tr>${bankOnly
          .map((x) => `<tr><td>${x.desc} <i>→ e.g. ${x.amt < 0 && /fee|charge/i.test(x.desc) ? 'Bank Charges' : /loan/i.test(x.desc) ? 'Bank Loan (liability)' : 'appropriate account'}</i></td><td>${money(x.amt)}</td></tr>`)
          .join('')}</table><table class="data"><tr><th colspan=2>Open items that simply stay open</th></tr>${bookOnly.map((x) => `<tr><td>${x.desc}</td><td>${money(x.amt)}</td></tr>`).join('')}</table></div><p class="good"><b>✔ All matchable lines reconciled.</b> A reconciliation model could post the fee automatically every month.</p>`;
        stmt.classList.add('show');
        say(fb, '🎉 Every matching pair found!', 'good');
        HF.solved('bankrec-odoo', 15);
        return;
      }
      const bankBal = o.bankOpen + sum(bank, (x) => x.amt);
      const bookBal = o.bookOpen + sum(book, (x) => x.amt);
      const dit = bookOnly.filter((x) => x.amt > 0),
        oc = bookOnly.filter((x) => x.amt < 0);
      const adjBank = bankBal + sum(dit, (x) => x.amt) + sum(oc, (x) => x.amt);
      const adjBook = bookBal + sum(bankOnly, (x) => x.amt);
      stmt.innerHTML = `<h5>Bank Reconciliation Statement</h5><div class="w-two"><table class="data"><tr><th colspan=2>Bank side</th></tr><tr><td>Balance per bank</td><td>${money(bankBal)}</td></tr>${dit
        .map((x) => `<tr><td>+ Deposit in transit: ${x.desc}</td><td>${money(x.amt)}</td></tr>`)
        .join('')}${oc.map((x) => `<tr><td>− Outstanding cheque: ${x.desc}</td><td>${money(x.amt)}</td></tr>`).join('')}<tr class="tot"><td>Adjusted bank balance</td><td>${money(adjBank)}</td></tr></table>
        <table class="data"><tr><th colspan=2>Book side</th></tr><tr><td>Balance per books</td><td>${money(bookBal)}</td></tr>${bankOnly
          .map((x) => `<tr><td>${x.amt > 0 ? '+' : '−'} ${x.desc} <i>(needs a journal entry)</i></td><td>${money(x.amt)}</td></tr>`)
          .join('')}<tr class="tot"><td>Adjusted book balance</td><td>${money(adjBook)}</td></tr></table></div>
        <p class="${Math.abs(adjBank - adjBook) < 0.01 ? 'good' : 'bad'}"><b>${Math.abs(adjBank - adjBook) < 0.01 ? '✔ Reconciled! Both sides agree.' : 'Still a difference of ' + money(adjBank - adjBook)}</b></p>`;
      stmt.classList.add('show');
      say(fb, '🎉 Every matching pair found. The leftovers are your reconciling items — see the statement below.', 'good');
      HF.solved('bankrec', 20);
    }
    body.append(h('div', { class: 'rec-grid' }, L, R), fb, stmt);
  });

  /* =========================================================
     RATIOS: sliders → live ratios with verdicts
     ========================================================= */
  HF.widget('ratios', function (root, o) {
    const body = frame(root, 'Ratio dashboard', 'Drag the sliders to change the company. Watch which ratios turn green, yellow or red.');
    const f = {
      revenue: ['Revenue', 500000, 0, 1500000],
      cogs: ['Cost of goods sold', 300000, 0, 1200000],
      opex: ['Operating expenses', 120000, 0, 600000],
      cash: ['Cash', 40000, 0, 400000],
      ar: ['Receivables', 60000, 0, 400000],
      inv: ['Inventory', 80000, 0, 400000],
      fixed: ['Fixed assets', 300000, 0, 1500000],
      cl: ['Current liabilities', 100000, 1000, 600000],
      ltd: ['Long-term debt', 150000, 0, 1000000],
    };
    const v = {};
    const sliders = h('div', { class: 'rat-sliders' });
    const out = h('div', { class: 'rat-grid' });
    Object.entries(f).forEach(([k, [label, val, min, max]]) => {
      v[k] = val;
      const lab = h('span', { class: 'rat-val' }, money(val));
      const s = h('input', { type: 'range', min, max, step: 1000, value: val, 'aria-label': label });
      s.addEventListener('input', () => {
        v[k] = +s.value;
        lab.textContent = money(v[k]);
        draw();
        HF.solved('ratios', 5);
      });
      sliders.appendChild(h('label', {}, h('span', {}, label), s, lab));
    });
    function draw() {
      const ca = v.cash + v.ar + v.inv,
        ta = ca + v.fixed,
        tl = v.cl + v.ltd,
        eq = ta - tl;
      const gp = v.revenue - v.cogs,
        ni = (gp - v.opex) * 0.75; // assume 25% tax
      const R = [
        ['Current ratio', ca / v.cl, (x) => x.toFixed(2) + '×', (x) => (x >= 1.5 ? 'g' : x >= 1 ? 'y' : 'r'), 'Current assets ÷ current liabilities. Can we pay the next 12 months of bills?'],
        ['Quick ratio', (v.cash + v.ar) / v.cl, (x) => x.toFixed(2) + '×', (x) => (x >= 1 ? 'g' : x >= 0.7 ? 'y' : 'r'), 'Like current ratio but ignores inventory (it might not sell fast).'],
        ['Gross margin', v.revenue ? gp / v.revenue : 0, (x) => (x * 100).toFixed(1) + '%', (x) => (x >= 0.35 ? 'g' : x >= 0.2 ? 'y' : 'r'), 'Gross profit ÷ revenue. What’s left after paying for the goods sold.'],
        ['Net margin', v.revenue ? ni / v.revenue : 0, (x) => (x * 100).toFixed(1) + '%', (x) => (x >= 0.1 ? 'g' : x >= 0.03 ? 'y' : 'r'), 'Net income ÷ revenue (assumes 25% tax).'],
        ['Debt-to-equity', eq > 0 ? tl / eq : Infinity, (x) => (isFinite(x) ? x.toFixed(2) + '×' : '∞ (negative equity!)'), (x) => (x <= 1 ? 'g' : x <= 2 ? 'y' : 'r'), 'Total liabilities ÷ equity. How much of the business creditors fund.'],
        ['Return on assets', ta ? ni / ta : 0, (x) => (x * 100).toFixed(1) + '%', (x) => (x >= 0.08 ? 'g' : x >= 0.03 ? 'y' : 'r'), 'Net income ÷ total assets. How hard do the assets work?'],
        ['Return on equity', eq > 0 ? ni / eq : 0, (x) => (x * 100).toFixed(1) + '%', (x) => (x >= 0.15 ? 'g' : x >= 0.06 ? 'y' : 'r'), 'Net income ÷ equity. What owners earn on their money.'],
        ['Inventory turnover', v.inv ? v.cogs / v.inv : 0, (x) => x.toFixed(1) + '×  (' + (x ? Math.round(365 / x) : '—') + ' days)', (x) => (x >= 6 ? 'g' : x >= 3 ? 'y' : 'r'), 'COGS ÷ inventory. How many times stock sells through per year.'],
        ['Receivable days (DSO)', v.revenue ? (v.ar / v.revenue) * 365 : 0, (x) => Math.round(x) + ' days', (x) => (x <= 45 ? 'g' : x <= 75 ? 'y' : 'r'), 'Receivables ÷ revenue × 365. How long customers take to pay.'],
      ];
      out.innerHTML = '';
      R.forEach(([n, x, fmt, grade, tip]) => out.appendChild(h('div', { class: 'rat-card ' + grade(x) }, h('div', { class: 'rat-n' }, n), h('div', { class: 'rat-x' }, fmt(x)), h('div', { class: 'rat-tip' }, tip))));
      out.appendChild(h('div', { class: 'rat-card info', html: `<div class="rat-n">Snapshot</div><div class="rat-tip">Total assets ${money(ta)}<br>Total liabilities ${money(tl)}<br>Equity ${money(eq)}<br>Net income ${money(ni)}</div>` }));
    }
    body.append(h('div', { class: 'w-two rat-wrap' }, sliders, out));
    draw();
  });

  /* =========================================================
     BREAKEVEN: CVP chart
     ========================================================= */
  HF.widget('breakeven', function (root, o) {
    const body = frame(root, 'Break-even explorer', 'Where do the revenue line and the total-cost line cross? Slide and see.');
    const F = h('input', { type: 'range', min: 1000, max: 100000, step: 1000, value: 30000 });
    const P = h('input', { type: 'range', min: 5, max: 200, step: 1, value: 60 });
    const V = h('input', { type: 'range', min: 1, max: 190, step: 1, value: 35 });
    const Q = h('input', { type: 'range', min: 0, max: 4000, step: 50, value: 1600 });
    const lab = {};
    const out = h('div');
    const row = (k, label, el) => {
      lab[k] = h('b');
      return h('label', {}, label + ' ', el, lab[k]);
    };
    function draw() {
      const f = +F.value,
        p = +P.value,
        vc = +V.value,
        q = +Q.value;
      lab.F.textContent = money(f);
      lab.P.textContent = money(p);
      lab.V.textContent = money(vc);
      lab.Q.textContent = q + ' units';
      const cm = p - vc;
      const be = cm > 0 ? f / cm : Infinity;
      const maxQ = Math.max(4000, isFinite(be) ? be * 1.6 : 0);
      const pts = 11;
      const qs = Array.from({ length: pts }, (_, i) => Math.round((maxQ * i) / (pts - 1)));
      const chart = HF.chartSVG({
        labels: qs.map((x) => x),
        series: [
          { name: 'Revenue', color: '#3a9d5d', values: qs.map((x) => x * p) },
          { name: 'Total cost', color: '#e4572e', values: qs.map((x) => f + x * vc) },
          { name: 'Fixed cost', color: '#999', values: qs.map(() => f) },
        ],
        marks: isFinite(be) ? [{ x: (be / maxQ) * (pts - 1), y: be * p, label: 'Break-even' }] : [],
      });
      const profit = q * cm - f;
      out.innerHTML = `${chart}<div class="be-stats"><div>Contribution margin / unit <b>${money(cm)}</b> (${p ? Math.round((cm / p) * 100) : 0}%)</div><div>Break-even <b>${isFinite(be) ? Math.ceil(be) + ' units = ' + money(Math.ceil(be) * p) : 'never — price ≤ variable cost!'}</b></div><div>Profit at ${q} units <b class="${profit >= 0 ? 'pos' : 'neg'}">${money(profit)}</b></div><div>Margin of safety <b>${isFinite(be) && q ? Math.round(((q - be) / q) * 100) + '%' : '—'}</b></div></div>`;
    }
    [F, P, V, Q].forEach((s) => s.addEventListener('input', () => (draw(), HF.solved('breakeven', 5))));
    body.append(h('div', { class: 'w-form' }, row('F', 'Fixed costs', F), row('P', 'Price / unit', P), row('V', 'Variable cost / unit', V), row('Q', 'Expected sales', Q)), out);
    draw();
  });

  /* =========================================================
     LOAN: amortization schedule
     ========================================================= */
  HF.widget('loan', function (root, o) {
    const body = frame(root, 'Loan amortization', 'Each EMI = interest (an expense) + principal (reduces the liability).');
    const P = h('input', { type: 'number', value: 100000, min: 0 });
    const r = h('input', { type: 'number', value: 8, step: 0.1, min: 0 });
    const n = h('input', { type: 'number', value: 5, min: 1, max: 30 });
    const out = h('div');
    function draw() {
      const p = +P.value || 0,
        i = (+r.value || 0) / 100,
        N = Math.max(1, Math.round(+n.value || 1));
      const pmt = i ? (p * i) / (1 - Math.pow(1 + i, -N)) : p / N;
      let bal = p;
      const rows = [];
      for (let y = 1; y <= N; y++) {
        const int = bal * i;
        const prin = pmt - int;
        bal -= prin;
        rows.push({ y, int, prin, bal: Math.max(0, bal) });
      }
      out.innerHTML = `<p>Annual payment: <b>${money(pmt, { dec: true })}</b> · Total interest: <b>${money(sum(rows, (x) => x.int), { dec: true })}</b></p><div class="w-two">${HF.chartSVG({
        labels: rows.map((x) => 'Y' + x.y),
        series: [
          { name: 'Interest', color: '#e4572e', values: rows.map((x) => x.int), type: 'bar' },
          { name: 'Principal', color: '#2e86ab', values: rows.map((x) => x.prin), type: 'bar' },
        ],
      })}<div class="o-scroll"><table class="data"><thead><tr><th>Yr</th><th>Interest (Dr Interest Exp.)</th><th>Principal (Dr Loan)</th><th>Balance</th></tr></thead><tbody>${rows
        .map((x) => `<tr><td>${x.y}</td><td>${money(x.int, { dec: true })}</td><td>${money(x.prin, { dec: true })}</td><td>${money(x.bal, { dec: true })}</td></tr>`)
        .join('')}</tbody></table></div></div>`;
    }
    [P, r, n].forEach((el) => el.addEventListener('input', () => (draw(), HF.solved('loan', 5))));
    body.append(h('div', { class: 'w-form' }, h('label', {}, 'Loan amount ', P), h('label', {}, 'Interest % / yr ', r), h('label', {}, 'Years ', n)), out);
    draw();
  });

  /* =========================================================
     TVM: future / present value
     ========================================================= */
  HF.widget('tvm', function (root, o) {
    const body = frame(root, 'Time value of money', 'A dollar today is worth more than a dollar tomorrow. How much more?');
    const A = h('input', { type: 'number', value: 10000 });
    const r = h('input', { type: 'number', value: 7, step: 0.1 });
    const n = h('input', { type: 'number', value: 10, min: 1, max: 50 });
    const out = h('div');
    function draw() {
      const a = +A.value || 0,
        i = (+r.value || 0) / 100,
        N = Math.max(1, Math.min(50, Math.round(+n.value || 1)));
      const fv = a * Math.pow(1 + i, N),
        pv = a / Math.pow(1 + i, N);
      const yrs = Array.from({ length: N + 1 }, (_, k) => k);
      out.innerHTML = `<div class="be-stats"><div>Future value of ${money(a)} invested today: <b>${money(fv)}</b></div><div>Present value of ${money(a)} received in ${N} yrs: <b>${money(pv)}</b></div></div>${HF.chartSVG({
        labels: yrs.map((k) => 'Y' + k),
        series: [
          { name: 'Growing (FV)', color: '#3a9d5d', values: yrs.map((k) => a * Math.pow(1 + i, k)) },
          { name: 'Discounting (PV)', color: '#8e5ea2', values: yrs.map((k) => a / Math.pow(1 + i, k)) },
        ],
      })}`;
    }
    [A, r, n].forEach((el) => el.addEventListener('input', () => (draw(), HF.solved('tvm', 5))));
    body.append(h('div', { class: 'w-form' }, h('label', {}, 'Amount ', A), h('label', {}, 'Rate % ', r), h('label', {}, 'Years ', n)), out);
    draw();
  });

  /* =========================================================
     TAX: VAT/GST value chain
     ========================================================= */
  HF.widget('tax', function (root, o) {
    const body = frame(root, 'VAT / GST chain', 'Tax is collected at every step, but each business only pays tax on the <b>value it adds</b>. Input tax credit makes the magic happen.');
    const rate = h('input', { type: 'range', min: 0, max: 28, value: 18 });
    const base = h('input', { type: 'range', min: 100, max: 2000, step: 50, value: 500 });
    const m1 = h('input', { type: 'range', min: 0, max: 200, value: 40 });
    const m2 = h('input', { type: 'range', min: 0, max: 200, value: 50 });
    const labs = [h('b'), h('b'), h('b'), h('b')];
    const out = h('div', { class: 'tax-chain' });
    function draw() {
      const t = +rate.value / 100;
      labs[0].textContent = rate.value + '%';
      labs[1].textContent = money(+base.value);
      labs[2].textContent = m1.value + '%';
      labs[3].textContent = m2.value + '%';
      const prices = [+base.value];
      prices.push(prices[0] * (1 + m1.value / 100));
      prices.push(prices[1] * (1 + m2.value / 100));
      const who = ['🏭 Manufacturer', '🚚 Wholesaler', '🏪 Retailer'];
      let prevTax = 0;
      out.innerHTML = '';
      prices.forEach((p, i) => {
        const outT = p * t;
        const net = outT - prevTax;
        out.appendChild(
          h('div', { class: 'tax-node', html: `<div class="tax-who">${who[i]}</div><div>Sells for <b>${money(p)}</b> + tax <b>${money(outT)}</b></div><div class="tax-mini">Output tax ${money(outT)}<br>− Input credit ${money(prevTax)}</div><div class="tax-pay">Pays govt <b>${money(net)}</b></div>` })
        );
        out.appendChild(h('div', { class: 'tax-arrow' }, '➜'));
        prevTax = outT;
      });
      out.appendChild(h('div', { class: 'tax-node consumer', html: `<div class="tax-who">🧑 Consumer</div><div>Pays <b>${money(prices[2] * (1 + t))}</b></div><div class="tax-mini">of which tax:</div><div class="tax-pay">${money(prices[2] * t)}</div><div class="tax-mini">= total collected by govt across the chain</div>` }));
    }
    [rate, base, m1, m2].forEach((s) => s.addEventListener('input', () => (draw(), HF.solved('tax', 5))));
    body.append(h('div', { class: 'w-form' }, h('label', {}, 'Tax rate ', rate, labs[0]), h('label', {}, 'Manufacturer price ', base, labs[1]), h('label', {}, 'Wholesaler markup ', m1, labs[2]), h('label', {}, 'Retailer markup ', m2, labs[3])), out);
    draw();
  });

  /* =========================================================
     FX: realized exchange gain/loss
     ========================================================= */
  HF.widget('fx', function (root, o) {
    const body = frame(root, 'Foreign currency invoice', 'You invoice a customer in euros. By the time they pay, the rate has moved. Who wins?');
    const amt = h('input', { type: 'number', value: 1000 });
    const r1 = h('input', { type: 'number', value: 1.1, step: 0.01 });
    const r2 = h('input', { type: 'number', value: 1.05, step: 0.01 });
    const out = h('div');
    function draw() {
      const a = +amt.value || 0,
        x1 = +r1.value || 0,
        x2 = +r2.value || 0;
      const inv = a * x1,
        pay = a * x2,
        d = pay - inv;
      out.innerHTML = `<div class="w-two"><div class="je mini"><div class="je-narr">Invoice date (€${a} × ${x1})</div><div class="je-line"><span>Accounts Receivable</span><span>${money(inv, { dec: true })}</span><span></span></div><div class="je-line cr"><span>Sales Revenue</span><span></span><span>${money(inv, { dec: true })}</span></div></div>
      <div class="je mini"><div class="je-narr">Payment date (€${a} × ${x2})</div><div class="je-line"><span>Bank</span><span>${money(pay, { dec: true })}</span><span></span></div>${
        d < 0 ? `<div class="je-line"><span>Exchange Loss</span><span>${money(-d, { dec: true })}</span><span></span></div>` : ''
      }<div class="je-line cr"><span>Accounts Receivable</span><span></span><span>${money(inv, { dec: true })}</span></div>${d > 0 ? `<div class="je-line cr"><span>Exchange Gain</span><span></span><span>${money(d, { dec: true })}</span></div>` : ''}</div></div>
      <p class="${d >= 0 ? 'good' : 'bad'}"><b>${d === 0 ? 'No difference.' : d > 0 ? 'Realized exchange GAIN of ' + money(d, { dec: true }) : 'Realized exchange LOSS of ' + money(-d, { dec: true })}</b> — the receivable is cleared at its <i>original</i> booked value; the difference goes to P&amp;L.</p>`;
    }
    [amt, r1, r2].forEach((el) => el.addEventListener('input', () => (draw(), HF.solved('fx', 5))));
    body.append(h('div', { class: 'w-form' }, h('label', {}, 'Invoice € ', amt), h('label', {}, 'Rate on invoice date ($/€) ', r1), h('label', {}, 'Rate on payment date ($/€) ', r2)), out);
    draw();
  });

  /* =========================================================
     ACCRUAL vs CASH: toggle basis, watch monthly profit
     ========================================================= */
  HF.widget('accrual', function (root, o) {
    const body = frame(root, 'Cash basis vs accrual basis', 'Same business, same quarter. Flip the switch and see how “profit” jumps around.');
    const tx = [
      { t: 'Jan: Do a $9,000 job, customer pays in March', rev: 9000, earn: 0, pay: 2 },
      { t: 'Jan: Pay 3 months rent upfront $3,000', exp: 3000, earn: [0, 1, 2], pay: 0 },
      { t: 'Feb: Do a $6,000 job, paid immediately', rev: 6000, earn: 1, pay: 1 },
      { t: 'Feb: Staff wages $2,000, paid in March', exp: 2000, earn: 1, pay: 2 },
      { t: 'Mar: Customer prepays $4,000 for April work', rev: 4000, earn: 3, pay: 2 },
    ];
    const months = ['Jan', 'Feb', 'Mar'];
    let mode = 'accrual';
    const toggle = h('div', { class: 'seg' });
    const out = h('div');
    const btns = ['cash', 'accrual'].map((m) =>
      h(
        'button',
        {
          type: 'button',
          class: m === mode ? 'on' : '',
          onclick: () => {
            mode = m;
            btns.forEach((b) => b.classList.toggle('on', b.dataset.m === m));
            draw();
            HF.solved('accrual', 5);
          },
          'data-m': m,
        },
        m === 'cash' ? '💵 Cash basis' : '📅 Accrual basis'
      )
    );
    btns.forEach((b) => toggle.appendChild(b));
    function draw() {
      const rev = [0, 0, 0],
        exp = [0, 0, 0];
      tx.forEach((x) => {
        const amt = x.rev || x.exp;
        const arr = x.rev ? rev : exp;
        if (mode === 'cash') arr[x.pay] += amt;
        else {
          const e = Array.isArray(x.earn) ? x.earn : [x.earn];
          e.forEach((m) => {
            if (m < 3) arr[m] += amt / e.length;
          });
        }
      });
      const profit = rev.map((r, i) => r - exp[i]);
      out.innerHTML = `<ul class="acc-list">${tx.map((x) => `<li>${x.t}</li>`).join('')}</ul>${HF.chartSVG({
        labels: months,
        series: [
          { name: 'Revenue', color: '#3a9d5d', values: rev, type: 'bar' },
          { name: 'Expenses', color: '#e4572e', values: exp, type: 'bar' },
          { name: 'Profit', color: '#2e86ab', values: profit, type: 'bar' },
        ],
      })}<p class="w-hint">${
        mode === 'cash'
          ? 'Cash basis: January looks like a disaster and March a bonanza — even though the work was done earlier. Also, the April prepayment inflates March!'
          : 'Accrual basis: revenue lands when <b>earned</b>, expenses when <b>incurred</b>. Profit now tells the real story of each month. The April prepayment sits on the balance sheet as <b>unearned revenue</b> (a liability).'
      } Quarter profit: <b>${money(profit.reduce((a, b) => a + b, 0))}</b></p>`;
    }
    body.append(toggle, out);
    draw();
  });

  /* =========================================================
     REVREC: IFRS 15 allocation
     ========================================================= */
  HF.widget('revrec', function (root, o) {
    const body = frame(root, 'IFRS 15 / ASC 606 allocator', 'A phone + 24-month service plan sold as a bundle. Allocate the price by stand-alone selling prices, then recognise it.');
    const price = h('input', { type: 'range', min: 600, max: 2400, step: 10, value: 1200 });
    const sspP = h('input', { type: 'number', value: 800 });
    const sspS = h('input', { type: 'number', value: 30 });
    const pl = h('b');
    const out = h('div');
    function draw() {
      const tp = +price.value,
        p = +sspP.value || 0,
        s = (+sspS.value || 0) * 24;
      pl.textContent = money(tp);
      const tot = p + s || 1;
      const ap = (tp * p) / tot,
        as = (tp * s) / tot;
      const months = Array.from({ length: 25 }, (_, i) => i);
      let cum = 0;
      out.innerHTML = `<ol class="rr-steps">
        <li><b>Identify the contract</b> — signed 24-month agreement ✔</li>
        <li><b>Identify performance obligations</b> — (1) the phone, (2) the network service</li>
        <li><b>Determine the transaction price</b> — ${money(tp)}</li>
        <li><b>Allocate by stand-alone selling price</b><div class="rr-bar"><span style="flex:${p}">Phone SSP ${money(p)} → <b>${money(ap)}</b></span><span style="flex:${s}">Service SSP ${money(s)} → <b>${money(as)}</b></span></div></li>
        <li><b>Recognise when (or as) each obligation is satisfied</b> — phone: <b>${money(ap)}</b> on day 1 (point in time); service: <b>${money(as / 24, { dec: true })}</b> per month (over time).</li></ol>${HF.chartSVG({
          labels: months.map((m) => 'M' + m),
          series: [
            {
              name: 'Cumulative revenue recognised',
              color: '#3a9d5d',
              values: months.map((m) => {
                cum = ap + (as / 24) * m;
                return cum;
              }),
            },
            { name: 'Cash received (upfront)', color: '#999', values: months.map(() => tp) },
          ],
        })}<p class="w-hint">The gap between the grey line and the green line is a <b>contract liability</b> (deferred revenue) — cash received for service not yet delivered.</p>`;
    }
    [price, sspP, sspS].forEach((el) => el.addEventListener('input', () => (draw(), HF.solved('revrec', 5))));
    body.append(h('div', { class: 'w-form' }, h('label', {}, 'Bundle price ', price, pl), h('label', {}, 'Phone SSP ', sspP), h('label', {}, 'Service SSP / month ', sspS)), out);
    draw();
  });

  /* =========================================================
     MATCH: term ↔ definition
     ========================================================= */
  HF.widget('match', function (root, o) {
    const body = frame(root, o.title || 'Who does what?', o.sub || 'Click a term on the left, then its match on the right.');
    const left = h('div', { class: 'm-col' }),
      right = h('div', { class: 'm-col' });
    const fb = feedback();
    let sel = null,
      ok = 0,
      miss = 0;
    const pairs = o.pairs.map((p, i) => ({ a: p[0], b: p[1], i }));
    pairs.forEach((p) => {
      const b = h('button', { class: 'm-item', type: 'button', html: p.a });
      b.addEventListener('click', () => {
        if (b.classList.contains('ok')) return;
        HF.$$('.m-item.sel', left).forEach((x) => x.classList.remove('sel'));
        sel = { el: b, i: p.i };
        b.classList.add('sel');
      });
      left.appendChild(b);
    });
    HF.shuffle(pairs).forEach((p) => {
      const b = h('button', { class: 'm-item def', type: 'button', html: p.b });
      b.addEventListener('click', () => {
        if (!sel || b.classList.contains('ok')) return;
        if (sel.i === p.i) {
          sel.el.classList.remove('sel');
          sel.el.classList.add('ok');
          b.classList.add('ok');
          sel = null;
          ok++;
          say(fb, '✔ Match!', 'good');
          if (ok === pairs.length) {
            say(fb, `🎉 All matched with ${miss} miss${miss === 1 ? '' : 'es'}.`, 'good');
            if (miss <= 2) HF.solved(o.id || 'match-' + pairs[0].a, 10);
          }
        } else {
          miss++;
          shake(b);
          say(fb, '✘ Nope — try another.', 'bad');
        }
      });
      right.appendChild(b);
    });
    body.append(h('div', { class: 'm-grid' }, left, right), fb);
  });

  /* =========================================================
     FLASHCARDS (embeddable)
     ========================================================= */
  HF.widget('flashcards', function (root, o) {
    const body = frame(root, o.title || 'Flashcards', o.sub || 'Click the card to flip it.');
    let deck = HF.shuffle(o.cards),
      i = 0,
      known = 0;
    const card = h('div', { class: 'flash', tabindex: 0, role: 'button', 'aria-label': 'Flip card' });
    const count = h('div', { class: 'flash-count' });
    const draw = () => {
      if (i >= deck.length) {
        card.classList.remove('flipped');
        card.innerHTML = `<div class="flash-face front"><div>🎉 Deck done! You knew <b>${known}</b> of ${deck.length}.</div></div>`;
        count.textContent = '';
        if (o.onDone) o.onDone(known, deck.length);
        return;
      }
      card.classList.remove('flipped');
      card.innerHTML = `<div class="flash-inner"><div class="flash-face front">${deck[i][0]}</div><div class="flash-face back">${deck[i][1]}</div></div>`;
      count.textContent = `Card ${i + 1} / ${deck.length}`;
    };
    const flip = () => card.classList.toggle('flipped');
    card.addEventListener('click', flip);
    card.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), flip()));
    const next = (k) => {
      if (i >= deck.length) return;
      if (k) known++;
      HF.state.cardsSeen = (HF.state.cardsSeen || 0) + 1;
      if (HF.state.cardsSeen >= 50) HF.award('cards50');
      if (HF.state.cardsSeen % 10 === 0) HF.addXP(10, 'flashcards reviewed');
      else HF.save();
      i++;
      draw();
    };
    body.append(
      count,
      card,
      h(
        'div',
        { class: 'w-actions center' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => next(false) }, '🔁 Still learning'),
        h('button', { class: 'btn', type: 'button', onclick: () => next(true) }, '✔ Got it'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => ((deck = HF.shuffle(o.cards)), (i = 0), (known = 0), draw()) }, '↺ Reshuffle')
      )
    );
    draw();
  });

  /* =========================================================
     VARIANCE: budget vs actual (price & quantity)
     ========================================================= */
  HF.widget('variance', function (root, o) {
    const body = frame(root, 'Variance detective', 'Materials budget vs actual. Split the total variance into a <b>price</b> part and a <b>quantity</b> part.');
    const f = { sq: ['Standard qty (kg)', 1000], sp: ['Standard price $/kg', 5], aq: ['Actual qty (kg)', 1100], ap: ['Actual price $/kg', 4.6] };
    const v = {};
    const form = h('div', { class: 'w-form' });
    const out = h('div');
    Object.entries(f).forEach(([k, [l, d]]) => {
      v[k] = d;
      const inp = h('input', { type: 'number', step: 'any', value: d });
      inp.addEventListener('input', () => {
        v[k] = +inp.value || 0;
        draw();
        HF.solved('variance', 5);
      });
      form.appendChild(h('label', {}, l + ' ', inp));
    });
    const tag = (x) => `<b class="${x <= 0 ? 'pos' : 'neg'}">${money(Math.abs(x), { dec: true })} ${x <= 0 ? 'Favourable' : 'Adverse'}</b>`;
    function draw() {
      const pv = (v.ap - v.sp) * v.aq,
        qv = (v.aq - v.sq) * v.sp,
        tv = v.ap * v.aq - v.sp * v.sq;
      out.innerHTML = `<div class="var-grid"><div class="var-box">Actual cost<br><b>${money(v.ap * v.aq, { dec: true })}</b><small>AQ × AP</small></div><div class="var-op">price variance<br>${tag(pv)}</div><div class="var-box">Actual qty at std price<br><b>${money(v.aq * v.sp, { dec: true })}</b><small>AQ × SP</small></div><div class="var-op">quantity variance<br>${tag(qv)}</div><div class="var-box">Standard cost<br><b>${money(v.sq * v.sp, { dec: true })}</b><small>SQ × SP</small></div></div><p class="w-hint">Total variance ${tag(tv)} = price + quantity. A cheap supplier (favourable price) can cause more waste (adverse quantity) — that’s the detective story!</p>`;
    }
    body.append(form, out);
    draw();
  });

  /* =========================================================
     ODOO: invoice → payment → bank reconciliation simulator
     ========================================================= */
  HF.widget('odoo', function (root, o) {
    const purchase = o.mode === 'purchase';
    const body = frame(root, purchase ? 'Odoo simulator: vendor bill' : 'Odoo simulator: customer invoice', 'Click the buttons like you would in Odoo. Watch the status bar, the payment badge and — most importantly — the <b>Journal Items</b> that Odoo writes for you.');
    const qty = 2,
      unit = purchase ? 600 : 1500,
      rate = 0.15;
    const untaxed = qty * unit,
      tax = untaxed * rate,
      total = untaxed + tax;
    let stage = 0; // 0 draft,1 posted,2 in payment,3 paid
    const entries = [];
    const ui = h('div', { class: 'odoo' });
    const tips = [
      `The ${purchase ? 'bill' : 'invoice'} is a <b>draft</b>: no accounting impact yet. You can still edit everything. Hit <b>Confirm</b>.`,
      `Posted! Odoo created a journal entry in the <b>${purchase ? 'Purchases (BILL)' : 'Customer Invoices (INV)'}</b> journal. The ${purchase ? 'payable' : 'receivable'} now waits to be paid. Click <b>Register Payment</b>.`,
      `Payment registered. With an <b>outstanding ${purchase ? 'payments' : 'receipts'}</b> account configured, Odoo parks the money there until the bank confirms it. Status: <b>In Payment</b>. Now reconcile with the bank statement line.`,
      `Bank statement line matched — the money really hit the bank. The ${purchase ? 'bill' : 'invoice'} is <b>Paid</b> and every temporary account nets to zero. 🎉`,
    ];
    const sales = [
      [
        { a: '121000 Account Receivable', d: total },
        { a: '400000 Product Sales', c: untaxed },
        { a: '251000 Tax Received (15%)', c: tax },
      ],
      [
        { a: '101403 Outstanding Receipts', d: total },
        { a: '121000 Account Receivable', c: total },
      ],
      [
        { a: '101401 Bank', d: total },
        { a: '101403 Outstanding Receipts', c: total },
      ],
    ];
    const buys = [
      [
        { a: '600000 Expenses', d: untaxed },
        { a: '131000 Tax Paid (15%)', d: tax },
        { a: '211000 Account Payable', c: total },
      ],
      [
        { a: '211000 Account Payable', d: total },
        { a: '101404 Outstanding Payments', c: total },
      ],
      [
        { a: '101404 Outstanding Payments', d: total },
        { a: '101401 Bank', c: total },
      ],
    ];
    const jnames = purchase ? ['BILL/2026/10/0001', 'PBNK1/2026/00001', 'BNK1/2026/00001'] : ['INV/2026/00001', 'PBNK1/2026/00001', 'BNK1/2026/00001'];
    function draw() {
      const states = ['Draft', 'Posted'];
      const pay = stage === 0 ? '' : stage === 1 ? '<span class="o-badge red">Not Paid</span>' : stage === 2 ? '<span class="o-badge orange">In Payment</span>' : '<span class="o-badge green">Paid</span>';
      const btn = [
        h('button', { class: 'o-btn primary', type: 'button', onclick: () => go(1) }, 'Confirm'),
        h('button', { class: 'o-btn primary', type: 'button', onclick: () => go(2) }, 'Register Payment'),
        h('button', { class: 'o-btn primary', type: 'button', onclick: () => go(3) }, 'Reconcile bank line'),
        h('button', { class: 'o-btn', type: 'button', onclick: () => ((stage = 0), entries.splice(0), draw()) }, '↺ Start over'),
      ][stage];
      ui.innerHTML = '';
      ui.append(
        h('div', { class: 'o-top', html: `<span class="o-app">Accounting</span><span class="o-crumb">${purchase ? 'Vendors / Bills' : 'Customers / Invoices'} / <b>${stage ? jnames[0] : 'Draft'}</b></span>` }),
        h('div', { class: 'o-bar' }, h('div', { class: 'o-btns' }, btn), h('div', { class: 'o-status', html: states.map((s, i) => `<span class="${(stage === 0 ? 0 : 1) === i ? 'on' : ''}">${s}</span>`).join('') })),
        h(
          'div',
          { class: 'o-sheet' },
          h('div', { class: 'o-ribbon', html: pay }),
          h('h3', {}, stage ? jnames[0] : 'Draft ' + (purchase ? 'Bill' : 'Invoice')),
          h(
            'div',
            { class: 'o-fields', html: `<div><label>${purchase ? 'Vendor' : 'Customer'}</label><span>${purchase ? 'Gear Supply Co.' : 'Azure Interior'}</span></div><div><label>${purchase ? 'Bill' : 'Invoice'} Date</label><span>10/06/2026</span></div><div><label>Payment Terms</label><span>30 Days</span></div><div><label>Journal</label><span>${purchase ? 'Vendor Bills' : 'Customer Invoices'}</span></div>` }
          ),
          h('div', {
            class: 'o-lines',
            html: `<div class="o-scroll"><table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Taxes</th><th>Subtotal</th></tr></thead><tbody><tr><td>${purchase ? '[GEAR] Bike chain set' : '[BIKE] City bike'}</td><td>${qty}</td><td>${money(unit, { dec: true })}</td><td><span class="o-tag">15%</span></td><td>${money(untaxed, { dec: true })}</td></tr></tbody></table></div><div class="o-totals"><div>Untaxed Amount <b>${money(untaxed, { dec: true })}</b></div><div>Tax 15% <b>${money(tax, { dec: true })}</b></div><div class="big">Total <b>${money(total, { dec: true })}</b></div>${stage >= 2 ? `<div><i>Paid on 10/20/2026</i> <b>${money(total, { dec: true })}</b></div><div class="big">Amount Due <b>${money(stage === 3 ? 0 : 0, { dec: true })}</b></div>` : ''}</div>`,
          }),
          h('div', { class: 'o-tabs', html: '<span>Invoice Lines</span><span class="on">Journal Items</span>' }),
          h('div', {
            class: 'o-ji',
            html: entries.length
              ? entries
                  .map(
                    (e, k) =>
                      `<div class="o-je ${k === entries.length - 1 ? 'new' : ''}"><div class="o-jn">${jnames[k]}</div><div class="o-scroll"><table><thead><tr><th>Account</th><th>Debit</th><th>Credit</th></tr></thead><tbody>${e
                        .map((l) => `<tr><td>${l.a}</td><td>${l.d ? money(l.d, { dec: true }) : ''}</td><td>${l.c ? money(l.c, { dec: true }) : ''}</td></tr>`)
                        .join('')}</tbody></table></div></div>`
                  )
                  .join('')
              : '<p class="o-empty">No journal items yet — drafts don’t touch the books.</p>',
          })
        ),
        h('div', { class: 'callout mini' }, h('div', { class: 'callout-av', html: HF.avatar('robo', 56) }), h('div', { class: 'bubble', html: tips[stage] }))
      );
    }
    function go(s) {
      stage = s;
      entries.push((purchase ? buys : sales)[s - 1]);
      draw();
      if (s === 3) HF.solved('odoo-' + (purchase ? 'p' : 's'), 20);
    }
    body.appendChild(ui);
    draw();
  });
})();
