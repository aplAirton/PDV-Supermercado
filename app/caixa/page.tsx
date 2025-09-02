'use client'

import { useState, useEffect } from 'react'
import { Calculator, User, DollarSign, Clock, TrendingUp, Plus, Settings, AlertCircle, CheckCircle, Loader2, ArrowUp, ArrowDown, Filter, Lock, FileText, Printer } from 'lucide-react'
import '../../styles/caixa.css'

// Função toast limpa - sem alertas de navegador
const toast = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
  // Sistema de toast silencioso - apenas log no console em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const emoji = variant === 'destructive' ? '❌' : '✅'
    const message = description ? `${title}: ${description}` : title
    console.log(`${emoji} ${message}`)
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
  const [showResumoModal, setShowResumoModal] = useState(false)
  const [caixaSelecionado, setCaixaSelecionado] = useState<Caixa | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'aberto' | 'fechado'>('todos')
  const [caixaAtual, setCaixaAtual] = useState<{
    id: number
    funcionario_nome: string
    funcionario_cargo: string
    valor_inicial: number
  } | null>(null)

  // Persistir funcionário validado durante a etapa de abertura (evita perda entre etapas)
  const [funcionarioAbertura, setFuncionarioAbertura] = useState<Funcionario | null>(null)
  
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

        // Fechamento realizado com sucesso - sem toast irritante
        
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
      // Validar login (mais robusto)
      const cpfInput = (loginForm.cpf || '').toString().trim()
      const senhaInput = (loginForm.senha || '').toString().trim()

      // Se não houver dados no formulário, verificar se já existe um funcionário validado no sessionStorage
      const storedFuncionario = sessionStorage.getItem('funcionario_caixa')

      if ((!cpfInput || !senhaInput) && !storedFuncionario) {
        toast({
          title: "Erro",
          description: "CPF e senha são obrigatórios",
          variant: "destructive"
        })
        return
      }

      // Se houver funcionário armazenado, avançar automaticamente para etapa de fundos
      if ((!cpfInput || !senhaInput) && storedFuncionario) {
        try {
          const parsed = JSON.parse(storedFuncionario)
          setFuncionarioAbertura(parsed)
          setEtapaAbertura('fundos')
          return
        } catch (err) {
          // se parsing falhar, prosseguir com validação normal
          console.error('Erro ao ler funcionario armazenado:', err)
        }
      }

      try {
        // Validar credenciais
        const response = await fetch('/api/funcionarios/validar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cpf: cpfInput,
            senha: senhaInput
          })
        })

        if (response.ok) {
          const funcionario = await response.json()
          // Debug: verificar dados recebidos
          console.log('🔐 Login validado:', { funcionario, cpf: cpfInput })
          
          // Salvar dados do funcionário para uso posterior (sessionStorage + estado local)
          sessionStorage.setItem('funcionario_caixa', JSON.stringify(funcionario))
          setFuncionarioAbertura(funcionario)
          setEtapaAbertura('fundos')
          // Toast removido - transição silenciosa
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
        // Preferir o estado local (mais confiável durante fluxo), senão fallback para sessionStorage
        const funcionarioData = funcionarioAbertura || JSON.parse(sessionStorage.getItem('funcionario_caixa') || '{}')
        
        // Debug: verificar estado antes de abrir caixa
        console.log('💰 Tentando abrir caixa:', { 
          funcionarioAbertura: !!funcionarioAbertura,
          sessionStorage: !!sessionStorage.getItem('funcionario_caixa'),
          funcionarioData,
          etapa: etapaAbertura
        })
        
        // Validação robusta: se não temos dados do funcionário, forçar volta para login
        if (!funcionarioData || !funcionarioData.id) {
          console.error('❌ Dados do funcionário perdidos!')
          toast({
            title: "Erro de sessão",
            description: "Sessão expirada. Faça login novamente.",
            variant: "destructive"
          })
          setEtapaAbertura('login')
          setFuncionarioAbertura(null)
          sessionStorage.removeItem('funcionario_caixa')
          return
        }
        
        const response = await fetch('/api/caixa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cpf: loginForm.cpf,
            senha: loginForm.senha,
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0,
            observacoes_abertura: novoForm.observacoes
          })
        })

        const result = await response.json()
        
        // Debug: verificar resposta da API
        console.log('🔥 Resposta da API /api/caixa:', { 
          status: response.status,
          ok: response.ok,
          result,
          requestBody: {
            cpf: loginForm.cpf,
            senha: '***',
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0,
            observacoes_abertura: novoForm.observacoes
          }
        })

        if (response.ok) {
          // Abertura realizada com sucesso - sem toast
          
          // Atualizar estado do caixa atual
          setCaixaAtual({
            id: result.caixa_id,
            funcionario_nome: funcionarioData.nome,
            funcionario_cargo: funcionarioData.cargo,
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0
          })
          
          // Limpar estado e sessionStorage após abrir o caixa
          setShowNovoModal(false)
          setEtapaAbertura('login')
          setLoginForm({ cpf: '', senha: '' })
          setNovoForm({ valor_inicial: '', observacoes: '' })
          setFuncionarioAbertura(null)
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

  const imprimirResumoCaixa = async (caixaId: number) => {
    try {
      const url = `/api/caixa/${caixaId}/resumo/cupom`
      const newWindow = window.open(url, '_blank', 'width=400,height=600')
      
      if (!newWindow) {
        toast({
          title: "Erro ao imprimir",
          description: "Verifique o bloqueador de pop-ups",
          variant: "destructive"
        })
        return
      }

      // Impressão aberta - sem toast de confirmação
    } catch (error) {
      console.error('Erro ao imprimir resumo:', error)
      toast({
        title: "Erro ao imprimir",
        description: "Não foi possível imprimir o resumo",
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
            className="btn btn-primary"
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
                      {caixa.status === 'aberto' ? (
                        <button
                          onClick={() => {
                            setCaixaSelecionado(caixa)
                            setShowFecharModal(true)
                          }}
                          className="btn btn-sm btn-outline danger"
                          title="Fechar caixa"
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            backgroundColor: '#fef2f2',
                            borderColor: '#fecaca',
                            color: '#dc2626'
                          }}
                        >
                          <Lock size={14} />
                          Fechar
                        </button>
                      ) : (
                        <button
                          onClick={() => verResumo(caixa)}
                          className="btn btn-sm btn-outline"
                          title="Ver resumo do fechamento"
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            backgroundColor: '#eff6ff',
                            borderColor: '#bfdbfe',
                            color: '#2563eb',
                            marginRight: '8px'
                          }}
                        >
                          <FileText size={14} />
                          Resumo
                        </button>
                      )}
                      <button
                        onClick={() => imprimirResumoCaixa(caixa.id)}
                        className="btn btn-sm btn-outline"
                        title="Imprimir resumo"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          backgroundColor: '#f0fdf4',
                          borderColor: '#bbf7d0',
                          color: '#16a34a'
                        }}
                      >
                        <Printer size={14} />
                        Imprimir
                      </button>
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
                onClick={() => {
                  setShowNovoModal(false)
                  setEtapaAbertura('login')
                  setLoginForm({ cpf: '', senha: '' })
                  setNovoForm({ valor_inicial: '', observacoes: '' })
                  setFuncionarioAbertura(null)
                  sessionStorage.removeItem('funcionario_caixa')
                }}
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
                    setFuncionarioAbertura(null)
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
                onClick={() => imprimirResumoCaixa(resumoFechamento.id)}
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
