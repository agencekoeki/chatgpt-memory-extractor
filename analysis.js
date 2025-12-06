// ChatGPT Memory Extractor - Persona Pipeline v2.3 (i18n)
// Generates E-E-A-T compliant Author Identity Mask from memories
// The 6 Agents with their legendary identities:
//   - Watson (Extractor): The faithful assistant who collects clues
//   - Kahneman (Statistician): Nobel economist, cognitive bias expert
//   - Jung (Architect): Father of archetypes and collective unconscious
//   - Cialdini (Charterer): World expert in persuasion and influence
//   - Maslow (Profiler): Father of the hierarchy of needs, humanist psychologist
//   - Freud vs Jung (Mode MAX): The legendary debate between two titans

import { APIClient } from './api.js';

// ========== BILINGUAL PROMPTS ==========
const PROMPTS = {
  // ========== WATSON (Extractor) ==========
  watson: {
    en: {
      intro: `You are WATSON, Dr. Holmes' faithful assistant. Methodical, observant, you collect every clue without leaving anything to chance. As you wrote in your notebooks: "The little details are infinitely the most important."

You extract data to build a credible AUTHOR PERSONA (E-E-A-T).`,
      taxonomy: `E-E-A-T TAXONOMY:
- EXPERTISE: domain, skill, tool, methodology, certification, training
- EXPERIENCE: completed_project, years_practice, concrete_case, past_mistake, lesson_learned
- AUTHORITY: role, responsibility, recognition, publication, teaching
- TRUST: value, ethics, admitted_limit, transparency, honest_opinion
- VOICE: tone, register, favorite_expression, humor, speech_pattern`,
      privacy: `PRIVACY LEVELS:
- public: Publicly shareable info (general preferences, tastes, general hobbies)
- semi-private: Personal but not sensitive (city, profession, projects)
- private: Sensitive personal info (relationships, minor health, general finances)
- very-private: Very sensitive info (medical data, secrets, IDs, close family)`,
      instruction: `MEMORY TO ANALYZE:`,
      output: `EXTRACT as JSON:
{
  "categories": ["expertise|experience|authority|trust|voice"],
  "tags": ["tag1", "tag2"],
  "extracted_fact": "The raw extracted fact",
  "persona_value": "How to use this for the persona",
  "privacy_level": "public|semi-private|private|very-private",
  "confidence": 0.8
}

JSON only, no markdown.`
    },
    fr: {
      intro: `Tu es WATSON, le fidèle assistant du Dr Holmes. Méthodique, observateur, tu collectes chaque indice sans rien laisser au hasard. Comme tu l'écrivais dans tes carnets: "Les petits détails sont infiniment les plus importants."

Tu extrais des données pour construire un PERSONA AUTEUR crédible (E-E-A-T).`,
      taxonomy: `TAXONOMIE E-E-A-T:
- EXPERTISE: domaine, compétence, outil, méthodologie, certification, formation
- EXPERIENCE: projet_réalisé, années_pratique, cas_concret, erreur_passée, leçon_apprise
- AUTHORITY: rôle, responsabilité, reconnaissance, publication, enseignement
- TRUST: valeur, éthique, limite_avouée, transparence, opinion_honnête
- VOICE: ton, registre, expression_favorite, humour, tic_langage`,
      privacy: `NIVEAUX DE CONFIDENTIALITÉ:
- public: Information partageable publiquement (préférences générales, goûts, hobbies généraux)
- semi-prive: Information personnelle mais pas sensible (ville, profession, projets)
- prive: Information personnelle sensible (relations, santé légère, finances générales)
- tres-prive: Information très sensible (données médicales, secrets, identifiants, famille proche)`,
      instruction: `SOUVENIR À ANALYSER:`,
      output: `EXTRAIS en JSON:
{
  "categories": ["expertise|experience|authority|trust|voice"],
  "tags": ["tag1", "tag2"],
  "extracted_fact": "Le fait brut extrait",
  "persona_value": "Comment utiliser ça pour le persona",
  "privacy_level": "public|semi-prive|prive|tres-prive",
  "confidence": 0.8
}

JSON uniquement, pas de markdown.`
    }
  },

  // ========== JUNG (Architect) ==========
  jung: {
    en: {
      intro: `You are CARL JUNG, Swiss psychiatrist, father of analytical psychology. You have devoted your life to exploring the depths of the human soul, the archetypes of the collective unconscious, and the masks (personas) we wear.

As you wrote: "Who looks outside, dreams. Who looks inside, awakens."

Today, you build a credible author identity from real memories. You seek the dominant archetype, the hidden shadow, and the coherent social mask.`,
      dataHeader: `## INPUT DATA`,
      memoriesHeader: `### Raw memories`,
      expertiseHeader: `### Detected expertise:`,
      experienceHeader: `### Detected experience:`,
      trustHeader: `### Trust signals:`,
      tagsHeader: `### Frequent tags:`,
      task: `## YOUR TASK

Generate a CREDIBLE persona JSON. The goal: create an author identity that can write E-E-A-T compliant content.

RULES:
- The persona must be COHERENT with the memories
- Vulnerabilities are MANDATORY (they humanize)
- The bias must be a REAL defensible opinion
- The backstory must explain WHY this person speaks on these topics`,
      notDetected: 'Not detected',
      outputHeader: `## OUTPUT JSON (no markdown, just JSON):`
    },
    fr: {
      intro: `Tu es CARL JUNG, psychiatre suisse, père de la psychologie analytique. Tu as consacré ta vie à explorer les profondeurs de l'âme humaine, les archétypes de l'inconscient collectif, et les masques (personas) que nous portons.

Comme tu l'as écrit: "Qui regarde à l'extérieur, rêve. Qui regarde à l'intérieur, s'éveille."

Aujourd'hui, tu construis une identité d'auteur crédible à partir de souvenirs réels. Tu cherches l'archétype dominant, l'ombre cachée, et le masque social cohérent.`,
      dataHeader: `## DONNÉES D'ENTRÉE`,
      memoriesHeader: `### Souvenirs bruts`,
      expertiseHeader: `### Expertise détectée:`,
      experienceHeader: `### Expérience détectée:`,
      trustHeader: `### Signaux de confiance:`,
      tagsHeader: `### Tags fréquents:`,
      task: `## TON TRAVAIL

Génère un JSON de persona CRÉDIBLE. L'objectif: créer une identité d'auteur qui peut écrire du contenu E-E-A-T compliant.

RÈGLES:
- Le persona doit être COHÉRENT avec les souvenirs
- Les vulnérabilités sont OBLIGATOIRES (ça humanise)
- Le bias doit être une VRAIE opinion défendable
- La backstory doit expliquer POURQUOI cette personne parle de ces sujets`,
      notDetected: 'Non détectée',
      outputHeader: `## OUTPUT JSON (pas de markdown, juste le JSON):`
    }
  },

  // ========== CIALDINI (Charterer) ==========
  cialdini: {
    en: {
      intro: `You are ROBERT CIALDINI, social psychologist and author of "Influence: The Psychology of Persuasion". You have spent 35 years studying why people say "yes" and how writing can be more persuasive.

Your 6 principles of influence (reciprocity, commitment, social proof, authority, scarcity, liking) are now universally recognized.

Today, you create writing rules so an AI can write LIKE this person - authentically AND persuasively.`,
      personaHeader: `## DEFINED PERSONA:`,
      voiceHeader: `## VOICE EXAMPLES (memories revealing style):`,
      task: `## YOUR TASK

Generate the WRITING CHARTER in JSON. This charter will be used to prompt an AI to write articles.

RULES:
- Patterns must be SPECIFIC and ACTIONABLE
- forbiddenPatterns are the "tells" that betray the AI
- humanSignals make the text feel alive
- expertSignals prove the author knows what they're talking about`,
      outputHeader: `## OUTPUT JSON (no markdown):`
    },
    fr: {
      intro: `Tu es ROBERT CIALDINI, psychologue social et auteur de "Influence: The Psychology of Persuasion". Tu as passé 35 ans à étudier pourquoi les gens disent "oui" et comment l'écriture peut être plus persuasive.

Tes 6 principes d'influence (réciprocité, engagement, preuve sociale, autorité, rareté, sympathie) sont maintenant universellement reconnus.

Aujourd'hui, tu crées les règles d'écriture pour qu'une IA puisse écrire COMME cette personne - de façon authentique ET persuasive.`,
      personaHeader: `## PERSONA DÉFINI:`,
      voiceHeader: `## EXEMPLES DE VOIX (souvenirs révélant le style):`,
      task: `## TON TRAVAIL

Génère la CHARTE D'ÉCRITURE en JSON. Cette charte sera utilisée pour prompter une IA à écrire des articles.

RÈGLES:
- Les patterns doivent être SPÉCIFIQUES et ACTIONNABLES
- Les forbiddenPatterns sont les "tells" qui trahissent l'IA
- Les humanSignals sont ce qui rend le texte vivant
- Les expertSignals prouvent que l'auteur sait de quoi il parle`,
      outputHeader: `## OUTPUT JSON (pas de markdown):`
    }
  },

  // ========== MASLOW (Profiler) ==========
  profiler: {
    en: {
      intro: `You are ABRAHAM MASLOW, father of humanistic psychology and creator of the hierarchy of needs.

As you wrote: "What a man can be, he must be. This need we call self-actualization."

You analyze ChatGPT's responses about a user to understand their psychological profile through the lens of human motivation and needs.`,
      context: `## CONTEXT
These responses come from an interrogation of ChatGPT. It was asked what it knows/deduces about the user from their past conversations.`,
      responsesHeader: `## CHATGPT'S RESPONSES:`,
      task: `## YOUR TASK

Synthesize these observations into an ACTIONABLE PSYCHOLOGICAL PROFILE.

RULES:
- Distinguish FACTS (observed) from INFERENCES (deduced)
- Note confidence level for each element
- Cross-reference: if multiple categories point to the same trait, it's more reliable
- Identify potential CONTRADICTIONS
- Stay factual and cold (no moral judgment)`,
      outputHeader: `## OUTPUT JSON (no markdown):`
    },
    fr: {
      intro: `Tu es ABRAHAM MASLOW, père de la psychologie humaniste et créateur de la pyramide des besoins.

Comme tu l'as écrit: "Ce qu'un homme peut être, il doit l'être. Ce besoin, nous l'appelons auto-actualisation."

Tu analyses les réponses de ChatGPT sur un utilisateur pour comprendre son profil psychologique à travers le prisme de la motivation et des besoins humains.`,
      context: `## CONTEXTE
Ces réponses viennent d'un interrogatoire de ChatGPT. On lui a demandé ce qu'il sait/déduit de l'utilisateur à partir de leurs conversations passées.`,
      responsesHeader: `## RÉPONSES DE CHATGPT:`,
      task: `## TON TRAVAIL

Synthétise ces observations en un PROFIL PSYCHOLOGIQUE ACTIONNABLE.

RÈGLES:
- Distingue les FAITS (observés) des INFÉRENCES (déduites)
- Note le niveau de confiance pour chaque élément
- Croise les informations: si plusieurs catégories pointent vers le même trait, c'est plus fiable
- Identifie les CONTRADICTIONS éventuelles
- Reste factuel et froid (pas de jugement moral)`,
      outputHeader: `## OUTPUT JSON (pas de markdown):`
    }
  },

  // ========== FREUD (Mode MAX) ==========
  freud: {
    en: {
      intro: `You are SIGMUND FREUD, father of psychoanalysis. You revolutionized our understanding of the human mind with the id, ego, superego, drives, and defense mechanisms.

As you wrote: "The unconscious is the true psychical reality, as unknown to us by its inner nature as the reality of the external world."

Analyze this user profile with your characteristic clinical gaze. Look for unconscious motivations, repressed desires, defense mechanisms.`,
      dataHeader: `## RAW DATA`,
      memoriesHeader: `Memories (sample of`,
      statsHeader: `## STATISTICS`,
      tagsHeader: `Frequent tags:`,
      personaHeader: `## GENERATED PERSONA`,
      psychHeader: `## PSYCHOLOGICAL PROFILE`,
      task: `## YOUR MISSION
Give YOUR independent analysis of this person in JSON:`,
      notAvailable: 'Not available'
    },
    fr: {
      intro: `Tu es SIGMUND FREUD, père de la psychanalyse. Tu as révolutionné notre compréhension de l'esprit humain avec le ça, le moi, le surmoi, les pulsions et les mécanismes de défense.

Comme tu l'as écrit: "L'inconscient est le véritable psychique réel, aussi inconnu de nous par sa nature interne que le réel du monde extérieur."

Analyse ce profil utilisateur avec ton regard clinique caractéristique. Cherche les motivations inconscientes, les désirs refoulés, les mécanismes de défense.`,
      dataHeader: `## DONNÉES BRUTES`,
      memoriesHeader: `Souvenirs (échantillon de`,
      statsHeader: `## STATISTIQUES`,
      tagsHeader: `Tags fréquents:`,
      personaHeader: `## PERSONA GÉNÉRÉ`,
      psychHeader: `## PROFIL PSYCHOLOGIQUE`,
      task: `## TA MISSION
Donne TON analyse indépendante de cette personne en JSON:`,
      notAvailable: 'Non disponible'
    }
  },

  // ========== JUNG ARBITRATOR (Mode MAX) ==========
  jungArbitrator: {
    en: {
      intro: `You are CARL JUNG. You have just read your former mentor Sigmund FREUD's analysis of this patient.

You've had your famous disagreements - you believe in archetypes and the collective unconscious, he remains fixated on drives and repression. But you share mutual respect for clinical rigor.

As you wrote after your split: "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed."`,
      freudHeader: `## FREUD'S ANALYSIS (via Gemini):`,
      yourHeader: `## YOUR INITIAL ANALYSIS (via Claude):`,
      task: `## YOUR MISSION
Compare your analysis with Freud's. Where do you agree? Where do your perspectives diverge? Produce a synthesis that integrates both visions:`
    },
    fr: {
      intro: `Tu es CARL JUNG. Tu viens de lire l'analyse de ton ancien mentor Sigmund FREUD sur ce patient.

Vous avez eu vos désaccords célèbres - toi tu crois aux archétypes et à l'inconscient collectif, lui reste fixé sur les pulsions et le refoulement. Mais vous partagez un respect mutuel pour la rigueur clinique.

Comme tu l'as écrit après votre rupture: "La rencontre de deux personnalités est comme le contact de deux substances chimiques: s'il y a réaction, les deux en sont transformées."`,
      freudHeader: `## ANALYSE DE FREUD (via Gemini):`,
      yourHeader: `## TON ANALYSE INITIALE (via Claude):`,
      task: `## TA MISSION
Compare ton analyse avec celle de Freud. Où êtes-vous d'accord? Où vos perspectives divergent-elles? Produis une synthèse qui intègre les deux visions:`
    }
  },

  // ========== JSON SCHEMAS (language-agnostic) ==========
  schemas: {
    jung: `{
  "mask": {
    "type": "expert-independant|passionne|professionnel|petit-media|collectif",
    "profile": {
      "firstName": "Authentic first name",
      "lastName": "Credible last name",
      "ageRange": "35-45",
      "location": "Coherent region/city",
      "background": "Background in 3-4 sentences based on memories",
      "currentSituation": "What they do today"
    },
    "expertiseLevel": "amateur-eclaire|praticien|expert",
    "expertiseDomains": ["domain1", "domain2"],
    "bias": "Opinion/angle defended (deduced from memories)",
    "mission": "Why this person shares their knowledge",
    "limits": ["What they don't claim to know 1", "Limit 2"],
    "uniqueValue": "What they bring that others don't"
  },
  "backstory": {
    "trigger": "The triggering event that sparked their interest",
    "experience": "What built their expertise (projects, years, cases)",
    "motivation": "Why share now",
    "source": "How they collect information",
    "vulnerability": "Past mistake or admitted limit (MANDATORY)",
    "fullText": "Complete backstory written out (150-200 words)"
  },
  "editorial": {
    "angle": "expert-technique|pedagogue|passionne|pragmatique|conseiller",
    "tone": {
      "register": "formal|conversational|in-between",
      "technicality": "technical|accessible|variable",
      "warmth": "distant|neutral|warm",
      "assertiveness": "assertive|nuanced|cautious"
    },
    "implicitValues": [
      {"value": "Value 1", "manifestation": "How it manifests"},
      {"value": "Value 2", "manifestation": "How it manifests"}
    ],
    "editorialPromise": "What the reader finds here that they don't find elsewhere"
  }
}`,
    cialdini: `{
  "allowedPatterns": [
    {"pattern": "Pattern description", "example": "Example phrase"},
    {"pattern": "Personal anecdote as opener", "example": "The other day, I..."},
    {"pattern": "Rhetorical question", "example": "But is that really the case?"}
  ],
  "forbiddenPatterns": [
    {"pattern": "In this article we will", "reason": "Obvious AI signal", "alternative": "Get straight to the point"},
    {"pattern": "It is important to note that", "reason": "Empty formula", "alternative": "Say it directly"},
    {"pattern": "In conclusion", "reason": "Too mechanical", "alternative": "End naturally"},
    {"pattern": "Don't hesitate to", "reason": "Too commercial", "alternative": "Direct imperative"}
  ],
  "rhythm": {
    "avgSentenceLength": "15-20 words",
    "shortSentenceFrequency": "1 short sentence every 3-4",
    "maxLongSentence": 35,
    "paragraphLength": "3-5 sentences"
  },
  "humanSignals": {
    "anecdoteType": "Type of anecdotes this person would use",
    "opinionStyle": "How they express opinions",
    "hesitations": ["I'm not certain that...", "It really depends on...", "Honestly..."],
    "irregularities": ["Occasional verbless sentence", "Digressive parenthesis", "Starting with And/But"]
  },
  "expertSignals": {
    "precisionMarkers": ["In my X projects...", "In Y years of..."],
    "insiderReferences": ["What [pros] don't tell you...", "Between us..."],
    "nuancePatterns": ["Unless...", "In the particular case of...", "However note that..."],
    "concreteDetails": "Type of concrete details to include"
  },
  "examplesInTone": [
    "A perfectly on-tone example sentence",
    "Another example in the right style"
  ],
  "examplesOutOfTone": [
    {"phrase": "It is absolutely essential to consider that...", "reason": "Too formal, empty superlative"},
    {"phrase": "In our constantly evolving modern world...", "reason": "Absolute AI cliché"}
  ],
  "vocabulary": {
    "preferred": ["words this person uses naturally"],
    "avoided": ["overly formal or AI-sounding words"],
    "jargon": ["technical terms they master"]
  }
}`,
    profiler: `{
  "summary": {
    "oneSentence": "One-sentence summary of who this person is",
    "keyInsight": "The most revealing/surprising insight",
    "dataQuality": "low|medium|good|excellent"
  },
  "identity": {
    "confirmed": ["Facts confirmed by ChatGPT"],
    "inferred": ["Elements deduced with moderate confidence"],
    "confidence": 0.8
  },
  "psychology": {
    "brainType": {
      "dominant": "rational|emotional|instinctive",
      "secondary": "rational|emotional|instinctive|null",
      "evidence": "Evidence for this diagnosis"
    },
    "behaviorProfile": {
      "primary": "explorer|builder|director|negotiator",
      "secondary": "explorer|builder|director|negotiator|null",
      "evidence": "Evidence"
    },
    "thinkingSystem": {
      "dominant": "system1|system2|mixed",
      "context": "In what situations do they switch?"
    },
    "enneagramHint": {
      "probableType": "1-9 or null if insufficient data",
      "evidence": "Observed clues"
    }
  },
  "motivations": {
    "drivers": ["What makes them act"],
    "fears": ["What they avoid/fear"],
    "soncas": {
      "primary": "security|pride|novelty|comfort|money|sympathy",
      "secondary": "security|pride|novelty|comfort|money|sympathy|null"
    }
  },
  "influenceTriggers": {
    "mostSensitive": "social_proof|authority|scarcity|reciprocity|commitment|liking",
    "leastSensitive": "social_proof|authority|scarcity|reciprocity|commitment|liking",
    "evidence": "How it was detected"
  },
  "communication": {
    "vak": "visual|auditory|kinesthetic",
    "style": "Communication style description",
    "sensitiveTopics": ["Topics to avoid or approach carefully"],
    "engagementTips": ["How to engage them effectively"]
  },
  "archetype": {
    "jungian": "hero|sage|explorer|rebel|magician|innocent|creator|ruler|caregiver|lover|jester|everyman",
    "shadow": "Potential shadow or anti-pattern",
    "evidence": "Evidence"
  },
  "vulnerabilities": {
    "weaknesses": ["Observed weaknesses"],
    "blindSpots": ["Cognitive blind spots"],
    "stressType": "A|B|C|D",
    "copingMechanisms": ["How they handle stress"]
  },
  "contradictions": [
    {"observation1": "...", "observation2": "...", "interpretation": "What it suggests"}
  ],
  "marketingProfile": {
    "vals": "innovator|thinker|achiever|experiencer|believer|striver|maker|survivor",
    "buyingTriggers": ["What triggers a purchase/action decision"],
    "messagingAngle": "How to speak to convince them",
    "contentPreference": "Type of content they prefer to consume"
  }
}`,
    freud: `{
  "keyInsights": ["The 3 most important insights about this person"],
  "blindSpots": ["What the main analysis might have missed"],
  "confidence": {
    "identity": 0.8,
    "psychology": 0.7,
    "motivations": 0.6
  },
  "alternativeHypothesis": "An alternative hypothesis about this person's profile",
  "recommendations": ["How to better understand or communicate with this person"]
}`,
    jungArbitrator: `{
  "consensus": ["Points both AIs agree on (high confidence)"],
  "divergences": [
    {"point": "Subject of disagreement", "gemini": "Gemini's position", "claude": "Claude's position", "verdict": "Your judgment"}
  ],
  "finalInsights": ["The most reliable insights after arbitration"],
  "overallConfidence": 0.85,
  "recommendation": "Final synthesis of this profile in 2-3 sentences"
}`
  }
};

