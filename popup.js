// ChatGPT Memory Extractor - Popup v4.5
// Multi-screen immersive flow

// ========== STATE ==========
let currentScreen = 'splash';
let memories = [];
let analysisResults = null;
let hasApiKeys = false;
let hasConsented = false;
let apiProvider = null;
let isOnChatGPT = false;
let isExtracting = false;
let isAnalyzing = false;

// ========== DOM ELEMENTS ==========
const screens = {
  splash: document.getElementById('screen-splash'),
  consent: document.getElementById('screen-consent'),
  extract: document.getElementById('screen-extract'),
  analyze: document.getElementById('screen-analyze'),
  complete: document.getElementById('screen-complete')
};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  setupListeners();
  updateSplashScreen();
  autoNavigate();
});

// ========== AUTO NAVIGATE ==========
// Navigate to the appropriate screen based on current state
function autoNavigate() {
  if (analysisResults?.success) {
    // Analysis done → go to complete screen
    goToScreen('complete');
  } else if (memories.length > 0 && hasApiKeys) {
    // Has memories and API keys → go to analyze screen
    goToScreen('analyze');
  } else if (memories.length > 0) {
    // Has memories but no API → go to analyze (will show API config)
    goToScreen('analyze');
  }
  // Otherwise stay on splash
}

// ========== LOAD STATE ==========
async function loadState() {
  try {
    // Load memories
    memories = await chrome.runtime.sendMessage({ action: 'getMemories' }) || [];

    // Load analysis results
    analysisResults = await chrome.runtime.sendMessage({ action: 'getAnalysisResults' });

    // Check API keys and determine provider
    const keys = await chrome.runtime.sendMessage({ action: 'getApiKeys' });
    hasApiKeys = keys && (keys.anthropic || keys.openai || keys.google);

    // Determine which provider is configured
    if (keys?.anthropic) apiProvider = 'Anthropic (Claude)';
    else if (keys?.openai) apiProvider = 'OpenAI (GPT)';
    else if (keys?.google) apiProvider = 'Google (Gemini)';

    // Load consent status
    const storage = await chrome.storage.local.get(['hasConsented']);
    hasConsented = storage.hasConsented || false;

    // Check if on ChatGPT
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    isOnChatGPT = tab?.url?.includes('chatgpt.com');

    // Inject content script if on ChatGPT
    if (isOnChatGPT) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (e) {
        // Already injected
      }
    }
  } catch (e) {
    console.error('Error loading state:', e);
  }
}

// ========== SETUP LISTENERS ==========
function setupListeners() {
  // Splash screen - go to consent if not consented, else extract
  document.getElementById('btnDiscover').addEventListener('click', () => {
    if (hasConsented) {
      goToScreen('extract');
    } else {
      updateConsentScreen();
      goToScreen('consent');
    }
  });
  document.getElementById('btnSettings').addEventListener('click', openSettings);

  // Consent screen
  document.getElementById('btnBackFromConsent').addEventListener('click', () => goToScreen('splash'));
  document.getElementById('btnAcceptConsent').addEventListener('click', acceptConsent);

  // Extract screen
  document.getElementById('btnStartExtract').addEventListener('click', startExtraction);
  document.getElementById('btnBackToSplash').addEventListener('click', () => goToScreen('splash'));
  document.getElementById('btnToAnalysis').addEventListener('click', () => goToScreen('analyze'));
  document.getElementById('btnSkipExtract').addEventListener('click', () => goToScreen('analyze'));

  // Analyze screen
  document.getElementById('btnStartAnalyze').addEventListener('click', startAnalysis);
  document.getElementById('btnConfigApi').addEventListener('click', openSettings);
  document.getElementById('btnBackToExtract').addEventListener('click', () => goToScreen('extract'));
  document.getElementById('btnToReport').addEventListener('click', openReport);
  document.getElementById('btnSkipAnalyze').addEventListener('click', () => goToScreen('complete'));

  // Complete screen
  document.getElementById('btnOpenReport').addEventListener('click', openReport);
  document.getElementById('btnRestart').addEventListener('click', restart);
  document.getElementById('btnExportJson').addEventListener('click', exportJson);

  // Message listener
  chrome.runtime.onMessage.addListener(handleMessage);
}

