// Content script MODE DEBUG - Assistant pour comprendre ChatGPT Memory DOM

// État global
let debugState = {
  mode: 'debug', // 'debug' ou 'extract'
  currentStep: 'init',
  logs: [],
  foundElements: {},
  memoryData: []
};

// Fonction de log améliorée
function debugLog(message, data = null, level = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = {
    timestamp,
    message,
    data,
    level
  };
  
  debugState.logs.push(logEntry);
  
  // Log dans la console avec style
  const styles = {
    info: 'color: #0066cc; font-weight: bold;',
    success: 'color: #00aa00; font-weight: bold;',
    warning: 'color: #ff9900; font-weight: bold;',
    error: 'color: #cc0000; font-weight: bold;',
    debug: 'color: #666666;'
  };
  
  console.log(`%c[Memory Debug ${timestamp}] ${message}`, styles[level], data);
  
  // Envoyer à la popup
  chrome.runtime.sendMessage({
    action: 'debugLog',
    log: logEntry
  }).catch(() => {});
}

// Analyser la page actuelle
function analyzePage() {
  debugLog('🔍 Analyse de la page en cours...', window.location.href);
  
  const pageInfo = {
    url: window.location.href,
    isSettings: window.location.href.includes('#settings'),
    isPersonalization: window.location.href.includes('#settings/Personalization'),
    scrollPosition: window.scrollY,
    documentHeight: document.body.scrollHeight,
    visibleHeight: window.innerHeight
  };
  
  debugLog('📄 Informations de la page:', pageInfo, 'debug');
  
  // Rechercher les éléments clés
  findKeyElements();
  
  return pageInfo;
}

// Rechercher les éléments clés de l'interface
function findKeyElements() {
  debugLog('🎯 Recherche des éléments clés...');
  
  // Rechercher le menu Settings
  const settingsMenu = document.querySelector('[data-testid*="settings"], [aria-label*="Settings"], nav');
  if (settingsMenu) {
    debugState.foundElements.settingsMenu = true;
    debugLog('✓ Menu Settings trouvé', {selector: 'nav ou aria-label Settings'}, 'success');
  }
  
  // Rechercher la section Personnalisation
  const personalizationSection = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.includes('Personalisation') || 
    el.textContent?.includes('Personalization') ||
    el.textContent?.includes('Personnalisation')
  );
  
  if (personalizationSection) {
    debugState.foundElements.personalizationSection = true;
    debugLog('✓ Section Personnalisation trouvée', {
      tag: personalizationSection.tagName,
      classes: personalizationSection.className,
      id: personalizationSection.id
    }, 'success');
  }
  
  // Rechercher la section Mémoire (peut nécessiter scroll)
  const memorySection = findMemorySection();
  if (memorySection.found) {
    debugState.foundElements.memorySection = true;
    debugLog('✓ Section Mémoire trouvée', memorySection.info, 'success');
  } else {
    debugLog('⚠️ Section Mémoire non visible - scroll nécessaire ?', null, 'warning');
  }
  
  // Rechercher le bouton Gérer
  const manageButton = findManageButton();
  if (manageButton) {
    debugState.foundElements.manageButton = true;
    debugLog('✓ Bouton Gérer trouvé', {
      text: manageButton.textContent,
      tag: manageButton.tagName,
      classes: manageButton.className
    }, 'success');
    
    // Marquer visuellement le bouton
    highlightElement(manageButton, 'green');
  } else {
    debugLog('❌ Bouton Gérer non trouvé', null, 'warning');
  }
  
  // Rechercher une modale ouverte
  const modal = findModal();
  if (modal) {
    debugState.foundElements.modal = true;
    debugLog('✓ Modale détectée', {
      role: modal.getAttribute('role'),
      classes: modal.className
    }, 'success');
    
    // Analyser le contenu de la modale
    analyzeModalContent(modal);
  }
}

// Rechercher la section Mémoire
function findMemorySection() {
  const possibleTexts = ['Mémoire', 'Memory', 'Souvenirs', '% utilisé'];
  
  for (const text of possibleTexts) {
    const elements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent?.includes(text) && 
      !el.textContent?.includes('script') &&
      el.offsetHeight > 0
    );
    
    if (elements.length > 0) {
      const element = elements[0];
      return {
        found: true,
        info: {
          text: element.textContent.substring(0, 100),
          position: element.getBoundingClientRect(),
          needsScroll: element.getBoundingClientRect().top > window.innerHeight
        }
      };
    }
  }
  
  return { found: false };
}

