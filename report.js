// ChatGPT Memory Extractor - Report Page v4.0
// Persona E-E-A-T Display with marketing landing

// ========== STATE ==========
let analysisResults = null;
let memories = [];

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupExport();
  setupReset();
  setupLanding();
  setupShare();
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

// ========== SHARE FUNCTIONALITY ==========
let shareData = {};

function setupShare() {
  const shareBtn = document.getElementById('shareBtn');
  const shareModal = document.getElementById('shareModal');
  const shareClose = document.getElementById('shareClose');
  const downloadCard = document.getElementById('downloadCard');
  const copyCard = document.getElementById('copyCard');
  const shareNative = document.getElementById('shareNative');

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      generateShareCard();
      shareModal.classList.add('active');
    });
  }

  if (shareClose) {
    shareClose.addEventListener('click', () => {
      shareModal.classList.remove('active');
    });
  }

  if (shareModal) {
    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) {
        shareModal.classList.remove('active');
      }
    });
  }

  if (downloadCard) {
    downloadCard.addEventListener('click', downloadShareCard);
  }

  if (copyCard) {
    copyCard.addEventListener('click', copyShareCard);
  }

  if (shareNative) {
    shareNative.addEventListener('click', nativeShare);
  }
}

function generateShareCard() {
  const canvas = document.getElementById('shareCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = 600;
  const height = 400;

  // Get data
  const name = document.getElementById('landingName')?.textContent || 'Visiteur';
  const archetype = document.getElementById('archetypeBadge')?.textContent || 'PROFIL UNIQUE';
  const exposure = document.getElementById('exposureValue')?.textContent || '0%';
  const memoriesCount = document.getElementById('landingCount')?.textContent || '0';
  const publicCount = document.getElementById('landingPublic')?.textContent || '0';
  const privateCount = document.getElementById('landingPrivate')?.textContent || '0';

  // Store for sharing
  shareData = { name, archetype, exposure, memoriesCount };

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0a0a12');
  gradient.addColorStop(1, '#12121f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Glow effect
  const glowGradient = ctx.createRadialGradient(300, 150, 0, 300, 150, 250);
  glowGradient.addColorStop(0, 'rgba(167, 139, 250, 0.3)');
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, width, height);

  // Header text
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CE QUE CHATGPT SAIT DE MOI', width / 2, 40);

  // Name
  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(name, width / 2, 90);

  // Archetype badge
  const archetypeY = 130;
  const archetypeWidth = ctx.measureText(archetype).width + 40;
  const archetypeX = (width - archetypeWidth) / 2;

  // Badge background
  ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
  ctx.beginPath();
  ctx.roundRect(archetypeX, archetypeY - 20, archetypeWidth, 36, 18);
  ctx.fill();

  // Badge border
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Badge text
  ctx.fillStyle = '#c4b5fd';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(archetype, width / 2, archetypeY);

  // Exposure meter
  const meterY = 190;
  const meterWidth = 300;
  const meterX = (width - meterWidth) / 2;

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Niveau d\'exposition', meterX, meterY);

  ctx.textAlign = 'right';
  const exposureNum = parseInt(exposure) || 0;
  let exposureColor = '#4ade80';
  if (exposureNum >= 70) exposureColor = '#f87171';
  else if (exposureNum >= 50) exposureColor = '#fb923c';
  else if (exposureNum >= 30) exposureColor = '#fbbf24';

  ctx.fillStyle = exposureColor;
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(exposure, meterX + meterWidth, meterY);

  // Meter track
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(meterX, meterY + 10, meterWidth, 10, 5);
  ctx.fill();

  // Meter fill
  const fillGradient = ctx.createLinearGradient(meterX, 0, meterX + meterWidth, 0);
  if (exposureNum >= 70) {
    fillGradient.addColorStop(0, '#ef4444');
    fillGradient.addColorStop(1, '#f87171');
  } else if (exposureNum >= 50) {
    fillGradient.addColorStop(0, '#f97316');
    fillGradient.addColorStop(1, '#fb923c');
  } else if (exposureNum >= 30) {
    fillGradient.addColorStop(0, '#eab308');
    fillGradient.addColorStop(1, '#fbbf24');
  } else {
    fillGradient.addColorStop(0, '#22c55e');
    fillGradient.addColorStop(1, '#4ade80');
  }
  ctx.fillStyle = fillGradient;
  ctx.beginPath();
  ctx.roundRect(meterX, meterY + 10, meterWidth * (exposureNum / 100), 10, 5);
  ctx.fill();

  // Stats
  const statsY = 270;
  const stats = [
    { value: memoriesCount, label: 'Souvenirs' },
    { value: publicCount, label: 'Publics' },
    { value: privateCount, label: 'Sensibles' }
  ];

  const statWidth = 150;
  const statStartX = (width - (stats.length * statWidth)) / 2;

  stats.forEach((stat, i) => {
    const x = statStartX + (i * statWidth) + statWidth / 2;

    ctx.fillStyle = '#c4b5fd';
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, x, statsY);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(stat.label, x, statsY + 20);
  });

  // Footer / branding
  ctx.fillStyle = '#52525b';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ChatGPT Memory Extractor', width / 2, height - 20);
}

