// Content script qui s'exécute sur chatgpt.com

let memoryData = [];

// Fonction pour attendre qu'un élément soit présent dans le DOM
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      } else {
        setTimeout(checkElement, 100);
      }
    };
    
    checkElement();
  });
}

// Fonction pour extraire la mémoire
async function extractMemory() {
  try {
    console.log('🧠 ChatGPT Memory Extractor: Début de l\'extraction...');
    
    // Vérifier si on est sur la page des settings
    if (!window.location.href.includes('#settings/Personalization')) {
      throw new Error('Veuillez naviguer vers Settings > Personalization d\'abord');
    }
    
    // Chercher le bouton "Gérer" ou "Manage"
    const manageButton = await findManageButton();
    if (!manageButton) {
      throw new Error('Bouton "Gérer" non trouvé');
    }
    
    console.log('🔍 Bouton "Gérer" trouvé, clic...');
    manageButton.click();
    
    // Attendre que la modale s'ouvre
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Extraire les souvenirs
    const memories = await extractMemoriesFromModal();
    
    return {
      success: true,
      data: memories,
      count: memories.length,
      extractedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Fonction pour trouver le bouton Gérer
async function findManageButton() {
  // Chercher différentes variantes du bouton
  const buttonSelectors = [
    'button:has-text("Gérer")',
    'button:has-text("Manage")',
    'button:has-text("Gerer")',
    '[role="button"]:has-text("Gérer")',
    // Recherche par classe si le texte ne fonctionne pas
    'button.btn',
    'button[class*="manage"]',
    'button[class*="memory"]'
  ];
  
  // Essayer avec les sélecteurs CSS standards
  for (const selector of ['button', '[role="button"]', 'div[role="button"]']) {
    const buttons = document.querySelectorAll(selector);
    for (const button of buttons) {
      const text = button.textContent?.toLowerCase().trim();
      if (text && (text.includes('gérer') || text.includes('manage') || text.includes('gerer'))) {
        return button;
      }
    }
  }
  
  return null;
}

// Fonction pour extraire les souvenirs de la modale
async function extractMemoriesFromModal() {
  const memories = [];
  
  // Attendre que la modale soit complètement chargée
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('🔍 Recherche des souvenirs dans la modale...');
  
  // D'après les captures d'écran, les souvenirs sont dans des divs avec un ID commençant par :r
  // et une classe contenant des styles de flexbox
  const modalContainer = document.querySelector('[role="dialog"]') || 
                        document.querySelector('div[id^="radix-"][id*="content"]') ||
                        document.querySelector('div[class*="overlay"]');
  
  if (!modalContainer) {
    console.log('❌ Conteneur de modale non trouvé');
    // Tentative de clic sur le bouton Gérer si la modale n'est pas ouverte
    const manageButton = await findManageButton();
    if (manageButton) {
      manageButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      return extractMemoriesFromModal(); // Réessayer
    }
    return memories;
  }
  
  // Stratégie 1: Chercher les éléments avec des IDs spécifiques (visible dans les DevTools)
  const memoryItems = modalContainer.querySelectorAll('div[id*=":r"][class*="flex"]');
  
  if (memoryItems.length > 0) {
    console.log(`📝 Trouvé ${memoryItems.length} éléments potentiels avec ID :r`);
    memoryItems.forEach(item => {
      const text = item.textContent?.trim();
      if (text && text.length > 20 && !isSystemText(text)) {
        if (!isDuplicate(memories, text)) {
          memories.push({
            text: text,
            element: 'memory-item',
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }
  
  // Stratégie 2: Rechercher par structure de classe (d'après les screenshots)
  if (memories.length === 0) {
    console.log('📋 Tentative avec recherche par classes...');
    
    // Les souvenirs semblent être dans des divs avec des classes de style
    const styledDivs = modalContainer.querySelectorAll('div[class*="text-"], div[class*="border-"], div[class*="rounded-"]');
    
    styledDivs.forEach(div => {
      // Vérifier si c'est un conteneur de souvenir (pas trop de sous-éléments)
      if (div.children.length <= 2) {
        const text = extractCleanText(div);
        if (text && text.length > 20 && !isSystemText(text)) {
          if (!isDuplicate(memories, text)) {
            memories.push({
              text: text,
              element: 'styled-div',
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    });
  }
  
  // Stratégie 3: Extraction basée sur le contenu visible dans les screenshots
  if (memories.length === 0) {
    console.log('🔎 Recherche par contenu spécifique...');
    
    // Chercher le conteneur qui a "92 % utilisé" pour identifier la bonne zone
    const allElements = modalContainer.querySelectorAll('*');
    let foundMemorySection = false;
    
    for (const element of allElements) {
      const text = element.textContent?.trim();
      
      // Identifier le début de la section des souvenirs
      if (text && (text.includes('% utilisé') || text.includes('Souvenirs enregistrés'))) {
        foundMemorySection = true;
        
        // Chercher le parent qui contient tous les souvenirs
        let parent = element.parentElement;
        while (parent && parent !== modalContainer) {
          // Chercher les divs enfants qui pourraient être des souvenirs
          const childDivs = parent.querySelectorAll('div');
          
          childDivs.forEach(child => {
            // Vérifier que c'est un élément de premier niveau (pas trop imbriqué)
            if (getDepth(child, parent) <= 3) {
              const childText = extractCleanText(child);
              if (childText && childText.length > 20 && !isSystemText(childText)) {
                if (!isDuplicate(memories, childText)) {
                  memories.push({
                    text: childText,
                    element: 'content-based',
                    timestamp: new Date().toISOString()
                  });
                }
              }
            }
          });
          
          if (memories.length > 0) break;
          parent = parent.parentElement;
        }
      }
      
      // Extraction directe si on reconnaît un pattern de souvenir
      if (foundMemorySection && text && isMemoryPattern(text)) {
        if (!isDuplicate(memories, text)) {
          memories.push({
            text: text,
            element: 'pattern-match',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }
  
  // Déduplication finale et nettoyage
  const cleanedMemories = deduplicateAndClean(memories);
  
  console.log(`✅ ${cleanedMemories.length} souvenirs uniques extraits`);
  return cleanedMemories;
}

// Fonction helper pour vérifier si c'est du texte système
function isSystemText(text) {
  const systemTexts = [
    '% utilisé', 'Souvenirs enregistrés', 'Tout supprimer', 'Delete all',
    'Gérer', 'Manage', 'Close', 'Fermer', 'Cancel', 'Annuler',
    'Mémoire', 'Memory', 'Settings', 'Paramètres', 'Personalization'
  ];
  return systemTexts.some(st => text.includes(st));
}

// Fonction helper pour vérifier les doublons
function isDuplicate(memories, text) {
  return memories.some(m => 
    m.text === text || 
    m.text.includes(text) || 
    text.includes(m.text)
  );
}

// Fonction helper pour extraire le texte propre d'un élément
function extractCleanText(element) {
  // Clone l'élément pour ne pas modifier l'original
  const clone = element.cloneNode(true);
  
  // Supprimer les boutons et éléments de contrôle
  clone.querySelectorAll('button, svg, [role="button"]').forEach(el => el.remove());
  
  return clone.textContent?.trim();
}

// Fonction helper pour calculer la profondeur d'un élément
function getDepth(element, container) {
  let depth = 0;
  let current = element;
  while (current && current !== container) {
    depth++;
    current = current.parentElement;
  }
  return depth;
}

// Fonction helper pour identifier les patterns de souvenirs
function isMemoryPattern(text) {
  // Patterns basés sur les exemples visibles dans les screenshots
  const patterns = [
    /Sébastien.*souhaite/i,
    /L'utilisateur.*souhaite/i,
    /préfère/i,
    /travaille avec/i,
    /souhaite.*que/i,
    /ne souhaite.*pas/i,
    /^.*aime.*$/i,
    /^.*utilise.*$/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

// Fonction pour dédupliquer et nettoyer les souvenirs
function deduplicateAndClean(memories) {
  const seen = new Set();
  const cleaned = [];
  
  memories.forEach(memory => {
    // Normaliser le texte
    const normalized = memory.text.replace(/\s+/g, ' ').trim();
    
    // Vérifier que ce n'est pas un doublon
    if (!seen.has(normalized) && normalized.length > 20) {
      seen.add(normalized);
      cleaned.push({
        ...memory,
        text: normalized
      });
    }
  });
  
  // Trier par longueur (les plus longs d'abord, généralement plus complets)
  return cleaned.sort((a, b) => b.text.length - a.text.length);
}

// Écouter les messages de la popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'extractMemory') {
    const result = await extractMemory();
    sendResponse(result);
  } else if (request.action === 'checkPage') {
    sendResponse({
      isSettingsPage: window.location.href.includes('#settings/Personalization'),
      currentUrl: window.location.href
    });
  }
  return true; // Indique que la réponse sera asynchrone
});

// Log pour confirmer que le script est chargé
console.log('🧠 ChatGPT Memory Extractor: Content script loaded');
