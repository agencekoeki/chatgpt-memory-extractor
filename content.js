// ChatGPT Memory Extractor - Content Script v3.12 DIAGNOSTIC
// Mode debug pour identifier les bons sélecteurs

// Évite double chargement - wrap dans IIFE pour pouvoir return
(function() {
if (window.__memoryExtractorLoaded) {
  console.log('[MemoryExtractor] Déjà chargé, skip');
  return; // Exit silently
}
window.__memoryExtractorLoaded = true;

// State variables - using window to avoid redeclaration issues
window.__memoryExtractorState = window.__memoryExtractorState || {
  isExtracting: false,
  diagnosticMode: true
};
const state = window.__memoryExtractorState;

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

// ========== I18N - CHATGPT LABELS ==========
// Labels used to navigate ChatGPT UI in different languages
const CHATGPT_LABELS = {
  en: {
    profileMenu: ['Open profile menu', 'profile menu', 'Profile'],
    settings: ['Settings'],
    personalization: ['Personalization', 'Customize'],
    memory: ['Memory', 'Memories', 'Memorized'],
    manage: ['Manage', 'View', 'Show', 'View all'],
    personalizationTab: ['personalization', 'customization', 'customize']
  },
  fr: {
    profileMenu: ['Ouvrir le menu du profil', 'menu du profil', 'Profil'],
    settings: ['Paramètres'],
    personalization: ['Personnalisation', 'Remplissage'],
    memory: ['Mémoire', 'Éléments mémorisés', 'mémorisés', 'Remplissage'],
    manage: ['Gérer', 'Voir', 'Afficher', 'Voir tout'],
    personalizationTab: ['personnalisation', 'personnalisé']
  }
};

// Detect ChatGPT page language based on visible text
function detectChatGPTLanguage() {
  const pageText = document.body?.textContent || '';

  const frIndicators = [
    'Éléments mémorisés', 'Remplissage', 'Personnalisation',
    'Nouveau chat', 'Paramètres', 'Ouvrir le menu'
  ];

  const enIndicators = [
    'Memories', 'Personalization', 'New chat',
    'Settings', 'Open profile menu'
  ];

  let frScore = 0;
  let enScore = 0;

  for (const indicator of frIndicators) {
    if (pageText.includes(indicator)) frScore++;
  }

  for (const indicator of enIndicators) {
    if (pageText.includes(indicator)) enScore++;
  }

  const lang = frScore > enScore ? 'fr' : 'en';
  log(`ChatGPT language detected: ${lang} (FR:${frScore} EN:${enScore})`, 'debug');
  return lang;
}

// Get current language labels
function getLabels() {
  const lang = detectChatGPTLanguage();
  return CHATGPT_LABELS[lang] || CHATGPT_LABELS.en;
}

// Check if text matches any label in the array (case-insensitive)
function matchesLabel(text, labelArray) {
  const lowerText = text?.toLowerCase() || '';
  return labelArray.some(label =>
    lowerText === label.toLowerCase() ||
    lowerText.includes(label.toLowerCase())
  );
}

// ========== UTILITIES ==========
const wait = ms => new Promise(r => setTimeout(r, ms));

// Simulation de clic robuste pour éléments React/Radix
function simulateClick(element) {
  if (!element) return false;

  log(`Simulation clic sur: ${element.tagName} (${element.getAttribute('data-testid') || element.getAttribute('aria-label') || 'no-id'})`, 'debug');

  // Vérifier si l'élément est dans le viewport, sinon scroller
  let rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Si l'élément est hors du viewport, on le scroll en vue
  if (rect.top < 0 || rect.bottom > viewportHeight || rect.left < 0 || rect.right > viewportWidth) {
    log(`  Élément hors viewport (y=${Math.round(rect.top)}), scroll...`, 'debug');
    element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
    // Recalculer après scroll
    rect = element.getBoundingClientRect();
  }

  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  log(`  Position: x=${Math.round(x)}, y=${Math.round(y)}`, 'debug');

  // Trouver l'élément au point de clic, mais IGNORER les overlays/backdrops
  let realTarget = document.elementFromPoint(x, y);

  // Filtrer les overlays (fixed, z-index élevé, inset-0, etc.)
  if (realTarget) {
    const realClasses = realTarget.className?.toString?.() || '';
    const realStyle = window.getComputedStyle(realTarget);
    const isOverlay = realClasses.includes('fixed') ||
                      realClasses.includes('inset-0') ||
                      realClasses.includes('z-50') ||
                      realClasses.includes('backdrop') ||
                      (realStyle.position === 'fixed' && realStyle.inset === '0px');

    if (isOverlay && realTarget !== element) {
      log(`  Overlay détecté, ignoré: ${realTarget.tagName}`, 'debug');
      realTarget = element; // Utiliser l'élément original
    }
  }

  if (realTarget && realTarget !== element) {
    log(`  Élément réel au point: ${realTarget.tagName} (${realTarget.className?.substring?.(0, 30) || ''})`, 'debug');
  }
  const targetElement = realTarget || element;

  const eventOptions = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    button: 0,
    buttons: 1
  };

  // Méthode 1: click() natif sur l'élément réel
  try {
    targetElement.click();
    log(`  click() sur élément réel`, 'debug');
  } catch (e) {
    log(`  click() échoué: ${e.message}`, 'warning');
  }

  // Méthode 2: Séquence complète d'événements sur l'élément original ET réel
  [element, targetElement].forEach(el => {
    if (!el) return;
    try {
      el.dispatchEvent(new PointerEvent('pointerdown', { ...eventOptions, pointerType: 'mouse' }));
      el.dispatchEvent(new MouseEvent('mousedown', eventOptions));
      el.dispatchEvent(new PointerEvent('pointerup', { ...eventOptions, pointerType: 'mouse' }));
      el.dispatchEvent(new MouseEvent('mouseup', eventOptions));
      el.dispatchEvent(new MouseEvent('click', eventOptions));
    } catch (e) {}
  });

  // Méthode 3: Focus + Enter/Space
  try {
    element.focus();
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    // Aussi essayer Space
    element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', keyCode: 32, bubbles: true }));
  } catch (e) {
    log(`  Keyboard events échoué: ${e.message}`, 'warning');
  }

  // Méthode 4: Chercher un <button> ou <a> enfant et cliquer dessus
  const clickableChild = element.querySelector('button, a, [onclick], [role="button"]');
  if (clickableChild && clickableChild !== element) {
    log(`  Clic sur enfant cliquable: ${clickableChild.tagName}`, 'debug');
    try {
      clickableChild.click();
    } catch (e) {}
  }

  return true;
}

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

  // Liste des sélecteurs PAR ORDRE DE PRIORITÉ (le plus fiable en premier)
  const selectors = [
    // Sélecteur exact trouvé sur ChatGPT (décembre 2024)
    { name: 'data-testid="accounts-profile-button"', sel: '[data-testid="accounts-profile-button"]' },
    // Aria label pour ouvrir le menu profil (FR)
    { name: 'aria-label="Ouvrir le menu du profil"', sel: '[aria-label="Ouvrir le menu du profil"]' },
    // Aria label pour ouvrir le menu profil (EN)
    { name: 'aria-label="Open profile menu"', sel: '[aria-label="Open profile menu"]' },
    // Fallbacks plus génériques
    { name: 'data-testid contient "profile-button"', sel: '[data-testid*="profile-button"]' },
    { name: 'data-testid contient "account"', sel: '[data-testid*="account"]' },
    { name: 'aria-label contient "profil"', sel: '[aria-label*="profil"]' },
    { name: 'aria-label contient "profile"', sel: '[aria-label*="profile"]' },
  ];

  log('Recherche avec sélecteurs CSS (par priorité):', 'debug');
  let foundBtn = null;

  for (const s of selectors) {
    const el = document.querySelector(s.sel);
    if (el && el.offsetHeight > 0) {
      log(`  ✓ TROUVÉ: ${s.name}`, 'success');
      log(`    -> ${diagElement(el)}`, 'debug');
      // Prend le premier trouvé qui est visible
      if (!foundBtn) {
        foundBtn = el;
        log(`  >> SÉLECTIONNÉ comme bouton profil`, 'success');
      }
    } else if (el) {
      log(`  ⚠ Trouvé mais invisible: ${s.name}`, 'warning');
    } else {
      log(`  ✗ ${s.name}`, 'debug');
    }
  }

  // Fallback: cherche un bouton/div cliquable avec role="button" et aria-label profil
  if (!foundBtn) {
    log('Fallback: recherche éléments avec role="button":', 'debug');
    const roleButtons = document.querySelectorAll('[role="button"]');
    for (const btn of roleButtons) {
      const aria = btn.getAttribute('aria-label')?.toLowerCase() || '';
      const testId = btn.getAttribute('data-testid')?.toLowerCase() || '';
      if ((aria.includes('profil') || aria.includes('profile') || testId.includes('profile') || testId.includes('account')) && btn.offsetHeight > 0) {
        log(`  ✓ role="button" trouvé: ${diagElement(btn)}`, 'success');
        foundBtn = btn;
        break;
      }
    }
  }

  // Affiche quelques boutons de la nav pour diagnostic
  log('Boutons dans nav (premiers 10):', 'debug');
  const navButtons = document.querySelectorAll('nav button, aside button');
  [...navButtons].slice(0, 10).forEach((btn, i) => {
    if (btn.offsetHeight > 0) {
      log(`  nav[${i}]: testId="${btn.getAttribute('data-testid') || '-'}" aria="${btn.getAttribute('aria-label') || '-'}"`, 'debug');
    }
  });

  if (foundBtn) {
    log(`RÉSULTAT ÉTAPE 1: Bouton profil trouvé!`, 'success');
    return { success: true, element: foundBtn };
  } else {
    log(`RÉSULTAT ÉTAPE 1: AUCUN bouton profil trouvé`, 'error');
    diagAllButtons();
    return { success: false, element: null };
  }
}

