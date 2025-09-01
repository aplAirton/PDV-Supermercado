// Implementação de QR Code usando a biblioteca qrcode
import QRCode from 'qrcode'

interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

// Gerar SVG do QR Code usando a biblioteca qrcode
export async function generateQRCodeSVG(text: string, options: QRCodeOptions = {}): Promise<string> {
  try {
    const { width = 200, margin = 4, color = { dark: '#000000', light: '#FFFFFF' } } = options
    
    // Usar a biblioteca qrcode para gerar SVG
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: width,
      margin: margin,
      color: {
        dark: color.dark,
        light: color.light
      },
      errorCorrectionLevel: 'M'
    })
    
    return svg
  } catch (error) {
    console.error('Erro ao gerar QR Code SVG:', error)
    // Fallback simples em caso de erro
    return `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#FFFFFF"/>
      <text x="100" y="100" text-anchor="middle" font-size="12" fill="#000000">QR Error</text>
    </svg>`
  }
}

// Gerar Data URL
export async function generateQRCodeDataURL(text: string, options: QRCodeOptions = {}): Promise<string> {
  try {
    const { width = 200, margin = 4, color = { dark: '#000000', light: '#FFFFFF' } } = options
    
    // Usar a biblioteca qrcode para gerar data URL diretamente
    const dataUrl = await QRCode.toDataURL(text, {
      width: width,
      margin: margin,
      color: {
        dark: color.dark,
        light: color.light
      },
      errorCorrectionLevel: 'M',
      type: 'image/png'
    })
    
    return dataUrl
  } catch (error) {
    console.error('Erro ao gerar QR Code DataURL:', error)
    // Fallback para SVG base64
    const svg = await generateQRCodeSVG(text, options)
    const base64 = Buffer.from(svg).toString('base64')
    return `data:image/svg+xml;base64,${base64}`
  }
}
