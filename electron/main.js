const { app, BrowserWindow, Menu, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const config = require('./config');

// Manter uma referência global do objeto da janela
let mainWindow;

function createWindow() {
  // Usar configurações do arquivo config
  const windowConfig = {
    ...config.window,
    webPreferences: {
      ...config.window.webPreferences,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/placeholder-logo.png'),
    show: false, // Não mostrar até estar pronto
    title: 'PDV Supermercado - Carregando...'
  };

  // Criar a janela do navegador
  mainWindow = new BrowserWindow(windowConfig);

  // Carregar a aplicação Next.js
  const urlsToTry = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://10.0.0.100:3000' // IP da rede local detectado
  ];

  let currentUrlIndex = 0;
  const startUrl = isDev ? urlsToTry[currentUrlIndex] : `file://${path.join(__dirname, '../out/index.html')}`;

  console.log('🔗 Carregando URL:', startUrl);
  console.log('🛠️ Modo desenvolvimento:', isDev);
  console.log('📋 URLs alternativas disponíveis:', urlsToTry);

  const tryLoadUrl = (url, attempt = 1) => {
    console.log(`🔄 Tentativa ${attempt} - Carregando: ${url}`);
    mainWindow.loadURL(url).catch((err) => {
      console.error(`❌ Erro na tentativa ${attempt}:`, err.message);

      // Tentar próxima URL se disponível
      if (isDev && currentUrlIndex < urlsToTry.length - 1) {
        currentUrlIndex++;
        const nextUrl = urlsToTry[currentUrlIndex];
        console.log(`🔄 Tentando próxima URL: ${nextUrl}`);
        setTimeout(() => tryLoadUrl(nextUrl, attempt + 1), 2000);
      } else {
        // Se todas as URLs falharam, tentar novamente a primeira após delay maior
        console.log('🔄 Todas as URLs tentadas. Aguardando e tentando novamente...');
        setTimeout(() => {
          currentUrlIndex = 0;
          tryLoadUrl(urlsToTry[0], attempt + 1);
        }, 5000);
      }
    });
  };

  tryLoadUrl(startUrl);

  // Adicionar listeners para debug
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Página carregada com sucesso!');
    mainWindow.setTitle('PDV Supermercado - Pronto');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Falha ao carregar página:', errorCode, errorDescription, validatedURL);
    mainWindow.setTitle('PDV Supermercado - Erro de Carregamento');

    // A lógica de retry já está na função tryLoadUrl
    // Não precisamos adicionar retry aqui para evitar duplicação
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('📄 DOM pronto!');
  });

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Em desenvolvimento, abrir DevTools
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Emitido quando a janela é fechada
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Interceptar novas janelas e abrir no navegador padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Este método será chamado quando o Electron terminar de inicializar
// e estiver pronto para criar janelas do navegador.
// Algumas APIs só podem ser usadas depois que este evento ocorre.
app.whenReady().then(() => {
  createWindow();

  // No macOS, é comum recriar uma janela no aplicativo quando o ícone da dock é clicado
  // e não há outras janelas abertas.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Sair quando todas as janelas forem fechadas, exceto no macOS.
// No macOS, é comum que os aplicativos e sua barra de menu permaneçam ativos até que o usuário saia explicitamente com Cmd + Q
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Manipuladores IPC para comunicação com o renderer
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('show-message-box', async (event, options) => {
  return await dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  return await dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  return await dialog.showSaveDialog(mainWindow, options);
});

// Menu personalizado usando configurações
let template = config.menu.template;

// Menu para macOS
if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about', label: 'Sobre PDV Supermercado' },
      { type: 'separator' },
      { role: 'services', label: 'Serviços' },
      { type: 'separator' },
      { role: 'hide', label: 'Ocultar' },
      { role: 'hideothers', label: 'Ocultar Outros' },
      { role: 'unhide', label: 'Mostrar Todos' },
      { type: 'separator' },
      { role: 'quit', label: 'Sair' }
    ]
  });
}

// Aplicar menu
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
