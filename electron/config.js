// Configurações específicas do Electron
const electronConfig = {
  // Configurações de desenvolvimento
  development: {
    isDev: true,
    devTools: true,
    autoReload: true,
    webSecurity: false,
  },

  // Configurações de produção
  production: {
    isDev: false,
    devTools: false,
    autoReload: false,
    webSecurity: true,
  },

  // Configurações da janela
  window: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'default',
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: `${__dirname}/preload.js`,
    },
  },

  // Configurações de menu
  menu: {
    template: [
      {
        label: 'Arquivo',
        submenu: [
          {
            label: 'Novo',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              // Implementar nova venda
            }
          },
          { type: 'separator' },
          {
            label: 'Sair',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              require('electron').app.quit();
            }
          }
        ]
      },
      {
        label: 'Editar',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      },
      {
        label: 'Visualizar',
        submenu: [
          { role: 'reload' },
          { role: 'forcereload' },
          { role: 'toggledevtools' },
          { type: 'separator' },
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Janela',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      },
      {
        label: 'Ajuda',
        submenu: [
          {
            label: 'Sobre',
            click: () => {
              require('electron').dialog.showMessageBox(null, {
                type: 'info',
                title: 'Sobre PDV Supermercado',
                message: 'Sistema de Ponto de Venda',
                detail: 'Versão 1.0.0\nDesenvolvido com Next.js e Electron'
              });
            }
          }
        ]
      }
    ]
  }
};

module.exports = electronConfig;
