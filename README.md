# ChatGPT Memory Extractor & Analyzer

Une extension Chrome qui extrait automatiquement vos souvenirs ChatGPT et les analyse avec l'IA pour créer un portrait cognitif personnalisé.

![Version](https://img.shields.io/badge/version-4.0-purple)
![Chrome](https://img.shields.io/badge/Chrome-Extension-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Fonctionnalités

### Extraction Automatique
- Navigation automatique dans l'interface ChatGPT
- Détection intelligente des éléments UI (profile → settings → memories)
- Scroll automatique pour capturer tous les souvenirs
- Fonctionne avec l'interface ChatGPT de décembre 2024

### Analyse IA Multi-Provider
- **Anthropic Claude** (Haiku, Sonnet, Opus)
- **OpenAI GPT** (4o-mini, 4o, 4-turbo)
- **Google Gemini** (Flash, Pro)

### Dashboard de Visualisation
- Design épuré avec effets lumineux subtils
- Animations de révélation progressive (blur → net)
- Sections: Portrait, Insights, Statistiques, Souvenirs
- Export JSON

---

## Architecture

```
chatgpt-memory-extractor/
├── manifest.json        # Configuration Chrome Extension v3
├── background.js        # Service Worker (persistance)
├── storage.js           # Module IndexedDB
├── api.js               # Client API unifié (Anthropic/OpenAI/Google)
├── analysis.js          # Pipeline des 4 agents d'analyse
├── content.js           # Script injecté dans ChatGPT
├── popup.html/js        # Interface popup de l'extension
├── settings.html/js     # Configuration des clés API
├── report.html/js       # Dashboard de visualisation
└── styles.css           # Styles du popup
```

---

## Les 4 Agents d'Analyse

### 1. Agent Bibliothécaire 📚
**Modèle**: Haiku / GPT-4o-mini / Gemini Flash (rapide, économique)

**Mission**: Labéliser chaque souvenir avec une taxonomie prédéfinie.

**Taxonomie**:
- **Domaines**: tech, business, creative, personal, communication
- **Types**: preference, project, skill, tool, value, context, fact
- **Spécifiques**: seo, wordpress, ai, dev, design, writing, video, marketing, analytics, automation

**Prompt**:
```
Tu es bibliothécaire. On te donne UN souvenir de ChatGPT.
Ton SEUL travail: retourner 1-4 labels pertinents.
Réponds UNIQUEMENT en JSON: {"labels": ["label1", "label2"]}
```

### 2. Agent Statisticien 📊
**Modèle**: JavaScript pur (pas besoin d'IA)

**Mission**: Agréger les labels et calculer des statistiques.

**Outputs**:
- Fréquence de chaque label
- Co-occurrences (quels labels apparaissent ensemble)
- Clusters naturels
- Top labels avec pourcentages

### 3. Agent Profileur 🎯
**Modèle**: Opus / GPT-4o / Gemini Pro (intelligent)

**Mission**: Rédiger un portrait narratif de l'utilisateur.

**Structure du portrait**:
- Identité Professionnelle
- Compétences & Outils
- Valeurs & Convictions
- Style de Pensée
- Projets Actifs
- Préférences de Communication

**Prompt clé**:
```
Tu es profileur cognitif expert. Tu analyses les souvenirs
qu'une IA a gardés sur une personne pour dresser son portrait.
Sois SPÉCIFIQUE, cite des exemples tirés des souvenirs.
```

### 4. Agent Détective 🔍
**Modèle**: Opus / GPT-4o / Gemini Pro (intelligent)

**Mission**: Trouver ce qui est caché, surprenant, contradictoire.

**Ce qu'il cherche**:
- Patterns cachés (connexions non évidentes)
- Contradictions entre souvenirs
- Absences surprenantes
- Intensités émotionnelles
- Hypothèses au-delà de l'explicite

---

## Installation

### Depuis les sources

1. Clonez le repository:
```bash
git clone https://github.com/agencekoeki/chatgpt-memory-extractor.git
cd chatgpt-memory-extractor
```

2. Ouvrez Chrome et allez dans `chrome://extensions/`

3. Activez le "Mode développeur" (en haut à droite)

4. Cliquez "Charger l'extension non empaquetée"

5. Sélectionnez le dossier `chatgpt-memory-extractor`

---

## Configuration

### Clés API

1. Cliquez sur l'icône de l'extension
2. Cliquez "Paramètres API"
3. Entrez vos clés API:

| Provider | Où obtenir | Format |
|----------|-----------|--------|
| Anthropic | [console.anthropic.com](https://console.anthropic.com/settings/keys) | `sk-ant-...` |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | `sk-...` |
| Google | [aistudio.google.com](https://aistudio.google.com/app/apikey) | `AIza...` |

4. Cliquez "Tester les clés" pour vérifier

### Préférences

- **Fournisseur préféré**: Lequel utiliser en priorité
- **Modèle labélisation**: Modèle rapide pour la catégorisation
- **Modèle analyse**: Modèle intelligent pour portrait/insights
- **Analyse automatique**: Lancer l'analyse après chaque extraction

---

## Utilisation

### 1. Extraction

1. Allez sur [chatgpt.com](https://chatgpt.com)
2. Cliquez sur l'icône de l'extension
3. Cliquez "Extraire les souvenirs"
4. L'extension navigue automatiquement et extrait tout

### 2. Analyse

1. Après l'extraction, cliquez "Analyser avec l'IA"
2. L'analyse prend 30-60 secondes
3. Coût estimé: ~$0.30 pour 200 souvenirs

### 3. Rapport

1. Cliquez "Voir le rapport"
2. Naviguez entre les sections:
   - **Portrait**: Synthèse narrative
   - **Insights**: Découvertes surprenantes
   - **Statistiques**: Graphiques et fréquences
   - **Souvenirs**: Liste avec labels

---

## Coûts Estimés

| Agent | Modèle | Coût pour 200 souvenirs |
|-------|--------|------------------------|
| Bibliothécaire (×200) | Haiku | ~$0.05 |
| Statisticien | JavaScript | $0.00 |
| Profileur (×1) | Opus | ~$0.15 |
| Détective (×1) | Opus | ~$0.10 |
| **TOTAL** | | **~$0.30** |

---

## Effets Visuels du Dashboard

### Animations CSS Art
- **Ambient glow**: Halos lumineux flottants en arrière-plan (animation `float`)
- **Light trace**: Ligne de scan lumineuse lors des mises à jour (animation `scanDown`)
- **Blur → Reveal**: Sections floutées qui se déflouent progressivement (animation `contentReveal`)
- **Shimmer**: Effet de brillance sur les cartes en chargement
- **Staggered animations**: Apparitions décalées pour chaque élément
- **Glow pulse**: Pulsation lumineuse sur les cartes révélées

### États des agents
- Point pulsant violet = en cours
- Point vert fixe + ✓ = terminé

---

## Historique des Versions

### v4.0 (2024-12-05) - AI Analysis
- Système d'analyse IA avec 4 agents
- Intégration multi-provider (Anthropic, OpenAI, Google)
- Dashboard avec animations de révélation progressive
- Stockage persistant avec IndexedDB
- Service Worker pour fonctionnement en arrière-plan
- Page de configuration des clés API
- Effets CSS art (glow, traces lumineuses, blur)

### v3.12 - Fix Modal Detection
- Cible `data-testid="modal-memories"`
- La modale est un popover, pas un dialog

### v3.11 - Table Extraction
- Détection améliorée de la modale par header
- Extraction directe depuis les lignes de table

### v3.10 - Whitespace Fix
- Cible les divs `.whitespace-pre-wrap`

### v3.8 - v3.9 - Click Simulation
- Simulation de clic avancée pour Radix UI
- Filtrage des overlays
- Détection du viewport

### v3.4 - v3.7 - Navigation Fixes
- Sélecteur `accounts-profile-button`
- Priorité "Personnalisation" dans le menu
- Ouverture automatique de la sidebar

### v3.0 - v3.3 - Diagnostic Mode
- Mode diagnostic avec logs détaillés
- Navigation automatique en 6 étapes

---

## Développement

### Structure du code

#### content.js (Extraction)
Script injecté dans ChatGPT:
- `step1_findUserMenu()` - Trouve le bouton profil
- `step2_findSettings()` - Ouvre le menu et trouve Personnalisation
- `step3_findPersonalization()` - Navigate vers settings si nécessaire
- `step4_findMemorySection()` - Localise la section Mémoire
- `step5_findManageButton()` - Clique sur "Gérer"
- `step6_extractFromModal()` - Extrait les souvenirs
- `simulateClick()` - Simulation avancée pour Radix UI
- `extractFromTable()` - Extraction depuis la table des souvenirs

#### background.js (Service Worker)
Gère la persistance:
- Actions de stockage (`saveMemories`, `getMemories`, etc.)
- Actions d'analyse (`startAnalysis`, `getAnalysisStatus`)
- Communication avec les modules

#### storage.js (IndexedDB)
Stores:
- `memories` - Les souvenirs extraits
- `labels` - Les labels assignés
- `analysis` - Les résultats d'analyse
- `settings` - Clés API et préférences

#### api.js (Client API)
Interface unifiée:
- `callAnthropic(prompt, options)`
- `callOpenAI(prompt, options)`
- `callGoogle(prompt, options)`
- `call(prompt, options)` - Sélection automatique
- `batchCall(prompts, options)` - Appels en batch

#### analysis.js (Pipeline)
Les 4 agents:
- `runLibrarian(memories)` - Labélisation batch
- `runStatistician(labels)` - Agrégation JS
- `runProfiler(memories, labels, stats)` - Portrait via LLM
- `runDetective(memories, labels, stats)` - Insights via LLM

### Déboggage

Console du content script (sur chatgpt.com):
```javascript
// Exécuter une étape manuellement
await step1_findUserMenu()
await step2_findSettings()
diagAllButtons()
```

Console du popup:
- Les logs s'affichent dans la section "Console"

---

## Sécurité

- Les clés API sont stockées localement dans IndexedDB
- Aucune donnée n'est envoyée à nos serveurs
- Les souvenirs restent sur votre machine
- Les appels API vont directement aux providers (Anthropic/OpenAI/Google)

---

## Contribution

1. Fork le repo
2. Créez une branche feature (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Ouvrez une Pull Request

---

## License

MIT - Voir [LICENSE](LICENSE)

---

## Crédits

Développé par [Agence Kōeki](https://koeki.fr)

Construit avec:
- Chrome Extension Manifest V3
- IndexedDB pour le stockage
- APIs: Anthropic Claude, OpenAI GPT, Google Gemini
- CSS art pour les effets visuels
