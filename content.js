// ChatGPT Memory Extractor - Content Script v3.2
// Adapté à la vraie structure DOM de ChatGPT

let isExtracting = false;

// ========== LOGGING ==========
function log(message, level = 'info') {
  const styles = {
    info: 'color: #6366f1;',
    success: 'color: #22c55e; font-weight: bold;',
    warning: 'color: #f59e0b;',
    error: 'color: #ef4444; font-weight: bold;'
  };
  console.log(`%c[MemoryExtractor] ${message}`, styles[level]);
  chrome.runtime.sendMessage({ action: 'log', message, level }).catch(() => {});
}

function updateStatus(type, message) {
  chrome.runtime.sendMessage({ action: 'statusUpdate', type, message }).catch(() => {});
}

function reportProgress(count) {
  chrome.runtime.sendMessage({ action: 'progress', count }).catch(() => {});
}

// ========== UTILITIES ==========
const wait = ms => new Promise(r => setTimeout(r, ms));

async function waitFor(selector, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (el && el.offsetHeight > 0) return el;
    await wait(200);
  }
  return null;
}

function findByText(texts, selector = '*') {
  const elements = document.querySelectorAll(selector);
  for (const el of elements) {
    const text = el.textContent?.trim().toLowerCase();
    for (const t of texts) {
      if (text === t.toLowerCase() || text?.includes(t.toLowerCase())) {
        return el;
      }
    }
  }
  return null;
}

function findButtonByText(texts) {
  return findByText(texts, 'button, [role="button"], [role="menuitem"]');
}

// ========== NAVIGATION ==========
async function navigateToMemories() {
  log('Navigation vers les paramètres...', 'info');
  updateStatus('loading', 'Ouverture des paramètres...');

  // Step 1: Click on user menu (bottom left avatar/name)
  const userMenuBtn = document.querySelector('[data-testid="profile-button"]') ||
                      document.querySelector('button[aria-label*="enu"]') ||
                      document.querySelector('nav button:last-child') ||
                      // Look for the user name button at bottom of sidebar
                      [...document.querySelectorAll('button')].find(b =>
                        b.textContent?.includes('@') ||
                        b.querySelector('img[alt]')
                      );

  if (userMenuBtn) {
    log('Menu utilisateur trouvé', 'success');
    userMenuBtn.click();
    await wait(500);
  }

  // Step 2: Click on "Paramètres" / "Settings"
  await wait(300);
  const settingsBtn = findButtonByText(['paramètres', 'settings']);

  if (settingsBtn) {
    log('Bouton Paramètres trouvé', 'success');
    settingsBtn.click();
    await wait(1000);
  } else {
    // Try direct navigation
    log('Navigation directe vers settings...', 'warning');
    window.location.hash = '#settings';
    await wait(1500);
  }

  // Step 3: Click on "Personnalisation" / "Personalization" tab
  updateStatus('loading', 'Navigation vers Personnalisation...');
  await wait(500);

  const personalizationTab = findButtonByText(['personnalisation', 'personalization']);

  if (personalizationTab) {
    log('Onglet Personnalisation trouvé', 'success');
    personalizationTab.click();
    await wait(1000);
  }

  // Step 4: Scroll to find Memory section and click "Gérer" / "Manage"
  updateStatus('loading', 'Recherche section Mémoire...');

  // Find the settings content area
  const settingsContent = document.querySelector('[class*="overflow-y-auto"]') ||
                          document.querySelector('main') ||
                          document.body;

  // Scroll to find memory section
  let found = false;
  for (let i = 0; i < 15; i++) {
    // Look for memory indicators: "Remplissage" or "Memory" or "Mémoire"
    const memorySection = findByText(['remplissage', 'mémoire', 'memory'], 'div, span, h2, h3');

    if (memorySection) {
      log('Section Mémoire trouvée', 'success');
      memorySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await wait(500);
      found = true;
      break;
    }

    settingsContent.scrollTop += 300;
    await wait(300);
  }

  // Step 5: Find and click the manage button (might be "Gérer" or icon button)
  updateStatus('loading', 'Ouverture des éléments mémorisés...');
  await wait(500);

  // The manage button might be near "Remplissage" text
  const manageBtn = findButtonByText(['gérer', 'manage', 'voir', 'view']) ||
                    // Or look for a button in the memory section area
                    document.querySelector('[data-testid*="memory"]') ||
                    document.querySelector('[data-testid*="manage"]');

  if (!manageBtn) {
    // Try to find any button that could open memory modal
    const allButtons = [...document.querySelectorAll('button')];
    const memoryBtn = allButtons.find(b => {
      const parent = b.closest('div');
      return parent?.textContent?.includes('Remplissage') ||
             parent?.textContent?.includes('Mémoire') ||
             parent?.textContent?.includes('Memory');
    });

    if (memoryBtn) {
      log('Bouton mémoire trouvé (via parent)', 'success');
      memoryBtn.click();
      await wait(1500);
      return { success: true };
    }

    log('Bouton Gérer non trouvé', 'error');
    return { success: false, error: 'Bouton Gérer non trouvé. Ouvrez manuellement Settings > Personnalisation > Mémoire > Gérer' };
  }

  log('Bouton Gérer trouvé', 'success');
  manageBtn.click();
  await wait(1500);

  return { success: true };
}

