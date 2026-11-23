/**
 * PASSMARK — utils.js
 * Shared utility functions used across all pages.
 * No dependencies. Load before all other scripts.
 * ─────────────────────────────────────────────────
 */

'use strict';

/* ── DOM Selectors ─────────────────────────────── */
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

/* ── Scroll Reveal ─────────────────────────────── */
function initReveal() {
  const elements = $$('.reveal');
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.07,
    rootMargin: '0px 0px -20px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ── Animated Counter ──────────────────────────── */
function animateCounter(element) {
  const target   = parseFloat(element.dataset.target) || 0;
  const suffix   = element.dataset.suffix || '';
  const decimals = element.dataset.decimals ? parseInt(element.dataset.decimals) : 0;
  const duration = 1800;
  const start    = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const value    = target * eased;
    element.textContent = value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function initCounters() {
  const elements = $$('[data-target]');
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  elements.forEach(el => observer.observe(el));
}

/* ── Progress Bar Animator ─────────────────────── */
function initProgressBars() {
  const bars = $$('[data-progress]');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = $('.progress-bar__fill', entry.target) ||
                     entry.target.querySelector('[data-fill]');
        if (fill) {
          setTimeout(() => {
            fill.style.width = entry.target.dataset.progress + '%';
          }, 200);
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => observer.observe(bar));
}

/* ── Toast Notification ────────────────────────── */
function showToast(message, type = 'default', duration = 3800) {
  // Remove any existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast${type !== 'default' ? ` toast--${type}` : ''}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

/* ── Smooth Scroll ─────────────────────────────── */
function initSmoothScroll(navHeight = 72) {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id     = link.getAttribute('href').slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ── Format Currency ───────────────────────────── */
function formatNaira(amount) {
  return '₦' + Number(amount).toLocaleString();
}

/* ── Debounce ──────────────────────────────────── */
function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/* ── Throttle ──────────────────────────────────── */
function throttle(fn, wait = 100) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}

/* ── Local Storage Helpers ─────────────────────── */
const store = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); return true; }
    catch { return false; }
  }
};

/* ── API Base Request ──────────────────────────── */
async function apiRequest(endpoint, options = {}) {
  const token = store.get('pm_token');

  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`https://passmark-backend-x438.onrender.com/api${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

/* ── Form Validation ───────────────────────────── */
function validateForm(form) {
  let valid = true;
  $$('[required]', form).forEach(field => {
    const value   = field.value.trim();
    const wrapper = field.closest('.field');

    if (!value) {
      valid = false;
      wrapper?.classList.add('field--error');
    } else {
      wrapper?.classList.remove('field--error');
    }

    // Email validation
    if (field.type === 'email' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        valid = false;
        wrapper?.classList.add('field--error');
      }
    }
  });
  return valid;
}

/* ── Export (used by other modules) ────────────── */
window.PM = window.PM || {};
Object.assign(window.PM, {
  $, $$,
  initReveal,
  initCounters,
  initProgressBars,
  showToast,
  toast: showToast,
  initSmoothScroll,
  formatNaira,
  debounce,
  throttle,
  store,
  apiRequest,
  validateForm,
  getToken:   () => localStorage.getItem('pm_token'),
  setToken:   (t) => localStorage.setItem('pm_token', t),
  clearToken: () => localStorage.removeItem('pm_token'),
  getUser:    () => { try { return JSON.parse(localStorage.getItem('pm_user')); } catch { return null; } },
  setUser:    (u) => localStorage.setItem('pm_user', JSON.stringify(u)),
  clearUser:  () => localStorage.removeItem('pm_user'),
  isLoggedIn: () => !!localStorage.getItem('pm_token'),
});