// ChatGPT Memory Extractor - Settings Page v1.0

const $ = id => document.getElementById(id);

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupListeners();
});

// ========== MODEL DEFINITIONS ==========
const LABELER_MODELS = {
  anthropic: { value: 'haiku', label: 'Claude 4.5 Haiku' },
  openai: { value: 'mini', label: 'GPT-4o Mini' },
  google: { value: 'flash', label: 'Gemini 2.0 Flash' }
};

const PROFILER_MODELS = {
  anthropic: [
    { value: 'opus', label: 'Claude 4.5 Opus' },
    { value: 'sonnet', label: 'Claude 4.5 Sonnet' }
  ],
  openai: [
    { value: 'standard', label: 'GPT-4o' }
  ],
  google: [
    { value: 'pro', label: 'Gemini 2.0 Pro' }
  ]
};

// ========== LOAD SETTINGS ==========
async function loadSettings() {
  try {
    // Load API keys
    const keysResponse = await chrome.runtime.sendMessage({ action: 'getApiKeys' });
    const keys = keysResponse || {};

    $('anthropicKey').value = keys.anthropic || '';
    $('openaiKey').value = keys.openai || '';
    $('googleKey').value = keys.google || '';

    // Populate model dropdowns based on available keys
    populateModelDropdowns(keys);

    // Load preferences
    const settingsResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (settingsResponse) {
      // Set selected values if they exist in options
      if (settingsResponse.labelerModel) {
        const labelerSelect = $('labelerModel');
        if ([...labelerSelect.options].some(o => o.value === settingsResponse.labelerModel)) {
          labelerSelect.value = settingsResponse.labelerModel;
        }
      }
      if (settingsResponse.profilerModel) {
        const profilerSelect = $('profilerModel');
        if ([...profilerSelect.options].some(o => o.value === settingsResponse.profilerModel)) {
          profilerSelect.value = settingsResponse.profilerModel;
        }
      }
      $('autoAnalyze').checked = settingsResponse.autoAnalyze || false;
    }

    // Listen for key changes to update dropdowns
    $('anthropicKey').addEventListener('input', updateDropdownsFromKeys);
    $('openaiKey').addEventListener('input', updateDropdownsFromKeys);
    $('googleKey').addEventListener('input', updateDropdownsFromKeys);

  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

// ========== POPULATE MODEL DROPDOWNS ==========
function populateModelDropdowns(keys) {
  const labelerSelect = $('labelerModel');
  const profilerSelect = $('profilerModel');

  // Clear existing options
  labelerSelect.innerHTML = '';
  profilerSelect.innerHTML = '';

  const hasAnthropic = keys.anthropic?.trim();
  const hasOpenAI = keys.openai?.trim();
  const hasGoogle = keys.google?.trim();

  // Labeler models (one per provider)
  if (hasAnthropic) {
    labelerSelect.add(new Option(LABELER_MODELS.anthropic.label, LABELER_MODELS.anthropic.value));
  }
  if (hasOpenAI) {
    labelerSelect.add(new Option(LABELER_MODELS.openai.label, LABELER_MODELS.openai.value));
  }
  if (hasGoogle) {
    labelerSelect.add(new Option(LABELER_MODELS.google.label, LABELER_MODELS.google.value));
  }

  // Profiler models (multiple per provider)
  if (hasAnthropic) {
    PROFILER_MODELS.anthropic.forEach(m => {
      profilerSelect.add(new Option(m.label, m.value));
    });
  }
  if (hasOpenAI) {
    PROFILER_MODELS.openai.forEach(m => {
      profilerSelect.add(new Option(m.label, m.value));
    });
  }
  if (hasGoogle) {
    PROFILER_MODELS.google.forEach(m => {
      profilerSelect.add(new Option(m.label, m.value));
    });
  }

  // Update hints
  const noKeys = !hasAnthropic && !hasOpenAI && !hasGoogle;
  $('labelerHint').textContent = noKeys
    ? 'Ajoutez une clé API ci-dessus'
    : 'Modèles disponibles selon vos clés';
  $('profilerHint').textContent = noKeys
    ? 'Ajoutez une clé API ci-dessus'
    : 'Modèles disponibles selon vos clés';
}

function updateDropdownsFromKeys() {
  const keys = {
    anthropic: $('anthropicKey').value,
    openai: $('openaiKey').value,
    google: $('googleKey').value
  };
  populateModelDropdowns(keys);
}

// ========== SETUP LISTENERS ==========
function setupListeners() {
  $('saveBtn').addEventListener('click', saveSettings);
  $('testBtn').addEventListener('click', testKeys);
  $('backBtn').addEventListener('click', (e) => {
    e.preventDefault();
    window.close();
  });
  $('resetKeepKeys').addEventListener('click', () => resetData(false));
  $('resetAll').addEventListener('click', () => resetData(true));
}

// ========== SAVE SETTINGS ==========
async function saveSettings() {
  try {
    // Save API keys
    const keys = {
      anthropic: $('anthropicKey').value.trim(),
      openai: $('openaiKey').value.trim(),
      google: $('googleKey').value.trim()
    };
    await chrome.runtime.sendMessage({ action: 'saveApiKeys', keys });

    // Save preferences (provider is auto-detected from selected model)
    const labelerModel = $('labelerModel').value;
    const profilerModel = $('profilerModel').value;

    // Determine provider from model selection
    let preferredProvider = 'anthropic';
    if (['mini', 'standard'].includes(profilerModel)) preferredProvider = 'openai';
    else if (['flash', 'pro'].includes(profilerModel)) preferredProvider = 'google';

    const settings = {
      preferredProvider,
      labelerModel,
      profilerModel,
      autoAnalyze: $('autoAnalyze').checked
    };
    await chrome.runtime.sendMessage({ action: 'saveSettings', settings });

    showStatus('success', 'Paramètres sauvegardés!');
  } catch (e) {
    showStatus('error', 'Erreur: ' + e.message);
  }
}

// ========== TEST KEYS ==========
async function testKeys() {
  const keys = {
    anthropic: $('anthropicKey').value.trim(),
    openai: $('openaiKey').value.trim(),
    google: $('googleKey').value.trim()
  };

  // Check if any keys to test
  if (!keys.anthropic && !keys.openai && !keys.google) {
    showStatus('error', 'Aucune clé API à tester');
    return;
  }

  // Show loading state
  showStatus('loading', '⏳ Test en cours...');
  $('testBtn').disabled = true;

  const results = [];

  // Test Anthropic
  if (keys.anthropic) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keys.anthropic,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      if (response.ok) {
        results.push('Anthropic OK');
      } else {
        const error = await response.json();
        results.push('Anthropic: ' + (error.error?.message || 'Erreur'));
      }
    } catch (e) {
      results.push('Anthropic: ' + e.message);
    }
  }

  // Test OpenAI
  if (keys.openai) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.openai}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      if (response.ok) {
        results.push('OpenAI OK');
      } else {
        const error = await response.json();
        results.push('OpenAI: ' + (error.error?.message || 'Erreur'));
      }
    } catch (e) {
      results.push('OpenAI: ' + e.message);
    }
  }

  // Test Google
  if (keys.google) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keys.google}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hi' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      if (response.ok) {
        results.push('Google OK');
      } else {
        const error = await response.json();
        results.push('Google: ' + (error.error?.message || 'Erreur'));
      }
    } catch (e) {
      results.push('Google: ' + e.message);
    }
  }

  // Re-enable button
  $('testBtn').disabled = false;

  // Show results
  const hasError = results.some(r => !r.includes(' OK'));
  showStatus(hasError ? 'error' : 'success', results.join(' | '));
}

