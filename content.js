// ChatGPT Memory Extractor - Content Script v3.3 DIAGNOSTIC
// Mode debug pour identifier les bons sélecteurs

let isExtracting = false;
let diagnosticMode = true; // Active les logs détaillés

// ========== LOGGING ==========
function log(message, level = 'info') {
  const styles = {
    info: 'color: #6366f1;',
    success: 'color: #22c55e; font-weight: bold;',
    warning: 'color: #f59e0b;',
    error: 'color: #ef4444; font-weight: bold;',
    debug: 'color: #8b5cf6; font-style: italic;'
  };
  console.log(`%c[MemoryExtractor] ${message}`, styles[level] || styles.info);
  chrome.runtime.sendMessage({ action: 'log', message, level }).catch(() => {});
}

function updateStatus(type, message) {
  chrome.runtime.sendMessage({ action: 'statusUpdate', type, message }).catch(() => {});
}

function reportProgress(count) {
  chrome.runtime.sendMessage({ action: 'progress', count }).catch(() => {});
}

// ========== DIAGNOSTIC FUNCTIONS ==========
function diagElement(el, label = '') {
  if (!el) return 'NULL';
  const info = {
    tag: el.tagName,
    id: el.id || '-',
    classes: el.className?.toString?.()?.substring(0, 80) || '-',
    testId: el.getAttribute('data-testid') || '-',
    ariaLabel: el.getAttribute('aria-label') || '-',
    role: el.getAttribute('role') || '-',
    text: el.textContent?.trim()?.substring(0, 50) || '-'
  };
  return `${label} <${info.tag}> id="${info.id}" data-testid="${info.testId}" aria="${info.ariaLabel}" role="${info.role}" text="${info.text}..."`;
}

