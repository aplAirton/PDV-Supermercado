'use client'

import { useState, useEffect } from 'react'
import { Calculator, User, DollarSign, Clock, TrendingUp, Plus, Settings, AlertCircle, CheckCircle, Loader2, ArrowUp, ArrowDown, Lock, FileText, Printer, ArrowRightLeft, Check, X, Banknote, CreditCard, Smartphone, Receipt, Handshake, ShoppingCart, Wallet } from 'lucide-react'
import LoadingModal from '../../components/loading-modal'
import '../../styles/caixa.css'

// Função toast limpa - sem alertas de navegador
const toast = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
  // Sistema de toast silencioso - apenas log no console em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const status = variant === 'destructive' ? 'ERRO' : 'SUCESSO'
    const message = description ? `${title}: ${description}` : title
    console.log(`[${status}] ${message}`)
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
  total_suprimentos: number
  total_sangrias: number
}

export default function CaixaPage() {
  const [loading, setLoading] = useState(true)
  const [caixas, setCaixas] = useState<Caixa[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [showFecharModal, setShowFecharModal] = useState(false)
  const [showResumoModal, setShowResumoModal] = useState(false)
  const [loadingResumo, setLoadingResumo] = useState(false)
  const [loadingAbrirCaixa, setLoadingAbrirCaixa] = useState(false)
  const [loadingFecharCaixa, setLoadingFecharCaixa] = useState(false)
  const [loadingDados, setLoadingDados] = useState(false)
  const [showSangriaModal, setShowSangriaModal] = useState(false)
  const [sangriaForm, setSangriaForm] = useState({
    valor: '',
    descricao: ''
  })
  const [processandoSangria, setProcessandoSangria] = useState(false)
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false)
  const [showValidacaoSenhaModal, setShowValidacaoSenhaModal] = useState(false)
  const [showTipoMovimentoModal, setShowTipoMovimentoModal] = useState(false)
  const [showFormMovimentoModal, setShowFormMovimentoModal] = useState(false)
  const [validacaoSenhaForm, setValidacaoSenhaForm] = useState({ senha: '' })
  const [tipoMovimentoSelecionado, setTipoMovimentoSelecionado] = useState<'sangria' | 'suprimento' | null>(null)
  const [movimentoForm, setMovimentoForm] = useState({ valor: '', descricao: '' })
  const [processandoMovimento, setProcessandoMovimento] = useState(false)
  const [caixaSelecionado, setCaixaSelecionado] = useState<Caixa | null>(null)
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
  
  // Estados para fechamento em etapas
  const [etapaFechamento, setEtapaFechamento] = useState<'login' | 'contagem' | 'resumo'>('login')
  const [funcionarioFechamento, setFuncionarioFechamento] = useState<Funcionario | null>(null)
  const [resumoFechamento, setResumoFechamento] = useState<any>(null)
  const [showValidacaoSenhaFechamento, setShowValidacaoSenhaFechamento] = useState(false)
  const [showContagemDinheiro, setShowContagemDinheiro] = useState(false)
  const [showResumoFechamento, setShowResumoFechamento] = useState(false)
  const [processandoFechamento, setProcessandoFechamento] = useState(false)
  
  // Estados para comprovante de abertura
  const [showComprovanteAbertura, setShowComprovanteAbertura] = useState(false)
  const [dadosAbertura, setDadosAbertura] = useState<any>(null)
  
  // Estados para feedbacks de erro de senha
  const [erroSenhaAbertura, setErroSenhaAbertura] = useState<string>('')
  const [erroSenhaFechamento, setErroSenhaFechamento] = useState<string>('')
  const [erroSenhaMovimentacao, setErroSenhaMovimentacao] = useState<string>('')
  
  const [novoForm, setNovoForm] = useState({
    valor_inicial: '',
    observacoes: ''
  })

  const [fecharForm, setFecharForm] = useState({
    senha: '',
    valor_contado_dinheiro: '',
    observacoes: ''
  })

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

  // === FUNÇÕES DE ABERTURA ===
  
  const cancelarAberturaCaixa = () => {
    // Cancelamento transacional - limpa todos os estados de abertura
    setShowNovoModal(false)
    setEtapaAbertura('login')
    setLoginForm({ cpf: '', senha: '' })
    setNovoForm({ valor_inicial: '', observacoes: '' })
    setFuncionarioAbertura(null)
    sessionStorage.removeItem('funcionario_caixa')
    // Limpar erros
    setErroSenhaAbertura('')
  }

  // === FUNÇÕES DE FECHAMENTO EM ETAPAS ===
  
  const iniciarFechamentoCaixa = () => {
    if (!caixaSelecionado) return
    
    // Reset de estados
    setEtapaFechamento('login')
    setFuncionarioFechamento(null)
    setResumoFechamento(null)
    setFecharForm({ senha: '', valor_contado_dinheiro: '', observacoes: '' })
    
    // Iniciar fluxo
    setShowValidacaoSenhaFechamento(true)
  }

  const cancelarFechamentoCaixa = () => {
    // Cancelamento transacional - limpa todos os estados
    setShowValidacaoSenhaFechamento(false)
    setShowContagemDinheiro(false)
    setShowResumoFechamento(false)
    setEtapaFechamento('login')
    setFuncionarioFechamento(null)
    setResumoFechamento(null)
    setFecharForm({ senha: '', valor_contado_dinheiro: '', observacoes: '' })
    setProcessandoFechamento(false)
    // Limpar erros
    setErroSenhaFechamento('')
  }

  const validarSenhaFechamento = async () => {
    if (!caixaSelecionado || !fecharForm.senha) return

    // Limpar erros anteriores
    setErroSenhaFechamento('')
    setProcessandoFechamento(true) // Adicionar loading
    try {
      const response = await fetch('/api/caixa/validar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionario_id: caixaSelecionado.funcionario_id,
          senha: fecharForm.senha
        })
      })

      if (!response.ok) {
        const error = await response.json()
        setErroSenhaFechamento(error.error || "Senha incorreta")
        return
      }

      const funcionario = await response.json()
      setFuncionarioFechamento(funcionario)
      
      // Avançar para próxima etapa
      setEtapaFechamento('contagem')
      setShowValidacaoSenhaFechamento(false)
      setShowContagemDinheiro(true)
    } catch (error) {
      console.error('Erro na validação:', error)
      setErroSenhaFechamento("Falha na validação da senha")
    } finally {
      setProcessandoFechamento(false)
    }
  }

  const processarContagem = async () => {
    if (!caixaSelecionado || !fecharForm.valor_contado_dinheiro) return

    setProcessandoFechamento(true) // Adicionar loading
    try {
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

      // Preparar resumo completo
      const resumoCompleto = {
        id: caixaSelecionado.id,
        funcionario_nome: caixaSelecionado.funcionario_nome,
        funcionario_cargo: funcionarioFechamento?.cargo || '',
        data_abertura: caixaSelecionado.data_abertura,
        data_fechamento: new Date().toISOString(),
        valores: {
          inicial: caixaSelecionado.valor_inicial,
          vendas: resumoData.valores?.vendas || 0,
          vendas_dinheiro: resumoData.valores?.vendas_dinheiro || 0,
          suprimentos: resumoData.valores?.suprimentos || 0,
          sangrias: resumoData.valores?.sangrias || 0,
          esperado: valorEsperado,
          contado: valorContado,
          diferenca: diferenca
        },
        vendas: resumoData.vendas || { total_transacoes: 0, valor_total: 0 },
        status_reconciliacao: diferenca === 0 ? 'perfeito' : diferenca > 0 ? 'sobra' : 'falta',
        observacoes: fecharForm.observacoes
      }
      
      setResumoFechamento(resumoCompleto)
      
      // Avançar para próxima etapa
      setEtapaFechamento('resumo')
      setShowContagemDinheiro(false)
      setShowResumoFechamento(true)
      
    } catch (error) {
      console.error('Erro ao processar contagem:', error)
      toast({
        title: "Erro",
        description: "Falha ao processar contagem",
        variant: "destructive"
      })
    } finally {
      setProcessandoFechamento(false)
    }
  }

  const confirmarFechamentoCaixa = async () => {
    if (!caixaSelecionado || !resumoFechamento) return

    setProcessandoFechamento(true)
    try {
      // Realizar o fechamento efetivo
      const response = await fetch(`/api/caixa/${caixaSelecionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'fechado',
          valor_contado_dinheiro: resumoFechamento.valores.contado,
          observacoes_fechamento: resumoFechamento.observacoes,
          diferenca_caixa: resumoFechamento.valores.diferenca,
          status_reconciliacao: resumoFechamento.status_reconciliacao
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Sucesso - fechar modais de fechamento e mostrar resumo final
        setShowResumoFechamento(false)
        setCaixaSelecionado(null)
        
        // Mostrar o modal de resumo final
        setShowResumoModal(true)
        
        carregarDados()
        verificarStatusCaixa()
        
        // Reset estados de fechamento
        setEtapaFechamento('login')
        setFuncionarioFechamento(null)
        setFecharForm({ senha: '', valor_contado_dinheiro: '', observacoes: '' })
        
        // Limpar informações de login armazenadas
        sessionStorage.removeItem('funcionario_caixa')
        setFuncionarioAbertura(null)
        setLoginForm({ cpf: '', senha: '' })
        setNovoForm({ valor_inicial: '', observacoes: '' })
        
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
    } finally {
      setProcessandoFechamento(false)
    }
  }

  // Função antiga mantida para compatibilidade (não será mais usada)
  const fecharCaixa = async () => {
    // Redireciona para o novo fluxo
    iniciarFechamentoCaixa()
  }

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Só mostrar loading modal se for uma operação inicial (não refresh rápido)
      const shouldShowModal = !caixas.length || !funcionarios.length
      if (shouldShowModal) {
        setLoadingDados(true)
      }
      
      const [caixasRes, funcionariosRes] = await Promise.all([
        fetch('/api/caixa'),
        fetch('/api/funcionarios')
      ])

      if (caixasRes.ok) {
        const caixasData = await caixasRes.json()
        console.log('Dados dos caixas carregados:', caixasData)
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
      setLoadingDados(false) // Sempre limpar, mesmo que não tenha sido ativado
    }
  }

  const abrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpar erros anteriores
    setErroSenhaAbertura('')
    
    if (etapaAbertura === 'login') {
      // Validar login (mais robusto)
      const cpfInput = (loginForm.cpf || '').toString().trim()
      const senhaInput = (loginForm.senha || '').toString().trim()

      // Se não houver dados no formulário, verificar se já existe um funcionário validado no sessionStorage
      const storedFuncionario = sessionStorage.getItem('funcionario_caixa')

      if ((!cpfInput || !senhaInput) && !storedFuncionario) {
        setErroSenhaAbertura('CPF e senha são obrigatórios')
        return
      }

      // Validar se CPF tem exatamente 11 dígitos
      if (cpfInput && cpfInput.length !== 11) {
        setErroSenhaAbertura('CPF deve ter exatamente 11 dígitos')
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
        setLoadingAbrirCaixa(true)
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
          setErroSenhaAbertura(error.error || "CPF ou senha incorretos")
        }
      } catch (error) {
        console.error('Erro:', error)
        setErroSenhaAbertura("Não foi possível validar as credenciais")
      } finally {
        setLoadingAbrirCaixa(false)
      }
    } else if (etapaAbertura === 'fundos') {
      // Abrir caixa com fundos
      try {
        setLoadingAbrirCaixa(true)
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
          console.error('[ERRO] Dados do funcionário perdidos!')
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
          
          // Preparar dados do comprovante de abertura
          setDadosAbertura({
            caixa_id: result.caixa_id,
            funcionario_nome: funcionarioData.nome,
            funcionario_cargo: funcionarioData.cargo,
            funcionario_cpf: loginForm.cpf,
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0,
            observacoes: novoForm.observacoes,
            data_abertura: new Date().toISOString()
          })
          
          // Atualizar estado do caixa atual
          setCaixaAtual({
            id: result.caixa_id,
            funcionario_nome: funcionarioData.nome,
            funcionario_cargo: funcionarioData.cargo,
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0
          })
          
          // Limpar estado após abrir o caixa
          setShowNovoModal(false)
          setEtapaAbertura('login')
          setLoginForm({ cpf: '', senha: '' })
          setNovoForm({ valor_inicial: '', observacoes: '' })
          setFuncionarioAbertura(null)
          sessionStorage.removeItem('funcionario_caixa')
          
          // Mostrar comprovante de abertura
          setShowComprovanteAbertura(true)
          
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
      } finally {
        setLoadingAbrirCaixa(false)
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
  // garantir que o caixa selecionado esteja definido para o modal
  setCaixaSelecionado(caixa)
  setLoadingResumo(true)
      
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
    } finally {
      setLoadingResumo(false)
    }
  }

  const realizarSangria = async () => {
    if (!caixaSelecionado) return
    
    const valor = parseFloat(sangriaForm.valor)
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido para sangria",
        variant: "destructive"
      })
      return
    }

    setProcessandoSangria(true)
    
    try {
      const response = await fetch(`/api/caixa/${caixaSelecionado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acao: 'movimentacao',
          tipo: 'sangria',
          valor: valor,
          descricao: sangriaForm.descricao || 'Sangria do caixa'
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao realizar sangria')
      }

      toast({
        title: "Sucesso",
        description: `Sangria de ${formatarValor(valor)} realizada com sucesso`,
        variant: "default"
      })

      // Limpar formulário e fechar modal
      setSangriaForm({ valor: '', descricao: '' })
      setShowSangriaModal(false)

      // Atualizar lista de caixas
      await carregarDados()

      // Se havia resumo aberto, recarregar
      if (showResumoModal) {
        await verResumo(caixaSelecionado)
      }

    } catch (error) {
      console.error('Erro ao realizar sangria:', error)
      toast({
        title: "Erro",
        description: "Não foi possível realizar a sangria",
        variant: "destructive"
      })
    } finally {
      setProcessandoSangria(false)
    }
  }

  const iniciarMovimentacao = (caixa: Caixa) => {
    setCaixaSelecionado(caixa)
    setShowValidacaoSenhaModal(true)
  }

  const validarSenhaMovimentacao = async () => {
    if (!caixaSelecionado || !validacaoSenhaForm.senha) {
      toast({
        title: "Erro",
        description: "Senha é obrigatória",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/caixa/validar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionario_id: caixaSelecionado.funcionario_id,
          senha: validacaoSenhaForm.senha
        })
      })

      if (response.ok) {
        setShowValidacaoSenhaModal(false)
        setValidacaoSenhaForm({ senha: '' })
        setShowTipoMovimentoModal(true)
      } else {
        const error = await response.json()
        setErroSenhaMovimentacao(error.error || "Senha incorreta")
      }
    } catch (error) {
      console.error('Erro:', error)
      setErroSenhaMovimentacao("Falha na validação da senha")
    }
  }

  const selecionarTipoMovimento = (tipo: 'sangria' | 'suprimento') => {
    setTipoMovimentoSelecionado(tipo)
    setShowTipoMovimentoModal(false)
    setShowFormMovimentoModal(true)
  }

  const realizarMovimentacao = async () => {
    if (!caixaSelecionado || !tipoMovimentoSelecionado) return
    
    const valor = parseFloat(movimentoForm.valor)
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido",
        variant: "destructive"
      })
      return
    }

    setProcessandoMovimento(true)
    
    try {
      const response = await fetch(`/api/caixa/${caixaSelecionado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acao: 'movimentacao_financeira',
          tipo: tipoMovimentoSelecionado,
          valor: valor,
          descricao: movimentoForm.descricao || `${tipoMovimentoSelecionado === 'sangria' ? 'Sangria' : 'Suprimento'} do caixa`
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao realizar movimentação')
      }

      toast({
        title: "Sucesso",
        description: `${tipoMovimentoSelecionado === 'sangria' ? 'Sangria' : 'Suprimento'} de ${formatarValor(valor)} realizada com sucesso`,
        variant: "default"
      })

      // Limpar formulários e fechar modais
      setMovimentoForm({ valor: '', descricao: '' })
      setShowFormMovimentoModal(false)
      setTipoMovimentoSelecionado(null)
      setCaixaSelecionado(null)

      // Atualizar lista de caixas
      await carregarDados()

    } catch (error) {
      console.error('Erro ao realizar movimentação:', error)
      toast({
        title: "Erro",
        description: "Não foi possível realizar a movimentação",
        variant: "destructive"
      })
    } finally {
      setProcessandoMovimento(false)
    }
  }

  const cancelarMovimentacao = () => {
    setShowValidacaoSenhaModal(false)
    setShowTipoMovimentoModal(false)
    setShowFormMovimentoModal(false)
    setValidacaoSenhaForm({ senha: '' })
    setMovimentoForm({ valor: '', descricao: '' })
    setTipoMovimentoSelecionado(null)
    setCaixaSelecionado(null)
    // Limpar erros
    setErroSenhaMovimentacao('')
  }

  const imprimirComprovanteAbertura = async () => {
    try {
      if (!dadosAbertura) return
      
      // Criar URL com parâmetros para o comprovante de abertura
      const params = new URLSearchParams({
        funcionario: dadosAbertura.funcionario_nome,
        cargo: dadosAbertura.funcionario_cargo,
        cpf: dadosAbertura.funcionario_cpf,
        valor_inicial: dadosAbertura.valor_inicial.toString(),
        observacoes: dadosAbertura.observacoes || '',
        data_abertura: dadosAbertura.data_abertura
      })
      
      const url = `/api/caixa/${dadosAbertura.caixa_id}/comprovante-abertura?${params.toString()}`
      const newWindow = window.open(url, '_blank', 'width=400,height=600')
      
      if (!newWindow) {
        toast({
          title: "Erro ao imprimir",
          description: "Verifique o bloqueador de pop-ups",
          variant: "destructive"
        })
        return
      }

    } catch (error) {
      console.error('Erro ao imprimir comprovante:', error)
      toast({
        title: "Erro ao imprimir",
        description: "Não foi possível imprimir o comprovante",
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
  const caixasFechados = caixas.filter(c => c.status === 'fechado')

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
            disabled={caixasAbertos.length > 0}
            style={{ 
              opacity: caixasAbertos.length > 0 ? 0.5 : 1,
              cursor: caixasAbertos.length > 0 ? 'not-allowed' : 'pointer'
            }}
            title={caixasAbertos.length > 0 ? 'Há um caixa aberto. Feche-o antes de abrir um novo.' : 'Abrir novo caixa'}
          >
            <Plus size={16} />
            Abrir Caixa
          </button>
        </div>
      </div>

  {/* resumo removido conforme solicitado */}

      {/* Card do Caixa Aberto */}
      {caixasAbertos.length > 0 && (
        <div className="caixa-aberto-card">
          {caixasAbertos.map((caixa) => {
            console.log('Dados do caixa aberto:', caixa)
            const valorInicial = Number(caixa.valor_inicial) || 0
            const totalVendas = Number(caixa.total_vendas) || 0
            const totalSuprimentos = Number(caixa.total_suprimentos) || 0
            const totalSangrias = Number(caixa.total_sangrias) || 0
            const totalCaixa = valorInicial + totalVendas + totalSuprimentos - totalSangrias
            
            return (
            <div key={caixa.id}>
              <div className="caixa-aberto-header">
                <div className="caixa-aberto-title">
                  <h2>Caixa #{caixa.id} • {caixa.funcionario_nome}</h2>
                  <div className="status">Caixa em Operação</div>
                </div>
                <div className="caixa-aberto-info">
                  Aberto em {formatarData(caixa.data_abertura)}<br />
                  Valor inicial: {formatarValor(valorInicial)}
                </div>
              </div>

              <div className="caixa-aberto-stats">
                <div className="total-caixa">
                  <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Calculator size={18} style={{ color: '#10b981' }} />
                    Total do Caixa
                  </div>
                  <div className="stat-value">{formatarValor(totalCaixa)}</div>
                </div>
              </div>

              <div className="caixa-aberto-actions">
                <button
                  onClick={() => verResumo(caixa)}
                  className="btn-caixa-action info"
                >
                  <FileText size={16} />
                  Ver Resumo
                </button>
                <button
                  onClick={() => imprimirResumoCaixa(caixa.id)}
                  className="btn-caixa-action secondary"
                >
                  <Printer size={16} />
                  Imprimir Resumo
                </button>
                <button
                  onClick={() => {
                    setCaixaSelecionado(caixa)
                    setShowTipoMovimentoModal(true)
                  }}
                  className="btn-caixa-action primary"
                >
                  <ArrowRightLeft size={16} />
                  Suprimento/Sangria
                </button>
                <button
                  onClick={() => {
                    setCaixaSelecionado(caixa)
                    iniciarFechamentoCaixa()
                  }}
                  className="btn-caixa-action danger"
                >
                  <Lock size={16} />
                  Fechar Caixa
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Histórico de Caixas */}
      <div className="caixas-table-container">
        <div className="table-header">
          <h3>Histórico de Caixas ({caixasFechados.length})</h3>
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
              {caixasFechados.map((caixa) => (
                <tr key={caixa.id}>
                  <td>
                    <div className="user-info">
                      <User size={16} />
                      {caixa.funcionario_nome}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${caixa.status}`}>
                      Fechado
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
                      <button
                        onClick={() => verResumo(caixa)}
                        className="btn btn-sm btn-outline"
                        title="Ver resumo do caixa"
                      >
                        <FileText size={14} />
                        Resumo
                      </button>
                      <button
                        onClick={() => imprimirResumoCaixa(caixa.id)}
                        className="btn btn-sm btn-secondary"
                        title="Imprimir resumo do caixa"
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
                onClick={cancelarAberturaCaixa}
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
                      CPF do Funcionário (11 dígitos)
                    </label>
                    <input
                      id="cpf"
                      type="text"
                      value={loginForm.cpf}
                      onChange={(e) => {
                        // Permitir apenas números e limitar a 11 dígitos
                        const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                        setLoginForm({...loginForm, cpf: value})
                        if (erroSenhaAbertura) setErroSenhaAbertura('')
                      }}
                      required
                      placeholder="(apenas números)"
                      maxLength={11}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: erroSenhaAbertura ? '1px solid #ef4444' : '1px solid #d1d5db',
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
                      onChange={(e) => {
                        setLoginForm({...loginForm, senha: e.target.value})
                        if (erroSenhaAbertura) setErroSenhaAbertura('') // Limpar erro ao digitar
                      }}
                      required
                      placeholder="Digite a senha"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: erroSenhaAbertura ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    {erroSenhaAbertura && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <AlertCircle size={16} style={{ color: '#ef4444', marginRight: '8px' }} />
                        <span style={{ color: '#dc2626', fontSize: '13px' }}>{erroSenhaAbertura}</span>
                      </div>
                    )}
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
                  onClick={cancelarAberturaCaixa} 
                  className="btn btn-outline"
                  disabled={loadingAbrirCaixa}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loadingAbrirCaixa}
                  style={{ opacity: loadingAbrirCaixa ? 0.5 : 1 }}
                >
                  {loadingAbrirCaixa ? (
                    <>
                      <Loader2 size={16} style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />
                      {etapaAbertura === 'login' ? 'Validando...' : 'Abrindo...'}
                    </>
                  ) : (
                    etapaAbertura === 'login' ? 'Validar Login' : 'Abrir Caixa'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modais de Fechamento em Etapas */}
      
      {/* Modal 1: Validação de Senha para Fechamento */}
      {showValidacaoSenhaFechamento && caixaSelecionado && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', width: '90%' }}>
            <div className="modal-header">
              <h3>Fechar Caixa - Validação</h3>
              <button
                onClick={cancelarFechamentoCaixa}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div className="info-section" style={{ 
                backgroundColor: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#dc2626' }}>Informações do Caixa</h4>
                <p style={{ margin: '4px 0' }}><strong>Funcionário:</strong> {caixaSelecionado.funcionario_nome}</p>
                <p style={{ margin: '4px 0' }}><strong>Valor Inicial:</strong> {formatarValor(caixaSelecionado.valor_inicial)}</p>
                <p style={{ margin: '4px 0' }}><strong>Aberto em:</strong> {formatarData(caixaSelecionado.data_abertura)}</p>
              </div>

              <p style={{ marginBottom: '20px', color: '#374151' }}>
                Digite sua senha para iniciar o processo de fechamento:
              </p>

              <div className="form-group">
                <label htmlFor="senha-fechamento">Senha do Operador *</label>
                <input
                  id="senha-fechamento"
                  type="password"
                  placeholder="Digite sua senha"
                  value={fecharForm.senha}
                  onChange={(e) => {
                    setFecharForm({...fecharForm, senha: e.target.value})
                    if (erroSenhaFechamento) setErroSenhaFechamento('') // Limpar erro ao digitar
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: erroSenhaFechamento ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && validarSenhaFechamento()}
                />
                {erroSenhaFechamento && (
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <AlertCircle size={16} style={{ color: '#ef4444', marginRight: '8px' }} />
                    <span style={{ color: '#dc2626', fontSize: '13px' }}>{erroSenhaFechamento}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={validarSenhaFechamento}
                className="btn btn-primary"
                disabled={!fecharForm.senha || processandoFechamento}
                style={{ opacity: (!fecharForm.senha || processandoFechamento) ? 0.5 : 1 }}
              >
                {processandoFechamento ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />
                    Validando...
                  </>
                ) : (
                  'Validar e Continuar'
                )}
              </button>
              <button 
                onClick={cancelarFechamentoCaixa}
                className="btn btn-outline"
                disabled={processandoFechamento}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Contagem de Dinheiro */}
      {showContagemDinheiro && caixaSelecionado && funcionarioFechamento && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>Fechar Caixa - Contagem</h3>
              <button
                onClick={cancelarFechamentoCaixa}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ 
                backgroundColor: '#f0f9ff', 
                border: '1px solid #bae6fd', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <Calculator size={20} style={{ marginRight: '8px', color: '#0369a1' }} />
                  <strong style={{ color: '#0369a1' }}>Contagem do Dinheiro em Caixa</strong>
                </div>
                <p style={{ margin: '0', fontSize: '14px', color: '#374151' }}>
                  Conte fisicamente todo o dinheiro presente no caixa e informe o valor total encontrado.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="valor-contado">
                  Valor Total Contado em Dinheiro *
                </label>
                <input
                  id="valor-contado"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={fecharForm.valor_contado_dinheiro}
                  onChange={(e) => setFecharForm({...fecharForm, valor_contado_dinheiro: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                />
                <small style={{ color: '#6b7280', fontSize: '13px' }}>
                  Informe o valor exato encontrado na contagem física
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="observacoes-contagem">Observações do Fechamento</label>
                <textarea
                  id="observacoes-contagem"
                  placeholder="Observações sobre o fechamento (opcional)"
                  value={fecharForm.observacoes}
                  onChange={(e) => setFecharForm({...fecharForm, observacoes: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={processarContagem}
                className="btn btn-primary"
                disabled={!fecharForm.valor_contado_dinheiro || parseFloat(fecharForm.valor_contado_dinheiro) < 0 || processandoFechamento}
                style={{ opacity: (!fecharForm.valor_contado_dinheiro || parseFloat(fecharForm.valor_contado_dinheiro) < 0 || processandoFechamento) ? 0.5 : 1 }}
              >
                {processandoFechamento ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />
                    Processando...
                  </>
                ) : (
                  <>
                    <Calculator size={16} style={{ marginRight: '6px' }} />
                    Processar Contagem
                  </>
                )}
              </button>
              <button 
                onClick={cancelarFechamentoCaixa}
                className="btn btn-outline"
                disabled={processandoFechamento}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Resumo do Fechamento */}
      {showResumoFechamento && resumoFechamento && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px', width: '95%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '50px', 
                  height: '50px', 
                  backgroundColor: '#dc2626',
                  borderRadius: '50%',
                  color: 'white'
                }}>
                  <Lock size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                    Fechar Caixa #{resumoFechamento.id}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                    Confirme os dados antes de finalizar
                  </p>
                </div>
                <div style={{ textAlign: 'right', color: '#6b7280', fontSize: '14px' }}>
                  <div style={{ fontWeight: '500', color: '#374151' }}>{resumoFechamento.funcionario_nome}</div>
                  <div>{formatarData(resumoFechamento.data_fechamento)}</div>
                </div>
              </div>
              <button
                onClick={cancelarFechamentoCaixa}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '25px' }}>
              {/* Card de Status da Reconciliação */}
              <div style={{ 
                background: resumoFechamento.status_reconciliacao === 'perfeito' ? 
                  '#ffffff' : 
                  resumoFechamento.status_reconciliacao === 'sobra' ?
                  'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                  'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '15px',
                padding: '25px',
                color: resumoFechamento.status_reconciliacao === 'perfeito' ? '#374151' : 'white',
                marginBottom: '25px',
                position: 'relative',
                overflow: 'hidden',
                border: resumoFechamento.status_reconciliacao === 'perfeito' ? '2px solid #e2e8f0' : 'none'
              }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '600', opacity: resumoFechamento.status_reconciliacao === 'perfeito' ? '0.7' : '0.9' }}>
                        Status do Fechamento
                      </h4>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
                        {resumoFechamento.status_reconciliacao === 'perfeito' ? 'PERFEITO' :
                         resumoFechamento.status_reconciliacao === 'sobra' ? 'SOBRA' : 'FALTA'}
                      </div>
                      <div style={{ fontSize: '14px', opacity: resumoFechamento.status_reconciliacao === 'perfeito' ? '0.7' : '0.9' }}>
                        Total do Caixa: <strong style={{ fontSize: '18px' }}>
                          {formatarValor(
                            (resumoFechamento.vendas?.valor_dinheiro || 0) + 
                            resumoFechamento.valores.suprimentos - 
                            resumoFechamento.valores.sangrias
                          )}
                        </strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {resumoFechamento.status_reconciliacao === 'perfeito' && <CheckCircle size={40} style={{ opacity: 0.6, color: '#22c55e' }} />}
                      {resumoFechamento.status_reconciliacao === 'sobra' && <TrendingUp size={40} style={{ opacity: 0.8 }} />}
                      {resumoFechamento.status_reconciliacao === 'falta' && <AlertCircle size={40} style={{ opacity: 0.8 }} />}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                    <div>
                      <div style={{ opacity: resumoFechamento.status_reconciliacao === 'perfeito' ? '0.6' : '0.8', marginBottom: '2px' }}>Esperado (Dinheiro)</div>
                      <div style={{ fontWeight: '600' }}>{formatarValor(resumoFechamento.valores.esperado)}</div>
                    </div>
                    <div>
                      <div style={{ opacity: resumoFechamento.status_reconciliacao === 'perfeito' ? '0.6' : '0.8', marginBottom: '2px' }}>Contado</div>
                      <div style={{ fontWeight: '600' }}>{formatarValor(resumoFechamento.valores.contado)}</div>
                    </div>
                  </div>
                </div>
                <div style={{ 
                  position: 'absolute', 
                  top: '-20px', 
                  right: '-20px', 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: resumoFechamento.status_reconciliacao === 'perfeito' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.1)', 
                  borderRadius: '50%' 
                }} />
              </div>

              {/* Resumo Financeiro */}
              <div style={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: '12px', 
                padding: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <Calculator size={20} style={{ color: '#10b981' }} />
                  <h4 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#374151' }}>
                    Resumo Financeiro
                  </h4>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Valor Inicial</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>{formatarValor(resumoFechamento.valores.inicial)}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Total Vendas</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>{formatarValor(resumoFechamento.valores.vendas)}</div>
                  </div>
                  {resumoFechamento.valores.suprimentos > 0 && (
                    <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Suprimentos</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>+{formatarValor(resumoFechamento.valores.suprimentos)}</div>
                    </div>
                  )}
                  {resumoFechamento.valores.sangrias > 0 && (
                    <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Sangrias</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>-{formatarValor(resumoFechamento.valores.sangrias)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={confirmarFechamentoCaixa}
                disabled={processandoFechamento}
                className="btn"
                style={{ 
                  backgroundColor: processandoFechamento ? '#9ca3af' : '#dc2626', 
                  color: 'white',
                  border: `1px solid ${processandoFechamento ? '#9ca3af' : '#dc2626'}`,
                  opacity: processandoFechamento ? 0.5 : 1
                }}
              >
                {processandoFechamento ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock size={16} style={{ marginRight: '6px' }} />
                    Confirmar Fechamento
                  </>
                )}
              </button>
              <button 
                onClick={cancelarFechamentoCaixa}
                disabled={processandoFechamento}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Loading Resumo */}
      <LoadingModal
        isOpen={loadingResumo}
        title="Carregando Resumo"
        message="Buscando informações do caixa..."
        size="medium"
      />

      {/* Modal Resumo */}
      {showResumoModal && resumoFechamento && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '50px', 
                  height: '50px', 
                  backgroundColor: resumoFechamento.status === 'aberto' ? '#10b981' : '#6b7280',
                  borderRadius: '50%',
                  color: 'white'
                }}>
                  <Calculator size={24} />
                </div>
                <div>
                  <h3 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                    Caixa #{resumoFechamento.id}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                    {resumoFechamento.operador_abertura} • {new Date(resumoFechamento.data_abertura).toLocaleDateString('pt-BR')}
                    {resumoFechamento.data_fechamento && (
                      <> - {new Date(resumoFechamento.data_fechamento).toLocaleDateString('pt-BR')}</>
                    )}
                  </p>
                </div>
              </div>
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

            <div style={{ padding: '25px' }}>
              {/* Cards de Status e Total */}
              <div style={{ display: 'grid', gridTemplateColumns: resumoFechamento.status === 'fechado' ? '2fr 1fr' : '1fr', gap: '20px', marginBottom: '25px' }}>
                {/* Card Total do Caixa */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '15px',
                  padding: '25px',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '600', opacity: '0.9' }}>
                          Total do Caixa
                        </h4>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>
                          {formatarValor(
                            resumoFechamento.valores.inicial + 
                            resumoFechamento.valores.vendas + 
                            resumoFechamento.valores.suprimentos - 
                            resumoFechamento.valores.sangrias
                          )}
                        </div>
                      </div>
                      <Wallet size={40} style={{ opacity: 0.8 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '13px' }}>
                      <div>
                        <div style={{ opacity: '0.8', marginBottom: '2px' }}>Inicial</div>
                        <div style={{ fontWeight: '600' }}>{formatarValor(resumoFechamento.valores.inicial)}</div>
                      </div>
                      <div>
                        <div style={{ opacity: '0.8', marginBottom: '2px' }}>Vendas</div>
                        <div style={{ fontWeight: '600' }}>+{formatarValor(resumoFechamento.valores.vendas)}</div>
                      </div>
                      <div>
                        <div style={{ opacity: '0.8', marginBottom: '2px' }}>Suprimentos</div>
                        <div style={{ fontWeight: '600' }}>+{formatarValor(resumoFechamento.valores.suprimentos)}</div>
                      </div>
                      <div>
                        <div style={{ opacity: '0.8', marginBottom: '2px' }}>Sangrias</div>
                        <div style={{ fontWeight: '600' }}>-{formatarValor(resumoFechamento.valores.sangrias)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    right: '-20px', 
                    width: '80px', 
                    height: '80px', 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '50%' 
                  }} />
                </div>

                {/* Card Reconciliação (só para caixas fechados) */}
                {resumoFechamento.status === 'fechado' && (
                  <div style={{ 
                    backgroundColor: resumoFechamento.valores.diferenca === 0 ? '#f0fdf4' : 
                                    resumoFechamento.valores.diferenca > 0 ? '#eff6ff' : '#fef2f2',
                    border: `3px solid ${resumoFechamento.valores.diferenca === 0 ? '#22c55e' : 
                                        resumoFechamento.valores.diferenca > 0 ? '#3b82f6' : '#ef4444'}`,
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ 
                      color: resumoFechamento.valores.diferenca === 0 ? '#22c55e' : 
                             resumoFechamento.valores.diferenca > 0 ? '#3b82f6' : '#ef4444',
                      marginBottom: '12px'
                    }}>
                      {resumoFechamento.valores.diferenca === 0 && <CheckCircle size={32} style={{ margin: '0 auto' }} />}
                      {resumoFechamento.valores.diferenca > 0 && <TrendingUp size={32} style={{ margin: '0 auto' }} />}
                      {resumoFechamento.valores.diferenca < 0 && <AlertCircle size={32} style={{ margin: '0 auto' }} />}
                    </div>
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      color: resumoFechamento.valores.diferenca === 0 ? '#22c55e' : 
                             resumoFechamento.valores.diferenca > 0 ? '#3b82f6' : '#ef4444'
                    }}>
                      {resumoFechamento.valores.diferenca === 0 ? 'PERFEITO' :
                       resumoFechamento.valores.diferenca > 0 ? 'SOBRA' : 'FALTA'}
                    </h4>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      color: resumoFechamento.valores.diferenca === 0 ? '#22c55e' : 
                             resumoFechamento.valores.diferenca > 0 ? '#3b82f6' : '#ef4444'
                    }}>
                      {formatarValor(Math.abs(resumoFechamento.valores.diferenca))}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                      Esperado: {formatarValor(resumoFechamento.valores.esperado)}<br/>
                      Contado: {formatarValor(resumoFechamento.valores.contado)}
                    </div>
                  </div>
                )}
              </div>

              {/* Formas de Pagamento */}
              <div style={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: '12px', 
                padding: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  marginBottom: '20px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <CreditCard size={20} style={{ color: '#10b981' }} />
                  <h4 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#374151' }}>
                    Formas de Pagamento
                  </h4>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '15px', 
                    backgroundColor: 'white', 
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '35px', 
                        height: '35px', 
                        backgroundColor: '#dcfce7', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Banknote size={18} style={{ color: '#059669' }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Dinheiro</span>
                    </div>
                    <strong style={{ fontSize: '16px', color: '#059669' }}>
                      {formatarValor(resumoFechamento.vendas?.valor_dinheiro || 0)}
                    </strong>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '15px', 
                    backgroundColor: 'white', 
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '35px', 
                        height: '35px', 
                        backgroundColor: '#dbeafe', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CreditCard size={18} style={{ color: '#2563eb' }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Débito</span>
                    </div>
                    <strong style={{ fontSize: '16px', color: '#2563eb' }}>
                      {formatarValor(resumoFechamento.vendas?.valor_cartao_debito || 0)}
                    </strong>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '15px', 
                    backgroundColor: 'white', 
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '35px', 
                        height: '35px', 
                        backgroundColor: '#fef2f2', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CreditCard size={18} style={{ color: '#dc2626' }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Crédito</span>
                    </div>
                    <strong style={{ fontSize: '16px', color: '#dc2626' }}>
                      {formatarValor(resumoFechamento.vendas?.valor_cartao_credito || 0)}
                    </strong>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '15px', 
                    backgroundColor: 'white', 
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '35px', 
                        height: '35px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Smartphone size={18} style={{ color: '#7c3aed' }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>PIX</span>
                    </div>
                    <strong style={{ fontSize: '16px', color: '#7c3aed' }}>
                      {formatarValor(resumoFechamento.vendas?.valor_pix || 0)}
                    </strong>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '15px', 
                    backgroundColor: 'white', 
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '35px', 
                        height: '35px', 
                        backgroundColor: '#fed7aa', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Handshake size={18} style={{ color: '#ea580c' }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Fiado</span>
                    </div>
                    <strong style={{ fontSize: '16px', color: '#ea580c' }}>
                      {formatarValor(resumoFechamento.vendas?.valor_fiado || 0)}
                    </strong>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '15px', 
                    backgroundColor: '#10b981', 
                    borderRadius: '10px',
                    border: '2px solid #059669',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    color: 'white',
                    gridColumn: 'span 2'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '35px', 
                        height: '35px', 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ShoppingCart size={18} style={{ color: 'white' }} />
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: '700' }}>TOTAL VENDAS</span>
                    </div>
                    <strong style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {formatarValor(resumoFechamento.valores?.vendas || 0)}
                    </strong>
                  </div>
                </div>
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

      {/* Modal Sangria */}
      {showSangriaModal && caixaSelecionado && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>Realizar Sangria - Caixa #{caixaSelecionado.id}</h3>
              <button
                onClick={() => {
                  setShowSangriaModal(false)
                  setSangriaForm({ valor: '', descricao: '' })
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <AlertCircle size={20} style={{ marginRight: '8px' }} />
                  <strong>Atenção - Sangria do Caixa</strong>
                </div>
                <p style={{ margin: '0', fontSize: '14px' }}>
                  Esta operação irá retirar dinheiro do caixa. O valor será subtraído do total disponível.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="sangria-valor">Valor da Sangria *</label>
                <input
                  id="sangria-valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={sangriaForm.valor}
                  onChange={(e) => setSangriaForm({...sangriaForm, valor: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="sangria-descricao">Descrição/Motivo</label>
                <textarea
                  id="sangria-descricao"
                  placeholder="Motivo da sangria (opcional)"
                  value={sangriaForm.descricao}
                  onChange={(e) => setSangriaForm({...sangriaForm, descricao: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={realizarSangria}
                disabled={processandoSangria || !sangriaForm.valor || parseFloat(sangriaForm.valor) <= 0}
                className="btn"
                style={{ 
                  backgroundColor: processandoSangria ? '#9ca3af' : '#ef4444', 
                  color: 'white',
                  border: `1px solid ${processandoSangria ? '#9ca3af' : '#ef4444'}`,
                  opacity: processandoSangria || !sangriaForm.valor || parseFloat(sangriaForm.valor) <= 0 ? 0.5 : 1
                }}
              >
                {processandoSangria ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />
                    Processando...
                  </>
                ) : (
                  <>
                    <ArrowDown size={16} style={{ marginRight: '6px' }} />
                    Confirmar Sangria
                  </>
                )}
              </button>
              <button 
                onClick={() => {
                  setShowSangriaModal(false)
                  setSangriaForm({ valor: '', descricao: '' })
                }} 
                disabled={processandoSangria}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Validação Senha para Movimentação */}
      {showValidacaoSenhaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="modal-header">
              <h3>Validação de Senha</h3>
              <button
                onClick={cancelarMovimentacao}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: '#374151' }}>
                Digite sua senha para acessar as movimentações financeiras:
              </p>

              <div className="form-group">
                <label htmlFor="validacao-senha">Senha *</label>
                <input
                  id="validacao-senha"
                  type="password"
                  placeholder="Digite sua senha"
                  value={validacaoSenhaForm.senha}
                  onChange={(e) => {
                    setValidacaoSenhaForm({senha: e.target.value})
                    if (erroSenhaMovimentacao) setErroSenhaMovimentacao('') // Limpar erro ao digitar
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: erroSenhaMovimentacao ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && validarSenhaMovimentacao()}
                />
                {erroSenhaMovimentacao && (
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <AlertCircle size={16} style={{ color: '#ef4444', marginRight: '8px' }} />
                    <span style={{ color: '#dc2626', fontSize: '13px' }}>{erroSenhaMovimentacao}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={validarSenhaMovimentacao}
                className="btn btn-primary"
                disabled={!validacaoSenhaForm.senha}
              >
                Validar
              </button>
              <button 
                onClick={cancelarMovimentacao}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tipo de Movimento */}
      {showTipoMovimentoModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>Selecionar Tipo de Movimentação</h3>
              <button
                onClick={cancelarMovimentacao}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Card Suprimento */}
                <button
                  onClick={() => selecionarTipoMovimento('suprimento')}
                  style={{
                    padding: '30px 20px',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    backgroundColor: '#f0fdf4',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#dcfce7'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0fdf4'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <ArrowUp size={32} color="#10b981" />
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#10b981', fontSize: '18px' }}>Suprimento</h4>
                    <p style={{ margin: '0', color: '#374151', fontSize: '14px' }}>
                      Adicionar dinheiro ao caixa
                    </p>
                  </div>
                </button>

                {/* Card Sangria */}
                <button
                  onClick={() => selecionarTipoMovimento('sangria')}
                  style={{
                    padding: '30px 20px',
                    border: '2px solid #ef4444',
                    borderRadius: '12px',
                    backgroundColor: '#fef2f2',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <ArrowDown size={32} color="#ef4444" />
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '18px' }}>Sangria</h4>
                    <p style={{ margin: '0', color: '#374151', fontSize: '14px' }}>
                      Retirar dinheiro do caixa
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={cancelarMovimentacao}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulário de Movimento */}
      {showFormMovimentoModal && tipoMovimentoSelecionado && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>{tipoMovimentoSelecionado === 'sangria' ? 'Realizar Sangria' : 'Realizar Suprimento'}</h3>
              <button
                onClick={cancelarMovimentacao}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                backgroundColor: tipoMovimentoSelecionado === 'sangria' ? '#fef2f2' : '#f0fdf4', 
                borderRadius: '8px', 
                color: tipoMovimentoSelecionado === 'sangria' ? '#dc2626' : '#16a34a' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  {tipoMovimentoSelecionado === 'sangria' ? (
                    <ArrowDown size={20} style={{ marginRight: '8px' }} />
                  ) : (
                    <ArrowUp size={20} style={{ marginRight: '8px' }} />
                  )}
                  <strong>
                    {tipoMovimentoSelecionado === 'sangria' ? 'Sangria do Caixa' : 'Suprimento ao Caixa'}
                  </strong>
                </div>
                <p style={{ margin: '0', fontSize: '14px' }}>
                  {tipoMovimentoSelecionado === 'sangria' 
                    ? 'Esta operação irá retirar dinheiro do caixa.'
                    : 'Esta operação irá adicionar dinheiro ao caixa.'
                  }
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="movimento-valor">
                  Valor {tipoMovimentoSelecionado === 'sangria' ? 'da Sangria' : 'do Suprimento'} *
                </label>
                <input
                  id="movimento-valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={movimentoForm.valor}
                  onChange={(e) => setMovimentoForm({...movimentoForm, valor: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="movimento-descricao">Descrição/Motivo</label>
                <textarea
                  id="movimento-descricao"
                  placeholder={`Motivo ${tipoMovimentoSelecionado === 'sangria' ? 'da sangria' : 'do suprimento'} (opcional)`}
                  value={movimentoForm.descricao}
                  onChange={(e) => setMovimentoForm({...movimentoForm, descricao: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={realizarMovimentacao}
                disabled={processandoMovimento || !movimentoForm.valor || parseFloat(movimentoForm.valor) <= 0}
                className="btn"
                style={{ 
                  backgroundColor: processandoMovimento ? '#9ca3af' : 
                                   tipoMovimentoSelecionado === 'sangria' ? '#ef4444' : '#10b981', 
                  color: 'white',
                  border: `1px solid ${processandoMovimento ? '#9ca3af' : 
                                      tipoMovimentoSelecionado === 'sangria' ? '#ef4444' : '#10b981'}`,
                  opacity: processandoMovimento || !movimentoForm.valor || parseFloat(movimentoForm.valor) <= 0 ? 0.5 : 1
                }}
              >
                {processandoMovimento ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />
                    Processando...
                  </>
                ) : (
                  <>
                    {tipoMovimentoSelecionado === 'sangria' ? (
                      <ArrowDown size={16} style={{ marginRight: '6px' }} />
                    ) : (
                      <ArrowUp size={16} style={{ marginRight: '6px' }} />
                    )}
                    Confirmar {tipoMovimentoSelecionado === 'sangria' ? 'Sangria' : 'Suprimento'}
                  </>
                )}
              </button>
              <button 
                onClick={cancelarMovimentacao}
                disabled={processandoMovimento}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Comprovante de Abertura */}
      {showComprovanteAbertura && dadosAbertura && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>Caixa Aberto com Sucesso!</h3>
              <button
                onClick={() => {
                  setShowComprovanteAbertura(false)
                  setDadosAbertura(null)
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div className="success-icon" style={{ 
                color: '#22c55e',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <CheckCircle size={48} />
              </div>
              
              <h4 style={{ color: '#22c55e', marginBottom: '20px' }}>
                COMPROVANTE DE ABERTURA
              </h4>

              <div className="comprovante-detalhes" style={{ 
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                margin: '20px 0',
                textAlign: 'left'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div><strong>Caixa #:</strong> {dadosAbertura.caixa_id}</div>
                  <div><strong>Data:</strong> {new Date(dadosAbertura.data_abertura).toLocaleDateString('pt-BR')}</div>
                </div>
                
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginBottom: '15px' }}>
                  <div style={{ marginBottom: '8px' }}><strong>Operador:</strong> {dadosAbertura.funcionario_nome}</div>
                  <div style={{ marginBottom: '8px' }}><strong>Cargo:</strong> {dadosAbertura.funcionario_cargo}</div>
                </div>
                
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                  <div style={{ 
                    fontSize: '18px', 
                    color: '#1e40af', 
                    fontWeight: 'bold'
                  }}>
                    <strong>Valor Inicial:</strong> {formatarValor(dadosAbertura.valor_inicial)}
                  </div>
                </div>

                {dadosAbertura.observacoes && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginTop: '15px' }}>
                    <div style={{ marginBottom: '8px' }}><strong>Observações:</strong></div>
                    <div style={{ 
                      backgroundColor: '#f1f5f9',
                      padding: '10px',
                      borderRadius: '4px',
                      fontStyle: 'italic'
                    }}>
                      {dadosAbertura.observacoes}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ 
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#dc2626'
              }}>
                <strong>Importante:</strong> Guarde este comprovante como prova da abertura do caixa.
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={imprimirComprovanteAbertura}
                className="btn btn-primary"
              >
                <FileText size={16} style={{ marginRight: '6px' }} />
                Imprimir Comprovante
              </button>
              <button 
                onClick={() => {
                  setShowComprovanteAbertura(false)
                  setDadosAbertura(null)
                }}
                className="btn btn-outline"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Loading */}
      <LoadingModal
        isOpen={loadingAbrirCaixa}
        title="Abrindo Caixa"
        message={etapaAbertura === 'login' ? "Validando credenciais..." : "Criando novo caixa..."}
        size="medium"
      />

      <LoadingModal
        isOpen={loadingFecharCaixa}
        title="Fechando Caixa"
        message="Processando fechamento do caixa..."
        size="medium"
      />

      <LoadingModal
        isOpen={loadingDados}
        title="Carregando Dados"
        message="Buscando informações do sistema..."
        size="small"
        spinnerSize={40}
      />
    </div>
  )
}
