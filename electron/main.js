const { app, BrowserWindow } = require('electron');
const { join } = require('path');
require('dotenv').config();

const isDev = process.env.NODE_ENV !== 'production';

// Configuration depuis les variables d'environnement
const config = {
  window: {
    width: parseInt(process.env.WINDOW_WIDTH) || 1200,
    height: parseInt(process.env.WINDOW_HEIGHT) || 800,
  },
  dev: {
    url: process.env.NEXT_DEV_URL || 'http://localhost:3000',
    enableDevTools: process.env.ENABLE_DEVTOOLS !== 'false',
    enableLogging: process.env.ELECTRON_ENABLE_LOGGING !== 'false',
    debugElectron: process.env.DEBUG_ELECTRON === 'true'
  }
};

let mainWindow;

// Logger personnalisé
const logger = {
  info: (message) => {
    if (config.dev.enableLogging) {
      console.log(`ℹ️  ${message}`);
    }
  },
  success: (message) => {
    if (config.dev.enableLogging) {
      console.log(`✅ ${message}`);
    }
  },
  error: (message) => {
    if (config.dev.enableLogging) {
      console.error(`❌ ${message}`);
    }
  },
  debug: (message) => {
    if (config.dev.debugElectron) {
      console.log(`🔍 ${message}`);
    }
  }
};

function createWindow() {
  logger.info('Creating Electron window...');
  
  mainWindow = new BrowserWindow({
    width: config.window.width,
    height: config.window.height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      devTools: isDev && config.dev.enableDevTools,
      // Correction pour les erreurs de cache
      experimentalFeatures: false,
      // Préload optionnel
      // preload: join(__dirname, 'preload.js')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    icon: process.platform === 'linux' ? join(__dirname, '../public/icon.png') : undefined
  });

  const url = isDev
    ? config.dev.url
    : `file://${join(__dirname, '../out/index.html')}`;

  logger.info(`Loading URL: ${url}`);
  logger.info(`Window size: ${config.window.width}x${config.window.height}`);

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logger.success('Electron window ready and visible');
    
    if (isDev && config.dev.enableDevTools) {
      mainWindow.webContents.openDevTools();
      logger.info('DevTools opened');
    }
  });

  // Gestion des erreurs
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logger.error(`Failed to load: ${errorDescription} (Code: ${errorCode})`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logger.success('Page loaded successfully');
  });

  // Filtrer les erreurs de console non critiques
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    // Ignorer les erreurs de cache GPU et autres erreurs non critiques
    const ignoredErrors = [
      'disk_cache',
      'cache_util_win.cc',
      'gpu_disk_cache.cc',
      'Gpu Cache Creation failed',
      'Unable to move the cache',
      'Unable to create cache',
      'Autofill.enable',
      'Autofill.setAddresses'
    ];
    
    const shouldIgnore = ignoredErrors.some(error => message.includes(error));
    
    if (isDev && config.dev.debugElectron && level >= 2 && !shouldIgnore) {
      logger.debug(`Console ${level}: ${message}`);
    }
  });

  // Empêcher l'ouverture de nouvelles fenêtres
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    logger.info(`Opening external URL: ${url}`);
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Configuration spécifique pour Windows et développement
if (isDev) {
  // Corriger les erreurs de cache sur Windows
  app.commandLine.appendSwitch('--disable-web-security');
  app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
  app.commandLine.appendSwitch('--disable-gpu-sandbox');
  app.commandLine.appendSwitch('--disable-software-rasterizer');
  app.commandLine.appendSwitch('--disable-gpu');
  app.commandLine.appendSwitch('--no-sandbox');
  
  // Corriger spécifiquement les erreurs de cache disque
  app.commandLine.appendSwitch('--disk-cache-size=0');
  app.commandLine.appendSwitch('--disable-background-timer-throttling');
  app.commandLine.appendSwitch('--disable-renderer-backgrounding');
  app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
  
  logger.info('Development mode switches applied (Windows optimized)');
}

// Désactiver les avertissements de sécurité en développement
if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

// Point d'entrée principal
logger.info('🚀 Starting Electron application...');
logger.info(`📊 Environment: ${isDev ? 'development' : 'production'}`);
logger.info(`🖥️  Platform: ${process.platform}`);
logger.info(`⚙️  Configuration loaded from environment variables`);

app.whenReady().then(() => {
  logger.success('Electron app ready');
  createWindow();

  app.on('activate', () => {
    logger.info('App activated');
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  logger.info('All windows closed');
  if (process.platform !== 'darwin') {
    logger.info('Quitting application');
    app.quit();
  }
});

app.on('before-quit', () => {
  logger.info('👋 Application is shutting down');
});

// Gestion globale des erreurs non gérées
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});