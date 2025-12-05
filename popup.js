// ChatGPT Memory Extractor - Popup v4.0
// With AI Analysis Integration

let extractedMemories = [];
let isExtracting = false;
let isAnalyzing = false;
let hasApiKeys = false;

// DOM Elements
const $ = id => document.getElementById(id);
const statusCard = $('statusCard');
const statusText = $('statusText');
const progressSection = $('progressSection');
const progressFill = $('progressFill');
const progressText = $('progressText');
const extractBtn = $('extractBtn');
const btnText = $('btnText');
const resultsSection = $('resultsSection');
const resultsCount = $('resultsCount');
const resultsPreview = $('resultsPreview');
const saveBtn = $('saveBtn');
const copyBtn = $('copyBtn');
const analyzeBtn = $('analyzeBtn');
const analyzeBtnText = $('analyzeBtnText');
const apiBadge = $('apiBadge');
const analysisProgress = $('analysisProgress');
const analysisStage = $('analysisStage');
const analysisProgressFill = $('analysisProgressFill');
const reportBtn = $('reportBtn');
const settingsBtn = $('settingsBtn');
const consoleSection = document.querySelector('.console-section');
const consoleToggle = $('consoleToggle');
const consoleContent = $('consoleContent');
const consoleLogs = $('consoleLogs');

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  setupListeners();
  await checkApiKeys();
  await checkPage();
  await loadStoredMemories();
});

function setupListeners() {
  extractBtn.addEventListener('click', startExtraction);
  saveBtn.addEventListener('click', saveToFile);
  copyBtn.addEventListener('click', copyToClipboard);
  analyzeBtn.addEventListener('click', startAnalysis);
  reportBtn.addEventListener('click', openReport);
  settingsBtn.addEventListener('click', openSettings);
  consoleToggle.addEventListener('click', toggleConsole);
}

// ========== CHECK API KEYS ==========
async function checkApiKeys() {
  try {
    const keys = await chrome.runtime.sendMessage({ action: 'getApiKeys' });
    hasApiKeys = keys && (keys.anthropic || keys.openai || keys.google);

    if (hasApiKeys) {
      apiBadge.textContent = 'Prêt';
      apiBadge.classList.remove('warning');
    } else {
      apiBadge.textContent = 'Configurer';
      apiBadge.classList.add('warning');
    }
  } catch (e) {
    console.error('Error checking API keys:', e);
  }
}

// ========== LOAD STORED MEMORIES ==========
async function loadStoredMemories() {
  try {
    const memories = await chrome.runtime.sendMessage({ action: 'getMemories' });
    if (memories && memories.length > 0) {
      extractedMemories = memories;
      displayResults();

      // Check if analysis exists
      const analysis = await chrome.runtime.sendMessage({ action: 'getAnalysisResults' });
      if (analysis) {
        reportBtn.disabled = false;
      }
    }
  } catch (e) {
    console.error('Error loading stored memories:', e);
  }
}

// ========== CHECK PAGE ==========
async function checkPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url?.includes('chatgpt.com')) {
      setStatus('error', 'Ouvrez chatgpt.com');
      return;
    }

    // Inject content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      // Already injected
    }

    // On ChatGPT = ready to extract
    setStatus('ready', 'Prêt à extraire');
    extractBtn.disabled = false;

  } catch (error) {
    log('Erreur: ' + error.message, 'error');
    setStatus('error', 'Erreur de connexion');
  }
}

// ========== STATUS ==========
function setStatus(type, text) {
  statusCard.className = 'status-card ' + type;
  statusText.textContent = text;
}

// ========== EXTRACTION ==========
async function startExtraction() {
  if (isExtracting) return;

  try {
    isExtracting = true;
    extractBtn.disabled = true;
    btnText.textContent = 'Extraction...';

    setStatus('loading', 'Navigation automatique...');
    progressSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    progressFill.style.width = '0%';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    log('Lancement extraction automatique...', 'info');

    // Send extraction command - content script handles everything
    const response = await sendMessage(tab.id, { action: 'autoExtract' });

    if (!response) {
      throw new Error('Pas de réponse - Rafraîchissez la page');
    }

    if (response.started) {
      setStatus('loading', 'Extraction en cours...');
      log('Extraction démarrée', 'info');
    } else if (response.error) {
      throw new Error(response.message || 'Échec');
    }

  } catch (error) {
    log('Erreur: ' + error.message, 'error');
    setStatus('error', error.message);
    resetUI();
  }
}

function resetUI() {
  isExtracting = false;
  extractBtn.disabled = false;
  btnText.textContent = 'Extraire les souvenirs';
  progressSection.classList.add('hidden');
}

// ========== RESULTS ==========
function displayResults() {
  resultsSection.classList.remove('hidden');
  resultsCount.textContent = extractedMemories.length + ' souvenirs extraits';

  let preview = '';
  const max = Math.min(3, extractedMemories.length);

  for (let i = 0; i < max; i++) {
    const text = extractedMemories[i].text;
    preview += (i + 1) + '. ' + text.substring(0, 80) + (text.length > 80 ? '...' : '') + '\n\n';
  }

  if (extractedMemories.length > max) {
    preview += '+ ' + (extractedMemories.length - max) + ' autres...';
  }

  resultsPreview.textContent = preview;

  // Enable analyze button if we have memories
  if (extractedMemories.length > 0) {
    analyzeBtn.disabled = false;
  }
}