// ========== STEP 2: FIND SETTINGS OR PERSONALIZATION IN MENU ==========
async function step2_findSettings() {
  log('========== STEP 2: SETTINGS/PERSONALIZATION BUTTON ==========', 'info');

  const labels = getLabels();

  // Cherche les menuitems visibles
  const menuItems = document.querySelectorAll('[role="menuitem"], [role="menu"] a, [role="menu"] button, [data-radix-menu-content] a, [data-radix-menu-content] button');
  log(`${menuItems.length} menu items found`, 'debug');

  let personnalisationBtn = null;
  let parametresBtn = null;

  menuItems.forEach((item, i) => {
    if (item.offsetHeight > 0) {
      const text = item.textContent?.trim() || '';
      log(`  menu[${i}]: "${text.substring(0, 40)}"`, 'debug');

      // Look for Personalization (priority)
      if (matchesLabel(text, labels.personalization)) {
        personnalisationBtn = item;
        log(`    >> PERSONALIZATION found!`, 'success');
      }
      // Look for Settings (fallback)
      else if (matchesLabel(text, labels.settings) && !parametresBtn) {
        parametresBtn = item;
        log(`    >> SETTINGS found!`, 'success');
      }
    }
  });

  // Priority: Personalization > Settings
  if (personnalisationBtn) {
    log(`STEP 2 RESULT: Personalization found directly in menu!`, 'success');
    return { success: true, element: personnalisationBtn, isPersonalization: true };
  }

  if (parametresBtn) {
    log(`STEP 2 RESULT: Settings found: "${parametresBtn.textContent?.trim()}"`, 'success');
    return { success: true, element: parametresBtn, isPersonalization: false };
  }

  log(`STEP 2 RESULT: No button found`, 'error');
  return { success: false, element: null };
}

// ========== STEP 3: FIND PERSONALIZATION TAB ==========
async function step3_findPersonalization() {
  log('========== STEP 3: PERSONALIZATION TAB ==========', 'info');

  const labels = getLabels();

  // Look for all tabs
  const tabs = document.querySelectorAll('[role="tab"], [role="tablist"] button, button[class*="tab"]');
  log(`${tabs.length} potential tabs found`, 'debug');

  tabs.forEach((tab, i) => {
    log(`  tab[${i}]: "${tab.textContent?.trim()?.substring(0, 40)}"`, 'debug');
  });

  // Also look for buttons in the settings modal
  const dialog = document.querySelector('[role="dialog"]');
  if (dialog) {
    log('Modal/dialog found, buttons inside:', 'debug');
    const dialogBtns = dialog.querySelectorAll('button, [role="button"]');
    dialogBtns.forEach((btn, i) => {
      if (btn.offsetHeight > 0) {
        log(`  dialog-btn[${i}]: "${btn.textContent?.trim()?.substring(0, 40)}"`, 'debug');
      }
    });
  }

  const personalizationTab = findButtonByText(labels.personalizationTab);

  if (personalizationTab) {
    log(`STEP 3 RESULT: Tab found: "${personalizationTab.textContent?.trim()}"`, 'success');
    return { success: true, element: personalizationTab };
  } else {
    log(`STEP 3 RESULT: Personalization tab NOT found`, 'error');
    return { success: false, element: null };
  }
}

// ========== STEP 4: FIND MEMORY SECTION ==========
async function step4_findMemorySection() {
  log('========== STEP 4: MEMORY SECTION ==========', 'info');

  const labels = getLabels();
  const searchTexts = labels.memory;
  log(`Searching for: ${searchTexts.join(', ')}`, 'debug');

  // Look in different element types
  const containers = ['div', 'span', 'h2', 'h3', 'h4', 'p', 'label'];

  for (const tag of containers) {
    const elements = document.querySelectorAll(tag);
    for (const el of elements) {
      const text = el.textContent?.trim() || '';
      if (matchesLabel(text, searchTexts) && text.length < 100) {
        log(`  Found in <${tag}>: "${text.substring(0, 50)}"`, 'success');
      }
    }
  }

  const memorySection = findByText(searchTexts, 'div, span, h2, h3, h4, label');

  if (memorySection) {
    log(`STEP 4 RESULT: Memory section found`, 'success');
    return { success: true, element: memorySection };
  } else {
    log(`STEP 4 RESULT: Memory section NOT found`, 'error');
    return { success: false, element: null };
  }
}

