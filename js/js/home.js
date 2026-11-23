'use strict';

/* ── Exam catalogue data ── */
const EXAMS = {
  school: [
    { key:'waec',   emoji:'🏫', name:'WAEC',        sub:'West Africa Senior School Certificate', years:'1990–2024', q:'15,000+', badge:'',         color:'#EEF2FF' },
    { key:'neco',   emoji:'📖', name:'NECO',         sub:'National Examinations Council',         years:'2000–2024', q:'12,000+', badge:'',         color:'#E0F5F1' },
    { key:'jamb',   emoji:'🎓', name:'JAMB / UTME',  sub:'Joint Admissions & Matriculation Board', years:'1983–2024', q:'18,000+', badge:'Most Questions', color:'#FFF8E1' },
  ],
  postutme: [
    { key:'unilag', emoji:'🏛️', name:'UNILAG',       sub:'University of Lagos',                   years:'2005–2024', q:'2,000+', badge:'', color:'#F3EFFE' },
    { key:'ui',     emoji:'🏛️', name:'Univ. of Ibadan', sub:'University of Ibadan',               years:'2005–2024', q:'1,800+', badge:'', color:'#EEF2FF' },
    { key:'oau',    emoji:'🏛️', name:'OAU',           sub:'Obafemi Awolowo University',            years:'2005–2024', q:'1,600+', badge:'', color:'#E0F5F1' },
    { key:'abu',    emoji:'🏛️', name:'ABU',           sub:'Ahmadu Bello University',               years:'2005–2024', q:'1,400+', badge:'', color:'#FFF8E1' },
    { key:'unilorin',emoji:'🏛️',name:'UNILORIN',      sub:'University of Ilorin',                 years:'2005–2024', q:'1,200+', badge:'', color:'#FEF2F2' },
  ],
  professional: [
    { key:'ican',   emoji:'📊', name:'ICAN',          sub:'Institute of Chartered Accountants',    years:'2011–2026', q:'8,000+', badge:'Official Pathfinder', color:'#FFF8E1' },
    { key:'trcn',   emoji:'👩‍🏫', name:'TRCN',          sub:'Teachers Registration Council',         years:'2015–2025', q:'5,000+', badge:'',         color:'#E0F5F1' },
    { key:'cibn',   emoji:'🏦', name:'CIBN',           sub:'Chartered Institute of Bankers Nigeria', years:'2015–2024', q:'3,000+', badge:'',         color:'#EBF0FF' },
  ],
  medical: [
    { key:'nclex',  emoji:'🏥', name:'NCLEX-RN',      sub:'USA & Canada Nursing Licence',           years:'2018–2024', q:'6,000+', badge:'NGN Format', color:'#FEF2F2' },
    { key:'plab',   emoji:'🇬🇧', name:'PLAB',           sub:'UK GMC Medical Licence',                years:'2018–2024', q:'4,000+', badge:'',         color:'#EBF0FF' },
  ]
};

/* ── Render exam grid ── */
function renderExams(tab) {
  const grid = document.getElementById('examGrid');
  if (!grid) return;
  const list = EXAMS[tab] || [];
  grid.innerHTML = list.map(e => `
    <div class="exam-card reveal">
      <div class="exam-card__icon" style="background:${e.color}">${e.emoji}</div>
      <div class="exam-card__body">
        <div class="exam-card__top">
          <h3 class="exam-card__name">${e.name}</h3>
          ${e.badge ? `<span class="exam-card__badge">${e.badge}</span>` : ''}
        </div>
        <p class="exam-card__sub">${e.sub}</p>
        <div class="exam-card__meta">
          <span>📅 ${e.years}</span>
          <span>❓ ${e.q} questions</span>
        </div>
      </div>
      <button class="btn btn-sm btn-primary exam-card__cta" data-modal="signup">Start Practising</button>
    </div>
  `).join('');
  // Re-observe new cards for reveal animation
  grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  // Re-attach modal buttons
  grid.querySelectorAll('[data-modal]').forEach(el =>
    el.addEventListener('click', () => Modal.open(el.dataset.modal))
  );
}

/* ── Intersection observer for reveal ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ── Exam tabs ── */
const Tabs = (() => {
  let current = 'school';
  return {
    init() {
      document.querySelectorAll('.exam-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.exam-tab').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          current = btn.dataset.tab;
          renderExams(current);
        });
      });
      renderExams(current);
    }
  };
})();