// ========== ANALYSIS ==========
async function startAnalysis() {
  if (isAnalyzing) return;

  if (!hasApiKeys) {
    openSettings();
    return;
  }

  if (extractedMemories.length === 0) {
    log('Aucun souvenir à analyser', 'warning');
    return;
  }

  try {
    isAnalyzing = true;
    analyzeBtn.disabled = true;
    analyzeBtnText.textContent = 'Analyse en cours...';
    analysisProgress.classList.remove('hidden');

    log('Démarrage de l\'analyse IA...', 'info');

    // Start analysis via background script
    const response = await chrome.runtime.sendMessage({
      action: 'startAnalysis',
      memories: extractedMemories
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Analysis started, wait for completion via message listener

  } catch (error) {
    log('Erreur analyse: ' + error.message, 'error');
    resetAnalysisUI();
  }
}

function resetAnalysisUI() {
  isAnalyzing = false;
  analyzeBtn.disabled = false;
  analyzeBtnText.textContent = 'Analyser avec l\'IA';
  analysisProgress.classList.add('hidden');
}

// ========== SAVE ==========
function saveToFile() {
  if (extractedMemories.length === 0) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = 'chatgpt-memories-' + timestamp + '.txt';

  let content = '='.repeat(50) + '\n';
  content += '         CHATGPT MEMORY EXPORT\n';
  content += '='.repeat(50) + '\n\n';
  content += 'Date: ' + new Date().toLocaleString('fr-FR') + '\n';
  content += 'Total: ' + extractedMemories.length + ' souvenirs\n';
  content += '='.repeat(50) + '\n\n';

  extractedMemories.forEach((memory, i) => {
    content += '--- #' + (i + 1) + ' ---\n';
    content += memory.text + '\n';
    content += '\n' + '-'.repeat(40) + '\n\n';
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  log('Sauvegardé: ' + filename, 'success');
}

// ========== COPY ==========
async function copyToClipboard() {
  if (extractedMemories.length === 0) return;

  const text = extractedMemories.map((m, i) => (i + 1) + '. ' + m.text).join('\n\n');

  try {
    await navigator.clipboard.writeText(text);
    log('Copié dans le presse-papier', 'success');
    copyBtn.querySelector('span')?.remove();
    const span = document.createElement('span');
    span.textContent = 'Copié !';
    copyBtn.appendChild(span);
    setTimeout(() => { span.textContent = 'Copier'; }, 1500);
  } catch (e) {
    log('Erreur copie', 'error');
  }
}

// ========== NAVIGATION ==========
function openReport() {
  chrome.runtime.sendMessage({ action: 'openReport' });
}

function openSettings() {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
}

// ========== CONSOLE ==========
function log(message, level = 'info') {
  const el = document.createElement('div');
  el.className = 'console-log ' + level;
  el.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
  consoleLogs.appendChild(el);
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

function toggleConsole() {
  consoleSection.classList.toggle('open');
  consoleContent.classList.toggle('hidden');
}

// ========== MESSAGING ==========
function sendMessage(tabId, message) {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

// ========== MESSAGE LISTENER ==========
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'log':
      log(request.message, request.level);
      break;

    case 'progress':
      progressText.textContent = request.count + ' souvenirs';
      const pct = Math.min(request.count / 50 * 100, 95);
      progressFill.style.width = pct + '%';
      setStatus('loading', 'Extraction: ' + request.count + ' souvenirs...');
      break;

    case 'extractionComplete':
      const result = request.result;

      if (result.success && result.memories.length > 0) {
        extractedMemories = result.memories;

        // Save to storage
        chrome.runtime.sendMessage({
          action: 'saveMemories',
          memories: extractedMemories
        });

        displayResults();
        setStatus('success', result.memories.length + ' souvenirs extraits');
        log('Terminé: ' + result.memories.length + ' souvenirs', 'success');
        progressFill.style.width = '100%';
      } else {
        setStatus('error', result.error || 'Aucun souvenir trouvé');
        log('Erreur: ' + (result.error || 'Aucun souvenir'), 'error');
      }

      resetUI();
      break;

    case 'statusUpdate':
      setStatus(request.type, request.message);
      break;

    case 'analysisProgress':
      analysisStage.textContent = request.message;
      analysisProgressFill.style.width = request.progress + '%';
      log(request.message, 'info');
      break;

    case 'analysisComplete':
      if (request.results.success) {
        log('Analyse terminée!', 'success');
        reportBtn.disabled = false;
        setStatus('success', 'Analyse terminée - Voir le rapport');
      } else {
        log('Erreur analyse: ' + request.results.error, 'error');
      }
      resetAnalysisUI();
      break;
  }
});
