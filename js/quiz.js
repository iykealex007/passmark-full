/**
 * PASSMARK — quiz.js
 * Full quiz engine for pages/quiz.html
 * Handles: question fetching, answer selection, timer, navigation, submission
 * Requires: utils.js, auth.js
 * ─────────────────────────────────────────────────────────
 */

'use strict';

const QuizEngine = (() => {

  /* ── State ── */
  let state = {
    sessionId:   null,
    exam:        null,
    subject:     null,
    questions:   [],
    current:     0,
    answers:     {},   // { questionId: optionId }
    flagged:     new Set(),
    timeLeft:    0,
    totalTime:   0,
    timerHandle: null,
    submitted:   false
  };

  /* ── DOM refs ── */
  const els = {
    progress:    document.getElementById('quiz-progress-fill'),
    progressTxt: document.getElementById('quiz-progress-text'),
    timer:       document.getElementById('quiz-timer'),
    questionNum: document.getElementById('question-number'),
    questionTag: document.getElementById('question-tag'),
    stem:        document.getElementById('question-stem'),
    options:     document.getElementById('question-options'),
    explanation: document.getElementById('quiz-explanation'),
    explanText:  document.getElementById('explanation-text'),
    prevBtn:     document.getElementById('btn-prev'),
    nextBtn:     document.getElementById('btn-next'),
    submitBtn:   document.getElementById('btn-submit'),
    flagBtn:     document.getElementById('btn-flag')
  };

  /* ── URL params ── */
  function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      exam:      params.get('exam')    || 'waec',
      subject:   params.get('subject') || null,
      mode:      params.get('mode')    || 'practice',  // practice | mock | review
      sessionId: params.get('session') || null,
      limit:     parseInt(params.get('limit')) || 40
    };
  }

  /* ── Start session ── */
  async function startSession() {
    const params = getParams();

    try {
      const response = await PM.apiRequest('/sessions/start', {
        method: 'POST',
        body: {
          exam:    params.exam,
          subject: params.subject,
          mode:    params.mode,
          limit:   params.limit
        }
      });

      state.sessionId = response.sessionId;
      state.exam      = params.exam;
      state.subject   = params.subject;
      state.questions = response.questions;
      state.timeLeft  = response.timeLimit; // seconds
      state.totalTime = response.timeLimit;

      renderQuestion(0);
      startTimer();

    } catch (err) {
      PM.showToast('Failed to load questions. Please try again.', 'error');
      console.error('Session start failed:', err);
    }
  }

  /* ── Render question ── */
  function renderQuestion(index) {
    const q = state.questions[index];
    if (!q) return;

    state.current = index;

    // Meta
    if (els.questionNum) els.questionNum.textContent = `Question ${index + 1} of ${state.questions.length}`;
    if (els.questionTag) els.questionTag.textContent = `${state.exam?.toUpperCase()} · ${q.subject || ''} ${q.year ? '· ' + q.year : ''}`;
    if (els.stem)        els.stem.textContent = q.question_text;

    // Progress
    const pct = ((index + 1) / state.questions.length) * 100;
    if (els.progress)    els.progress.style.width = pct + '%';
    if (els.progressTxt) els.progressTxt.textContent = `${index + 1} / ${state.questions.length}`;

    // Options
    if (els.options) {
      els.options.innerHTML = '';
      q.options.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'quiz-option';
        div.dataset.optionId = opt.id;

        // Already answered?
        if (state.answers[q.id] === opt.id) {
          div.classList.add('quiz-option--selected');
        }

        div.innerHTML = `
          <span class="quiz-option__letter">${opt.letter}</span>
          <span class="quiz-option__text">${opt.text}</span>
        `;

        div.addEventListener('click', () => selectAnswer(q.id, opt.id, div));
        els.options.appendChild(div);
      });
    }

    // Explanation (only in review mode)
    if (els.explanation) {
      if (getParams().mode === 'review' && q.explanation) {
        els.explanText.textContent = q.explanation;
        els.explanation.classList.add('quiz-explanation--visible');
      } else {
        els.explanation.classList.remove('quiz-explanation--visible');
      }
    }

    // Navigation buttons
    if (els.prevBtn) els.prevBtn.disabled = index === 0;
    if (els.nextBtn) els.nextBtn.textContent = index === state.questions.length - 1 ? 'Review' : 'Next →';
    if (els.submitBtn) els.submitBtn.style.display = index === state.questions.length - 1 ? 'flex' : 'none';

    // Flag state
    updateFlagButton();

    // Scroll to top of question
    document.querySelector('.quiz-body')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── Select answer ── */
  function selectAnswer(questionId, optionId, clickedEl) {
    if (state.submitted) return;

    // Update state
    state.answers[questionId] = optionId;

    // Update UI
    PM.$$('.quiz-option', els.options).forEach(opt => {
      opt.classList.remove('quiz-option--selected');
    });
    clickedEl.classList.add('quiz-option--selected');
  }

  /* ── Navigation ── */
  function goNext() {
    if (state.current < state.questions.length - 1) {
      renderQuestion(state.current + 1);
    }
  }

  function goPrev() {
    if (state.current > 0) {
      renderQuestion(state.current - 1);
    }
  }

  /* ── Flag question ── */
  function toggleFlag() {
    const qId = state.questions[state.current]?.id;
    if (!qId) return;

    if (state.flagged.has(qId)) {
      state.flagged.delete(qId);
    } else {
      state.flagged.add(qId);
    }

    updateFlagButton();
  }

  function updateFlagButton() {
    const qId = state.questions[state.current]?.id;
    if (!els.flagBtn || !qId) return;
    els.flagBtn.classList.toggle('quiz-flag-btn--flagged', state.flagged.has(qId));
    els.flagBtn.textContent = state.flagged.has(qId) ? '🚩 Flagged' : '⚑ Flag';
  }

  /* ── Timer ── */
  function startTimer() {
    if (!els.timer) return;

    state.timerHandle = setInterval(() => {
      state.timeLeft--;
      updateTimerDisplay();

      if (state.timeLeft <= 0) {
        clearInterval(state.timerHandle);
        submitSession(true); // auto-submit
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!els.timer) return;

    const mins = Math.floor(state.timeLeft / 60);
    const secs = state.timeLeft % 60;
    els.timer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const pct = state.timeLeft / state.totalTime;
    els.timer.className = 'quiz-timer';
    if (pct <= 0.10) els.timer.classList.add('quiz-timer--danger');
    else if (pct <= 0.25) els.timer.classList.add('quiz-timer--warning');
  }

  /* ── Submit ── */
  async function submitSession(autoSubmit = false) {
    if (state.submitted) return;

    const unanswered = state.questions.filter(q => !state.answers[q.id]).length;

    if (!autoSubmit && unanswered > 0) {
      const confirmed = window.confirm(
        `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`
      );
      if (!confirmed) return;
    }

    clearInterval(state.timerHandle);
    state.submitted = true;

    if (els.submitBtn) {
      els.submitBtn.textContent = 'Submitting…';
      els.submitBtn.disabled    = true;
    }

    try {
      const response = await PM.apiRequest('/sessions/submit', {
        method: 'POST',
        body: {
          sessionId: state.sessionId,
          answers:   state.answers,
          flagged:   [...state.flagged],
          timeUsed:  state.totalTime - state.timeLeft
        }
      });

      // Redirect to results page
      window.location.href = `/pages/results.html?session=${state.sessionId}`;

    } catch (err) {
      state.submitted = false;
      if (els.submitBtn) {
        els.submitBtn.textContent = 'Submit Exam';
        els.submitBtn.disabled    = false;
      }
      PM.showToast('Submission failed. Please try again.', 'error');
    }
  }

  /* ── Bind events ── */
  function bindEvents() {
    els.nextBtn?.addEventListener('click', goNext);
    els.prevBtn?.addEventListener('click', goPrev);
    els.submitBtn?.addEventListener('click', () => submitSession(false));
    els.flagBtn?.addEventListener('click', toggleFlag);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'f' || e.key === 'F') toggleFlag();
      if (e.key >= '1' && e.key <= '4') {
        const opts = PM.$$('.quiz-option', els.options);
        opts[parseInt(e.key) - 1]?.click();
      }
    });

    // Warn before leaving
    window.addEventListener('beforeunload', (e) => {
      if (!state.submitted && Object.keys(state.answers).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  /* ── Init ── */
  async function init() {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/?login=1';
      return;
    }

    bindEvents();
    await startSession();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => QuizEngine.init());
