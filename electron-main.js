const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');

// Set up logging for auto-updater
const log = require('electron-log');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Define the data directory in the user's app data folder
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'sentry.db');
const dataDir = path.join(userDataPath, 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Set environment variables for the server
process.env.DB_PATH = dbPath;
process.env.PORT = 5001;
process.env.NODE_ENV = 'production';

// Import the server
// We need to make sure the server doesn't crash the app if it fails to start
try {
    const { server } = require('./server/index.js');
} catch (err) {
    console.error('Failed to start server:', err);
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // We might not need this yet, but good practice
        },
        icon: path.join(__dirname, 'assets/icon.png') // We'll need an icon eventually
    });

    // Load the app
    // In production, we load the URL served by the local Express server
    mainWindow.loadURL('http://localhost:5001');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // Check for updates once the window is ready
    mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
    log.info('Update available.');
});
autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.');
});
autoUpdater.on('error', (err) => {
    log.info('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    log.info(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded');
    // Ask user to restart? Or just restart?
    // For now, let's just log it. electron-updater default behavior is to install on quit.
});
