// What GPT Knows - Popup v5.0
// Multi-screen immersive flow with i18n support

// ========== I18N HELPER ==========
function t(key, substitutions = []) {
  if (chrome?.i18n?.getMessage) {
    const msg = chrome.i18n.getMessage(key, substitutions);
    return msg || key;
  }
  return key;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = t(key);
    if (msg && msg !== key) {
      el.textContent = msg;
    }
  });
}

// ========== STATE ==========
let currentScreen = 'splash';
let memories = [];
let analysisResults = null;
let hasApiKeys = false;
let hasConsented = false;
let apiProvider = null;
let isOnChatGPT = false;
let isExtracting = false;
let isInterrogating = false;
let interrogationResults = [];
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
  applyI18n();
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
  document.getElementById('btnResetSplash').addEventListener('click', restart);

  // Consent screen
  document.getElementById('btnBackFromConsent').addEventListener('click', () => goToScreen('splash'));
  document.getElementById('btnAcceptConsent').addEventListener('click', acceptConsent);

  // Extract screen
  document.getElementById('btnStartExtract').addEventListener('click', startExtraction);
  document.getElementById('btnBackToSplash').addEventListener('click', () => goToScreen('splash'));
  document.getElementById('btnToAnalysis').addEventListener('click', () => {
    console.log('[DEBUG] btnToAnalysis CLICKED');
    handleContinueToAnalysis();
  });
  document.getElementById('btnSkipExtract').addEventListener('click', () => goToScreen('analyze'));

  // Interrogation checkbox toggle
  document.getElementById('enableInterrogation')?.addEventListener('change', (e) => {
    const modesDiv = document.getElementById('interrogationModes');
    if (modesDiv) {
      modesDiv.classList.toggle('hidden', !e.target.checked);
    }
  });

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
    name.textContent = `${firstName} ${lastName}`.trim() || t('splash_yourPersona');
    tagline.textContent = analysisResults.persona.mask.mission || t('splash_tagline');
  } else if (memories.length > 0) {
    initials.textContent = '?';
    name.textContent = t('splash_yourPersona');
    tagline.textContent = t('extract_done_count', [memories.length.toString()]);
  } else {
    initials.textContent = '?';
    name.textContent = t('splash_yourPersona');
    tagline.textContent = t('splash_tagline');
  }
}

// ========== UPDATE EXTRACT SCREEN ==========
function updateExtractScreen() {
  const notReady = document.getElementById('extractNotReady');
  const ready = document.getElementById('extractReady');
  const extracting = document.getElementById('extracting');
  const done = document.getElementById('extractDone');
  const interrogating = document.getElementById('interrogating');
  const btnContinue = document.getElementById('btnToAnalysis');
  const btnSkip = document.getElementById('btnSkipExtract');

  // Hide all states
  notReady.classList.add('hidden');
  ready.classList.add('hidden');
  extracting.classList.add('hidden');
  done.classList.add('hidden');
  interrogating.classList.add('hidden');
  btnSkip.classList.add('hidden');

  if (isInterrogating) {
    interrogating.classList.remove('hidden');
    btnContinue.disabled = true;
  } else if (isExtracting) {
    extracting.classList.remove('hidden');
    btnContinue.disabled = true;
  } else if (memories.length > 0) {
    done.classList.remove('hidden');
    document.getElementById('extractDoneCount').textContent = t('extract_done_count', [memories.length.toString()]);
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
  const modeMaxOption = document.getElementById('modeMaxOption');
  const agentDual = document.getElementById('agent-dual');

  // Hide all states
  noApi.classList.add('hidden');
  ready.classList.add('hidden');
  analyzing.classList.add('hidden');
  done.classList.add('hidden');
  btnSkip.classList.add('hidden');
  modeMaxOption?.classList.add('hidden');

  if (isAnalyzing) {
    analyzing.classList.remove('hidden');
    btnReport.disabled = true;

    // Show dual agent if mode MAX is enabled
    if (document.getElementById('enableModeMax')?.checked) {
      agentDual?.classList.remove('hidden');
    }
  } else if (analysisResults?.success) {
    done.classList.remove('hidden');
    btnReport.disabled = false;
    btnSkip.classList.remove('hidden');
  } else if (!hasApiKeys) {
    noApi.classList.remove('hidden');
    btnReport.disabled = true;
  } else {
    ready.classList.remove('hidden');
    document.getElementById('analyzeReadyCount').textContent = t('analyze_ready_count', [memories.length.toString()]);
    btnReport.disabled = true;

    // Show Mode MAX option if both Anthropic and Google keys are available
    checkModeMaxAvailability();
  }
}

// Check if Mode MAX is available (requires both Anthropic and Google keys)
async function checkModeMaxAvailability() {
  try {
    const keys = await chrome.runtime.sendMessage({ action: 'getApiKeys' });
    const modeMaxOption = document.getElementById('modeMaxOption');

    if (keys?.anthropic && keys?.google) {
      modeMaxOption?.classList.remove('hidden');
    } else {
      modeMaxOption?.classList.add('hidden');
    }
  } catch (e) {
    console.error('Error checking Mode MAX availability:', e);
  }
}

// ========== UPDATE COMPLETE SCREEN ==========
function updateCompleteScreen() {
  const name = document.getElementById('completeName');
  const tagline = document.getElementById('completeTagline');

  if (analysisResults?.persona?.mask?.profile) {
    const profile = analysisResults.persona.mask.profile;
    name.textContent = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || t('complete_title');
    tagline.textContent = t('complete_subtitle');
  } else {
    name.textContent = t('complete_title');
    tagline.textContent = t('complete_subtitle');
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
      throw new Error(t('error_extraction'));
    }

    if (response.error) {
      throw new Error(response.message || t('error_extraction'));
    }

  } catch (error) {
    console.error('Extraction error:', error);
    isExtracting = false;
    updateExtractScreen();
  }
}

