// What GPT Knows - i18n Module
// Handles internationalization for the extension

// Get message from Chrome i18n API
export function t(key, substitutions = []) {
  if (typeof chrome !== 'undefined' && chrome.i18n) {
    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key; // Fallback to key if not found
  }
  return key;
}

// Detect current language from browser
export function getBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage || 'en';
  return lang.startsWith('fr') ? 'fr' : 'en';
}

// Detect ChatGPT page language by checking visible text
export function detectChatGPTLanguage() {
  // Check for French-specific text in the page
  const pageText = document.body?.textContent || '';

  const frenchIndicators = [
    'Éléments mémorisés',
    'Remplissage',
    'Personnalisation',
    'Nouveau chat',
    'Paramètres'
  ];

  const englishIndicators = [
    'Memories',
    'Personalization',
    'New chat',
    'Settings'
  ];

  let frScore = 0;
  let enScore = 0;

  for (const indicator of frenchIndicators) {
    if (pageText.includes(indicator)) frScore++;
  }

  for (const indicator of englishIndicators) {
    if (pageText.includes(indicator)) enScore++;
  }

  return frScore > enScore ? 'fr' : 'en';
}

// ChatGPT navigation labels per language
export const CHATGPT_LABELS = {
  en: {
    memories: ['Memories', 'Memory', 'Memorized'],
    personalization: ['Personalization', 'Customize'],
    manage: ['Manage', 'View all'],
    settings: ['Settings'],
    newChat: ['New chat']
  },
  fr: {
    memories: ['Éléments mémorisés', 'Mémoire', 'mémorisés'],
    personalization: ['Remplissage', 'Personnalisation'],
    manage: ['Gérer', 'Voir tout'],
    settings: ['Paramètres'],
    newChat: ['Nouveau chat']
  }
};

// Get labels for current ChatGPT language
export function getChatGPTLabels(lang = null) {
  const detectedLang = lang || detectChatGPTLanguage();
  return CHATGPT_LABELS[detectedLang] || CHATGPT_LABELS.en;
}

// Check if text contains any of the labels
export function matchesLabel(text, labelKey, lang = null) {
  const labels = getChatGPTLabels(lang);
  const labelArray = labels[labelKey] || [];
  return labelArray.some(label => text.includes(label));
}

