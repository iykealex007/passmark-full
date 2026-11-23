/**
 * PASSMARK — nav.js
 * Navigation: scroll-detect, mobile drawer, smooth scroll.
 * Requires: utils.js
 * ─────────────────────────────────────────────────────────
 */

'use strict';

const Nav = (() => {
  const navEl    = document.getElementById('main-nav');
  const hamBtn   = document.querySelector('.nav__ham');
  const drawer   = document.querySelector('.nav__drawer');
  let   isOpen   = false;

  /* ── Scroll detection ── */
  function onScroll() {
    if (navEl) navEl.classList.toggle('nav--scrolled', window.scrollY > 30);
  }

  /* ── Mobile drawer ── */
  function openDrawer() {
    isOpen = true;
    drawer?.classList.add('nav__drawer--open');
    document.body.style.overflow = 'hidden';
    hamBtn?.setAttribute('aria-expanded', 'true');

    const spans = PM.$$('span', hamBtn);
    if (spans[0]) spans[0].style.cssText = 'transform: rotate(45deg) translate(5px,5px)';
    if (spans[1]) spans[1].style.cssText = 'opacity: 0';
    if (spans[2]) spans[2].style.cssText = 'transform: rotate(-45deg) translate(5px,-5px)';
  }

  function closeDrawer() {
    if (!isOpen) return;
    isOpen = false;
    drawer?.classList.remove('nav__drawer--open');
    document.body.style.overflow = '';
    hamBtn?.setAttribute('aria-expanded', 'false');
    PM.$$('span', hamBtn).forEach(s => s.removeAttribute('style'));
  }

  function toggleDrawer() {
    isOpen ? closeDrawer() : openDrawer();
  }

  /* ── Topbar dismissal ── */
  function initTopbar() {
    const bar = document.querySelector('.topbar');
    const closeBtn = document.querySelector('.topbar__close');
    if (!bar || !closeBtn) return;

    // Already dismissed this session?
    if (sessionStorage.getItem('pm_topbar_dismissed')) {
      bar.remove();
      return;
    }

    closeBtn.addEventListener('click', () => {
      bar.style.cssText = 'overflow:hidden;transition:all 0.3s ease;max-height:0;opacity:0;padding:0;border:none';
      setTimeout(() => bar.remove(), 340);
      sessionStorage.setItem('pm_topbar_dismissed', '1');
    });
  }

  /* ── Init ── */
  function init() {
    window.addEventListener('scroll', PM.throttle(onScroll, 60), { passive: true });
    onScroll(); // run immediately

    hamBtn?.addEventListener('click', toggleDrawer);

    // Close drawer when a link is clicked
    PM.$$('.nav__drawer-link', drawer).forEach(link => {
      link.addEventListener('click', closeDrawer);
    });

    // Close drawer on outside click
    document.addEventListener('click', (e) => {
      if (isOpen && !drawer?.contains(e.target) && !hamBtn?.contains(e.target)) {
        closeDrawer();
      }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeDrawer();
    });

    initTopbar();
    PM.initSmoothScroll(72);
  }

  return { init, closeDrawer };
})();

document.addEventListener('DOMContentLoaded', () => Nav.init());
