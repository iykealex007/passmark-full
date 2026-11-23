/**
 * PASSMARK — dashboard.js
 * Student dashboard page logic.
 * Requires: utils.js, auth.js
 * ─────────────────────────────────────────────────────────
 */

'use strict';

const Dashboard = (() => {

  async function loadStats() {
    try {
      const stats = await PM.apiRequest('/dashboard/stats');

      // Update stat cards
      const fields = {
        'stat-sessions':  stats.totalSessions,
        'stat-score':     stats.averageScore + '%',
        'stat-streak':    stats.currentStreak + ' days',
        'stat-questions': stats.totalAnswered
      };

      Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      });

    } catch (err) {
      console.warn('Stats load failed:', err.message);
    }
  }

  async function loadProgressBars() {
    try {
      const data = await PM.apiRequest('/dashboard/progress');
      const container = document.getElementById('progress-bars');
      if (!container || !data.subjects) return;

      container.innerHTML = data.subjects.map(sub => `
        <div class="progress-bar" data-progress="${sub.score}">
          <div class="progress-bar__header">
            <span class="progress-bar__label">${sub.name}</span>
            <span class="progress-bar__value">${sub.score}%</span>
          </div>
          <div class="progress-bar__track">
            <div class="progress-bar__fill" style="background:${sub.color || 'var(--teal)'}"></div>
          </div>
        </div>
      `).join('');

      PM.initProgressBars();

    } catch (err) {
      console.warn('Progress load failed:', err.message);
    }
  }

  async function loadRecentSessions() {
    try {
      const data = await PM.apiRequest('/sessions/recent?limit=6');
      const list = document.getElementById('session-list');
      if (!list || !data.sessions) return;

      list.innerHTML = data.sessions.map(s => {
        const scoreClass = s.score >= 70 ? 'good' : s.score >= 50 ? 'warn' : 'low';
        return `
          <div class="session-row">
            <div>
              <div class="session-row__exam">${s.exam.toUpperCase()} · ${s.subject || 'Mixed'}</div>
              <div class="session-row__date">${new Date(s.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="session-row__score session-row__score--${scoreClass}">${s.score}%</div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.warn('Sessions load failed:', err.message);
    }
  }

  async function loadStreakDays() {
    try {
      const data   = await PM.apiRequest('/dashboard/streak');
      const days   = document.getElementById('streak-days');
      if (!days || !data.week) return;

      const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      days.innerHTML = data.week.map((studied, i) => `
        <div class="streak-day streak-day--${studied === 'today' ? 'today' : studied ? 'done' : 'empty'}"
             title="${labels[i]}">${labels[i]}</div>
      `).join('');

    } catch (err) {
      console.warn('Streak load failed:', err.message);
    }
  }

  function renderUserHeader() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const greet = document.getElementById('user-greeting');
    const name  = document.getElementById('user-name');
    const plan  = document.getElementById('user-plan');
    const avatar = document.getElementById('user-avatar');

    if (greet)  greet.textContent  = getGreeting();
    if (name)   name.textContent   = user.name || 'Student';
    if (plan)   plan.textContent   = user.plan ? user.plan.toUpperCase() + ' plan' : 'Free trial';
    if (avatar) avatar.textContent = (user.name || 'S').charAt(0).toUpperCase();
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
  }

  async function init() {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/?login=1';
      return;
    }

    renderUserHeader();

    // Load all dashboard data in parallel
    await Promise.allSettled([
      loadStats(),
      loadProgressBars(),
      loadRecentSessions(),
      loadStreakDays()
    ]);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => Dashboard.init());
