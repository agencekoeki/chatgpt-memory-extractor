// ChatGPT Memory Extractor - Content Script v3
// Focus : EXTRACTION COMPLETE avec visualisation

let extractionState = {
  mode: 'waiting',
  memories: [],
  totalFound: 0,
  isExtracting: false
};

// ========== LOGGING SIMPLE ==========
function log(message, data = null, level = 'info') {
  const styles = {
    info: 'color: #0066cc;',
    success: 'color: #00aa00; font-weight: bold;',
    warning: 'color: #ff9900;',
    error: 'color: #cc0000; font-weight: bold;'
  };
  
  console.log(`%c[Memory Extractor] ${message}`, styles[level], data || '');
  
  // Envoyer à la popup pour affichage
  chrome.runtime.sendMessage({
    action: 'log',
    message,
    data,
    level
  }).catch(() => {});
}

// ========== DETECTION DES ELEMENTS ==========
function detectPageState() {
  const state = {
    isPersonalization: window.location.href.includes('#settings/Personalization'),
    hasMemorySection: false,
    hasManageButton: false,
    hasModal: false,
    manageButton: null,
    modal: null
  };
  
  // Chercher la section mémoire (92% utilisé)
  const memoryIndicator = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.includes('% utilisé')
  );
  
  if (memoryIndicator) {
    state.hasMemorySection = true;
    log('✓ Section Mémoire détectée', null, 'success');
    
    // Chercher le bouton Gérer proche
    let parent = memoryIndicator.parentElement;
    for (let i = 0; i < 5 && parent; i++) {
      const buttons = parent.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        const text = btn.textContent?.trim().toLowerCase();
        if (text === 'gérer' || text === 'manage') {
          state.hasManageButton = true;
          state.manageButton = btn;
          highlightElement(btn, '#00ff00');
          log('✓ Bouton Gérer trouvé et surligné en vert', null, 'success');
          break;
        }
      }
      if (state.hasManageButton) break;
      parent = parent.parentElement;
    }
  }
  
  // Chercher une modale ouverte
  const modal = document.querySelector('[role="dialog"]') || 
                document.querySelector('[aria-modal="true"]');
  if (modal && modal.offsetHeight > 0) {
    state.hasModal = true;
    state.modal = modal;
    log('✓ Modale ouverte détectée', null, 'success');
  }
  
  return state;
}

// ========== HIGHLIGHT VISUEL ==========
function highlightElement(element, color = '#ff0000', temporary = false) {
  if (!element) return;
  
  const originalStyle = element.style.cssText;
  element.style.outline = `3px solid ${color}`;
  element.style.outlineOffset = '2px';
  element.style.transition = 'outline 0.3s';
  
  if (temporary) {
    setTimeout(() => {
      element.style.cssText = originalStyle;
    }, 3000);
  }
}

