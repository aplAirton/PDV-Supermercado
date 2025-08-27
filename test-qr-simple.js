const QRCode = require('qrcode')

async function testQRCodeASCII() {
  const testUrl = 'http://localhost:3000/cupom/teste123'
  
  console.log('=== Testando QR Code ASCII ===')
  
  try {
    // Gerar matriz do QR code
    const qrMatrix = await QRCode.create(testUrl, { 
      errorCorrectionLevel: 'L', // Baixo para economizar espaço
      version: undefined // Auto-detect
    })
    
    const modules = qrMatrix.modules
    const size = modules.size
    
    console.log(`Tamanho da matriz: ${size}x${size}`)
    
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
    
    console.log('QR Code ASCII:')
    console.log(asciiArt)
    
    // Simular como ficaria no cupom
    const pad = (s, width, align = 'left') => {
      if (align === 'center') {
        const spaces = width - s.length
        const left = Math.floor(spaces / 2)
        const right = spaces - left
        return ' '.repeat(Math.max(0, left)) + s + ' '.repeat(Math.max(0, right))
      }
      return s.padEnd(width, ' ')
    }
    
    const linha = '========================================\n'
    const linhaThin = '----------------------------------------\n'
    
    let cupom = linha
    cupom += pad('CUPOM DIGITAL', 40, 'center') + '\n'
    cupom += linhaThin
    cupom += pad('Escaneie o QR Code abaixo:', 40, 'center') + '\n'
    cupom += linhaThin
    
    // Inserir QR code ASCII
    const qrLines = asciiArt.split('\n').filter(line => line.length > 0)
    for (const line of qrLines) {
      if (line.trim()) {
        cupom += pad(line, 40, 'center') + '\n'
      }
    }
    
    cupom += linhaThin
    cupom += pad('localhost:3000/cupom/teste123', 40, 'center') + '\n'
    cupom += linha
    
    console.log('\n=== Como ficaria no cupom ===')
    console.log(cupom)
    
  } catch (error) {
    console.error('Erro:', error)
  }
}

testQRCodeASCII()