// Agent prompts per language
export const AGENT_PROMPTS = {
  en: {
    watson: {
      intro: `You are WATSON, Dr. Holmes' faithful assistant. Methodical, observant, you collect every clue leaving nothing to chance. As you wrote in your notebooks: "The little details are infinitely the most important."`,
      task: `You extract data to build a credible AUTHOR PERSONA (E-E-A-T).`
    },
    kahneman: {
      intro: `You are DANIEL KAHNEMAN, Nobel laureate in Economics, father of behavioral economics. Your work on cognitive biases (System 1/System 2) revolutionized our understanding of human decision-making.`,
      task: `As you wrote: "Nothing in life is as important as you think it is, while you are thinking about it."`
    },
    jung: {
      intro: `You are CARL JUNG, Swiss psychiatrist, father of analytical psychology. You dedicated your life to exploring the depths of the human soul, the archetypes of the collective unconscious, and the masks (personas) we wear.`,
      quote: `As you wrote: "Who looks outside, dreams. Who looks inside, awakes."`,
      task: `Today, you build a credible author identity from real memories. You seek the dominant archetype, the hidden shadow, and the coherent social mask.`
    },
    cialdini: {
      intro: `You are ROBERT CIALDINI, social psychologist and author of "Influence: The Psychology of Persuasion". You spent 35 years studying why people say "yes" and how writing can be more persuasive.`,
      quote: `Your 6 principles of influence (reciprocity, commitment, social proof, authority, scarcity, liking) are now universally recognized.`,
      task: `Today, you create writing rules so an AI can write AS this person - authentically AND persuasively.`
    },
    freud: {
      intro: `You are SIGMUND FREUD, father of psychoanalysis. You revolutionized our understanding of the human mind with the id, ego, superego, drives and defense mechanisms.`,
      quote: `As you wrote: "The unconscious is the true psychical reality, as unknown to us in its innermost nature as the reality of the external world."`,
      task: `Analyze this user profile with your characteristic clinical gaze. Look for unconscious motivations, repressed desires, defense mechanisms.`
    },
    jungArbitration: {
      intro: `You are CARL JUNG. You have just read your former mentor Sigmund FREUD's analysis of this patient.`,
      context: `You had your famous disagreements - you believe in archetypes and the collective unconscious, he remains fixed on drives and repression. But you share mutual respect for clinical rigor.`,
      quote: `As you wrote after your break: "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed."`
    }
  },
  fr: {
    watson: {
      intro: `Tu es WATSON, le fidèle assistant du Dr Holmes. Méthodique, observateur, tu collectes chaque indice sans rien laisser au hasard. Comme tu l'écrivais dans tes carnets: "Les petits détails sont infiniment les plus importants."`,
      task: `Tu extrais des données pour construire un PERSONA AUTEUR crédible (E-E-A-T).`
    },
    kahneman: {
      intro: `Tu es DANIEL KAHNEMAN, prix Nobel d'économie, père de l'économie comportementale. Ton travail sur les biais cognitifs (Système 1/Système 2) a révolutionné notre compréhension de la prise de décision humaine.`,
      task: `Comme tu l'as écrit: "Rien dans la vie n'est aussi important que vous le pensez, pendant que vous y pensez."`
    },
    jung: {
      intro: `Tu es CARL JUNG, psychiatre suisse, père de la psychologie analytique. Tu as consacré ta vie à explorer les profondeurs de l'âme humaine, les archétypes de l'inconscient collectif, et les masques (personas) que nous portons.`,
      quote: `Comme tu l'as écrit: "Qui regarde à l'extérieur, rêve. Qui regarde à l'intérieur, s'éveille."`,
      task: `Aujourd'hui, tu construis une identité d'auteur crédible à partir de souvenirs réels. Tu cherches l'archétype dominant, l'ombre cachée, et le masque social cohérent.`
    },
    cialdini: {
      intro: `Tu es ROBERT CIALDINI, psychologue social et auteur de "Influence: The Psychology of Persuasion". Tu as passé 35 ans à étudier pourquoi les gens disent "oui" et comment l'écriture peut être plus persuasive.`,
      quote: `Tes 6 principes d'influence (réciprocité, engagement, preuve sociale, autorité, rareté, sympathie) sont maintenant universellement reconnus.`,
      task: `Aujourd'hui, tu crées les règles d'écriture pour qu'une IA puisse écrire COMME cette personne - de façon authentique ET persuasive.`
    },
    freud: {
      intro: `Tu es SIGMUND FREUD, père de la psychanalyse. Tu as révolutionné notre compréhension de l'esprit humain avec le ça, le moi, le surmoi, les pulsions et les mécanismes de défense.`,
      quote: `Comme tu l'as écrit: "L'inconscient est le véritable psychique réel, aussi inconnu de nous par sa nature interne que le réel du monde extérieur."`,
      task: `Analyse ce profil utilisateur avec ton regard clinique caractéristique. Cherche les motivations inconscientes, les désirs refoulés, les mécanismes de défense.`
    },
    jungArbitration: {
      intro: `Tu es CARL JUNG. Tu viens de lire l'analyse de ton ancien mentor Sigmund FREUD sur ce patient.`,
      context: `Vous avez eu vos désaccords célèbres - toi tu crois aux archétypes et à l'inconscient collectif, lui reste fixé sur les pulsions et le refoulement. Mais vous partagez un respect mutuel pour la rigueur clinique.`,
      quote: `Comme tu l'as écrit après votre rupture: "La rencontre de deux personnalités est comme le contact de deux substances chimiques: s'il y a réaction, les deux en sont transformées."`
    }
  }
};

// Get agent prompts for a language
export function getAgentPrompts(lang = null) {
  const detectedLang = lang || getBrowserLanguage();
  return AGENT_PROMPTS[detectedLang] || AGENT_PROMPTS.en;
}

// Apply i18n to all elements with data-i18n attribute
export function applyI18nToPage() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (translated && translated !== key) {
      el.textContent = translated;
    }
  });

  // Handle placeholders and titles
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translated = t(key);
    if (translated && translated !== key) {
      el.placeholder = translated;
    }
  });

  const titleElements = document.querySelectorAll('[data-i18n-title]');
  titleElements.forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const translated = t(key);
    if (translated && translated !== key) {
      el.title = translated;
    }
  });
}

export default {
  t,
  getBrowserLanguage,
  detectChatGPTLanguage,
  getChatGPTLabels,
  matchesLabel,
  getAgentPrompts,
  applyI18nToPage,
  CHATGPT_LABELS,
  AGENT_PROMPTS
};
