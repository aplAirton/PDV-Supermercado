"use client"

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, X, AlertCircle } from 'lucide-react'

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (code: string) => void
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const scanIntervalRef = useRef<number | null>(null)
  const [zxingLibrary, setZxingLibrary] = useState<any>(null)

  // Verificar suporte do navegador de forma mais específica
  const checkBrowserSupport = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isLocalHost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.hostname.includes('192.168.') ||
                       window.location.protocol === 'http:'

    console.log('Detecção do navegador:', {
      isIOS,
      isSafari, 
      isLocalHost,
      protocol: window.location.protocol,
      hostname: window.location.hostname
    })

    return { isIOS, isSafari, isLocalHost }
  }

  // Verificar permissões da câmera
  const checkCameraPermissions = async () => {
    try {
      if (!navigator.permissions) {
        console.log('API de permissões não disponível (provavelmente Safari)')
        return 'unknown'
      }

      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      console.log('Estado da permissão da câmera:', permission.state)
      return permission.state
    } catch (err) {
      console.log('Não foi possível verificar permissões:', err)
      return 'unknown'
    }
  }

  // Carregar ZXing dinamicamente
  const loadZXing = async (): Promise<any> => {
    try {
      console.log('Carregando biblioteca ZXing...')
      
      // Tentar importar as bibliotecas ZXing
      const [library, browser] = await Promise.all([
        import('@zxing/library'),
        import('@zxing/browser')
      ])

      console.log('ZXing carregado via ES modules')
      return { library, browser }
    } catch (err) {
      console.error('Erro ao carregar ZXing:', err)
      throw new Error('Falha ao carregar biblioteca de códigos de barras')
    }
  }

  // Solicitar permissão da câmera e iniciar
  const requestCameraAccess = async () => {
    try {
      setError("")
      const browserInfo = checkBrowserSupport()
      
      // Verificar suporte do navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera. Tente atualizar para uma versão mais recente.')
      }

      console.log('Solicitando acesso à câmera...')

      // Configurações específicas por navegador
      let constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' }, // Prefere câmera traseira
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      }

      // Safari/iOS: usar configurações mais simples
      if (browserInfo.isSafari || browserInfo.isIOS) {
        console.log('Usando configurações específicas para Safari/iOS')
        constraints = {
          audio: false,
          video: {
            facingMode: 'environment',
            width: { min: 640 },
            height: { min: 480 }
          }
        }
      }

      // Solicitar acesso à câmera
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      console.log('Acesso à câmera obtido com sucesso')
      setStream(mediaStream)
      setPermissionState('granted')
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        try {
          await videoRef.current.play()
          
          // Aguardar um pouco antes de iniciar o scanner
          setTimeout(() => {
            startZXingScanner()
          }, 1000)
        } catch (playError) {
          console.error('Erro ao reproduzir vídeo:', playError)
          setTimeout(async () => {
            try {
              await videoRef.current?.play()
              startZXingScanner()
            } catch (e) {
              throw new Error('Erro ao inicializar vídeo da câmera')
            }
          }, 1000)
        }
      }
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err)
      
      const browserInfo = checkBrowserSupport()
      let errorMessage = 'Não foi possível acessar a câmera.'
      
      if (err.name === 'NotAllowedError') {
        setPermissionState('denied')
        
        if (browserInfo.isLocalHost && window.location.protocol === 'http:') {
          errorMessage = `🔒 Acesso à câmera negado - Problema de segurança

⚠️ Você está acessando via HTTP em rede local, o que pode causar bloqueios de segurança.

📋 Soluções:

🌐 **Opção 1 - HTTPS (Recomendado):**
• Configure um certificado SSL local
• Ou use um túnel HTTPS (ngrok, etc.)

🔧 **Opção 2 - Configurar navegador:**
• Chrome: chrome://flags/#unsafely-treat-insecure-origin-as-secure
• Adicione: ${window.location.origin}
• Reinicie o navegador

📱 **Safari/iOS:**
• Vá em Configurações > Safari > Câmera
• Permita acesso para este site`
        } else if (browserInfo.isSafari || browserInfo.isIOS) {
          errorMessage = `🔒 Acesso à câmera negado no Safari

📋 Para habilitar:

📱 **iPhone/iPad:**
1️⃣ Configurações > Safari > Câmera > Permitir
2️⃣ Configurações > Privacidade > Câmera > Safari

🖥️ **Safari Desktop:**
1️⃣ Safari > Configurações > Sites > Câmera
2️⃣ Permitir para este site
3️⃣ Recarregue a página`
        } else {
          errorMessage = `🔒 Acesso à câmera foi negado

📋 Para habilitar:

1️⃣ Clique no ícone 🔒 ou 🎥 na barra de endereços
2️⃣ Selecione "Sempre permitir" para este site  
3️⃣ Recarregue a página
4️⃣ Tente escanear novamente`
        }
      } else if (err.name === 'NotFoundError') {
        errorMessage = '📷 Nenhuma câmera foi encontrada no dispositivo.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = '⚠️ Câmera está sendo usada por outro aplicativo. Feche outros aplicativos que possam estar usando a câmera.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = '⚙️ Configurações da câmera não suportadas. Tentando configurações mais básicas...'
        setTimeout(() => {
          requestCameraAccessBasic()
        }, 1000)
        return
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    }
  }

  // Fallback com configurações básicas de câmera
  const requestCameraAccessBasic = async () => {
    try {
      console.log('Tentando configurações básicas de câmera...')
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      console.log('Acesso básico à câmera obtido')
      setStream(mediaStream)
      setPermissionState('granted')
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
        
        setTimeout(() => {
          startZXingScanner()
        }, 1500)
      }
    } catch (err: any) {
      console.error('Erro com configurações básicas:', err)
      setError(`❌ Não foi possível acessar a câmera mesmo com configurações básicas.

Erro: ${err.message || err.name || 'Desconhecido'}

💡 Tente:
• Verificar se outras abas/aplicativos estão usando a câmera
• Reiniciar o navegador
• Usar outro navegador (Chrome, Firefox, Safari)`)
    }
  }

  // Iniciar scanner ZXing
  const startZXingScanner = async () => {
    try {
      if (!zxingLibrary) {
        console.log('Carregando ZXing...')
        const zx = await loadZXing()
        setZxingLibrary(zx)
      }

      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Elementos de vídeo ou canvas não disponíveis')
      }

      console.log('Iniciando scanner ZXing...')
      setIsScanning(true)

      // Usar BrowserMultiFormatReader da ZXing
      const { library } = zxingLibrary || await loadZXing()
      const codeReader = new library.BrowserMultiFormatReader()

      // Configurar hints para melhor detecção
      const hints = new Map()
      hints.set(library.DecodeHintType.TRY_HARDER, true)
      hints.set(library.DecodeHintType.POSSIBLE_FORMATS, [
        library.BarcodeFormat.CODE_128,
        library.BarcodeFormat.CODE_39,
        library.BarcodeFormat.EAN_13,
        library.BarcodeFormat.EAN_8,
        library.BarcodeFormat.UPC_A,
        library.BarcodeFormat.UPC_E
      ])

      codeReader.hints = hints

      // Iniciar detecção contínua
      try {
        const result = await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result: any, error: any) => {
          if (result) {
            const code = result.getText()
            console.log('Código detectado com ZXing:', code)
            
            if (code && code.length >= 8) {
              console.log('Código válido aceito:', code)
              
              // Parar scanner
              stopScanner()
              // Chamar callback
              onScan(code)
              // Fechar modal
              onClose()
            }
          }
          
          if (error && !(error instanceof library.NotFoundException)) {
            console.error('Erro no scanner ZXing:', error)
          }
        })
        
        console.log('Scanner ZXing inicializado com sucesso')
        
      } catch (err) {
        console.error('Erro ao iniciar detecção ZXing:', err)
        
        // Fallback para detecção manual com canvas
        startCanvasScanning()
      }

    } catch (err) {
      console.error('Erro ao iniciar scanner ZXing:', err)
      setError('Erro ao inicializar scanner. Use a opção "Digitar Código" como alternativa.')
    }
  }

  // Scanner manual usando canvas como fallback
  const startCanvasScanning = async () => {
    try {
      console.log('Iniciando scanner canvas como fallback...')
      
      const { library } = zxingLibrary || await loadZXing()
      const codeReader = new library.BrowserMultiFormatReader()

      const scanCanvas = () => {
        if (!videoRef.current || !canvasRef.current || !isScanning) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
          scanIntervalRef.current = window.setTimeout(scanCanvas, 100)
          return
        }

        // Ajustar canvas ao tamanho do vídeo
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Desenhar frame atual
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          // Tentar decodificar o frame atual
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          const luminanceSource = new library.RGBLuminanceSource(
            imageData.data, 
            canvas.width, 
            canvas.height
          )
          const binaryBitmap = new library.BinaryBitmap(
            new library.HybridBinarizer(luminanceSource)
          )

          const result = codeReader.decode(binaryBitmap)
          
          if (result) {
            const code = result.getText()
            console.log('Código detectado via canvas:', code)
            
            if (code && code.length >= 8) {
              stopScanner()
              onScan(code)
              onClose()
              return
            }
          }
        } catch (err) {
          // Ignorar erros de decodificação (normais quando não há código)
        }

        // Continuar escaneando
        scanIntervalRef.current = window.setTimeout(scanCanvas, 200)
      }

      scanCanvas()
      
    } catch (err) {
      console.error('Erro no scanner canvas:', err)
      setError('Erro ao inicializar scanner alternativo.')
    }
  }

  // Parar scanner e câmera
  const stopScanner = () => {
    console.log('Parando scanner...')
    
    // Limpar interval de scan
    if (scanIntervalRef.current) {
      clearTimeout(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    // Parar stream da câmera
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
        console.log('Track parado:', track.kind)
      })
      setStream(null)
    }
    
    setIsScanning(false)
  }

  // Efeitos
  useEffect(() => {
    if (isOpen) {
      // Verificar permissões primeiro
      checkCameraPermissions().then((state) => {
        setPermissionState(state as any)
        if (state !== 'denied') {
          requestCameraAccess()
        }
      })
    } else {
      stopScanner()
      setError("")
    }

    return () => {
      stopScanner()
    }
  }, [isOpen])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh' }}>
        <div className="modal-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)'
        }}>
          <h3 className="modal-title" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0,
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            <Camera size={20} />
            Escanear Código de Barras
          </h3>
          <button 
            className="btn btn-sm" 
            onClick={onClose}
            style={{ padding: '4px 8px' }}
            title="Fechar scanner"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1rem' }}>
          {error ? (
            <div className="error-container">
              <div className="error-message" style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                whiteSpace: 'pre-line',
                lineHeight: '1.5'
              }}>
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  {error}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-outline"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                
                {/* Botão específico para configurações do Chrome em rede local */}
                {checkBrowserSupport().isLocalHost && window.location.protocol === 'http:' && (
                  <button 
                    className="btn btn-warning"
                    onClick={() => {
                      const flagsUrl = 'chrome://flags/#unsafely-treat-insecure-origin-as-secure'
                      navigator.clipboard.writeText(window.location.origin).then(() => {
                        alert(`URL copiada: ${window.location.origin}\n\n1. Abra uma nova aba e cole: ${flagsUrl}\n2. Adicione a URL copiada no campo\n3. Reinicie o Chrome`)
                      }).catch(() => {
                        alert(`Abra uma nova aba e acesse:\n${flagsUrl}\n\nAdicione esta URL: ${window.location.origin}\nReinicie o Chrome`)
                      })
                    }}
                    title="Configurar Chrome para permitir câmera em HTTP"
                  >
                    🔧 Config Chrome
                  </button>
                )}
                
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setError("")
                    setPermissionState('unknown')
                    requestCameraAccess()
                  }}
                >
                  Tentar Novamente
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    const code = prompt('Digite o código de barras manualmente:')
                    if (code && code.trim()) {
                      onScan(code.trim())
                      onClose()
                    }
                  }}
                >
                  Digitar Código
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="camera-container" style={{
                position: 'relative',
                background: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '300px',
                    objectFit: 'cover'
                  }}
                  playsInline
                  muted
                  autoPlay
                />
                
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                
                {/* Overlay de guia para o código de barras */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80%',
                  height: '60px',
                  border: '2px solid #10b981',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'center',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                }}>
                  Posicione o código de barras aqui
                </div>

                {/* Indicador de status */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '12px'
                }}>
                  {isScanning 
                    ? '🔍 Escaneando com ZXing...' 
                    : stream 
                    ? '📸 Iniciando scanner...' 
                    : '📱 Acessando câmera...'
                  }
                </div>
              </div>

              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '14px', 
                  marginBottom: '1rem' 
                }}>
                  {isScanning 
                    ? '🔍 Scanner ZXing ativo - Posicione o código de barras na área verde' 
                    : stream 
                    ? '📸 Carregando scanner ZXing...' 
                    : '📱 Solicitando acesso à câmera...'
                  }
                </p>
                
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-outline"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      const code = prompt('Digite o código de barras manualmente:')
                      if (code && code.trim()) {
                        onScan(code.trim())
                        onClose()
                      }
                    }}
                  >
                    Digitar Código
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
