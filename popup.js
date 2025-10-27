// Popup script pour l'extension ChatGPT Memory Extractor

let extractedMemories = [];

// Éléments DOM
const elements = {
  extractBtn: document.getElementById('extractBtn'),
  navigateBtn: document.getElementById('navigateBtn'),
  saveBtn: document.getElementById('saveBtn'),
  copyBtn: document.getElementById('copyBtn'),
  statusIndicator: document.getElementById('statusIndicator'),
  statusText: document.getElementById('statusText'),
  results: document.getElementById('results'),
  error: document.getElementById('error'),
  errorMessage: document.getElementById('errorMessage'),
  memoryCount: document.getElementById('memoryCount'),
  memoryPreview: document.getElementById('memoryPreview'),
  lastExtract: document.getElementById('lastExtract')
};

// Au chargement de la popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkCurrentPage();
  loadLastExtractTime();
});

// Vérifier la page actuelle
async function checkCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('chatgpt.com')) {
      updateStatus('Veuillez ouvrir ChatGPT', 'error');
      elements.extractBtn.disabled = true;
      elements.navigateBtn.textContent = 'Ouvrir ChatGPT';
      elements.navigateBtn.onclick = () => {
        chrome.tabs.create({ url: 'https://chatgpt.com/#settings/Personalization' });
      };
      return;
    }
    
    // Envoyer un message au content script pour vérifier la page
    const response = await sendMessageToTab(tab.id, { action: 'checkPage' });
    
    if (response && response.isSettingsPage) {
      updateStatus('Prêt à extraire', 'active');
      elements.extractBtn.disabled = false;
    } else {
      updateStatus('Naviguez vers les paramètres', '');
      elements.extractBtn.disabled = true;
    }
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    updateStatus('Erreur de connexion', 'error');
  }
}

// Envoyer un message au content script
function sendMessageToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Erreur de communication:', chrome.runtime.lastError);
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

// Bouton d'extraction
elements.extractBtn.addEventListener('click', async () => {
  try {
    elements.extractBtn.disabled = true;
    updateStatus('Extraction en cours...', 'loading');
    showError('');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Injecter le content script si nécessaire
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).catch(() => {}); // Ignorer l'erreur si déjà injecté
    
    // Attendre un peu pour que le script soit chargé
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Demander l'extraction
    const result = await sendMessageToTab(tab.id, { action: 'extractMemory' });
    
    if (!result) {
      throw new Error('Pas de réponse du script. Veuillez rafraîchir la page et réessayer.');
    }
    
    if (result.success) {
      extractedMemories = result.data;
      displayResults(result.data);
      updateStatus(`✅ ${result.count} souvenirs extraits`, 'active');
      saveLastExtractTime();
    } else {
      throw new Error(result.error || 'Erreur inconnue');
    }
    
  } catch (error) {
    console.error('Erreur:', error);
    showError(error.message);
    updateStatus('Échec de l\'extraction', 'error');
  } finally {
    elements.extractBtn.disabled = false;
  }
});

// Bouton de navigation
elements.navigateBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url.includes('chatgpt.com')) {
    // Naviguer vers les paramètres
    chrome.tabs.update(tab.id, { url: 'https://chatgpt.com/#settings/Personalization' });
    // Attendre un peu et vérifier à nouveau
    setTimeout(() => checkCurrentPage(), 2000);
  } else {
    // Ouvrir ChatGPT dans un nouvel onglet
    chrome.tabs.create({ url: 'https://chatgpt.com/#settings/Personalization' });
    window.close();
  }
});

// Afficher les résultats
function displayResults(memories) {
  if (!memories || memories.length === 0) {
    showError('Aucun souvenir trouvé. Assurez-vous que la fenêtre de mémoire est ouverte.');
    return;
  }
  
  elements.results.classList.remove('hidden');
  elements.memoryCount.textContent = `${memories.length} souvenirs`;
  
  // Créer l'aperçu
  elements.memoryPreview.innerHTML = '';
  memories.forEach((memory, index) => {
    const item = document.createElement('div');
    item.className = 'memory-item';
    item.textContent = `${index + 1}. ${memory.text}`;
    elements.memoryPreview.appendChild(item);
  });
}

// Sauvegarder en TXT
elements.saveBtn.addEventListener('click', () => {
  if (extractedMemories.length === 0) {
    showError('Aucune mémoire à sauvegarder');
    return;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `chatgpt-memory-${timestamp}.txt`;
  
  // Créer le contenu du fichier
  let content = '=== ChatGPT Memory Export ===\n';
  content += `Date d'extraction: ${new Date().toLocaleString('fr-FR')}\n`;
  content += `Nombre de souvenirs: ${extractedMemories.length}\n`;
  content += '=' .repeat(50) + '\n\n';
  
  extractedMemories.forEach((memory, index) => {
    content += `[${index + 1}] ${memory.text}\n\n`;
    content += '-'.repeat(40) + '\n\n';
  });
  
  content += '\n=== Fin de l\'export ===\n';
  content += `Extrait avec ChatGPT Memory Extractor v1.0.0`;
  
  // Créer et télécharger le fichier
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  // Feedback visuel
  const originalText = elements.saveBtn.innerHTML;
  elements.saveBtn.innerHTML = '✅ Sauvegardé !';
  setTimeout(() => {
    elements.saveBtn.innerHTML = originalText;
  }, 2000);
});

// Copier dans le presse-papiers
elements.copyBtn.addEventListener('click', async () => {
  if (extractedMemories.length === 0) {
    showError('Aucune mémoire à copier');
    return;
  }
  
  const text = extractedMemories.map((m, i) => `${i + 1}. ${m.text}`).join('\n\n');
  
  try {
    await navigator.clipboard.writeText(text);
    
    // Feedback visuel
    const originalText = elements.copyBtn.innerHTML;
    elements.copyBtn.innerHTML = '✅ Copié !';
    setTimeout(() => {
      elements.copyBtn.innerHTML = originalText;
    }, 2000);
  } catch (error) {
    showError('Impossible de copier dans le presse-papiers');
  }
});

// Mettre à jour le statut
function updateStatus(text, type = '') {
  elements.statusText.textContent = text;
  elements.statusIndicator.className = 'status-indicator';
  if (type) {
    elements.statusIndicator.classList.add(type);
  }
}

// Afficher une erreur
function showError(message) {
  if (message) {
    elements.error.classList.remove('hidden');
    elements.errorMessage.textContent = message;
  } else {
    elements.error.classList.add('hidden');
  }
}

// Sauvegarder l'heure de la dernière extraction
function saveLastExtractTime() {
  const now = new Date().toISOString();
  chrome.storage.local.set({ lastExtractTime: now });
  loadLastExtractTime();
}

// Charger l'heure de la dernière extraction
function loadLastExtractTime() {
  chrome.storage.local.get(['lastExtractTime'], (result) => {
    if (result.lastExtractTime) {
      const date = new Date(result.lastExtractTime);
      const relative = getRelativeTime(date);
      elements.lastExtract.textContent = `Dernière extraction: ${relative}`;
    }
  });
}

// Obtenir le temps relatif
function getRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'à l\'instant';
}

// Raccourcis clavier
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !elements.extractBtn.disabled) {
    elements.extractBtn.click();
  } else if (e.key === 's' && e.ctrlKey && extractedMemories.length > 0) {
    e.preventDefault();
    elements.saveBtn.click();
  }
});
