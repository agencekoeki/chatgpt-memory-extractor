// Popup script pour l'extension ChatGPT Memory Debug Assistant

// État global
let debugState = {
  currentTab: 'guide',
  logs: [],
  captureHistory: [],
  foundElements: {},
  currentStep: 1
};

// Éléments DOM
const elements = {
  // Tabs
  tabs: document.querySelectorAll('.tab'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Guide tab
  analyzeBtn: document.getElementById('analyzeBtn'),
  guidedBtn: document.getElementById('guidedBtn'),
  scrollBtn: document.getElementById('scrollBtn'),
  pageStatus: document.getElementById('pageStatus'),
  guideResults: document.getElementById('guideResults'),
  guideContent: document.getElementById('guideContent'),
  
  // Debug tab
  foundElements: document.getElementById('foundElements'),
  refreshAnalysis: document.getElementById('refreshAnalysis'),
  exploreModal: document.getElementById('exploreModal'),
  currentUrl: document.getElementById('currentUrl'),
  scrollPos: document.getElementById('scrollPos'),
  
  // Capture tab
  startCapture: document.getElementById('startCapture'),
  capturedElement: document.getElementById('capturedElement'),
  capturedData: document.getElementById('capturedData'),
  copySelector: document.getElementById('copySelector'),
  captureHistory: document.getElementById('captureHistory'),
  
  // Logs tab
  logsContainer: document.getElementById('logsContainer'),
  clearLogs: document.getElementById('clearLogs'),
  exportLogs: document.getElementById('exportLogs'),
  refreshLogs: document.getElementById('refreshLogs'),
  showInfo: document.getElementById('showInfo'),
  showSuccess: document.getElementById('showSuccess'),
  showWarning: document.getElementById('showWarning'),
  showError: document.getElementById('showError'),
  showDebug: document.getElementById('showDebug'),
  
  // Footer
  currentMode: document.getElementById('currentMode')
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupEventListeners();
  await performInitialAnalysis();
  listenForMessages();
});

// Gestion des onglets
function setupTabs() {
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Retirer active de tous
      elements.tabs.forEach(t => t.classList.remove('active'));
      elements.tabContents.forEach(c => c.classList.remove('active'));
      
      // Ajouter active au sélectionné
      tab.classList.add('active');
      const tabId = `tab-${tab.dataset.tab}`;
      document.getElementById(tabId).classList.add('active');
      
      debugState.currentTab = tab.dataset.tab;
      
      // Actions spécifiques par onglet
      if (tab.dataset.tab === 'logs') {
        refreshLogs();
      }
    });
  });
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Guide tab
  elements.analyzeBtn.addEventListener('click', performAnalysis);
  elements.guidedBtn.addEventListener('click', performGuidedExtraction);
  elements.scrollBtn.addEventListener('click', scrollToMemory);
  
  // Debug tab
  elements.refreshAnalysis.addEventListener('click', performAnalysis);
  elements.exploreModal.addEventListener('click', exploreModal);
  
  // Capture tab
  elements.startCapture.addEventListener('click', startElementCapture);
  elements.copySelector.addEventListener('click', copyCapturedSelector);
  
  // Logs tab
  elements.clearLogs.addEventListener('click', clearLogs);
  elements.exportLogs.addEventListener('click', exportLogs);
  elements.refreshLogs.addEventListener('click', refreshLogs);
  
  // Filtres de logs
  [elements.showInfo, elements.showSuccess, elements.showWarning, elements.showError, elements.showDebug]
    .forEach(checkbox => checkbox.addEventListener('change', filterLogs));
}

// Analyse initiale
async function performInitialAnalysis() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url?.includes('chatgpt.com')) {
    updatePageStatus('❌ Vous n\'êtes pas sur ChatGPT', 'error');
    elements.analyzeBtn.textContent = '🌐 Ouvrir ChatGPT';
    elements.analyzeBtn.onclick = () => {
      chrome.tabs.create({ url: 'https://chatgpt.com' });
    };
    return;
  }
  
  await performAnalysis();
}

