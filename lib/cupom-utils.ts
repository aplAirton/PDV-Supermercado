import crypto from 'crypto'

/**
 * Gera um token único para o cupom
 */
export function generatePublicToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Gera QR Code usando endpoint local da aplicação
 * @param cupomUrl URL completa para o cupom
 * @param size Tamanho do QR code (padrão 200x200)
 */
export async function generateQRCodeDataUrl(cupomUrl: string, size: number = 200): Promise<string> {
  try {
    // Usar endpoint local para gerar QR code
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-qr?text=${encodeURIComponent(cupomUrl)}&size=${size}`)
    
    if (!response.ok) {
      throw new Error(`Erro ao gerar QR Code: ${response.status}`)
    }
    
    const data = await response.json()
    return data.qr_data_url
  } catch (error) {
    console.error('Erro ao gerar QR Code local, tentando fallback:', error)
    
    // Fallback direto usando a biblioteca qrcode
    try {
      const QRCode = require('qrcode')
      const dataUrl = await QRCode.toDataURL(cupomUrl, {
        width: size,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M',
        type: 'image/png'
      })
      return dataUrl
    } catch (directError) {
      console.error('Erro ao gerar QR Code diretamente, usando API externa:', directError)
      // Fallback para API externa se tudo mais falhar
      const encodedUrl = encodeURIComponent(cupomUrl)
      return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}&format=png`
    }
  }
}

/**
 * Constrói a URL pública do cupom
 * @param baseUrl URL base da aplicação (ex: https://seu-dominio.com)
 * @param token Token público do cupom
 */
export function buildCupomPublicUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/cupom/${token}`
}

/**
 * Valida se um token tem formato válido (64 chars hex)
 */
export function isValidToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token)
}
