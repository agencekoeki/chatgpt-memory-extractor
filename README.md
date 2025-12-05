# ChatGPT Memory Extractor

Chrome extension to extract and save all your ChatGPT memories with a single click.

## Features

- **One-click extraction** : Automatic navigation and extraction
- **Clean dark UI** : Professional interface with SVG icons
- **Real-time progress** : Progress bar and memory counter
- **Flexible export** : Save as TXT file or copy to clipboard
- **Debug console** : Detailed logs for troubleshooting

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the project folder

## Usage

1. Open [chatgpt.com](https://chatgpt.com)
2. Click the extension icon
3. Click **"Extraire les souvenirs"**
4. Wait for automatic extraction
5. Save or copy your memories

## Structure du projet

```
chatgpt-memory-extractor/
├── manifest.json    # Configuration de l'extension (Manifest V3)
├── popup.html       # Interface utilisateur de l'extension
├── popup.js         # Logique de l'interface popup
├── content.js       # Script injecté dans ChatGPT pour l'extraction
├── styles.css       # Styles de l'interface
├── icon16.png       # Icône 16x16
├── icon48.png       # Icône 48x48
└── icon128.png      # Icône 128x128
```

## Architecture technique

### manifest.json
- **Manifest V3** (dernière version des extensions Chrome)
- Permissions : `activeTab`, `storage`, `scripting`, `tabs`
- Hôtes autorisés : `chatgpt.com`

### popup.js
Gère l'interface utilisateur :
- Détection de l'état de la page ChatGPT
- Communication avec le content script
- Affichage de la progression en temps réel
- Export des données (TXT / presse-papier)

### content.js
Script injecté dans la page ChatGPT :
- Détection de la section Personnalisation et du bouton "Gérer"
- Ouverture automatique de la modale des souvenirs
- Extraction avec scroll automatique pour récupérer tous les souvenirs
- Filtrage des textes système vs vrais souvenirs
- Communication avec la popup via `chrome.runtime.sendMessage`

## Format d'export

Le fichier TXT généré contient :
```
=================================================
         CHATGPT MEMORY EXPORT
=================================================

Date d'extraction : [date et heure]
Nombre total de souvenirs : [nombre]
=================================================

--- SOUVENIR 1 ---
[contenu du souvenir]

--------------------------------------------------

--- SOUVENIR 2 ---
[contenu du souvenir]

--------------------------------------------------

...

=================================================
Extrait avec ChatGPT Memory Extractor v3.0
=================================================
```

## Compatibilité

- **Navigateur** : Google Chrome (version récente avec support Manifest V3)
- **Site** : chatgpt.com uniquement
- **Langues supportées** : Interface en français, détection FR/EN des éléments ChatGPT

## Dépannage

### Le bouton "Gérer" n'est pas détecté
- Assurez-vous d'être sur la page `chatgpt.com/#settings/Personalization`
- Scrollez pour que la section "Mémoire" soit visible
- Rafraîchissez la page si nécessaire

### L'extraction ne trouve aucun souvenir
- Vérifiez que la modale "Souvenirs enregistrés" s'ouvre bien
- Consultez la console de l'extension pour voir les logs d'erreur
- Assurez-vous d'avoir des souvenirs enregistrés dans ChatGPT

### L'extension ne se charge pas
- Vérifiez que le Mode développeur est activé dans Chrome
- Rechargez l'extension depuis `chrome://extensions/`

## Licence

Ce projet est fourni tel quel pour un usage personnel.

## Version

**v3.1.0** - One-click extraction with automatic navigation and dark UI