// ========== EXTRACTION PRINCIPALE ==========
async function extractAllMemories() {
  log('🚀 Début de l\'extraction complète...', null, 'info');
  extractionState.isExtracting = true;
  extractionState.memories = [];
  
  const state = detectPageState();
  
  // Étape 1: Vérifier qu'on est au bon endroit
  if (!state.isPersonalization) {
    log('❌ Naviguez vers Settings > Personalization d\'abord', null, 'error');
    return { success: false, error: 'wrong_page', memories: [] };
  }
  
  // Étape 2: Chercher et cliquer sur Gérer
  if (!state.hasModal || !isCorrectModal(state.modal)) {
    if (state.manageButton) {
      log('🔍 Clic sur le bouton Gérer...', null, 'info');
      state.manageButton.click();
      
      // Attendre l'ouverture de la BONNE modale
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Chercher spécifiquement la modale "Souvenirs enregistrés"
      let correctModal = null;
      const allModals = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
      
      for (const modal of allModals) {
        // La modale des souvenirs contient "Souvenirs enregistrés" et "Tout supprimer"
        if (modal.textContent.includes('Souvenirs enregistrés') || 
            (modal.textContent.includes('% utilisé') && modal.textContent.includes('Tout supprimer'))) {
          correctModal = modal;
          log('✓ Modale "Souvenirs enregistrés" trouvée!', null, 'success');
          break;
        }
      }
      
      if (!correctModal) {
        log('❌ La modale "Souvenirs enregistrés" ne s\'est pas ouverte', null, 'error');
        return { success: false, error: 'modal_failed', memories: [] };
      }
      
      state.modal = correctModal;
    } else {
      log('❌ Bouton "Gérer" non trouvé', null, 'error');
      return { success: false, error: 'no_manage_button', memories: [] };
    }
  }
  
  // Vérifier qu'on a la bonne modale
  if (!isCorrectModal(state.modal)) {
    log('❌ Mauvaise modale détectée', null, 'error');
    return { success: false, error: 'wrong_modal', memories: [] };
  }
  
  // Étape 3: Extraire TOUS les souvenirs avec scroll
  const memories = await extractMemoriesFromModal(state.modal);
  
  extractionState.memories = memories;
  extractionState.totalFound = memories.length;
  extractionState.isExtracting = false;
  
  if (memories.length > 0) {
    log(`✅ Extraction terminée: ${memories.length} VRAIS souvenirs !`, null, 'success');
    return { success: true, memories };
  } else {
    log('⚠️ Aucun souvenir trouvé', null, 'warning');
    return { success: false, error: 'no_memories', memories: [] };
  }
}

// ========== VERIFIER SI C'EST LA BONNE MODALE ==========
function isCorrectModal(modal) {
  if (!modal) return false;
  
  const modalText = modal.textContent;
  
  // La bonne modale contient :
  // - "Souvenirs enregistrés" ou "Memory"
  // - "% utilisé"
  // - "Tout supprimer" ou "Delete all"
  // Et NE contient PAS :
  // - "Personnalisation"
  // - "Notifications"
  // - "Applications"
  
  const hasMemoryIndicators = 
    (modalText.includes('Souvenirs enregistrés') || modalText.includes('Memory')) &&
    modalText.includes('% utilisé') &&
    (modalText.includes('Tout supprimer') || modalText.includes('Delete all'));
  
  const hasSettingsIndicators = 
    modalText.includes('Personnalisation') ||
    modalText.includes('Notifications') ||
    modalText.includes('Applications');
  
  return hasMemoryIndicators && !hasSettingsIndicators;
}