// Rechercher le bouton Gérer amélioré
function findManageButton() {
  debugLog('🔎 Recherche du bouton Gérer...');
  
  // Stratégie 1: Recherche par texte exact
  const buttonTexts = ['Gérer', 'Manage', 'Gerer'];
  
  for (const text of buttonTexts) {
    // Rechercher tous les boutons
    const buttons = [...document.querySelectorAll('button'), 
                     ...document.querySelectorAll('[role="button"]'),
                     ...document.querySelectorAll('[type="button"]')];
    
    for (const button of buttons) {
      const buttonText = button.textContent?.trim().toLowerCase();
      if (buttonText === text.toLowerCase()) {
        debugLog(`✓ Bouton trouvé par texte: "${text}"`, null, 'success');
        return button;
      }
    }
  }
  
  // Stratégie 2: Recherche près de "% utilisé"
  const percentElement = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.includes('% utilisé')
  );
  
  if (percentElement) {
    debugLog('📍 Élément "% utilisé" trouvé, recherche du bouton proche...');
    
    // Chercher un bouton dans le parent ou les siblings
    let parent = percentElement.parentElement;
    let depth = 0;
    
    while (parent && depth < 5) {
      const nearbyButtons = parent.querySelectorAll('button, [role="button"]');
      if (nearbyButtons.length > 0) {
        debugLog(`✓ Bouton trouvé près de "% utilisé"`, null, 'success');
        return nearbyButtons[0];
      }
      parent = parent.parentElement;
      depth++;
    }
  }
  
  debugLog('❌ Aucun bouton Gérer trouvé', null, 'error');
  return null;
}

// Rechercher une modale
function findModal() {
  const modalSelectors = [
    '[role="dialog"]',
    '[role="alertdialog"]',
    '[aria-modal="true"]',
    'div[class*="modal"]',
    'div[class*="overlay"]',
    'div[class*="dialog"]'
  ];
  
  for (const selector of modalSelectors) {
    const modal = document.querySelector(selector);
    if (modal && modal.offsetHeight > 0) {
      return modal;
    }
  }
  
  return null;
}

// Analyser le contenu de la modale
async function analyzeModalContent(modal) {
  debugLog('📊 Analyse du contenu de la modale...');
  
  // Compter les éléments
  const stats = {
    divs: modal.querySelectorAll('div').length,
    paragraphs: modal.querySelectorAll('p').length,
    spans: modal.querySelectorAll('span').length,
    buttons: modal.querySelectorAll('button').length,
    totalText: modal.textContent?.length
  };
  
  debugLog('📈 Statistiques de la modale:', stats);
  
  // IMPORTANT: Scroller dans la modale pour charger tous les souvenirs
  const memories = await extractAllMemoriesWithScroll(modal);
  
  if (memories.length > 0) {
    debugLog(`✅ ${memories.length} souvenirs extraits!`, memories, 'success');
    debugState.memoryData = memories;
  } else {
    debugLog('⚠️ Aucun souvenir détecté', null, 'warning');
    // Mode exploration
    exploreModalTexts(modal);
  }
}

