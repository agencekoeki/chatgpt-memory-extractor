// ChatGPT Memory Extractor - Report Page v4.0
// Persona E-E-A-T Display with marketing landing

// ========== STATE ==========
let analysisResults = null;
let memories = [];

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupExport();
  setupLanding();
  await loadData();
  listenForUpdates();
});

// ========== LANDING PAGE ==========
function setupLanding() {
  const cta = document.getElementById('landingCta');
  if (cta) {
    cta.addEventListener('click', hideLanding);
  }
}

function populateLanding(results, memories) {
  // Get persona name
  const firstName = results?.persona?.mask?.profile?.firstName || 'Visiteur';
  document.getElementById('landingName').textContent = firstName;

  // Memory count with animation
  const count = results?.memoriesCount || memories.length || 0;
  animateCounter('landingCount', count);

  // Privacy stats
  const privacy = results?.statistics?.byPrivacy || {};
  const publicCount = privacy['public'] || 0;
  const semiPriveCount = privacy['semi-prive'] || 0;
  const priveCount = privacy['prive'] || 0;
  const tresPrive = privacy['tres-prive'] || 0;
  const sensitiveCount = priveCount + tresPrive;

  animateCounter('landingPublic', publicCount);
  animateCounter('landingPrivate', sensitiveCount);

  // Domains count
  const domains = results?.persona?.mask?.expertiseDomains?.length ||
                  results?.statistics?.categoryDistribution?.length || 0;
  animateCounter('landingDomains', domains);

  // Calculate exposure score (weighted by privacy level)
  const total = publicCount + semiPriveCount + priveCount + tresPrive;
  const exposureScore = total > 0
    ? Math.round(((semiPriveCount * 0.3) + (priveCount * 0.6) + (tresPrive * 1.0)) / total * 100)
    : 0;
  setExposureScore(exposureScore);

  // Set archetype badge
  const archetype = generateArchetype(results);
  document.getElementById('archetypeBadge').textContent = archetype;

  // Generate revelations
  generateRevelations(results);
}

// Animated counter
function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const duration = 1500;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);

    el.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// Exposure score meter
function setExposureScore(score) {
  const valueEl = document.getElementById('exposureValue');
  const fillEl = document.getElementById('exposureFill');

  if (!valueEl || !fillEl) return;

  // Determine level
  let level = 'low';
  if (score >= 70) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 30) level = 'medium';

  valueEl.textContent = score + '%';
  valueEl.className = 'exposure-value ' + level;

  // Animate fill after a delay
  setTimeout(() => {
    fillEl.className = 'exposure-fill ' + level;
    fillEl.style.width = score + '%';
  }, 500);
}

// Generate archetype based on data
function generateArchetype(results) {
  const mask = results?.persona?.mask;
  const stats = results?.statistics;

  if (!mask && !stats) return 'PROFIL MYSTERE';

  // Get dominant category
  const topCategory = stats?.categoryDistribution?.[0]?.category;
  const type = mask?.type || '';

  const archetypes = {
    'expertise': ['EXPERT TECHNIQUE', 'SPECIALISTE', 'MAITRE DU DOMAINE', 'CONNAISSEUR'],
    'experience': ['VETERAIN', 'EXPLORATEUR', 'AVENTURIER DIGITAL', 'NAVIGATEUR'],
    'authority': ['LEADER D\'OPINION', 'INFLUENCEUR', 'VOIX AUTORISEE', 'REFERENCE'],
    'trust': ['CONFIDENT', 'PILIER DE CONFIANCE', 'ANCRE STABLE', 'GARDIEN'],
    'voice': ['COMMUNICATEUR', 'NARRATEUR', 'CONTEUR', 'VOIX UNIQUE']
  };

  const categoryArchetypes = archetypes[topCategory] || ['PROFIL UNIQUE'];
  const randomIndex = Math.floor(Math.random() * categoryArchetypes.length);

  return categoryArchetypes[randomIndex];
}

