# Passmark — Frontend Project

> The global exam preparation platform.
> WAEC · NECO · IELTS · NCLEX-RN · USMLE · PLAB · MCCQE · HAAD · Prometric

---

## Project Structure

```
passmark-full/
│
├── index.html                    ← Landing page (homepage)
│
├── pages/
│   ├── dashboard.html            ← Student dashboard
│   ├── quiz.html                 ← Quiz / practice engine
│   ├── results.html              ← Session results & review
│   └── admin.html                ← Admin panel
│
├── css/
│   ├── tokens.css                ← Design system (variables, reset, fonts)
│   ├── components.css            ← Reusable components (nav, buttons, forms, modal, footer)
│   ├── home.css                  ← Landing page sections only
│   ├── dashboard.css             ← Dashboard & sidebar layout
│   ├── quiz.css                  ← Quiz engine & results page
│   └── admin.css                 ← Admin panel tables & upload
│
├── js/
│   ├── utils.js                  ← Shared helpers (counters, reveal, toast, API, store)
│   ├── nav.js                    ← Navigation scroll, drawer, topbar
│   ├── auth.js                   ← Login/signup modal, JWT session
│   ├── home.js                   ← Landing page: exam tabs, billing toggle, FAQ
│   ├── quiz.js                   ← Quiz engine: questions, timer, submit
│   ├── results.js                ← Results page: score, review, filter
│   ├── dashboard.js              ← Dashboard data, progress bars, streak
│   ├── payment.js                ← Paystack integration
│   └── admin.js                  ← Admin panel: question table, CSV import, users
│
├── assets/
│   ├── images/
│   │   ├── README.md             ← Image sourcing guide (read this!)
│   │   ├── hero-students.jpg     ← (ADD THIS — see README.md)
│   │   ├── lecture-hall.jpg      ← (ADD THIS — see README.md)
│   │   └── lab-students.jpg      ← (ADD THIS — see README.md)
│   └── icons/                    ← SVG icons (optional, add as needed)
│
└── data/
    └── questions/
        ├── TEMPLATE.csv          ← Master CSV template for all exams
        ├── waec/
        │   └── sample-biology.csv
        ├── neco/                 ← Add: sample-*.csv files
        ├── ielts/
        │   └── sample-reading.csv
        ├── nclex/
        │   └── sample-pharmacology.csv
        ├── usmle/
        │   └── sample-step1.csv
        ├── plab/                 ← Add: sample-*.csv files
        ├── mccqe/                ← Add: sample-*.csv files
        ├── haad/                 ← Add: sample-*.csv files
        └── prometric/            ← Add: sample-*.csv files
```

---

## CSS Architecture

No CSS is embedded in any HTML file. Load order matters:

```html
<link rel="stylesheet" href="css/tokens.css">      <!-- Always first -->
<link rel="stylesheet" href="css/components.css">  <!-- Always second -->
<link rel="stylesheet" href="css/home.css">        <!-- Page-specific last -->
```

CSS custom properties (`var(--...)`):
- All colours, fonts, spacing, shadows, and animation values are in `tokens.css`.
- Never hardcode a colour. Always use `var(--navy)`, `var(--gold-2)`, etc.

---

## JavaScript Architecture

No JS is embedded in HTML. Load order in each page:

```html
<!-- Always load utils.js first -->
<script src="js/utils.js"></script>

<!-- Load auth.js on every page that needs session awareness -->
<script src="js/auth.js"></script>

<!-- Page-specific last -->
<script src="js/home.js"></script>
```

All shared utilities are exposed on `window.PM`:
```js
PM.$()           // document.querySelector
PM.$$()          // document.querySelectorAll
PM.apiRequest()  // authenticated fetch to /api/*
PM.showToast()   // toast notifications
PM.store         // localStorage wrapper
PM.formatNaira() // ₦ currency formatting
```

---

## Paystack Setup

1. Sign up at https://paystack.com
2. Get your public key from **Settings → API Keys & Webhooks**
3. Open `js/payment.js` and replace:
   ```js
   const PAYSTACK_PUBLIC_KEY = 'pk_test_YOUR_KEY_HERE';
   ```
4. Set webhook URL in Paystack dashboard:
   ```
   https://yourdomain.com/api/payments/webhook
   ```
5. Add to backend `.env`:
   ```
   PAYSTACK_PUBLIC_KEY=pk_test_...
   PAYSTACK_SECRET_KEY=sk_test_...
   ```

---

## Question CSV Format

Every question imported via the Admin panel must follow this structure:

| Column | Required | Values |
|--------|----------|--------|
| `exam` | ✓ | waec, neco, ielts, nclex, usmle, plab, mccqe, haad, prometric |
| `subject` | ✓ | Biology, Chemistry, Pharmacology, etc. |
| `year` | — | 4-digit year or empty for original content |
| `difficulty` | ✓ | easy, medium, hard, very-hard |
| `question_text` | ✓ | Full question text |
| `option_a` through `option_d` | ✓ | Answer option text |
| `correct_option` | ✓ | A, B, C, or D |
| `explanation` | ✓ | Why the correct answer is right and why wrong ones are wrong |
| `tags` | — | Comma-separated: "pharmacology,digoxin,toxicity" |
| `source` | — | waec-official-2023, original, etc. |

Sample files are in `data/questions/` — use them as references.

---

## Images

See `assets/images/README.md` for instructions on which photos to source and where to get them for free.

Three photos needed:
- `hero-students.jpg` — students studying together
- `lecture-hall.jpg` — university lecture hall
- `lab-students.jpg` — lab or medical setting

---

## Backend (Next Step)

The frontend is complete and calls these API endpoints:

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/dashboard/stats
GET    /api/dashboard/progress
GET    /api/dashboard/streak
GET    /api/sessions/recent
POST   /api/sessions/start
POST   /api/sessions/submit
GET    /api/sessions/:id/results
POST   /api/payments/initialize
GET    /api/payments/verify/:ref
POST   /api/payments/webhook
GET    /api/admin/questions
GET    /api/admin/questions/stats
DELETE /api/admin/questions/:id
POST   /api/admin/questions/import
GET    /api/admin/users
GET    /api/admin/overview
```

Backend stack recommendation: **Node.js + Express + PostgreSQL + Paystack**

---

## Browser Support

- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓
- Mobile Chrome/Safari ✓

Not supported: Internet Explorer (no longer relevant).