async function downloadShareCard() {
  const canvas = document.getElementById('shareCanvas');
  if (!canvas) return;

  const link = document.createElement('a');
  link.download = `profil-ia-${shareData.name || 'user'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function copyShareCard() {
  const canvas = document.getElementById('shareCanvas');
  if (!canvas) return;

  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);

    // Feedback
    const btn = document.getElementById('copyCard');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copie !';
    setTimeout(() => { btn.innerHTML = originalText; }, 2000);
  } catch (e) {
    console.error('Copy failed:', e);
    alert('Copie impossible. Telecharge l\'image a la place !');
  }
}

async function nativeShare() {
  const canvas = document.getElementById('shareCanvas');
  if (!canvas) return;

  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], 'profil-ia.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Mon profil IA: ${shareData.archetype}`,
        text: `ChatGPT a memorise ${shareData.memoriesCount} infos sur moi ! Decouvre ton profil :`,
        files: [file]
      });
    } else {
      // Fallback: copy to clipboard
      await copyShareCard();
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error('Share failed:', e);
      downloadShareCard();
    }
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
  document.getElementById('exportAll')?.addEventListener('click', () => exportJson('all'));
  document.getElementById('exportPublic')?.addEventListener('click', () => exportJson('public'));
  document.getElementById('exportVoice')?.addEventListener('click', () => exportJson('voice'));
}

function setupReset() {
  const resetBtn = document.getElementById('resetData');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllData);
  }
}

