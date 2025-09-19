'use client'

import { useState, useEffect } from 'react'
import { User, Plus, Edit, Trash2, Eye, Filter, Search, UserCheck, UserX, Loader2, Menu, X, DollarSign, MapPin, Save, AlertCircle, Shield, OctagonAlert, UserPlus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import MasterPasswordConfirmation from '../../components/master-password-confirmation'
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
  const [showModal, setShowModal] = useState(false)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modalLoading, setModalLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"basico" | "dados" | "acesso">("basico")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'desativar' | 'novo' | null>(null)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [animacaoExecutada, setAnimacaoExecutada] = useState(false)
  const [showValidationCard, setShowValidationCard] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const [messageCard, setMessageCard] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    title: string
    message: string
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  })
  
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

  // Marcar animação como executada após carregamento inicial
  useEffect(() => {
    if (!loading && funcionarios.length > 0 && !animacaoExecutada) {
      const timer = setTimeout(() => {
        setAnimacaoExecutada(true)
      }, 1000) // Tempo suficiente para todas as animações terminarem
      return () => clearTimeout(timer)
    }
  }, [loading, funcionarios.length, animacaoExecutada])

  // Função para mostrar cards de mensagem temporários
  const showMessageCard = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setMessageCard({ show: true, type, title, message })
    // Auto-hide após 2 segundos
    setTimeout(() => {
      setMessageCard(prev => ({ ...prev, show: false }))
    }, 2000)
  }

  // Função para esconder card de mensagem manualmente
  const hideMessageCard = () => {
    setMessageCard(prev => ({ ...prev, show: false }))
  }

  const cargosDisponiveis = [
    'Gerente',
    'Operador de Caixa',
    'Vendedor',
    'Estoquista',
    'Supervisor',
    'Auxiliar Administrativo'
  ]

  // Máscara para CPF (apenas visual)
  const formatarCPFInput = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, "");
    
    // Limita a 11 dígitos
    const limitedDigits = digits.slice(0, 11);
    
    // Aplica a máscara visual
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3)}`;
    } else if (limitedDigits.length <= 9) {
      return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6)}`;
    } else {
      return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6, 9)}-${limitedDigits.slice(9)}`;
    }
  };

  // Handler para CPF com máscara visual
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatarCPFInput(e.target.value);
    setForm({ ...form, cpf: formattedValue });
    // Limpar erros de validação quando usuário começa a editar
    if (showValidationCard) {
      setShowValidationCard(false);
      setValidationErrors([]);
    }
  };

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

  // Componente Card para Funcionario
  const FuncionarioCard = ({
    funcionario,
    onVerDetalhes,
    onEditar,
    onToggleStatus,
    delayIndex = 0,
    animacaoExecutada = false
  }: {
    funcionario: Funcionario
    onVerDetalhes: (funcionario: Funcionario) => void
    onEditar: (funcionario: Funcionario) => void
    onToggleStatus: (funcionario: Funcionario) => void
    delayIndex?: number
    animacaoExecutada?: boolean
  }) => {
    return (
      <div
        className={`funcionario-card ${animacaoExecutada ? '' : 'fade-in'}`}
        style={animacaoExecutada ? {} : { animationDelay: `${delayIndex * 0.1}s` }}
      >
        {/* Cabeçalho do Card */}
        <div className="card-header">
          <div className="funcionario-info">
            <h3 className="funcionario-nome">{funcionario.nome}</h3>
            <div className="status-container">
              <span className={`status-badge ${funcionario.ativo ? 'ativo' : 'inativo'}`}>
                {funcionario.ativo ? (
                  <>
                    <UserCheck size={12} />
                    Ativo
                  </>
                ) : (
                  <>
                    <UserX size={12} />
                    Inativo
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Corpo do Card */}
        <div className="card-body">
          <div className="card-grid">
            <div className="card-item">
              <span className="item-label">
                <User size={14} />
                Cargo
              </span>
              <span className="item-value">
                {funcionario.cargo}
              </span>
            </div>

            <div className="card-item">
              <span className="item-label">
                <DollarSign size={14} />
                Salário
              </span>
              <span className="item-value salario">
                R$ {Number(funcionario.salario).toFixed(2)}
              </span>
            </div>

            <div className="card-item">
              <span className="item-label">
                <MapPin size={14} />
                CPF
              </span>
              <span className="item-value">
                {funcionario.cpf}
              </span>
            </div>

            <div className="card-item">
              <span className="item-label">
                <User size={14} />
                Admissão
              </span>
              <span className="item-value">
                {funcionario.data_admissao ? formatarData(funcionario.data_admissao) : 'Não informado'}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="card-footer-actions">
          <button
            className="btn btn-info btn-sm"
            onClick={() => onVerDetalhes(funcionario)}
            title="Ver detalhes"
          >
            <Eye size={14} />
            <span className="btn-text">Detalhes</span>
          </button>
          <button
            className="btn btn-warning btn-sm"
            onClick={() => onEditar(funcionario)}
            title="Editar funcionário"
          >
            <Edit size={14} />
            <span className="btn-text">Editar</span>
          </button>
          <button
            className={`btn btn-sm ${funcionario.ativo ? 'btn-danger' : 'btn-success'}`}
            onClick={() => onToggleStatus(funcionario)}
            title={funcionario.ativo ? 'Desativar' : 'Ativar'}
          >
            {funcionario.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
            <span className="btn-text">{funcionario.ativo ? 'Desativar' : 'Ativar'}</span>
          </button>
        </div>
      </div>
    )
  }

  const calcularResumo = (data: Funcionario[]) => {
    const totalAtivos = data.filter(f => f.ativo).length
    const totalInativos = data.filter(f => !f.ativo).length
    const totalFolha = data.filter(f => f.ativo).reduce((total, f) => total + f.salario, 0)

    const mediasSalariais: { geral: number; porCargo: { [cargo: string]: number } } = {
      geral: 0,
      porCargo: {}
    }

    // Calcular média geral
    if (totalAtivos > 0) {
      mediasSalariais.geral = totalFolha / totalAtivos
    }

    // Calcular médias por cargo
    const cargoTotals: { [cargo: string]: { total: number; count: number } } = {}

    data.filter(f => f.ativo).forEach(f => {
      if (!cargoTotals[f.cargo]) {
        cargoTotals[f.cargo] = { total: 0, count: 0 }
      }
      cargoTotals[f.cargo].total += f.salario
      cargoTotals[f.cargo].count += 1
    })

    Object.keys(cargoTotals).forEach(cargo => {
      mediasSalariais.porCargo[cargo] = cargoTotals[cargo].total / cargoTotals[cargo].count
    })

    setResumo({
      totalAtivos,
      totalInativos,
      totalFolha,
      mediasSalariais
    })
  }

  const validarFormulario = (): string[] => {
    const errors: string[] = []
    
    if (!form.nome.trim()) {
      errors.push('Nome é obrigatório')
    }
    
    // Validação do CPF (apenas para novos funcionários)
    if (!editMode) {
      const cpfDigits = form.cpf.replace(/\D/g, "")
      if (!cpfDigits) {
        errors.push("CPF é obrigatório")
      } else if (cpfDigits.length !== 11) {
        errors.push("CPF deve ter 11 dígitos")
      } else if (!isValidCPF(cpfDigits)) {
        errors.push("CPF inválido")
      }
    }
    
    if (!form.cargo.trim()) {
      errors.push('Cargo é obrigatório')
    }
    
    // Telefone não é mais obrigatório
    
    // Email não é mais obrigatório, mas se preenchido deve ser válido
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.push('Email deve ter um formato válido')
    }
    
    if (!form.salario.trim()) {
      errors.push('Salário é obrigatório')
    } else if (isNaN(parseFloat(form.salario)) || parseFloat(form.salario) <= 0) {
      errors.push('Salário deve ser um valor válido maior que zero')
    }
    
    if (!form.login.trim()) {
      errors.push('Login é obrigatório')
    }
    
    if (!editMode && !form.senha.trim()) {
      errors.push('Senha é obrigatória para novos funcionários')
    }
    
    return errors
  }

  // Validação simples do CPF (considera apenas dígitos e dígitos verificadores)
  const isValidCPF = (rawCpf: string) => {
    if (!rawCpf) return false
    const cpf = rawCpf.replace(/\D/g, "")
    if (cpf.length !== 11) return false

    // CPFs aceitos de forma excepcional
    const cpfsExcepcionais = [
      "11111111111", "22222222222", "33333333333", "44444444444",
      "55555555555", "66666666666", "77777777777", "88888888888",
      "99999999999", "12345678910"
    ]

    // Se for um CPF excepcional, aceitar
    if (cpfsExcepcionais.includes(cpf)) return true

    // rejeita CPFs com todos os dígitos iguais (exceto os excepcionais já tratados)
    if (/^(\d)\1{10}$/.test(cpf)) return false

    const calc = (t: number) => {
      let s = 0
      for (let i = 0; i < t - 1; i++) s += Number(cpf.charAt(i)) * (t - i)
      const r = 11 - (s % 11)
      return r > 9 ? 0 : r
    }

    return calc(10) === Number(cpf.charAt(9)) && calc(11) === Number(cpf.charAt(10))
  }

  const salvarFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)

    // Executar validação completa
    const errors = validarFormulario()
    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowValidationCard(true)
      setModalLoading(false)
      return
    }

    // Limpar erros anteriores
    setValidationErrors([])
    setShowValidationCard(false)

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
        carregarDados()
        fecharModal()
        limparForm()
        setModalLoading(false)
        showMessageCard('success', editMode ? 'Funcionário atualizado' : 'Funcionário cadastrado', editMode ? 'As informações do funcionário foram atualizadas com sucesso!' : 'Novo funcionário cadastrado com sucesso!')
      } else {
        const errBody = await response.json().catch(() => null)
        let message = errBody && errBody.error ? String(errBody.error) : `Erro ao ${editMode ? 'atualizar' : 'cadastrar'} funcionário`
        
        // Mostrar erro dentro do modal
        setValidationErrors([message])
        setShowValidationCard(true)
        setModalLoading(false)
        return
      }
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error)
      setModalLoading(false)
      showMessageCard('error', 'Erro de conexão', `Não foi possível ${editMode ? 'atualizar' : 'cadastrar'} o funcionário. Verifique sua conexão e tente novamente.`)
    }
  }

  const toggleStatus = (funcionario: Funcionario) => {
    setFuncionarioSelecionado(funcionario)
    setConfirmAction('desativar')
    setShowConfirmModal(true)
  }

  // Função para executar a ação confirmada
  const executarAcaoConfirmada = async () => {
    if (!confirmAction) return

    setConfirmLoading(true)
    setShowConfirmModal(false)
    setShowLoadingModal(true)

    try {
      if (confirmAction === 'desativar' && funcionarioSelecionado) {
        setLoadingMessage('Alterando status do funcionário...')

        const response = await fetch(`/api/funcionarios/${funcionarioSelecionado.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...funcionarioSelecionado,
            ativo: !funcionarioSelecionado.ativo
          })
        })

        if (response.ok) {
          await carregarDados()
          showMessageCard('success', `Funcionário ${!funcionarioSelecionado.ativo ? 'ativado' : 'desativado'}`, `${funcionarioSelecionado.nome} foi ${!funcionarioSelecionado.ativo ? 'ativado' : 'desativado'} com sucesso`)
        } else {
          const errBody = await response.json().catch(() => null)
          let message = errBody && errBody.error ? String(errBody.error) : 'Erro ao alterar status'
          showMessageCard('error', 'Erro ao alterar status', message)
        }
      } else if (confirmAction === 'novo') {
        setLoadingMessage('Abrindo formulário de novo funcionário...')

        // Simular delay para mostrar o loading
        await new Promise(resolve => setTimeout(resolve, 500))

        // Abrir modal do formulário
        limparForm()
        setEditMode(false)
        setActiveTab('basico')
        setShowValidationCard(false)
        setValidationErrors([])
        setShowModal(true)

        // Impedir scroll do body quando modal está aberto
        if (typeof document !== 'undefined') {
          document.body.classList.add('modal-open')
        }
      }
    } catch (error) {
      console.error("Erro ao executar ação:", error)
      showMessageCard('error', 'Erro de conexão', 'Não foi possível completar a ação. Verifique sua conexão e tente novamente.')
    } finally {
      setConfirmLoading(false)
      setShowLoadingModal(false)
      setConfirmPassword('')
      setConfirmError('')
      setConfirmAction(null)
      setFuncionarioSelecionado(null)
    }
  }

  // Função para confirmar senha gerencial
  const confirmarAcao = async () => {
    try {
      setConfirmLoading(true)

      const response = await fetch('/api/validar-senha-gerencial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ senha: confirmPassword }),
      })

      const data = await response.json()

      if (response.ok && data.valido) {
        setConfirmError('')
        await executarAcaoConfirmada()
      } else {
        setConfirmError(data.error || 'Erro ao validar senha')
        setConfirmPassword('')
      }
    } catch (error) {
      console.error('Erro ao validar senha:', error)
      setConfirmError('Erro de conexão. Tente novamente.')
      setConfirmPassword('')
    } finally {
      setConfirmLoading(false)
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
      data_admissao: funcionario.data_admissao ? funcionario.data_admissao.split('T')[0] : '',
      login: funcionario.login || '',
      senha: '',
      ativo: funcionario.ativo
    })
    setFuncionarioSelecionado(funcionario)
    setEditMode(true)
    setActiveTab('basico')
    setShowValidationCard(false)
    setValidationErrors([])
    setShowModal(true)

    // Impedir scroll do body quando modal está aberto
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open')
    }
  }

  const abrirModalNovo = () => {
    setConfirmAction('novo')
    setShowConfirmModal(true)
  }

  const fecharModal = () => {
    setShowModal(false)
    setFuncionarioSelecionado(null)
    setEditMode(false)
    setActiveTab('basico')
    setShowValidationCard(false)
    setValidationErrors([])

    // Restaurar scroll do body quando modal é fechado
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open')
    }
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
    setActiveTab('basico')
    setShowValidationCard(false)
    setValidationErrors([])
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
        {/* Header Skeleton */}
        <div className="page-header">
          <div className="header-actions">
            <div className="skeleton skeleton-button"></div>
            <div className="skeleton skeleton-button-primary"></div>
          </div>
        </div>

        {/* Resumo Cards Skeleton */}
        <div className="resumo-grid">
          <div className="total-card">
            <div className="skeleton skeleton-icon"></div>
            <div className="card-content">
              <div className="skeleton skeleton-label"></div>
              <div className="skeleton skeleton-value"></div>
            </div>
          </div>
          <div className="total-card">
            <div className="skeleton skeleton-icon"></div>
            <div className="card-content">
              <div className="skeleton skeleton-label"></div>
              <div className="skeleton skeleton-value"></div>
            </div>
          </div>
          <div className="total-card">
            <div className="skeleton skeleton-icon"></div>
            <div className="card-content">
              <div className="skeleton skeleton-label"></div>
              <div className="skeleton skeleton-value"></div>
            </div>
          </div>
        </div>

        {/* Lista Skeleton */}
        <div className="funcionarios-table-container">
          <div className="table-header">
            <div className="skeleton skeleton-title"></div>
          </div>
          <div className="funcionarios-cards">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="funcionario-skeleton-card">
                <div className="skeleton-card-header">
                  <div className="skeleton skeleton-name"></div>
                  <div className="skeleton skeleton-badge"></div>
                </div>
                <div className="skeleton-card-body">
                  <div className="skeleton-grid">
                    <div className="skeleton-item">
                      <div className="skeleton skeleton-label"></div>
                      <div className="skeleton skeleton-value"></div>
                    </div>
                    <div className="skeleton-item">
                      <div className="skeleton skeleton-label"></div>
                      <div className="skeleton skeleton-value"></div>
                    </div>
                    <div className="skeleton-item">
                      <div className="skeleton skeleton-label"></div>
                      <div className="skeleton skeleton-value"></div>
                    </div>
                    <div className="skeleton-item">
                      <div className="skeleton skeleton-label"></div>
                      <div className="skeleton skeleton-value"></div>
                    </div>
                  </div>
                </div>
                <div className="skeleton-card-footer">
                  <div className="skeleton skeleton-button"></div>
                  <div className="skeleton skeleton-button"></div>
                  <div className="skeleton skeleton-button"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="funcionarios-container">
      {/* Message Card */}
      {messageCard.show && (
        <div className={`message-card message-${messageCard.type}`}>
          <div className="message-body">
            <p className="message-text">{messageCard.message}</p>
            <button
              className="message-close"
              onClick={hideMessageCard}
              title="Fechar"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
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
          <div className="funcionarios-cards">
            {funcionariosFiltrados.map((funcionario, index) => (
              <FuncionarioCard
                key={funcionario.id}
                funcionario={funcionario}
                onVerDetalhes={(f) => {
                  setFuncionarioSelecionado(f)
                  setShowDetalhesModal(true)
                }}
                onEditar={abrirModalEdicao}
                onToggleStatus={toggleStatus}
                delayIndex={index}
                animacaoExecutada={animacaoExecutada}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay modal-fade-in" onClick={() => fecharModal()}>
          <div className="modal-content-f large" onClick={e => e.stopPropagation()}>
            <div className="employee-header">
              <div className="employee-header-info">
                <div className="employee-header-icon">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2 className="employee-header-title">
                    {editMode ? "Editar Funcionário" : "Novo Funcionário"}
                  </h2>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => fecharModal()}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Card de Validação */}
            {showValidationCard && validationErrors.length > 0 && (
              <div className="validation-card-1">
                <div className="validation-body">
                <ul className="validation-list">
                  {validationErrors.map((error, index) => (
                  <li key={index} className="validation-item">
                    <OctagonAlert size={24} className="validation-bullet" />
                    {error}
                  </li>
                  ))}
                </ul>
                </div>
              </div>
            )}

            {/* Navegação das Abas */}
            <div className="modal-tabs">
              <button 
                className={`tab-button ${activeTab === 'basico' ? 'active' : ''}`}
                onClick={() => setActiveTab('basico')}
              >
                <User size={16} />
                Dados Pessoais
              </button>
              <button 
                className={`tab-button ${activeTab === 'dados' ? 'active' : ''}`}
                onClick={() => setActiveTab('dados')}
              >
                <MapPin size={16} />
                Dados Profissionais
              </button>
              <button 
                className={`tab-button ${activeTab === 'acesso' ? 'active' : ''}`}
                onClick={() => setActiveTab('acesso')}
              >
                <Shield size={16} />
                Acesso
              </button>
            </div>

            <form onSubmit={salvarFuncionario}>
              {/* Aba Básico */}
              {activeTab === 'basico' && (
                <div className="tab-content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nome Completo *</label>
                      <input
                        type="text"
                        value={form.nome}
                        onChange={(e) => {
                          setForm({...form, nome: e.target.value})
                          // Limpar erros de validação quando usuário começa a editar
                          if (showValidationCard) {
                            setShowValidationCard(false)
                            setValidationErrors([])
                          }
                        }}
                        className="form-control"
                        placeholder="Digite o nome completo"
                      />
                    </div>
                    <div className="form-group">
                      <label>CPF *</label>
                      <input
                        type="text"
                        value={form.cpf}
                        onChange={handleCPFChange}
                        placeholder="000.000.000-00"
                        className="form-control"
                        readOnly={editMode}
                      />
                    </div>
                    <div className="form-group">
                      <label>RG</label>
                      <input
                        type="text"
                        value={form.rg}
                        onChange={(e) => {
                          setForm({...form, rg: e.target.value})
                          // Limpar erros de validação quando usuário começa a editar
                          if (showValidationCard) {
                            setShowValidationCard(false)
                            setValidationErrors([])
                          }
                        }}
                        placeholder="00.000.000-0"
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label>Telefone</label>
                      <input
                        type="text"
                        value={form.telefone}
                        onChange={(e) => {
                          setForm({...form, telefone: e.target.value})
                          // Limpar erros de validação quando usuário começa a editar
                          if (showValidationCard) {
                            setShowValidationCard(false)
                            setValidationErrors([])
                          }
                        }}
                        placeholder="(00) 00000-0000"
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => {
                          setForm({...form, email: e.target.value})
                          // Limpar erros de validação quando usuário começa a editar
                          if (showValidationCard) {
                            setShowValidationCard(false)
                            setValidationErrors([])
                          }
                        }}
                        className="form-control"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Aba Dados Profissionais */}
              {activeTab === 'dados' && (
                <div className="tab-content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Cargo *</label>
                      <select
                        value={form.cargo}
                        onChange={(e) => {
                          setForm({...form, cargo: e.target.value})
                          // Limpar erros de validação quando usuário começa a editar
                          if (showValidationCard) {
                            setShowValidationCard(false)
                            setValidationErrors([])
                          }
                        }}
                        className="form-control"
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
                        onChange={(e) => {
                          setForm({...form, salario: e.target.value})
                          // Limpar erros de validação quando usuário começa a editar
                          if (showValidationCard) {
                            setShowValidationCard(false)
                            setValidationErrors([])
                          }
                        }}
                        className="form-control"
                        placeholder="0,00"
                      />
                    </div>
                    <div className="form-group">
                      <label>Data de Admissão *</label>
                      <input
                        type="date"
                        value={form.data_admissao}
                        onChange={(e) => {
                          setForm({...form, data_admissao: e.target.value})
                          // Limpar erros de validação quando usuário começa a editar
                          if (showValidationCard) {
                            setShowValidationCard(false)
                            setValidationErrors([])
                          }
                        }}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Endereço</label>
                      <input
                        type="text"
                        value={form.endereco}
                        onChange={(e) => {
                          setForm({...form, endereco: e.target.value})
                          // Limpar erros de validação quando usuário começa a editar
                          if (showValidationCard) {
                            setShowValidationCard(false)
                            setValidationErrors([])
                          }
                        }}
                        className="form-control"
                        placeholder="Rua, número, bairro, cidade"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Aba Acesso */}
              {activeTab === 'acesso' && (
                <div className="tab-content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Login *</label>
                      <input
                        type="text"
                        value={form.login}
                        onChange={(e) => {
                          setForm({...form, login: e.target.value})
                          // Limpar erros de validação quando usuário começa a editar
                          if (showValidationCard) {
                            setShowValidationCard(false)
                            setValidationErrors([])
                          }
                        }}
                        className="form-control"
                        placeholder="Digite o login do usuário"
                      />
                    </div>
                    <div className="form-group">
                      <label>{editMode ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</label>
                      <input
                        type="password"
                        value={form.senha}
                        onChange={(e) => {
                          setForm({...form, senha: e.target.value})
                          // Limpar erros de validação quando usuário começa a editar
                          if (showValidationCard) {
                            setShowValidationCard(false)
                            setValidationErrors([])
                          }
                        }}
                        className="form-control"
                        placeholder="Digite a senha"
                      />
                    </div>
                    {editMode && (
                      <div className="form-group">
                        <label>Status</label>
                        <select
                          value={form.ativo ? 'true' : 'false'}
                          onChange={(e) => {
                            setForm({...form, ativo: e.target.value === 'true'})
                            // Limpar erros de validação quando usuário começa a editar
                            if (showValidationCard) {
                              setShowValidationCard(false)
                              setValidationErrors([])
                            }
                          }}
                          className="form-control"
                        >
                          <option value="true">Ativo</option>
                          <option value="false">Inativo</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer do Modal */}
              <div className="modal-footer-1">
                <div className="footer-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-lg"
                    onClick={() => setShowModal(false)}
                    disabled={modalLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <User size={18} />
                        {editMode ? 'Atualizar' : 'Cadastrar'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {showDetalhesModal && funcionarioSelecionado && (
        <div className="modal-overlay" onClick={() => setShowDetalhesModal(false)}>
          <div className="modal-content-f large" onClick={e => e.stopPropagation()}>
            <div className="employee-header">
              <div className="employee-header-info">
                <div className="employee-header-icon">
                  <Eye size={24} />
                </div>
                <div>
                  <h2 className="employee-header-title">
                    Dados do Funcionário
                  </h2>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowDetalhesModal(false)}
                title="Fechar"
              >
                <X size={20} />
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
                  <span>{funcionarioSelecionado.data_admissao ? formatarData(funcionarioSelecionado.data_admissao) : 'Não informado'}</span>
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
                  <span>{funcionarioSelecionado.created_at ? formatarData(funcionarioSelecionado.created_at) : 'Não informado'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação com Senha Gerencial */}
      {showConfirmModal && (
        <div className="modal-overlay modal-fade-in" onClick={() => {
          setShowConfirmModal(false)
          setConfirmPassword('')
          setConfirmError('')
          setConfirmAction(null)
        }}>
          <div className="modal-content-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-header-confirm">
              <h3>
                <Shield size={20} style={{ marginRight: '8px' }} />
                Confirmação Gerencial
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowConfirmModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <MasterPasswordConfirmation
                title={confirmAction === 'desativar'
                  ? `Desativar Funcionário: ${funcionarioSelecionado?.nome}`
                  : 'Cadastrar Novo Funcionário'
                }
                message={confirmAction === 'desativar'
                  ? 'Esta ação irá alterar o status do funcionário. Para prosseguir, digite a senha gerencial:'
                  : 'Esta ação irá abrir o formulário para cadastrar um novo funcionário. Para prosseguir, digite a senha gerencial:'
                }
                value={confirmPassword}
                onChange={(value) => {
                  setConfirmPassword(value)
                  if (confirmError) setConfirmError('') // Limpar erro ao digitar
                }}
                placeholder="Digite a senha gerencial"
                onKeyPress={(e) => e.key === 'Enter' && confirmarAcao()}
              />
              {confirmError && (
                <div className="error-message">
                  <OctagonAlert size={14} />
                  {confirmError}
                </div>
              )}
            </div>
            <div className="modal-footer-confirm">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowConfirmModal(false)
                  setConfirmPassword('')
                  setConfirmError('')
                  setConfirmAction(null)
                }}
                disabled={confirmLoading}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmarAcao}
                disabled={confirmLoading || !confirmPassword.trim()}
              >
                {confirmLoading ? (
                  <>
                    <Loader2 size={16} className="loading-spinner" />
                    Confirmando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Loading */}
      {showLoadingModal && (
        <div className="modal-overlay modal-fade-in">
          <div className="modal-content-f small">
            <div className="loading-modal-content">
              <div className="loading-spinner-large">
                <Loader2 size={48} />
              </div>
              <h4>Processando...</h4>
              <p>{loadingMessage}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
