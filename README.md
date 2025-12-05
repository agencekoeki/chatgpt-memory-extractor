# ChatGPT Memory Extractor & Analyzer

Une extension Chrome qui extrait automatiquement vos souvenirs ChatGPT et les analyse avec l'IA pour generer un **Persona Auteur E-E-A-T** credible.

![Version](https://img.shields.io/badge/version-4.4-purple)
![Chrome](https://img.shields.io/badge/Chrome-Extension-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Concept

Cette extension transforme vos souvenirs ChatGPT en un **Masque d'Auteur** utilisable pour generer du contenu E-E-A-T compliant.

**E-E-A-T** = Experience, Expertise, Authoritativeness, Trustworthiness (criteres Google pour le contenu de qualite)

Le resultat: un JSON structure contenant une identite d'auteur fictive mais credible, basee sur VOS vraies competences et experiences.

---

## Fonctionnalites

### Extraction Automatique
- Navigation automatique dans l'interface ChatGPT
- Detection intelligente des elements UI (profile -> settings -> memories)
- Scroll automatique pour capturer tous les souvenirs
- Compatible avec l'interface ChatGPT de decembre 2024

### Pipeline Persona E-E-A-T (4 Agents)
- **Extracteur**: Analyse chaque souvenir selon la taxonomie E-E-A-T
- **Statisticien**: Agregation des donnees et calcul des distributions
- **Architecte**: Construction du masque d'identite auteur
- **Redacteur**: Creation de la charte d'ecriture

### Niveaux de Confidentialite
Chaque souvenir est classifie par niveau de sensibilite:
- 🟢 **Public** - Information partageable (preferences, hobbies generaux)
- 🟡 **Semi-prive** - Personnel mais pas sensible (ville, profession)
- 🟠 **Prive** - Information sensible (relations, finances)
- 🔴 **Tres prive** - Tres sensible (medical, secrets, identifiants)

### Multi-Provider API
- **Anthropic Claude** (Haiku, Sonnet 4.5, Opus 4.5)
- **OpenAI GPT** (4o-mini, 4o, o1-preview)
- **Google Gemini** (Flash, Pro)

### Dashboard de Visualisation
- Design epure avec effets lumineux subtils
- Animations de revelation progressive (blur -> net)
- Sections: Persona, Charte, Statistiques, Extractions
- Export JSON du persona complet

---

## Architecture

```
chatgpt-memory-extractor/
├── manifest.json        # Configuration Chrome Extension v3
├── background.js        # Service Worker (persistance)
├── storage.js           # Module IndexedDB
├── api.js               # Client API unifie (Anthropic/OpenAI/Google)
├── analysis.js          # Pipeline des 4 agents E-E-A-T
├── content.js           # Script injecte dans ChatGPT
├── popup.html/js        # Interface popup de l'extension
├── settings.html/js     # Configuration des cles API
├── report.html/js       # Dashboard de visualisation
└── styles.css           # Styles du popup
```

---

## Les 4 Agents d'Analyse

### 1. Agent Extracteur 🔍
**Modele**: Haiku / GPT-4o-mini / Gemini Flash (rapide, economique)

**Mission**: Extraire les donnees E-E-A-T de chaque souvenir.

**Taxonomie E-E-A-T**:
| Categorie | Tags possibles |
|-----------|---------------|
| **Expertise** | domaine, competence, outil, methodologie, certification, formation |
| **Experience** | projet_realise, annees_pratique, cas_concret, erreur_passee, lecon_apprise |
| **Authority** | role, responsabilite, reconnaissance, publication, enseignement |
| **Trust** | valeur, ethique, limite_avouee, transparence, opinion_honnete |
| **Voice** | ton, registre, expression_favorite, humour, tic_langage |

**Output par souvenir**:
```json
{
  "categories": ["expertise", "experience"],
  "tags": ["seo", "projet_realise"],
  "extracted_fact": "A gere 50+ sites WordPress",
  "persona_value": "Experience concrete en gestion multi-sites",
  "privacy_level": "semi-prive",
  "confidence": 0.85
}
```

### 2. Agent Statisticien 📊
**Modele**: JavaScript pur (pas d'API)

**Mission**: Agreger les extractions pour preparer la construction du persona.

**Calculs**:
- Distribution par categorie E-E-A-T
- Distribution par niveau de confidentialite
- Frequence des tags
- Top domaines d'expertise
- Signaux de confiance
- Patterns de voix

### 3. Agent Architecte 🏗️
**Modele**: Opus / GPT-4o / Gemini Pro (intelligent)

**Mission**: Construire le masque d'identite auteur.

**Structure du Masque**:
```json
{
  "mask": {
    "type": "expert-independant|passionne|professionnel|petit-media|collectif",
    "profile": {
      "firstName": "Prenom",
      "lastName": "Nom",
      "ageRange": "35-45",
      "location": "Region/Ville",
      "background": "Parcours en 3-4 phrases",
      "currentSituation": "Situation actuelle"
    },
    "expertiseLevel": "amateur-eclaire|praticien|expert",
    "expertiseDomains": ["domaine1", "domaine2"],
    "bias": "Opinion/angle defendu",
    "mission": "Pourquoi cette personne partage",
    "limits": ["Ce qu'elle ne pretend pas savoir"],
    "uniqueValue": "Ce qu'elle apporte de different"
  },
  "backstory": {
    "trigger": "Evenement declencheur",
    "experience": "Ce qui a construit l'expertise",
    "motivation": "Pourquoi partager maintenant",
    "vulnerability": "Erreur passee ou limite avouee",
    "fullText": "Backstory complete (150-200 mots)"
  },
  "editorial": {
    "angle": "expert-technique|pedagogue|passionne|pragmatique",
    "tone": {
      "register": "formel|conversationnel|entre-deux",
      "technicality": "technique|accessible|variable",
      "warmth": "distant|neutre|chaleureux",
      "assertiveness": "affirmatif|nuance|prudent"
    },
    "implicitValues": [...],
    "editorialPromise": "Ce que le lecteur trouve ici"
  }
}
```

### 4. Agent Redacteur ✍️
**Modele**: Sonnet / GPT-4o / Gemini Pro

**Mission**: Creer la charte d'ecriture pour que l'IA ecrive "comme" le persona.

**Charte d'Ecriture**:
```json
{
  "allowedPatterns": [
    {"pattern": "Anecdote personnelle en ouverture", "example": "L'autre jour, j'ai..."}
  ],
  "forbiddenPatterns": [
    {"pattern": "Dans cet article nous allons", "reason": "Signal IA evident", "alternative": "Attaquer directement"}
  ],
  "humanSignals": {
    "anecdoteType": "Type d'anecdotes utilisees",
    "opinionStyle": "Comment exprimer ses opinions",
    "hesitations": ["Je ne suis pas certain que...", "Ca depend vraiment de..."]
  },
  "expertSignals": {
    "precisionMarkers": ["Sur mes X projets...", "En Y annees de..."],
    "insiderReferences": ["Ce que les pros ne disent pas..."],
    "nuancePatterns": ["Sauf si...", "Attention cependant..."]
  },
  "vocabulary": {
    "preferred": ["mots naturels"],
    "avoided": ["mots trop IA"],
    "jargon": ["termes techniques maitrises"]
  }
}
```

---

## Installation

### Depuis les sources

1. Clonez le repository:
```bash
git clone https://github.com/agencekoeki/chatgpt-memory-extractor.git
cd chatgpt-memory-extractor
```

2. Ouvrez Chrome et allez dans `chrome://extensions/`

3. Activez le "Mode developpeur" (en haut a droite)

4. Cliquez "Charger l'extension non empaquetee"

5. Selectionnez le dossier `chatgpt-memory-extractor`

---

## Configuration

### Cles API

1. Cliquez sur l'icone de l'extension
2. Cliquez "Parametres API"
3. Entrez vos cles API:

| Provider | Ou obtenir | Format |
|----------|-----------|--------|
| Anthropic | [console.anthropic.com](https://console.anthropic.com/settings/keys) | `sk-ant-...` |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | `sk-...` |
| Google | [aistudio.google.com](https://aistudio.google.com/app/apikey) | `AIza...` |

4. Cliquez "Tester les cles" pour verifier

---

## Utilisation

### 1. Extraction

1. Allez sur [chatgpt.com](https://chatgpt.com)
2. Cliquez sur l'icone de l'extension
3. Cliquez "Extraire les souvenirs"
4. L'extension navigue automatiquement et extrait tout

### 2. Analyse

1. Apres l'extraction, cliquez "Analyser avec l'IA"
2. Le rapport s'ouvre automatiquement avec la progression en direct
3. L'analyse prend 2-5 minutes selon le nombre de souvenirs

### 3. Rapport

Naviguez entre les sections:
- **Persona**: Masque d'identite auteur complet
- **Charte**: Regles d'ecriture (patterns, signaux, vocabulaire)
- **Statistiques**: Distribution E-E-A-T et niveaux de confidentialite
- **Extractions**: Liste des souvenirs avec leurs classifications

### 4. Export

Cliquez "Exporter Persona JSON" pour obtenir le fichier utilisable dans vos prompts.

---

## Couts Estimes

| Agent | Modele | Cout pour 200 souvenirs |
|-------|--------|------------------------|
| Extracteur (x200) | Haiku | ~$0.05 |
| Statisticien | JavaScript | $0.00 |
| Architecte (x1) | Opus | ~$0.20 |
| Redacteur (x1) | Sonnet | ~$0.05 |
| **TOTAL** | | **~$0.30** |

---

## Securite & Confidentialite

- Les cles API sont stockees localement dans IndexedDB
- Aucune donnee n'est envoyee a nos serveurs
- Les souvenirs restent sur votre machine
- Les appels API vont directement aux providers
- La classification "prive/tres-prive" vous aide a identifier les donnees sensibles

---

## Effets Visuels du Dashboard

### Animations CSS Art
- **Ambient glow**: Halos lumineux flottants en arriere-plan
- **Light trace**: Ligne de scan lumineuse lors des mises a jour
- **Blur -> Reveal**: Sections floutees qui se deflouent progressivement
- **Shimmer**: Effet de brillance sur les cartes en chargement
- **Staggered animations**: Apparitions decalees pour chaque element

### Indicateurs d'Agents
- Point pulsant violet = agent en cours
- Point vert fixe = agent termine

---

## Historique des Versions

### v4.4 (2024-12-05) - Privacy Levels
- Ajout des niveaux de confidentialite (public/semi-prive/prive/tres-prive)
- Badges de confidentialite sur chaque extraction
- Barres de distribution dans les statistiques
- Mini-stats de confidentialite dans la sidebar

### v4.3 (2024-12-05) - Persona E-E-A-T Pipeline
- Nouvelle architecture 4 agents pour persona E-E-A-T
- Agent Extracteur avec taxonomie E-E-A-T
- Agent Architecte pour construction du masque
- Agent Redacteur pour charte d'ecriture
- Nouveau design du rapport avec sections Persona/Charte

### v4.2 (2024-12-05) - Model Names Fix
- Correction des noms de modeles (claude-3-5-haiku, sonnet-4.5, opus-4.5)
- Ajout du logging API pour debug

### v4.1 (2024-12-05) - UX Improvements
- Auto-ouverture du rapport lors de l'analyse
- Ouverture directe du rapport (sans passer par background.js)

### v4.0 (2024-12-05) - AI Analysis
- Systeme d'analyse IA avec agents
- Integration multi-provider (Anthropic, OpenAI, Google)
- Dashboard avec animations de revelation progressive
- Stockage persistant avec IndexedDB
- Service Worker pour fonctionnement en arriere-plan
- Page de configuration des cles API
- Effets CSS art (glow, traces lumineuses, blur)

### v3.12 et anterieures
- Corrections de navigation et extraction dans l'interface ChatGPT
- Detection de la modale memoires
- Simulation de clic pour Radix UI

---

## Developpement

### Structure du code

#### content.js (Extraction)
Script injecte dans ChatGPT:
- `step1_findUserMenu()` - Trouve le bouton profil
- `step2_findSettings()` - Ouvre le menu et trouve Personnalisation
- `step3_findPersonalization()` - Navigate vers settings si necessaire
- `step4_findMemorySection()` - Localise la section Memoire
- `step5_findManageButton()` - Clique sur "Gerer"
- `step6_extractFromModal()` - Extrait les souvenirs
- `simulateClick()` - Simulation avancee pour Radix UI
- `extractFromTable()` - Extraction depuis la table des souvenirs

#### background.js (Service Worker)
- Actions de stockage (`saveMemories`, `getMemories`, etc.)
- Actions d'analyse (`startAnalysis`, `getAnalysisStatus`)
- Communication avec les modules

#### storage.js (IndexedDB)
Stores:
- `memories` - Les souvenirs extraits
- `labels` - Les labels assignes
- `analysis` - Les resultats d'analyse (persona, extractions, stats)
- `settings` - Cles API et preferences

#### api.js (Client API)
- `callAnthropic(prompt, options)`
- `callOpenAI(prompt, options)`
- `callGoogle(prompt, options)`
- `call(prompt, options)` - Selection automatique
- `getModelForTask(task, provider)` - Selection du modele selon la tache

#### analysis.js (Pipeline E-E-A-T)
- `runExtractor(memories)` - Extraction E-E-A-T par souvenir
- `runStatistician(extractions)` - Agregation JS
- `runArchitect(memories, extractions, stats)` - Construction du masque
- `runCharterer(memories, extractions, mask)` - Creation de la charte

### Deboggage

Console du content script (sur chatgpt.com):
```javascript
// Executer une etape manuellement
await step1_findUserMenu()
await step2_findSettings()
diagAllButtons()
```

Console du popup:
- Les logs s'affichent dans la section "Console"

Console du background (chrome://extensions -> Service Worker):
- Logs API avec `[API] Calling Anthropic with model: xxx`

---

## Cas d'Usage

### Generation de Contenu E-E-A-T
1. Extrayez vos souvenirs ChatGPT
2. Generez votre persona auteur
3. Exportez le JSON
4. Utilisez-le dans vos prompts pour generer du contenu "comme si" vous l'ecriviez

### Audit de Confidentialite
1. Extrayez vos souvenirs
2. Lancez l'analyse
3. Consultez la section "Statistiques" pour voir la repartition par niveau de confidentialite
4. Identifiez les souvenirs "tres prives" que vous pourriez vouloir supprimer

### Connaissance de Soi
1. Decouvrez comment ChatGPT vous percoit
2. Identifiez vos domaines d'expertise dominants
3. Comprenez vos patterns de communication

---

## Contribution

1. Fork le repo
2. Creez une branche feature (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Ouvrez une Pull Request

---

## License

MIT - Voir [LICENSE](LICENSE)

---

## Credits

Developpe par [Agence Koeki](https://koeki.fr)

Construit avec:
- Chrome Extension Manifest V3
- IndexedDB pour le stockage
- APIs: Anthropic Claude, OpenAI GPT, Google Gemini
- CSS art pour les effets visuels
