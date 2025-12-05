// ChatGPT Memory Extractor - Settings Page v1.0

const $ = id => document.getElementById(id);

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupListeners();
});

// ========== LOAD SETTINGS ==========
async function loadSettings() {
  try {
    // Load API keys
    const keysResponse = await chrome.runtime.sendMessage({ action: 'getApiKeys' });
    if (keysResponse) {
      $('anthropicKey').value = keysResponse.anthropic || '';
      $('openaiKey').value = keysResponse.openai || '';
      $('googleKey').value = keysResponse.google || '';
    }

    // Load preferences
    const settingsResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (settingsResponse) {
      $('preferredProvider').value = settingsResponse.preferredProvider || 'anthropic';
      $('labelerModel').value = settingsResponse.labelerModel || 'haiku';
      $('profilerModel').value = settingsResponse.profilerModel || 'opus';
      $('autoAnalyze').checked = settingsResponse.autoAnalyze || false;
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

// ========== SETUP LISTENERS ==========
function setupListeners() {
  $('saveBtn').addEventListener('click', saveSettings);
  $('testBtn').addEventListener('click', testKeys);
  $('backBtn').addEventListener('click', (e) => {
    e.preventDefault();
    window.close();
  });
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

    // Save preferences
    const settings = {
      preferredProvider: $('preferredProvider').value,
      labelerModel: $('labelerModel').value,
      profilerModel: $('profilerModel').value,
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
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keys.google}`;
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

  if (results.length === 0) {
    showStatus('error', 'Aucune clé API à tester');
  } else {
    const hasError = results.some(r => !r.includes(' OK'));
    showStatus(hasError ? 'error' : 'success', results.join(' | '));
  }
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
