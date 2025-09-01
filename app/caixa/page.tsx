'use client'

import { useState, useEffect } from 'react'
import { Calculator, User, DollarSign, Clock, TrendingUp, Plus, Settings, Eye, AlertCircle, CheckCircle, Loader2, ArrowUp, ArrowDown, Filter } from 'lucide-react'
import '../../styles/caixa.css'

// Função toast simples temporária
const toast = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
  const message = description ? `${title}: ${description}` : title
  if (variant === 'destructive') {
    alert(`❌ ${message}`)
  } else {
    alert(`✅ ${message}`)
  }
}

interface Funcionario {
  id: number
  nome: string
  cpf: string
  cargo: string
  login: string
  ativo: boolean
}

interface Caixa {
  id: number
  funcionario_id: number
  funcionario_nome: string
  status: 'aberto' | 'fechado'
  valor_inicial: number
  valor_final?: number
  data_abertura: string
  data_fechamento?: string
  observacoes_abertura?: string
  observacoes_fechamento?: string
  total_vendas: number
  total_dinheiro: number
  total_cartao_debito: number
  total_cartao_credito: number
  total_pix: number
  total_fiado: number
}

export default function CaixaPage() {
  const [loading, setLoading] = useState(true)
  const [caixas, setCaixas] = useState<Caixa[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [showFecharModal, setShowFecharModal] = useState(false)
  const [showVisualizarModal, setShowVisualizarModal] = useState(false)
  const [showResumoModal, setShowResumoModal] = useState(false)
  const [caixaSelecionado, setCaixaSelecionado] = useState<Caixa | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'aberto' | 'fechado'>('todos')
  const [caixaAtual, setCaixaAtual] = useState<{
    id: number
    funcionario_nome: string
    funcionario_cargo: string
    valor_inicial: number
  } | null>(null)
  
  // Estados para abertura em etapas
  const [etapaAbertura, setEtapaAbertura] = useState<'login' | 'fundos'>('login')
  const [loginForm, setLoginForm] = useState({
    cpf: '',
    senha: ''
  })
  
  const [novoForm, setNovoForm] = useState({
    valor_inicial: '',
    observacoes: ''
  })

  const [fecharForm, setFecharForm] = useState({
    senha: '',
    valor_contado_dinheiro: '',
    observacoes: ''
  })

  const [resumoFechamento, setResumoFechamento] = useState<any>(null)

  useEffect(() => {
    verificarStatusCaixa()
    carregarDados()
  }, [])

  const verificarStatusCaixa = async () => {
    try {
      const response = await fetch('/api/caixa/status')
      const data = await response.json()
      
      if (data.caixaAberto) {
        setCaixaAtual(data.caixa)
      }
    } catch (error) {
      console.error('Erro ao verificar status do caixa:', error)
    }
  }

  const fecharCaixa = async () => {
    if (!caixaSelecionado) return
    
    try {
      // Primeiro, validar senha do funcionário
      const validacaoResponse = await fetch('/api/caixa/validar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionario_id: caixaSelecionado.funcionario_id,
          senha: fecharForm.senha
        })
      })

      if (!validacaoResponse.ok) {
        const error = await validacaoResponse.json()
        toast({
          title: "Erro de autenticação",
          description: error.error || "Senha incorreta",
          variant: "destructive"
        })
        return
      }

      // Buscar resumo de lançamentos do caixa
      const resumoResponse = await fetch(`/api/caixa/${caixaSelecionado.id}/resumo`)
      const resumoData = await resumoResponse.json()

      if (!resumoResponse.ok) {
        throw new Error(resumoData.error || 'Erro ao buscar resumo do caixa')
      }

      // Calcular diferença
      const valorContado = parseFloat(fecharForm.valor_contado_dinheiro) || 0
      const valorEsperado = resumoData.valores.esperado
      const diferenca = valorContado - valorEsperado

      // Fechar o caixa com reconciliação
      const response = await fetch(`/api/caixa/${caixaSelecionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'fechado',
          valor_contado_dinheiro: valorContado,
          observacoes_fechamento: fecharForm.observacoes,
          diferenca_caixa: diferenca,
          status_reconciliacao: diferenca === 0 ? 'perfeito' : diferenca > 0 ? 'sobra' : 'falta'
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Preparar dados do resumo
        const resumoCompleto = {
          id: caixaSelecionado.id,
          funcionario_nome: caixaSelecionado.funcionario_nome,
          data_abertura: caixaSelecionado.data_abertura,
          data_fechamento: new Date().toISOString(),
          valores: {
            inicial: caixaSelecionado.valor_inicial,
            vendas: resumoData.valores?.vendas || 0,
            suprimentos: resumoData.valores?.suprimentos || 0,
            sangrias: resumoData.valores?.sangrias || 0,
            esperado: valorEsperado,
            contado: valorContado,
            diferenca: diferenca
          },
          vendas: resumoData.vendas || { total_transacoes: 0, valor_total: 0 },
          status_reconciliacao: diferenca === 0 ? 'perfeito' : diferenca > 0 ? 'sobra' : 'falta'
        }
        
        setResumoFechamento(resumoCompleto)

        toast({
          title: "Caixa fechado com sucesso",
          description: `Caixa ${diferenca === 0 ? 'perfeito' : diferenca > 0 ? `com sobra de R$ ${diferenca.toFixed(2)}` : `com falta de R$ ${Math.abs(diferenca).toFixed(2)}`}`
        })
        
        setShowFecharModal(false)
        setCaixaSelecionado(null)
        setFecharForm({ senha: '', valor_contado_dinheiro: '', observacoes: '' })
        
        // Mostrar o modal de resumo após fechar
        setShowResumoModal(true)
        
        carregarDados()
        verificarStatusCaixa()
      } else {
        toast({
          title: "Erro ao fechar caixa",
          description: result.error || "Não foi possível fechar o caixa",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro ao fechar caixa",
        description: "Não foi possível fechar o caixa",
        variant: "destructive"
      })
    }
  }

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      const [caixasRes, funcionariosRes] = await Promise.all([
        fetch('/api/caixa'),
        fetch('/api/funcionarios')
      ])

      if (caixasRes.ok) {
        const caixasData = await caixasRes.json()
        setCaixas(caixasData)
      }

      if (funcionariosRes.ok) {
        const funcionariosData = await funcionariosRes.json()
        setFuncionarios(funcionariosData.filter((f: Funcionario) => f.ativo))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do caixa",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const abrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (etapaAbertura === 'login') {
      // Validar login
      if (!loginForm.cpf || !loginForm.senha) {
        toast({
          title: "Erro",
          description: "CPF e senha são obrigatórios",
          variant: "destructive"
        })
        return
      }
      
      try {
        // Validar credenciais
        const response = await fetch('/api/funcionarios/validar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cpf: loginForm.cpf,
            senha: loginForm.senha
          })
        })

        if (response.ok) {
          const funcionario = await response.json()
          // Salvar dados do funcionário para uso posterior
          sessionStorage.setItem('funcionario_caixa', JSON.stringify(funcionario))
          setEtapaAbertura('fundos')
          toast({
            title: "Login validado",
            description: `Bem-vindo, ${funcionario.nome}!`
          })
        } else {
          const error = await response.json()
          toast({
            title: "Erro de login",
            description: error.error || "CPF ou senha incorretos",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Erro:', error)
        toast({
          title: "Erro de conexão",
          description: "Não foi possível validar as credenciais",
          variant: "destructive"
        })
      }
    } else if (etapaAbertura === 'fundos') {
      // Abrir caixa com fundos
      try {
        const funcionarioData = JSON.parse(sessionStorage.getItem('funcionario_caixa') || '{}')
        
        const response = await fetch('/api/caixa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            funcionario_id: funcionarioData.id,
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0,
            observacoes_abertura: novoForm.observacoes
          })
        })

        const result = await response.json()

        if (response.ok) {
          toast({
            title: "Caixa aberto com sucesso",
            description: `Caixa aberto para ${funcionarioData.nome} (${funcionarioData.cargo})`
          })
          
          // Atualizar estado do caixa atual
          setCaixaAtual({
            id: result.caixa_id,
            funcionario_nome: funcionarioData.nome,
            funcionario_cargo: funcionarioData.cargo,
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0
          })
          
          setShowNovoModal(false)
          setEtapaAbertura('login')
          setLoginForm({ cpf: '', senha: '' })
          setNovoForm({ valor_inicial: '', observacoes: '' })
          sessionStorage.removeItem('funcionario_caixa')
          carregarDados()
        } else {
          toast({
            title: "Erro ao abrir caixa",
            description: result.error || "Não foi possível abrir o caixa",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Erro:', error)
        toast({
          title: "Erro ao abrir caixa",
          description: "Não foi possível abrir o caixa",
          variant: "destructive"
        })
      }
    }
  }

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const verResumo = async (caixa: Caixa) => {
    try {
      const response = await fetch(`/api/caixa/${caixa.id}/resumo`)
      const resumo = await response.json()
      
      if (response.ok) {
        setResumoFechamento(resumo)
        setShowResumoModal(true)
      } else {
        toast({
          title: "Erro ao carregar resumo",
          description: resumo.error || "Não foi possível carregar o resumo",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao carregar resumo:', error)
      toast({
        title: "Erro ao carregar resumo",
        description: "Não foi possível carregar o resumo",
        variant: "destructive"
      })
    }
  }

  const caixasAbertos = caixas.filter(c => c.status === 'aberto')
  const caixasFiltrados = filtro === 'todos' ? caixas : caixas.filter(c => c.status === filtro)

  if (loading) {
    return (
      <div className="caixa-container">
        <div className="loading-state">
          <Loader2 className="loading-spinner" />
          <p>Carregando dados do caixa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="caixa-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1>Gerenciamento de Caixa</h1>
          <p>Controle de abertura, fechamento e movimentações</p>
        </div>
        
        <div className="header-actions">
          {caixaAtual && (
            <div className="funcionario-info">
              <User size={16} />
              <span>{caixaAtual.funcionario_nome}</span>
              <small>({caixaAtual.funcionario_cargo})</small>
            </div>
          )}
          
          <button
            onClick={() => setShowNovoModal(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            Abrir Caixa
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="totals-grid">
        <div className="total-card">
          <div className="card-icon caixas-abertos">
            <CheckCircle size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Caixas Abertos</span>
            <span className="card-value">{caixasAbertos.length}</span>
          </div>
        </div>

        <div className="total-card">
          <div className="card-icon dinheiro-caixa">
            <Calculator size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Total em Caixas</span>
            <span className="card-value">
              {formatarValor(caixasAbertos.reduce((sum, c) => sum + c.total_vendas, 0))}
            </span>
          </div>
        </div>

        <div className="total-card">
          <div className="card-icon vendas-hoje">
            <User size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Funcionários Ativos</span>
            <span className="card-value">{funcionarios.filter(f => f.ativo).length}</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-panel">
        <div className="filters-grid">
          <div className="filter-group">
            <label>
              <Filter size={18} style={{ marginRight: '8px' }} />
              Filtrar por status:
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setFiltro('todos')}
                className={`btn btn-sm ${filtro === 'todos' ? 'btn-primary' : 'btn-outline'}`}
              >
                Todos ({caixas.length})
              </button>
              <button
                onClick={() => setFiltro('aberto')}
                className={`btn btn-sm ${filtro === 'aberto' ? 'btn-primary' : 'btn-outline'}`}
              >
                Abertos ({caixas.filter(c => c.status === 'aberto').length})
              </button>
              <button
                onClick={() => setFiltro('fechado')}
                className={`btn btn-sm ${filtro === 'fechado' ? 'btn-primary' : 'btn-outline'}`}
              >
                Fechados ({caixas.filter(c => c.status === 'fechado').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Caixas */}
      <div className="caixas-table-container">
        <div className="table-header">
          <h3>Caixas ({caixasFiltrados.length})</h3>
        </div>
        
        <div className="caixas-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Status</th>
                <th>Valor Inicial</th>
                <th>Valor Final</th>
                <th>Total Vendas</th>
                <th>Abertura</th>
                <th>Fechamento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {caixasFiltrados.map((caixa) => (
                <tr key={caixa.id}>
                  <td>
                    <div className="user-info">
                      <User size={16} />
                      {caixa.funcionario_nome}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${caixa.status}`}>
                      {caixa.status === 'aberto' ? 'Aberto' : 'Fechado'}
                    </span>
                  </td>
                  <td className="currency">
                    {formatarValor(caixa.valor_inicial)}
                  </td>
                  <td className="currency">
                    {caixa.valor_final ? formatarValor(caixa.valor_final) : '-'}
                  </td>
                  <td className="currency">
                    {formatarValor(caixa.total_vendas)}
                  </td>
                  <td style={{ fontSize: '13px', color: '#6b7280' }}>
                    {formatarData(caixa.data_abertura)}
                  </td>
                  <td style={{ fontSize: '13px', color: '#6b7280' }}>
                    {caixa.data_fechamento ? formatarData(caixa.data_fechamento) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setCaixaSelecionado(caixa)
                          setShowVisualizarModal(true)
                        }}
                        className="btn btn-sm btn-outline"
                        title="Ver detalhes"
                      >
                        <Eye size={14} />
                      </button>
                      {caixa.status === 'aberto' ? (
                        <button
                          onClick={() => {
                            setCaixaSelecionado(caixa)
                            setShowFecharModal(true)
                          }}
                          className="btn btn-sm btn-outline danger"
                          title="Fechar caixa"
                        >
                          Fechar
                        </button>
                      ) : (
                        <button
                          onClick={() => verResumo(caixa)}
                          className="btn btn-sm btn-outline primary"
                          title="Ver resumo do fechamento"
                        >
                          Resumo
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Caixa */}
      {showNovoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Abrir Novo Caixa</h3>
              <button
                onClick={() => setShowNovoModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={abrirCaixa} style={{ padding: '20px' }}>
              {etapaAbertura === 'login' ? (
                <>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="cpf" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      CPF do Funcionário
                    </label>
                    <input
                      id="cpf"
                      type="text"
                      value={loginForm.cpf}
                      onChange={(e) => setLoginForm({...loginForm, cpf: e.target.value})}
                      required
                      placeholder="000.000.000-00"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="senha" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Senha
                    </label>
                    <input
                      id="senha"
                      type="password"
                      value={loginForm.senha}
                      onChange={(e) => setLoginForm({...loginForm, senha: e.target.value})}
                      required
                      placeholder="Digite a senha"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="valor_inicial" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Valor Inicial
                    </label>
                    <input
                      id="valor_inicial"
                      type="number"
                      step="0.01"
                      min="0"
                      value={novoForm.valor_inicial}
                      onChange={(e) => setNovoForm({...novoForm, valor_inicial: e.target.value})}
                      placeholder="0,00"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label htmlFor="observacoes" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Observações
                    </label>
                    <textarea
                      id="observacoes"
                      value={novoForm.observacoes}
                      onChange={(e) => setNovoForm({...novoForm, observacoes: e.target.value})}
                      placeholder="Observações sobre a abertura..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowNovoModal(false)
                    setEtapaAbertura('login')
                    setLoginForm({ cpf: '', senha: '' })
                    setNovoForm({ valor_inicial: '', observacoes: '' })
                    sessionStorage.removeItem('funcionario_caixa')
                  }} 
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {etapaAbertura === 'login' ? 'Validar Login' : 'Abrir Caixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechar Caixa */}
      {showFecharModal && caixaSelecionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Fechar Caixa</h3>
              <button
                onClick={() => {
                  setShowFecharModal(false)
                  setCaixaSelecionado(null)
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); fecharCaixa(); }}>
              <div className="modal-body">
                <div className="info-section">
                  <p><strong>Funcionário:</strong> {caixaSelecionado.funcionario_nome}</p>
                  <p><strong>Valor Inicial:</strong> {formatarValor(caixaSelecionado.valor_inicial)}</p>
                  <p><strong>Aberto em:</strong> {formatarData(caixaSelecionado.data_abertura)}</p>
                </div>

                <div className="form-group">
                  <label htmlFor="senha_fechamento">Senha do Operador</label>
                  <input
                    id="senha_fechamento"
                    type="password"
                    value={fecharForm.senha}
                    onChange={(e) => setFecharForm({...fecharForm, senha: e.target.value})}
                    placeholder="Digite sua senha"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="valor_contado_dinheiro">Valor Contado em Dinheiro</label>
                  <input
                    id="valor_contado_dinheiro"
                    type="number"
                    step="0.01"
                    min="0"
                    value={fecharForm.valor_contado_dinheiro}
                    onChange={(e) => setFecharForm({...fecharForm, valor_contado_dinheiro: e.target.value})}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="observacoes_fechamento">Observações de Fechamento</label>
                  <textarea
                    id="observacoes_fechamento"
                    value={fecharForm.observacoes}
                    onChange={(e) => setFecharForm({...fecharForm, observacoes: e.target.value})}
                    placeholder="Observações sobre o fechamento..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowFecharModal(false)
                    setCaixaSelecionado(null)
                    setFecharForm({ senha: '', valor_contado_dinheiro: '', observacoes: '' })
                  }} 
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Fechar Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizar Caixa */}
      {showVisualizarModal && caixaSelecionado && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>Detalhes do Caixa</h3>
              <button
                onClick={() => {
                  setShowVisualizarModal(false)
                  setCaixaSelecionado(null)
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="caixa-details">
                <div className="detail-section">
                  <h4>Informações Gerais</h4>
                  <div className="detail-grid">
                    <div><strong>ID:</strong> #{caixaSelecionado.id}</div>
                    <div><strong>Status:</strong> 
                      <span className={`status ${caixaSelecionado.status}`}>
                        {caixaSelecionado.status === 'aberto' ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>
                    <div><strong>Funcionário:</strong> {caixaSelecionado.funcionario_nome}</div>
                    <div><strong>Valor Inicial:</strong> {formatarValor(caixaSelecionado.valor_inicial)}</div>
                    {caixaSelecionado.valor_final && (
                      <div><strong>Valor Final:</strong> {formatarValor(caixaSelecionado.valor_final)}</div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Datas</h4>
                  <div className="detail-grid">
                    <div><strong>Data Abertura:</strong> {formatarData(caixaSelecionado.data_abertura)}</div>
                    {caixaSelecionado.data_fechamento && (
                      <div><strong>Data Fechamento:</strong> {formatarData(caixaSelecionado.data_fechamento)}</div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Resumo de Vendas</h4>
                  <div className="detail-grid">
                    <div><strong>Total de Vendas:</strong> {formatarValor(caixaSelecionado.total_vendas)}</div>
                    <div><strong>Dinheiro:</strong> {formatarValor(caixaSelecionado.total_dinheiro)}</div>
                    <div><strong>Cartão Débito:</strong> {formatarValor(caixaSelecionado.total_cartao_debito)}</div>
                    <div><strong>Cartão Crédito:</strong> {formatarValor(caixaSelecionado.total_cartao_credito)}</div>
                    <div><strong>PIX:</strong> {formatarValor(caixaSelecionado.total_pix)}</div>
                    <div><strong>Fiado:</strong> {formatarValor(caixaSelecionado.total_fiado)}</div>
                  </div>
                </div>

                {caixaSelecionado.observacoes_abertura && (
                  <div className="detail-section">
                    <h4>Observações de Abertura</h4>
                    <p>{caixaSelecionado.observacoes_abertura}</p>
                  </div>
                )}

                {caixaSelecionado.observacoes_fechamento && (
                  <div className="detail-section">
                    <h4>Observações de Fechamento</h4>
                    <p>{caixaSelecionado.observacoes_fechamento}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowVisualizarModal(false)
                  setCaixaSelecionado(null)
                }} 
                className="btn btn-outline"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resumo */}
      {showResumoModal && resumoFechamento && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3>Resumo do Caixa</h3>
              <button
                onClick={() => {
                  setShowResumoModal(false)
                  setResumoFechamento(null)
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div className="resumo-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h4>Caixa #{resumoFechamento.id}</h4>
                <p>
                  <strong>Operador:</strong> {resumoFechamento.operador_abertura}
                </p>
                <p>
                  <strong>Data:</strong> {new Date(resumoFechamento.data_abertura).toLocaleDateString('pt-BR')}
                  {resumoFechamento.data_fechamento && (
                    <> - {new Date(resumoFechamento.data_fechamento).toLocaleDateString('pt-BR')}</>
                  )}
                </p>
              </div>

              <div className="resumo-valores" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <h5>Valores do Caixa</h5>
                  <div><strong>Valor Inicial:</strong> {formatarValor(resumoFechamento.valores.inicial)}</div>
                  <div><strong>Total Vendas:</strong> {formatarValor(resumoFechamento.valores.vendas)}</div>
                  <div><strong>Suprimentos:</strong> {formatarValor(resumoFechamento.valores.suprimentos)}</div>
                  <div><strong>Sangrias:</strong> {formatarValor(resumoFechamento.valores.sangrias)}</div>
                </div>
                <div>
                  <h5>Reconciliação</h5>
                  <div><strong>Valor Esperado:</strong> {formatarValor(resumoFechamento.valores.esperado)}</div>
                  <div><strong>Valor Contado:</strong> {formatarValor(resumoFechamento.valores.contado)}</div>
                  <div style={{ 
                    color: resumoFechamento.valores.diferenca === 0 ? '#22c55e' : 
                           resumoFechamento.valores.diferenca > 0 ? '#3b82f6' : '#ef4444',
                    fontWeight: 'bold'
                  }}>
                    <strong>Diferença:</strong> {formatarValor(Math.abs(resumoFechamento.valores.diferenca))}
                    {resumoFechamento.valores.diferenca > 0 && ' (Sobra)'}
                    {resumoFechamento.valores.diferenca < 0 && ' (Falta)'}
                    {resumoFechamento.valores.diferenca === 0 && ' (Perfeito)'}
                  </div>
                </div>
              </div>

              <div className="resumo-status" style={{ 
                padding: '15px', 
                borderRadius: '8px',
                textAlign: 'center',
                backgroundColor: resumoFechamento.status_reconciliacao === 'perfeito' ? '#f0fdf4' : 
                                resumoFechamento.status_reconciliacao === 'sobra' ? '#eff6ff' : '#fef2f2',
                color: resumoFechamento.status_reconciliacao === 'perfeito' ? '#22c55e' : 
                       resumoFechamento.status_reconciliacao === 'sobra' ? '#3b82f6' : '#ef4444'
              }}>
                <strong>Status: {
                  resumoFechamento.status_reconciliacao === 'perfeito' ? 'CAIXA PERFEITO ✓' :
                  resumoFechamento.status_reconciliacao === 'sobra' ? 'SOBRA NO CAIXA' :
                  'FALTA NO CAIXA'
                }</strong>
              </div>

              <div className="resumo-vendas" style={{ marginTop: '20px' }}>
                <h5>Resumo de Vendas</h5>
                <div><strong>Total de Transações:</strong> {resumoFechamento.vendas.total_transacoes}</div>
                <div><strong>Valor Total:</strong> {formatarValor(resumoFechamento.vendas.valor_total)}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                Imprimir
              </button>
              <button 
                onClick={() => {
                  setShowResumoModal(false)
                  setResumoFechamento(null)
                }} 
                className="btn btn-outline"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