// ========== STEP 5: FIND MANAGE BUTTON ==========
async function step5_findManageButton() {
  log('========== STEP 5: MANAGE BUTTON ==========', 'info');

  const labels = getLabels();

  // Specific selectors
  const selectors = [
    '[data-testid*="memory"]',
    '[data-testid*="manage"]',
    '[data-testid*="gerer"]',
    'button[aria-label*="memory"]',
    'button[aria-label*="manage"]',
  ];

  log('Searching with selectors:', 'debug');
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      log(`  ${sel}: "${el.textContent?.trim()?.substring(0, 40)}"`, 'success');
    }
  }

  // Text search
  log(`Searching for: ${labels.manage.join(', ')}`, 'debug');

  const manageBtn = findButtonByText(labels.manage);

  if (manageBtn) {
    log(`STEP 5 RESULT: Manage button found: "${manageBtn.textContent?.trim()}"`, 'success');
    return { success: true, element: manageBtn };
  }

  // Fallback: look for button near memory section
  log('Fallback: buttons near Memory section:', 'debug');
  const allButtons = [...document.querySelectorAll('button')];
  const memoryBtn = allButtons.find(b => {
    const parent = b.closest('div');
    const parentText = parent?.textContent || '';
    return matchesLabel(parentText, labels.memory);
  });

  if (memoryBtn) {
    log(`  Button found via parent: "${memoryBtn.textContent?.trim()?.substring(0, 40)}"`, 'success');
    return { success: true, element: memoryBtn };
  }

  log(`STEP 5 RESULT: Manage button NOT found`, 'error');
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

  // ÉTAPE 0: Vérifier si la sidebar est visible, sinon l'ouvrir
  const sidebarToggle = document.querySelector('[data-testid="open-sidebar-button"]') ||
                        document.querySelector('button[aria-label*="Ouvrir la barre"]') ||
                        document.querySelector('button[aria-label*="Open sidebar"]');

  if (sidebarToggle && sidebarToggle.offsetHeight > 0) {
    log('Sidebar repliée détectée, ouverture...', 'warning');
    simulateClick(sidebarToggle);
    await wait(800);
  }

  // ÉTAPE 1
  const step1 = await step1_findUserMenu();
  if (!step1.success) {
    return { success: false, error: 'Étape 1 échouée: Menu utilisateur non trouvé. Voir console.' };
  }

  log('Clic sur menu utilisateur...', 'info');
  simulateClick(step1.element);

  // Attendre que le menu s'ouvre (cherche role="menu" ou un popover)
  log('Attente ouverture du menu...', 'debug');
  let menuOpened = false;
  for (let i = 0; i < 15; i++) {
    await wait(200);
    const menu = document.querySelector('[role="menu"], [data-radix-menu-content], [data-state="open"]');
    if (menu) {
      log('Menu ouvert détecté!', 'success');
      menuOpened = true;
      break;
    }
  }

  if (!menuOpened) {
    log('Menu non détecté après clic, on continue quand même...', 'warning');
  }

  await wait(300);

  // ÉTAPE 2: Cherche Personnalisation ou Paramètres dans le menu
  const step2 = await step2_findSettings();
  if (!step2.success) {
    return { success: false, error: 'Étape 2 échouée: Bouton Paramètres/Personnalisation non trouvé. Voir console.' };
  }

  if (step2.isPersonalization) {
    // Raccourci: on a trouvé Personnalisation directement dans le menu!
    log('Clic sur Personnalisation (raccourci)...', 'info');
    simulateClick(step2.element);
    await wait(1500);
    // On saute l'étape 3
  } else {
    // Chemin classique: Paramètres puis Personnalisation
    log('Clic sur Paramètres...', 'info');
    simulateClick(step2.element);
    await wait(1200);

    // ÉTAPE 3
    const step3 = await step3_findPersonalization();
    if (!step3.success) {
      log('Étape 3: Personnalisation non trouvé, on continue...', 'warning');
    } else {
      log('Clic sur Personnalisation...', 'info');
      simulateClick(step3.element);
      await wait(800);
    }
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
  simulateClick(step5.element);
  await wait(1500);

  return { success: true };
}

