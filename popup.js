// ChatGPT Memory Extractor - Popup v3
// Focus : Interface simple pour extraction complète

let extractedMemories = [];
let isExtracting = false;

// Éléments DOM
const elements = {
  statusIndicator: document.getElementById('statusIndicator'),
  statusText: document.getElementById('statusText'),
  progressInfo: document.getElementById('progressInfo'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  extractBtn: document.getElementById('extractBtn'),
  results: document.getElementById('results'),
  resultsCount: document.getElementById('resultsCount'),
  resultsPreview: document.getElementById('resultsPreview'),
  saveBtn: document.getElementById('saveBtn'),
  copyBtn: document.getElementById('copyBtn'),
  consoleContent: document.getElementById('consoleContent'),
  consoleLogs: document.getElementById('consoleLogs'),
  toggleConsole: document.getElementById('toggleConsole'),
  clearConsole: document.getElementById('clearConsole'),
  // Steps
  steps: {
    1: document.getElementById('step1'),
    2: document.getElementById('step2'),
    3: document.getElementById('step3'),
    4: document.getElementById('step4')
  },
  stepStatus: {
    1: document.getElementById('status1'),
    2: document.getElementById('status2'),
    3: document.getElementById('status3'),
    4: document.getElementById('status4')
  }
};

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await checkCurrentPage();
});

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  // Bouton principal
  elements.extractBtn.addEventListener('click', startExtraction);
  
  // Boutons de résultat
  elements.saveBtn.addEventListener('click', saveToFile);
  elements.copyBtn.addEventListener('click', copyToClipboard);
  
  // Console
  elements.toggleConsole.addEventListener('click', toggleConsole);
  elements.clearConsole.addEventListener('click', clearConsole);
}

// ========== VERIFIER LA PAGE ==========
async function checkCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url?.includes('chatgpt.com')) {
      updateStatus('❌ Ouvrez ChatGPT d\'abord', 'error');
      updateStep(1, 'waiting');
      elements.extractBtn.disabled = true;
      return;
    }
    
    updateStep(1, 'completed');
    
    // Injecter le content script
    await injectContentScript(tab.id);
    
    // Demander l'état de la page
    const state = await sendMessage(tab.id, { action: 'detectState' });
    
    if (!state) {
      updateStatus('⚠️ Rafraîchissez la page', 'error');
      return;
    }
    
    updatePageState(state);
    
  } catch (error) {
    addLog(`Erreur: ${error.message}`, 'error');
    updateStatus('❌ Erreur de connexion', 'error');
  }
}

// ========== METTRE A JOUR L'ETAT ==========
function updatePageState(state) {
  // Reset
  for (let i = 2; i <= 4; i++) {
    updateStep(i, 'waiting');
  }
  
  if (state.isPersonalization) {
    updateStep(2, 'completed');
    
    if (state.hasMemorySection) {
      updateStep(3, 'completed');
      
      if (state.hasManageButton) {
        updateStep(4, 'completed');
        updateStatus('✅ Prêt à extraire !', 'ready');
        elements.extractBtn.disabled = false;
        
        // Changer le texte du bouton
        elements.extractBtn.querySelector('.btn-text').textContent = 'LANCER L\'EXTRACTION';
        elements.extractBtn.querySelector('.btn-subtitle').textContent = 'Le bouton "Gérer" est détecté (vert sur la page)';
        
      } else {
        updateStep(4, 'active');
        updateStatus('📍 Scrollez pour voir le bouton "Gérer"', 'info');
        elements.extractBtn.disabled = true;
      }
    } else {
      updateStep(3, 'active');
      updateStatus('📍 Scrollez vers la section "Mémoire"', 'info');
      elements.extractBtn.disabled = true;
    }
  } else {
    updateStep(2, 'active');
    updateStatus('📍 Allez dans Settings > Personalization', 'info');
    elements.extractBtn.disabled = true;
  }
  
  if (state.hasModal) {
    updateStatus('📋 Modale ouverte - Prêt à extraire', 'ready');
    elements.extractBtn.disabled = false;
  }
}