// ========== EXTRACTION ==========
async function extractMemories() {
  log('Extraction des éléments mémorisés...', 'info');
  updateStatus('loading', 'Extraction en cours...');

  // Find the modal - "Éléments mémorisés" modal
  const modal = await waitFor('[role="dialog"]', 5000);

  if (!modal) {
    return { success: false, error: 'Modale non trouvée', memories: [] };
  }

  // Verify it's the memories modal
  const modalText = modal.textContent || '';
  const isMemoryModal = modalText.includes('mémorisés') ||
                        modalText.includes('Remplissage') ||
                        modalText.includes('Memory') ||
                        modalText.includes('memorized');

  if (!isMemoryModal) {
    log('Mauvaise modale: ' + modalText.substring(0, 100), 'warning');
    return { success: false, error: 'Mauvaise modale détectée', memories: [] };
  }

  log('Modale "Éléments mémorisés" détectée', 'success');

  // The memories are in a TABLE structure
  // Find the scrollable container and the table
  const scrollContainer = modal.querySelector('[class*="overflow-y-auto"]') ||
                          modal.querySelector('table')?.parentElement ||
                          findScrollContainer(modal);

  const allMemories = [];
  const seenTexts = new Set();
  let noNewCount = 0;
  let iteration = 0;
  const maxIterations = 100;

  while (iteration < maxIterations && noNewCount < 4) {
    iteration++;

    // Extract from TABLE rows
    const memories = extractFromTable(modal);

    let newCount = 0;
    for (const mem of memories) {
      if (!seenTexts.has(mem.text)) {
        seenTexts.add(mem.text);
        allMemories.push(mem);
        newCount++;
      }
    }

    if (newCount > 0) {
      noNewCount = 0;
      reportProgress(allMemories.length);
      log(`Progression: ${allMemories.length} éléments`, 'info');
    } else {
      noNewCount++;
    }

    // Scroll for more
    if (scrollContainer) {
      const before = scrollContainer.scrollTop;
      scrollContainer.scrollTop += 400;
      await wait(400);

      if (scrollContainer.scrollTop === before) {
        await wait(300);
        if (scrollContainer.scrollTop === before) {
          log('Fin du scroll', 'info');
          break;
        }
      }
    } else {
      break;
    }
  }

  return {
    success: allMemories.length > 0,
    memories: allMemories,
    error: allMemories.length === 0 ? 'Aucun élément trouvé' : null
  };
}

function extractFromTable(container) {
  const memories = [];

  // Method 1: Look for table rows
  const tableRows = container.querySelectorAll('tr');

  for (const row of tableRows) {
    // Get the text cell (first td usually)
    const textCell = row.querySelector('td');
    if (!textCell) continue;

    // The actual text is in a div with whitespace-pre-wrap
    const textDiv = textCell.querySelector('[class*="whitespace-pre-wrap"]') ||
                    textCell.querySelector('[class*="py-2"]') ||
                    textCell.querySelector('div');

    if (textDiv) {
      const text = textDiv.textContent?.trim();
      if (text && text.length >= 10 && !isSystemText(text)) {
        memories.push({
          text: text,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Method 2: If no table found, look for div structure
  if (memories.length === 0) {
    const divs = container.querySelectorAll('[class*="whitespace-pre-wrap"], [class*="py-2"]');

    for (const div of divs) {
      const text = div.textContent?.trim();
      if (text && text.length >= 10 && !isSystemText(text)) {
        // Check it's not a container
        if (div.querySelectorAll('div').length < 3) {
          memories.push({
            text: text,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  return memories;
}

function findScrollContainer(modal) {
  const elements = modal.querySelectorAll('*');
  for (const el of elements) {
    const style = window.getComputedStyle(el);
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        el.scrollHeight > el.clientHeight + 10) {
      return el;
    }
  }
  return modal.scrollHeight > modal.clientHeight ? modal : null;
}

function isSystemText(text) {
  const systemPatterns = [
    'remplissage', 'filling',
    'éléments mémorisés', 'memorized items', 'saved memories',
    'supprimer tout', 'delete all', 'clear all',
    'gérer', 'manage',
    'fermer', 'close',
    'personnalisation', 'personalization',
    'mémoire pleine', 'memory full',
    'une fois la mémoire pleine',
    'les réponses pourraient'
  ];

  const lowerText = text.toLowerCase();

  for (const pattern of systemPatterns) {
    if (lowerText === pattern) return true;
    if (text.length < 60 && lowerText.includes(pattern)) return true;
  }

  return false;
}

// ========== MAIN AUTO EXTRACT ==========
async function autoExtract() {
  if (isExtracting) {
    return { error: true, message: 'Extraction déjà en cours' };
  }

  isExtracting = true;

  try {
    // Check if memories modal is already open
    let modal = document.querySelector('[role="dialog"]');
    let isMemoryModal = modal && (
      modal.textContent?.includes('mémorisés') ||
      modal.textContent?.includes('Remplissage') ||
      modal.textContent?.includes('Memory')
    );

    if (!isMemoryModal) {
      const navResult = await navigateToMemories();
      if (!navResult.success) {
        isExtracting = false;
        return { error: true, message: navResult.error };
      }
    }

    // Extract
    const result = await extractMemories();

    chrome.runtime.sendMessage({
      action: 'extractionComplete',
      result
    }).catch(() => {});

    isExtracting = false;
    return { started: true };

  } catch (error) {
    isExtracting = false;
    log('Erreur: ' + error.message, 'error');
    return { error: true, message: error.message };
  }
}

// ========== MESSAGE HANDLER ==========
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autoExtract') {
    sendResponse({ started: true });

    autoExtract().then(result => {
      if (result.error) {
        chrome.runtime.sendMessage({
          action: 'extractionComplete',
          result: { success: false, error: result.message, memories: [] }
        }).catch(() => {});
      }
    });

    return true;
  }

  return false;
});

// ========== INIT ==========
log('Memory Extractor v3.2 chargé', 'info');