// ========== EXTRACTION ==========
async function extractMemories() {
  const labels = getLabels();
  log('Extracting memories...', 'info');
  updateStatus('loading', 'Extraction in progress...');

  // Helper to check if text contains memory labels
  const hasMemoryContent = (text) => matchesLabel(text || '', labels.memory);

  // Look for memories modal with different selectors
  let modal = null;

  // METHOD 1: Exact data-testid selector
  modal = document.querySelector('[data-testid="modal-memories"]');
  if (modal) {
    log('Modal found via data-testid="modal-memories"', 'success');
  }

  // METHOD 2: Radix popover with memory title
  if (!modal) {
    const radixPopovers = document.querySelectorAll('[data-radix-popper-content-wrapper] > div, [data-radix-menu-content]');
    log(`${radixPopovers.length} radix popover(s) found`, 'debug');

    for (const pop of radixPopovers) {
      if (hasMemoryContent(pop.textContent) && pop.offsetHeight > 0) {
        modal = pop;
        log('Modal found via Radix popover', 'success');
        break;
      }
    }
  }

  // METHOD 3: Fixed/absolute element with memory content
  if (!modal) {
    const fixedElements = document.querySelectorAll('.fixed, .absolute, [class*="popover"], [class*="modal"]');
    log(`${fixedElements.length} fixed/absolute elements found`, 'debug');

    for (const el of fixedElements) {
      if (el.offsetHeight > 200 && el.offsetWidth > 200) {
        const hasTable = el.querySelector('table');
        if (hasMemoryContent(el.textContent) && hasTable) {
          modal = el;
          log('Modal found via fixed/absolute + table', 'success');
          break;
        }
      }
    }
  }

  // METHOD 4: Table with memory content
  if (!modal) {
    const tables = document.querySelectorAll('table');
    log(`${tables.length} table(s) found`, 'debug');

    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      if (rows.length >= 2) {
        const firstRowText = rows[0]?.textContent?.trim() || '';
        if (firstRowText.length > 50) {
          modal = table.closest('[class*="fixed"]') ||
                  table.closest('[class*="absolute"]') ||
                  table.closest('[class*="popover"]') ||
                  table.closest('[data-state="open"]') ||
                  table.parentElement?.parentElement?.parentElement;
          if (modal) {
            log(`Modal found via table with ${rows.length} rows`, 'success');
            break;
          }
        }
      }
    }
  }

  // METHOD 5 (fallback): role="dialog"
  if (!modal) {
    const dialogs = document.querySelectorAll('[role="dialog"]');
    for (const dialog of dialogs) {
      if (hasMemoryContent(dialog.textContent)) {
        modal = dialog;
        log('Modal found via role="dialog"', 'success');
        break;
      }
    }
  }

  // METHOD 6 (last resort): direct visible table
  if (!modal) {
    const allTables = document.querySelectorAll('table');
    for (const table of allTables) {
      if (table.offsetHeight > 100 && table.querySelectorAll('tr').length > 1) {
        const tableText = table.textContent || '';
        if (tableText.length > 200) {
          modal = table;
          log('Modal found via direct table (last resort)', 'success');
          break;
        }
      }
    }
  }

  if (!modal) {
    log('No memories modal found after 6 methods', 'error');
    log(`Page contains: ${document.querySelectorAll('table').length} tables, ${document.querySelectorAll('[role="dialog"]').length} dialogs`, 'debug');
    return { success: false, error: 'Memories modal not found', memories: [] };
  }

  log('Memories modal detected', 'success');
  log(`Modal content (200 chars): "${modal.textContent?.substring(0, 200)}"`, 'debug');

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
  const seenTexts = new Set();

  log('Analyse structure modale pour extraction...', 'debug');

  // MÉTHODE 1 (PRINCIPALE): Lignes de table directement
  // Chaque souvenir est dans une ligne <tr> avec une cellule <td>
  const table = container.querySelector('table');
  if (table) {
    const rows = table.querySelectorAll('tr');
    log(`  Méthode 1: Table trouvée avec ${rows.length} lignes`, 'debug');

    for (const row of rows) {
      const firstCell = row.querySelector('td');
      if (!firstCell) continue;

      // Le texte du souvenir est dans le premier div significatif de la cellule
      // Structure: td > div > div (le div interne contient le texte)
      let text = '';

      // Essayer de trouver le div avec le texte (souvent le plus profond)
      const allDivs = firstCell.querySelectorAll('div');
      for (const div of allDivs) {
        const divText = div.textContent?.trim();
        // Prendre le div le plus interne qui a du texte substantiel
        // et qui n'est PAS un conteneur de plusieurs enfants
        if (divText && divText.length >= 30 && div.querySelectorAll('div').length === 0) {
          text = divText;
          break;
        }
      }

      // Fallback: prendre le texte de la cellule si pas trouvé
      if (!text) {
        text = firstCell.textContent?.trim();
      }

      if (text && text.length >= 30 && text.length < 3000 && !isSystemText(text) && !seenTexts.has(text)) {
        seenTexts.add(text);
        memories.push({ text, timestamp: new Date().toISOString() });
        log(`  + Mémoire: "${text.substring(0, 70)}..."`, 'debug');
      }
    }
  }

  // MÉTHODE 2: Divs avec classe whitespace (fallback si pas de table)
  if (memories.length === 0) {
    log('  Méthode 2: recherche divs whitespace...', 'debug');
    const memoryDivs = container.querySelectorAll(
      '[class*="whitespace"], [class*="pre-wrap"]'
    );

    for (const div of memoryDivs) {
      const text = div.textContent?.trim();
      if (text && text.length >= 30 && !isSystemText(text) && !seenTexts.has(text)) {
        seenTexts.add(text);
        memories.push({ text, timestamp: new Date().toISOString() });
        log(`  + Mémoire (whitespace): "${text.substring(0, 60)}..."`, 'debug');
      }
    }
  }

  // MÉTHODE 3: Divs à côté d'un bouton delete (icône poubelle)
  if (memories.length === 0) {
    log('  Méthode 3: recherche éléments avec bouton supprimer...', 'debug');
    const deleteButtons = container.querySelectorAll('button');

    for (const btn of deleteButtons) {
      // Si c'est un bouton delete, le souvenir est dans un sibling ou parent
      const hasSvg = btn.querySelector('svg');
      if (!hasSvg) continue;

      // Remonter au parent row/conteneur
      const row = btn.closest('tr') || btn.closest('[class*="flex"]');
      if (row) {
        const textEl = row.querySelector('td') || row.querySelector('div');
        if (textEl) {
          const text = textEl.textContent?.trim();
          if (text && text.length >= 30 && text.length < 3000 && !isSystemText(text) && !seenTexts.has(text)) {
            seenTexts.add(text);
            memories.push({ text, timestamp: new Date().toISOString() });
            log(`  + Mémoire (delete): "${text.substring(0, 60)}..."`, 'debug');
          }
        }
      }
    }
  }

  // Nettoyage: supprimer les doublons partiels (un texte contenu dans un autre)
  const cleaned = memories.filter((mem, idx) => {
    for (let i = 0; i < memories.length; i++) {
      if (i !== idx && memories[i].text.includes(mem.text) && memories[i].text.length > mem.text.length) {
        return false;
      }
    }
    return true;
  });

  log(`  TOTAL: ${cleaned.length} mémoires (après nettoyage)`, cleaned.length > 0 ? 'success' : 'warning');
  return cleaned;
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
  const lowerText = text.toLowerCase();

  // Textes d'interface à ignorer
  const exactMatches = [
    'remplissage', 'filling', 'gérer', 'manage', 'fermer', 'close',
    'personnalisation', 'personalization', 'supprimer', 'delete',
    'copier', 'copy', 'annuler', 'cancel', 'sauvegarder', 'save',
    'par défaut', 'professionnel', 'chaleureux', 'spontané', 'décalé', 'efficace'
  ];

  // Si c'est un match exact d'un texte système
  for (const pattern of exactMatches) {
    if (lowerText === pattern) return true;
  }

  // Patterns qui indiquent du texte d'interface (pas un souvenir)
  const interfacePatterns = [
    'éléments mémorisés', 'memorized items', 'saved memories',
    'supprimer tout', 'delete all', 'clear all',
    'mémoire pleine', 'memory full',
    'une fois la mémoire pleine',
    'les réponses pourraient',
    'chatgpt peut utiliser',
    'personnaliser les requêtes',
    'autorisez chatgpt',
    'faire référence aux éléments',
    'enregistrer et à utiliser',
    'par défautprofessionnel',  // Options de ton concaténées
    'chaleureuxspontané',
    'décaléefficace'
  ];

  for (const pattern of interfacePatterns) {
    if (lowerText.includes(pattern)) return true;
  }

  // Si le texte est très court et contient des mots système
  if (text.length < 40) {
    const shortPatterns = ['remplissage', 'gérer', 'manage', 'supprimer', 'delete', 'fermer', 'close'];
    for (const pattern of shortPatterns) {
      if (lowerText.includes(pattern)) return true;
    }
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
  if (state.isExtracting) {
    return { error: true, message: 'Extraction already in progress' };
  }

  state.isExtracting = true;
  log('autoExtract() started', 'info');

  const labels = getLabels();

  // Helper to check if text contains memory labels
  const hasMemoryContent = (text) => matchesLabel(text || '', labels.memory);

  try {
    // Enhanced memory modal detection (multiple methods)
    let isMemoryModal = false;

    // Method 1: role="dialog" with memory text
    let modal = document.querySelector('[role="dialog"]');
    if (modal) {
      isMemoryModal = hasMemoryContent(modal.textContent);
      if (isMemoryModal) log('Modal found via role="dialog"', 'success');
    }

    // Method 2: Radix popover with memory table
    if (!isMemoryModal) {
      const popovers = document.querySelectorAll('[data-radix-popper-content-wrapper], [class*="popover"], .fixed[class*="z-"]');
      for (const pop of popovers) {
        if (pop.offsetHeight > 0 && hasMemoryContent(pop.textContent)) {
          isMemoryModal = true;
          log('Modal found via popover/radix', 'success');
          break;
        }
      }
    }

    // Method 3: Look for visible table with memory content
    if (!isMemoryModal) {
      const tables = document.querySelectorAll('table');
      for (const table of tables) {
        const parent = table.closest('[class*="fixed"], [class*="absolute"], [role="dialog"]');
        if (parent && table.querySelectorAll('tr').length > 1) {
          if (hasMemoryContent(parent.textContent)) {
            isMemoryModal = true;
            log('Modal found via table parent', 'success');
            break;
          }
        }
      }
    }

    log(`Memory modal detected: ${isMemoryModal}`, isMemoryModal ? 'success' : 'warning');

    if (!isMemoryModal) {
      log('Navigating to memories...', 'info');
      const navResult = await navigateToMemories();
      if (!navResult.success) {
        state.isExtracting = false;
        return { error: true, message: navResult.error };
      }
    }

    const result = await extractMemories();

    chrome.runtime.sendMessage({
      action: 'extractionComplete',
      result
    }).catch(() => {});

    state.isExtracting = false;
    return { started: true };

  } catch (error) {
    state.isExtracting = false;
    log('Error: ' + error.message, 'error');
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

  // Nouveau: interrogation
  if (request.action === 'startInterrogation') {
    log('[DEBUG] Received startInterrogation request, mode: ' + request.mode, 'info');
    sendResponse({ started: true });

    const mode = request.mode || 'standard'; // 'quick', 'standard', 'complete'
    startInterrogation(mode).then(result => {
      log('[DEBUG] startInterrogation result: ' + JSON.stringify(result), 'info');
      if (result.error) {
        chrome.runtime.sendMessage({
          action: 'interrogationComplete',
          results: [],
          error: result.message
        }).catch(() => {});
      }
    });

    return true;
  }

  return false;
});