// Extraire TOUS les souvenirs en scrollant
async function extractAllMemoriesWithScroll(modal) {
  debugLog('🔄 Extraction avec scroll pour charger tous les souvenirs...');
  
  const allMemories = [];
  const processedTexts = new Set();
  let previousCount = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 20; // Limite pour éviter une boucle infinie
  
  // Trouver le conteneur scrollable dans la modale
  const scrollContainer = findScrollableContainer(modal);
  if (!scrollContainer) {
    debugLog('❌ Conteneur scrollable non trouvé', null, 'error');
    return findMemoryPatterns(modal); // Fallback sans scroll
  }
  
  debugLog('📜 Conteneur scrollable trouvé, début du scroll...', null, 'info');
  
  // Boucle de scroll pour charger tous les souvenirs
  while (scrollAttempts < maxScrollAttempts) {
    // Extraire les souvenirs actuellement visibles
    const currentMemories = findMemoryPatterns(modal);
    
    // Ajouter les nouveaux souvenirs
    currentMemories.forEach(memory => {
      if (!processedTexts.has(memory.text)) {
        processedTexts.add(memory.text);
        allMemories.push(memory);
      }
    });
    
    debugLog(`📝 ${allMemories.length} souvenirs trouvés jusqu'à présent...`, null, 'info');
    
    // Vérifier si on a trouvé de nouveaux souvenirs
    if (allMemories.length === previousCount) {
      // Plus de nouveaux souvenirs, on a tout extrait
      debugLog('✅ Tous les souvenirs ont été extraits', null, 'success');
      break;
    }
    
    previousCount = allMemories.length;
    
    // Scroller vers le bas
    const scrolledToBottom = await scrollModalToBottom(scrollContainer);
    
    if (scrolledToBottom) {
      debugLog('📍 Fin du scroll atteinte', null, 'info');
      // Faire une dernière extraction
      const finalMemories = findMemoryPatterns(modal);
      finalMemories.forEach(memory => {
        if (!processedTexts.has(memory.text)) {
          processedTexts.add(memory.text);
          allMemories.push(memory);
        }
      });
      break;
    }
    
    // Attendre que le nouveau contenu se charge
    await new Promise(resolve => setTimeout(resolve, 1000));
    scrollAttempts++;
  }
  
  debugLog(`🎉 Extraction terminée: ${allMemories.length} souvenirs totaux`, null, 'success');
  return allMemories;
}

// Trouver le conteneur scrollable dans la modale
function findScrollableContainer(modal) {
  // Stratégie 1: Chercher un élément avec overflow scroll/auto
  const elements = modal.querySelectorAll('*');
  for (const el of elements) {
    const style = window.getComputedStyle(el);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      if (el.scrollHeight > el.clientHeight) {
        debugLog('✓ Conteneur scrollable trouvé par style', null, 'success');
        return el;
      }
    }
  }
  
  // Stratégie 2: Chercher par classes communes pour les scrollables
  const scrollableSelectors = [
    '[class*="scroll"]',
    '[class*="overflow"]',
    '[class*="modal-body"]',
    '[class*="content"]',
    '[class*="list"]'
  ];
  
  for (const selector of scrollableSelectors) {
    const el = modal.querySelector(selector);
    if (el && el.scrollHeight > el.clientHeight) {
      debugLog('✓ Conteneur scrollable trouvé par classe', null, 'success');
      return el;
    }
  }
  
  // Stratégie 3: Utiliser la modale elle-même si elle est scrollable
  if (modal.scrollHeight > modal.clientHeight) {
    debugLog('✓ La modale elle-même est scrollable', null, 'success');
    return modal;
  }
  
  return null;
}

// Scroller le conteneur vers le bas
async function scrollModalToBottom(container) {
  const previousScrollTop = container.scrollTop;
  const maxScroll = container.scrollHeight - container.clientHeight;
  
  // Scroller par étapes pour déclencher le lazy loading
  const scrollStep = 200; // Pixels à scroller à chaque étape
  container.scrollTop = Math.min(previousScrollTop + scrollStep, maxScroll);
  
  // Attendre un peu pour le rendu
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Vérifier si on a atteint le bas
  const currentScrollTop = container.scrollTop;
  const isAtBottom = currentScrollTop >= maxScroll - 10; // Petite marge
  
  return isAtBottom;
}

// Trouver les patterns de souvenirs
function findMemoryPatterns(container) {
  const memories = [];
  const processedTexts = new Set();
  
  // Stratégie améliorée basée sur la structure visible
  const allDivs = container.querySelectorAll('div');
  
  allDivs.forEach((div, index) => {
    const text = div.textContent?.trim();
    
    // Filtres améliorés
    if (text && 
        text.length > 30 && 
        text.length < 1000 &&
        !isSystemText(text) &&
        !processedTexts.has(text)) {
      
      // Vérifier que ce n'est pas un conteneur parent
      const childDivs = div.querySelectorAll('div');
      if (childDivs.length <= 2) {
        processedTexts.add(text);
        
        memories.push({
          text: text,
          index: index,
          selector: generateSelector(div),
          classes: div.className,
          id: div.id
        });
        
        // Marquer visuellement
        highlightElement(div, 'blue', true);
      }
    }
  });
  
  return memories;
}

// Générer un sélecteur CSS pour un élément
function generateSelector(element) {
  if (element.id) return `#${element.id}`;
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c).join('.');
    if (classes) return `.${classes}`;
  }
  return element.tagName.toLowerCase();
}