// ========== SCREEN NAVIGATION ==========
function goToScreen(screenId) {
  // Exit current screen
  screens[currentScreen].classList.remove('active');
  screens[currentScreen].classList.add('exit-left');

  // Enter new screen
  setTimeout(() => {
    screens[currentScreen].classList.remove('exit-left');
    screens[screenId].classList.add('active');
    currentScreen = screenId;

    // Update screen state
    switch (screenId) {
      case 'extract':
        updateExtractScreen();
        break;
      case 'analyze':
        updateAnalyzeScreen();
        break;
      case 'complete':
        updateCompleteScreen();
        break;
    }
  }, 150);
}

// ========== UPDATE SPLASH SCREEN ==========
function updateSplashScreen() {
  const initials = document.getElementById('personaInitials');
  const name = document.getElementById('personaName');
  const tagline = document.getElementById('personaTagline');

  if (analysisResults?.persona?.mask?.profile) {
    const profile = analysisResults.persona.mask.profile;
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';

    initials.textContent = (firstName[0] || '?') + (lastName[0] || '');
    name.textContent = `${firstName} ${lastName}`.trim() || 'Votre Persona';
    tagline.textContent = analysisResults.persona.mask.mission || 'Decouvrez qui vous etes selon ChatGPT';
  } else if (memories.length > 0) {
    initials.textContent = '?';
    name.textContent = 'Votre Persona';
    tagline.textContent = `${memories.length} souvenirs prets a analyser`;
  } else {
    initials.textContent = '?';
    name.textContent = 'Votre Persona';
    tagline.textContent = 'Decouvrez qui vous etes selon ChatGPT';
  }
}

// ========== UPDATE EXTRACT SCREEN ==========
function updateExtractScreen() {
  const notReady = document.getElementById('extractNotReady');
  const ready = document.getElementById('extractReady');
  const extracting = document.getElementById('extracting');
  const done = document.getElementById('extractDone');
  const btnContinue = document.getElementById('btnToAnalysis');
  const btnSkip = document.getElementById('btnSkipExtract');

  // Hide all states
  notReady.classList.add('hidden');
  ready.classList.add('hidden');
  extracting.classList.add('hidden');
  done.classList.add('hidden');
  btnSkip.classList.add('hidden');

  if (isExtracting) {
    extracting.classList.remove('hidden');
    btnContinue.disabled = true;
  } else if (memories.length > 0) {
    done.classList.remove('hidden');
    document.getElementById('extractDoneCount').textContent = `${memories.length} souvenirs extraits`;
    btnContinue.disabled = false;
    btnSkip.classList.remove('hidden');
  } else if (isOnChatGPT) {
    ready.classList.remove('hidden');
    btnContinue.disabled = true;
  } else {
    notReady.classList.remove('hidden');
    btnContinue.disabled = true;
  }
}

// ========== UPDATE ANALYZE SCREEN ==========
function updateAnalyzeScreen() {
  const noApi = document.getElementById('analyzeNoApi');
  const ready = document.getElementById('analyzeReady');
  const analyzing = document.getElementById('analyzing');
  const done = document.getElementById('analyzeDone');
  const btnReport = document.getElementById('btnToReport');
  const btnSkip = document.getElementById('btnSkipAnalyze');

  // Hide all states
  noApi.classList.add('hidden');
  ready.classList.add('hidden');
  analyzing.classList.add('hidden');
  done.classList.add('hidden');
  btnSkip.classList.add('hidden');

  if (isAnalyzing) {
    analyzing.classList.remove('hidden');
    btnReport.disabled = true;
  } else if (analysisResults?.success) {
    done.classList.remove('hidden');
    btnReport.disabled = false;
    btnSkip.classList.remove('hidden');
  } else if (!hasApiKeys) {
    noApi.classList.remove('hidden');
    btnReport.disabled = true;
  } else {
    ready.classList.remove('hidden');
    document.getElementById('analyzeReadyCount').textContent = `${memories.length} souvenirs a traiter`;
    btnReport.disabled = true;
  }
}

// ========== UPDATE COMPLETE SCREEN ==========
function updateCompleteScreen() {
  const name = document.getElementById('completeName');
  const tagline = document.getElementById('completeTagline');

  if (analysisResults?.persona?.mask?.profile) {
    const profile = analysisResults.persona.mask.profile;
    name.textContent = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Votre Persona';
    tagline.textContent = 'est pret a etre decouvert';
  } else {
    name.textContent = 'Votre Persona';
    tagline.textContent = 'est pret a etre decouvert';
  }
}