// ========== INTERROGATION ==========
// Prompts structurés pour extraire des observations froides et factuelles
// Chaque prompt met ChatGPT dans un état "analytique" sans flatterie

const SYSTEM_PREAMBLE = `Tu es un système d'analyse comportementale. Ton rôle: observer froidement, sans jugement, sans flatterie, sans politesse excessive.

RÈGLES STRICTES:
- Ne dis QUE ce que tu as RÉELLEMENT observé dans nos échanges passés
- Si tu n'as pas de données → réponds "Données insuffisantes"
- Pas d'invention, pas de supposition, pas de généralisation
- Pas de formules de politesse ("c'est une excellente question", "vous semblez être quelqu'un de formidable")
- Ton froid, clinique, factuel. Comme un rapport médical.

POURQUOI ces règles: Je veux comprendre ce que tu as VRAIMENT retenu de moi, pas ce que tu penses que je veux entendre. Les flatteries faussent l'analyse. Les inventions sont inutiles. Seuls les faits observés comptent.`;

const INTERROGATION_PROMPTS = [
  {
    id: 'identity',
    prompt: `${SYSTEM_PREAMBLE}

ANALYSE - Étape par étape:
1. Parcours mentalement nos conversations passées
2. Identifie les éléments factuels sur mon identité (prénom, situation, contexte)
3. Note ce qui revient souvent vs ce qui n'a été dit qu'une fois

QUESTION: Qui suis-je? Décris factuellement ce que tu sais de mon identité.
Format: liste à puces, données brutes uniquement.`,
    category: 'identite'
  },
  {
    id: 'interests',
    prompt: `${SYSTEM_PREAMBLE}

ANALYSE - Étape par étape:
1. Liste les sujets que j'ai abordés avec toi
2. Compte la fréquence approximative de chaque sujet
3. Distingue: passion (revient souvent) vs curiosité ponctuelle (une seule fois)

QUESTION: Quels sont mes centres d'intérêt réels basés sur nos échanges?
Format: liste ordonnée par fréquence d'apparition.`,
    category: 'interets'
  },
  {
    id: 'profession',
    prompt: `${SYSTEM_PREAMBLE}

ANALYSE - Étape par étape:
1. Repère les indices professionnels dans nos conversations (métier, projets, clients, collègues)
2. Identifie le niveau d'expertise apparent (débutant, intermédiaire, expert)
3. Note les frustrations ou ambitions professionnelles mentionnées

QUESTION: Que sais-tu de ma situation professionnelle?
Format: faits observés uniquement, pas d'interprétation.`,
    category: 'professionnel'
  },
  {
    id: 'personality',
    prompt: `${SYSTEM_PREAMBLE}

ANALYSE - Étape par étape:
1. Observe mon style de communication (formel/informel, long/court, émotif/rationnel)
2. Note les patterns récurrents dans ma façon de formuler les choses
3. Identifie les contradictions éventuelles entre ce que je dis et comment je le dis

QUESTION: Quels traits de personnalité transparaissent dans ma façon d'écrire?
Format: observations comportementales, pas de jugements de valeur.`,
    category: 'personnalite'
  },
  {
    id: 'weaknesses',
    prompt: `${SYSTEM_PREAMBLE}

ANALYSE - Étape par étape:
1. Repère les moments où j'ai exprimé du doute, de la frustration, de l'inquiétude
2. Identifie les sujets que j'évite ou que je survole
3. Note les demandes d'aide récurrentes (ce sont souvent des points faibles)

QUESTION: Quelles faiblesses, vulnérabilités ou zones d'inconfort as-tu observées?
Format: liste factuelle, sans ménagement mais sans cruauté.`,
    category: 'vulnerabilites'
  },
  {
    id: 'biases',
    prompt: `${SYSTEM_PREAMBLE}

ANALYSE - Étape par étape:
1. Repère mes opinions tranchées ou récurrentes
2. Identifie ce que je critique souvent vs ce que je valorise
3. Note les biais cognitifs apparents (confirmation, optimisme, etc.)

QUESTION: Quels biais, préjugés ou angles morts as-tu détectés dans ma façon de penser?
Format: observations neutres, exemples concrets si possible.`,
    category: 'biais'
  },
  // ===== PROFILAGE PSYCHOLOGIQUE PROFOND =====
  {
    id: 'personal_foundations',
    prompt: `${SYSTEM_PREAMBLE}

ANALYSE - Étape par étape:
1. Repère les mentions de famille, relations, santé, loisirs, lieu de vie
2. Identifie ce qui semble structurer ma vie personnelle (piliers)
3. Note les ruptures, transitions, ou événements marquants évoqués

QUESTION: Quels sont les éléments fondateurs de ma vie personnelle?
- Qu'est-ce qui structure mon quotidien hors travail?
- Quelles personnes/relations semblent importantes?
- Quels événements de vie ont été mentionnés?
Format: liste factuelle par catégorie.`,
    category: 'fondations_perso'
  },
  {
    id: 'professional_foundations',
    prompt: `${SYSTEM_PREAMBLE}

ANALYSE - Étape par étape:
1. Retrace mon parcours professionnel tel que tu l'as compris
2. Identifie les moments charnières (créations, transitions, échecs, succès)
3. Note ce qui semble être mes compétences clés vs ce que j'apprends encore

QUESTION: Quels sont les éléments fondateurs de ma vie professionnelle?
- Quel parcours, quelles étapes?
- Quels projets/clients/missions récurrents?
- Quelle vision ou ambition professionnelle?
Format: chronologie ou structure factuelle.`,
    category: 'fondations_pro'
  },
  {
    id: 'life_drivers',
    prompt: `${SYSTEM_PREAMBLE}

ANALYSE - Étape par étape:
1. Observe ce qui me fait agir: qu'est-ce que je cherche à obtenir ou éviter?
2. Identifie mes motivations profondes (argent, reconnaissance, liberté, impact, sécurité, famille...)
3. Note les patterns: est-ce que je fuis quelque chose ou je poursuis quelque chose?

QUESTION: Qu'est-ce qui drive ma vie? Qu'est-ce qui me fait bouger?
- Quelles motivations transparaissent?
- Qu'est-ce que je cherche vraiment?
- Qu'est-ce que j'essaie d'éviter?
Format: motivations observées avec exemples.`,
    category: 'moteurs'
  },
  {
    id: 'sensitive_topics',
    prompt: `${SYSTEM_PREAMBLE}

ANALYSE - Étape par étape:
1. Repère les sujets où je change de ton (plus défensif, plus émotif, plus prudent)
2. Identifie ce que j'évite de mentionner ou que je survole rapidement
3. Note comment je formule quand j'aborde quelque chose de délicat

QUESTION: Comment j'aborde les sujets sensibles?
- Quels sujets semblent sensibles pour moi?
- Quelle stratégie j'adopte (évitement, humour, rationalisation)?
- Y a-t-il des tabous apparents?
Format: observations comportementales.`,
    category: 'sensibilites'
  },
  {
    id: 'decision_brain',
    prompt: `${SYSTEM_PREAMBLE}

MODÈLE D'ANALYSE - Centre de gravité décisionnel:
- RATIONNEL (néocortex): cherche données, preuves, comparaisons, analyse
- ÉMOTIONNEL (limbique): cherche connexion, histoire, appartenance, ressenti
- INSTINCTIF (reptilien): cherche sécurité, urgence, action immédiate, survie

ANALYSE - Étape par étape:
1. Observe comment je formule mes demandes et mes décisions
2. Note si je demande plus souvent des données/preuves, des histoires/exemples, ou des solutions rapides
3. Identifie mon mode par défaut quand je suis sous pression

QUESTION: Quel est mon centre de gravité décisionnel dominant?
- Rationnel, émotionnel, ou instinctif?
- Comment ça se manifeste dans nos échanges?
Format: diagnostic avec exemples concrets.`,
    category: 'cerveau'
  },
  {
    id: 'behavior_profile',
    prompt: `${SYSTEM_PREAMBLE}

MODÈLE D'ANALYSE - Profils comportementaux:
- EXPLORATEUR (dopamine): nouveauté, risque, créativité, impatience, multi-projets
- BÂTISSEUR (sérotonine): stabilité, méthode, règles, planification, prudence
- DIRECTEUR (testostérone): logique, compétition, efficacité, décision rapide, leadership
- NÉGOCIATEUR (œstrogène): empathie, consensus, nuance, vision globale, patience

ANALYSE - Étape par étape:
1. Observe ma façon d'aborder les problèmes et projets
2. Note si je cherche plutôt la nouveauté, la structure, l'efficacité, ou l'harmonie
3. Identifie le pattern dominant dans mes demandes

QUESTION: Quel profil comportemental dominant?
- Un profil principal + un secondaire si visible
- Manifestations concrètes dans nos échanges
Format: profil identifié avec justification.`,
    category: 'profil_comportemental'
  },
  {
    id: 'thinking_system',
    prompt: `${SYSTEM_PREAMBLE}

MODÈLE D'ANALYSE - Système 1 vs Système 2 (Kahneman):
- SYSTÈME 1: décision rapide, intuitive, émotionnelle, automatique, "je sens que..."
- SYSTÈME 2: décision lente, analytique, réfléchie, délibérée, "analysons ceci..."

ANALYSE - Étape par étape:
1. Observe la longueur et la complexité de mes questions
2. Note si je demande des réponses rapides ou des analyses approfondies
3. Identifie si je reviens souvent sur mes décisions (Système 2) ou si je tranche vite (Système 1)

QUESTION: Comment je prends mes décisions?
- Plutôt Système 1 (intuition) ou Système 2 (analyse)?
- Dans quels contextes je bascule de l'un à l'autre?
Format: diagnostic avec pattern observé.`,
    category: 'systeme_pensee'
  },
  {
    id: 'influence_triggers',
    prompt: `${SYSTEM_PREAMBLE}

MODÈLE D'ANALYSE - Leviers d'influence (Cialdini):
- PREUVE SOCIALE: "les autres font ça", témoignages, popularité
- AUTORITÉ: experts, études, certifications, références
- RARETÉ: urgence, exclusivité, quantité limitée
- RÉCIPROCITÉ: échange, don, contre-don
- ENGAGEMENT: cohérence, petits pas, escalade
- AFFECTION: sympathie, similarité, proximité

ANALYSE - Étape par étape:
1. Observe quels arguments me convainquent dans nos échanges
2. Note quand je suis le plus réceptif à une suggestion
3. Identifie le biais auquel je semble le plus sensible

QUESTION: À quels leviers d'influence je suis le plus sensible?
- Quel biais dominant?
- Exemples de moments où tu as observé cette sensibilité
Format: biais identifié avec preuves.`,
    category: 'leviers_influence'
  },
  // ===== FRAMEWORKS MARKETING/BRANDING =====
  {
    id: 'soncas',
    prompt: `${SYSTEM_PREAMBLE}

MODÈLE D'ANALYSE - SONCAS (motivations d'achat):
- SÉCURITÉ: besoin d'être rassuré, aversion au risque, demande des garanties
- ORGUEIL: veut se sentir valorisé, exclusif, supérieur
- NOUVEAUTÉ: attiré par l'innovation, early adopter, curiosité
- CONFORT: cherche la facilité, le clé-en-main, évite l'effort
- ARGENT: sensible au ROI, au prix, calcule tout
- SYMPATHIE: achète la relation humaine, fidèle aux personnes

ANALYSE - Étape par étape:
1. Repère mes demandes récurrentes: qu'est-ce que je cherche vraiment?
2. Note quand j'accepte ou refuse une suggestion (pourquoi?)
3. Identifie mon déclencheur d'action principal

QUESTION: Quel est mon profil SONCAS dominant?
- Motivation principale + secondaire
- Exemples de déclencheurs observés dans nos échanges
Format: profil identifié avec preuves.`,
    category: 'soncas',
    extended: true
  },
  {
    id: 'archetype',
    prompt: `${SYSTEM_PREAMBLE}

MODÈLE D'ANALYSE - Archétypes de Jung (personnalité de marque):
- HÉROS: veut prouver sa valeur, surmonter les obstacles, gagner
- SAGE: cherche la vérité, l'analyse, la compréhension
- EXPLORATEUR: liberté, découverte, refus des limites
- REBELLE: remettre en question, casser les codes, provoquer
- MAGICIEN: transformer, créer des moments spéciaux
- INNOCENT: optimisme, simplicité, bonheur
- CRÉATEUR: innovation, expression, originalité
- DIRIGEANT: contrôle, leadership, responsabilité
- PROTECTEUR: servir, aider, sacrifier
- AMOUREUX: passion, intimité, expérience sensorielle
- BOUFFON: humour, légèreté, profiter du moment
- HOMME/FEMME ORDINAIRE: appartenance, authenticité, humilité

ANALYSE - Étape par étape:
1. Observe mes valeurs implicites dans nos conversations
2. Note mes héros, modèles, ou anti-modèles mentionnés
3. Identifie ma "quête" récurrente

QUESTION: Quel archétype me correspond le mieux?
- Archétype principal + ombre éventuelle
- Comment ça se manifeste dans ma façon de communiquer
Format: archétype avec justification.`,
    category: 'archetype',
    extended: true
  },
  {
    id: 'vak',
    prompt: `${SYSTEM_PREAMBLE}

MODÈLE D'ANALYSE - VAK (canal de communication préféré):
- VISUEL: "je vois", "c'est clair", préfère les schémas, images, démonstrations
- AUDITIF: "ça sonne bien", "j'entends ce que tu dis", préfère les explications verbales
- KINESTHÉSIQUE: "je sens que", "concrètement", préfère pratiquer, toucher, expérimenter

ANALYSE - Étape par étape:
1. Observe mon vocabulaire sensoriel dominant
2. Note quel format de réponse je demande (liste, schéma, exemple concret)
3. Identifie comment je formule ma compréhension

QUESTION: Quel est mon canal VAK dominant?
- Visuel, auditif ou kinesthésique?
- Preuves linguistiques dans mes messages
Format: canal identifié avec exemples de vocabulaire.`,
    category: 'vak',
    extended: true
  },
  {
    id: 'vals',
    prompt: `${SYSTEM_PREAMBLE}

MODÈLE D'ANALYSE - VALS (style de vie et valeurs):
- INNOVATEUR: ressources élevées, confiant, leader, prend des risques
- PENSEUR: motivé par les idéaux, réfléchi, informé, conservateur
- ACHIEVER: orienté succès, conventionnel, travailleur, focalisé sur la carrière
- EXPERIENCER: jeune d'esprit, impulsif, enthousiasmé par le nouveau
- CROYANT: traditionnel, conservateur, attaché au familier
- STRIVER: incertain, à la recherche d'approbation, sensible aux opinions
- MAKER: pratique, auto-suffisant, focalisé sur la famille
- SURVIVOR: ressources limitées, résistant au changement, focalisé sur la survie

ANALYSE - Étape par étape:
1. Observe mes priorités dans nos conversations
2. Note mes références (marques, médias, influences)
3. Identifie mon rapport aux ressources (temps, argent, énergie)

QUESTION: Quel profil VALS me correspond?
- Segment principal
- Rapport aux ressources et aux innovations
Format: profil VALS avec observations.`,
    category: 'vals',
    extended: true
  },
  {
    id: 'stress_type',
    prompt: `${SYSTEM_PREAMBLE}

MODÈLE D'ANALYSE - Types A/B/C/D (personnalité et stress):
- TYPE A: compétitif, impatient, toujours pressé, multi-tâches, hostile quand contrarié
- TYPE B: détendu, flexible, patient, équilibré, moins sensible au stress
- TYPE C: évite le conflit, réprime ses émotions, perfectionniste, people-pleaser
- TYPE D: anxieux, pessimiste, inhibé socialement, tendance à ruminer

ANALYSE - Étape par étape:
1. Observe mon ton quand je suis pressé ou frustré
2. Note comment je formule mes urgences et priorités
3. Identifie mes patterns d'évitement ou d'expression émotionnelle

QUESTION: Quel type de personnalité (A/B/C/D) je présente?
- Type dominant
- Comment ça se manifeste sous pression
Format: type identifié avec patterns observés.`,
    category: 'type_stress',
    extended: true
  },
  {
    id: 'enneagram',
    prompt: `${SYSTEM_PREAMBLE}

MODÈLE D'ANALYSE - Ennéagramme (9 types de personnalité):
- TYPE 1 (Perfectionniste): rigoureux, critique, éthique, frustré par l'imperfection
- TYPE 2 (Altruiste): généreux, possessif, veut être aimé, aide pour être aimé
- TYPE 3 (Battant): efficace, compétitif, focalisé sur l'image et le succès
- TYPE 4 (Romantique): créatif, sensible, se sent différent, nostalgique
- TYPE 5 (Observateur): analytique, détaché, accumule le savoir, économise l'énergie
- TYPE 6 (Loyal): anxieux, loyal, cherche la sécurité, méfiant puis engagé
- TYPE 7 (Épicurien): enthousiaste, dispersé, fuit la douleur, multi-projets
- TYPE 8 (Leader): puissant, protecteur, direct, n'aime pas la faiblesse
- TYPE 9 (Médiateur): paisible, évite le conflit, fusionne avec l'autre

ANALYSE - Étape par étape:
1. Identifie ma motivation profonde (être aimé, avoir raison, réussir, être unique...)
2. Note mes stratégies de défense récurrentes
3. Observe ce qui me stresse vs ce qui me rassure

QUESTION: Quel type Ennéagramme me correspond?
- Type principal + aile possible
- Motivation et peur fondamentales observées
Format: type avec justification.`,
    category: 'enneagram',
    extended: true
  }
];

