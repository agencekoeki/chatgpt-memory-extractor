// ChatGPT Memory Extractor - Persona Pipeline v2.0
// Generates E-E-A-T compliant Author Identity Mask from memories
// The 4 Agents: Extracteur, Statisticien, Architecte, Rédacteur

import { APIClient } from './api.js';

export class AnalysisPipeline {
  constructor(keys, options = {}) {
    this.api = new APIClient(keys);
    this.options = options;
    this.provider = options.provider || this.api.getDefaultProvider();
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
      // Stage 1: Extracteur E-E-A-T - Extract persona-relevant data
      onProgress('extracting', 0, 'L\'Extracteur analyse chaque souvenir (E-E-A-T)...');
      results.extractions = await this.runExtractor(memories, (done, total) => {
        onProgress('extracting', (done / total) * 100, `Extraction: ${done}/${total}`);
      });
      results.stages.extracting = { done: true, time: Date.now() - startTime };

      // Stage 2: Statisticien - Aggregate for persona building
      onProgress('statistics', 0, 'Le Statisticien agrège les données...');
      results.statistics = this.runStatistician(results.extractions, memories);
      results.stages.statistics = { done: true, time: Date.now() - startTime };
      onProgress('statistics', 100, 'Agrégation terminée');

      // Stage 3: Architecte - Build mask structure
      onProgress('architecting', 0, 'L\'Architecte construit le masque...');
      const maskCore = await this.runArchitect(memories, results.extractions, results.statistics);
      results.stages.architecting = { done: true, time: Date.now() - startTime };
      onProgress('architecting', 100, 'Structure du masque créée');

      // Stage 4: Rédacteur - Create writing charter
      onProgress('chartering', 0, 'Le Rédacteur crée la charte d\'écriture...');
      const writingCharter = await this.runCharterer(memories, results.extractions, maskCore);
      results.stages.chartering = { done: true, time: Date.now() - startTime };
      onProgress('chartering', 100, 'Charte d\'écriture terminée');

      // Stage 5: Profileur Psychologique - Analyze interrogation (if available)
      let psychProfile = null;
      if (this.options.interrogation && this.options.interrogation.length > 0) {
        onProgress('profiling', 0, 'Le Profileur analyse les révélations ChatGPT...');
        psychProfile = await this.runPsychProfiler(this.options.interrogation);
        results.stages.profiling = { done: true, time: Date.now() - startTime };
        onProgress('profiling', 100, 'Profil psychologique établi');
      }

      // Combine into final persona
      results.persona = {
        ...maskCore,
        writingCharter,
        psychProfile,
        metadata: {
          generatedAt: new Date().toISOString(),
          memoriesAnalyzed: memories.length,
          interrogationResponses: this.options.interrogation?.length || 0,
          provider: this.provider,
          version: '2.1'
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

  // ========== AGENT 1: EXTRACTEUR E-E-A-T ==========
  async runExtractor(memories, onProgress) {
    const extractorModel = APIClient.getModelForTask('labeler', this.provider);
    const extractions = new Array(memories.length);

    // Parallel batch size (adjust based on rate limits)
    const BATCH_SIZE = 10;

    const EEAT_TAXONOMY = {
      expertise: ['domaine', 'compétence', 'outil', 'méthodologie', 'certification', 'formation'],
      experience: ['projet_réalisé', 'années_pratique', 'cas_concret', 'erreur_passée', 'leçon_apprise'],
      authority: ['rôle', 'responsabilité', 'reconnaissance', 'publication', 'enseignement'],
      trust: ['valeur', 'éthique', 'limite_avouée', 'transparence', 'opinion_honnête'],
      voice: ['ton', 'registre', 'expression_favorite', 'humour', 'tic_langage']
    };

    const prompt = (memory) => `Tu extrais des données pour construire un PERSONA AUTEUR crédible (E-E-A-T).

TAXONOMIE E-E-A-T:
- EXPERTISE: ${EEAT_TAXONOMY.expertise.join(', ')}
- EXPERIENCE: ${EEAT_TAXONOMY.experience.join(', ')}
- AUTHORITY: ${EEAT_TAXONOMY.authority.join(', ')}
- TRUST: ${EEAT_TAXONOMY.trust.join(', ')}
- VOICE: ${EEAT_TAXONOMY.voice.join(', ')}

NIVEAUX DE CONFIDENTIALITÉ:
- public: Information partageable publiquement (préférences générales, goûts, hobbies généraux)
- semi-prive: Information personnelle mais pas sensible (ville, profession, projets)
- prive: Information personnelle sensible (relations, santé légère, finances générales)
- tres-prive: Information très sensible (données médicales, secrets, identifiants, famille proche)

SOUVENIR À ANALYSER:
"${memory.text}"

EXTRAIS en JSON:
{
  "categories": ["expertise|experience|authority|trust|voice"],
  "tags": ["tag1", "tag2"],
  "extracted_fact": "Le fait brut extrait",
  "persona_value": "Comment utiliser ça pour le persona",
  "privacy_level": "public|semi-prive|prive|tres-prive",
  "confidence": 0.8
}

JSON uniquement, pas de markdown.`;

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

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < memories.length) {
        await this.delay(200);
      }
    }

    return extractions.filter(e => e); // Remove any undefined
  }

  // ========== AGENT 2: STATISTICIEN ==========
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

  // ========== AGENT 3: ARCHITECTE (MASK BUILDER) ==========
  async runArchitect(memories, extractions, statistics) {
    const architectModel = APIClient.getModelForTask('profiler', this.provider);

    const memoriesSample = memories.slice(0, 60).map((m, i) => `[${i + 1}] ${m.text}`).join('\n');

    const factsStr = statistics.rawFacts
      .slice(0, 30)
      .map(f => `- ${f.fact} → ${f.value}`)
      .join('\n');

    const expertiseStr = statistics.expertiseDomains
      .map(e => `- ${e.fact}`)
      .join('\n');

    const experienceStr = statistics.experienceMarkers
      .map(e => `- ${e.fact}`)
      .join('\n');

    const trustStr = statistics.trustSignals
      .map(t => `- ${t.fact}`)
      .join('\n');

    const prompt = `Tu es ARCHITECTE DE PERSONA. Tu construis une identité d'auteur crédible à partir de souvenirs réels.

## DONNÉES D'ENTRÉE

### Souvenirs bruts (${memories.length} au total):
${memoriesSample}

### Expertise détectée:
${expertiseStr || 'Non détectée'}

### Expérience détectée:
${experienceStr || 'Non détectée'}

### Signaux de confiance:
${trustStr || 'Non détectés'}

### Tags fréquents:
${statistics.topTags?.slice(0, 15).map(t => t.tag).join(', ') || 'N/A'}

## TON TRAVAIL

Génère un JSON de persona CRÉDIBLE. L'objectif: créer une identité d'auteur qui peut écrire du contenu E-E-A-T compliant.

RÈGLES:
- Le persona doit être COHÉRENT avec les souvenirs
- Les vulnérabilités sont OBLIGATOIRES (ça humanise)
- Le bias doit être une VRAIE opinion défendable
- La backstory doit expliquer POURQUOI cette personne parle de ces sujets

## OUTPUT JSON (pas de markdown, juste le JSON):

{
  "mask": {
    "type": "expert-independant|passionne|professionnel|petit-media|collectif",
    "profile": {
      "firstName": "Prénom authentique",
      "lastName": "Nom crédible",
      "ageRange": "35-45",
      "location": "Région/Ville cohérente",
      "background": "Parcours en 3-4 phrases basé sur les souvenirs",
      "currentSituation": "Ce qu'il fait aujourd'hui"
    },
    "expertiseLevel": "amateur-eclaire|praticien|expert",
    "expertiseDomains": ["domaine1", "domaine2"],
    "bias": "Opinion/angle défendu (déduit des souvenirs)",
    "mission": "Pourquoi cette personne partage son savoir",
    "limits": ["Ce qu'elle ne prétend pas savoir 1", "Limite 2"],
    "uniqueValue": "Ce qu'elle apporte que d'autres n'apportent pas"
  },
  "backstory": {
    "trigger": "L'événement déclencheur qui a lancé son intérêt",
    "experience": "Ce qui a construit son expertise (projets, années, cas)",
    "motivation": "Pourquoi partager maintenant",
    "source": "Comment elle collecte ses informations",
    "vulnerability": "Erreur passée ou limite avouée (OBLIGATOIRE)",
    "fullText": "Backstory complète rédigée (150-200 mots)"
  },
  "editorial": {
    "angle": "expert-technique|pedagogue|passionne|pragmatique|conseiller",
    "tone": {
      "register": "formel|conversationnel|entre-deux",
      "technicality": "technique|accessible|variable",
      "warmth": "distant|neutre|chaleureux",
      "assertiveness": "affirmatif|nuance|prudent"
    },
    "implicitValues": [
      {"value": "Valeur 1", "manifestation": "Comment elle se manifeste"},
      {"value": "Valeur 2", "manifestation": "Comment elle se manifeste"}
    ],
    "editorialPromise": "Ce que le lecteur trouve ici qu'il ne trouve pas ailleurs"
  }
}`;

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

  // ========== AGENT 4: RÉDACTEUR (WRITING CHARTER) ==========
  async runCharterer(memories, extractions, maskCore) {
    const chartererModel = APIClient.getModelForTask('detective', this.provider);

    const voiceExamples = extractions
      .filter(e => (e.categories || []).includes('voice'))
      .slice(0, 10)
      .map(e => e.text)
      .join('\n---\n');

    const memoriesSample = memories.slice(0, 30).map(m => m.text).join('\n---\n');

    const maskStr = JSON.stringify(maskCore, null, 2);

    const prompt = `Tu es RÉDACTEUR DE CHARTE. Tu crées les règles d'écriture pour qu'une IA puisse écrire COMME cette personne.

## PERSONA DÉFINI:
${maskStr}

## EXEMPLES DE VOIX (souvenirs révélant le style):
${voiceExamples || memoriesSample}

## TON TRAVAIL

Génère la CHARTE D'ÉCRITURE en JSON. Cette charte sera utilisée pour prompter une IA à écrire des articles.

RÈGLES:
- Les patterns doivent être SPÉCIFIQUES et ACTIONNABLES
- Les forbiddenPatterns sont les "tells" qui trahissent l'IA
- Les humanSignals sont ce qui rend le texte vivant
- Les expertSignals prouvent que l'auteur sait de quoi il parle

## OUTPUT JSON (pas de markdown):

{
  "allowedPatterns": [
    {"pattern": "Description du pattern", "example": "Phrase exemple"},
    {"pattern": "Anecdote personnelle en ouverture", "example": "L'autre jour, j'ai..."},
    {"pattern": "Question rhétorique", "example": "Mais est-ce vraiment le cas?"}
  ],
  "forbiddenPatterns": [
    {"pattern": "Dans cet article nous allons", "reason": "Signal IA évident", "alternative": "Attaquer directement le sujet"},
    {"pattern": "Il est important de noter que", "reason": "Formule creuse", "alternative": "Dire le truc directement"},
    {"pattern": "En conclusion", "reason": "Trop mécanique", "alternative": "Terminer naturellement"},
    {"pattern": "N'hésitez pas à", "reason": "Trop commercial", "alternative": "Impératif direct"}
  ],
  "rhythm": {
    "avgSentenceLength": "15-20 mots",
    "shortSentenceFrequency": "1 phrase courte tous les 3-4 phrases",
    "maxLongSentence": 35,
    "paragraphLength": "3-5 phrases"
  },
  "humanSignals": {
    "anecdoteType": "Type d'anecdotes que cette personne utiliserait",
    "opinionStyle": "Comment elle exprime ses opinions",
    "hesitations": ["Je ne suis pas certain que...", "Ça dépend vraiment de...", "Honnêtement..."],
    "irregularities": ["Phrase sans verbe occasionnelle", "Parenthèse digressive", "Début par Et/Mais"]
  },
  "expertSignals": {
    "precisionMarkers": ["Sur mes X projets...", "En Y années de..."],
    "insiderReferences": ["Ce que les [pros] ne disent pas...", "Entre nous..."],
    "nuancePatterns": ["Sauf si...", "Dans le cas particulier de...", "Attention cependant..."],
    "concreteDetails": "Type de détails concrets à inclure"
  },
  "examplesInTone": [
    "Une phrase exemple parfaitement dans le ton du persona",
    "Une autre phrase exemple dans le bon style"
  ],
  "examplesOutOfTone": [
    {"phrase": "Il est absolument essentiel de considérer que...", "reason": "Trop formel, superlatif vide"},
    {"phrase": "Dans notre monde moderne en constante évolution...", "reason": "Cliché IA absolu"}
  ],
  "vocabulary": {
    "preferred": ["mots que cette personne utilise naturellement"],
    "avoided": ["mots trop soutenus ou trop IA"],
    "jargon": ["termes techniques qu'elle maîtrise"]
  }
}`;

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

  // ========== AGENT 5: PROFILEUR PSYCHOLOGIQUE ==========
  async runPsychProfiler(interrogationResponses) {
    const profilerModel = APIClient.getModelForTask('detective', this.provider);

    // Organiser les réponses par catégorie
    const responsesByCategory = {};
    interrogationResponses.forEach(r => {
      responsesByCategory[r.category] = r.response;
    });

    const responsesText = interrogationResponses
      .map(r => `## ${r.category.toUpperCase()}\nQuestion: ${r.id}\nRéponse ChatGPT:\n${r.response}`)
      .join('\n\n---\n\n');

    const prompt = `Tu es PROFILEUR PSYCHOLOGIQUE. Tu analyses les réponses de ChatGPT sur un utilisateur pour dresser un profil complet.

## CONTEXTE
Ces réponses viennent d'un interrogatoire de ChatGPT. On lui a demandé ce qu'il sait/déduit de l'utilisateur à partir de leurs conversations passées.

## RÉPONSES DE CHATGPT:
${responsesText}

## TON TRAVAIL

Synthétise ces observations en un PROFIL PSYCHOLOGIQUE ACTIONNABLE.

RÈGLES:
- Distingue les FAITS (observés) des INFÉRENCES (déduites)
- Note le niveau de confiance pour chaque élément
- Croise les informations: si plusieurs catégories pointent vers le même trait, c'est plus fiable
- Identifie les CONTRADICTIONS éventuelles
- Reste factuel et froid (pas de jugement moral)

## OUTPUT JSON (pas de markdown):

{
  "summary": {
    "oneSentence": "Résumé en une phrase de qui est cette personne",
    "keyInsight": "L'insight le plus révélateur/surprenant",
    "dataQuality": "faible|moyenne|bonne|excellente"
  },
  "identity": {
    "confirmed": ["Faits confirmés par ChatGPT"],
    "inferred": ["Éléments déduits avec confiance modérée"],
    "confidence": 0.8
  },
  "psychology": {
    "brainType": {
      "dominant": "rationnel|emotionnel|instinctif",
      "secondary": "rationnel|emotionnel|instinctif|null",
      "evidence": "Preuves de ce diagnostic"
    },
    "behaviorProfile": {
      "primary": "explorateur|batisseur|directeur|negociateur",
      "secondary": "explorateur|batisseur|directeur|negociateur|null",
      "evidence": "Preuves"
    },
    "thinkingSystem": {
      "dominant": "systeme1|systeme2|mixte",
      "context": "Dans quelles situations bascule-t-il?"
    },
    "enneagramHint": {
      "probableType": "1-9 ou null si pas assez de données",
      "evidence": "Indices observés"
    }
  },
  "motivations": {
    "drivers": ["Ce qui le fait agir"],
    "fears": ["Ce qu'il évite/craint"],
    "soncas": {
      "primary": "securite|orgueil|nouveaute|confort|argent|sympathie",
      "secondary": "securite|orgueil|nouveaute|confort|argent|sympathie|null"
    }
  },
  "influenceTriggers": {
    "mostSensitive": "preuve_sociale|autorite|rarete|reciprocite|engagement|affection",
    "leastSensitive": "preuve_sociale|autorite|rarete|reciprocite|engagement|affection",
    "evidence": "Comment on l'a détecté"
  },
  "communication": {
    "vak": "visuel|auditif|kinesthesique",
    "style": "Description du style de communication",
    "sensitiveTopics": ["Sujets à éviter ou aborder avec précaution"],
    "engagementTips": ["Comment l'engager efficacement"]
  },
  "archetype": {
    "jungian": "heros|sage|explorateur|rebelle|magicien|innocent|createur|dirigeant|protecteur|amoureux|bouffon|ordinaire",
    "shadow": "Ombre ou anti-pattern potentiel",
    "evidence": "Preuves"
  },
  "vulnerabilities": {
    "weaknesses": ["Faiblesses observées"],
    "blindSpots": ["Angles morts cognitifs"],
    "stressType": "A|B|C|D",
    "copingMechanisms": ["Comment il gère le stress"]
  },
  "contradictions": [
    {"observation1": "...", "observation2": "...", "interpretation": "Ce que ça suggère"}
  ],
  "marketingProfile": {
    "vals": "innovateur|penseur|achiever|experiencer|croyant|striver|maker|survivor",
    "buyingTriggers": ["Ce qui déclenche une décision d'achat/action"],
    "messagingAngle": "Comment lui parler pour le convaincre",
    "contentPreference": "Type de contenu qu'il préfère consommer"
  }
}`;

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
