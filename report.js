// ChatGPT Memory Extractor - Report Page v2.0
// With progressive reveal animations

// ========== STATE ==========
let analysisResults = null;
let memories = [];
let isLive = false;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupExport();
  await loadData();
  listenForUpdates();
});

// ========== NAVIGATION ==========
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const sectionId = item.dataset.section;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById('section-' + sectionId).classList.add('active');
    });
  });
}

function setupExport() {
  document.getElementById('exportJson').addEventListener('click', exportJson);
}

// ========== LOAD DATA ==========
async function loadData() {
  try {
    analysisResults = await chrome.runtime.sendMessage({ action: 'getAnalysisResults' });
    memories = await chrome.runtime.sendMessage({ action: 'getMemories' }) || [];

    if (analysisResults && analysisResults.success) {
      // Data exists, reveal everything
      revealAllData(analysisResults, memories);
    } else if (memories.length > 0) {
      // Memories exist but no analysis - show memories count
      document.getElementById('totalMemories').textContent = memories.length;
      document.getElementById('stat-memories').classList.add('reveal');
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
}

// ========== LISTEN FOR LIVE UPDATES ==========
function listenForUpdates() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'analysisProgress':
        handleProgress(request);
        break;

      case 'analysisComplete':
        handleComplete(request.results);
        break;
    }
  });
}

// ========== PROGRESS HANDLER ==========
function handleProgress(data) {
  isLive = true;
  const { stage, progress, message } = data;

  // Trigger light trace effect
  triggerLightTrace();

  // Update agent indicators
  switch (stage) {
    case 'labeling':
      setAgentState('librarian', 'loading', `Labélisation: ${Math.round(progress)}%`);
      setNavState('memories', 'loading');
      break;

    case 'statistics':
      setAgentState('librarian', 'complete', 'Labélisation terminée');
      setAgentState('statistician', 'loading', 'Calcul des statistiques...');
      setNavState('memories', 'complete');
      setNavState('stats', 'loading');
      break;

    case 'profiling':
      setAgentState('statistician', 'complete', 'Statistiques calculées');
      setAgentState('profiler', 'loading', 'Rédaction du portrait...');
      setNavState('stats', 'complete');
      setNavState('profile', 'loading');
      break;

    case 'insights':
      setAgentState('profiler', 'complete', 'Portrait terminé');
      setAgentState('detective', 'loading', 'Recherche de patterns...');
      setNavState('profile', 'complete');
      setNavState('insights', 'loading');
      break;
  }
}

// ========== COMPLETE HANDLER ==========
function handleComplete(results) {
  if (!results.success) {
    console.error('Analysis failed:', results.error);
    return;
  }

  // Final light trace
  triggerLightTrace();

  // Mark all agents complete
  setAgentState('librarian', 'complete', 'Labélisation terminée');
  setAgentState('statistician', 'complete', 'Statistiques calculées');
  setAgentState('profiler', 'complete', 'Portrait terminé');
  setAgentState('detective', 'complete', 'Analyse terminée');

  // Mark all nav items complete
  setNavState('memories', 'complete');
  setNavState('stats', 'complete');
  setNavState('profile', 'complete');
  setNavState('insights', 'complete');

  // Reveal all data with staggered animations
  revealAllData(results, memories);
}

// ========== REVEAL DATA ==========
function revealAllData(results, memories) {
  // Update header
  if (results.timestamp) {
    const date = new Date(results.timestamp);
    document.getElementById('analysisDate').textContent = date.toLocaleDateString('fr-FR');
    document.getElementById('analysisTime').textContent = `Analyse en ${Math.round((results.totalTime || 0) / 1000)}s`;
  }

  // Sidebar stats
  setTimeout(() => {
    document.getElementById('totalMemories').textContent = results.memoriesCount || memories.length;
    document.getElementById('stat-memories').classList.add('reveal');
  }, 200);

  setTimeout(() => {
    document.getElementById('totalLabels').textContent = results.statistics?.topLabels?.length || '—';
    document.getElementById('stat-labels').classList.add('reveal');
  }, 400);

  // Reveal profile
  setTimeout(() => {
    renderProfile(results.profile);
    revealCard('card-profile');
    setAgentState('profiler', 'complete', 'Portrait terminé');
  }, 600);

  // Reveal insights
  setTimeout(() => {
    renderInsights(results.insights);
    revealCard('card-insights');
    setAgentState('detective', 'complete', 'Analyse terminée');
  }, 1000);

  // Reveal stats
  setTimeout(() => {
    renderStats(results.statistics);
    setAgentState('statistician', 'complete', 'Statistiques calculées');
  }, 1400);

  // Reveal memories
  setTimeout(() => {
    renderMemories(memories, results.labels);
    revealCard('card-memories');
    setAgentState('librarian', 'complete', 'Labélisation terminée');
  }, 1800);
}

