const { app, BrowserWindow, Menu } = require('electron');
const { join } = require('path');
require('dotenv').config();

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// Messages de démarrage personnalisés
console.log('\n===============================================');
console.log('   🌟 DYING STAR LAUNCHER - ELECTRON PROCESS');
console.log('===============================================');
console.log(`📦 Electron: v${process.versions.electron}`);
console.log(`🟢 Node.js: v${process.versions.node}`);
console.log(`🌐 Chromium: v${process.versions.chrome}`);
console.log(`🖥️ Platform: ${process.platform} (${process.arch})`);
console.log(`⚙️  Mode: ${isDev ? 'Development' : 'Production'}`);
console.log(`🔧 PID: ${process.pid}`);
console.log('===============================================\n');

function createWindow() {
  console.log('🔨 Creating main window...');
  
  // Supprimer complètement la barre de menu
  Menu.setApplicationMenu(null);
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      devTools: isDev
    },
    autoHideMenuBar: true,
    menuBarVisible: false,
    frame: true,
    show: false,
    title: 'Dying Star Launcher'
  });

  const url = isDev 
    ? 'http://localhost:3000'
    : `file://${join(__dirname, '../out/index.html')}`;

  console.log(`🌐 Loading: ${url}`);
  
  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('✅ Window ready and visible');
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
      console.log('🔍 DevTools opened');
    }
    
    console.log('🎮 Dying Star Launcher is ready!\n');
  });

  mainWindow.on('closed', () => {
    console.log('🗂️  Main window closed');
    mainWindow = null;
  });

  // Empêcher l'ouverture de nouvelles fenêtres
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

// Désactiver les avertissements en dev
if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

app.whenReady().then(() => {
  console.log('⚡ Electron app ready - Initializing...');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('📝 All windows closed');
  if (process.platform !== 'darwin') {
    console.log('👋 Quitting application...');
    app.quit();
  }
});

app.on('activate', () => {
  console.log('🔄 App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Messages de fermeture
app.on('before-quit', () => {
  console.log('\n🛑 Shutting down Dying Star Launcher...');
});

process.on('exit', () => {
  console.log('💫 Process terminated - See you next time!\n');
});