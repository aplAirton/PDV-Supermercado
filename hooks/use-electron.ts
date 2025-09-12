import { useEffect, useState } from 'react';

// Tipos para TypeScript
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  showMessageBox: (options: any) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  showSaveDialog: (options: any) => Promise<any>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  printPage: (options: any) => Promise<any>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  executeQuery: (query: string, params: any[]) => Promise<any>;
  showNotification: (options: { title: string; body: string }) => Promise<void>;
}

// Hook para verificar se estamos rodando no Electron
export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [electronAPI, setElectronAPI] = useState<ElectronAPI | null>(null);

  useEffect(() => {
    // Verificar se estamos no Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      setIsElectron(true);
      setElectronAPI(window.electronAPI as ElectronAPI);
    }
  }, []);

  return { isElectron, electronAPI };
}

// Hook para informações da aplicação
export function useAppInfo() {
  const { isElectron, electronAPI } = useElectron();
  const [appInfo, setAppInfo] = useState({
    version: '1.0.0',
    platform: 'web'
  });

  useEffect(() => {
    if (isElectron && electronAPI) {
      Promise.all([
        electronAPI.getAppVersion(),
        electronAPI.getPlatform()
      ]).then(([version, platform]) => {
        setAppInfo({ version, platform });
      }).catch(console.error);
    }
  }, [isElectron, electronAPI]);

  return appInfo;
}

// Hook para controle da janela
export function useWindowControls() {
  const { isElectron, electronAPI } = useElectron();

  const minimize = () => {
    if (isElectron && electronAPI) {
      electronAPI.minimizeWindow();
    }
  };

  const maximize = () => {
    if (isElectron && electronAPI) {
      electronAPI.maximizeWindow();
    }
  };

  const close = () => {
    if (isElectron && electronAPI) {
      electronAPI.closeWindow();
    }
  };

  return { minimize, maximize, close, isElectron };
}

// Hook para notificações
export function useNotifications() {
  const { isElectron, electronAPI } = useElectron();

  const showNotification = (title: string, body: string) => {
    if (isElectron && electronAPI) {
      electronAPI.showNotification({ title, body });
    } else if ('Notification' in window) {
      new Notification(title, { body });
    }
  };

  return { showNotification };
}

// Hook para impressão
export function usePrint() {
  const { isElectron, electronAPI } = useElectron();

  const printPage = (options = {}) => {
    if (isElectron && electronAPI) {
      return electronAPI.printPage(options);
    } else {
      window.print();
    }
  };

  return { printPage };
}

// Tipos para TypeScript
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    versions?: {
      node: string;
      chrome: string;
      electron: string;
    };
  }
}