// Explorer tous les textes de la modale
function exploreModalTexts(modal) {
  debugLog('🔬 Mode exploration - Affichage de tous les textes...');
  
  const texts = [];
  const elements = modal.querySelectorAll('*');
  
  elements.forEach((el, index) => {
    // Obtenir le texte direct (sans les enfants)
    const directText = Array.from(el.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent?.trim())
      .join(' ')
      .trim();
    
    if (directText && directText.length > 20) {
      texts.push({
        index: index,
        tag: el.tagName,
        text: directText.substring(0, 200),
        fullLength: directText.length
      });
    }
  });
  
  debugLog(`📝 ${texts.length} textes trouvés dans la modale:`, texts);
  
  return texts;
}

// Vérifier si c'est du texte système
function isSystemText(text) {
  const systemTexts = [
    '% utilisé', 'Souvenirs enregistrés', 'Tout supprimer', 'Delete all',
    'Gérer', 'Manage', 'Close', 'Fermer', 'Cancel', 'Annuler',
    'Mémoire', 'Memory', 'Settings', 'Paramètres', 'Personalization',
    'Enregistrer', 'Save', 'OK', 'Appliquer'
  ];
  
  return systemTexts.some(st => text.includes(st)) || text.length < 30;
}

// Marquer visuellement un élément
function highlightElement(element, color = 'red', temporary = false) {
  if (!element) return;
  
  const originalStyle = element.style.cssText;
  element.style.outline = `3px solid ${color}`;
  element.style.outlineOffset = '2px';
  
  if (temporary) {
    setTimeout(() => {
      element.style.cssText = originalStyle;
    }, 3000);
  }
}

// Fonction pour scroller vers un élément
async function scrollToElement(element) {
  if (!element) return false;
  
  debugLog('📜 Scroll vers l\'élément...', null, 'info');
  
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
}

// Fonction guidée étape par étape
async function guidedExtraction() {
  debugLog('🚀 Démarrage de l\'extraction guidée...', null, 'info');
  
  // Étape 1: Vérifier qu'on est sur la bonne page
  const pageInfo = analyzePage();
  
  if (!pageInfo.isPersonalization) {
    return {
      success: false,
      step: 'navigation',
      message: 'Veuillez d\'abord naviguer vers Settings > Personalization',
      logs: debugState.logs
    };
  }
  
  // Étape 2: Chercher la section Mémoire
  debugLog('📍 Étape 2: Recherche de la section Mémoire...', null, 'info');
  const memorySection = findMemorySection();
  
  if (!memorySection.found) {
    return {
      success: false,
      step: 'scroll_needed',
      message: 'Section Mémoire non visible. Essayez de scroller vers le bas.',
      logs: debugState.logs
    };
  }
  
  if (memorySection.info.needsScroll) {
    debugLog('📜 La section Mémoire nécessite un scroll', null, 'warning');
    // Suggérer de scroller
    return {
      success: false,
      step: 'scroll_to_memory',
      message: 'La section Mémoire est plus bas. Scrollez pour la voir.',
      scrollNeeded: true,
      logs: debugState.logs
    };
  }
  
  // Étape 3: Chercher le bouton Gérer
  debugLog('📍 Étape 3: Recherche du bouton Gérer...', null, 'info');
  const manageButton = findManageButton();
  
  if (!manageButton) {
    return {
      success: false,
      step: 'button_not_found',
      message: 'Bouton "Gérer" non trouvé. Vérifiez que la section Mémoire est visible.',
      logs: debugState.logs
    };
  }
  
  // Étape 4: Cliquer sur le bouton
  debugLog('📍 Étape 4: Clic sur le bouton Gérer...', null, 'info');
  highlightElement(manageButton, 'green');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  manageButton.click();
  
  // Étape 5: Attendre la modale
  debugLog('📍 Étape 5: Attente de l\'ouverture de la modale...', null, 'info');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Étape 6: Analyser la modale
  debugLog('📍 Étape 6: Analyse de la modale...', null, 'info');
  const modal = findModal();
  
  if (!modal) {
    return {
      success: false,
      step: 'modal_not_found',
      message: 'La modale ne s\'est pas ouverte. Réessayez le clic.',
      logs: debugState.logs
    };
  }
  
  await analyzeModalContent(modal);
  
  // Étape 7: Retourner les résultats
  if (debugState.memoryData.length > 0) {
    return {
      success: true,
      step: 'completed',
      message: `✅ ${debugState.memoryData.length} souvenirs extraits!`,
      data: debugState.memoryData,
      logs: debugState.logs
    };
  } else {
    return {
      success: false,
      step: 'no_memories',
      message: 'Aucun souvenir trouvé dans la modale. Mode debug activé.',
      modalContent: exploreModalTexts(modal),
      logs: debugState.logs
    };
  }
}