// ========== STATUS ==========
function showStatus(type, message) {
  const status = $('status');
  status.className = 'status ' + type;
  status.textContent = message;
  status.style.display = 'block';

  setTimeout(() => {
    status.style.display = 'none';
  }, 5000);
}

// ========== RESET DATA ==========
async function resetData(includeKeys) {
  const message = includeKeys
    ? '⚠️ TOUT SUPPRIMER ?\n\n' +
      'Cela va supprimer :\n' +
      '• Toutes les mémoires extraites\n' +
      '• Le taggage E-E-A-T\n' +
      '• L\'analyse persona\n' +
      '• VOS CLÉS API\n\n' +
      'Cette action est irréversible !'
    : '⚠️ Réinitialiser les données ?\n\n' +
      'Cela va supprimer :\n' +
      '• Toutes les mémoires extraites\n' +
      '• Le taggage E-E-A-T\n' +
      '• L\'analyse persona\n\n' +
      'Vos clés API seront conservées.';

  if (!confirm(message)) return;

  try {
    // Save API keys if we want to keep them
    let savedKeys = null;
    if (!includeKeys) {
      savedKeys = await chrome.runtime.sendMessage({ action: 'getApiKeys' });
    }

    // Clear all data
    await chrome.runtime.sendMessage({ action: 'clearAll' });

    // Also delete IndexedDB completely to be sure
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase('MemoryExtractorDB');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });

    // Restore API keys if needed
    if (savedKeys && !includeKeys) {
      // Wait a bit for the DB to be recreated
      await new Promise(r => setTimeout(r, 500));
      await chrome.runtime.sendMessage({ action: 'saveApiKeys', keys: savedKeys });
    }

    showStatus('success', includeKeys
      ? '✓ Tout a été supprimé !'
      : '✓ Données réinitialisées (clés API conservées)');

    // Clear form if keys were deleted
    if (includeKeys) {
      $('anthropicKey').value = '';
      $('openaiKey').value = '';
      $('googleKey').value = '';
    }

  } catch (e) {
    console.error('Reset error:', e);
    showStatus('error', 'Erreur: ' + e.message);
  }
}