// ========== RENDER FUNCTIONS ==========
function renderProfile(profile) {
  const container = document.getElementById('profileContent');

  if (!profile) {
    container.innerHTML = '<p style="color: var(--text-muted);">Aucun portrait disponible.</p>';
    return;
  }

  let html = profile
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  html = '<p>' + html + '</p>';
  container.innerHTML = html;
}

function renderInsights(insights) {
  const container = document.getElementById('insightsContent');

  if (!insights) {
    container.innerHTML = '<p style="color: var(--text-muted);">Aucun insight disponible.</p>';
    return;
  }

  const sections = insights.split(/^## /gm).filter(Boolean);

  let html = '';
  sections.forEach((section, index) => {
    const lines = section.trim().split('\n');
    const title = lines[0];
    const content = lines.slice(1).join('\n');

    html += `
      <div class="insight-card" style="animation-delay: ${index * 0.15}s; opacity: 0; animation: fadeInUp 0.5s ease forwards ${index * 0.15}s;">
        <h3>${escapeHtml(title)}</h3>
        <p>${content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>
      </div>
    `;
  });

  container.innerHTML = html || '<p style="color: var(--text-muted);">Aucun insight trouvé.</p>';
}

function renderStats(statistics) {
  if (!statistics) return;

  // Stats grid with reveal
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = `
    <div class="stat-card" style="animation: cardReveal 0.5s ease forwards;">
      <div class="stat-value">${statistics.totalLabeled || 0}</div>
      <div class="stat-label">Souvenirs labélisés</div>
    </div>
    <div class="stat-card" style="animation: cardReveal 0.5s ease forwards 0.1s;">
      <div class="stat-value">${Object.keys(statistics.labelFrequency || {}).length}</div>
      <div class="stat-label">Labels uniques</div>
    </div>
    <div class="stat-card" style="animation: cardReveal 0.5s ease forwards 0.2s;">
      <div class="stat-value">${statistics.topLabels?.[0]?.label || '—'}</div>
      <div class="stat-label">Label dominant</div>
    </div>
  `;

  // Labels chart
  const chart = document.getElementById('labelsChart');
  const maxCount = statistics.topLabels?.[0]?.count || 1;

  let chartHtml = '';
  (statistics.topLabels || []).slice(0, 10).forEach((item, index) => {
    const width = (item.count / maxCount) * 100;
    chartHtml += `
      <div class="label-bar revealed" style="animation-delay: ${index * 0.05}s;">
        <div class="label-header">
          <span class="label-name">${escapeHtml(item.label)}</span>
          <span class="label-count">${item.count} (${item.percent}%)</span>
        </div>
        <div class="label-track">
          <div class="label-fill" style="width: ${width}%; transition-delay: ${index * 0.05}s;"></div>
        </div>
      </div>
    `;
  });

  chart.innerHTML = chartHtml || '<p style="color: var(--text-muted);">Aucune statistique.</p>';

  // Reveal the card
  revealCard('card-labels');
}

function renderMemories(memories, labels) {
  const container = document.getElementById('memoriesList');

  if (!memories || memories.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted);">Aucun souvenir.</p>';
    return;
  }

  const labelsMap = {};
  (labels || []).forEach(item => {
    labelsMap[item.memoryId] = item.labels || [];
  });

  let html = '';
  memories.slice(0, 50).forEach((memory, index) => {
    const memLabels = labelsMap[index] || [];
    const delay = Math.min(index * 0.03, 1.5);

    html += `
      <div class="memory-item revealed" style="animation-delay: ${delay}s;">
        <div class="memory-text">${escapeHtml(memory.text)}</div>
        <div class="memory-labels">
          ${memLabels.map(l => `<span class="memory-label">${escapeHtml(l)}</span>`).join('')}
        </div>
      </div>
    `;
  });

  if (memories.length > 50) {
    html += `<p style="color: var(--text-muted); text-align: center; padding: 20px;">+ ${memories.length - 50} autres souvenirs...</p>`;
  }

  container.innerHTML = html;
}

// ========== UI HELPERS ==========
function revealCard(cardId) {
  const card = document.getElementById(cardId);
  if (card) {
    card.classList.remove('blurred');
    card.classList.add('revealed');
  }
}

function setAgentState(agentId, state, message) {
  const indicator = document.getElementById('agent-' + agentId);
  if (!indicator) return;

  indicator.classList.remove('complete');
  if (state === 'complete') {
    indicator.classList.add('complete');
  }
  indicator.querySelector('span').textContent = message;
}

function setNavState(navId, state) {
  const nav = document.getElementById('nav-' + navId);
  if (!nav) return;

  nav.classList.remove('loading', 'complete');
  if (state) {
    nav.classList.add(state);
  }
}

function triggerLightTrace() {
  const trace = document.getElementById('lightTrace');
  trace.classList.remove('active');
  void trace.offsetWidth; // Force reflow
  trace.classList.add('active');
}

// ========== EXPORT ==========
async function exportJson() {
  try {
    const data = {
      exportDate: new Date().toISOString(),
      memories,
      analysis: analysisResults
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
  }
}

// ========== HELPERS ==========
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
