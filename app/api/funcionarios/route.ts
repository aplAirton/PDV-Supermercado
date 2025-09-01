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
      cargo, Number(salario) || 0, data_admissao, ativo, login || null, senha_hash
    ]) as any
    
    return NextResponse.json({ 
      success: true, 
      funcionario_id: result.insertId,
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
