import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { senha } = data

    if (!senha) {
      return NextResponse.json(
        { error: 'Senha é obrigatória' },
        { status: 400 }
      )
    }

    // Validar senha gerencial
    const masterKey = process.env.MASTERKEY
    if (!masterKey) {
      console.error('MASTERKEY não configurada no ambiente')
      return NextResponse.json(
        { error: 'Configuração de segurança não encontrada' },
        { status: 500 }
      )
    }

    if (senha === masterKey) {
      return NextResponse.json({ valido: true })
    } else {
      return NextResponse.json(
        { error: 'Senha gerencial incorreta' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Erro ao validar senha gerencial:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}