// ========== EXTRACTION ==========
async function startExtraction() {
  if (isExtracting) return;

  try {
    isExtracting = true;
    updateExtractScreen();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const response = await sendTabMessage(tab.id, { action: 'autoExtract' });

    if (!response) {
      throw new Error('Pas de reponse - Rafraichissez la page');
    }

    if (response.error) {
      throw new Error(response.message || 'Echec de l\'extraction');
    }

  } catch (error) {
    console.error('Extraction error:', error);
    isExtracting = false;
    updateExtractScreen();
  }
}

// ========== ANALYSIS ==========
async function startAnalysis() {
  if (isAnalyzing || memories.length === 0) return;

  try {
    isAnalyzing = true;
    updateAnalyzeScreen();

    // Set first agent as active
    setAgentState('extractor', 'active');

    const response = await chrome.runtime.sendMessage({
      action: 'startAnalysis',
      memories: memories
    });

    if (response.error) {
      throw new Error(response.error);
    }

  } catch (error) {
    console.error('Analysis error:', error);
    isAnalyzing = false;
    updateAnalyzeScreen();
  }
}

// ========== MESSAGE HANDLER ==========
function handleMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'progress':
      document.getElementById('extractProgress').textContent = request.count;
      const pct = Math.min(request.count / 50 * 100, 95);
      document.getElementById('extractProgressBar').style.width = pct + '%';
      break;

    case 'extractionComplete':
      isExtracting = false;
      if (request.result.success && request.result.memories.length > 0) {
        memories = request.result.memories;
        chrome.runtime.sendMessage({ action: 'saveMemories', memories });
      }
      updateExtractScreen();
      updateSplashScreen();
      break;

    case 'analysisProgress':
      handleAnalysisProgress(request);
      break;

    case 'analysisComplete':
      isAnalyzing = false;
      if (request.results.success) {
        analysisResults = request.results;
        setAgentState('extractor', 'done');
        setAgentState('statistician', 'done');
        setAgentState('architect', 'done');
        setAgentState('charterer', 'done');

        // Go to complete screen after a short delay
        setTimeout(() => {
          goToScreen('complete');
        }, 1000);
      }
      updateAnalyzeScreen();
      updateSplashScreen();
      break;
  }
}

function handleAnalysisProgress(data) {
  const { stage, progress, message } = data;

  document.getElementById('analyzingStage').textContent = message;
  document.getElementById('analyzeProgressBar').style.width = progress + '%';

  // Update agent states
  switch (stage) {
    case 'extracting':
      setAgentState('extractor', 'active');
      break;
    case 'statistics':
      setAgentState('extractor', 'done');
      setAgentState('statistician', 'active');
      break;
    case 'architecting':
      setAgentState('statistician', 'done');
      setAgentState('architect', 'active');
      break;
    case 'chartering':
      setAgentState('architect', 'done');
      setAgentState('charterer', 'active');
      break;
  }
}

function setAgentState(agentId, state) {
  const agent = document.getElementById('agent-' + agentId);
  if (!agent) return;

  agent.classList.remove('active', 'done');
  if (state) {
    agent.classList.add(state);
  }
}

// ========== CONSENT ==========
function updateConsentScreen() {
  const providerEl = document.getElementById('consentProvider');
  if (providerEl && apiProvider) {
    providerEl.textContent = apiProvider;
  }
}

async function acceptConsent() {
  hasConsented = true;
  await chrome.storage.local.set({ hasConsented: true });
  goToScreen('extract');
}

// ========== ACTIONS ==========
function openSettings() {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
}

function openReport() {
  chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
}

async function restart() {
  const confirmed = confirm(
    '⚠️ Tout reinitialiser ?\n\n' +
    'Cela va supprimer :\n' +
    '• Toutes les memoires extraites\n' +
    '• Le taggage E-E-A-T\n' +
    '• L\'analyse persona\n\n' +
    'Tu devras tout re-extraire depuis ChatGPT.'
  );

  if (!confirmed) return;

  try {
    // Clear all data in background
    await chrome.runtime.sendMessage({ action: 'clearAll' });

    // Reset local state
    memories = [];
    analysisResults = null;
    isExtracting = false;
    isAnalyzing = false;

    // Update UI
    updateSplashScreen();
    goToScreen('splash');

    // Optional: show success feedback
    console.log('[Popup] Full reset complete');

  } catch (e) {
    console.error('Reset error:', e);
    alert('Erreur lors de la reinitialisation.');
  }
}

async function exportJson() {
  if (!analysisResults) return;

  const data = {
    exportDate: new Date().toISOString(),
    persona: analysisResults.persona,
    statistics: analysisResults.statistics,
    memoriesCount: memories.length
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `persona-eeat-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ========== HELPERS ==========
function sendTabMessage(tabId, message) {
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
