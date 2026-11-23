/**
 * PASSMARK — home.js
 * Landing page specific JS:
 *   - Exam catalogue tabs
 *   - Billing period toggle
 *   - FAQ accordion
 *   - Hero quiz preview animation
 * Requires: utils.js, nav.js, auth.js
 * ─────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════
   EXAM CATALOGUE TABS
═══════════════════════════════════════════ */

const ExamCatalogue = (() => {

  const data = {
    school: [
      {
        icon: '🏫', theme: 'waec', tag: 'WAEC',
        name: 'West Africa Examinations Council',
        desc: '24 years of WAEC past questions across every subject — Biology, Chemistry, Physics, Mathematics, English Language, Economics, Government, Literature and more. Official marking schemes included.',
        count: '8,000+ questions'
      },
      {
        icon: '📖', theme: 'neco', tag: 'NECO',
        name: 'National Examinations Council',
        desc: '20 years of NECO past papers for SSCE and BECE. Organised by subject, year, and difficulty. Detailed answer rationales and downloadable marking guides for every paper.',
        count: '6,000+ questions'
      },
      {
        icon: '🎓', theme: 'jamb', tag: 'JAMB / UTME',
        name: 'Joint Admissions & Matriculation Board',
        desc: 'Complete JAMB/UTME past questions from 2005 to date across all subject combinations. CBT practice mode mirrors the real JAMB interface. Syllabus-aligned for every course.',
        count: '10,000+ questions'
      }
    ],
    university: [
      {
        icon: '🏛️', theme: 'postutme', tag: 'UNILAG Post-UTME',
        name: 'University of Lagos',
        desc: 'Past Post-UTME questions for all UNILAG faculties. English, Mathematics, Current Affairs and subject-specific tests. CBT timed practice that mirrors the real UNILAG screening format.',
        count: '2,000+ questions'
      },
      {
        icon: '🎯', theme: 'postutme', tag: 'UI Post-UTME',
        name: 'University of Ibadan',
        desc: 'University of Ibadan Post-UTME past questions for all departments. Includes English Language, General Knowledge, and course-related subject questions with full answer explanations.',
        count: '1,500+ questions'
      },
      {
        icon: '📐', theme: 'postutme', tag: 'OAU Post-UTME',
        name: 'Obafemi Awolowo University',
        desc: 'OAU Ile-Ife Post-UTME screening past questions. All faculties covered including Sciences, Arts, Social Sciences, Law and Administration. CBT practice with timed tests.',
        count: '1,500+ questions'
      },
      {
        icon: '🔬', theme: 'postutme', tag: 'ABU Post-UTME',
        name: 'Ahmadu Bello University',
        desc: 'ABU Zaria Post-UTME past questions for all faculties. Strong coverage of Science and Technology subjects alongside English and General Studies questions.',
        count: '1,200+ questions'
      },
      {
        icon: '⚗️', theme: 'postutme', tag: 'UNILORIN Post-UTME',
        name: 'University of Ilorin',
        desc: 'University of Ilorin Post-UTME past questions. UNILORIN is known for rigorous screening — practice with real past questions across all subject combinations and faculties.',
        count: '1,200+ questions'
      }
    ],
    professional: [
      {
        icon: '📊', theme: 'ican', tag: 'ICAN',
        name: 'Institute of Chartered Accountants of Nigeria',
        desc: 'Foundation, Skills, and Professional level ICAN past questions and suggested solutions. Official examiners\' reports included. The gold standard for accountancy qualification in Nigeria.',
        count: '5,000+ questions'
      },
      {
        icon: '👩‍🏫', theme: 'trcn', tag: 'TRCN',
        name: 'Teachers Registration Council of Nigeria',
        desc: 'TRCN Professional Qualifying Examination (PQE) past questions for all categories — NCE (Category D), B.Ed (Category C), and postgraduate. Every Nigerian teacher must pass this exam.',
        count: '3,000+ questions'
      },
      {
        icon: '🏦', theme: 'cibn', tag: 'CIBN',
        name: 'Chartered Institute of Bankers of Nigeria',
        desc: 'CIBN professional banking examinations — Associate and Fellowship levels. Past questions covering banking practice, financial markets, risk management, and banking law.',
        count: '2,000+ questions'
      }
    ],
    nursing: [
      {
        icon: '🏥', theme: 'nclex', tag: 'NCLEX-RN',
        name: 'NCLEX-RN — USA & Canada',
        desc: 'NCSBN-format questions including Next Generation NCLEX (NGN) case studies across all eight client-need categories. Written by registered nurses who passed NCLEX. Clinical judgment focus.',
        count: '2,000+ questions'
      },
      {
        icon: '🇬🇧', theme: 'plab', tag: 'PLAB 1 & 2',
        name: 'PLAB — UK GMC Registration',
        desc: 'Professional & Linguistic Assessments Board for GMC registration in the United Kingdom. PLAB 1 MCQ preparation and PLAB 2 OSCE station scenarios written by UK-registered doctors.',
        count: '1,500+ questions'
      }
    ]
  };
  function renderCards(tabKey) {
    const grid  = document.getElementById('exam-cards-grid');
    const cards = data[tabKey] || data.school;
    if (!grid) return;

    grid.innerHTML = cards.map((card, i) => `
      <div class="exam-card exam-card--${card.theme} reveal reveal--delay-${i + 1}"
           role="button"
           tabindex="0"
           onclick="document.querySelector('[data-modal=signup]')?.click()"
           onkeypress="if(event.key==='Enter')this.click()">
        <div class="exam-card__icon">${card.icon}</div>
        <div class="exam-card__tag">${card.tag}</div>
        <h3 class="exam-card__name">${card.name}</h3>
        <p class="exam-card__desc">${card.desc}</p>
        <div class="exam-card__footer">
          <span class="exam-card__count">📄 ${card.count}</span>
          <div class="exam-card__arrow" aria-hidden="true">→</div>
        </div>
      </div>
    `).join('');

    // Re-observe new elements for reveal
    PM.$$('.reveal', grid).forEach(el => {
      el.classList.remove('visible');
      // Trigger reflow so the transition fires
      void el.offsetWidth;
      setTimeout(() => el.classList.add('visible'), 50);
    });
  }

  function init() {
    const tabs = PM.$$('.exams__tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('exams__tab--active'));
        tab.classList.add('exams__tab--active');
        renderCards(tab.dataset.examTab);
      });
    });

    // Render initial tab
    renderCards('school');

    // Update tab aria-selected on click
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
        tab.setAttribute('aria-selected', 'true');
      });
    });
  }

  return { init };
})();


