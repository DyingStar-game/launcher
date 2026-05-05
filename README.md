# 🌟 Dying Star Launcher

Un lanceur de jeu moderne et élégant construit avec Next.js et Electron.

## 🛠️ Technologies utilisées

- **Next.js 14** - Framework React pour l'interface utilisateur
- **Electron 38** - Framework pour créer des applications desktop
- **React 18** - Bibliothèque JavaScript pour l'UI
- **Node.js** - Environnement d'exécution JavaScript
- **Nodemon** - Rechargement automatique en développement
- **Concurrently** - Exécution simultanée de processus
- **dotenv** - Gestion des variables d'environnement

## 📦 Installation

### Prérequis
- **Node.js** (version 18 ou supérieure)
- **npm** ou **yarn**

### Installation automatique

```bash
# Clonez le repository
git clone https://github.com/DyingStar-game/launcher.git
cd launcher

# Installation complète avec configuration
npm run setup
```

### Installation manuelle

```bash
# 1. Clonez le repository
git clone https://github.com/DyingStar-game/launcher.git
cd launcher

# 2. Installez les dépendances
npm install

# 3. Copiez la configuration d'environnement
cp .env.example .env.local

# 4. Lancez en mode développement
npm run electron-dev
```

## 🎮 Scripts disponibles

### Développement
- `npm run dev` - Lance Next.js en mode développement
- `npm run electron-dev` - 🚀 **Recommandé** - Lance Next.js + Electron (logs propres)
- `npm run electron-dev-verbose` - Lance avec logs détaillés de nodemon
- `npm run electron` - Lance Electron seul

### Production
- `npm run build` - Build l'application Next.js
- `npm run electron-pack` - Build l'application Electron pour la production
- `npm run export` - Export statique Next.js

### Utilitaires
- `npm run clean` - Nettoie les dossiers de build
- `npm run setup` - Installation complète automatique

## ⚙️ Configuration environnement

Le projet utilise des variables d'environnement pour une configuration flexible.

### Fichiers de configuration

- **`.env.example`** - Template avec toutes les variables disponibles
- **`.env.local`** - Configuration locale (ignorée par git)

### Variables principales

```bash
# Mode de développement
NODE_ENV=development

# Configuration Electron
ELECTRON_DISABLE_SECURITY_WARNINGS=true
WINDOW_WIDTH=1200
WINDOW_HEIGHT=800
ENABLE_DEVTOOLS=true

# Configuration Next.js
NEXT_DEV_URL=http://localhost:3000

# Debug
DEBUG_ELECTRON=false
NODEMON_VERBOSE=false
```

### Personnalisation

Modifiez `.env.local` pour adapter le launcher à vos préférences :

```bash
# Fenêtre plus grande
WINDOW_WIDTH=1600
WINDOW_HEIGHT=1000

# Désactiver les DevTools
ENABLE_DEVTOOLS=false

# Activer le debug complet
DEBUG_ELECTRON=true
NODEMON_VERBOSE=true
```

## 📁 Structure du projet

```
dying-star-launcher/
├── electron/           # Fichiers Electron
│   ├── main.js        # Point d'entrée Electron (avec config env)
│   └── preload.js     # Script de préchargement (optionnel)
├── pages/             # Pages Next.js
│   ├── index.js       # Page d'accueil
│   └── _app.js        # App wrapper
├── public/            # Ressources statiques
├── styles/            # Fichiers CSS
├── .env.example       # Template de configuration
├── .env.local         # Configuration locale (à créer)
├── nodemon.json       # Configuration nodemon
├── package.json       # Configuration npm
├── next.config.js     # Configuration Next.js
└── README.md          # Documentation
```

## 🔧 Développement

### Mode développement recommandé

```bash
npm run electron-dev
```

Cette commande lance simultanément :
- 🌐 **Next.js** sur `http://localhost:3000` avec hot-reload
- ⚡ **Electron** avec rechargement automatique via nodemon

### Logs propres

Les logs sont maintenant formatés avec des préfixes colorés :
```
🌐 Next.js | ✓ Ready in 1141ms
⚡ Electron | ✅ Electron window ready
⚡ Electron | [nodemon] restarting due to changes...
```

### Debug avancé

Pour plus de détails pendant le développement :

```bash
# Mode verbose avec tous les logs
npm run electron-dev-verbose

# Ou modifiez .env.local
DEBUG_ELECTRON=true
NODEMON_VERBOSE=true
```

### Build pour production

```bash
# Build complet
npm run preelectron-pack
npm run electron-pack

# Ou séparément
npm run build
npm run electron-pack
```

Les exécutables seront générés dans le dossier `dist/`.

## 🎯 Fonctionnalités

### ✅ Implémenté
- ✅ Interface Next.js moderne
- ✅ Application Electron native
- ✅ Hot-reload en développement
- ✅ Configuration par variables d'environnement
- ✅ Logs propres et colorés
- ✅ Rechargement automatique avec nodemon
- ✅ Build de production
- ✅ Gestion des erreurs

### 🚧 En développement
- 🚧 Interface utilisateur du launcher
- 🚧 Gestion des jeux installés
- 🚧 Système de mise à jour
- 🚧 Thèmes personnalisables

### 📋 Roadmap
- [ ] Intégration Steam/Epic Games
- [ ] Chat intégré
- [ ] Store de mods
- [ ] Système d'achievements
- [ ] Profils utilisateur

## 🛠️ Problèmes courants

### Erreurs Electron

Si vous rencontrez des erreurs `Autofill.enable` :
```bash
# Dans .env.local
ELECTRON_DISABLE_SECURITY_WARNINGS=true
```

### Port déjà utilisé

Si le port 3000 est occupé :
```bash
# Dans .env.local
NEXT_DEV_URL=http://localhost:3001
```

Puis lancez Next.js sur le nouveau port :
```bash
npx next dev -p 3001
```

### Problèmes de performance

Pour optimiser les performances :
```bash
# Dans .env.local
ENABLE_DEVTOOLS=false
DEBUG_ELECTRON=false
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment procéder :

### Setup développeur

```bash
# Fork et clone
git clone https://github.com/VOTRE-USERNAME/launcher.git
cd launcher

# Installation
npm run setup

# Créer une branche
git checkout -b feature/ma-fonctionnalite
```

### Workflow de contribution

1. **Fork** le projet
2. **Créer** une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Standards de code

- Utilisez les variables d'environnement pour la configuration
- Ajoutez des logs avec les préfixes appropriés
- Testez en mode développement ET production
- Documentez les nouvelles variables d'environnement

## 📝 License

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou problème :

- 🐛 **Bugs** : [Ouvrir une issue](https://github.com/DyingStar-game/launcher/issues)
- 💡 **Suggestions** : [Discussions](https://github.com/DyingStar-game/launcher/discussions)
- 📧 **Contact** : Contactez l'équipe de développement

## 🏆 Contributeurs

Merci à tous les contributeurs qui ont participé à ce projet !

---

*Développé avec ❤️ par l'équipe DyingStar*

# README GENERATED BY ELECTRON

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