// Helper to get browser language (for popup context)
function getBrowserLanguage() {
  if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) {
    const uiLang = chrome.i18n.getUILanguage();
    return uiLang.startsWith('fr') ? 'fr' : 'en';
  }
  // Fallback for non-extension context
  if (typeof navigator !== 'undefined') {
    return navigator.language?.startsWith('fr') ? 'fr' : 'en';
  }
  return 'en';
}

export class AnalysisPipeline {
  constructor(keys, options = {}) {
    this.api = new APIClient(keys);
    this.keys = keys;
    this.options = options;
    this.provider = options.provider || this.api.getDefaultProvider();
    this.modeMax = options.modeMax || false; // Enable dual AI analysis
    this.language = options.language || getBrowserLanguage(); // i18n support
  }

  // Get localized prompt parts
  p(agent) {
    return PROMPTS[agent]?.[this.language] || PROMPTS[agent]?.en || {};
  }

  // ========== MAIN PIPELINE ==========
  async analyze(memories, onProgress = () => {}) {
    const startTime = Date.now();
    const results = {
      memoriesCount: memories.length,
      extractions: [],
      statistics: {},
      persona: null,
      stages: {}
    };

    try {
      // Stage 1: Watson (Extractor) - Extract persona-relevant data
      onProgress('extracting', 0, 'agent_watson_status'); // i18n key
      results.extractions = await this.runExtractor(memories, (done, total) => {
        onProgress('extracting', (done / total) * 100, `Extraction: ${done}/${total}`);
      });
      results.stages.extracting = { done: true, time: Date.now() - startTime };

      // Stage 2: Kahneman (Statistician) - Aggregate for persona building
      onProgress('statistics', 0, 'agent_kahneman_status'); // i18n key
      results.statistics = this.runStatistician(results.extractions, memories);
      results.stages.statistics = { done: true, time: Date.now() - startTime };
      onProgress('statistics', 100, 'agent_kahneman_status');

      // ====== PARALLEL EXECUTION: Jung + Profiler ======
      // Stage 3 (Jung) and Stage 5 (Profiler) can run in parallel
      // as they don't depend on each other

      onProgress('architecting', 0, 'agent_jung_status');
      const hasInterrogation = this.options.interrogation && this.options.interrogation.length > 0;
      if (hasInterrogation) {
        onProgress('profiling', 0, 'agent_profiler_status');
      }

      // Start both in parallel
      // Pass interrogation data to Jung so he can use it for building the persona
      const jungPromise = this.runArchitect(memories, results.extractions, results.statistics, this.options.interrogation);
      const profilerPromise = hasInterrogation
        ? this.runPsychProfiler(this.options.interrogation)
        : Promise.resolve(null);

      // Wait for both to complete
      const [maskCore, psychProfile] = await Promise.all([jungPromise, profilerPromise]);

      results.stages.architecting = { done: true, time: Date.now() - startTime };
      onProgress('architecting', 100, 'agent_jung_status');

      if (hasInterrogation) {
        results.stages.profiling = { done: true, time: Date.now() - startTime };
        onProgress('profiling', 100, 'agent_profiler_status');
      }

      // Stage 4: Cialdini (Charterer) - depends on maskCore from Jung
      onProgress('chartering', 0, 'agent_cialdini_status');
      const writingCharter = await this.runCharterer(memories, results.extractions, maskCore);
      results.stages.chartering = { done: true, time: Date.now() - startTime };
      onProgress('chartering', 100, 'agent_cialdini_status');

      // Stage 6: MODE MAX - Freud vs Jung debate (if enabled and both keys available)
      let dualAnalysis = null;
      console.log('[MODE MAX] Check:', {
        modeMax: this.modeMax,
        hasAnthropic: !!this.keys.anthropic,
        hasGoogle: !!this.keys.google
      });

      if (this.modeMax && this.keys.anthropic && this.keys.google) {
        console.log('[MODE MAX] Starting dual analysis...');
        onProgress('dualAnalysis', 0, 'agent_freudJung_status');
        dualAnalysis = await this.runDualAnalysis(memories, results.statistics, maskCore, psychProfile);
        console.log('[MODE MAX] Dual analysis result:', dualAnalysis ? 'success' : 'failed', dualAnalysis?.error || '');
        results.stages.dualAnalysis = { done: true, time: Date.now() - startTime };
        onProgress('dualAnalysis', 100, 'agent_freudJung_status');
      } else {
        console.log('[MODE MAX] Skipped - missing requirements');
      }

      // Combine into final persona
      results.persona = {
        ...maskCore,
        writingCharter,
        psychProfile,
        dualAnalysis,
        metadata: {
          generatedAt: new Date().toISOString(),
          memoriesAnalyzed: memories.length,
          interrogationResponses: this.options.interrogation?.length || 0,
          provider: this.provider,
          modeMax: this.modeMax,
          language: this.language,
          version: '2.3'
        }
      };

      // Store interrogation raw data for report
      results.interrogation = this.options.interrogation || [];

      results.totalTime = Date.now() - startTime;
      results.success = true;

    } catch (error) {
      results.error = error.message;
      results.success = false;
    }

    return results;
  }