/* ── Nav ── */
const Nav = (() => {
  const nav = document.getElementById('nav');
  const ham = document.querySelector('.nav-ham');
  const drawer = document.querySelector('.nav-drawer');
  let open = false;

  function onScroll() { nav?.classList.toggle('scrolled', scrollY > 30); }

  function toggle() {
    open = !open;
    drawer?.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    const spans = ham?.querySelectorAll('span') || [];
    if (open) {
      spans[0] && (spans[0].style.cssText = 'transform:rotate(45deg) translate(5px,5px)');
      spans[1] && (spans[1].style.cssText = 'opacity:0');
      spans[2] && (spans[2].style.cssText = 'transform:rotate(-45deg) translate(5px,-5px)');
    } else {
      spans.forEach(s => s.removeAttribute('style'));
    }
  }

  return {
    init() {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      ham?.addEventListener('click', toggle);
      drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        if (open) toggle();
      }));
    }
  };
})();

/* ── Modal ── */
const Modal = (() => {
  const bg = document.getElementById('authModal');

  function show(name) {
    bg?.querySelectorAll('.mv').forEach(v => v.classList.toggle('on', v.id === name + 'View'));
  }

  function open(name) {
    if (!bg) return;
    show(name || 'signup');
    bg.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => bg.querySelector('.mv.on input')?.focus(), 300);
  }

  function close() {
    if (!bg) return;
    bg.classList.remove('open');
    document.body.style.overflow = '';
  }

  return {
    open,
    init() {
      if (!bg) return;
      bg.addEventListener('click', e => { if (e.target === bg) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
      bg.querySelector('.modal-x')?.addEventListener('click', close);
      document.querySelectorAll('[data-modal]').forEach(el =>
        el.addEventListener('click', () => open(el.dataset.modal))
      );
      bg.querySelectorAll('[data-sw]').forEach(el =>
        el.addEventListener('click', e => { e.preventDefault(); show(el.dataset.sw); })
      );
      bg.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', e => {
          e.preventDefault();
          const btn = form.querySelector('[type=submit]');
          const orig = btn?.textContent;
          if (btn) { btn.textContent = 'Please wait…'; btn.disabled = true; }
          setTimeout(() => {
            if (btn) { btn.textContent = orig; btn.disabled = false; }
            close();
            Toast.show('Welcome to Passmark! Setting up your account…');
          }, 1400);
        });
      });
    }
  };
})();

/* ── Toast ── */
const Toast = {
  show(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('toast--in'));
    setTimeout(() => { t.classList.remove('toast--in'); setTimeout(() => t.remove(), 400); }, 3500);
  }
};

/* ── Announcement bar ── */
const Ann = {
  init() {
    const bar = document.querySelector('.ann-bar');
    const x = document.querySelector('.ann-x');
    if (!bar || !x) return;
    if (sessionStorage.getItem('pm-ann')) { bar.remove(); return; }
    x.addEventListener('click', () => {
      bar.style.cssText = 'overflow:hidden;transition:all .3s ease;max-height:0;opacity:0;padding:0;border:none';
      setTimeout(() => bar.remove(), 340);
      sessionStorage.setItem('pm-ann', '1');
    });
  }
};

/* ── Pricing toggle ── */
const Pricing = {
  init() {
    const btns = document.querySelectorAll('.ptog');
    const amounts = document.querySelectorAll('.price-amount');
    const perEls = document.querySelectorAll('.price-per');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const period = btn.dataset.period;
        amounts.forEach(el => {
          const val = period === 'annual' ? el.dataset.annual : el.dataset.monthly;
          el.textContent = Number(val).toLocaleString();
        });
        perEls.forEach(el => {
          el.textContent = period === 'annual' ? '/month (billed annually)' : '/month';
        });
      });
    });
  }
};

/* ── FAQ accordion ── */
const FAQ = {
  init() {
    document.querySelectorAll('.faq-q').forEach(q => {
      q.addEventListener('click', () => {
        const item = q.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }
};

/* ── Stats counter ── */
const Counter = {
  init() {
    const nums = document.querySelectorAll('.hstat-num[data-target]');
    if (!nums.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const duration = 1800;
        const start = performance.now();
        function step(now) {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(ease * target).toLocaleString();
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target.toLocaleString();
        }
        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(el => obs.observe(el));
  }
};

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  Modal.init();
  Ann.init();
  Tabs.init();
  Pricing.init();
  FAQ.init();
  Counter.init();
});
