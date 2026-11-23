/**
 * PASSMARK — results.js
 * Results page: load session results, render review, filter.
 * Requires: utils.js, auth.js
 * ─────────────────────────────────────────────────────────
 */

'use strict';

const Results = (() => {

  let session = null;

  function getSessionId() {
    return new URLSearchParams(window.location.search).get('session');
  }

  async function load() {
    const sessionId = getSessionId();
    if (!sessionId) {
      window.location.href = 'dashboard.html'; return;
    }

    try {
      session = await PM.apiRequest(`/sessions/${sessionId}/results`);
      renderHero();
      renderBreakdown();
      renderReview(session.questions);
    } catch (err) {
      PM.showToast('Failed to load results. Redirecting…', 'error');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
    }
  }

  function renderHero() {
    const score   = session.score || 0;
    const ring    = document.getElementById('score-ring');
    const valEl   = document.getElementById('score-value');
    const verdict = document.getElementById('results-verdict');
    const sub     = document.getElementById('results-subtext');
    const examLbl = document.getElementById('results-exam-label');

    if (examLbl) examLbl.textContent =
      [session.exam?.toUpperCase(), session.subject, session.year].filter(Boolean).join(' · ');

    if (valEl) valEl.textContent = score + '%';

    if (ring) {
      const deg   = (score / 100) * 360;
      const color = score >= 70 ? 'var(--teal)' : score >= 50 ? 'var(--gold-2)' : 'var(--rose)';
      ring.style.background =
        `conic-gradient(${color} ${deg}deg, rgba(255,255,255,0.1) ${deg}deg)`;
    }

    if (verdict) {
      if (score >= 80)      verdict.textContent = '🎉 Excellent work!';
      else if (score >= 70) verdict.textContent = '✅ Good pass!';
      else if (score >= 50) verdict.textContent = '📈 Keep practising';
      else                  verdict.textContent = '📚 More work needed';
    }

    if (sub) {
      sub.textContent =
        `${session.correctCount} correct · ${session.wrongCount} wrong · ` +
        `${session.unansweredCount} unanswered`;
    }
  }

  function renderBreakdown() {
    const mins = Math.floor((session.timeUsed || 0) / 60);
    const secs = (session.timeUsed || 0) % 60;

    PM.$('#stat-correct')    && (PM.$('#stat-correct').textContent    = session.correctCount    || '—');
    PM.$('#stat-wrong')      && (PM.$('#stat-wrong').textContent      = session.wrongCount      || '—');
    PM.$('#stat-unanswered') && (PM.$('#stat-unanswered').textContent = session.unansweredCount || '—');
    PM.$('#stat-time')       && (PM.$('#stat-time').textContent       = `${mins}m ${secs}s`);
  }

  function renderReview(questions, filter = 'all') {
    const list = document.getElementById('review-list');
    if (!list || !questions) return;

    let filtered = questions;
    if (filter === 'wrong')   filtered = questions.filter(q => !q.correct);
    if (filter === 'flagged') filtered = questions.filter(q => q.flagged);

    if (!filtered.length) {
      list.innerHTML = `<p style="color:var(--mist);padding:20px 0;">No questions match this filter.</p>`;
      return;
    }

    list.innerHTML = filtered.map((q, i) => {
      const isCorrect = q.correct;
      const borderColor = isCorrect ? 'var(--teal)' : 'var(--rose)';
      const icon        = isCorrect ? '✅' : '❌';

      return `
        <div style="background:var(--white);border:1.5px solid var(--cloud);border-left:4px solid ${borderColor};border-radius:12px;padding:22px 24px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
            <span style="background:var(--cloud);padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:700;color:var(--slate);">
              Q${i+1}
            </span>
            <span style="font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--mist);">
              ${q.exam?.toUpperCase()} · ${q.subject || ''}
            </span>
            <span style="margin-left:auto;">${icon}</span>
          </div>

          <p style="font-size:1rem;font-weight:600;color:var(--navy);line-height:1.6;margin-bottom:16px;">
            ${q.question_text}
          </p>

          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
            ${q.options.map(opt => {
              let bg = 'var(--off)'; let border = 'var(--cloud)'; let color = 'var(--slate)';
              if (opt.letter === q.correctAnswer) { bg='rgba(0,123,104,0.08)'; border='var(--teal)'; color='var(--teal-dark)'; }
              if (opt.letter === q.selectedAnswer && opt.letter !== q.correctAnswer) {
                bg='rgba(204,42,42,0.08)'; border='var(--rose)'; color='var(--rose)';
              }
              return `
                <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;background:${bg};border:1.5px solid ${border};border-radius:8px;">
                  <span style="width:26px;height:26px;border-radius:6px;background:${border};color:white;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;flex-shrink:0;">${opt.letter}</span>
                  <span style="font-size:0.875rem;color:${color};">${opt.text}</span>
                </div>
              `;
            }).join('')}
          </div>

          ${q.explanation ? `
            <div style="background:var(--teal-pale);border-radius:8px;padding:14px 16px;">
              <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--teal);margin-bottom:6px;">💡 Explanation</div>
              <p style="font-size:0.875rem;color:var(--slate);line-height:1.72;">${q.explanation}</p>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  function initFilters() {
    PM.$('#filter-all')?.addEventListener('click', () => {
      updateFilterBtns('all');
      renderReview(session?.questions, 'all');
    });
    PM.$('#filter-wrong')?.addEventListener('click', () => {
      updateFilterBtns('wrong');
      renderReview(session?.questions, 'wrong');
    });
    PM.$('#filter-flagged')?.addEventListener('click', () => {
      updateFilterBtns('flagged');
      renderReview(session?.questions, 'flagged');
    });
  }

  function updateFilterBtns(active) {
    PM.$$('#filter-all, #filter-wrong, #filter-flagged').forEach(btn => {
      btn.classList.toggle('btn--navy', btn.id === `filter-${active}`);
      btn.classList.toggle('btn--outline', btn.id !== `filter-${active}`);
    });
  }

  function init() {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/?login=1'; return;
    }
    initFilters();
    load();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => Results.init());
