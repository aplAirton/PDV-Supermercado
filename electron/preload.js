const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o processo de renderização
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações da aplicação
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Diálogos
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // Eventos do sistema
  onMinimize: (callback) => ipcRenderer.on('window-minimize', callback),
  onMaximize: (callback) => ipcRenderer.on('window-maximize', callback),
  onClose: (callback) => ipcRenderer.on('window-close', callback),

  // Minimizar/maximizar/fechar janela
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // Impressão
  printPage: (options) => ipcRenderer.invoke('print-page', options),

  // Sistema de arquivos
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

  // Banco de dados (se necessário)
  executeQuery: (query, params) => ipcRenderer.invoke('execute-query', query, params),

  // Notificações do sistema
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body })
});

// Expor versões das dependências para debug
contextBridge.exposeInMainWorld('versions', {
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron
});
