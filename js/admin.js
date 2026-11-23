/**
 * PASSMARK — admin.js
 * Admin panel page logic.
 * Requires: utils.js, auth.js
 * ─────────────────────────────────────────────────────────
 */

'use strict';

/* ── Section routing ── */
function showSection(name) {
  PM.$$('[id^="section-"]').forEach(s => s.style.display = 'none');
  const target = document.getElementById(`section-${name}`);
  if (target) target.style.display = 'block';

  PM.$$('.sidebar__link[data-section]').forEach(l => {
    l.classList.toggle('sidebar__link--active', l.dataset.section === name);
  });
}

PM.$$('.sidebar__link[data-section]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});


/* ── Questions Table ── */
const QuestionsAdmin = (() => {
  let page = 1;
  const limit = 20;

  async function loadStats() {
    try {
      const stats = await PM.apiRequest('/admin/questions/stats');
      PM.$('#q-total')  && (PM.$('#q-total').textContent   = stats.total?.toLocaleString() || '—');
      PM.$('#q-school') && (PM.$('#q-school').textContent  = stats.school?.toLocaleString() || '—');
      PM.$('#q-nursing')&& (PM.$('#q-nursing').textContent = stats.nursing?.toLocaleString() || '—');
      PM.$('#q-medical')&& (PM.$('#q-medical').textContent = stats.medical?.toLocaleString() || '—');
    } catch (e) { console.warn('Stats failed:', e.message); }
  }

  async function loadTable() {
    const exam       = PM.$('#filter-exam')?.value       || '';
    const difficulty = PM.$('#filter-difficulty')?.value || '';
    const search     = PM.$('#search-questions')?.value  || '';
    const tbody      = PM.$('#questions-tbody');

    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--mist);">Loading…</td></tr>`;
    }

    try {
      const params  = new URLSearchParams({ page, limit, exam, difficulty, search });
      const data    = await PM.apiRequest(`/admin/questions?${params}`);
      const rows    = data.questions || [];
      const total   = data.total || 0;

      const info = PM.$('#pagination-info');
      if (info) info.textContent = `Showing ${((page-1)*limit)+1}–${Math.min(page*limit, total)} of ${total.toLocaleString()}`;

      if (!tbody) return;

      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--mist);">No questions found</td></tr>`;
        return;
      }

      tbody.innerHTML = rows.map((q, i) => `
        <tr>
          <td style="color:var(--mist);font-family:var(--font-mono);font-size:0.75rem;">${((page-1)*limit)+i+1}</td>
          <td style="max-width:320px;">
            <div style="font-size:0.84rem;color:var(--navy);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${q.question_text?.substring(0, 80)}…
            </div>
          </td>
          <td><span class="badge badge--teal">${q.exam?.toUpperCase()}</span></td>
          <td style="font-size:0.84rem;color:var(--slate);">${q.subject || '—'}</td>
          <td style="font-family:var(--font-mono);font-size:0.78rem;color:var(--mist);">${q.year || '—'}</td>
          <td>
            <span class="badge ${q.difficulty === 'easy' ? 'badge--green' : q.difficulty === 'hard' || q.difficulty === 'very-hard' ? 'badge--rose' : 'badge--gold'}">
              ${q.difficulty || '—'}
            </span>
          </td>
          <td><span class="status-dot ${q.published ? 'status-dot--active' : 'status-dot--inactive'}">${q.published ? 'Live' : 'Draft'}</span></td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn--outline btn--sm" onclick="editQuestion('${q.id}')">Edit</button>
              <button class="btn btn--danger btn--sm"  onclick="deleteQuestion('${q.id}')">Del</button>
            </div>
          </td>
        </tr>
      `).join('');

    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--rose);">Failed to load: ${err.message}</td></tr>`;
    }
  }

  function init() {
    loadStats();
    loadTable();

    PM.$('#btn-search-questions')?.addEventListener('click', () => { page = 1; loadTable(); });
    PM.$('#search-questions')?.addEventListener('keypress', e => { if(e.key==='Enter') { page=1; loadTable(); } });
    PM.$('#filter-exam')?.addEventListener('change', () => { page=1; loadTable(); });
    PM.$('#filter-difficulty')?.addEventListener('change', () => { page=1; loadTable(); });
    PM.$('#btn-prev-page')?.addEventListener('click', () => { if(page>1) { page--; loadTable(); } });
    PM.$('#btn-next-page')?.addEventListener('click', () => { page++; loadTable(); });
  }

  return { init };
})();

window.editQuestion   = (id) => PM.showToast(`Edit question ${id} — coming soon`);
window.deleteQuestion = (id) => {
  if (confirm('Delete this question? This cannot be undone.')) {
    PM.apiRequest(`/admin/questions/${id}`, { method: 'DELETE' })
      .then(() => { PM.showToast('Question deleted', 'success'); QuestionsAdmin.init(); })
      .catch(err => PM.showToast('Delete failed: ' + err.message, 'error'));
  }
};


