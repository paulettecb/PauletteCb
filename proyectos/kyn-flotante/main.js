const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('node:path');

let tray = null;
let mainWindow = null;
let overlayWindow = null;
let overlayVisible = false;

function createMainWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }
  mainWindow = new BrowserWindow({
    width: 760,
    height: 620,
    minWidth: 560,
    minHeight: 440,
    title: 'KYN Flotante',
    backgroundColor: '#FBFAF7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ventana de prueba: transparente, siempre-encima y click-through (los clicks
// pasan a la app de abajo). Valida el mecanismo central antes de enlazar el
// lector real — ver proyectos/kyn-flotante/README.md.
function createOverlayWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().bounds;
  overlayWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.loadFile(path.join(__dirname, 'renderer', 'overlay.html'));
  overlayWindow.on('closed', () => {
    overlayWindow = null;
    overlayVisible = false;
    updateTrayMenu();
  });
}

function setOverlayVisible(next) {
  overlayVisible = next;
  if (overlayVisible) {
    if (!overlayWindow) createOverlayWindow();
    else overlayWindow.show();
  } else if (overlayWindow) {
    overlayWindow.hide();
  }
  updateTrayMenu();
  if (mainWindow) mainWindow.webContents.send('overlay:state', overlayVisible);
}

function updateTrayMenu() {
  const menu = Menu.buildFromTemplate([
    { label: 'Abrir panel KYN Flotante', click: () => createMainWindow() },
    { type: 'separator' },
    {
      label: 'Lector: overlay de prueba',
      type: 'checkbox',
      checked: overlayVisible,
      click: (item) => setOverlayVisible(item.checked),
    },
    { type: 'separator' },
    { label: 'Salir', click: () => app.exit(0) },
  ]);
  tray.setContextMenu(menu);
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  let icon = nativeImage.createFromPath(iconPath);
  if (!icon.isEmpty()) icon = icon.resize({ width: 22, height: 22 });
  tray = new Tray(icon);
  tray.setToolTip('KYN Flotante');
  updateTrayMenu();
}

app.whenReady().then(() => {
  createTray();
  createMainWindow();

  ipcMain.handle('overlay:toggle', (_event, next) => {
    setOverlayVisible(next);
    return overlayVisible;
  });
  ipcMain.handle('overlay:get', () => overlayVisible);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// Vive en la barra de menú: cerrar el panel no debe matar el proceso.
app.on('window-all-closed', () => {});