// ========== EXTRACTION ==========
async function startExtraction() {
  if (isExtracting) return;
  
  try {
    isExtracting = true;
    elements.extractBtn.disabled = true;
    
    updateStatus('🔄 Extraction en cours...', 'extracting');
    elements.progressInfo.classList.remove('hidden');
    elements.results.classList.add('hidden');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    addLog('🚀 Démarrage de l\'extraction...', 'info');
    
    const response = await sendMessage(tab.id, { action: 'startExtraction' });
    
    if (!response) {
      throw new Error('Pas de réponse du script - Rafraîchissez la page');
    }
    
    if (response.started) {
      // L'extraction est lancée, on attend le message de fin
      addLog('⏳ Extraction en cours, veuillez patienter...', 'info');
      updateStatus('⏳ Extraction en cours... Ne fermez pas la fenêtre', 'extracting');
    } else if (response.error) {
      throw new Error(response.message || 'Extraction échouée');
    }
    
  } catch (error) {
    addLog(`❌ Erreur: ${error.message}`, 'error');
    updateStatus(`❌ ${error.message}`, 'error');
    isExtracting = false;
    elements.extractBtn.disabled = false;
    elements.progressInfo.classList.add('hidden');
    setTimeout(checkCurrentPage, 1000);
  }
}

// ========== AFFICHER LES RESULTATS ==========
function displayResults() {
  elements.results.classList.remove('hidden');
  elements.resultsCount.textContent = `${extractedMemories.length} souvenirs`;
  
  // Aperçu des premiers souvenirs
  let preview = '';
  const maxPreview = Math.min(5, extractedMemories.length);
  
  for (let i = 0; i < maxPreview; i++) {
    preview += `${i + 1}. ${extractedMemories[i].text.substring(0, 100)}...\n\n`;
  }
  
  if (extractedMemories.length > maxPreview) {
    preview += `... et ${extractedMemories.length - maxPreview} autres souvenirs`;
  }
  
  elements.resultsPreview.textContent = preview;
}