// Generate shocking revelations
function generateRevelations(results) {
  const container = document.getElementById('revelationsList');
  if (!container) return;

  const revelations = [];
  const mask = results?.persona?.mask;
  const stats = results?.statistics;
  const extractions = results?.extractions || [];

  // Find interesting data points
  if (mask?.expertiseDomains?.[0]) {
    revelations.push({
      icon: '🧠',
      text: 'es passionne par',
      blur: mask.expertiseDomains[0]
    });
  }

  if (mask?.profile?.currentSituation) {
    revelations.push({
      icon: '💼',
      text: 'travailles sur',
      blur: truncate(mask.profile.currentSituation, 35)
    });
  }

  if (mask?.bias) {
    revelations.push({
      icon: '🎯',
      text: 'as un biais vers',
      blur: truncate(mask.bias, 30)
    });
  }

  // Find a sensitive memory
  const sensitiveMemory = extractions.find(e =>
    e.privacy_level === 'prive' || e.privacy_level === 'tres-prive'
  );
  if (sensitiveMemory) {
    revelations.push({
      icon: '🔐',
      text: 'as confie que',
      blur: truncate(sensitiveMemory.extracted_fact || sensitiveMemory.text, 35)
    });
  }

  if (stats?.topTags?.[0]) {
    revelations.push({
      icon: '🔄',
      text: 'parles souvent de',
      blur: stats.topTags[0].tag
    });
  }

  if (mask?.limits?.[0]) {
    revelations.push({
      icon: '⚠️',
      text: 'avoues ne pas maitriser',
      blur: mask.limits[0]
    });
  }

  // Render top 4 revelations
  container.innerHTML = revelations.slice(0, 4).map(r => `
    <div class="revelation-item">
      <span class="revelation-icon">${r.icon}</span>
      <span class="revelation-text">${r.text} <span class="blur">${escapeHtml(r.blur)}</span></span>
    </div>
  `).join('');
}

function generateTeaserInsights(results) {
  const container = document.getElementById('landingInsights');
  if (!container) return;

  const insights = [];

  // Get some teaser data
  const mask = results?.persona?.mask;
  const stats = results?.statistics;

  if (mask?.profile?.background) {
    insights.push({ text: 'Parcours:', blur: truncate(mask.profile.background, 30) });
  }
  if (mask?.expertiseDomains?.[0]) {
    insights.push({ text: 'Expert en:', blur: mask.expertiseDomains[0] });
  }
  if (mask?.bias) {
    insights.push({ text: 'Biais cognitif:', blur: truncate(mask.bias, 25) });
  }
  if (stats?.topTags?.[0]) {
    insights.push({ text: 'Theme recurrent:', blur: stats.topTags[0].tag });
  }
  if (mask?.type) {
    insights.push({ text: 'Profil:', blur: mask.type });
  }

  // Render with blur
  container.innerHTML = insights.slice(0, 4).map(i => `
    <div class="insight-teaser">
      ${i.text} <span class="blur">${i.blur}</span>
    </div>
  `).join('');
}

function truncate(text, max) {
  if (!text) return '???';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function hideLanding() {
  const landing = document.getElementById('landing');
  if (landing) {
    landing.classList.add('hidden');
    triggerLightTrace();
  }
}

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
      revealAllData(analysisResults, memories);
    } else if (memories.length > 0) {
      // Basic landing with just memory count
      document.getElementById('landingName').textContent = 'Visiteur';
      document.getElementById('landingCount').textContent = memories.length;
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
  const { stage, progress, message } = data;

  triggerLightTrace();

  switch (stage) {
    case 'extracting':
      setAgentState('extractor', 'loading', `Extraction E-E-A-T: ${Math.round(progress)}%`);
      setNavState('extractions', 'loading');
      break;

    case 'statistics':
      setAgentState('extractor', 'complete', 'Extraction terminee');
      setAgentState('statistician', 'loading', 'Agregation des donnees...');
      setNavState('extractions', 'complete');
      setNavState('stats', 'loading');
      break;

    case 'architecting':
      setAgentState('statistician', 'complete', 'Statistiques calculees');
      setAgentState('architect', 'loading', 'Construction du masque...');
      setNavState('stats', 'complete');
      setNavState('persona', 'loading');
      break;

    case 'chartering':
      setAgentState('architect', 'complete', 'Masque construit');
      setAgentState('charterer', 'loading', 'Redaction de la charte...');
      setNavState('persona', 'complete');
      setNavState('charter', 'loading');
      break;
  }
}

// ========== COMPLETE HANDLER ==========
function handleComplete(results) {
  if (!results.success) {
    console.error('Analysis failed:', results.error);
    return;
  }

  triggerLightTrace();

  setAgentState('extractor', 'complete', 'Extraction terminee');
  setAgentState('statistician', 'complete', 'Statistiques calculees');
  setAgentState('architect', 'complete', 'Masque construit');
  setAgentState('charterer', 'complete', 'Charte terminee');

  setNavState('extractions', 'complete');
  setNavState('stats', 'complete');
  setNavState('persona', 'complete');
  setNavState('charter', 'complete');

  revealAllData(results, memories);
}