function diagAllButtons(container = document) {
  const buttons = container.querySelectorAll('button, [role="button"], [role="menuitem"]');
  log(`=== DIAGNOSTIC: ${buttons.length} boutons trouvés ===`, 'debug');

  const results = [];
  buttons.forEach((btn, i) => {
    const info = {
      index: i,
      tag: btn.tagName,
      testId: btn.getAttribute('data-testid') || '',
      ariaLabel: btn.getAttribute('aria-label') || '',
      role: btn.getAttribute('role') || '',
      text: btn.textContent?.trim()?.substring(0, 60) || '',
      visible: btn.offsetHeight > 0,
      classes: btn.className?.toString?.()?.substring(0, 50) || ''
    };
    results.push(info);

    // Log only interesting buttons (visible with some identifier)
    if (info.visible && (info.testId || info.ariaLabel || info.text)) {
      log(`  [${i}] testId="${info.testId}" aria="${info.ariaLabel}" text="${info.text}"`, 'debug');
    }
  });

  return results;
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

// ========== STEP 1: FIND USER MENU ==========
async function step1_findUserMenu() {
  log('========== ÉTAPE 1: MENU UTILISATEUR ==========', 'info');

  // Liste tous les sélecteurs qu'on essaie
  const selectors = [
    { name: 'data-testid="profile-button"', sel: '[data-testid="profile-button"]' },
    { name: 'aria-label contient "enu"', sel: 'button[aria-label*="enu"]' },
    { name: 'aria-label contient "Menu"', sel: 'button[aria-label*="Menu"]' },
    { name: 'aria-label contient "profile"', sel: 'button[aria-label*="profile"]' },
    { name: 'aria-label contient "account"', sel: 'button[aria-label*="account"]' },
    { name: 'nav button:last-child', sel: 'nav button:last-child' },
    { name: 'data-testid contient "user"', sel: '[data-testid*="user"]' },
    { name: 'data-testid contient "avatar"', sel: '[data-testid*="avatar"]' },
    { name: 'data-testid contient "profile"', sel: '[data-testid*="profile"]' },
  ];

  log('Recherche avec sélecteurs CSS:', 'debug');
  let foundBtn = null;

  for (const s of selectors) {
    const el = document.querySelector(s.sel);
    if (el) {
      log(`  ✓ TROUVÉ: ${s.name}`, 'success');
      log(`    -> ${diagElement(el)}`, 'debug');
      if (!foundBtn && el.offsetHeight > 0) foundBtn = el;
    } else {
      log(`  ✗ ${s.name}`, 'debug');
    }
  }

  // Recherche par contenu (@ ou avatar)
  log('Recherche par contenu (@ ou avatar):', 'debug');
  const allButtons = [...document.querySelectorAll('button')];
  const btnWithAt = allButtons.find(b => b.textContent?.includes('@'));
  const btnWithAvatar = allButtons.find(b => b.querySelector('img[alt]'));

  if (btnWithAt) {
    log(`  ✓ Bouton avec @: "${btnWithAt.textContent?.trim()?.substring(0, 40)}"`, 'success');
    if (!foundBtn) foundBtn = btnWithAt;
  }
  if (btnWithAvatar) {
    log(`  ✓ Bouton avec avatar img`, 'success');
    if (!foundBtn) foundBtn = btnWithAvatar;
  }

  // Affiche tous les boutons de la sidebar/nav pour diagnostic
  log('Boutons dans nav/aside:', 'debug');
  const navButtons = document.querySelectorAll('nav button, aside button');
  navButtons.forEach((btn, i) => {
    if (btn.offsetHeight > 0) {
      log(`  nav[${i}]: testId="${btn.getAttribute('data-testid') || '-'}" text="${btn.textContent?.trim()?.substring(0, 30) || '-'}"`, 'debug');
    }
  });

  if (foundBtn) {
    log(`RÉSULTAT ÉTAPE 1: Bouton trouvé!`, 'success');
    return { success: true, element: foundBtn };
  } else {
    log(`RÉSULTAT ÉTAPE 1: AUCUN bouton trouvé`, 'error');
    diagAllButtons();
    return { success: false, element: null };
  }
}

// ========== STEP 2: FIND SETTINGS IN MENU ==========
async function step2_findSettings() {
  log('========== ÉTAPE 2: BOUTON PARAMÈTRES ==========', 'info');

  // Cherche les menuitems visibles
  const menuItems = document.querySelectorAll('[role="menuitem"], [role="menu"] button, [data-radix-menu-content] button');
  log(`${menuItems.length} items de menu trouvés`, 'debug');

  menuItems.forEach((item, i) => {
    if (item.offsetHeight > 0) {
      log(`  menu[${i}]: "${item.textContent?.trim()?.substring(0, 40)}"`, 'debug');
    }
  });

  // Recherche par texte
  const searchTexts = ['paramètres', 'settings', 'réglages', 'préférences', 'preferences'];
  log(`Recherche par texte: ${searchTexts.join(', ')}`, 'debug');

  const settingsBtn = findButtonByText(searchTexts);

  if (settingsBtn) {
    log(`RÉSULTAT ÉTAPE 2: Bouton Paramètres trouvé: "${settingsBtn.textContent?.trim()}"`, 'success');
    return { success: true, element: settingsBtn };
  } else {
    log(`RÉSULTAT ÉTAPE 2: Bouton Paramètres NON trouvé`, 'error');
    return { success: false, element: null };
  }
}

// ========== STEP 3: FIND PERSONALIZATION TAB ==========
async function step3_findPersonalization() {
  log('========== ÉTAPE 3: ONGLET PERSONNALISATION ==========', 'info');

  // Cherche tous les onglets/tabs
  const tabs = document.querySelectorAll('[role="tab"], [role="tablist"] button, button[class*="tab"]');
  log(`${tabs.length} onglets potentiels trouvés`, 'debug');

  tabs.forEach((tab, i) => {
    log(`  tab[${i}]: "${tab.textContent?.trim()?.substring(0, 40)}"`, 'debug');
  });

  // Cherche aussi les boutons dans la modale settings
  const dialog = document.querySelector('[role="dialog"]');
  if (dialog) {
    log('Modale/dialog trouvée, boutons dedans:', 'debug');
    const dialogBtns = dialog.querySelectorAll('button, [role="button"]');
    dialogBtns.forEach((btn, i) => {
      if (btn.offsetHeight > 0) {
        log(`  dialog-btn[${i}]: "${btn.textContent?.trim()?.substring(0, 40)}"`, 'debug');
      }
    });
  }

  const searchTexts = ['personnalisation', 'personalization', 'personnalisé', 'customization'];
  const personalizationTab = findButtonByText(searchTexts);

  if (personalizationTab) {
    log(`RÉSULTAT ÉTAPE 3: Onglet trouvé: "${personalizationTab.textContent?.trim()}"`, 'success');
    return { success: true, element: personalizationTab };
  } else {
    log(`RÉSULTAT ÉTAPE 3: Onglet Personnalisation NON trouvé`, 'error');
    return { success: false, element: null };
  }
}

// ========== STEP 4: FIND MEMORY SECTION ==========
async function step4_findMemorySection() {
  log('========== ÉTAPE 4: SECTION MÉMOIRE ==========', 'info');

  const searchTexts = ['mémoire', 'memory', 'remplissage', 'filling', 'mémorisé', 'memorized'];
  log(`Recherche de texte: ${searchTexts.join(', ')}`, 'debug');

  // Cherche dans différents types d'éléments
  const containers = ['div', 'span', 'h2', 'h3', 'h4', 'p', 'label'];

  for (const tag of containers) {
    const elements = document.querySelectorAll(tag);
    for (const el of elements) {
      const text = el.textContent?.trim().toLowerCase() || '';
      for (const search of searchTexts) {
        if (text.includes(search.toLowerCase()) && text.length < 100) {
          log(`  ✓ Trouvé dans <${tag}>: "${el.textContent?.trim()?.substring(0, 50)}"`, 'success');
        }
      }
    }
  }

  const memorySection = findByText(searchTexts, 'div, span, h2, h3, h4, label');

  if (memorySection) {
    log(`RÉSULTAT ÉTAPE 4: Section mémoire trouvée`, 'success');
    return { success: true, element: memorySection };
  } else {
    log(`RÉSULTAT ÉTAPE 4: Section mémoire NON trouvée`, 'error');
    return { success: false, element: null };
  }
}

// ========== STEP 5: FIND MANAGE BUTTON ==========
async function step5_findManageButton() {
  log('========== ÉTAPE 5: BOUTON GÉRER ==========', 'info');

  // Sélecteurs spécifiques
  const selectors = [
    '[data-testid*="memory"]',
    '[data-testid*="manage"]',
    '[data-testid*="gerer"]',
    'button[aria-label*="memory"]',
    'button[aria-label*="manage"]',
  ];

  log('Recherche avec sélecteurs:', 'debug');
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      log(`  ✓ ${sel}: "${el.textContent?.trim()?.substring(0, 40)}"`, 'success');
    }
  }

  // Recherche par texte
  const searchTexts = ['gérer', 'manage', 'voir', 'view', 'afficher', 'show'];
  log(`Recherche par texte: ${searchTexts.join(', ')}`, 'debug');

  const manageBtn = findButtonByText(searchTexts);

  if (manageBtn) {
    log(`RÉSULTAT ÉTAPE 5: Bouton Gérer trouvé: "${manageBtn.textContent?.trim()}"`, 'success');
    return { success: true, element: manageBtn };
  }

  // Fallback: cherche un bouton près de la section mémoire
  log('Fallback: boutons près de "Mémoire"/"Memory":', 'debug');
  const allButtons = [...document.querySelectorAll('button')];
  const memoryBtn = allButtons.find(b => {
    const parent = b.closest('div');
    const parentText = parent?.textContent?.toLowerCase() || '';
    return parentText.includes('mémoire') || parentText.includes('memory') || parentText.includes('remplissage');
  });

  if (memoryBtn) {
    log(`  ✓ Bouton trouvé via parent: "${memoryBtn.textContent?.trim()?.substring(0, 40)}"`, 'success');
    return { success: true, element: memoryBtn };
  }

  log(`RÉSULTAT ÉTAPE 5: Bouton Gérer NON trouvé`, 'error');
  return { success: false, element: null };
}

