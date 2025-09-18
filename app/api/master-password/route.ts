import { type NextRequest, NextResponse } from "next/server"
import { validateMasterPasswordWithTolerance, getMasterPasswordInfo } from "@/lib/master-password"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Senha é obrigatória'
      }, { status: 400 })
    }

    // Validar senha mestra
    const isValid = validateMasterPasswordWithTolerance(password)

    if (isValid) {
      console.log('[MASTER PASSWORD API] Senha mestra validada com sucesso')
      return NextResponse.json({
        success: true,
        message: 'Senha mestra válida',
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('[MASTER PASSWORD API] Senha mestra inválida:', password)
      return NextResponse.json({
        success: false,
        error: 'Senha mestra inválida'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('[MASTER PASSWORD API] Erro ao validar senha:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Endpoint para debug (apenas informações, não a senha)
    const info = getMasterPasswordInfo()
    
    return NextResponse.json({
      success: true,
      info: {
        currentTime: info.currentTime,
        calculation: info.calculation,
        timestamp: info.timestamp,
        note: 'Senha mestra oculta por segurança'
      }
    })
  } catch (error) {
    console.error('[MASTER PASSWORD API] Erro ao obter informações:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}