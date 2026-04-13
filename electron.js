const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Set the database path to the user data directory before loading the server.
// This ensures the DB is stored in a persistent, writable location on the
// user's machine (e.g. AppData/Roaming/Control Personal on Windows).
process.env.DB_PATH = path.join(app.getPath('userData'), 'data.db');

// When running from an asar package, native modules are extracted to app.asar.unpacked.
// Point the require resolver there so sqlite3 and bcrypt can find their bindings.
if (process.resourcesPath) {
  const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules');
  process.env.NODE_PATH = unpackedPath;
  require('module').Module._initPaths();
}

// Start the Express server embedded inside the Electron process.
// server.js exports the Express app; we start it here so we control the port.
let server;
let mainWindow;

function startServer() {
  return new Promise((resolve, reject) => {
    // Dynamically require after setting DB_PATH so database.js picks it up.
    const expressApp = require('./server');
    const PORT = 3741; // Internal port, unlikely to clash with user services.

    server = expressApp.listen(PORT, '127.0.0.1', () => {
      console.log(`Internal server running on port ${PORT}`);
      resolve(PORT);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Control Personal',
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  // Open external links in the system browser instead of a new Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    const port = await startServer();
    createWindow(port);
  } catch (err) {
    console.error('Failed to start internal server:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', async () => {
  if (!mainWindow) {
    try {
      const port = await startServer();
      createWindow(port);
    } catch (err) {
      console.error('Failed to restart internal server:', err);
    }
  }
});
