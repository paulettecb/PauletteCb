const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kynFlotante', {
  overlay: {
    toggle: (next) => ipcRenderer.invoke('overlay:toggle', next),
    get: () => ipcRenderer.invoke('overlay:get'),
    onChange: (callback) => {
      ipcRenderer.on('overlay:state', (_event, value) => callback(value));
    },
  },
});