// ========== SAUVEGARDER EN FICHIER ==========
function saveToFile() {
  if (extractedMemories.length === 0) {
    addLog('Aucun souvenir à sauvegarder', 'warning');
    return;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `chatgpt-memories-${timestamp}.txt`;
  
  let content = '=================================================\n';
  content += '         CHATGPT MEMORY EXPORT\n';
  content += '=================================================\n\n';
  content += `Date d'extraction : ${new Date().toLocaleString('fr-FR')}\n`;
  content += `Nombre total de souvenirs : ${extractedMemories.length}\n`;
  content += '=================================================\n\n';
  
  extractedMemories.forEach((memory, index) => {
    content += `--- SOUVENIR ${index + 1} ---\n`;
    content += `${memory.text}\n`;
    content += '\n' + '-'.repeat(50) + '\n\n';
  });
  
  content += '\n=================================================\n';
  content += 'Extrait avec ChatGPT Memory Extractor v3.0\n';
  content += '=================================================';
  
  // Créer et télécharger
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  addLog(`✅ Sauvegardé: ${filename}`, 'success');
  
  // Feedback visuel
  elements.saveBtn.textContent = '✅ Sauvegardé !';
  setTimeout(() => {
    elements.saveBtn.innerHTML = '💾 Sauvegarder en TXT';
  }, 2000);
}

// ========== COPIER DANS LE PRESSE-PAPIER ==========
async function copyToClipboard() {
  if (extractedMemories.length === 0) {
    addLog('Aucun souvenir à copier', 'warning');
    return;
  }
  
  const text = extractedMemories.map((m, i) => 
    `${i + 1}. ${m.text}`
  ).join('\n\n');
  
  try {
    await navigator.clipboard.writeText(text);
    addLog('✅ Copié dans le presse-papier', 'success');
    
    // Feedback visuel
    elements.copyBtn.textContent = '✅ Copié !';
    setTimeout(() => {
      elements.copyBtn.innerHTML = '📋 Copier tout';
    }, 2000);
  } catch (error) {
    addLog('Erreur lors de la copie', 'error');
  }
}

// ========== UTILITAIRES ==========
function updateStatus(text, type = 'info') {
  elements.statusText.textContent = text;
  elements.statusIndicator.className = 'status-indicator';
  
  if (type === 'ready') {
    elements.statusIndicator.classList.add('ready');
  } else if (type === 'extracting') {
    elements.statusIndicator.classList.add('extracting');
  } else if (type === 'error') {
    elements.statusIndicator.classList.add('error');
  }
  
  // Mettre à jour l'icône
  const icon = elements.statusIndicator.querySelector('.status-icon');
  if (type === 'ready') icon.textContent = '✅';
  else if (type === 'extracting') icon.textContent = '⚙️';
  else if (type === 'error') icon.textContent = '❌';
  else if (type === 'success') icon.textContent = '🎉';
  else icon.textContent = '⏳';
}

function updateStep(stepNum, status) {
  const step = elements.steps[stepNum];
  const statusEl = elements.stepStatus[stepNum];
  
  if (!step || !statusEl) return;
  
  // Reset classes
  step.classList.remove('active', 'completed');
  
  if (status === 'active') {
    step.classList.add('active');
    statusEl.textContent = '🔄';
  } else if (status === 'completed') {
    step.classList.add('completed');
    statusEl.textContent = '✅';
  } else {
    statusEl.textContent = '⏳';
  }
}

// ========== CONSOLE ==========
function addLog(message, level = 'info') {
  const logEl = document.createElement('div');
  logEl.className = `console-log ${level}`;
  logEl.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  elements.consoleLogs.appendChild(logEl);
  
  // Auto-scroll
  elements.consoleLogs.scrollTop = elements.consoleLogs.scrollHeight;
}

function toggleConsole() {
  const isHidden = elements.consoleContent.classList.toggle('hidden');
  elements.toggleConsole.textContent = isHidden ? '▼' : '▲';
}

function clearConsole() {
  elements.consoleLogs.innerHTML = '';
}

// ========== COMMUNICATION ==========
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch (e) {
    // Déjà injecté probablement
  }
}

function sendMessage(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Erreur:', chrome.runtime.lastError);
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

// ========== MESSAGES LISTENER ==========
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'log') {
    addLog(request.message, request.level);
    
  } else if (request.action === 'extractionProgress') {
    // Mettre à jour la progression
    elements.progressText.textContent = `${request.count} souvenirs extraits...`;
    
    // Animation de la barre (estimation)
    const estimatedProgress = Math.min(request.count / 100 * 100, 90);
    elements.progressFill.style.width = `${estimatedProgress}%`;
    
  } else if (request.action === 'extractionComplete') {
    // Extraction terminée !
    const result = request.result;
    
    if (result.success) {
      extractedMemories = result.memories;
      displayResults();
      updateStatus(`✅ ${result.memories.length} souvenirs extraits !`, 'success');
      addLog(`✅ Extraction terminée: ${result.memories.length} souvenirs`, 'success');
    } else {
      updateStatus(`❌ ${result.error || 'Extraction échouée'}`, 'error');
      addLog(`❌ Erreur: ${result.error}`, 'error');
    }
    
    isExtracting = false;
    elements.extractBtn.disabled = false;
    elements.progressInfo.classList.add('hidden');
    
    // Recheck la page
    setTimeout(checkCurrentPage, 1000);
    
  } else if (request.action === 'stateUpdate') {
    updatePageState(request.state);
  }
});

// ========== REFRESH PERIODIQUE ==========
setInterval(async () => {
  if (!isExtracting) {
    await checkCurrentPage();
  }
}, 5000);