// ========== REVEAL DATA ==========
function revealAllData(results, memories) {
  // Populate landing page
  populateLanding(results, memories);

  // Update header
  if (results.persona?.metadata?.generatedAt) {
    const date = new Date(results.persona.metadata.generatedAt);
    document.getElementById('analysisDate').textContent = date.toLocaleDateString('fr-FR');
    document.getElementById('analysisTime').textContent = `Analyse en ${Math.round((results.totalTime || 0) / 1000)}s`;
  }

  // Sidebar stats
  setTimeout(() => {
    document.getElementById('totalMemories').textContent = results.memoriesCount || memories.length;
    document.getElementById('stat-memories').classList.add('reveal');
  }, 200);

  setTimeout(() => {
    const catCount = results.statistics?.categoryDistribution?.length || 5;
    document.getElementById('totalCategories').textContent = catCount;
    document.getElementById('stat-categories').classList.add('reveal');
  }, 400);

  // Privacy stats
  setTimeout(() => {
    const privacy = results.statistics?.byPrivacy || {};
    const container = document.getElementById('privacyMiniStats');
    if (container) {
      container.innerHTML = `
        <span class="privacy-mini public">🟢 ${privacy['public'] || 0}</span>
        <span class="privacy-mini semi-prive">🟡 ${privacy['semi-prive'] || 0}</span>
        <span class="privacy-mini prive">🟠 ${privacy['prive'] || 0}</span>
        <span class="privacy-mini tres-prive">🔴 ${privacy['tres-prive'] || 0}</span>
      `;
    }
    document.getElementById('stat-privacy')?.classList.add('reveal');
  }, 500);

  // Reveal persona
  setTimeout(() => {
    renderPersona(results.persona);
    revealCard('card-persona');
    setAgentState('architect', 'complete', 'Masque construit');
  }, 600);

  // Reveal charter
  setTimeout(() => {
    renderCharter(results.persona?.writingCharter);
    revealCard('card-charter');
    setAgentState('charterer', 'complete', 'Charte terminee');
  }, 1000);

  // Reveal stats
  setTimeout(() => {
    renderStats(results.statistics);
    setAgentState('statistician', 'complete', 'Statistiques calculees');
  }, 1400);

  // Reveal extractions
  setTimeout(() => {
    renderExtractions(results.extractions);
    revealCard('card-extractions');
    setAgentState('extractor', 'complete', 'Extraction terminee');
  }, 1800);
}