// Analyser la page
async function performAnalysis() {
  try {
    updatePageStatus('⏳ Analyse en cours...', 'loading');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Injecter le content script si nécessaire
    await injectContentScript(tab.id);
    
    // Demander l'analyse
    const response = await sendMessageToTab(tab.id, { action: 'analyzePage' });
    
    if (!response) {
      updatePageStatus('❌ Pas de réponse du script', 'error');
      return;
    }
    
    // Mettre à jour l'interface
    updateDebugInfo(response);
    updateFoundElements(response.foundElements);
    updateStepIndicator(response);
    
    // Mettre à jour le statut
    if (response.isPersonalization) {
      if (response.foundElements?.manageButton) {
        updatePageStatus('✅ Prêt pour l\'extraction ! Bouton "Gérer" trouvé.', 'success');
        updateStep(3);
      } else if (response.foundElements?.memorySection) {
        updatePageStatus('📍 Section Mémoire visible. Cherchez le bouton "Gérer".', 'warning');
        updateStep(2);
        elements.scrollBtn.classList.remove('hidden');
      } else {
        updatePageStatus('⚠️ Sur Personalization. Scrollez pour voir la section Mémoire.', 'warning');
        updateStep(2);
        elements.scrollBtn.classList.remove('hidden');
      }
    } else if (response.isSettings) {
      updatePageStatus('📋 Dans Settings. Cliquez sur "Personalization".', 'info');
      updateStep(1);
    } else {
      updatePageStatus('📍 Naviguez vers Settings > Personalization', 'info');
      updateStep(1);
    }
    
    // Afficher les logs si disponibles
    if (response.logs) {
      debugState.logs = response.logs;
      displayLogs();
    }
    
  } catch (error) {
    console.error('Erreur:', error);
    updatePageStatus(`❌ Erreur: ${error.message}`, 'error');
  }
}

// Extraction guidée
async function performGuidedExtraction() {
  try {
    updatePageStatus('🚀 Extraction guidée en cours...', 'loading');
    elements.guidedBtn.disabled = true;
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Injecter le content script si nécessaire
    await injectContentScript(tab.id);
    
    // Lancer l'extraction guidée
    const response = await sendMessageToTab(tab.id, { action: 'guidedExtraction' });
    
    if (!response) {
      updatePageStatus('❌ Pas de réponse du script', 'error');
      return;
    }
    
    // Afficher les résultats
    elements.guideResults.classList.remove('hidden');
    
    if (response.success) {
      updatePageStatus('✅ Extraction réussie !', 'success');
      updateStep(4);
      
      let resultHTML = `
        <div class="success-message">
          <h4>✅ ${response.data.length} souvenirs extraits avec succès !</h4>
        </div>
        <div class="memory-list">
      `;
      
      response.data.forEach((memory, index) => {
        resultHTML += `
          <div class="memory-item">
            <strong>#${index + 1}</strong>: ${memory.text.substring(0, 100)}...
          </div>
        `;
      });
      
      resultHTML += `
        </div>
        <button class="btn btn-success" onclick="saveMemories()">
          💾 Sauvegarder en TXT
        </button>
      `;
      
      elements.guideContent.innerHTML = resultHTML;
      
      // Sauvegarder les données
      window.extractedMemories = response.data;
      
    } else {
      updatePageStatus(`⚠️ ${response.message}`, 'warning');
      
      let helpMessage = '<div class="help-message">';
      
      switch(response.step) {
        case 'navigation':
          helpMessage += '<p>👉 Cliquez sur l\'icône ⚙️ Settings en bas à gauche</p>';
          helpMessage += '<p>👉 Puis cliquez sur "Personalization"</p>';
          break;
          
        case 'scroll_to_memory':
        case 'scroll_needed':
          helpMessage += '<p>👉 Scrollez vers le bas pour voir la section "Mémoire"</p>';
          helpMessage += '<button class="btn btn-secondary" onclick="scrollToMemory()">📜 Scroller automatiquement</button>';
          break;
          
        case 'button_not_found':
          helpMessage += '<p>👉 Le bouton "Gérer" devrait être visible près de "92% utilisé"</p>';
          helpMessage += '<p>👉 Essayez de rafraîchir la page</p>';
          break;
          
        case 'modal_not_found':
          helpMessage += '<p>👉 La modale ne s\'est pas ouverte</p>';
          helpMessage += '<p>👉 Réessayez de cliquer sur "Gérer"</p>';
          break;
          
        case 'no_memories':
          helpMessage += '<p>🔬 Mode exploration activé. Voici le contenu trouvé :</p>';
          if (response.modalContent) {
            helpMessage += '<div class="code-block"><pre>' + 
              JSON.stringify(response.modalContent, null, 2) + 
              '</pre></div>';
          }
          break;
      }
      
      helpMessage += '</div>';
      elements.guideContent.innerHTML = helpMessage;
    }
    
    // Afficher les logs
    if (response.logs) {
      debugState.logs = response.logs;
      displayLogs();
    }
    
  } catch (error) {
    console.error('Erreur:', error);
    updatePageStatus(`❌ Erreur: ${error.message}`, 'error');
  } finally {
    elements.guidedBtn.disabled = false;
  }
}

