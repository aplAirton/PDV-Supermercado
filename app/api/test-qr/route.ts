import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const text = url.searchParams.get('text') || 'https://exemplo.com'
  
  try {
    // Usar API externa temporariamente para testar
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
    
    return NextResponse.json({
      qr_data_url: qrUrl,
      text_encoded: text,
      status: 'ok'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao gerar QR code' }, { status: 500 })
  }
}