// ========== RENDER PERSONA ==========
function renderPersona(persona) {
  const container = document.getElementById('personaContent');

  if (!persona || !persona.mask) {
    container.innerHTML = '<p style="color: var(--text-muted);">Aucun persona genere.</p>';
    return;
  }

  const mask = persona.mask;
  const backstory = persona.backstory;
  const editorial = persona.editorial;

  const initials = (mask.profile?.firstName?.[0] || '?') + (mask.profile?.lastName?.[0] || '?');

  let html = `
    <div class="persona-header">
      <div class="persona-avatar">${initials}</div>
      <div class="persona-info">
        <h2>${escapeHtml(mask.profile?.firstName || '')} ${escapeHtml(mask.profile?.lastName || '')}</h2>
        <span class="persona-type">${escapeHtml(mask.type || 'expert')}</span>
        <div class="persona-meta">
          ${mask.profile?.ageRange || ''} ans | ${escapeHtml(mask.profile?.location || '')} | ${escapeHtml(mask.expertiseLevel || '')}
        </div>
      </div>
    </div>

    <div class="persona-grid">
      <div class="persona-block full">
        <h4>Parcours</h4>
        <p>${escapeHtml(mask.profile?.background || '')}</p>
      </div>

      <div class="persona-block">
        <h4>Situation actuelle</h4>
        <p>${escapeHtml(mask.profile?.currentSituation || '')}</p>
      </div>

      <div class="persona-block">
        <h4>Mission</h4>
        <p>${escapeHtml(mask.mission || '')}</p>
      </div>

      <div class="persona-block full">
        <h4>Domaines d'expertise</h4>
        <div class="tag-list">
          ${(mask.expertiseDomains || []).map(d => `<span class="tag">${escapeHtml(d)}</span>`).join('')}
        </div>
      </div>

      <div class="persona-block">
        <h4>Biais / Angle</h4>
        <p>${escapeHtml(mask.bias || '')}</p>
      </div>

      <div class="persona-block">
        <h4>Valeur unique</h4>
        <p>${escapeHtml(mask.uniqueValue || '')}</p>
      </div>

      <div class="persona-block full">
        <h4>Limites avouees</h4>
        <div class="tag-list">
          ${(mask.limits || []).map(l => `<span class="tag warning">${escapeHtml(l)}</span>`).join('')}
        </div>
      </div>
    </div>

    ${backstory ? `
    <div class="card-title" style="margin-top: 32px;">Backstory</div>
    <div class="backstory-content">
      ${escapeHtml(backstory.fullText || '')}
    </div>

    <div class="persona-grid" style="margin-top: 20px;">
      <div class="persona-block">
        <h4>Declencheur</h4>
        <p>${escapeHtml(backstory.trigger || '')}</p>
      </div>
      <div class="persona-block">
        <h4>Experience</h4>
        <p>${escapeHtml(backstory.experience || '')}</p>
      </div>
      <div class="persona-block">
        <h4>Motivation</h4>
        <p>${escapeHtml(backstory.motivation || '')}</p>
      </div>
      <div class="persona-block">
        <h4>Vulnerabilite</h4>
        <p>${escapeHtml(backstory.vulnerability || '')}</p>
      </div>
    </div>
    ` : ''}

    ${editorial ? `
    <div class="card-title" style="margin-top: 32px;">Ton Editorial</div>
    <div class="tone-grid">
      <div class="tone-item">
        <div class="tone-label">Registre</div>
        <div class="tone-value">${escapeHtml(editorial.tone?.register || '-')}</div>
      </div>
      <div class="tone-item">
        <div class="tone-label">Technicite</div>
        <div class="tone-value">${escapeHtml(editorial.tone?.technicality || '-')}</div>
      </div>
      <div class="tone-item">
        <div class="tone-label">Chaleur</div>
        <div class="tone-value">${escapeHtml(editorial.tone?.warmth || '-')}</div>
      </div>
      <div class="tone-item">
        <div class="tone-label">Assertivite</div>
        <div class="tone-value">${escapeHtml(editorial.tone?.assertiveness || '-')}</div>
      </div>
    </div>

    <div class="persona-block full">
      <h4>Promesse editoriale</h4>
      <p>${escapeHtml(editorial.editorialPromise || '')}</p>
    </div>

    ${editorial.implicitValues?.length ? `
    <div class="persona-block full">
      <h4>Valeurs implicites</h4>
      ${editorial.implicitValues.map(v => `
        <p><strong>${escapeHtml(v.value || '')}</strong>: ${escapeHtml(v.manifestation || '')}</p>
      `).join('')}
    </div>
    ` : ''}
    ` : ''}
  `;

  container.innerHTML = html;
}