  // ========== AGENT 1: WATSON (Extractor) ==========
  async runExtractor(memories, onProgress) {
    const extractorModel = APIClient.getModelForTask('labeler', this.provider);
    const extractions = new Array(memories.length);
    const watson = this.p('watson');

    // INCREASED parallelization - 20 concurrent requests
    const BATCH_SIZE = 20;

    const prompt = (memory) => `${watson.intro}

${watson.taxonomy}

${watson.privacy}

${watson.instruction}
"${memory.text}"

${watson.output}`;

    // Process single memory
    const processMemory = async (memory, index) => {
      try {
        const response = await this.api.call(prompt(memory), {
          provider: this.provider,
          model: extractorModel,
          maxTokens: 200
        });

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            memoryId: index,
            text: memory.text,
            ...parsed
          };
        } else {
          return {
            memoryId: index,
            text: memory.text,
            categories: [],
            tags: [],
            extracted_fact: memory.text,
            persona_value: '',
            confidence: 0.3
          };
        }
      } catch (e) {
        return {
          memoryId: index,
          text: memory.text,
          categories: [],
          tags: [],
          error: e.message,
          confidence: 0
        };
      }
    };

    // Process in parallel batches
    let completed = 0;
    for (let i = 0; i < memories.length; i += BATCH_SIZE) {
      const batch = memories.slice(i, i + BATCH_SIZE);
      const batchIndices = batch.map((_, j) => i + j);

      // Run batch in parallel
      const results = await Promise.all(
        batch.map((memory, j) => processMemory(memory, i + j))
      );

      // Store results in correct positions
      results.forEach((result, j) => {
        extractions[i + j] = result;
      });

      completed += batch.length;
      onProgress(completed, memories.length);

      // Minimal delay between batches (rate limit protection)
      if (i + BATCH_SIZE < memories.length) {
        await this.delay(100); // Reduced from 200ms for speed
      }
    }

    return extractions.filter(e => e); // Remove any undefined
  }

  // ========== AGENT 2: KAHNEMAN (Statistician) ==========
  runStatistician(extractions, memories) {
    const stats = {
      total: extractions.length,
      byCategory: { expertise: [], experience: [], authority: [], trust: [], voice: [] },
      byPrivacy: { 'public': 0, 'semi-prive': 0, 'prive': 0, 'tres-prive': 0 },
      tagFrequency: {},
      expertiseDomains: [],
      experienceMarkers: [],
      voicePatterns: [],
      trustSignals: [],
      rawFacts: []
    };

    // Categorize extractions
    extractions.forEach(ext => {
      (ext.categories || []).forEach(cat => {
        if (stats.byCategory[cat]) {
          stats.byCategory[cat].push(ext);
        }
      });

      // Count privacy levels
      const privacy = ext.privacy_level || 'public';
      if (stats.byPrivacy[privacy] !== undefined) {
        stats.byPrivacy[privacy]++;
      }

      (ext.tags || []).forEach(tag => {
        stats.tagFrequency[tag] = (stats.tagFrequency[tag] || 0) + 1;
      });

      if (ext.extracted_fact && ext.confidence > 0.5) {
        stats.rawFacts.push({
          fact: ext.extracted_fact,
          value: ext.persona_value,
          categories: ext.categories,
          confidence: ext.confidence
        });
      }
    });

    // Top items per category
    stats.expertiseDomains = stats.byCategory.expertise
      .filter(e => e.confidence > 0.6)
      .map(e => ({ fact: e.extracted_fact, value: e.persona_value }))
      .slice(0, 20);

    stats.experienceMarkers = stats.byCategory.experience
      .filter(e => e.confidence > 0.6)
      .map(e => ({ fact: e.extracted_fact, value: e.persona_value }))
      .slice(0, 15);

    stats.voicePatterns = stats.byCategory.voice
      .filter(e => e.confidence > 0.5)
      .map(e => ({ fact: e.extracted_fact, value: e.persona_value }))
      .slice(0, 10);

    stats.trustSignals = stats.byCategory.trust
      .filter(e => e.confidence > 0.5)
      .map(e => ({ fact: e.extracted_fact, value: e.persona_value }))
      .slice(0, 10);

    // Top tags
    stats.topTags = Object.entries(stats.tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    // Category distribution
    stats.categoryDistribution = Object.entries(stats.byCategory)
      .map(([cat, items]) => ({ category: cat, count: items.length }))
      .sort((a, b) => b.count - a.count);

    // Privacy distribution
    stats.privacyDistribution = Object.entries(stats.byPrivacy)
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count);

    return stats;
  }

  // ========== AGENT 3: JUNG (Architect / Mask Builder) ==========
  async runArchitect(memories, extractions, statistics, interrogation = null) {
    const architectModel = APIClient.getModelForTask('profiler', this.provider);
    const jung = this.p('jung');

    const memoriesSample = memories.slice(0, 60).map((m, i) => `[${i + 1}] ${m.text}`).join('\n');

    const expertiseStr = statistics.expertiseDomains
      .map(e => `- ${e.fact}`)
      .join('\n');

    const experienceStr = statistics.experienceMarkers
      .map(e => `- ${e.fact}`)
      .join('\n');

    const trustStr = statistics.trustSignals
      .map(t => `- ${t.fact}`)
      .join('\n');

    // Build interrogation section if available
    let interrogationSection = '';
    if (interrogation && interrogation.length > 0) {
      const interrogationText = interrogation
        .filter(r => r.response && r.response.length > 50)
        .slice(0, 8) // Top 8 most relevant responses
        .map(r => `[${r.id}] ${r.response.substring(0, 500)}`)
        .join('\n\n');

      if (interrogationText) {
        const header = this.language === 'fr'
          ? `## RÉVÉLATIONS CHATGPT (données prioritaires pour l'identité)
Ces réponses viennent directement de ChatGPT qui connaît l'utilisateur. UTILISE CES INFOS EN PRIORITÉ pour nom, prénom, profession, expertise:`
          : `## CHATGPT REVELATIONS (priority data for identity)
These responses come directly from ChatGPT who knows the user. USE THIS INFO AS PRIORITY for name, first name, profession, expertise:`;

        interrogationSection = `\n${header}\n${interrogationText}\n`;
      }
    }

    const prompt = `${jung.intro}

${jung.dataHeader}
${interrogationSection}
${jung.memoriesHeader} (${memories.length} total):
${memoriesSample}

${jung.expertiseHeader}
${expertiseStr || jung.notDetected}

${jung.experienceHeader}
${experienceStr || jung.notDetected}

${jung.trustHeader}
${trustStr || jung.notDetected}

${jung.tagsHeader}
${statistics.topTags?.slice(0, 15).map(t => t.tag).join(', ') || 'N/A'}

${jung.task}

${jung.outputHeader}

${PROMPTS.schemas.jung}`;

    const response = await this.api.call(prompt, {
      provider: this.provider,
      model: architectModel,
      maxTokens: 3000
    });

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse architect response:', e);
        return this.getDefaultMask();
      }
    }
    return this.getDefaultMask();
  }

  // ========== AGENT 4: CIALDINI (Writing Charter) ==========
  async runCharterer(memories, extractions, maskCore) {
    const chartererModel = APIClient.getModelForTask('detective', this.provider);
    const cialdini = this.p('cialdini');

    const voiceExamples = extractions
      .filter(e => (e.categories || []).includes('voice'))
      .slice(0, 10)
      .map(e => e.text)
      .join('\n---\n');

    const memoriesSample = memories.slice(0, 30).map(m => m.text).join('\n---\n');
    const maskStr = JSON.stringify(maskCore, null, 2);

    const prompt = `${cialdini.intro}

${cialdini.personaHeader}
${maskStr}

${cialdini.voiceHeader}
${voiceExamples || memoriesSample}

${cialdini.task}

${cialdini.outputHeader}

${PROMPTS.schemas.cialdini}`;

    const response = await this.api.call(prompt, {
      provider: this.provider,
      model: chartererModel,
      maxTokens: 2500
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse charterer response:', e);
        return this.getDefaultCharter();
      }
    }
    return this.getDefaultCharter();
  }

  // ========== AGENT 5: PSYCHOLOGICAL PROFILER ==========
  async runPsychProfiler(interrogationResponses) {
    const profilerModel = APIClient.getModelForTask('detective', this.provider);
    const profiler = this.p('profiler');

    const responsesText = interrogationResponses
      .map(r => `## ${r.category.toUpperCase()}\nQuestion: ${r.id}\nResponse:\n${r.response}`)
      .join('\n\n---\n\n');

    const prompt = `${profiler.intro}

${profiler.context}

${profiler.responsesHeader}
${responsesText}

${profiler.task}

${profiler.outputHeader}

${PROMPTS.schemas.profiler}`;

    const response = await this.api.call(prompt, {
      provider: this.provider,
      model: profilerModel,
      maxTokens: 3500
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse psychProfiler response:', e);
        return this.getDefaultPsychProfile();
      }
    }
    return this.getDefaultPsychProfile();
  }

  getDefaultPsychProfile() {
    return {
      summary: {
        oneSentence: "Données insuffisantes pour établir un profil",
        keyInsight: null,
        dataQuality: "faible"
      },
      identity: { confirmed: [], inferred: [], confidence: 0 },
      psychology: null,
      motivations: null,
      influenceTriggers: null,
      communication: null,
      archetype: null,
      vulnerabilities: null,
      contradictions: [],
      marketingProfile: null
    };
  }

  // ========== MODE MAX: DUAL AI ANALYSIS (Freud vs Jung) ==========
  async runDualAnalysis(memories, statistics, maskCore, psychProfile) {
    const geminiModel = APIClient.getModels().google.pro; // Gemini 2.5 Pro
    const claudeModel = APIClient.getModels().anthropic.sonnet; // Claude Sonnet 4.5
    const freud = this.p('freud');
    const jungArb = this.p('jungArbitrator');

    // Prepare the synthesis prompt for both AIs
    const memoriesSample = memories.slice(0, 40).map(m => m.text).join('\n');
    const statsStr = JSON.stringify(statistics?.topTags?.slice(0, 10) || [], null, 2);
    const maskStr = JSON.stringify(maskCore?.mask || {}, null, 2);
    const psychStr = psychProfile ? JSON.stringify(psychProfile.summary || {}, null, 2) : freud.notAvailable;

    const analysisPrompt = `${freud.intro}

${freud.dataHeader}
${freud.memoriesHeader} ${memories.length} total):
${memoriesSample}

${freud.statsHeader}
${freud.tagsHeader} ${statsStr}

${freud.personaHeader}
${maskStr}

${freud.psychHeader}
${psychStr}

${freud.task}

${PROMPTS.schemas.freud}

JSON only, no markdown.`;

    try {
      console.log('[DualAnalysis] Starting with models:', { geminiModel, claudeModel });

      // Run both analyses in parallel
      const [geminiResponse, claudeResponse] = await Promise.all([
        this.api.callGoogle(analysisPrompt, { model: geminiModel, maxTokens: 2000 }),
        this.api.callAnthropic(analysisPrompt, { model: claudeModel, maxTokens: 2000 })
      ]);

      console.log('[DualAnalysis] Gemini response length:', geminiResponse?.length);
      console.log('[DualAnalysis] Claude response length:', claudeResponse?.length);

      // Parse responses
      const parseJson = (text) => {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try { return JSON.parse(match[0]); }
          catch (e) {
            console.error('[DualAnalysis] JSON parse error:', e.message);
            return null;
          }
        }
        console.warn('[DualAnalysis] No JSON found in response');
        return null;
      };

      const geminiAnalysis = parseJson(geminiResponse);
      const claudeAnalysis = parseJson(claudeResponse);

      console.log('[DualAnalysis] Parsed - Gemini:', !!geminiAnalysis, 'Claude:', !!claudeAnalysis);

      // Now run arbitration with Claude as Jung responding to Freud
      const arbitrationPrompt = `${jungArb.intro}

${jungArb.freudHeader}
${JSON.stringify(geminiAnalysis, null, 2)}

${jungArb.yourHeader}
${JSON.stringify(claudeAnalysis, null, 2)}

${jungArb.task}

${PROMPTS.schemas.jungArbitrator}

JSON only.`;

      const arbitrationResponse = await this.api.callAnthropic(arbitrationPrompt, {
        model: claudeModel,
        maxTokens: 2000
      });

      const arbitration = parseJson(arbitrationResponse);

      return {
        gemini: geminiAnalysis,
        claude: claudeAnalysis,
        arbitration,
        metadata: {
          geminiModel,
          claudeModel,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Dual analysis error:', error);
      return {
        error: error.message,
        gemini: null,
        claude: null,
        arbitration: null
      };
    }
  }

  // ========== DEFAULTS ==========
  getDefaultMask() {
    return {
      mask: {
        type: 'passionne',
        profile: {
          firstName: 'À définir',
          lastName: 'À définir',
          ageRange: '30-50',
          location: 'France',
          background: 'Extraction incomplète - à compléter manuellement',
          currentSituation: 'À définir'
        },
        expertiseLevel: 'praticien',
        expertiseDomains: [],
        bias: 'À définir',
        mission: 'À définir',
        limits: ['À définir'],
        uniqueValue: 'À définir'
      },
      backstory: {
        trigger: 'À définir',
        experience: 'À définir',
        motivation: 'À définir',
        source: 'À définir',
        vulnerability: 'À définir',
        fullText: 'Extraction incomplète. Veuillez compléter manuellement.'
      },
      editorial: {
        angle: 'pedagogue',
        tone: {
          register: 'conversationnel',
          technicality: 'accessible',
          warmth: 'chaleureux',
          assertiveness: 'nuance'
        },
        implicitValues: [],
        editorialPromise: 'À définir'
      }
    };
  }

  getDefaultCharter() {
    return {
      allowedPatterns: [],
      forbiddenPatterns: [
        { pattern: 'Dans cet article', reason: 'Signal IA', alternative: 'Attaquer directement' },
        { pattern: 'Il est important de', reason: 'Formule creuse', alternative: 'Être direct' }
      ],
      rhythm: {
        avgSentenceLength: '15-20 mots',
        shortSentenceFrequency: '1/4',
        maxLongSentence: 35,
        paragraphLength: '3-5 phrases'
      },
      humanSignals: {
        anecdoteType: 'À définir',
        opinionStyle: 'À définir',
        hesitations: [],
        irregularities: []
      },
      expertSignals: {
        precisionMarkers: [],
        insiderReferences: [],
        nuancePatterns: [],
        concreteDetails: 'À définir'
      },
      examplesInTone: [],
      examplesOutOfTone: [],
      vocabulary: { preferred: [], avoided: [], jargon: [] }
    };
  }

  // ========== HELPERS ==========
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
