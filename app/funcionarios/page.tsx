'use client'

import { useState, useEffect } from 'react'
import { User, Plus, Edit, Trash2, Eye, Filter, Search, UserCheck, UserX, Loader2, Menu } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import '../../styles/funcionarios.css'

interface Funcionario {
  id: number
  nome: string
  cpf: string
  rg?: string
  telefone?: string
  email?: string
  endereco?: string
  cargo: string
  salario: number
  data_admissao: string
  data_demissao?: string
  ativo: boolean
  login?: string
  senha_hash?: string
  created_at: string
  updated_at: string
}

interface ResumoFuncionarios {
  totalAtivos: number
  totalInativos: number
  totalFolha: number
  mediasSalariais: {
    geral: number
    porCargo: { [cargo: string]: number }
  }
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [resumo, setResumo] = useState<ResumoFuncionarios>({
    totalAtivos: 0,
    totalInativos: 0,
    totalFolha: 0,
    mediasSalariais: { geral: 0, porCargo: {} }
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
  const [editMode, setEditMode] = useState(false)
  
  const [filtros, setFiltros] = useState({
    status: '', // 'ativo' | 'inativo' | ''
    cargo: '',
    busca: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    rg: '',
    telefone: '',
    email: '',
    endereco: '',
    cargo: '',
    salario: '',
    data_admissao: new Date().toISOString().split('T')[0],
    login: '',
    senha: '',
    ativo: true
  })

  const cargosDisponiveis = [
    'Gerente',
    'Operador de Caixa',
    'Vendedor',
    'Estoquista',
    'Supervisor',
    'Auxiliar Administrativo'
  ]

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/funcionarios')
      
      if (response.ok) {
        const data = await response.json()
        setFuncionarios(data)
        calcularResumo(data)
      } else {
        // Fallback para dados de exemplo se a API falhar
        const dadosExemplo: Funcionario[] = [
          {
            id: 1,
            nome: 'Airton Silva',
            cpf: '123.456.789-00',
            rg: '12.345.678-9',
            telefone: '(11) 99999-9999',
            email: 'airton@pdv.com',
            endereco: 'Rua das Flores, 123',
            cargo: 'Gerente',
            salario: 2500.00,
            data_admissao: '2024-01-15',
            ativo: true,
            login: 'airton',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z'
          },
          {
            id: 2,
            nome: 'Maria Santos',
            cpf: '987.654.321-00',
            rg: '98.765.432-1',
            telefone: '(11) 88888-8888',
            email: 'maria@pdv.com',
            endereco: 'Av. Principal, 456',
            cargo: 'Operador de Caixa',
            salario: 1400.00,
            data_admissao: '2024-02-01',
            ativo: true,
            login: 'maria',
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:00:00Z'
          }
        ]
        setFuncionarios(dadosExemplo)
        calcularResumo(dadosExemplo)
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os funcionários. Usando dados de exemplo.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calcularResumo = (data: Funcionario[]) => {
    const totalAtivos = data.filter(f => f.ativo).length
    const totalInativos = data.filter(f => !f.ativo).length
    const totalFolha = data.filter(f => f.ativo).reduce((total, f) => total + f.salario, 0)
    
    const mediaGeral = totalAtivos > 0 ? totalFolha / totalAtivos : 0
    
    // Média salarial por cargo
    const porCargo: { [cargo: string]: number } = {}
    const cargoCount: { [cargo: string]: number } = {}
    
    data.filter(f => f.ativo).forEach(f => {
      if (!porCargo[f.cargo]) {
        porCargo[f.cargo] = 0
        cargoCount[f.cargo] = 0
      }
      porCargo[f.cargo] += f.salario
      cargoCount[f.cargo]++
    })
    
    Object.keys(porCargo).forEach(cargo => {
      porCargo[cargo] = porCargo[cargo] / cargoCount[cargo]
    })

    setResumo({
      totalAtivos,
      totalInativos,
      totalFolha,
      mediasSalariais: { geral: mediaGeral, porCargo }
    })
  }

  const salvarFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editMode && funcionarioSelecionado 
        ? `/api/funcionarios/${funcionarioSelecionado.id}` 
        : '/api/funcionarios'
      
      const method = editMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          salario: parseFloat(form.salario) || 0
        })
      })

      if (response.ok) {
        toast({
          title: editMode ? "Funcionário atualizado" : "Funcionário cadastrado",
          description: `${form.nome} foi ${editMode ? 'atualizado' : 'cadastrado'} com sucesso`,
        })
        setShowModal(false)
        limparForm()
        carregarDados()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar funcionário')
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar funcionário",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const toggleStatus = async (funcionario: Funcionario) => {
    try {
      const response = await fetch(`/api/funcionarios/${funcionario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...funcionario,
          ativo: !funcionario.ativo
        })
      })

      if (response.ok) {
        toast({
          title: `Funcionário ${!funcionario.ativo ? 'ativado' : 'desativado'}`,
          description: `${funcionario.nome} foi ${!funcionario.ativo ? 'ativado' : 'desativado'} com sucesso`,
        })
        carregarDados()
      } else {
        throw new Error('Erro ao alterar status')
      }
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const abrirModalEdicao = (funcionario: Funcionario) => {
    setForm({
      nome: funcionario.nome,
      cpf: funcionario.cpf,
      rg: funcionario.rg || '',
      telefone: funcionario.telefone || '',
      email: funcionario.email || '',
      endereco: funcionario.endereco || '',
      cargo: funcionario.cargo,
      salario: funcionario.salario.toString(),
      data_admissao: funcionario.data_admissao.split('T')[0],
      login: funcionario.login || '',
      senha: '',
      ativo: funcionario.ativo
    })
    setFuncionarioSelecionado(funcionario)
    setEditMode(true)
    setShowModal(true)
  }

  const abrirModalNovo = () => {
    limparForm()
    setEditMode(false)
    setShowModal(true)
  }

  const limparForm = () => {
    setForm({
      nome: '',
      cpf: '',
      rg: '',
      telefone: '',
      email: '',
      endereco: '',
      cargo: '',
      salario: '',
      data_admissao: new Date().toISOString().split('T')[0],
      login: '',
      senha: '',
      ativo: true
    })
    setFuncionarioSelecionado(null)
  }

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0)
  }

  const formatarData = (data: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(data))
  }

  const funcionariosFiltrados = funcionarios.filter(funcionario => {
    if (filtros.status === 'ativo' && !funcionario.ativo) return false
    if (filtros.status === 'inativo' && funcionario.ativo) return false
    if (filtros.cargo && funcionario.cargo !== filtros.cargo) return false
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase()
      return funcionario.nome.toLowerCase().includes(busca) ||
             funcionario.cpf.includes(busca) ||
             funcionario.email?.toLowerCase().includes(busca)
    }
    return true
  })

  if (loading) {
    return (
      <div className="funcionarios-container">
        <div className="loading-state">
          <Loader2 className="loading-spinner" />
          <p>Carregando funcionários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="funcionarios-container">
      {/* Header */}
      <div className="page-header">
        <button 
          className="mobile-menu-btn-header" 
          onClick={() => {
            const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
            if (sidebarElement) {
              const isOpen = sidebarElement.classList.contains('open');
              if (isOpen) {
                sidebarElement.classList.remove('open');
              } else {
                sidebarElement.classList.add('open');
              }
            }
          }}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-info">
          <h1>Gerenciamento de Funcionários</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filtros
          </button>
          <button 
            className="btn btn-primary"
            onClick={abrirModalNovo}
          >
            <Plus size={16} />
            Novo Funcionário
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                className="form-control"
              >
                <option value="">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Cargo</label>
              <select
                value={filtros.cargo}
                onChange={(e) => setFiltros({...filtros, cargo: e.target.value})}
                className="form-control"
              >
                <option value="">Todos os cargos</option>
                {cargosDisponiveis.map(cargo => (
                  <option key={cargo} value={cargo}>{cargo}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Buscar</label>
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  value={filtros.busca}
                  onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                  placeholder="Nome, CPF ou email..."
                  className="form-control"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="totals-grid">
        <div className="total-card">
          <div className="card-icon funcionarios-ativos">
            <UserCheck size={24} />
          </div>
          <div className="card-content">
            <div className="card-label">Funcionários Ativos</div>
            <div className="card-value">{resumo.totalAtivos}</div>
          </div>
        </div>

        <div className="total-card">
          <div className="card-icon folha-salarial">
            <User size={24} />
          </div>
          <div className="card-content">
            <div className="card-label">Folha Salarial</div>
            <div className="card-value">{formatarValor(resumo.totalFolha)}</div>
          </div>
        </div>

        <div className="total-card">
          <div className="card-icon salario-medio">
            <User size={24} />
          </div>
          <div className="card-content">
            <div className="card-label">Salário Médio</div>
            <div className="card-value">{formatarValor(resumo.mediasSalariais.geral)}</div>
          </div>
        </div>
      </div>

      {/* Lista de Funcionários */}
      <div className="funcionarios-table-container">
        <div className="table-header">
          <h3>Lista de Funcionários ({funcionariosFiltrados.length})</h3>
        </div>
        
        {funcionariosFiltrados.length === 0 ? (
          <div className="empty-state">
            <User size={48} className="empty-icon" />
            <h3>Nenhum funcionário encontrado</h3>
            <p>Não há funcionários registrados com os filtros aplicados</p>
          </div>
        ) : (
          <div className="funcionarios-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Cargo</th>
                  <th>Salário</th>
                  <th>Status</th>
                  <th>Admissão</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {funcionariosFiltrados.map((funcionario) => (
                  <tr key={funcionario.id}>
                    <td>
                      <div className="user-info">
                        <User size={16} />
                        <div>
                          <div className="user-name">{funcionario.nome}</div>
                          {funcionario.email && (
                            <div className="user-email">{funcionario.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{funcionario.cpf}</td>
                    <td>
                      <span className="cargo-badge">{funcionario.cargo}</span>
                    </td>
                    <td className="currency">{formatarValor(funcionario.salario)}</td>
                    <td>
                      <span className={`status-badge ${funcionario.ativo ? 'ativo' : 'inativo'}`}>
                        {funcionario.ativo ? (
                          <>
                            <UserCheck size={14} />
                            Ativo
                          </>
                        ) : (
                          <>
                            <UserX size={14} />
                            Inativo
                          </>
                        )}
                      </span>
                    </td>
                    <td>{formatarData(funcionario.data_admissao)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setFuncionarioSelecionado(funcionario)
                            setShowDetalhesModal(true)
                          }}
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => abrirModalEdicao(funcionario)}
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className={`btn btn-outline btn-sm ${funcionario.ativo ? 'danger' : 'success'}`}
                          onClick={() => toggleStatus(funcionario)}
                          title={funcionario.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {funcionario.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={salvarFuncionario}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({...form, nome: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CPF *</label>
                  <input
                    type="text"
                    value={form.cpf}
                    onChange={(e) => setForm({...form, cpf: e.target.value})}
                    placeholder="000.000.000-00"
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>RG</label>
                  <input
                    type="text"
                    value={form.rg}
                    onChange={(e) => setForm({...form, rg: e.target.value})}
                    placeholder="00.000.000-0"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm({...form, telefone: e.target.value})}
                    placeholder="(00) 00000-0000"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Cargo *</label>
                  <select
                    value={form.cargo}
                    onChange={(e) => setForm({...form, cargo: e.target.value})}
                    className="form-control"
                    required
                  >
                    <option value="">Selecione um cargo</option>
                    {cargosDisponiveis.map(cargo => (
                      <option key={cargo} value={cargo}>{cargo}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Salário *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.salario}
                    onChange={(e) => setForm({...form, salario: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data de Admissão *</label>
                  <input
                    type="date"
                    value={form.data_admissao}
                    onChange={(e) => setForm({...form, data_admissao: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Endereço</label>
                  <input
                    type="text"
                    value={form.endereco}
                    onChange={(e) => setForm({...form, endereco: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Login</label>
                  <input
                    type="text"
                    value={form.login}
                    onChange={(e) => setForm({...form, login: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>{editMode ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}</label>
                  <input
                    type="password"
                    value={form.senha}
                    onChange={(e) => setForm({...form, senha: e.target.value})}
                    className="form-control"
                    required={!editMode}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <User size={16} />
                  {editMode ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {showDetalhesModal && funcionarioSelecionado && (
        <div className="modal-overlay" onClick={() => setShowDetalhesModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes - {funcionarioSelecionado.nome}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDetalhesModal(false)}
              >
                ×
              </button>
            </div>
            <div className="funcionario-detalhes">
              <div className="detalhes-grid">
                <div className="detalhe-item">
                  <span className="label">Nome Completo:</span>
                  <span>{funcionarioSelecionado.nome}</span>
                </div>
                <div className="detalhe-item">
                  <span className="label">CPF:</span>
                  <span>{funcionarioSelecionado.cpf}</span>
                </div>
                <div className="detalhe-item">
                  <span className="label">RG:</span>
                  <span>{funcionarioSelecionado.rg || '-'}</span>
                </div>
                <div className="detalhe-item">
                  <span className="label">Telefone:</span>
                  <span>{funcionarioSelecionado.telefone || '-'}</span>
                </div>
                <div className="detalhe-item">
                  <span className="label">Email:</span>
                  <span>{funcionarioSelecionado.email || '-'}</span>
                </div>
                <div className="detalhe-item">
                  <span className="label">Cargo:</span>
                  <span>{funcionarioSelecionado.cargo}</span>
                </div>
                <div className="detalhe-item">
                  <span className="label">Salário:</span>
                  <span>{formatarValor(funcionarioSelecionado.salario)}</span>
                </div>
                <div className="detalhe-item">
                  <span className="label">Data Admissão:</span>
                  <span>{formatarData(funcionarioSelecionado.data_admissao)}</span>
                </div>
                <div className="detalhe-item">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${funcionarioSelecionado.ativo ? 'ativo' : 'inativo'}`}>
                    {funcionarioSelecionado.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="detalhe-item full-width">
                  <span className="label">Endereço:</span>
                  <span>{funcionarioSelecionado.endereco || '-'}</span>
                </div>
                <div className="detalhe-item">
                  <span className="label">Login:</span>
                  <span>{funcionarioSelecionado.login || '-'}</span>
                </div>
                <div className="detalhe-item">
                  <span className="label">Cadastrado em:</span>
                  <span>{formatarData(funcionarioSelecionado.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
