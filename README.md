# ChatGPT Memory Extractor

Extension Chrome permettant d'extraire et sauvegarder tous vos "souvenirs" ChatGPT (les informations personnalisées que ChatGPT a mémorisées sur vous).

## Fonctionnalités

- **Extraction complète** : Récupère tous vos souvenirs avec scroll automatique
- **Guide visuel** : Interface étape par étape pour vous guider
- **Visualisation en temps réel** : Barre de progression et compteur de souvenirs
- **Export flexible** : Sauvegarde en fichier TXT ou copie dans le presse-papier
- **Console de débogage** : Logs détaillés pour le suivi de l'extraction

## Installation

1. Téléchargez ou clonez ce repository
2. Ouvrez Chrome et allez dans `chrome://extensions/`
3. Activez le **Mode développeur** (en haut à droite)
4. Cliquez sur **Charger l'extension non empaquetée**
5. Sélectionnez le dossier du projet

## Utilisation

### Étape 1 : Ouvrir ChatGPT
Naviguez vers [chatgpt.com](https://chatgpt.com)

### Étape 2 : Accéder aux paramètres
Allez dans **Settings** (⚙️) > **Personalization**

### Étape 3 : Section Mémoire
Scrollez jusqu'à voir la section **Mémoire** avec le pourcentage utilisé

### Étape 4 : Lancer l'extraction
- Quand le bouton **"Gérer"** est visible (surligné en vert), cliquez sur l'icône de l'extension
- Cliquez sur **"EXTRAIRE TOUS LES SOUVENIRS"**
- Attendez la fin de l'extraction automatique

### Étape 5 : Sauvegarder
- **Sauvegarder en TXT** : Télécharge un fichier formaté avec tous vos souvenirs
- **Copier tout** : Copie tous les souvenirs dans le presse-papier

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

**v3.0.0** - Extraction complète avec visualisation en temps réel