/* ═══════════════════════════════════════════
   BILLING TOGGLE
═══════════════════════════════════════════ */

const BillingToggle = (() => {

  const prices = {
    school:       { monthly: '6,000',  annual: '4,200'  },
    postutme:     { monthly: '3,500',  annual: '2,450'  },
    professional: { monthly: '9,500',  annual: '6,650'  },
    nursing:      { monthly: '9,500',  annual: '6,650'  },
    bundle:       { monthly: '22,000', annual: '15,400' },
    // legacy keys (keep for backward compat with any existing data)
    waec:    { monthly: '6,000',  annual: '4,200'  },
    neco:    { monthly: '6,000',  annual: '4,200'  },
    ican:    { monthly: '9,500',  annual: '6,650'  },
    trcn:    { monthly: '9,500',  annual: '6,650'  }
  };

  let isAnnual = false;

  function updateDisplayed() {
    PM.$$('[data-price-key]').forEach(el => {
      const plan = el.dataset.priceKey;
      if (prices[plan]) {
        el.textContent = '₦' + (isAnnual ? prices[plan].annual : prices[plan].monthly);
      }
    });

    PM.$$('[data-price-period]').forEach(el => {
      el.textContent = isAnnual ? '/mo · billed annually' : '/month';
    });
  }

  function init() {
    PM.$$('.pricing__tab').forEach(tab => {
      tab.addEventListener('click', () => {
        PM.$$('.pricing__tab').forEach(t => t.classList.remove('pricing__tab--active'));
        tab.classList.add('pricing__tab--active');
        isAnnual = tab.dataset.billing === 'annual';
        updateDisplayed();
      });
    });
  }

  return { init };
})();


/* ═══════════════════════════════════════════
   FAQ ACCORDION
═══════════════════════════════════════════ */

const FAQ = (() => {

  function init() {
    const items = PM.$$('.faq-item');

    items.forEach(item => {
      const question = item.querySelector('.faq-item__question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('faq-item--open');

        // Close all
        items.forEach(i => {
          i.classList.remove('faq-item--open');
          i.querySelector('.faq-item__question')?.setAttribute('aria-expanded', 'false');
        });

        // Open clicked (unless it was already open)
        if (!isOpen) {
          item.classList.add('faq-item--open');
          question.setAttribute('aria-expanded', 'true');
        }
      });

      // Keyboard accessibility
      question.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          question.click();
        }
      });
    });

    // Open first item by default
    const first = items[0];
    if (first) {
      first.classList.add('faq-item--open');
      first.querySelector('.faq-item__question')?.setAttribute('aria-expanded', 'true');
    }
  }

  return { init };
})();