// ========== STEP 6: EXTRACT FROM MODAL ==========
async function step6_extractFromModal() {
  log('========== ÉTAPE 6: EXTRACTION MODALE ==========', 'info');

  const modal = document.querySelector('[role="dialog"]');

  if (!modal) {
    log('Aucune modale [role="dialog"] trouvée', 'error');
    return { success: false, memories: [] };
  }

  log(`Modale trouvée, contenu (100 chars): "${modal.textContent?.substring(0, 100)}"`, 'debug');

  // Analyse de la structure de la modale
  log('Structure de la modale:', 'debug');
  const tables = modal.querySelectorAll('table');
  log(`  - ${tables.length} table(s)`, 'debug');

  const rows = modal.querySelectorAll('tr');
  log(`  - ${rows.length} tr (lignes)`, 'debug');

  const cells = modal.querySelectorAll('td');
  log(`  - ${cells.length} td (cellules)`, 'debug');

  const scrollables = modal.querySelectorAll('[class*="overflow"]');
  log(`  - ${scrollables.length} éléments avec overflow`, 'debug');

  // Essaie d'extraire
  const memories = extractFromTable(modal);
  log(`Extraction: ${memories.length} éléments trouvés`, memories.length > 0 ? 'success' : 'warning');

  if (memories.length > 0) {
    log('Premiers éléments:', 'debug');
    memories.slice(0, 3).forEach((m, i) => {
      log(`  [${i}] "${m.text.substring(0, 60)}..."`, 'debug');
    });
  }

  return { success: memories.length > 0, memories };
}