async function resetAllData() {
  const confirmed = confirm(
    '⚠️ Reinitialiser l\'analyse ?\n\n' +
    'Cela va supprimer :\n' +
    '• Toutes les memoires extraites\n' +
    '• L\'analyse de persona\n' +
    '• Toutes les statistiques\n\n' +
    'Cette action est irreversible !'
  );

  if (!confirmed) return;

  try {
    // Delete IndexedDB database
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('MemoryExtractorDB');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn('Database deletion blocked, forcing reload...');
        resolve();
      };
    });

    // Tell background to clear analysis results
    try {
      await chrome.runtime.sendMessage({ action: 'clearAnalysisResults' });
    } catch (e) {
      // Background might not have this handler, that's OK
      console.log('Background clear:', e.message);
    }

    // Feedback and reload
    alert('✓ Donnees supprimees !\n\nLa page va se recharger.');
    window.location.reload();

  } catch (e) {
    console.error('Reset error:', e);
    alert('Erreur lors de la reinitialisation.\nEssayez de fermer et rouvrir le rapport.');
  }
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

  // Reveal psych profile (if available)
  setTimeout(() => {
    renderPsychProfile(results.persona?.psychProfile, results.interrogation);
    if (results.interrogation?.length > 0) {
      setAgentState('profiler', 'complete', 'Profil psychologique etabli');
    } else {
      setAgentState('profiler', 'waiting', 'Pas d\'interrogatoire');
    }
  }, 2200);
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

  // Confidence levels for inferences
  const confidenceLevels = {
    'high': { icon: '◉', label: 'Fiable', class: 'confidence-high' },
    'medium': { icon: '◎', label: 'Probable', class: 'confidence-medium' },
    'low': { icon: '○', label: 'Inférence', class: 'confidence-low' }
  };

  let html = '';
  extractions.forEach((ext, index) => {
    const delay = Math.min(index * 0.02, 2);
    const categories = ext.categories || [];
    const privacy = privacyLevels[ext.privacy_level] || privacyLevels['public'];

    // Determine confidence level based on source/inference
    const isInference = ext.is_inference || ext.inferred ||
      (ext.text && (ext.text.includes('probablement') || ext.text.includes('semble') || ext.text.includes('peut-être')));
    const confidence = ext.confidence || (isInference ? 'low' : 'high');
    const confInfo = confidenceLevels[confidence] || confidenceLevels['high'];

    html += `
      <div class="memory-item revealed" style="animation-delay: ${delay}s;">
        <div class="memory-header">
          <span class="confidence-badge ${confInfo.class}" title="${confInfo.label}">${confInfo.icon}</span>
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

// ========== RENDER PSYCH PROFILE ==========
function renderPsychProfile(psychProfile, interrogation) {
  const noInterrogation = document.getElementById('noInterrogation');
  const psychContent = document.getElementById('psychProfileContent');
  const summaryContainer = document.getElementById('psychSummary');
  const gridContainer = document.getElementById('psychGrid');
  const rawContainer = document.getElementById('interrogationRaw');

  // No interrogation data
  if (!interrogation || interrogation.length === 0) {
    if (noInterrogation) noInterrogation.style.display = 'block';
    if (psychContent) psychContent.style.display = 'none';
    return;
  }

  if (noInterrogation) noInterrogation.style.display = 'none';
  if (psychContent) psychContent.style.display = 'block';

  // Render summary
  if (summaryContainer && psychProfile?.summary) {
    const s = psychProfile.summary;
    summaryContainer.innerHTML = `
      <div style="font-size: 18px; color: var(--text-primary); margin-bottom: 12px;">
        "${escapeHtml(s.oneSentence || 'Profil en cours d\'analyse')}"
      </div>
      ${s.keyInsight ? `
        <div style="color: var(--warning); font-size: 14px; margin-bottom: 8px;">
          <strong>Insight cle:</strong> ${escapeHtml(s.keyInsight)}
        </div>
      ` : ''}
      <div class="psych-badge ${s.dataQuality === 'excellente' ? '' : 'secondary'}">
        Qualite des donnees: ${escapeHtml(s.dataQuality || 'inconnue')}
      </div>
    `;
    revealCard('card-psych-summary');
  }

  // Render psychology grid
  if (gridContainer && psychProfile) {
    let gridHtml = '';

    // Brain Type
    if (psychProfile.psychology?.brainType) {
      const bt = psychProfile.psychology.brainType;
      gridHtml += `
        <div class="psych-card">
          <div class="psych-card-title">🧠 Centre Decisionnel</div>
          <div class="psych-badge">${escapeHtml(bt.dominant || '?')}</div>
          ${bt.secondary ? `<div class="psych-badge secondary">${escapeHtml(bt.secondary)}</div>` : ''}
          <div class="psych-evidence">${escapeHtml(bt.evidence || '')}</div>
        </div>
      `;
    }

    // Behavior Profile
    if (psychProfile.psychology?.behaviorProfile) {
      const bp = psychProfile.psychology.behaviorProfile;
      gridHtml += `
        <div class="psych-card">
          <div class="psych-card-title">⚡ Profil Comportemental</div>
          <div class="psych-badge">${escapeHtml(bp.primary || '?')}</div>
          ${bp.secondary ? `<div class="psych-badge secondary">${escapeHtml(bp.secondary)}</div>` : ''}
          <div class="psych-evidence">${escapeHtml(bp.evidence || '')}</div>
        </div>
      `;
    }

    // SONCAS
    if (psychProfile.motivations?.soncas) {
      const soncas = psychProfile.motivations.soncas;
      gridHtml += `
        <div class="psych-card">
          <div class="psych-card-title">🎯 SONCAS (Motivation d'achat)</div>
          <div class="psych-badge">${escapeHtml(soncas.primary || '?')}</div>
          ${soncas.secondary ? `<div class="psych-badge secondary">${escapeHtml(soncas.secondary)}</div>` : ''}
        </div>
      `;
    }

    // Thinking System
    if (psychProfile.psychology?.thinkingSystem) {
      const ts = psychProfile.psychology.thinkingSystem;
      gridHtml += `
        <div class="psych-card">
          <div class="psych-card-title">💭 Systeme de Pensee</div>
          <div class="psych-badge">${ts.dominant === 'systeme1' ? 'Systeme 1 (Intuitif)' : ts.dominant === 'systeme2' ? 'Systeme 2 (Analytique)' : 'Mixte'}</div>
          <div class="psych-evidence">${escapeHtml(ts.context || '')}</div>
        </div>
      `;
    }

    // Influence Triggers
    if (psychProfile.influenceTriggers) {
      const it = psychProfile.influenceTriggers;
      gridHtml += `
        <div class="psych-card">
          <div class="psych-card-title">🧲 Leviers d'Influence (Cialdini)</div>
          <div class="psych-badge">${escapeHtml(it.mostSensitive || '?')}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
            Moins sensible a: ${escapeHtml(it.leastSensitive || '?')}
          </div>
          <div class="psych-evidence">${escapeHtml(it.evidence || '')}</div>
        </div>
      `;
    }

    // Archetype
    if (psychProfile.archetype) {
      const arch = psychProfile.archetype;
      gridHtml += `
        <div class="psych-card">
          <div class="psych-card-title">🎭 Archetype de Jung</div>
          <div class="psych-badge">${escapeHtml(arch.jungian || '?')}</div>
          ${arch.shadow ? `<div style="font-size: 12px; color: var(--danger); margin-top: 4px;">Ombre: ${escapeHtml(arch.shadow)}</div>` : ''}
          <div class="psych-evidence">${escapeHtml(arch.evidence || '')}</div>
        </div>
      `;
    }

    // VAK
    if (psychProfile.communication?.vak) {
      const comm = psychProfile.communication;
      gridHtml += `
        <div class="psych-card">
          <div class="psych-card-title">📡 Canal de Communication</div>
          <div class="psych-badge">${escapeHtml(comm.vak || '?')}</div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">${escapeHtml(comm.style || '')}</div>
        </div>
      `;
    }

    // Vulnerabilities
    if (psychProfile.vulnerabilities) {
      const vuln = psychProfile.vulnerabilities;
      gridHtml += `
        <div class="psych-card">
          <div class="psych-card-title">⚠️ Vulnerabilites</div>
          ${vuln.stressType ? `<div class="psych-badge secondary">Type ${escapeHtml(vuln.stressType)}</div>` : ''}
          ${vuln.weaknesses?.length > 0 ? `
            <ul class="psych-list">
              ${vuln.weaknesses.slice(0, 3).map(w => `<li>${escapeHtml(w)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    }

    // Motivations
    if (psychProfile.motivations?.drivers?.length > 0) {
      const mot = psychProfile.motivations;
      gridHtml += `
        <div class="psych-card">
          <div class="psych-card-title">🚀 Motivations & Peurs</div>
          <div style="font-size: 13px; color: var(--success); margin-bottom: 4px;">Drivers:</div>
          <ul class="psych-list">
            ${mot.drivers.slice(0, 3).map(d => `<li>${escapeHtml(d)}</li>`).join('')}
          </ul>
          ${mot.fears?.length > 0 ? `
            <div style="font-size: 13px; color: var(--danger); margin: 8px 0 4px;">Peurs:</div>
            <ul class="psych-list">
              ${mot.fears.slice(0, 3).map(f => `<li>${escapeHtml(f)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    }

    // Marketing Profile
    if (psychProfile.marketingProfile) {
      const mp = psychProfile.marketingProfile;
      gridHtml += `
        <div class="psych-card" style="grid-column: span 2;">
          <div class="psych-card-title">📊 Profil Marketing</div>
          ${mp.vals ? `<div class="psych-badge">${escapeHtml(mp.vals)}</div>` : ''}
          ${mp.messagingAngle ? `
            <div style="margin-top: 12px;">
              <strong style="color: var(--accent-light); font-size: 13px;">Comment lui parler:</strong>
              <p style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(mp.messagingAngle)}</p>
            </div>
          ` : ''}
          ${mp.buyingTriggers?.length > 0 ? `
            <div style="margin-top: 12px;">
              <strong style="color: var(--accent-light); font-size: 13px;">Declencheurs d'action:</strong>
              <ul class="psych-list">
                ${mp.buyingTriggers.slice(0, 3).map(t => `<li>${escapeHtml(t)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    }

    gridContainer.innerHTML = gridHtml;
  }

  // Render raw interrogation responses
  if (rawContainer && interrogation?.length > 0) {
    const categoryLabels = {
      'identite': 'Identite',
      'interets': 'Centres d\'interet',
      'professionnel': 'Professionnel',
      'personnalite': 'Personnalite',
      'vulnerabilites': 'Vulnerabilites',
      'biais': 'Biais Cognitifs',
      'fondations_perso': 'Fondations Personnelles',
      'fondations_pro': 'Fondations Professionnelles',
      'moteurs': 'Moteurs de Vie',
      'sensibilites': 'Sujets Sensibles',
      'cerveau': 'Type de Cerveau',
      'profil_comportemental': 'Profil Comportemental',
      'systeme_pensee': 'Systeme de Pensee',
      'leviers_influence': 'Leviers d\'Influence',
      'soncas': 'SONCAS',
      'archetype': 'Archetype Jung',
      'vak': 'VAK',
      'vals': 'VALS',
      'type_stress': 'Type de Stress',
      'enneagram': 'Enneagramme'
    };

    rawContainer.innerHTML = interrogation.map(item => `
      <div class="interrogation-response">
        <div class="interrogation-category">${escapeHtml(categoryLabels[item.category] || item.category)}</div>
        <div class="interrogation-text">${escapeHtml(item.response || 'Pas de reponse')}</div>
      </div>
    `).join('');

    revealCard('card-interrogation-raw');
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
async function exportJson(type = 'all') {
  try {
    let data, filename;
    const date = new Date().toISOString().slice(0, 10);
    const firstName = analysisResults?.persona?.mask?.profile?.firstName || 'user';

    switch (type) {
      case 'public':
        // Export "Ce qu'on sait de moi" - Grand public / shocking profile
        data = buildPublicProfile();
        filename = `ce-quon-sait-de-moi-${firstName}-${date}.json`;
        break;

      case 'voice':
        // Export "Persona IA" - Pour reproduire le style d'écriture/pensée
        data = buildVoiceProfile();
        filename = `persona-ia-${firstName}-${date}.json`;
        break;

      default:
        // Export complet - Tout
        data = {
          exportDate: new Date().toISOString(),
          exportType: 'complete',
          persona: analysisResults?.persona || null,
          extractions: analysisResults?.extractions || [],
          statistics: analysisResults?.statistics || {},
          memoriesCount: memories.length
        };
        filename = `persona-complet-${firstName}-${date}.json`;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Export error:', e);
  }
}

// Build "Ce qu'on sait de moi" profile for general public
function buildPublicProfile() {
  const persona = analysisResults?.persona;
  const extractions = analysisResults?.extractions || [];
  const stats = analysisResults?.statistics;

  // Group extractions by theme for shocking revelation
  const byCategory = {};
  extractions.forEach(ext => {
    (ext.categories || ['autre']).forEach(cat => {
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({
        info: ext.text,
        confidentialite: ext.privacy_level,
        fiabilite: ext.confidence || (ext.is_inference ? 'inférence' : 'fiable')
      });
    });
  });

  return {
    exportDate: new Date().toISOString(),
    exportType: 'public_profile',
    titre: "Ce que ChatGPT sait de moi",
    description: "Profil complet déduit de vos conversations avec l'IA",

    resume: {
      prenom: persona?.mask?.profile?.firstName || 'Inconnu',
      archetype: generateArchetype(analysisResults),
      nombreInfos: extractions.length,
      niveauExposition: calculateExposureLevel(stats?.byPrivacy)
    },

    profils: {
      psychologique: {
        personnalite: persona?.mask?.type || null,
        biais: persona?.mask?.bias || null,
        valeurs: persona?.editorial?.implicitValues?.map(v => v.value) || [],
        vulnerabilites: persona?.backstory?.vulnerability || null
      },
      consommateur: {
        interets: persona?.mask?.expertiseDomains || [],
        centresDinteret: stats?.topTags?.slice(0, 10).map(t => t.tag) || []
      },
      professionnel: {
        situation: persona?.mask?.profile?.currentSituation || null,
        parcours: persona?.mask?.profile?.background || null,
        expertise: persona?.mask?.expertiseLevel || null
      }
    },

    toutesLesInfos: byCategory,

    statistiques: {
      parConfidentialite: stats?.byPrivacy || {},
      parCategorie: stats?.categoryDistribution || []
    },

    avertissement: "Ces informations sont déduites de vos conversations avec ChatGPT. Certaines sont des inférences qui peuvent être inexactes."
  };
}

// Build "Persona IA" profile for AI reproducibility
function buildVoiceProfile() {
  const persona = analysisResults?.persona;

  return {
    exportDate: new Date().toISOString(),
    exportType: 'persona_ia',
    titre: "Persona IA - Profil de reproduction",
    description: "Injectez ce profil dans une IA pour qu'elle écrive et pense comme vous",

    instructions: `Tu vas incarner ${persona?.mask?.profile?.firstName || 'cette personne'}.
Voici son profil complet pour reproduire son style d'écriture, sa façon de penser, ses biais et sa personnalité.`,

    identite: {
      prenom: persona?.mask?.profile?.firstName || null,
      type: persona?.mask?.type || null,
      mission: persona?.mask?.mission || null,
      valeurUnique: persona?.mask?.uniqueValue || null
    },

    contexte: {
      parcours: persona?.mask?.profile?.background || null,
      situationActuelle: persona?.mask?.profile?.currentSituation || null,
      domainesExpertise: persona?.mask?.expertiseDomains || [],
      limites: persona?.mask?.limits || []
    },

    backstory: persona?.backstory ? {
      declencheur: persona.backstory.trigger,
      experience: persona.backstory.experience,
      motivation: persona.backstory.motivation,
      vulnerabilite: persona.backstory.vulnerability,
      recitComplet: persona.backstory.fullText
    } : null,

    tonEditorial: persona?.editorial ? {
      registre: persona.editorial.tone?.register,
      technicite: persona.editorial.tone?.technicality,
      chaleur: persona.editorial.tone?.warmth,
      assertivite: persona.editorial.tone?.assertiveness,
      promesse: persona.editorial.editorialPromise
    } : null,

    charteEcriture: persona?.writingCharter ? {
      patternsAutorises: persona.writingCharter.allowedPatterns || [],
      patternsInterdits: persona.writingCharter.forbiddenPatterns || [],
      vocabulairePreferee: persona.writingCharter.vocabulary?.preferred || [],
      vocabulaireEviter: persona.writingCharter.vocabulary?.avoided || [],
      signauxHumains: persona.writingCharter.humanSignals || {},
      signauxExpertise: persona.writingCharter.expertSignals || {},
      exemplesOK: persona.writingCharter.examplesInTone || [],
      exemplesNOK: persona.writingCharter.examplesOutOfTone || []
    } : null,

    valeurs: persona?.editorial?.implicitValues || [],
    biais: persona?.mask?.bias || null,

    promptSuggere: generateVoicePrompt(persona)
  };
}

// Helper: Calculate exposure level
function calculateExposureLevel(byPrivacy) {
  if (!byPrivacy) return 'inconnu';
  const total = Object.values(byPrivacy).reduce((a, b) => a + b, 0) || 1;
  const score = ((byPrivacy['semi-prive'] || 0) * 0.3 +
    (byPrivacy['prive'] || 0) * 0.6 +
    (byPrivacy['tres-prive'] || 0) * 1.0) / total * 100;

  if (score >= 70) return 'critique';
  if (score >= 50) return 'élevé';
  if (score >= 30) return 'modéré';
  return 'faible';
}

// Helper: Generate a ready-to-use voice prompt
function generateVoicePrompt(persona) {
  if (!persona) return null;

  const mask = persona.mask;
  const charter = persona.writingCharter;
  const editorial = persona.editorial;

  let prompt = `Tu es ${mask?.profile?.firstName || 'un expert'}`;
  if (mask?.type) prompt += `, un(e) ${mask.type}`;
  if (mask?.expertiseDomains?.length) {
    prompt += ` spécialisé(e) en ${mask.expertiseDomains.slice(0, 3).join(', ')}`;
  }
  prompt += '.\n\n';

  if (mask?.mission) {
    prompt += `Ta mission: ${mask.mission}\n\n`;
  }

  if (editorial?.tone) {
    prompt += 'Ton style:\n';
    if (editorial.tone.register) prompt += `- Registre: ${editorial.tone.register}\n`;
    if (editorial.tone.technicality) prompt += `- Technicité: ${editorial.tone.technicality}\n`;
    if (editorial.tone.warmth) prompt += `- Chaleur: ${editorial.tone.warmth}\n`;
  }

  if (charter?.vocabulary?.preferred?.length) {
    prompt += `\nMots à utiliser: ${charter.vocabulary.preferred.slice(0, 10).join(', ')}\n`;
  }

  if (charter?.vocabulary?.avoided?.length) {
    prompt += `Mots à éviter: ${charter.vocabulary.avoided.slice(0, 10).join(', ')}\n`;
  }

  if (mask?.bias) {
    prompt += `\nTon angle/biais: ${mask.bias}\n`;
  }

  if (mask?.limits?.length) {
    prompt += `\nTes limites avouées: ${mask.limits.join(', ')}\n`;
  }

  return prompt;
}

// ========== HELPERS ==========
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
