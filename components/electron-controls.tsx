'use client';

import { useAppInfo, useWindowControls, useNotifications } from '@/hooks/use-electron';

export function ElectronControls() {
  const appInfo = useAppInfo();
  const { minimize, maximize, close, isElectron } = useWindowControls();
  const { showNotification } = useNotifications();

  if (!isElectron) {
    return null; // Não mostrar controles se não estiver no Electron
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-800 text-white p-2 flex items-center justify-between z-50">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">PDV Supermercado</span>
        <span className="text-xs text-gray-300">
          v{appInfo.version} - {appInfo.platform}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => showNotification('Teste', 'Esta é uma notificação de teste!')}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
        >
          Notificar
        </button>

        <button
          onClick={minimize}
          className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded"
        >
          Minimizar
        </button>

        <button
          onClick={maximize}
          className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 rounded"
        >
          Maximizar
        </button>

        <button
          onClick={close}
          className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