// ========== NAVIGATION (avec diagnostic) ==========
async function navigateToMemories() {
  log('🚀 NAVIGATION AUTOMATIQUE AVEC DIAGNOSTIC', 'info');
  updateStatus('loading', 'Diagnostic en cours...');

  // ÉTAPE 1
  const step1 = await step1_findUserMenu();
  if (!step1.success) {
    return { success: false, error: 'Étape 1 échouée: Menu utilisateur non trouvé. Voir console.' };
  }

  log('Clic sur menu utilisateur...', 'info');
  step1.element.click();
  await wait(800);

  // ÉTAPE 2
  const step2 = await step2_findSettings();
  if (!step2.success) {
    return { success: false, error: 'Étape 2 échouée: Bouton Paramètres non trouvé. Voir console.' };
  }

  log('Clic sur Paramètres...', 'info');
  step2.element.click();
  await wait(1200);

  // ÉTAPE 3
  const step3 = await step3_findPersonalization();
  if (!step3.success) {
    log('Étape 3: Personnalisation non trouvé, on continue...', 'warning');
  } else {
    log('Clic sur Personnalisation...', 'info');
    step3.element.click();
    await wait(800);
  }

  // ÉTAPE 4
  const step4 = await step4_findMemorySection();
  if (step4.success) {
    step4.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await wait(500);
  }

  // ÉTAPE 5
  const step5 = await step5_findManageButton();
  if (!step5.success) {
    return { success: false, error: 'Étape 5 échouée: Bouton Gérer non trouvé. Voir console.' };
  }

  log('Clic sur Gérer...', 'info');
  step5.element.click();
  await wait(1500);

  return { success: true };
}

// ========== EXTRACTION ==========
async function extractMemories() {
  log('Extraction des éléments mémorisés...', 'info');
  updateStatus('loading', 'Extraction en cours...');

  const modal = await waitFor('[role="dialog"]', 5000);

  if (!modal) {
    return { success: false, error: 'Modale non trouvée', memories: [] };
  }

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

  const tableRows = container.querySelectorAll('tr');

  for (const row of tableRows) {
    const textCell = row.querySelector('td');
    if (!textCell) continue;

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

  if (memories.length === 0) {
    const divs = container.querySelectorAll('[class*="whitespace-pre-wrap"], [class*="py-2"]');

    for (const div of divs) {
      const text = div.textContent?.trim();
      if (text && text.length >= 10 && !isSystemText(text)) {
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

// ========== DIAGNOSTIC ONLY (sans clic) ==========
async function runDiagnosticOnly() {
  log('🔍 MODE DIAGNOSTIC SEUL (sans clic)', 'info');
  log('Analyse de la page actuelle...', 'info');

  await step1_findUserMenu();

  // Si un menu est ouvert, analyse aussi les étapes suivantes
  const menuOpen = document.querySelector('[role="menu"]');
  if (menuOpen) {
    await step2_findSettings();
  }

  const dialogOpen = document.querySelector('[role="dialog"]');
  if (dialogOpen) {
    await step3_findPersonalization();
    await step4_findMemorySection();
    await step5_findManageButton();
    await step6_extractFromModal();
  }

  log('=== FIN DU DIAGNOSTIC ===', 'info');
  return { diagnostic: true };
}

// ========== MAIN AUTO EXTRACT ==========
async function autoExtract() {
  if (isExtracting) {
    return { error: true, message: 'Extraction déjà en cours' };
  }

  isExtracting = true;

  try {
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

  // Nouveau: diagnostic seul
  if (request.action === 'diagnostic') {
    sendResponse({ started: true });
    runDiagnosticOnly();
    return true;
  }

  return false;
});

// ========== INIT ==========
log('🔧 Memory Extractor v3.3 DIAGNOSTIC chargé', 'info');
log('Pour diagnostic manuel, ouvrez la console et tapez:', 'info');
log('  - Étape 1 (menu user): copy(await step1_findUserMenu())', 'debug');
log('  - Étape 2 (settings): copy(await step2_findSettings())', 'debug');
log('  - Tous les boutons: diagAllButtons()', 'debug');

// Expose pour debug console
window.__memoryExtractor = {
  step1: step1_findUserMenu,
  step2: step2_findSettings,
  step3: step3_findPersonalization,
  step4: step4_findMemorySection,
  step5: step5_findManageButton,
  step6: step6_extractFromModal,
  diagAllButtons,
  runDiagnosticOnly
};
