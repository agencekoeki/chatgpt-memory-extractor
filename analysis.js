// ChatGPT Memory Extractor - Analysis Pipeline v1.0
// The 4 Agents: Librarian, Statistician, Profiler, Detective

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
      labels: [],
      statistics: {},
      profile: '',
      insights: '',
      stages: {}
    };

    try {
      // Stage 1: Librarian - Label each memory
      onProgress('labeling', 0, 'Le Bibliothécaire analyse chaque souvenir...');
      results.labels = await this.runLibrarian(memories, (done, total) => {
        onProgress('labeling', (done / total) * 100, `Labélisation: ${done}/${total}`);
      });
      results.stages.labeling = { done: true, time: Date.now() - startTime };

      // Stage 2: Statistician - Aggregate labels
      onProgress('statistics', 0, 'Le Statisticien calcule les fréquences...');
      results.statistics = this.runStatistician(results.labels);
      results.stages.statistics = { done: true, time: Date.now() - startTime };
      onProgress('statistics', 100, 'Statistiques calculées');

      // Stage 3: Profiler - Create portrait
      onProgress('profiling', 0, 'Le Profileur rédige le portrait...');
      results.profile = await this.runProfiler(memories, results.labels, results.statistics);
      results.stages.profiling = { done: true, time: Date.now() - startTime };
      onProgress('profiling', 100, 'Portrait terminé');

      // Stage 4: Detective - Find insights
      onProgress('insights', 0, 'Le Détective cherche les patterns cachés...');
      results.insights = await this.runDetective(memories, results.labels, results.statistics);
      results.stages.insights = { done: true, time: Date.now() - startTime };
      onProgress('insights', 100, 'Analyse terminée');

      results.totalTime = Date.now() - startTime;
      results.success = true;

    } catch (error) {
      results.error = error.message;
      results.success = false;
    }

    return results;
  }

  // ========== AGENT 1: LIBRARIAN ==========
  async runLibrarian(memories, onProgress) {
    const labelerModel = APIClient.getModelForTask('labeler', this.provider);
    const labels = [];

    const TAXONOMY = {
      domains: ['tech', 'business', 'creative', 'personal', 'communication'],
      types: ['preference', 'project', 'skill', 'tool', 'value', 'context', 'fact'],
      specific: ['seo', 'wordpress', 'ai', 'dev', 'design', 'writing', 'video', 'marketing', 'analytics', 'automation']
    };

    const prompt = (memory) => `Tu es bibliothécaire. On te donne UN souvenir de ChatGPT sur une personne.
Ton SEUL travail: retourner 1-4 labels pertinents.

TAXONOMIE:
- DOMAINES: ${TAXONOMY.domains.join(', ')}
- TYPES: ${TAXONOMY.types.join(', ')}
- SPÉCIFIQUES: ${TAXONOMY.specific.join(', ')}

SOUVENIR:
"${memory.text}"

Réponds UNIQUEMENT en JSON valide: {"labels": ["label1", "label2"]}
Pas d'explication. Pas de markdown. Juste le JSON.`;

    // Process in batches
    for (let i = 0; i < memories.length; i++) {
      try {
        const response = await this.api.call(prompt(memories[i]), {
          provider: this.provider,
          model: labelerModel,
          maxTokens: 100
        });

        // Parse JSON response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          labels.push({
            memoryId: i,
            text: memories[i].text.substring(0, 100),
            labels: parsed.labels || []
          });
        } else {
          labels.push({ memoryId: i, text: memories[i].text.substring(0, 100), labels: [] });
        }
      } catch (e) {
        labels.push({ memoryId: i, text: memories[i].text.substring(0, 100), labels: [], error: e.message });
      }

      onProgress(i + 1, memories.length);

      // Rate limiting
      if (i < memories.length - 1) {
        await this.delay(100);
      }
    }

    return labels;
  }

  // ========== AGENT 2: STATISTICIAN ==========
  runStatistician(labels) {
    const stats = {
      totalLabeled: labels.length,
      labelFrequency: {},
      coOccurrences: {},
      clusters: [],
      topLabels: []
    };

    // Count label frequencies
    labels.forEach(item => {
      (item.labels || []).forEach(label => {
        stats.labelFrequency[label] = (stats.labelFrequency[label] || 0) + 1;
      });
    });

    // Calculate co-occurrences
    labels.forEach(item => {
      const itemLabels = item.labels || [];
      for (let i = 0; i < itemLabels.length; i++) {
        for (let j = i + 1; j < itemLabels.length; j++) {
          const pair = [itemLabels[i], itemLabels[j]].sort().join(' + ');
          stats.coOccurrences[pair] = (stats.coOccurrences[pair] || 0) + 1;
        }
      }
    });

    // Top labels
    stats.topLabels = Object.entries(stats.labelFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([label, count]) => ({ label, count, percent: Math.round(count / labels.length * 100) }));

    // Top co-occurrences
    stats.topCoOccurrences = Object.entries(stats.coOccurrences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pair, count]) => ({ pair, count }));

    // Simple clustering by dominant label
    const clusters = {};
    labels.forEach(item => {
      const dominant = (item.labels || [])[0];
      if (dominant) {
        if (!clusters[dominant]) clusters[dominant] = [];
        clusters[dominant].push(item);
      }
    });
    stats.clusters = Object.entries(clusters)
      .map(([name, items]) => ({ name, count: items.length, items: items.slice(0, 5) }))
      .sort((a, b) => b.count - a.count);

    return stats;
  }

  // ========== AGENT 3: PROFILER ==========
  async runProfiler(memories, labels, statistics) {
    const profilerModel = APIClient.getModelForTask('profiler', this.provider);

    const memoriesSample = memories
      .slice(0, 50)
      .map((m, i) => `[${i + 1}] ${m.text}`)
      .join('\n\n');

    const statsStr = `
Labels les plus fréquents:
${statistics.topLabels.map(l => `- ${l.label}: ${l.count} (${l.percent}%)`).join('\n')}

Co-occurrences fréquentes:
${statistics.topCoOccurrences?.map(c => `- ${c.pair}: ${c.count}`).join('\n') || 'N/A'}
`;

    const prompt = `Tu es profileur cognitif expert. Tu analyses les souvenirs qu'une IA a gardés sur une personne pour dresser son portrait.

DONNÉES D'ENTRÉE:
- ${memories.length} souvenirs au total
- Échantillon des 50 premiers souvenirs ci-dessous
- Statistiques de labélisation

SOUVENIRS:
${memoriesSample}

STATISTIQUES:
${statsStr}

TON TRAVAIL: Rédige un PORTRAIT DÉTAILLÉ de cette personne.

STRUCTURE OBLIGATOIRE:
## Identité Professionnelle
[Qui est cette personne dans son travail? Quel est son métier, son domaine?]

## Compétences & Outils
[Quelles compétences maîtrise-t-elle? Quels outils utilise-t-elle? Qu'apprend-elle?]

## Valeurs & Convictions
[Qu'est-ce qui compte pour elle? Quelles sont ses opinions fortes?]

## Style de Pensée
[Comment réfléchit-elle? Analytique, créatif, pragmatique?]

## Projets Actifs
[Sur quoi travaille-t-elle actuellement?]

## Préférences de Communication
[Comment préfère-t-elle qu'on lui parle? En quelle langue? Quel ton?]

RÈGLES:
- Sois SPÉCIFIQUE, cite des exemples tirés des souvenirs
- Écris à la 3ème personne
- 500-800 mots maximum
- Pas de bullet points dans les paragraphes, du texte fluide`;

    return await this.api.call(prompt, {
      provider: this.provider,
      model: profilerModel,
      maxTokens: 2000
    });
  }

  // ========== AGENT 4: DETECTIVE ==========
  async runDetective(memories, labels, statistics) {
    const detectiveModel = APIClient.getModelForTask('detective', this.provider);

    const memoriesSample = memories
      .slice(0, 40)
      .map((m, i) => `[${i + 1}] ${m.text}`)
      .join('\n\n');

    const prompt = `Tu es détective cognitif. Tu cherches ce qui est CACHÉ, SURPRENANT, ou CONTRADICTOIRE dans les souvenirs qu'une IA garde sur une personne.

SOUVENIRS (${memories.length} au total, échantillon de 40):
${memoriesSample}

STATISTIQUES:
${JSON.stringify(statistics.topLabels, null, 2)}

TON TRAVAIL: Trouve les insights non évidents.

CHERCHE:

## Patterns Cachés
[Connexions non évidentes entre sujets qui semblent différents]

## Contradictions
[Souvenirs qui se contredisent ou montrent une évolution]

## Absences Surprenantes
[Ce qu'on attendrait de cette personne mais qui n'apparaît pas]

## Intensités Émotionnelles
[Sujets où la personne semble avoir une charge émotionnelle forte]

## Hypothèses
[Ce que tu déduis au-delà de ce qui est explicite]

FORMAT pour chaque trouvaille:
**Observation**: [ce que tu as remarqué]
**Preuves**: [souvenirs qui le montrent, cite les numéros]
**Hypothèse**: [ce que ça pourrait signifier]

Sois perspicace et original. 400-600 mots.`;

    return await this.api.call(prompt, {
      provider: this.provider,
      model: detectiveModel,
      maxTokens: 1500
    });
  }

  // ========== HELPERS ==========
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