/* ═══════════════════════════════════════════
   HERO QUIZ PREVIEW
═══════════════════════════════════════════ */

const HeroQuiz = (() => {

  const questions = [
    {
      tag: 'NCLEX-RN · Pharmacology',
      text: 'A client on digoxin 0.25 mg/day reports nausea and blurred vision. Which finding requires holding the dose?',
      options: [
        { letter: 'A', text: 'Heart rate 58 bpm', correct: false },
        { letter: 'B', text: 'Serum potassium 2.5 mEq/L', correct: true },
        { letter: 'C', text: 'Blood pressure 110/72 mmHg', correct: false },
        { letter: 'D', text: 'Creatinine 1.1 mg/dL', correct: false }
      ]
    },
    {
      tag: 'USMLE Step 1 · Biochemistry',
      text: 'A 4-year-old has megaloblastic anaemia with orotic aciduria but normal ammonia. Which enzyme deficiency is most likely?',
      options: [
        { letter: 'A', text: 'Carbamoyl phosphate synthetase I', correct: false },
        { letter: 'B', text: 'UMP synthase', correct: true },
        { letter: 'C', text: 'Adenosine deaminase', correct: false },
        { letter: 'D', text: 'Xanthine oxidase', correct: false }
      ]
    },
    {
      tag: 'IELTS Academic · Reading',
      text: 'The passage implies that urban biodiversity decline is primarily caused by which factor?',
      options: [
        { letter: 'A', text: 'Pesticide use on surrounding farmland', correct: false },
        { letter: 'B', text: 'Fragmentation of green corridors in cities', correct: true },
        { letter: 'C', text: 'Rising average global temperatures', correct: false },
        { letter: 'D', text: 'Reduction of urban rainfall', correct: false }
      ]
    },
    {
      tag: 'WAEC Chemistry · 2023',
      text: 'In the electrolysis of dilute H₂SO₄ using platinum electrodes, what is liberated at the cathode?',
      options: [
        { letter: 'A', text: 'Oxygen gas', correct: false },
        { letter: 'B', text: 'Sulphur dioxide', correct: false },
        { letter: 'C', text: 'Hydrogen gas', correct: true },
        { letter: 'D', text: 'Sulphuric acid', correct: false }
      ]
    }
  ];

  let currentIndex = 0;
  let answered     = false;
  let cycleTimer   = null;

  function getElements() {
    return {
      tagEl:    document.querySelector('.hero__quiz-tag'),
      textEl:   document.querySelector('.hero__quiz-question'),
      optsEl:   document.querySelector('.hero__quiz-options'),
      cardEl:   document.querySelector('.hero__quiz-card')
    };
  }

  function render(question) {
    const { tagEl, textEl, optsEl } = getElements();
    if (!tagEl || !optsEl) return;

    tagEl.textContent  = question.tag;
    textEl.textContent = question.text;
    optsEl.innerHTML   = '';

    question.options.forEach(opt => {
      const div = document.createElement('div');
      div.className = 'hero__quiz-option';
      div.innerHTML = `
        <span class="hero__quiz-letter">${opt.letter}</span>
        <span class="hero__quiz-text">${opt.text}</span>
      `;
      div.dataset.correct = opt.correct;
      div.addEventListener('click', () => handleAnswer(div, optsEl));
      optsEl.appendChild(div);
    });

    answered = false;
  }

  function handleAnswer(chosen, optsEl) {
    if (answered) return;
    answered = true;

    clearTimeout(cycleTimer);

    PM.$$('.hero__quiz-option', optsEl).forEach(opt => {
      if (opt.dataset.correct === 'true')  opt.classList.add('hero__quiz-option--correct');
      else if (opt === chosen)             opt.classList.add('hero__quiz-option--wrong');
    });

    cycleTimer = setTimeout(nextQuestion, 2600);
  }

  function nextQuestion() {
    const { cardEl } = getElements();
    currentIndex = (currentIndex + 1) % questions.length;

    if (cardEl) {
      cardEl.style.cssText = 'opacity:0;transform:translateY(8px);transition:opacity .3s ease,transform .3s ease';
      setTimeout(() => {
        render(questions[currentIndex]);
        cardEl.style.cssText = 'opacity:1;transform:none;transition:opacity .3s ease,transform .3s ease';
      }, 320);
    } else {
      render(questions[currentIndex]);
    }
  }

  function init() {
    const { cardEl } = getElements();
    if (!cardEl) return;
    render(questions[0]);
  }

  return { init };
})();


/* ═══════════════════════════════════════════
   INIT ALL
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  PM.initReveal();
  PM.initCounters();
  ExamCatalogue.init();
  BillingToggle.init();
  FAQ.init();
  HeroQuiz.init();
});