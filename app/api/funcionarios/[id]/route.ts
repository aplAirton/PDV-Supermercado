import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await props.params
    const funcionarioId = resolvedParams.id
    
    const query = `
      SELECT 
        id, nome, cpf, rg, telefone, email, endereco,
        cargo, salario, data_admissao, data_demissao,
        ativo, login, created_at, updated_at
      FROM funcionarios
      WHERE id = ?
    `
    
    const funcionarios = await executeQuery(query, [funcionarioId]) as any[]
    
    if (funcionarios.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(funcionarios[0])
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await props.params
    const funcionarioId = resolvedParams.id
    const data = await request.json()
    const { 
      nome, cpf, rg, telefone, email, endereco,
      cargo, salario, data_admissao, login, senha, ativo
    } = data
    
    // Verificar se funcionário existe
    const funcionarioExiste = await executeQuery(
      'SELECT id FROM funcionarios WHERE id = ?', 
      [funcionarioId]
    ) as any[]
    
    if (funcionarioExiste.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se CPF já existe em outro funcionário
    if (cpf) {
      const cpfExiste = await executeQuery(
        'SELECT id FROM funcionarios WHERE cpf = ? AND id != ?', 
        [cpf, funcionarioId]
      ) as any[]
      
      if (cpfExiste.length > 0) {
        return NextResponse.json(
          { error: 'CPF já cadastrado para outro funcionário' },
          { status: 400 }
        )
      }
    }
    
    // Preparar query de update
    let updateQuery = `
      UPDATE funcionarios SET 
        nome = ?, cpf = ?, rg = ?, telefone = ?, email = ?, endereco = ?,
        cargo = ?, salario = ?, data_admissao = ?, ativo = ?, login = ?
    `
    
    let params = [
      nome, cpf, rg || null, telefone || null, email || null, endereco || null,
      cargo, Number(salario) || 0, data_admissao, ativo, login || null
    ]
    
    // Adicionar senha se fornecida
    if (senha && senha.trim()) {
      updateQuery += ', senha_hash = ?'
      params.push(`$2b$10$hash.${senha}.dummy`)
    }
    
    updateQuery += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    params.push(funcionarioId)
    
    await executeQuery(updateQuery, params)
    
    return NextResponse.json({ 
      success: true,
      message: 'Funcionário atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await props.params
    const funcionarioId = resolvedParams.id
    
    // Verificar se funcionário existe
    const funcionarioExiste = await executeQuery(
      'SELECT id, nome FROM funcionarios WHERE id = ?', 
      [funcionarioId]
    ) as any[]
    
    if (funcionarioExiste.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se funcionário tem caixas associados
    const caixasAssociados = await executeQuery(
      'SELECT COUNT(*) as count FROM caixas WHERE funcionario_id = ?',
      [funcionarioId]
    ) as any[]
    
    if (caixasAssociados[0].count > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir funcionário com caixas associados' },
        { status: 400 }
      )
    }
    
    // Soft delete - apenas desativar
    await executeQuery(
      'UPDATE funcionarios SET ativo = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [funcionarioId]
    )
    
    return NextResponse.json({ 
      success: true,
      message: 'Funcionário desativado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir funcionário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
