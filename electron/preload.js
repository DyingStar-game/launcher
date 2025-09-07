// electron/preload.js
// Ce fichier peut être utilisé pour exposer des APIs sécurisées au renderer

const { contextBridge } = require('electron');

// Exposer des APIs protégées au renderer si nécessaire
contextBridge.exposeInMainWorld('electronAPI', {
  // Exemple d'API sécurisée
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Supprimer les logs d'erreur du navigateur
window.addEventListener('DOMContentLoaded', () => {
  // Supprimer les erreurs de console non critiques
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    // Ignorer les erreurs d'autofill connues
    if (message.includes('Autofill.enable') || 
        message.includes('Autofill.setAddresses') ||
        message.includes("wasn't found")) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
});