// ========== CONTINUE TO ANALYSIS (with optional interrogation) ==========
async function handleContinueToAnalysis() {
  console.log('[DEBUG] ======= handleContinueToAnalysis CALLED =======');

  const checkbox = document.getElementById('enableInterrogation');
  const enableInterrogation = checkbox?.checked;

  console.log('[DEBUG] Checkbox element:', checkbox);
  console.log('[DEBUG] Checkbox checked:', enableInterrogation);
  console.log('[DEBUG] isOnChatGPT:', isOnChatGPT);

  if (enableInterrogation && isOnChatGPT) {
    // Start interrogation first
    console.log('[DEBUG] ✅ Starting interrogation...');
    try {
      await startInterrogation();
      console.log('[DEBUG] Interrogation function returned');
    } catch (err) {
      console.error('[DEBUG] Interrogation error:', err);
      goToScreen('analyze');
    }
  } else {
    // Go directly to analysis
    console.log('[DEBUG] ❌ Skipping interrogation:', { enableInterrogation, isOnChatGPT });
    goToScreen('analyze');
  }
}

// ========== INTERROGATION ==========
async function startInterrogation() {
  if (isInterrogating) {
    console.log('[DEBUG] Interrogation already in progress');
    return;
  }

  try {
    isInterrogating = true;
    updateExtractScreen();

    // Get selected mode
    const modeRadio = document.querySelector('input[name="interrogationMode"]:checked');
    const mode = modeRadio?.value || 'standard';

    console.log('[DEBUG] Interrogation mode:', mode);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[DEBUG] Sending startInterrogation to tab:', tab?.id, tab?.url);

    const response = await sendTabMessage(tab.id, {
      action: 'startInterrogation',
      mode: mode
    });

    console.log('[DEBUG] Content script response:', response);

    if (!response) {
      throw new Error(t('error_extraction') + ' (no response from content script)');
    }

    if (response.error) {
      throw new Error(response.message || t('error_extraction'));
    }

    console.log('[DEBUG] Interrogation started successfully, waiting for completion...');

  } catch (error) {
    console.error('[DEBUG] Interrogation error:', error);
    isInterrogating = false;
    updateExtractScreen();
    // Continue to analysis anyway
    goToScreen('analyze');
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

    // Check if Mode MAX is enabled
    const modeMax = document.getElementById('enableModeMax')?.checked || false;

    // Get browser language for bilingual prompts
    const language = chrome.i18n.getUILanguage()?.startsWith('fr') ? 'fr' : 'en';

    const response = await chrome.runtime.sendMessage({
      action: 'startAnalysis',
      memories: memories,
      options: { modeMax, language }
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

    case 'interrogationProgress':
      console.log('[DEBUG] Received interrogationProgress:', request);
      handleInterrogationProgress(request);
      break;

    case 'interrogationComplete':
      console.log('[DEBUG] Received interrogationComplete:', request);
      handleInterrogationComplete(request);
      break;

    case 'analysisComplete':
      isAnalyzing = false;
      if (request.results.success) {
        analysisResults = request.results;
        setAgentState('extractor', 'done');
        setAgentState('statistician', 'done');
        setAgentState('architect', 'done');
        setAgentState('charterer', 'done');
        // Mark dual as done if Mode MAX was used
        if (request.results.persona?.dualAnalysis) {
          setAgentState('dual', 'done');
        }

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

  // Translate message if it's an i18n key (starts with "agent_" or "Extraction:")
  const translatedMessage = message.startsWith('agent_') ? t(message) : message;
  document.getElementById('analyzingStage').textContent = translatedMessage;
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
    case 'profiling':
      setAgentState('charterer', 'done');
      break;
    case 'dualAnalysis':
      setAgentState('charterer', 'done');
      setAgentState('dual', 'active');
      // Show the dual agent indicator
      document.getElementById('agent-dual')?.classList.remove('hidden');
      break;
  }
}

function handleInterrogationProgress(data) {
  const { current, total, question } = data;
  const statusEl = document.getElementById('interrogationStatus');
  const progressBar = document.getElementById('interrogationProgressBar');

  if (statusEl) {
    statusEl.textContent = `Question ${current}/${total}: ${question}`;
  }
  if (progressBar) {
    progressBar.style.width = `${(current / total) * 100}%`;
  }
}

function handleInterrogationComplete(data) {
  isInterrogating = false;
  interrogationResults = data.results || [];

  console.log(`[Popup] Interrogation complete: ${interrogationResults.length} responses`);

  // Save interrogation results
  if (interrogationResults.length > 0) {
    chrome.runtime.sendMessage({
      action: 'saveInterrogation',
      results: interrogationResults
    });
  }

  // Go to analysis screen
  goToScreen('analyze');
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
  const confirmMsg = `⚠️ ${t('reset_confirm_title')}\n\n${t('reset_confirm_text')}`;
  const confirmed = confirm(confirmMsg);

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
    alert(t('reset_error'));
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
