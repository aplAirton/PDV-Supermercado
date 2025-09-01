import QRCode from 'qrcode'

/**
 * Gera QR Code em formato ASCII para impressão em cupom de texto
 * @param text Texto para gerar o QR code
 * @param options Opções de configuração
 */
export async function generateQRCodeASCII(text: string, options: { 
  width?: number,
  margin?: number,
  inverse?: boolean 
} = {}): Promise<string> {
  try {
    const { width = 25, margin = 1, inverse = false } = options
    
    // Gerar matriz do QR code
    const qrMatrix = await QRCode.create(text, { 
      errorCorrectionLevel: 'L', // Baixo para economizar espaço
      version: undefined // Auto-detect
    })
    
    const modules = qrMatrix.modules
    const size = modules.size
    const darkModule = inverse ? ' ' : '█'
    const lightModule = inverse ? '█' : ' '
    
    let asciiArt = ''
    
    // Margem superior
    for (let i = 0; i < margin; i++) {
      asciiArt += ' '.repeat(size + margin * 2) + '\n'
    }
    
    // Renderizar cada linha da matriz
    for (let y = 0; y < size; y++) {
      // Margem esquerda
      asciiArt += ' '.repeat(margin)
      
      // Pixels da linha
      for (let x = 0; x < size; x++) {
        const isDark = modules.get(x, y)
        asciiArt += isDark ? darkModule : lightModule
      }
      
      // Margem direita
      asciiArt += ' '.repeat(margin) + '\n'
    }
    
    // Margem inferior
    for (let i = 0; i < margin; i++) {
      asciiArt += ' '.repeat(size + margin * 2) + '\n'
    }
    
    return asciiArt
  } catch (error) {
    console.error('Erro ao gerar QR Code ASCII:', error)
    return `
┌────────────────┐
│  QR CODE ERROR │
│   Scan failed  │
└────────────────┘
`
  }
}

/**
 * Gera QR Code ASCII mais compacto usando caracteres de bloco
 */
export async function generateQRCodeCompactASCII(text: string): Promise<string> {
  try {
    const qrMatrix = await QRCode.create(text, { 
      errorCorrectionLevel: 'L',
      version: undefined
    })
    
    const modules = qrMatrix.modules
    const size = modules.size
    
    let asciiArt = ''
    
    // Usar caracteres de meio bloco para economizar altura
    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x++) {
        const topDark = modules.get(x, y)
        const bottomDark = y + 1 < size ? modules.get(x, y + 1) : false
        
        if (topDark && bottomDark) {
          asciiArt += '█' // Bloco cheio
        } else if (topDark && !bottomDark) {
          asciiArt += '▀' // Meio bloco superior  
        } else if (!topDark && bottomDark) {
          asciiArt += '▄' // Meio bloco inferior
        } else {
          asciiArt += ' ' // Vazio
        }
      }
      asciiArt += '\n'
    }
    
    return asciiArt.trim()
  } catch (error) {
    console.error('Erro ao gerar QR Code ASCII compacto:', error)
    return `┌─────────────────┐
│   QR CODE ERROR  │
│  Scan tela venda │
└─────────────────┘`
  }
}
