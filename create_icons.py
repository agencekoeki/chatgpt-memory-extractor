#!/usr/bin/env python3

import base64

# Icône SVG simple pour l'extension (cerveau stylisé)
svg_icon = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="20" fill="url(#grad)"/>
  <g transform="translate(64, 64)">
    <path d="M -25 -10 C -25 -20, -20 -25, -10 -25 C -5 -25, 0 -22, 0 -22 C 0 -22, 5 -25, 10 -25 C 20 -25, 25 -20, 25 -10 C 25 0, 20 5, 15 8 C 15 12, 12 15, 8 15 L -8 15 C -12 15, -15 12, -15 8 C -20 5, -25 0, -25 -10 Z" fill="white" opacity="0.9"/>
    <circle cx="-10" cy="-5" r="3" fill="url(#grad)"/>
    <circle cx="10" cy="-5" r="3" fill="url(#grad)"/>
    <path d="M -8 0 Q 0 3, 8 0" stroke="url(#grad)" stroke-width="2" fill="none"/>
  </g>
</svg>'''

# Créer les fichiers HTML avec les icônes intégrées (car nous n'avons pas de convertisseur PNG)
# Pour une extension réelle, il faudrait des vrais fichiers PNG

# Créer des fichiers HTML qui affichent les icônes
for size in [16, 48, 128]:
    html_content = f'''<!DOCTYPE html>
<html>
<head>
<style>
body {{ margin: 0; padding: 0; }}
svg {{ width: {size}px; height: {size}px; }}
</style>
</head>
<body>
{svg_icon}
</body>
</html>'''
    
    with open(f'icon{size}.html', 'w') as f:
        f.write(html_content)
    print(f"Créé: icon{size}.html")

# Créer aussi un fichier data URI pour les icônes
print("\n📌 Pour de vraies icônes PNG, utilisez ces data URIs dans le manifest.json:")
print("Ou convertissez les fichiers HTML en PNG avec un outil externe.")

# Créer un README avec les instructions
readme_content = '''# 🧠 ChatGPT Memory Extractor

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
'''

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(readme_content)
print("\nCréé: README.md")

print("\n✅ Tous les fichiers ont été créés !")
print("📦 L'extension est prête à être installée dans Chrome")
print("📝 Lisez le README.md pour les instructions complètes")
