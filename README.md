# BrainLedger — Accounting, the brain-friendly way

An interactive, visual, Head-First-style website that teaches accounting from the very first debit to closing the books in **Odoo**. It uses stories, hand-drawn illustrations, simulators, puzzles, quizzes, flashcards and gamification to keep learners engaged.

## What's inside

| Part | Chapters |
|---|---|
| **1. Foundations** | Welcome to accounting · The accounting equation · Debits & credits (DEALER + golden rules) · Journal entries · Ledgers & T-accounts · Trial balance & errors · The accounting cycle |
| **2. Statements & the close** | Accruals & adjusting entries · Income statement · Balance sheet & changes in equity · Cash flow statement · Closing the books |
| **3. The balance sheet, line by line** | Cash & bank reconciliation · Receivables & bad debts · Inventory (FIFO/LIFO/AVCO, NRV) · Fixed assets & depreciation · Liabilities, payroll & loans · Equity |
| **4. Advanced** | VAT/GST, sales tax, TDS & deferred tax · Financial analysis & ratios · Cost accounting & CVP · Budgeting & variances · IFRS 15 revenue & IFRS 16 leases · Group accounts & foreign currency · Standards, audit, controls & ethics |
| **5. Odoo Accounting** | Setup & tour · Quotation to cash · Vendor bills & payables · Bank & reconciliation · Inventory valuation, assets & deferrals · Analytics, budgets, multi-currency & multi-company · Reporting, tax return & period close |

**32 chapters · 200 quiz questions · ~250 glossary terms · 17 interactive widget types**

Each chapter mixes Head-First-style elements: comic strips, speech bubbles from recurring characters, *Brain Power*, *Sharpen your pencil* (with reveal answers), *There are no Dumb Questions*, *Watch it!*, *Fireside Chats*, *Bullet Points*, sticky notes, ledger-paper journal entries and "In Odoo" tips.

### Interactive simulators
Balance-scale accounting equation · drag/tap sorting games · journal entry builder with checking · T-account posting game · accounting cycle wheel · cash vs accrual comparison · bank reconciliation matcher · inventory FIFO/LIFO/AVCO race · depreciation machine · ratio dashboard · break-even explorer · variance detective · loan amortisation · time value of money · VAT/GST chain · FX gain/loss · IFRS 15 allocator · Odoo invoice→payment→bank simulator (sales and purchase).

### Learning & motivation features
- Chapter quizzes with explanations (70% = mastered ★)
- **Quick sessions**: flashcard warm-up → mixed mini-quiz → what to learn next (smart mix, basics, statements, advanced, Odoo, weak spots)
- 30-question **final exam** and a printable certificate
- Flashcard decks per chapter / part / everything
- Searchable glossary
- XP, levels, badges, daily streaks — progress saved in the browser (`localStorage`)
- Light/dark mode, mobile-friendly layout

## Running it

It's a static site with no build step and no dependencies.

- **Quickest:** open `index.html` in a browser.
- **Local server:** `python3 -m http.server 8000` and visit http://localhost:8000.
- **Deploy:** any static host works (GitHub Pages, Netlify, Vercel, S3…). For GitHub Pages: *Settings → Pages → Deploy from a branch → main / root*.

## Project structure

```
index.html              App shell (nav, fonts, SVG "sketch" filter)
css/style.css           Head-First-inspired styles, light/dark themes
js/core.js              Namespace, helpers, progress, XP/levels/badges
js/art.js               Hand-drawn SVG illustrations, icons and characters
js/widgets.js           All interactive widgets
js/app.js               Router, content-block renderers, pages, quiz & session engine
js/content/part1-5.js   Chapter content (data)
js/content/glossary.js  Glossary
```

## Adding or editing content

Chapters are plain data. Add one with `HF.addChapter({...})` in a `js/content/*.js` file:

```js
HF.addChapter({
  id: 'my-topic', part: 'p2', title: 'My Topic', subtitle: '…',
  art: 'chart', level: 'Intermediate', minutes: 20,
  goals: ['…'],
  blocks: [
    { t: 'h', text: 'Section heading' },
    { t: 'p', html: 'Paragraph with <b>HTML</b>.' },
    { t: 'entry', lines: [['Cash', 100, 0], ['Sales', 0, 100]], narr: 'Cash sale' },
    { t: 'widget', name: 'sort', opts: { bins: [...], items: [...] } },
  ],
  quiz: [{ q: 'Question?', o: ['A', 'B', 'C'], a: 1, e: 'Explanation' }],
  cards: [['Front', 'Back']],
});
```

Block types: `h`, `h3`, `p`, `lead`, `list`, `sticky`, `formula`, `brain`, `watch`, `relax`, `odoo`, `nodumb`, `pencil`, `bullets`, `chat`, `say`, `story`, `art`, `table`, `entry`, `cards`, `compare`, `steps`, `flow`, `reveal`, `widget`, `html`.

## Disclaimer

Educational content. Accounting standards (IFRS/US GAAP), tax rules and Odoo menus vary by country and version and change over time; always confirm against current local rules and your Odoo version. Odoo is a trademark of Odoo S.A.; this project is an independent learning resource.