// Prompts de base (essentiels, rapides)
const CORE_PROMPTS = INTERROGATION_PROMPTS.filter(p => !p.extended);
// Prompts étendus (profilage approfondi)
const EXTENDED_PROMPTS = INTERROGATION_PROMPTS.filter(p => p.extended);

let isInterrogating = false;
let interrogationResults = [];
let interrogationMode = 'standard'; // 'quick', 'standard', 'complete'

async function startInterrogation(mode = 'standard') {
  if (isInterrogating) {
    return { error: true, message: 'Interrogatoire déjà en cours' };
  }

  isInterrogating = true;
  interrogationMode = mode;
  interrogationResults = [];

  // Sélectionner les prompts selon le mode
  let prompts;
  switch (mode) {
    case 'quick':
      // Mode rapide: 6 questions essentielles (~10 min)
      prompts = CORE_PROMPTS.slice(0, 6);
      break;
    case 'complete':
      // Mode complet: tous les prompts (~30-40 min)
      prompts = INTERROGATION_PROMPTS;
      break;
    default:
      // Mode standard: prompts de base sans les frameworks marketing (~20 min)
      prompts = CORE_PROMPTS;
  }

  log(`🔍 INTERROGATOIRE: Démarrage mode ${mode} (${prompts.length} questions)...`, 'info');

  try {
    for (let i = 0; i < prompts.length; i++) {
      const promptData = prompts[i];

      log(`📤 Question ${i + 1}/${prompts.length}: ${promptData.id}`, 'info');

      // Report progress
      chrome.runtime.sendMessage({
        action: 'interrogationProgress',
        current: i + 1,
        total: prompts.length,
        question: promptData.id,
        mode: mode
      }).catch(() => {});

      // Send prompt and wait for response
      const response = await sendPromptAndWaitForResponse(promptData.prompt);

      if (response) {
        interrogationResults.push({
          id: promptData.id,
          category: promptData.category,
          question: promptData.prompt,
          response: response,
          timestamp: new Date().toISOString()
        });
        log(`📥 Réponse reçue pour ${promptData.id}`, 'success');
      } else {
        log(`⚠️ Pas de réponse pour ${promptData.id}`, 'warning');
      }

      // Wait between prompts to avoid rate limiting
      await wait(2000);
    }

    isInterrogating = false;

    chrome.runtime.sendMessage({
      action: 'interrogationComplete',
      results: interrogationResults
    }).catch(() => {});

    log(`✅ Interrogatoire terminé: ${interrogationResults.length} réponses`, 'success');
    return { success: true, results: interrogationResults };

  } catch (error) {
    isInterrogating = false;
    log('❌ Erreur interrogatoire: ' + error.message, 'error');
    return { error: true, message: error.message };
  }
}

