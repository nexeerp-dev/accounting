/* BrainLedger art: hand-drawn style SVG icons, characters & illustrations.
   Every drawing uses the global #sketch filter (defined in index.html) for a wobbly pen look. */
(function () {
  const HF = window.HF;
  const S = 'stroke="#1d1d1f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
  const wrap = (vb, body, cls) =>
    `<svg class="${cls || 'art-svg'}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g filter="url(#sketch)">${body}</g></svg>`;

  /* ---------- small section icons ---------- */
  const icons = {
    brain: wrap(
      '0 0 64 64',
      `<path ${S} fill="#f7c6d0" d="M32 10c-6-6-17-3-18 6-7 1-10 9-6 15-4 6 0 14 7 14 1 7 10 10 17 5 7 5 16 2 17-5 7 0 11-8 7-14 4-6 1-14-6-15-1-9-12-12-18-6z"/>
       <path ${S} fill="none" d="M32 10v41M22 22c4 0 6 3 6 6M42 22c-4 0-6 3-6 6M18 36c4-2 8 0 9 3M46 36c-4-2-8 0-9 3"/>`,
      'icon'
    ),
    pencil: wrap(
      '0 0 64 64',
      `<path ${S} fill="#f2c14e" d="M12 46l30-30 8 8-30 30-11 3z"/><path ${S} fill="#e4572e" d="M42 16l5-5 8 8-5 5z"/><path ${S} fill="#fbe3c0" d="M12 46l8 8-11 3z"/>`,
      'icon'
    ),
    warn: wrap(
      '0 0 64 64',
      `<path ${S} fill="#f2c14e" d="M32 8l26 46H6z"/><path ${S} fill="none" d="M32 24v15"/><circle cx="32" cy="46" r="2.5" fill="#1d1d1f"/>`,
      'icon'
    ),
    question: wrap(
      '0 0 64 64',
      `<circle ${S} fill="#bfe0f2" cx="32" cy="32" r="24"/><path ${S} fill="none" d="M24 25c0-6 4-9 8-9s8 3 8 8c0 7-8 7-8 14"/><circle cx="32" cy="46" r="2.5" fill="#1d1d1f"/>`,
      'icon'
    ),
    bullet: wrap('0 0 64 64', `<rect ${S} fill="#1d1d1f" x="16" y="16" width="32" height="32"/>`, 'icon'),
    play: wrap('0 0 64 64', `<circle ${S} fill="#3a9d5d" cx="32" cy="32" r="24"/><path ${S} fill="#fff" d="M26 20l18 12-18 12z"/>`, 'icon'),
    chat: wrap(
      '0 0 64 64',
      `<path ${S} fill="#fff" d="M8 12h34v22H22l-8 8v-8H8z"/><path ${S} fill="#f2c14e" d="M26 30h30v20h-6v7l-8-7H26z"/>`,
      'icon'
    ),
    flame: wrap(
      '0 0 64 64',
      `<path ${S} fill="#e4572e" d="M32 6c4 12 18 16 18 32a18 18 0 0 1-36 0c0-8 4-12 8-16 0 6 2 9 5 10-2-10 1-18 5-26z"/><path ${S} fill="#f2c14e" d="M32 34c3 5 8 7 8 12a8 8 0 0 1-16 0c0-4 4-7 8-12z"/>`,
      'icon'
    ),
  };

  /* ---------- characters ---------- */
  const face = (skin, hair, extra, shirt) => `
    <path ${S} fill="${shirt}" d="M14 96c2-18 14-26 26-26s24 8 26 26z"/>
    <circle ${S} fill="${skin}" cx="40" cy="42" r="22"/>
    ${hair}
    <circle cx="32" cy="42" r="2.6" fill="#1d1d1f"/><circle cx="48" cy="42" r="2.6" fill="#1d1d1f"/>
    <path ${S} fill="none" d="M33 53c4 4 10 4 14 0"/>
    ${extra || ''}`;
  const chars = {
    penny: {
      name: 'Penny',
      role: 'bookkeeper',
      svg: face(
        '#f5d0b0',
        `<path ${S} fill="#8e5ea2" d="M18 40c0-16 10-22 22-22s22 6 22 22c-6-8-14-10-22-10S24 32 18 40z"/><circle ${S} fill="#8e5ea2" cx="40" cy="16" r="8"/>`,
        `<circle ${S} fill="none" cx="32" cy="42" r="6"/><circle ${S} fill="none" cx="48" cy="42" r="6"/><path ${S} d="M38 42h4"/>`,
        '#2e86ab'
      ),
    },
    max: {
      name: 'Max',
      role: 'shop owner',
      svg: face(
        '#c98d63',
        `<path ${S} fill="#e4572e" d="M16 36c2-14 12-20 24-20s22 6 24 20z"/><path ${S} fill="#e4572e" d="M58 34h12"/>`,
        `<path ${S} fill="none" d="M30 60c3 2 4 2 6 0"/>`,
        '#f2c14e'
      ),
    },
    audrey: {
      name: 'Audrey',
      role: 'auditor',
      svg: face(
        '#f0c8a0',
        `<path ${S} fill="#1d1d1f" d="M18 44c-2-18 8-26 22-26s24 8 22 26c-4-10-12-14-22-14s-18 4-22 14z"/>`,
        `<rect ${S} fill="none" x="26" y="37" width="12" height="9" rx="2"/><rect ${S} fill="none" x="42" y="37" width="12" height="9" rx="2"/><path ${S} d="M38 41h4"/><path ${S} fill="#e4572e" d="M40 72l-4 8 4 14 4-14z"/>`,
        '#55606e'
      ),
    },
    sam: {
      name: 'Sam',
      role: 'student',
      svg: face(
        '#8d5a3b',
        `<path ${S} fill="#1d1d1f" d="M18 38c0-14 10-20 22-20s22 6 22 20c-4-4-8-6-12-6-2 4-6 6-10 6s-10-2-12-6c-4 0-8 2-10 6z"/>`,
        '',
        '#3a9d5d'
      ),
    },
    robo: {
      name: 'Erpy',
      role: 'the ERP robot',
      svg: `
        <path ${S} fill="#714b67" d="M14 96c2-16 12-22 26-22s24 6 26 22z"/>
        <path ${S} d="M40 18V8"/><circle ${S} fill="#f2c14e" cx="40" cy="7" r="4"/>
        <rect ${S} fill="#d9c7d5" x="16" y="18" width="48" height="44" rx="12"/>
        <rect ${S} fill="#1d1d1f" x="23" y="30" width="34" height="16" rx="7"/>
        <circle cx="33" cy="38" r="3.5" fill="#7ee0d0"/><circle cx="47" cy="38" r="3.5" fill="#7ee0d0"/>
        <path ${S} fill="none" d="M32 54h16"/>`,
    },
  };
  HF.avatar = (who, size) => {
    const c = chars[who] || chars.sam;
    return `<svg class="avatar" width="${size || 72}" height="${size || 72}" viewBox="0 0 80 100" aria-hidden="true"><g filter="url(#sketch)">${c.svg}</g></svg>`;
  };
  HF.chars = chars;
  HF.icon = (n) => icons[n] || '';

  /* ---------- illustrations ---------- */
  const coin = (x, y, r = 9) => `<ellipse ${S} fill="#f2c14e" cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.45}"/><path ${S} fill="#e0a92e" d="M${x - r} ${y}v5a${r} ${r * 0.45} 0 0 0 ${r * 2} 0v-5"/>`;
  const doc = (x, y, w, h, fill) =>
    `<path ${S} fill="${fill || '#fff'}" d="M${x} ${y}h${w - 12}l12 12v${h - 12}H${x}z"/><path ${S} fill="none" d="M${x + w - 12} ${y}v12h12"/>` +
    [1, 2, 3, 4]
      .filter((i) => i * 12 + 14 < h)
      .map((i) => `<path ${S} stroke-width="1.6" d="M${x + 8} ${y + 12 + i * 11}h${w - 18}"/>`)
      .join('');

  const art = {
    shop: `
      <path ${S} fill="#fff8e7" d="M30 60h140v70H30z"/>
      <path ${S} fill="#e4572e" d="M22 40h156l-8 22H30z"/>
      <path ${S} fill="#fff" d="M48 40l-6 22M80 40l-4 22M112 40l-2 22M144 40l2 22" />
      <path ${S} fill="#bfe0f2" d="M44 76h50v36H44z"/><path ${S} d="M69 76v36M44 94h50"/>
      <path ${S} fill="#f2c14e" d="M112 76h40v54h-40z"/><circle cx="144" cy="104" r="2.5" fill="#1d1d1f"/>
      <path ${S} fill="#fff" d="M60 18h80v18H60z"/><text x="100" y="32" text-anchor="middle" font-family="Permanent Marker, cursive" font-size="12">MAX'S BIKES</text>`,
    scale: `
      <path ${S} fill="none" d="M100 30v90M70 128h60"/>
      <g class="beam"><path ${S} d="M36 40h128"/>
      <path ${S} fill="none" d="M36 40l-16 36M36 40l16 36M164 40l-16 36M164 40l16 36"/>
      <path ${S} fill="#bfe0f2" d="M16 76h40a20 10 0 0 1-40 0z"/><path ${S} fill="#f7c6d0" d="M144 76h40a20 10 0 0 1-40 0z"/></g>
      <circle ${S} fill="#f2c14e" cx="100" cy="36" r="7"/>
      <text x="36" y="104" text-anchor="middle" font-family="Kalam, cursive" font-size="14">Assets</text>
      <text x="164" y="104" text-anchor="middle" font-family="Kalam, cursive" font-size="12">Liab. + Equity</text>`,
    tchart: `
      <path ${S} fill="#fff" d="M20 14h160v116H20z"/>
      <path ${S} d="M40 44h120M100 44v76"/>
      <text x="100" y="36" text-anchor="middle" font-family="Permanent Marker, cursive" font-size="16">Cash</text>
      <text x="70" y="60" text-anchor="middle" font-family="Kalam, cursive" font-size="13" fill="#2e86ab">Debit</text>
      <text x="130" y="60" text-anchor="middle" font-family="Kalam, cursive" font-size="13" fill="#e4572e">Credit</text>
      <text x="70" y="82" text-anchor="middle" font-family="Kalam" font-size="13">10,000</text>
      <text x="70" y="100" text-anchor="middle" font-family="Kalam" font-size="13">2,000</text>
      <text x="130" y="82" text-anchor="middle" font-family="Kalam" font-size="13">3,000</text>`,
    journal: `
      <path ${S} fill="#2e86ab" d="M40 18h120v108H40z"/>
      <path ${S} fill="#fffdf7" d="M48 22h108v100H48z"/>
      <path stroke="#e4572e" stroke-width="2" d="M66 22v100"/>
      ${[40, 56, 72, 88, 104].map((y) => `<path stroke="#9cc5de" stroke-width="1.5" d="M48 ${y}h108"/>`).join('')}
      <text x="72" y="52" font-family="Kalam" font-size="11">Dr Bikes</text><text x="82" y="68" font-family="Kalam" font-size="11">Cr Cash</text>
      <path ${S} fill="#f2c14e" d="M150 100l30-50 8 5-30 50-9 4z"/>`,
    ledger: `
      <path ${S} fill="#3a9d5d" d="M30 28h70v100H30z"/><path ${S} fill="#2e86ab" d="M100 28h70v100h-70z"/>
      <path ${S} fill="#fffdf7" d="M36 24h62v96H36zM102 24h62v96h-62z"/>
      ${[44, 60, 76, 92].map((y) => `<path stroke="#9cc5de" stroke-width="1.5" d="M40 ${y}h54M106 ${y}h54"/>`).join('')}
      <text x="67" y="38" text-anchor="middle" font-family="Permanent Marker" font-size="10">LEDGER</text>`,
    cycle: `
      <circle ${S} fill="none" cx="100" cy="72" r="50" stroke-dasharray="10 8"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7]
        .map((i) => {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          return `<circle ${S} fill="${['#e4572e', '#f2c14e', '#3a9d5d', '#2e86ab', '#8e5ea2', '#e4572e', '#f2c14e', '#3a9d5d'][i]}" cx="${100 + 50 * Math.cos(a)}" cy="${72 + 50 * Math.sin(a)}" r="10"/>`;
        })
        .join('')}
      <path ${S} fill="none" d="M150 60l4 12 10-8"/>
      <text x="100" y="78" text-anchor="middle" font-family="Permanent Marker" font-size="15">CYCLE</text>`,
    calendar: `
      <path ${S} fill="#fff" d="M40 26h120v100H40z"/><path ${S} fill="#e4572e" d="M40 26h120v22H40z"/>
      <path ${S} d="M64 18v16M136 18v16"/>
      ${[0, 1, 2, 3, 4].map((c) => [0, 1, 2].map((r) => `<rect ${S} stroke-width="1.5" fill="${c === 4 && r === 2 ? '#f2c14e' : 'none'}" x="${50 + c * 21}" y="${56 + r * 22}" width="15" height="15"/>`).join('')).join('')}
      <text x="100" y="42" text-anchor="middle" font-family="Permanent Marker" font-size="12" fill="#fff">MONTH-END</text>`,
    statements: `
      ${doc(18, 30, 54, 76, '#fff')}${doc(74, 20, 54, 86, '#fff8e7')}${doc(130, 30, 54, 76, '#eef6fb')}
      <text x="45" y="120" text-anchor="middle" font-family="Kalam" font-size="11">P&amp;L</text>
      <text x="101" y="120" text-anchor="middle" font-family="Kalam" font-size="11">Balance Sheet</text>
      <text x="157" y="120" text-anchor="middle" font-family="Kalam" font-size="11">Cash Flow</text>`,
    lock: `
      <path ${S} fill="none" d="M76 66V48a24 24 0 0 1 48 0v18"/>
      <rect ${S} fill="#f2c14e" x="62" y="64" width="76" height="60" rx="8"/>
      <circle ${S} fill="#1d1d1f" cx="100" cy="88" r="6"/><path ${S} d="M100 92v14"/>`,
    bank: `
      <path ${S} fill="#eef6fb" d="M20 56L100 18l80 38z"/>
      ${[40, 72, 104, 136].map((x) => `<path ${S} fill="#fff" d="M${x} 62h18v50h-18z"/>`).join('')}
      <path ${S} fill="#bfe0f2" d="M20 112h160v14H20zM24 56h152v8H24z"/>
      <text x="100" y="48" text-anchor="middle" font-family="Permanent Marker" font-size="12">BANK</text>`,
    boxes: `
      <path ${S} fill="#e6c08f" d="M30 70h50v50H30z"/><path ${S} fill="#d9ad74" d="M80 70h50v50H80z"/><path ${S} fill="#e6c08f" d="M55 22h50v48H55z"/>
      <path ${S} fill="#e6c08f" d="M130 80h40v40h-40z"/>
      <path ${S} stroke-width="1.6" d="M48 70v14M98 70v14M73 22v14M146 80v12"/>
      <text x="80" y="54" font-family="Kalam" font-size="10">FIFO?</text>`,
    machine: `
      <path ${S} fill="#bfe0f2" d="M30 60h110v50H30z"/><circle ${S} fill="#f2c14e" cx="60" cy="85" r="15"/><circle ${S} fill="#fff" cx="60" cy="85" r="5"/>
      <path ${S} fill="#e4572e" d="M100 70h30v20h-30z"/><path ${S} d="M140 80h30M150 70v20"/>
      <path ${S} fill="none" d="M30 120h140"/>
      <path ${S} fill="none" stroke="#e4572e" d="M150 20l20 14-20 14" /><text x="96" y="38" font-family="Kalam" font-size="12">value ↓ over time</text>`,
    loan: `
      ${doc(30, 22, 70, 96, '#fff')}<text x="64" y="40" text-anchor="middle" font-family="Permanent Marker" font-size="10">LOAN</text>
      ${coin(140, 104, 14)}${coin(140, 92, 14)}${coin(140, 80, 14)}
      <path ${S} fill="none" d="M108 60c14-8 26-6 32 6" /><path ${S} fill="none" d="M134 62l6 4 2-8"/>`,
    shares: `
      ${doc(26, 26, 90, 70, '#fff8e7')}<circle ${S} fill="#e4572e" cx="96" cy="78" r="10"/>
      <text x="62" y="46" text-anchor="middle" font-family="Permanent Marker" font-size="11">SHARE CERT.</text>
      <path ${S} fill="#3a9d5d" d="M128 112l14-22 12 10 18-36"/><path ${S} fill="none" d="M164 64h8v8"/>`,
    tax: `
      ${doc(40, 18, 80, 104, '#fff')}<text x="76" y="44" text-anchor="middle" font-family="Permanent Marker" font-size="14">TAX</text>
      <text x="76" y="84" text-anchor="middle" font-family="Permanent Marker" font-size="26" fill="#e4572e">%</text>
      <rect ${S} fill="#bfe0f2" x="128" y="50" width="44" height="64" rx="6"/><rect ${S} fill="#fff" x="134" y="56" width="32" height="12"/>
      ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect ${S} stroke-width="1.5" fill="#fff" x="${135 + c * 11}" y="${74 + r * 12}" width="8" height="8"/>`).join('')).join('')}`,
    magnifier: `
      ${doc(30, 22, 80, 100, '#fff')}
      <circle ${S} fill="#bfe0f2" fill-opacity=".6" cx="120" cy="64" r="28"/><path ${S} stroke-width="6" d="M140 84l26 26"/>
      <path ${S} fill="#3a9d5d" d="M48 100v-14h8v14zM62 100v-24h8v24zM76 100v-34h8v34z"/>`,
    factory: `
      <path ${S} fill="#eef6fb" d="M20 126V70l34 20V70l34 20V70l34 20V40h22v86z"/>
      <path ${S} fill="#bfe0f2" d="M34 100h14v12H34zM68 100h14v12H68zM102 100h14v12h-14z"/>
      <path ${S} fill="#ccc" d="M146 34c4-10 14-12 22-8 6-8 18-4 18 4"/>`,
    globe: `
      <circle ${S} fill="#bfe0f2" cx="80" cy="72" r="46"/><path ${S} fill="#3a9d5d" d="M50 48c10-6 22 2 18 12s-16 6-20 16-8-20 2-28zM92 84c10-4 20 4 16 14-4 8-16 6-16-14z"/>
      <path ${S} fill="none" d="M34 72h92M80 26c-20 20-20 72 0 92M80 26c20 20 20 72 0 92"/>
      <text x="160" y="56" text-anchor="middle" font-family="Permanent Marker" font-size="20">$</text><text x="168" y="90" text-anchor="middle" font-family="Permanent Marker" font-size="20">€</text><text x="150" y="120" text-anchor="middle" font-family="Permanent Marker" font-size="20">₹</text>`,
    gavel: `
      <path ${S} fill="#a86b3c" d="M60 40l30-30 20 20-30 30z"/><path ${S} fill="#a86b3c" d="M80 50l60 60-8 8-60-60z"/>
      <path ${S} fill="#d9ad74" d="M30 118h80v10H30z"/><text x="150" y="44" text-anchor="middle" font-family="Permanent Marker" font-size="13">GAAP</text><text x="150" y="70" text-anchor="middle" font-family="Permanent Marker" font-size="13">IFRS</text>`,
    erp: `
      <rect ${S} fill="#fff" x="20" y="18" width="160" height="108" rx="8"/><path ${S} fill="#714b67" d="M20 26a8 8 0 0 1 8-8h144a8 8 0 0 1 8 8v12H20z"/>
      <circle cx="32" cy="28" r="3" fill="#fff"/><circle cx="42" cy="28" r="3" fill="#fff"/>
      ${[
        ['#e4572e', 36, 52],
        ['#f2c14e', 84, 52],
        ['#3a9d5d', 132, 52],
        ['#2e86ab', 36, 90],
        ['#8e5ea2', 84, 90],
        ['#714b67', 132, 90],
      ]
        .map(([c, x, y]) => `<rect ${S} fill="${c}" x="${x}" y="${y}" width="30" height="26" rx="6"/>`)
        .join('')}`,
    invoice: `
      ${doc(46, 14, 96, 116, '#fff')}<text x="88" y="36" text-anchor="middle" font-family="Permanent Marker" font-size="13">INVOICE</text>
      <path ${S} fill="#3a9d5d" d="M100 96l40-10 4 16-40 10z"/><text x="122" y="104" text-anchor="middle" font-family="Permanent Marker" font-size="9" fill="#fff" transform="rotate(-14 122 104)">PAID</text>`,
    reconcile: `
      ${doc(18, 24, 66, 92, '#eef6fb')}${doc(116, 24, 66, 92, '#fff8e7')}
      <path ${S} fill="none" stroke="#3a9d5d" d="M84 52h32M84 72h32M84 92h32"/>
      <circle ${S} fill="#3a9d5d" cx="100" cy="52" r="5"/><circle ${S} fill="#3a9d5d" cx="100" cy="72" r="5"/><circle ${S} fill="#e4572e" cx="100" cy="92" r="5"/>`,
    gears: `
      <circle ${S} fill="#f2c14e" cx="72" cy="70" r="30"/><circle ${S} fill="#fff" cx="72" cy="70" r="10"/>
      <circle ${S} fill="#bfe0f2" cx="128" cy="86" r="22"/><circle ${S} fill="#fff" cx="128" cy="86" r="7"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect ${S} fill="#f2c14e" x="66" y="32" width="12" height="10" transform="rotate(${i * 45} 72 70)"/>`).join('')}`,
    coins: `${coin(60, 110, 20)}${coin(60, 96, 20)}${coin(60, 82, 20)}${coin(110, 110, 20)}${coin(110, 96, 20)}${coin(150, 110, 16)}
      <path ${S} fill="#3a9d5d" d="M120 24h56v34h-56z"/><circle ${S} fill="#fff" cx="148" cy="41" r="9"/>`,
    piggy: `
      <ellipse ${S} fill="#f7c6d0" cx="96" cy="80" rx="54" ry="38"/><circle ${S} fill="#f7c6d0" cx="146" cy="76" r="14"/>
      <circle cx="148" cy="74" r="2" fill="#1d1d1f"/><circle cx="144" cy="80" r="2" fill="#1d1d1f"/><circle cx="130" cy="62" r="3" fill="#1d1d1f"/>
      <path ${S} fill="#f7c6d0" d="M60 112v14h12v-12M118 112v14h12v-12M110 46l10-14 6 18"/><path ${S} d="M84 44h24"/>${coin(96, 26, 10)}`,
    chart: `
      <path ${S} fill="none" d="M26 18v104h154"/>
      <path ${S} fill="#bfe0f2" d="M44 122V92h18v30zM74 122V74h18v48zM104 122V58h18v64zM134 122V36h18v86z"/>
      <path ${S} fill="none" stroke="#e4572e" d="M40 100l38-24 30-6 52-44"/>`,
    handshake: `
      <path ${S} fill="#f5d0b0" d="M20 70l40-20 30 14 22-8 36 16-24 30-30 4-40-12z"/><path ${S} fill="#2e86ab" d="M6 64l18-6 10 38-16 6zM194 64l-18-6-10 38 16 6z"/>
      <path ${S} fill="none" d="M90 64l20 18M80 86l14 12M70 80l14 12"/>`,
  };
  HF.art = (name, cls) => (art[name] ? wrap('0 0 200 140', art[name], cls) : '');
  HF.artNames = Object.keys(art);
})();
