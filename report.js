// ChatGPT Memory Extractor - Report Page v1.0

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await loadData();
});

// ========== NAVIGATION ==========
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Update nav
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Show section
      const sectionId = item.dataset.section;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById('section-' + sectionId).classList.add('active');
    });
  });

  // Export buttons
  document.getElementById('exportPdf').addEventListener('click', exportPdf);
  document.getElementById('exportJson').addEventListener('click', exportJson);
}

// ========== LOAD DATA ==========
async function loadData() {
  try {
    // Get analysis results from storage
    const results = await chrome.runtime.sendMessage({ action: 'getAnalysisResults' });
    const memories = await chrome.runtime.sendMessage({ action: 'getMemories' });

    if (!results) {
      showEmptyState();
      return;
    }

    // Update sidebar stats
    document.getElementById('totalMemories').textContent = results.memoriesCount || memories.length || '-';
    document.getElementById('totalLabels').textContent = results.statistics?.topLabels?.length || '-';

    // Update header
    if (results.timestamp) {
      const date = new Date(results.timestamp);
      document.getElementById('analysisDate').innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${date.toLocaleDateString('fr-FR')}
      `;
      document.getElementById('analysisTime').innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        Analyse en ${Math.round((results.totalTime || 0) / 1000)}s
      `;
    }

    // Render sections
    renderProfile(results.profile);
    renderInsights(results.insights);
    renderStats(results.statistics);
    renderMemories(memories, results.labels);

  } catch (e) {
    console.error('Error loading data:', e);
    showEmptyState();
  }
}

// ========== RENDER PROFILE ==========
function renderProfile(profile) {
  const container = document.getElementById('profileContent');

  if (!profile) {
    container.innerHTML = '<p style="color: var(--text-muted);">Aucun portrait disponible. Lancez une analyse d\'abord.</p>';
    return;
  }

  // Convert markdown-like headers to HTML
  let html = profile
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  html = '<p>' + html + '</p>';

  container.innerHTML = html;
}

// ========== RENDER INSIGHTS ==========
function renderInsights(insights) {
  const container = document.getElementById('insightsContent');

  if (!insights) {
    container.innerHTML = '<p style="color: var(--text-muted);">Aucun insight disponible.</p>';
    return;
  }

  // Parse insights into cards
  const sections = insights.split(/^## /gm).filter(Boolean);

  let html = '';
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const title = lines[0];
    const content = lines.slice(1).join('\n');

    html += `
      <div class="insight-card">
        <h3>${title}</h3>
        <p>${content.replace(/\n/g, '<br>')}</p>
      </div>
    `;
  });

  container.innerHTML = html || '<p style="color: var(--text-muted);">Aucun insight trouvé.</p>';
}

// ========== RENDER STATS ==========
function renderStats(statistics) {
  if (!statistics) return;

  // Stats grid
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${statistics.totalLabeled || 0}</div>
      <div class="stat-label">Souvenirs labélisés</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${Object.keys(statistics.labelFrequency || {}).length}</div>
      <div class="stat-label">Labels uniques</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${statistics.topLabels?.[0]?.label || '-'}</div>
      <div class="stat-label">Label dominant</div>
    </div>
  `;

  // Labels chart
  const chart = document.getElementById('labelsChart');
  const maxCount = statistics.topLabels?.[0]?.count || 1;

  let chartHtml = '';
  (statistics.topLabels || []).forEach(item => {
    const width = (item.count / maxCount) * 100;
    chartHtml += `
      <div class="label-bar">
        <div class="label-header">
          <span class="label-name">${item.label}</span>
          <span class="label-count">${item.count} (${item.percent}%)</span>
        </div>
        <div class="label-track">
          <div class="label-fill" style="width: ${width}%"></div>
        </div>
      </div>
    `;
  });

  chart.innerHTML = chartHtml || '<p style="color: var(--text-muted);">Aucune statistique disponible.</p>';

  // Co-occurrences
  const coOcc = document.getElementById('coOccurrences');
  let coOccHtml = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';
  (statistics.topCoOccurrences || []).forEach(item => {
    coOccHtml += `
      <span style="
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.2);
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 13px;
      ">
        ${item.pair} <span style="color: var(--text-muted);">(${item.count})</span>
      </span>
    `;
  });
  coOccHtml += '</div>';
  coOcc.innerHTML = coOccHtml;
}

// ========== RENDER MEMORIES ==========
function renderMemories(memories, labels) {
  const container = document.getElementById('memoriesList');

  if (!memories || memories.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted);">Aucun souvenir trouvé.</p>';
    return;
  }

  // Create a map of labels by memory ID
  const labelsMap = {};
  (labels || []).forEach(item => {
    labelsMap[item.memoryId] = item.labels || [];
  });

  let html = '';
  memories.forEach((memory, index) => {
    const memLabels = labelsMap[index] || [];

    html += `
      <div class="memory-item">
        <div class="memory-text">${escapeHtml(memory.text)}</div>
        <div class="memory-labels">
          ${memLabels.map(l => `<span class="memory-label">${l}</span>`).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ========== EXPORT ==========
function exportPdf() {
  // Simple print-to-PDF
  window.print();
}

async function exportJson() {
  try {
    const results = await chrome.runtime.sendMessage({ action: 'getAnalysisResults' });
    const memories = await chrome.runtime.sendMessage({ action: 'getMemories' });

    const data = {
      exportDate: new Date().toISOString(),
      memories,
      analysis: results
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-analysis-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Export error:', e);
    alert('Erreur lors de l\'export');
  }
}

// ========== EMPTY STATE ==========
function showEmptyState() {
  const content = document.querySelector('.main');
  content.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      <h3>Aucune analyse disponible</h3>
      <p>Extrayez vos souvenirs ChatGPT puis lancez une analyse pour voir le rapport.</p>
      <button class="btn btn-primary" style="margin-top: 20px;" onclick="window.close()">
        Retour à l'extension
      </button>
    </div>
  `;
}

// ========== HELPERS ==========
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
