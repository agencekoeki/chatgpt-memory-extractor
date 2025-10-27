# 🔬 ChatGPT Memory Debug Assistant

## Version Debug & Exploration

Cette version spéciale de l'extension est conçue pour **comprendre** et **déboguer** l'extraction de mémoire ChatGPT plutôt que de tout faire automatiquement.

## 📥 Installation

1. Téléchargez et décompressez `chatgpt-memory-extractor-debug.zip`
2. Ouvrez Chrome et allez sur `chrome://extensions/`
3. Activez le **Mode développeur** (en haut à droite)
4. Cliquez sur **"Charger l'extension non empaquetée"**
5. Sélectionnez le dossier décompressé

## 🎯 Fonctionnalités Debug

### 4 Onglets Spécialisés :

#### 📋 **Guide** (Onglet principal)
- **Indicateur d'étapes visuelles** : Montre où vous en êtes
- **Analyse en temps réel** : Détecte ce qui est visible sur la page
- **Extraction guidée** : Vous guide étape par étape
- **Messages d'aide contextuels** : Explique quoi faire à chaque étape

#### 🐛 **Debug**
- **Liste des éléments trouvés** : ✅/❌ pour chaque composant
- **Statistiques DOM** : URL, position de scroll, etc.
- **Exploration de la modale** : Analyse détaillée du contenu

#### 🎯 **Capture**
- **Mode capture d'élément** : Survolez et cliquez pour capturer n'importe quel élément
- **Informations détaillées** : Tag, ID, classes, sélecteur CSS
- **Historique des captures** : Gardez trace de tous les éléments analysés

#### 📜 **Logs**
- **Journal en temps réel** : Tout ce qui se passe dans le content script
- **Filtres par niveau** : Info, Success, Warning, Error, Debug
- **Export des logs** : Sauvegardez pour analyse ultérieure

## 🚀 Comment l'utiliser

### Étape 1 : Navigation
1. Ouvrez ChatGPT.com
2. Cliquez sur l'icône de l'extension
3. Dans l'onglet **Guide**, cliquez sur **"🔍 Analyser la page"**
4. L'extension vous dira où vous êtes et quoi faire

### Étape 2 : Aller vers les paramètres
1. Si vous n'êtes pas dans Settings > Personalization :
   - L'extension vous indiquera comment y aller
   - Cliquez sur ⚙️ Settings (en bas à gauche de ChatGPT)
   - Puis sur "Personalization"

### Étape 3 : Trouver la section Mémoire
1. Une fois dans Personalization, **scrollez vers le bas**
2. L'extension détectera automatiquement quand la section "Mémoire" est visible
3. Si nécessaire, cliquez sur **"📜 Scroller vers Mémoire"**

### Étape 4 : Extraction
1. Quand le bouton "Gérer" est détecté (il devient vert dans l'extension)
2. Cliquez sur **"🚀 Extraction guidée"**
3. L'extension va :
   - Cliquer automatiquement sur "Gérer"
   - Attendre l'ouverture de la modale
   - Analyser le contenu
   - Extraire les souvenirs

## 🔍 Mode Debug Avancé

### Si l'extraction échoue :

1. **Allez dans l'onglet Debug** :
   - Vérifiez quels éléments sont détectés (✅) ou non (❌)
   - Notez l'URL exacte et la position de scroll

2. **Utilisez l'onglet Capture** :
   - Cliquez sur "🎯 Démarrer la capture"
   - Survolez le bouton "Gérer" ou les souvenirs
   - Cliquez pour capturer leurs informations
   - Copiez le sélecteur CSS généré

3. **Consultez les Logs** :
   - Activez le filtre "Debug" pour plus de détails
   - Exportez les logs pour analyse
   - Cherchez les messages d'erreur

## 📊 Informations collectées

L'extension collecte et affiche :
- Structure exacte du DOM
- Sélecteurs CSS de chaque élément
- Contenu textuel trouvé
- Chronologie des événements
- Erreurs et avertissements

## 🛠️ Résolution de problèmes

### "Bouton Gérer non trouvé"
- Vérifiez que vous avez bien scrollé jusqu'à voir "92% utilisé"
- Le bouton est généralement à droite de cette indication
- Utilisez le mode Capture pour identifier le bouton manuellement

### "Modale ne s'ouvre pas"
- Attendez quelques secondes après le clic
- Vérifiez dans l'onglet Debug si une modale est détectée
- Rafraîchissez la page et réessayez

### "Aucun souvenir trouvé"
- L'extension passe en mode exploration
- Consultez le contenu brut affiché
- Utilisez ces informations pour ajuster les sélecteurs

## 💡 Conseils

1. **Toujours commencer par une analyse** avant l'extraction
2. **Vérifier l'onglet Debug** pour comprendre ce qui est détecté
3. **Utiliser les logs** pour suivre le déroulement exact
4. **Mode Capture** pour identifier précisément les éléments problématiques
5. **Exporter les logs** si vous avez besoin d'aide

## 📝 Différences avec la version normale

| Version Normale | Version Debug |
|----------------|---------------|
| Extraction automatique | Extraction guidée étape par étape |
| Interface simple | 4 onglets spécialisés |
| Pas de logs | Logs détaillés avec filtres |
| Erreurs basiques | Diagnostic complet |
| Un bouton | Multiple outils d'analyse |

## 🆘 Support

Si l'extraction échoue :
1. Exportez les logs (onglet Logs > "💾 Exporter")
2. Faites des captures d'écran de chaque onglet
3. Notez l'URL exacte et les étapes suivies
4. Ces informations permettront d'améliorer l'extension

## 🔄 Mises à jour

Cette version debug est conçue pour :
- Identifier les changements dans l'interface ChatGPT
- Comprendre pourquoi l'extraction échoue
- Collecter des informations pour améliorer l'algorithme
- Tester de nouvelles stratégies d'extraction

---

**Note** : Cette version est plus complexe mais beaucoup plus informative. Elle est idéale pour comprendre exactement ce qui se passe et pourquoi l'extraction peut échouer.