// Mettre à jour le statut de la page
function updatePageStatus(message, type = 'info') {
  elements.pageStatus.innerHTML = `<p>${message}</p>`;
  elements.pageStatus.className = 'status-box ' + type;
}

// Mettre à jour les informations de debug
function updateDebugInfo(info) {
  elements.currentUrl.textContent = info.url || '-';
  elements.scrollPos.textContent = `${info.scrollPosition || 0}px / ${info.documentHeight || 0}px`;
}

// Mettre à jour la liste des éléments trouvés
function updateFoundElements(foundElements) {
  if (!foundElements) return;
  
  const items = [
    { key: 'settingsMenu', label: '⚙️ Menu Settings', found: foundElements.settingsMenu },
    { key: 'personalizationSection', label: '👤 Section Personalization', found: foundElements.personalizationSection },
    { key: 'memorySection', label: '🧠 Section Mémoire', found: foundElements.memorySection },
    { key: 'manageButton', label: '🔧 Bouton Gérer', found: foundElements.manageButton },
    { key: 'modal', label: '📋 Modale ouverte', found: foundElements.modal }
  ];
  
  let html = '';
  items.forEach(item => {
    const className = item.found ? 'element-item found' : 'element-item not-found';
    const icon = item.found ? '✅' : '❌';
    html += `
      <div class="${className}">
        <span class="element-icon">${icon}</span>
        <span>${item.label}</span>
      </div>
    `;
  });
  
  elements.foundElements.innerHTML = html;
}

// Mettre à jour l'indicateur d'étapes
function updateStepIndicator(info) {
  // Réinitialiser
  document.querySelectorAll('.step').forEach(s => {
    s.classList.remove('active', 'completed');
  });
  
  if (info.isPersonalization && info.foundElements?.manageButton) {
    updateStep(3);
  } else if (info.isPersonalization) {
    updateStep(2);
  } else if (info.isSettings) {
    updateStep(1);
  }
}

// Mettre à jour l'étape active
function updateStep(stepNumber) {
  debugState.currentStep = stepNumber;
  
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`step-${i}`);
    if (i < stepNumber) {
      stepEl.classList.add('completed');
    } else if (i === stepNumber) {
      stepEl.classList.add('active');
    }
  }
}

// Démarrer la capture d'élément
async function startElementCapture() {
  try {
    elements.startCapture.disabled = true;
    elements.startCapture.textContent = '⏳ Capture en cours...';
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await injectContentScript(tab.id);
    
    const response = await sendMessageToTab(tab.id, { action: 'captureElement' });
    
    if (response?.status === 'capture_started') {
      elements.startCapture.textContent = '👁️ Survolez et cliquez sur un élément';
      
      // Timeout de 30 secondes
      setTimeout(() => {
        elements.startCapture.disabled = false;
        elements.startCapture.textContent = '🎯 Démarrer la capture';
      }, 30000);
    }
    
  } catch (error) {
    console.error('Erreur:', error);
    elements.startCapture.disabled = false;
    elements.startCapture.textContent = '🎯 Démarrer la capture';
  }
}