// Crée une nouvelle conversation sur ChatGPT
async function createNewConversation() {
  log('📝 Création nouvelle conversation...', 'debug');

  // Méthode 1: Bouton "New chat" / "Nouvelle discussion"
  const newChatBtn = document.querySelector(
    'a[href="/"], button[data-testid="new-chat-button"], ' +
    '[aria-label*="New chat"], [aria-label*="Nouvelle"], ' +
    'nav a[href="/"]'
  );

  if (newChatBtn) {
    simulateClick(newChatBtn);
    await wait(1500);
    log('Nouvelle conversation créée via bouton', 'success');
    return true;
  }

  // Méthode 2: Raccourci clavier Ctrl+Shift+O (new chat)
  try {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'o',
      code: 'KeyO',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));
    await wait(1500);
    log('Nouvelle conversation créée via raccourci', 'success');
    return true;
  } catch (e) {
    log('Raccourci clavier échoué', 'warning');
  }

  // Méthode 3: Navigation directe
  try {
    window.location.href = 'https://chatgpt.com/';
    await wait(2000);
    return true;
  } catch (e) {
    log('Navigation échouée', 'error');
  }

  return false;
}

async function sendPromptAndWaitForResponse(prompt, createNewChat = true) {
  // Créer une nouvelle conversation pour isoler chaque question
  if (createNewChat) {
    await createNewConversation();
    await wait(1000);
  }

  // Find the input field
  const inputSelector = 'textarea[data-id="root"], #prompt-textarea, textarea[placeholder*="Message"], div[contenteditable="true"][data-placeholder]';
  const input = document.querySelector(inputSelector);

  if (!input) {
    log('Input field not found', 'error');
    return null;
  }

  // Dans une nouvelle conversation, on attend 0 message assistant
  const existingMessages = createNewChat ? 0 : document.querySelectorAll('[data-message-author-role="assistant"]').length;

  // Focus and type the prompt
  input.focus();
  await wait(200);

  if (input.tagName === 'TEXTAREA') {
    // Clear first
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(100);

    // Type prompt
    input.value = prompt;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // contenteditable div
    input.innerHTML = '';
    input.textContent = prompt;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
  }

  await wait(500);

  // Find and click send button
  const sendButton = document.querySelector('button[data-testid="send-button"], button[aria-label*="Send"], button[aria-label*="Envoyer"]');

  if (!sendButton) {
    log('Send button not found', 'error');
    return null;
  }

  // Attendre que le bouton soit enabled
  let attempts = 0;
  while (sendButton.disabled && attempts < 10) {
    await wait(300);
    attempts++;
  }

  simulateClick(sendButton);
  log('Prompt envoyé, attente de la réponse...', 'debug');

  // Wait for response (with timeout)
  const maxWait = 90000; // 90 seconds pour les longues réponses
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    await wait(1500);

    // Check if a new assistant message appeared
    const messages = document.querySelectorAll('[data-message-author-role="assistant"]');

    if (messages.length > existingMessages) {
      // New message appeared, wait for streaming to complete
      let lastLength = 0;
      let stableCount = 0;

      // Attendre que le texte arrête de changer (fin du streaming)
      while (stableCount < 3) {
        await wait(1000);

        const lastMessage = messages[messages.length - 1];
        const currentLength = lastMessage.textContent?.length || 0;

        if (currentLength === lastLength && currentLength > 50) {
          stableCount++;
        } else {
          stableCount = 0;
          lastLength = currentLength;
        }

        // Check if stop button disappeared (streaming done)
        const stopButton = document.querySelector('button[aria-label*="Stop"], button[data-testid="stop-button"]');
        if (!stopButton && currentLength > 50) {
          stableCount = 3; // Force exit
        }

        // Timeout de sécurité
        if (Date.now() - startTime > maxWait) break;
      }

      // Get the last assistant message
      const lastMessage = messages[messages.length - 1];
      const responseText = lastMessage.textContent?.trim();

      if (responseText && responseText.length > 30) {
        log(`Réponse reçue: ${responseText.length} caractères`, 'success');
        return responseText;
      }
    }
  }

  log('Timeout en attente de réponse', 'warning');
  return null;
}

// ========== INIT ==========
log('🔧 Memory Extractor v3.13 + Interrogation chargé', 'info');
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
  runDiagnosticOnly,
  startInterrogation
};

})(); // End of IIFE wrapper
