# 🌟 Dying Star Launcher

## 🛠️ Technologies utilisées

- **Next.js** - Framework React pour l'interface utilisateur
- **Electron** - Framework pour créer des applications desktop
- **React** - Bibliothèque JavaScript pour l'UI
- **Node.js** - Environnement d'exécution JavaScript

## 📦 Installation

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. **Clonez le repository**
```bash
git clone https://github.com/DyingStar-game/launcher.git
cd launcher
```

2. **Installez les dépendances**
```bash
npm install
```

3. **Lancez en mode développement**
```bash
npm run electron-dev
```

## 🎮 Scripts disponibles

- `npm run dev` - Lance Next.js en mode développement
- `npm run build` - Build l'application Next.js
- `npm run start` - Lance l'application Next.js en production
- `npm run electron` - Lance Electron seul
- `npm run electron-dev` - Lance Next.js + Electron en mode développement
- `npm run electron-pack` - Build l'application Electron pour la production

## 📁 Structure du projet

```
dying-star-launcher/
├── electron/           # Fichiers Electron
│   └── main.js        # Point d'entrée Electron
├── pages/             # Pages Next.js
│   ├── index.js       # Page d'accueil
│   └── _app.js        # App wrapper
├── public/            # Ressources statiques
├── styles/            # Fichiers CSS
├── package.json       # Configuration npm
├── next.config.js     # Configuration Next.js
└── README.md          # Documentation
```

## 🔧 Développement

### Mode développement
```bash
npm run electron-dev
```
Cette commande lance simultanément :
- Le serveur Next.js sur `http://localhost:3000`
- L'application Electron qui charge automatiquement l'interface

### Build pour production
```bash
npm run preelectron-pack
npm run electron-pack
```

Les exécutables seront générés dans le dossier `dist/`.

## 🎯 Roadmap

- [ ] ...

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrez une [issue](https://github.com/DyingStar-game/launcher/issues)
- Contactez l'équipe de développement