// ========== ATTENDRE LA MODALE ==========
async function waitForModal(timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const modal = document.querySelector('[role="dialog"]');
    if (modal && modal.offsetHeight > 0) {
      log('✓ Modale ouverte !', null, 'success');
      return modal;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return null;
}

// ========== EXTRACTION AVEC SCROLL ==========
async function extractMemoriesFromModal(modal) {
  log('📜 Extraction avec scroll automatique...', null, 'info');
  
  // IMPORTANT: Vérifier qu'on est dans la BONNE modale (Souvenirs enregistrés)
  const modalTitle = modal.textContent;
  if (!modalTitle.includes('Souvenirs enregistrés') && !modalTitle.includes('Memory')) {
    log('⚠️ Ce n\'est pas la modale des souvenirs!', null, 'warning');
    
    // Chercher spécifiquement la modale avec "Souvenirs enregistrés"
    const allModals = document.querySelectorAll('[role="dialog"]');
    let correctModal = null;
    
    for (const m of allModals) {
      if (m.textContent.includes('Souvenirs enregistrés') || 
          m.textContent.includes('% utilisé')) {
        correctModal = m;
        modal = correctModal;
        log('✓ Bonne modale trouvée!', null, 'success');
        break;
      }
    }
    
    if (!correctModal) {
      log('❌ Modale "Souvenirs enregistrés" non trouvée', null, 'error');
      return [];
    }
  }
  
  const allMemories = [];
  const seenTexts = new Set();
  
  // Trouver le conteneur scrollable DANS LA MODALE
  const scrollContainer = findScrollContainer(modal);
  if (!scrollContainer) {
    log('⚠️ Pas de conteneur scrollable, extraction simple', null, 'warning');
    return extractVisibleMemories(modal);
  }
  
  log('✓ Conteneur scrollable trouvé dans la modale', null, 'success');
  
  // Variables pour le scroll
  let previousCount = 0;
  let noNewMemoriesCount = 0;
  const maxIterations = 100;
  let iteration = 0;
  
  // Boucle d'extraction avec scroll
  while (iteration < maxIterations) {
    iteration++;
    
    // Extraire les souvenirs visibles DANS LA MODALE seulement
    const visibleMemories = extractVisibleMemories(modal);
    
    // Ajouter les nouveaux
    let newCount = 0;
    for (const memory of visibleMemories) {
      // Filtrer les textes qui ne sont PAS des souvenirs
      if (!seenTexts.has(memory.text) && isRealMemory(memory.text)) {
        seenTexts.add(memory.text);
        allMemories.push(memory);
        newCount++;
        
        // Highlight temporaire
        if (memory.element) {
          highlightElement(memory.element, '#00ff00', true);
        }
      }
    }
    
    // Afficher la progression
    if (newCount > 0) {
      log(`📊 Progression: ${allMemories.length} souvenirs extraits (+${newCount})`, null, 'info');
      
      chrome.runtime.sendMessage({
        action: 'extractionProgress',
        count: allMemories.length,
        newCount
      }).catch(() => {});
    }
    
    // Vérifier si on a trouvé de nouveaux souvenirs
    if (allMemories.length === previousCount) {
      noNewMemoriesCount++;
      if (noNewMemoriesCount >= 3) {
        log('✅ Plus de nouveaux souvenirs, extraction complète', null, 'success');
        break;
      }
    } else {
      noNewMemoriesCount = 0;
    }
    
    previousCount = allMemories.length;
    
    // Scroller pour charger plus
    const hasMore = await scrollForMore(scrollContainer);
    if (!hasMore) {
      log('✅ Fin du scroll atteinte', null, 'success');
      break;
    }
    
    // Attendre le chargement
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return allMemories;
}

// ========== VERIFIER SI C'EST UN VRAI SOUVENIR ==========
function isRealMemory(text) {
  // Filtrer les textes qui NE SONT PAS des souvenirs
  const notMemoryPatterns = [
    'Personnalisation',
    'Personnalité de ChatGPT',
    'Définissez le style',
    'Mémoires de référence',
    'historique des enregistrements',
    'En savoir plus',
    'Par défaut',
    'Mode d\'enregistrement',
    'Laissez ChatGPT'
  ];
  
  // Si le texte contient un de ces patterns, ce n'est PAS un souvenir
  for (const pattern of notMemoryPatterns) {
    if (text.includes(pattern)) {
      return false;
    }
  }
  
  // Un vrai souvenir contient généralement :
  // - "souhaite", "préfère", "aime", "travaille", "utilise", etc.
  // - Ou commence par "L'utilisateur", "Sébastien", un nom, etc.
  return true;
}

// ========== TROUVER LE CONTENEUR SCROLLABLE ==========
function findScrollContainer(modal) {
  // Chercher un élément avec overflow scroll/auto
  const elements = modal.querySelectorAll('*');
  
  for (const el of elements) {
    const style = window.getComputedStyle(el);
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && 
        el.scrollHeight > el.clientHeight) {
      return el;
    }
  }
  
  // Fallback: la modale elle-même
  if (modal.scrollHeight > modal.clientHeight) {
    return modal;
  }
  
  return null;
}

// ========== EXTRAIRE LES SOUVENIRS VISIBLES ==========
function extractVisibleMemories(container) {
  const memories = [];
  
  // Stratégie 1: Chercher les divs qui contiennent les souvenirs
  // On cherche des patterns comme ceux qu'on voit dans les captures
  const divs = container.querySelectorAll('div');
  
  for (const div of divs) {
    const text = div.textContent?.trim();
    
    // Filtres pour identifier un souvenir
    if (text && 
        text.length > 30 && // Au moins 30 caractères
        text.length < 2000 && // Pas trop long
        !isSystemText(text) && // Pas un texte système
        !hasNestedDivs(div)) { // Pas un conteneur parent
      
      memories.push({
        text: text,
        element: div,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Stratégie 2: Si aucun souvenir, chercher par structure spécifique
  if (memories.length === 0) {
    const items = container.querySelectorAll('[class*="flex"]');
    for (const item of items) {
      const text = item.textContent?.trim();
      if (text && text.length > 30 && !isSystemText(text)) {
        memories.push({
          text: text,
          element: item,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return memories;
}

// ========== VERIFIER SI C'EST DU TEXTE SYSTEME ==========
function isSystemText(text) {
  const systemWords = [
    '% utilisé', 
    'Souvenirs enregistrés',
    'Tout supprimer',
    'Delete all',
    'Gérer',
    'Manage',
    'Close',
    'Fermer'
  ];
  
  return systemWords.some(word => text.includes(word));
}

// ========== VERIFIER SI UN DIV A DES SOUS-DIVS ==========
function hasNestedDivs(div) {
  const childDivs = div.querySelectorAll('div');
  return childDivs.length > 3; // Si plus de 3 sous-divs, c'est probablement un conteneur
}

// ========== SCROLLER POUR CHARGER PLUS ==========
async function scrollForMore(container) {
  const beforeScroll = container.scrollTop;
  const maxScroll = container.scrollHeight - container.clientHeight;
  
  // Si on est déjà en bas
  if (beforeScroll >= maxScroll - 10) {
    // Double vérification après une petite attente
    await new Promise(resolve => setTimeout(resolve, 500));
    const newMaxScroll = container.scrollHeight - container.clientHeight;
    if (container.scrollTop >= newMaxScroll - 10) {
      return false; // Vraiment fini
    }
  }
  
  // Scroller par étapes plus grandes pour aller plus vite
  container.scrollTop = Math.min(beforeScroll + 500, maxScroll);
  
  // Attendre un peu plus pour le chargement
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Vérifier si on a scrollé
  return container.scrollTop > beforeScroll;
}

// ========== MESSAGES HANDLER ==========
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  switch(request.action) {
    case 'detectState':
      const state = detectPageState();
      sendResponse(state);
      break;
      
    case 'startExtraction':
      if (!extractionState.isExtracting) {
        // IMPORTANT: Répondre immédiatement pour éviter le timeout
        sendResponse({ 
          started: true,
          message: 'Extraction démarrée'
        });
        
        // Lancer l'extraction en async (sans await)
        extractAllMemories().then(result => {
          // Envoyer le résultat final via un nouveau message
          chrome.runtime.sendMessage({
            action: 'extractionComplete',
            result: result
          }).catch(() => {});
        });
        
      } else {
        sendResponse({ 
          success: false, 
          error: 'already_extracting',
          message: 'Extraction déjà en cours...'
        });
      }
      break;
      
    case 'getStatus':
      sendResponse({
        isExtracting: extractionState.isExtracting,
        totalFound: extractionState.totalFound,
        memories: extractionState.memories
      });
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
  
  return true;
});

// ========== INITIALISATION ==========
log('🧠 Memory Extractor chargé', { url: window.location.href }, 'info');

// Détecter l'état initial
setTimeout(() => {
  const state = detectPageState();
  chrome.runtime.sendMessage({
    action: 'stateUpdate',
    state
  }).catch(() => {});
}, 1000);