/* ── CSV Import ── */
const CSVImport = (() => {

  let selectedFile = null;

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function log(message, type = 'default') {
    const logEl = PM.$('#import-log');
    if (!logEl) return;
    const line = document.createElement('div');
    line.className = `import-log__line--${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function init() {
    const zone    = PM.$('#upload-zone');
    const fileIn  = PM.$('#csv-file-input');
    const selDiv  = PM.$('#file-selected');
    const importBtn = PM.$('#btn-import');

    if (!zone || !fileIn) return;

    function handleFile(file) {
      if (!file || !file.name.endsWith('.csv')) {
        PM.showToast('Please select a .csv file', 'error'); return;
      }
      selectedFile = file;
      PM.$('#file-name').textContent = file.name;
      PM.$('#file-size').textContent = formatBytes(file.size);
      if (selDiv) selDiv.style.display = 'block';
      if (importBtn) importBtn.disabled = false;
      log(`File selected: ${file.name} (${formatBytes(file.size)})`);
    }

    fileIn.addEventListener('change', e => handleFile(e.target.files[0]));

    // Drag and drop
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('upload-zone--drag-over'); });
    zone.addEventListener('dragleave',  () => zone.classList.remove('upload-zone--drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('upload-zone--drag-over');
      handleFile(e.dataTransfer.files[0]);
    });

    importBtn?.addEventListener('click', async () => {
      if (!selectedFile) return;
      log('Starting import…');
      importBtn.disabled = true;
      importBtn.textContent = 'Importing…';

      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('exam',              PM.$('#import-exam')?.value || '');
        formData.append('skipDuplicates',    PM.$('#skip-duplicates')?.checked ? '1' : '0');
        formData.append('publishImmediately',PM.$('#publish-immediately')?.checked ? '1' : '0');

        const token = PM.store.get('pm_token');
        const res   = await fetch('/api/admin/questions/import', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Import failed');

        log(`✓ Imported: ${data.imported}`, 'ok');
        log(`✓ Skipped (duplicates): ${data.skipped}`, 'ok');
        if (data.errors?.length) {
          data.errors.forEach(e => log(`✗ Row ${e.row}: ${e.message}`, 'err'));
        }
        log('Import complete.', 'ok');
        PM.showToast(`Imported ${data.imported} questions`, 'success');

      } catch (err) {
        log(`✗ Error: ${err.message}`, 'err');
        PM.showToast('Import failed: ' + err.message, 'error');
      } finally {
        importBtn.disabled = false;
        importBtn.textContent = 'Import Questions';
      }
    });
  }

  return { init };
})();


/* ── Users table ── */
const UsersAdmin = (() => {
  async function loadTable() {
    const tbody  = PM.$('#users-tbody');
    const search = PM.$('#search-users')?.value || '';
    const plan   = PM.$('#filter-user-plan')?.value || '';

    try {
      const params = new URLSearchParams({ search, plan, limit: 20 });
      const data   = await PM.apiRequest(`/admin/users?${params}`);
      const users  = data.users || [];

      if (!tbody) return;
      if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--mist);">No users found</td></tr>`;
        return;
      }

      tbody.innerHTML = users.map(u => `
        <tr>
          <td style="font-weight:600;color:var(--navy);">${u.name || '—'}</td>
          <td style="font-size:0.84rem;color:var(--slate);">${u.email}</td>
          <td><span class="badge ${u.plan === 'bundle' ? 'badge--gold' : u.plan === 'free' || !u.plan ? '' : 'badge--teal'}">${(u.plan || 'free').toUpperCase()}</span></td>
          <td style="font-size:0.78rem;color:var(--mist);">${new Date(u.createdAt).toLocaleDateString()}</td>
          <td style="font-size:0.78rem;color:var(--mist);">${u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '—'}</td>
          <td style="font-family:var(--font-mono);font-size:0.84rem;">${u.totalSessions || 0}</td>
          <td><span class="status-dot ${u.active ? 'status-dot--active' : 'status-dot--inactive'}">${u.active ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button class="btn btn--outline btn--sm" onclick="viewUser('${u.id}')">View</button>
          </td>
        </tr>
      `).join('');

    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--rose);">Error: ${err.message}</td></tr>`;
    }
  }

  function init() {
    loadTable();
    PM.$('#btn-search-users')?.addEventListener('click', loadTable);
    PM.$('#search-users')?.addEventListener('keypress', e => { if(e.key==='Enter') loadTable(); });
    PM.$('#filter-user-plan')?.addEventListener('change', loadTable);
  }

  return { init };
})();

window.viewUser = (id) => PM.showToast(`View user ${id} — coming soon`);


/* ── Overview stats ── */
async function loadOverview() {
  try {
    const data = await PM.apiRequest('/admin/overview');
    PM.$('#overview-users')   && (PM.$('#overview-users').textContent   = data.totalUsers?.toLocaleString()  || '—');
    PM.$('#overview-subs')    && (PM.$('#overview-subs').textContent    = data.activeSubscribers?.toLocaleString() || '—');
    PM.$('#overview-sessions')&& (PM.$('#overview-sessions').textContent= data.sessionsToday?.toLocaleString() || '—');
    PM.$('#overview-revenue') && (PM.$('#overview-revenue').textContent = PM.formatNaira(data.monthRevenue || 0));
  } catch(e) { console.warn('Overview failed:', e.message); }
}


/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/?login=1'; return;
  }

  // Show default section
  showSection('questions');

  QuestionsAdmin.init();
  CSVImport.init();
  UsersAdmin.init();
  loadOverview();
});