// Afficher les logs
function displayLogs() {
  const filters = {
    info: elements.showInfo.checked,
    success: elements.showSuccess.checked,
    warning: elements.showWarning.checked,
    error: elements.showError.checked,
    debug: elements.showDebug.checked
  };
  
  let html = '';
  debugState.logs.forEach(log => {
    if (!filters[log.level]) return;
    
    html += `
      <div class="log-entry">
        <span class="log-time">${log.timestamp}</span>
        <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
        <span class="log-message">${log.message}</span>
      </div>
    `;
  });
  
  elements.logsContainer.innerHTML = html || '<div class="log-entry">Aucun log</div>';
}

// Filtrer les logs
function filterLogs() {
  displayLogs();
}

// Effacer les logs
async function clearLogs() {
  debugState.logs = [];
  displayLogs();
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await sendMessageToTab(tab.id, { action: 'clearLogs' });
}

// Exporter les logs
function exportLogs() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `chatgpt-memory-debug-${timestamp}.txt`;
  
  let content = '=== ChatGPT Memory Debug Logs ===\n\n';
  
  debugState.logs.forEach(log => {
    content += `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}\n`;
    if (log.data) {
      content += `  Data: ${JSON.stringify(log.data, null, 2)}\n`;
    }
    content += '\n';
  });
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Rafraîchir les logs
async function refreshLogs() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const response = await sendMessageToTab(tab.id, { action: 'getLogs' });
  
  if (response?.logs) {
    debugState.logs = response.logs;
    displayLogs();
  }
}

// Scroller vers la mémoire
async function scrollToMemory() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await sendMessageToTab(tab.id, { action: 'scrollToMemory' });
}

// Explorer la modale
async function exploreModal() {
  // À implémenter
  alert('Cette fonctionnalité sera disponible bientôt');
}

// Copier le sélecteur capturé
function copyCapturedSelector() {
  const selector = elements.capturedData.textContent;
  if (selector) {
    navigator.clipboard.writeText(selector);
    elements.copySelector.textContent = '✅ Copié !';
    setTimeout(() => {
      elements.copySelector.textContent = '📋 Copier le sélecteur';
    }, 2000);
  }
}

// Sauvegarder les mémoires
window.saveMemories = function() {
  if (!window.extractedMemories) return;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `chatgpt-memory-${timestamp}.txt`;
  
  let content = '=== ChatGPT Memory Export (Debug) ===\n';
  content += `Date: ${new Date().toLocaleString('fr-FR')}\n`;
  content += `Nombre: ${window.extractedMemories.length}\n\n`;
  
  window.extractedMemories.forEach((memory, index) => {
    content += `[${index + 1}] ${memory.text}\n\n`;
  });
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Injecter le content script
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  } catch (e) {
    // Le script est probablement déjà injecté
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

// Écouter les messages du content script
function listenForMessages() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'debugLog') {
      debugState.logs.push(request.log);
      if (debugState.currentTab === 'logs') {
        displayLogs();
      }
    } else if (request.action === 'elementCaptured') {
      // Afficher l'élément capturé
      elements.capturedElement.classList.remove('hidden');
      elements.capturedData.textContent = JSON.stringify(request.element, null, 2);
      
      // Ajouter à l'historique
      debugState.captureHistory.push(request.element);
      updateCaptureHistory();
      
      // Réactiver le bouton
      elements.startCapture.disabled = false;
      elements.startCapture.textContent = '🎯 Démarrer la capture';
    }
  });
}

// Mettre à jour l'historique des captures
function updateCaptureHistory() {
  let html = '';
  debugState.captureHistory.forEach((capture, index) => {
    html += `
      <div class="capture-item">
        <strong>#${index + 1}</strong> ${capture.tag} - ${capture.selector || 'N/A'}
      </div>
    `;
  });
  elements.captureHistory.innerHTML = html || '<p>Aucune capture</p>';
}
