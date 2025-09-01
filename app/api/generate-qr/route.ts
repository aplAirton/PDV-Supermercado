import { NextResponse } from 'next/server'
import { generateQRCodeSVG, generateQRCodeDataURL } from '@/lib/simple-qr'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const text = url.searchParams.get('text')
    const size = parseInt(url.searchParams.get('size') || '200')
    const format = url.searchParams.get('format') || 'dataurl'
    
    if (!text) {
      return NextResponse.json({ error: 'Parâmetro "text" é obrigatório' }, { status: 400 })
    }
    
    if (format === 'svg') {
      const svg = await generateQRCodeSVG(text, { width: size })
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    } else {
      const dataUrl = await generateQRCodeDataURL(text, { width: size })
      return NextResponse.json({
        qr_data_url: dataUrl,
        text: text,
        size: size
      })
    }
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error)
    return NextResponse.json({ error: 'Erro ao gerar QR Code' }, { status: 500 })
  }
}
