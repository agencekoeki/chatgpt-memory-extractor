// ChatGPT Memory Extractor - Content Script v3.1
// Navigation et extraction entièrement automatiques

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

async function waitFor(selector, timeout = 10000, parent = document) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = parent.querySelector(selector);
    if (el && el.offsetHeight > 0) return el;
    await wait(200);
  }
  return null;
}

async function waitForText(text, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const elements = [...document.querySelectorAll('*')];
    for (const el of elements) {
      if (el.children.length === 0 && el.textContent?.trim().toLowerCase().includes(text.toLowerCase())) {
        return el;
      }
    }
    await wait(200);
  }
  return null;
}

function findButtonByText(texts, parent = document) {
  const buttons = parent.querySelectorAll('button, [role="button"], [role="menuitem"]');
  for (const btn of buttons) {
    const btnText = btn.textContent?.trim().toLowerCase();
    for (const t of texts) {
      if (btnText === t.toLowerCase() || btnText?.includes(t.toLowerCase())) {
        return btn;
      }
    }
  }
  return null;
}

function findClickableByText(texts, parent = document) {
  // Search all clickable elements
  const clickables = parent.querySelectorAll('button, [role="button"], [role="menuitem"], a, div[class*="cursor"], span[class*="cursor"]');
  for (const el of clickables) {
    const elText = el.textContent?.trim().toLowerCase();
    for (const t of texts) {
      if (elText === t.toLowerCase()) {
        return el;
      }
    }
  }
  return null;
}

// ========== NAVIGATION ==========
async function navigateToMemories() {
  log('Navigation automatique vers les souvenirs...', 'info');
  updateStatus('loading', 'Navigation vers Settings...');

  // Step 1: Open settings menu
  const settingsBtn = document.querySelector('[data-testid="profile-button"]') ||
                      document.querySelector('button[aria-label*="etting"]') ||
                      document.querySelector('button[aria-label*="Menu"]') ||
                      findButtonByText(['settings', 'paramètres']);

  // Or click on user avatar/menu
  const userMenu = document.querySelector('img[alt*="User"]')?.closest('button') ||
                   document.querySelector('[data-testid="user-menu"]');

  const menuTrigger = settingsBtn || userMenu;

  if (!menuTrigger) {
    // Try to find settings via URL
    log('Menu non trouvé, navigation directe...', 'warning');
    window.location.hash = '#settings/Personalization';
    await wait(2000);
  } else {
    menuTrigger.click();
    await wait(500);

    // Step 2: Click on Settings
    const settingsLink = await waitFor('[role="menuitem"]', 3000) ||
                         findClickableByText(['settings', 'paramètres']);

    if (settingsLink) {
      settingsLink.click();
      await wait(1000);
    }
  }

  // Step 3: Navigate to Personalization
  updateStatus('loading', 'Navigation vers Personalization...');

  // Try hash navigation first
  if (!window.location.hash.includes('Personalization')) {
    window.location.hash = '#settings/Personalization';
    await wait(1500);
  }

  // Or click on Personalization tab
  const personalizationTab = findClickableByText(['personalization', 'personnalisation']);
  if (personalizationTab) {
    personalizationTab.click();
    await wait(1000);
  }

  // Step 4: Wait for page to load and find Memory section
  updateStatus('loading', 'Recherche section Mémoire...');
  await wait(1000);

  // Scroll to find memory section
  const scrollContainer = document.querySelector('[class*="overflow-y-auto"]') ||
                          document.querySelector('main') ||
                          document.body;

  let memoryFound = false;
  let scrollAttempts = 0;
  const maxScrolls = 20;

  while (!memoryFound && scrollAttempts < maxScrolls) {
    // Look for memory indicators
    const memoryIndicator = [...document.querySelectorAll('*')].find(el =>
      el.textContent?.includes('% utilisé') ||
      el.textContent?.includes('% used') ||
      el.textContent?.toLowerCase().includes('memory')
    );

    if (memoryIndicator) {
      memoryFound = true;
      log('Section Mémoire trouvée', 'success');
      memoryIndicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await wait(500);
      break;
    }

    // Scroll down
    scrollContainer.scrollTop += 300;
    await wait(300);
    scrollAttempts++;
  }

  // Step 5: Find and click "Manage" / "Gérer" button
  updateStatus('loading', 'Recherche bouton Gérer...');
  await wait(500);

  const manageBtn = findButtonByText(['gérer', 'manage', 'gérer la mémoire', 'manage memory']);

  if (!manageBtn) {
    log('Bouton Gérer non trouvé', 'error');
    return { success: false, error: 'Bouton Gérer non trouvé. Naviguez manuellement vers Settings > Personalization > Memory > Manage' };
  }

  log('Bouton Gérer trouvé, ouverture modale...', 'success');
  manageBtn.click();
  await wait(1500);

  return { success: true };
}

