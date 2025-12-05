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
    log('Navigation directe vers settings...', 'warning');
    window.location.hash = '#settings';
    await wait(1500);
  }

  // Step 3: Wait for settings modal to open
  const settingsModal = await waitFor('[role="dialog"]', 5000);
  if (!settingsModal) {
    log('Modale settings non trouvée', 'error');
    return { success: false, error: 'Modale settings non trouvée' };
  }

  log('Modale settings ouverte', 'success');

  // Step 4: Click on "Personnalisation" tab
  updateStatus('loading', 'Navigation vers Personnalisation...');
  await wait(500);

  // Find the Personnalisation tab - it's a button with role="tab" containing "Personnalisation" text
  let personalizationTab = settingsModal.querySelector('[data-testid="personalization-tab"]');

  if (!personalizationTab) {
    // Search for button/tab containing "Personnalisation" text (case insensitive)
    const allTabs = settingsModal.querySelectorAll('button[role="tab"], button, [role="tab"]');
    for (const tab of allTabs) {
      const tabText = tab.textContent?.toLowerCase();
      if (tabText?.includes('personnalisation') || tabText?.includes('personalization')) {
        personalizationTab = tab;
        break;
      }
    }
  }

  if (personalizationTab) {
    log('Onglet Personnalisation trouvé', 'success');
    personalizationTab.click();
    await wait(1000);
  } else {
    log('Onglet Personnalisation non trouvé', 'warning');
  }

  // Step 5: Find scrollable container INSIDE the settings modal and scroll to Memory section
  updateStatus('loading', 'Recherche section Mémoire...');

  // The scrollable area is inside the modal - find it
  const scrollContainer = settingsModal.querySelector('[class*="overflow-y-auto"]') ||
                          settingsModal.querySelector('[class*="overflow-auto"]') ||
                          [...settingsModal.querySelectorAll('div')].find(div => {
                            const style = window.getComputedStyle(div);
                            return (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                                   div.scrollHeight > div.clientHeight;
                          }) ||
                          settingsModal;

  log('Conteneur scroll trouvé, recherche de Mémoire...', 'info');

  // Scroll to find "Mémoire" section
  let manageBtn = null;
  for (let i = 0; i < 20; i++) {
    // Look for "Mémoire" heading or "Remplissage" text
    const memoryHeading = [...settingsModal.querySelectorAll('h2, h3, div, span')].find(el => {
      const text = el.textContent?.trim();
      return text === 'Mémoire' || text === 'Memory';
    });

    // Look for the "Gérer" button
    manageBtn = [...settingsModal.querySelectorAll('button')].find(btn => {
      const text = btn.textContent?.trim().toLowerCase();
      return text === 'gérer' || text === 'manage';
    });

    if (manageBtn) {
      log('Bouton Gérer trouvé!', 'success');
      break;
    }

    if (memoryHeading) {
      memoryHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await wait(300);
    }

    // Scroll down in the container
    scrollContainer.scrollTop += 200;
    await wait(300);
  }

  if (!manageBtn) {
    log('Bouton Gérer non trouvé après scroll', 'error');
    return { success: false, error: 'Bouton Gérer non trouvé. Scrollez manuellement jusqu\'à la section Mémoire.' };
  }

  // Step 6: Click "Gérer" button to open memories modal
  updateStatus('loading', 'Ouverture des éléments mémorisés...');
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