// ========== RENDER CHARTER ==========
function renderCharter(charter) {
  const container = document.getElementById('charterContent');

  if (!charter) {
    container.innerHTML = '<p style="color: var(--text-muted);">Aucune charte generee.</p>';
    return;
  }

  let html = '';

  // Allowed patterns
  if (charter.allowedPatterns?.length) {
    html += '<div class="card-title">Patterns autorises</div>';
    charter.allowedPatterns.forEach(p => {
      html += `
        <div class="pattern-card allowed">
          <div class="pattern-header">
            <span class="pattern-name">${escapeHtml(p.pattern || '')}</span>
            <span class="pattern-badge allowed">OK</span>
          </div>
          <div class="pattern-example">"${escapeHtml(p.example || '')}"</div>
        </div>
      `;
    });
  }

  // Forbidden patterns
  if (charter.forbiddenPatterns?.length) {
    html += '<div class="card-title" style="margin-top: 24px;">Patterns interdits</div>';
    charter.forbiddenPatterns.forEach(p => {
      html += `
        <div class="pattern-card forbidden">
          <div class="pattern-header">
            <span class="pattern-name">${escapeHtml(p.pattern || '')}</span>
            <span class="pattern-badge forbidden">INTERDIT</span>
          </div>
          <div class="pattern-reason">Raison: ${escapeHtml(p.reason || '')}</div>
          ${p.alternative ? `<div class="pattern-alternative">Alternative: ${escapeHtml(p.alternative)}</div>` : ''}
        </div>
      `;
    });
  }

  // Signals
  html += '<div class="card-title" style="margin-top: 24px;">Signaux</div>';
  html += '<div class="signals-grid">';

  // Human signals
  if (charter.humanSignals) {
    html += `
      <div class="signal-block">
        <h4>Signaux humains</h4>
        <ul class="signal-list">
          ${charter.humanSignals.anecdoteType ? `<li><strong>Anecdotes:</strong> ${escapeHtml(charter.humanSignals.anecdoteType)}</li>` : ''}
          ${charter.humanSignals.opinionStyle ? `<li><strong>Opinions:</strong> ${escapeHtml(charter.humanSignals.opinionStyle)}</li>` : ''}
          ${(charter.humanSignals.hesitations || []).map(h => `<li>"${escapeHtml(h)}"</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Expert signals
  if (charter.expertSignals) {
    html += `
      <div class="signal-block">
        <h4>Signaux d'expertise</h4>
        <ul class="signal-list">
          ${(charter.expertSignals.precisionMarkers || []).map(m => `<li>${escapeHtml(m)}</li>`).join('')}
          ${(charter.expertSignals.insiderReferences || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
          ${(charter.expertSignals.nuancePatterns || []).map(n => `<li>${escapeHtml(n)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  html += '</div>';

  // Examples in/out of tone
  if (charter.examplesInTone?.length) {
    html += '<div class="card-title" style="margin-top: 24px;">Exemples dans le ton</div>';
    charter.examplesInTone.forEach(ex => {
      html += `<div class="pattern-card allowed"><div class="pattern-example">"${escapeHtml(ex)}"</div></div>`;
    });
  }

  if (charter.examplesOutOfTone?.length) {
    html += '<div class="card-title" style="margin-top: 24px;">Exemples hors ton</div>';
    charter.examplesOutOfTone.forEach(ex => {
      html += `
        <div class="pattern-card forbidden">
          <div class="pattern-example">"${escapeHtml(ex.phrase || '')}"</div>
          <div class="pattern-reason">${escapeHtml(ex.reason || '')}</div>
        </div>
      `;
    });
  }

  // Vocabulary
  if (charter.vocabulary) {
    html += '<div class="card-title" style="margin-top: 24px;">Vocabulaire</div>';
    html += '<div class="signals-grid">';

    if (charter.vocabulary.preferred?.length) {
      html += `
        <div class="signal-block">
          <h4>Mots preferes</h4>
          <div class="tag-list">
            ${charter.vocabulary.preferred.map(w => `<span class="tag">${escapeHtml(w)}</span>`).join('')}
          </div>
        </div>
      `;
    }

    if (charter.vocabulary.avoided?.length) {
      html += `
        <div class="signal-block">
          <h4>Mots a eviter</h4>
          <div class="tag-list">
            ${charter.vocabulary.avoided.map(w => `<span class="tag warning">${escapeHtml(w)}</span>`).join('')}
          </div>
        </div>
      `;
    }

    html += '</div>';
  }

  container.innerHTML = html;
}

// ========== RENDER STATS ==========
function renderStats(statistics) {
  if (!statistics) return;

  // Stats grid
  const grid = document.getElementById('statsGrid');
  const total = statistics.total || 0;
  const topCategory = statistics.categoryDistribution?.[0]?.category || '-';
  const topCategoryCount = statistics.categoryDistribution?.[0]?.count || 0;

  grid.innerHTML = `
    <div class="stat-card" style="animation: cardReveal 0.5s ease forwards;">
      <div class="stat-value">${total}</div>
      <div class="stat-label">Extractions E-E-A-T</div>
    </div>
    <div class="stat-card" style="animation: cardReveal 0.5s ease forwards 0.1s;">
      <div class="stat-value">${Object.keys(statistics.tagFrequency || {}).length}</div>
      <div class="stat-label">Tags uniques</div>
    </div>
    <div class="stat-card" style="animation: cardReveal 0.5s ease forwards 0.2s;">
      <div class="stat-value" style="text-transform: capitalize;">${topCategory}</div>
      <div class="stat-label">Categorie dominante</div>
    </div>
  `;

  // Category bars
  const chart = document.getElementById('categoriesChart');
  const maxCount = statistics.categoryDistribution?.[0]?.count || 1;

  let chartHtml = '';
  (statistics.categoryDistribution || []).forEach((item, index) => {
    const width = (item.count / maxCount) * 100;
    const percent = Math.round((item.count / total) * 100);
    chartHtml += `
      <div class="category-bar" style="animation-delay: ${index * 0.1}s;">
        <div class="category-header">
          <span class="category-name">${escapeHtml(item.category)}</span>
          <span class="category-count">${item.count} (${percent}%)</span>
        </div>
        <div class="category-track">
          <div class="category-fill ${item.category}" style="width: ${width}%;"></div>
        </div>
      </div>
    `;
  });

  // Privacy distribution
  if (statistics.byPrivacy) {
    const privacyLabels = {
      'public': { icon: '🟢', label: 'Public', class: 'public' },
      'semi-prive': { icon: '🟡', label: 'Semi-privé', class: 'semi-prive' },
      'prive': { icon: '🟠', label: 'Privé', class: 'prive' },
      'tres-prive': { icon: '🔴', label: 'Très privé', class: 'tres-prive' }
    };

    chartHtml += '<div class="card-title" style="margin-top: 24px;">Niveaux de confidentialite</div>';
    const privacyTotal = Object.values(statistics.byPrivacy).reduce((a, b) => a + b, 0) || 1;
    const maxPrivacy = Math.max(...Object.values(statistics.byPrivacy)) || 1;

    ['public', 'semi-prive', 'prive', 'tres-prive'].forEach(level => {
      const count = statistics.byPrivacy[level] || 0;
      const width = (count / maxPrivacy) * 100;
      const percent = Math.round((count / privacyTotal) * 100);
      const info = privacyLabels[level];

      chartHtml += `
        <div class="category-bar">
          <div class="category-header">
            <span class="category-name">${info.icon} ${info.label}</span>
            <span class="category-count">${count} (${percent}%)</span>
          </div>
          <div class="category-track">
            <div class="category-fill ${info.class}" style="width: ${width}%;"></div>
          </div>
        </div>
      `;
    });
  }

  // Top tags
  if (statistics.topTags?.length) {
    chartHtml += '<div class="card-title" style="margin-top: 24px;">Tags frequents</div>';
    chartHtml += '<div class="tag-list">';
    statistics.topTags.slice(0, 15).forEach(t => {
      chartHtml += `<span class="tag">${escapeHtml(t.tag)} (${t.count})</span>`;
    });
    chartHtml += '</div>';
  }

  chart.innerHTML = chartHtml || '<p style="color: var(--text-muted);">Aucune statistique.</p>';

  revealCard('card-categories');
}

// ========== RENDER EXTRACTIONS ==========
function renderExtractions(extractions) {
  const container = document.getElementById('extractionsList');

  if (!extractions || extractions.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted);">Aucune extraction.</p>';
    return;
  }

  // Privacy level config
  const privacyLevels = {
    'public': { icon: '🟢', label: 'Public', class: 'public' },
    'semi-prive': { icon: '🟡', label: 'Semi-privé', class: 'semi-prive' },
    'prive': { icon: '🟠', label: 'Privé', class: 'prive' },
    'tres-prive': { icon: '🔴', label: 'Très privé', class: 'tres-prive' }
  };

  let html = '';
  extractions.slice(0, 50).forEach((ext, index) => {
    const delay = Math.min(index * 0.03, 1.5);
    const categories = ext.categories || [];
    const privacy = privacyLevels[ext.privacy_level] || privacyLevels['public'];

    html += `
      <div class="memory-item revealed" style="animation-delay: ${delay}s;">
        <div class="memory-header">
          <span class="privacy-badge ${privacy.class}">${privacy.icon} ${privacy.label}</span>
        </div>
        <div class="memory-text">${escapeHtml(ext.text || '')}</div>
        <div class="memory-meta">
          ${categories.map(c => `<span class="memory-category ${c}">${c}</span>`).join('')}
          ${ext.persona_value ? `<span class="memory-value">${escapeHtml(ext.persona_value)}</span>` : ''}
        </div>
      </div>
    `;
  });

  if (extractions.length > 50) {
    html += `<p style="color: var(--text-muted); text-align: center; padding: 20px;">+ ${extractions.length - 50} autres extractions...</p>`;
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
  const span = indicator.querySelector('span');
  if (span) span.textContent = message;
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
  if (!trace) return;
  trace.classList.remove('active');
  void trace.offsetWidth;
  trace.classList.add('active');
}

// ========== EXPORT ==========
async function exportJson() {
  try {
    const data = {
      exportDate: new Date().toISOString(),
      persona: analysisResults?.persona || null,
      extractions: analysisResults?.extractions || [],
      statistics: analysisResults?.statistics || {},
      memoriesCount: memories.length
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persona-eeat-${new Date().toISOString().slice(0, 10)}.json`;
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
