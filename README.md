# 🧠 ChatGPT Memory Extractor

## Installation

1. **Préparer les icônes** (optionnel)
   - Les fichiers icon16.html, icon48.html et icon128.html sont fournis
   - Pour de vraies icônes PNG, convertissez-les avec un outil comme :
     - Un screenshot tool
     - Un convertisseur SVG vers PNG en ligne
     - Ou utilisez simplement des icônes placeholder

2. **Installer l'extension**
   - Ouvrez Chrome et allez sur `chrome://extensions/`
   - Activez le "Mode développeur" en haut à droite
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier contenant tous les fichiers

3. **Utilisation**
   - Naviguez vers https://chatgpt.com
   - Allez dans Settings → Personalization
   - Cliquez sur l'icône de l'extension dans la barre d'outils
   - Cliquez sur "Extraire la mémoire"
   - L'extension va automatiquement :
     - Cliquer sur le bouton "Gérer"
     - Attendre le chargement
     - Extraire tous les souvenirs
     - Vous permettre de les sauvegarder en TXT

## Fonctionnalités

✅ Extraction automatique de la mémoire ChatGPT
✅ Sauvegarde en fichier TXT
✅ Copie dans le presse-papiers
✅ Interface intuitive
✅ Historique des extractions

## Structure des fichiers

- `manifest.json` - Configuration de l'extension
- `content.js` - Script qui s'exécute sur ChatGPT
- `popup.html` - Interface de l'extension
- `popup.js` - Logique de l'interface
- `styles.css` - Styles de l'interface
- `icon*.html` - Icônes temporaires (à convertir en PNG)

## Notes importantes

⚠️ L'extension nécessite que vous soyez connecté à ChatGPT
⚠️ Vous devez naviguer manuellement vers Settings → Personalization
⚠️ Si l'extraction échoue, rafraîchissez la page et réessayez

## Améliorations possibles

- Extraction automatique périodique
- Export en JSON ou CSV
- Recherche dans les souvenirs
- Catégorisation automatique
- Synchronisation cloud

## Support

Pour toute question ou problème, créez une issue sur GitHub.

---
Créé avec ❤️ pour préserver vos souvenirs ChatGPT
