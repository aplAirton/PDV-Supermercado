import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    const query = `
      SELECT 
        id, nome, cpf, rg, telefone, email, endereco,
        cargo, salario, data_admissao, data_demissao,
        ativo, login, created_at, updated_at
      FROM funcionarios
      ORDER BY nome ASC
    `
    
    const funcionarios = await executeQuery(query)
    return NextResponse.json(funcionarios)
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { 
      nome, cpf, rg, telefone, email, endereco,
      cargo, salario, data_admissao, login, senha, ativo = true
    } = data
    
    // Validações básicas
    if (!nome || !cpf || !cargo) {
      return NextResponse.json(
        { error: 'Nome, CPF e cargo são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Gerar login automaticamente se não fornecido
    let loginFinal = login
    if (!loginFinal || loginFinal.trim() === '') {
      // Gerar login baseado no primeiro nome + primeiros dígitos do CPF
      const primeiroNome = nome.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')
      const digitosCpf = cpf.replace(/\D/g, '').slice(0, 4)
      loginFinal = `${primeiroNome}${digitosCpf}`
      
      // Verificar se login já existe e ajustar se necessário
      let contador = 0
      let loginTentativa = loginFinal
      while (contador < 10) {
        const loginExiste = await executeQuery(
          'SELECT id FROM funcionarios WHERE login = ?', 
          [loginTentativa]
        ) as any[]
        
        if (loginExiste.length === 0) {
          loginFinal = loginTentativa
          break
        }
        
        contador++
        loginTentativa = `${loginFinal}${contador}`
      }
    }
    
    // Verificar se CPF já existe
    const cpfExiste = await executeQuery(
      'SELECT id FROM funcionarios WHERE cpf = ?', 
      [cpf]
    ) as any[]
    
    if (cpfExiste.length > 0) {
      return NextResponse.json(
        { error: 'CPF já cadastrado' },
        { status: 400 }
      )
    }
    
    // Hash da senha (simplificado para desenvolvimento)
    const senha_hash = senha ? `$2b$10$hash.${senha}.dummy` : null
    
    const insertQuery = `
      INSERT INTO funcionarios (
        nome, cpf, rg, telefone, email, endereco,
        cargo, salario, data_admissao, ativo, login, senha_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const result = await executeQuery(insertQuery, [
      nome, cpf, rg || null, telefone || null, email || null, endereco || null,
      cargo, Number(salario) || 0, data_admissao, ativo, loginFinal, senha_hash
    ]) as any
    
    return NextResponse.json({ 
      success: true, 
      funcionario_id: result.insertId,
      login: loginFinal,
      message: 'Funcionário cadastrado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao cadastrar funcionário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
