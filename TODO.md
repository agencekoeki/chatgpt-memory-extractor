# ChatGPT Memory Extractor - TODO

## En cours

### 1. Rapport "Data Viz" - Frapper les esprits
- [ ] Landing page percutante avec data viz immediate
  - Score d'exposition (jauge visuelle)
  - "X informations sensibles detectees"
  - Archetype en gros + badge choc
  - Compteurs animes (souvenirs, categories, niveaux prives)
- [ ] Biais psychologiques pour engagement:
  - "On parle de TOI" - personnalisation immediate
  - Teaser flou pour creer la curiosite
  - Revelations progressives (blur -> reveal)
  - Comparaison sociale ("plus expose que X% des utilisateurs")
- [ ] Mini-graphiques inline:
  - Radar chart pour le profil psycho
  - Donut chart pour privacy levels
  - Timeline des themes abordes

### 2. Message de confidentialite discret mais clair
- [ ] Ajouter bandeau/badge rassurant:
  - "Vos donnees restent entre vous et l'IA"
  - "Aucune donnee captee par nous"
  - "Analyse 100% locale + API de votre choix"
- [ ] Placer discretement mais visible sur:
  - Landing page (footer)
  - Ecran de consentement
  - Rapport (footer sticky?)

### 3. Mode Analyse MAX (Multi-IA)
- [ ] Ajouter Gemini 2.5 Pro dans api.js
- [ ] Mode "MAX" qui lance analyse parallele:
  - Claude analyse les donnees
  - Gemini 2.5 Pro analyse les memes donnees
  - Comparaison des resultats
- [ ] Arbitrage final par Claude:
  - Points de convergence (haute confiance)
  - Points de divergence (a investiguer)
  - Synthese fusionnee
- [ ] Affichage dans le rapport:
  - Badge "Analyse Multi-IA"
  - Section "Consensus Claude + Gemini"
  - Section "Points de divergence"

## Backlog

### Ameliorations UX
- [ ] Animations de transition entre sections
- [ ] Dark/Light mode toggle
- [ ] Export PDF stylise
- [ ] Partage sur reseaux sociaux (card preview)

### Fonctionnalites
- [ ] Historique des analyses
- [ ] Comparaison avant/apres (evolution du profil)
- [ ] Mode "anonymisation" pour partage safe

### Technique
- [ ] Tests unitaires
- [ ] Gestion erreurs API plus robuste
- [ ] Cache des resultats d'analyse