// ========== EXTRACTION ==========
async function extractMemories() {
  log('Début extraction des souvenirs...', 'info');
  updateStatus('loading', 'Extraction en cours...');

  // Find the modal
  const modal = await waitFor('[role="dialog"]', 5000) ||
                await waitFor('[aria-modal="true"]', 3000);

  if (!modal) {
    return { success: false, error: 'Modale non trouvée', memories: [] };
  }

  // Verify it's the right modal (memories modal)
  const modalText = modal.textContent || '';
  const isMemoryModal = modalText.includes('Souvenirs') ||
                        modalText.includes('Memory') ||
                        modalText.includes('% utilisé') ||
                        modalText.includes('% used');

  if (!isMemoryModal) {
    log('Mauvaise modale détectée', 'warning');
    return { success: false, error: 'Mauvaise modale - ouvrez la modale des souvenirs', memories: [] };
  }

  log('Modale souvenirs détectée', 'success');

  // Find scroll container in modal
  const scrollContainer = findScrollContainer(modal);

  const allMemories = [];
  const seenTexts = new Set();
  let noNewCount = 0;
  let iteration = 0;
  const maxIterations = 100;

  while (iteration < maxIterations && noNewCount < 3) {
    iteration++;

    // Extract visible memories
    const visible = extractVisibleMemories(modal);
    let newCount = 0;

    for (const mem of visible) {
      if (!seenTexts.has(mem.text)) {
        seenTexts.add(mem.text);
        allMemories.push(mem);
        newCount++;
      }
    }

    if (newCount > 0) {
      noNewCount = 0;
      reportProgress(allMemories.length);
      log(`Progression: ${allMemories.length} souvenirs`, 'info');
    } else {
      noNewCount++;
    }

    // Scroll for more
    if (scrollContainer) {
      const before = scrollContainer.scrollTop;
      scrollContainer.scrollTop += 400;
      await wait(400);

      // Check if we actually scrolled
      if (scrollContainer.scrollTop === before) {
        // Reached bottom
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
    error: allMemories.length === 0 ? 'Aucun souvenir trouvé' : null
  };
}

function findScrollContainer(modal) {
  // Find scrollable element in modal
  const elements = modal.querySelectorAll('*');
  for (const el of elements) {
    const style = window.getComputedStyle(el);
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        el.scrollHeight > el.clientHeight + 10) {
      return el;
    }
  }

  // Fallback to modal itself
  if (modal.scrollHeight > modal.clientHeight) {
    return modal;
  }

  return null;
}

function extractVisibleMemories(container) {
  const memories = [];
  const seen = new Set();

  // Look for memory items - they're usually in divs with specific structure
  const allDivs = container.querySelectorAll('div');

  for (const div of allDivs) {
    const text = div.textContent?.trim();

    // Filter criteria for a real memory
    if (!text || text.length < 20 || text.length > 3000) continue;
    if (seen.has(text)) continue;

    // Skip system/UI text
    if (isSystemText(text)) continue;

    // Skip containers (have many children)
    if (div.querySelectorAll('div').length > 5) continue;

    // Check if this looks like a memory entry
    // Memories are usually standalone text blocks
    const hasButton = div.querySelector('button');
    const parent = div.parentElement;
    const siblings = parent?.children.length || 0;

    // Memory entries typically have a delete/edit button nearby
    // and are in a list structure
    if (hasButton || siblings > 1) {
      // Check it's not just a button text
      const btnText = hasButton?.textContent?.trim();
      if (btnText && text === btnText) continue;

      // Clean the text (remove button text)
      let cleanText = text;
      if (btnText) {
        cleanText = text.replace(btnText, '').trim();
      }

      if (cleanText.length >= 20 && !isSystemText(cleanText)) {
        seen.add(text);
        memories.push({
          text: cleanText,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  return memories;
}

function isSystemText(text) {
  const systemPatterns = [
    '% utilisé', '% used',
    'Souvenirs enregistrés', 'Saved memories',
    'Tout supprimer', 'Delete all', 'Clear all',
    'Gérer', 'Manage',
    'Fermer', 'Close',
    'Personnalisation', 'Personalization',
    'Mémoire', 'Memory',
    'ChatGPT se souvient', 'ChatGPT remembers',
    'Enregistrer', 'Save',
    'Annuler', 'Cancel'
  ];

  const lowerText = text.toLowerCase();

  // Exact matches or very short texts that match
  for (const pattern of systemPatterns) {
    if (lowerText === pattern.toLowerCase()) return true;
    if (text.length < 50 && lowerText.includes(pattern.toLowerCase())) return true;
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
    // Check if we're already on the memories modal
    let modal = document.querySelector('[role="dialog"]');
    let isMemoryModal = modal && (
      modal.textContent?.includes('Souvenirs') ||
      modal.textContent?.includes('Memory') ||
      modal.textContent?.includes('% utilisé')
    );

    if (!isMemoryModal) {
      // Navigate to memories
      const navResult = await navigateToMemories();
      if (!navResult.success) {
        isExtracting = false;
        return { error: true, message: navResult.error };
      }
    }

    // Extract memories
    const result = await extractMemories();

    // Send result to popup
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
    // Respond immediately
    sendResponse({ started: true });

    // Start extraction async
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
log('Memory Extractor chargé', 'info');