// Capteur d'élément interactif
function setupElementCapture() {
  debugLog('🎯 Mode capture d\'élément activé - Survolez et cliquez sur un élément');
  
  let hoveredElement = null;
  let captureActive = true;
  
  const handleMouseOver = (e) => {
    if (!captureActive) return;
    
    // Ne pas capturer sur l'extension elle-même
    if (e.target.closest('[role="dialog"]')) return;
    
    if (hoveredElement && hoveredElement !== e.target) {
      hoveredElement.style.outline = '';
    }
    hoveredElement = e.target;
    hoveredElement.style.outline = '2px solid red';
  };
  
  const handleClick = (e) => {
    if (!captureActive) return;
    
    // Ne pas capturer sur l'extension ou la modale
    if (e.target.closest('[role="dialog"]')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const elementInfo = {
      tag: e.target.tagName,
      id: e.target.id,
      classes: e.target.className,
      text: e.target.textContent?.substring(0, 100),
      selector: generateSelector(e.target),
      position: e.target.getBoundingClientRect()
    };
    
    debugLog('🎯 Élément capturé:', elementInfo, 'success');
    
    // Envoyer à la popup
    chrome.runtime.sendMessage({
      action: 'elementCaptured',
      element: elementInfo
    }).catch(() => {});
    
    // Désactiver la capture
    captureActive = false;
    cleanup();
  };
  
  const cleanup = () => {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('click', handleClick, true);
    if (hoveredElement) {
      hoveredElement.style.outline = '';
    }
    debugLog('✅ Mode capture désactivé', null, 'info');
  };
  
  // Utiliser capture:true pour intercepter avant les autres handlers
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('click', handleClick, true);
  
  // Timeout de 30 secondes
  setTimeout(() => {
    if (captureActive) {
      captureActive = false;
      cleanup();
      debugLog('⏱️ Mode capture expiré', null, 'info');
    }
  }, 30000);
}

// Écouter les messages de la popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  debugLog(`📨 Message reçu: ${request.action}`, request, 'debug');
  
  switch(request.action) {
    case 'analyzePage':
      const analysis = analyzePage();
      sendResponse({
        ...analysis,
        foundElements: debugState.foundElements,
        logs: debugState.logs
      });
      break;
      
    case 'guidedExtraction':
      const result = await guidedExtraction();
      sendResponse(result);
      break;
      
    case 'captureElement':
      setupElementCapture();
      sendResponse({ status: 'capture_started' });
      break;
      
    case 'scrollToMemory':
      const memorySection = findMemorySection();
      if (memorySection.found) {
        // Trouver l'élément réel et scroller
        const element = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent?.includes('Mémoire') || el.textContent?.includes('% utilisé')
        );
        await scrollToElement(element);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
      break;
      
    case 'getLogs':
      sendResponse({
        logs: debugState.logs,
        foundElements: debugState.foundElements,
        memoryData: debugState.memoryData
      });
      break;
      
    case 'clearLogs':
      debugState.logs = [];
      debugLog('🧹 Logs effacés', null, 'info');
      sendResponse({ status: 'cleared' });
      break;
      
    case 'checkPage':
      sendResponse({
        isSettingsPage: window.location.href.includes('#settings/Personalization'),
        currentUrl: window.location.href,
        foundElements: debugState.foundElements
      });
      break;
      
    default:
      sendResponse({ error: 'Action non reconnue' });
  }
  
  return true; // Indique que la réponse sera asynchrone
});

// Initialisation
debugLog('🧠 ChatGPT Memory Extractor DEBUG - Script chargé', {
  url: window.location.href,
  timestamp: new Date().toISOString()
}, 'info');

// Analyser la page au chargement
setTimeout(() => {
  analyzePage();
}, 1000);
