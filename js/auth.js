/**
 * PASSMARK — auth.js
 * Modal auth: sign up, log in, forgot password.
 * Communicates with POST /api/auth/register & /api/auth/login
 * Requires: utils.js
 * ─────────────────────────────────────────────────────────
 */

'use strict';

const Auth = (() => {

  const modal    = document.getElementById('authModal');
  const closeBtn = modal?.querySelector('.modal__close');

  /* ── Open / close ── */
  function open(view = 'signup') {
    if (!modal) return;
    showView(view);
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const firstInput = modal.querySelector(`.modal__view--active input`);
      firstInput?.focus();
    }, 320);
  }

  function close() {
    if (!modal) return;
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
    clearErrors();
  }

  function showView(name) {
    PM.$$('.modal__view', modal).forEach(v => {
      v.classList.toggle('modal__view--active', v.id === `${name}View`);
    });
  }

  function clearErrors() {
    PM.$$('.field--error', modal).forEach(f => f.classList.remove('field--error'));
    PM.$$('.field__error', modal).forEach(e => { e.textContent = ''; e.style.display = 'none'; });
  }

  /* ── Set button loading state ── */
  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = 'Please wait…';
      btn.classList.add('btn--loading');
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.classList.remove('btn--loading');
      btn.disabled = false;
    }
  }

  /* ── Sign Up ── */
  async function handleSignup(form) {
    const btn = form.querySelector('[type="submit"]');
    if (!PM.validateForm(form)) return;

    const payload = {
      name:     form.querySelector('#su-name')?.value.trim(),
      email:    form.querySelector('#su-email')?.value.trim().toLowerCase(),
      phone:    form.querySelector('#su-phone')?.value.trim(),
      password: form.querySelector('#su-password')?.value
    };

    setLoading(btn, true);

    try {
      const response = await PM.apiRequest('/auth/register', {
        method: 'POST',
        body: payload
      });

      // Store token
      PM.store.set('pm_token', response.token);
      PM.store.set('pm_user',  response.user);

      close();
      PM.showToast('Welcome to Passmark! Redirecting to your dashboard…', 'success');

      setTimeout(() => {
        window.location.href = '/pages/dashboard.html';
      }, 1200);

    } catch (err) {
      setLoading(btn, false);
      PM.showToast(err.message || 'Registration failed. Please try again.', 'error');
    }
  }

  /* ── Log In ── */
  async function handleLogin(form) {
    const btn = form.querySelector('[type="submit"]');
    if (!PM.validateForm(form)) return;

    const payload = {
      email:    form.querySelector('#li-email')?.value.trim().toLowerCase(),
      password: form.querySelector('#li-password')?.value
    };

    setLoading(btn, true);

    try {
      const response = await PM.apiRequest('/auth/login', {
        method: 'POST',
        body: payload
      });

      PM.store.set('pm_token', response.token);
      PM.store.set('pm_user',  response.user);

      close();
      PM.showToast('Welcome back! Loading your dashboard…', 'success');

      setTimeout(() => {
        window.location.href = '/pages/dashboard.html';
      }, 1000);

    } catch (err) {
      setLoading(btn, false);
      PM.showToast(err.message || 'Login failed. Check your email and password.', 'error');
    }
  }

  /* ── Check current session ── */
  function getCurrentUser() {
    return PM.store.get('pm_user');
  }

  function isLoggedIn() {
    return !!PM.store.get('pm_token');
  }

  function logout() {
    PM.store.remove('pm_token');
    PM.store.remove('pm_user');
    window.location.href = '/';
  }

  /* ── Init ── */
  function init() {
    if (!modal) return;

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    // Close button
    closeBtn?.addEventListener('click', close);

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // Open triggers (any element with data-modal="signup" or "login")
    PM.$$('[data-modal]').forEach(el => {
      el.addEventListener('click', () => open(el.dataset.modal));
    });

    // View switchers inside modal
    PM.$$('[data-auth-view]', modal).forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        showView(el.dataset.authView);
      });
    });

    // Form submissions
    const signupForm = modal.querySelector('#signupView form');
    const loginForm  = modal.querySelector('#loginView form');

    signupForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSignup(signupForm);
    });

    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin(loginForm);
    });

    // Update nav CTA if already logged in
    if (isLoggedIn()) {
      const user = getCurrentUser();
      PM.$$('[data-modal="signup"], [data-modal="login"]').forEach(btn => {
        if (btn.closest('.nav__actions')) {
          btn.textContent = 'Dashboard';
          btn.removeAttribute('data-modal');
          btn.href = '/pages/dashboard.html';
          btn.tagName === 'BUTTON' && btn.setAttribute('onclick', "location.href='/pages/dashboard.html'");
        }
      });
    }
  }

  return { init, open, close, isLoggedIn, getCurrentUser, logout };
})();

document.addEventListener('DOMContentLoaded', () => Auth.init());
