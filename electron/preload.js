const { contextBridge } = require('electron');

// Exposer des APIs simples au renderer
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions
});

// Nettoyer les logs de console inutiles
window.addEventListener('DOMContentLoaded', () => {
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    // Ignorer les erreurs Electron communes
    if (message.includes('Autofill') || message.includes("wasn't found")) {
      return;
    }
    originalError.apply(console, args);
  };
});