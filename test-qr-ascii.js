const { generateQRCodeCompactASCII, generateQRCodeASCII } = require('./lib/qr-ascii')

async function testQRCodeASCII() {
  const testUrl = 'http://localhost:3000/cupom/teste123'
  
  console.log('=== QR Code ASCII Compacto ===')
  const compact = await generateQRCodeCompactASCII(testUrl)
  console.log(compact)
  
  console.log('\n=== Simulação de Cupom ===')
  const pad = (s, width, align = 'left') => {
    if (align === 'right') return s.padStart(width, ' ')
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
  
  let texto = linha
  texto += pad('CUPOM DIGITAL', 40, 'center') + '\n'
  texto += linhaThin
  texto += pad('Escaneie o QR Code abaixo:', 40, 'center') + '\n'
  texto += linhaThin
  
  // QR code ASCII
  const qrLines = compact.split('\n').filter(line => line.trim().length > 0)
  for (const line of qrLines) {
    if (line.trim()) {
      const paddedLine = line.length > 40 ? line.substring(0, 40) : line
      texto += pad(paddedLine, 40, 'center') + '\n'
    }
  }
  
  texto += linhaThin
  texto += pad('localhost:3000/cupom/teste123', 40, 'center') + '\n'
  texto += linha
  
  console.log(texto)
}

testQRCodeASCII().catch(console.error)
