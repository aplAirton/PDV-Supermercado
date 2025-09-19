"use client"

import { useState, useEffect } from 'react'
import { User, Plus, Edit, Trash2, Eye, Filter, Search, UserCheck, UserX, Loader2, Menu, X, DollarSign, MapPin, Save, AlertCircle, OctagonAlert, Truck, CreditCard, Receipt, Lock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import '../../styles/fornecedores.css'

interface Fornecedor {
  id: number
  nome: string
  cnpj: string
  telefone: string
  email: string
  endereco: string
  contato: string
  ativo: boolean
  created_at: string
  updated_at: string
}

interface ResumoFornecedores {
  totalAtivos: number
  totalInativos: number
  totalPagamentos: number
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [resumo, setResumo] = useState<ResumoFornecedores>({
    totalAtivos: 0,
    totalInativos: 0,
    totalPagamentos: 0
  })
  const [showModal, setShowModal] = useState(false)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modalLoading, setModalLoading] = useState(false)
  const [animacaoExecutada, setAnimacaoExecutada] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    contato: ''
  })

  const [pagamentoData, setPagamentoData] = useState({
    fornecedor_id: 0,
    valor_total: '',
    forma_pagamento: 'dinheiro' as 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'transferencia' | 'cheque',
    descricao: '',
    afeta_caixa: true,
    itens: [] as Array<{produto_nome: string, quantidade: number, valor_unitario: number}>
  })

  const [messageCard, setMessageCard] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    title: string
    message: string
  }>({ show: false, type: 'success', title: '', message: '' })

  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [showPagamentoLoadingModal, setShowPagamentoLoadingModal] = useState(false)
  const [mostrarDescricaoPagamento, setMostrarDescricaoPagamento] = useState(false)
  const [showSenhaMasterModal, setShowSenhaMasterModal] = useState(false)
  const [validacaoSenhaForm, setValidacaoSenhaForm] = useState({ senha: '' })
  const [processandoPagamento, setProcessandoPagamento] = useState(false)
  const [showPagamentoResultModal, setShowPagamentoResultModal] = useState(false)
  const [pagamentoResult, setPagamentoResult] = useState<{
    success: boolean
    title: string
    message: string
    details?: string
  }>({ success: false, title: '', message: '' })
  const [saldoDinheiroDisponivel, setSaldoDinheiroDisponivel] = useState(0)
  const [valorInicialCaixa, setValorInicialCaixa] = useState(0)
  const [saldoCaixa, setSaldoCaixa] = useState(0) // Novo: saldo = total_dinheiro - valor_inicial
  const [showConfirmacaoConsumoInicial, setShowConfirmacaoConsumoInicial] = useState(false)
  const [erroSaldoInsuficiente, setErroSaldoInsuficiente] = useState('')

  // Marcar animação como executada após carregamento inicial
  useEffect(() => {
    if (!loading && fornecedores.length > 0 && !animacaoExecutada) {
      const timer = setTimeout(() => {
        setAnimacaoExecutada(true)
      }, 1000) // Tempo suficiente para todas as animações terminarem
      return () => clearTimeout(timer)
    }
  }, [loading, fornecedores.length, animacaoExecutada])

  // Forçar forma de pagamento para dinheiro quando afeta_caixa estiver marcado
  useEffect(() => {
    if (pagamentoData.afeta_caixa) {
      setPagamentoData(prev => ({ ...prev, forma_pagamento: 'dinheiro' }))
    }
  }, [pagamentoData.afeta_caixa])

  // Função para mostrar cards de mensagem temporários
  const showMessageCard = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setMessageCard({ show: true, type, title, message })
    // Auto-hide após 2 segundos
    setTimeout(() => {
      setMessageCard({ show: false, type: 'success', title: '', message: '' })
    }, 2000)
  }

  const hideMessageCard = () => {
    setMessageCard({ show: false, type: 'success', title: '', message: '' })
  }

  useEffect(() => {
    carregarFornecedores()
  }, [])

  const carregarFornecedores = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/fornecedores")
      const data = await response.json()
      setFornecedores(Array.isArray(data) ? data : [])

      // Calcular resumo
      const ativos = data.filter((f: Fornecedor) => f.ativo).length
      const inativos = data.filter((f: Fornecedor) => !f.ativo).length

      // Buscar totais de pagamentos
      const pagamentosResponse = await fetch("/api/fornecedores/pagamentos")
      const pagamentosData = await pagamentosResponse.json()
      const totalPagamentos = Array.isArray(pagamentosData)
        ? pagamentosData.reduce((sum: number, p: any) => sum + parseFloat(p.valor_pagamento || 0), 0)
        : 0

      setResumo({
        totalAtivos: ativos,
        totalInativos: inativos,
        totalPagamentos: totalPagamentos
      })
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error)
      setFornecedores([])
      showMessageCard('error', 'Erro ao carregar', 'Não foi possível carregar a lista de fornecedores. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  const fornecedoresFiltrados = fornecedores.filter(
    (fornecedor) =>
      fornecedor.nome.toLowerCase().includes('') ||
      fornecedor.cnpj.includes('') ||
      fornecedor.telefone.includes('')
  )

  const abrirModal = () => {
    setFormData({
      nome: '',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      contato: ''
    })
    setEditMode(false)
    setShowModal(true)
  }

  const abrirModalEditar = (fornecedor: Fornecedor) => {
    setFormData({
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj,
      telefone: fornecedor.telefone,
      email: fornecedor.email,
      endereco: fornecedor.endereco,
      contato: fornecedor.contato
    })
    setFornecedorSelecionado(fornecedor)
    setEditMode(true)
    setShowModal(true)
  }

  const buscarSaldoDinheiroDisponivel = async () => {
    try {
      const response = await fetch('/api/caixa/saldo-dinheiro')
      if (response.ok) {
        const data = await response.json()
        // Simplificado: usar apenas saldoCaixa
        setSaldoCaixa(data.saldoCaixa || 0)
        setValorInicialCaixa(data.valorInicial || 0)
        setSaldoDinheiroDisponivel(data.saldoCaixa || 0) // Usar saldoCaixa para compatibilidade
        
        console.log('[SALDO CAIXA] Saldo calculado (total_dinheiro - valor_inicial):', data.saldoCaixa)
      } else {
        setSaldoCaixa(0)
        setValorInicialCaixa(0)
        setSaldoDinheiroDisponivel(0)
      }
    } catch (error) {
      console.error('Erro ao buscar saldo:', error)
      setSaldoCaixa(0)
      setValorInicialCaixa(0)
      setSaldoDinheiroDisponivel(0)
    }
  }

  // Função para validar valor do pagamento em tempo real
  const validarValorPagamento = (valor: string, afetaCaixa: boolean) => {
    if (!afetaCaixa) {
      setErroSaldoInsuficiente('')
      return
    }

    const valorNumerico = parseFloat(valor)
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErroSaldoInsuficiente('')
      return
    }

    if (valorNumerico > saldoCaixa) {
      setErroSaldoInsuficiente(`Valor R$ ${valorNumerico.toFixed(2)} é superior ao saldo disponível R$ ${saldoCaixa.toFixed(2)}`)
    } else {
      setErroSaldoInsuficiente('')
    }
  }

  const abrirModalPagamento = async (fornecedor: Fornecedor) => {
    // Buscar saldo disponível em dinheiro
    await buscarSaldoDinheiroDisponivel()

    setPagamentoData({
      fornecedor_id: fornecedor.id,
      valor_total: '',
      forma_pagamento: 'dinheiro',
      descricao: '',
      afeta_caixa: true,
      itens: []
    })
    setFornecedorSelecionado(fornecedor)
    setShowPagamentoModal(true)
  }

  const fecharModal = () => {
    setShowModal(false)
    setFornecedorSelecionado(null)
    setEditMode(false)
    setShowValidationCard(false)
    setValidationErrors([])

    // Restaurar scroll do body quando modal é fechado
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open')
    }
  }

  const fecharModalPagamento = () => {
    setShowPagamentoModal(false)
    setFornecedorSelecionado(null)
    setPagamentoData({
      fornecedor_id: 0,
      valor_total: '',
      forma_pagamento: 'dinheiro',
      descricao: '',
      afeta_caixa: true,
      itens: []
    })
    setErroSaldoInsuficiente('') // Limpar erro ao fechar modal
  }

  const limparForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      contato: ''
    })
  }

  const validarForm = () => {
    const errors: string[] = []

    if (!formData.nome.trim()) {
      errors.push('Nome é obrigatório')
    }

    if (!formData.cnpj.trim()) {
      errors.push('CNPJ é obrigatório')
    }

    if (!formData.telefone.trim()) {
      errors.push('Telefone é obrigatório')
    }

    return errors
  }

  const salvarFornecedor = async () => {
    const validationErrors = validarForm()
    if (validationErrors.length > 0) {
      setValidationErrors(validationErrors)
      setShowValidationCard(true)
      return
    }

    setModalLoading(true)
    setLoadingMessage(editMode ? 'Atualizando fornecedor...' : 'Salvando fornecedor...')

    try {
      const url = editMode ? `/api/fornecedores/${fornecedorSelecionado?.id}` : '/api/fornecedores'
      const method = editMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showMessageCard('success', 'Sucesso', editMode ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!')
        fecharModal()
        carregarFornecedores()
      } else {
        const errorData = await response.json()
        showMessageCard('error', 'Erro', errorData.error || 'Erro ao salvar fornecedor')
      }
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error)
      showMessageCard('error', 'Erro', 'Erro interno do servidor')
    } finally {
      setModalLoading(false)
    }
  }

  const toggleStatusFornecedor = async (fornecedor: Fornecedor) => {
    setLoadingMessage('Alterando status do fornecedor...')
    setShowLoadingModal(true)

    try {
      const response = await fetch(`/api/fornecedores/${fornecedor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !fornecedor.ativo })
      })

      if (response.ok) {
        showMessageCard('success', 'Status alterado', `Fornecedor ${!fornecedor.ativo ? 'ativado' : 'desativado'} com sucesso!`)
        carregarFornecedores()
      } else {
        showMessageCard('error', 'Erro', 'Erro ao alterar status do fornecedor')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      showMessageCard('error', 'Erro', 'Erro interno do servidor')
    } finally {
      setShowLoadingModal(false)
    }
  }

  const excluirFornecedor = async (fornecedor: Fornecedor) => {
    setLoadingMessage('Excluindo fornecedor...')
    setShowLoadingModal(true)

    try {
      const response = await fetch(`/api/fornecedores/${fornecedor.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showMessageCard('success', 'Excluído', 'Fornecedor excluído com sucesso!')
        carregarFornecedores()
      } else {
        showMessageCard('error', 'Erro', 'Erro ao excluir fornecedor')
      }
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error)
      showMessageCard('error', 'Erro', 'Erro interno do servidor')
    } finally {
      setShowLoadingModal(false)
    }
  }

  const executarPagamento = async () => {
    console.log('[PAGAMENTO] Iniciando execução do pagamento...')
    console.log('[PAGAMENTO] Dados:', { pagamentoData, fornecedorSelecionado: fornecedorSelecionado?.nome })
    
    setShowPagamentoLoadingModal(true)
    
    try {
      const { fornecedor_id, valor_total, forma_pagamento, descricao, afeta_caixa } = pagamentoData
      console.log('[PAGAMENTO] Fazendo requisição para API...')
      
      const response = await fetch('/api/fornecedores/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fornecedor_id, valor_total, forma_pagamento, descricao, afeta_caixa })
      })

      console.log('[PAGAMENTO] Response status:', response.status)
      const responseData = await response.json()
      console.log('[PAGAMENTO] Response data:', responseData)

      if (response.ok) {
        console.log('[PAGAMENTO] Pagamento realizado com sucesso!')
        // Pagamento realizado com sucesso
        setPagamentoResult({
          success: true,
          title: 'Pagamento Realizado com Sucesso! ✅',
          message: `Pagamento de R$ ${parseFloat(valor_total).toFixed(2)} para ${fornecedorSelecionado?.nome} foi registrado com sucesso.`,
          details: `
            Fornecedor: ${fornecedorSelecionado?.nome}
            Valor: R$ ${parseFloat(valor_total).toFixed(2)}
            Forma: ${forma_pagamento}
            ${afeta_caixa ? 'Afetou caixa: Sim' : 'Afetou caixa: Não'}
            ${descricao ? `Descrição: ${descricao}` : ''}
          `.trim()
        })
        
        fecharModalPagamento()
        carregarFornecedores()
        // Atualizar saldo do caixa se afetou
        if (afeta_caixa) {
          await buscarSaldoDinheiroDisponivel()
        }
      } else {
        console.log('[PAGAMENTO] Erro no pagamento:', responseData.error)
        // Erro no pagamento
        setPagamentoResult({
          success: false,
          title: 'Erro no Pagamento ❌',
          message: responseData.error || 'Não foi possível processar o pagamento.',
          details: `
            Fornecedor: ${fornecedorSelecionado?.nome}
            Valor tentado: R$ ${parseFloat(valor_total).toFixed(2)}
            Erro: ${responseData.error || 'Erro desconhecido'}
          `.trim()
        })
      }
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      setPagamentoResult({
        success: false,
        title: 'Erro de Comunicação ❌',
        message: 'Erro interno do servidor. Tente novamente.',
        details: `
          Fornecedor: ${fornecedorSelecionado?.nome}
          Valor tentado: R$ ${parseFloat(pagamentoData.valor_total).toFixed(2)}
          Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}
        `.trim()
      })
    } finally {
      console.log('[PAGAMENTO] Finalizando processo...')
      setShowPagamentoLoadingModal(false)
      setShowPagamentoResultModal(true)
      setShowConfirmacaoConsumoInicial(false)
    }
  }

  const salvarPagamento = async () => {
    if (!pagamentoData.valor_total || parseFloat(pagamentoData.valor_total) <= 0) {
      showMessageCard('error', 'Erro', 'Valor do pagamento é obrigatório')
      return
    }

    // Validar saldo disponível quando usar dinheiro do caixa
    if (pagamentoData.afeta_caixa) {
      const valorPagamento = parseFloat(pagamentoData.valor_total)
      if (valorPagamento > saldoCaixa) {
        showMessageCard('error', 'Saldo Insuficiente',
          `O valor do pagamento (R$ ${valorPagamento.toFixed(2)}) é superior ao saldo disponível em dinheiro (R$ ${saldoCaixa.toFixed(2)}). 
          Saldo disponível: R$ ${saldoCaixa.toFixed(2)}`)
        return
      }

      // Verificar se a operação consumirá do valor inicial
      const saldoAposOperacao = saldoCaixa - valorPagamento
      if (saldoAposOperacao < 0 && !showConfirmacaoConsumoInicial) {
        setShowConfirmacaoConsumoInicial(true)
        return
      }

      // Se afeta o caixa, solicitar senha master
      setShowSenhaMasterModal(true)
    } else {
      // Se não afeta o caixa, executar diretamente
      await executarPagamento()
    }
  }

  const confirmarPagamentoComSenha = async () => {
    if (!validacaoSenhaForm.senha) return

    try {
      const response = await fetch('/api/validar-senha-gerencial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: validacaoSenhaForm.senha })
      })

      if (response.ok) {
        setShowSenhaMasterModal(false)
        setValidacaoSenhaForm({ senha: '' })
        await executarPagamento()
      } else {
        const error = await response.json()
        showMessageCard('error', 'Erro', error.error || 'Senha incorreta')
      }
    } catch (error) {
      console.error('Erro na validação da senha:', error)
      showMessageCard('error', 'Erro', 'Erro na validação da senha')
    }
  }

  const [showValidationCard, setShowValidationCard] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  if (loading) {
    return (
      <div className="fornecedores-container">
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
        <div className="fornecedores-table-container">
          <div className="table-header">
            <div className="skeleton skeleton-title"></div>
          </div>
          <div className="fornecedores-cards">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="fornecedor-skeleton-card">
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
    <div className="fornecedores-container">
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
        <div className="header-info">
          <h1 className="page-title">Gerenciamento de Fornecedores</h1>
          <p className="page-description">Cadastre e gerencie fornecedores do sistema</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => abrirModal()}>
            <Plus size={20} />
            Novo Fornecedor
          </button>
        </div>
      </div>

      {/* Resumo Cards */}
      <div className="resumo-grid">
        <div className="total-card">
          <Truck className="card-icon fornecedores-ativos" />
          <div className="card-content">
            <span className="card-label">Fornecedores Ativos</span>
            <span className="card-value">{resumo.totalAtivos}</span>
          </div>
        </div>
        <div className="total-card">
          <UserX className="card-icon fornecedores-inativos" />
          <div className="card-content">
            <span className="card-label">Fornecedores Inativos</span>
            <span className="card-value">{resumo.totalInativos}</span>
          </div>
        </div>
        <div className="total-card">
          <DollarSign className="card-icon pagamentos-total" />
          <div className="card-content">
            <span className="card-label">Total de Pagamentos</span>
            <span className="card-value">R$ {resumo.totalPagamentos.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Lista de Fornecedores */}
      <div className="fornecedores-table-container">
        <div className="table-header">
          <h2>Fornecedores Cadastrados ({fornecedoresFiltrados.length})</h2>
        </div>
        <div className="fornecedores-cards">
          {fornecedoresFiltrados.map((fornecedor, index) => (
            <div key={fornecedor.id} className={`fornecedor-card ${animacaoExecutada ? '' : 'fade-in'}`} style={animacaoExecutada ? {} : { animationDelay: `${index * 0.1}s` }}>
              {/* Cabeçalho do Card */}
              <div className="card-header">
                <div className="fornecedor-info">
                  <h3 className="fornecedor-nome">{fornecedor.nome}</h3>
                  <div className="status-container">
                    <div className={`status-badge ${fornecedor.ativo ? 'ativo' : 'inativo'}`}>
                      {fornecedor.ativo ? <UserCheck size={14} /> : <UserX size={14} />}
                      {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Corpo do Card */}
              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">CNPJ:</span>
                    <span className="info-value">{fornecedor.cnpj}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Telefone:</span>
                    <span className="info-value">{fornecedor.telefone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{fornecedor.email || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Contato:</span>
                    <span className="info-value">{fornecedor.contato || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              {/* Rodapé do Card */}
              <div className="card-footer">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => abrirModalEditar(fornecedor)}
                  title="Editar fornecedor"
                >
                  <Edit size={16} />
                  Editar
                </button>
                <button
                  className={`btn ${fornecedor.ativo ? 'btn-warning' : 'btn-success'} btn-sm`}
                  onClick={() => toggleStatusFornecedor(fornecedor)}
                  title={fornecedor.ativo ? 'Desativar fornecedor' : 'Ativar fornecedor'}
                >
                  {fornecedor.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                  {fornecedor.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => abrirModalPagamento(fornecedor)}
                  title="Registrar pagamento"
                >
                  <CreditCard size={16} />
                  Pagar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => excluirFornecedor(fornecedor)}
                  title="Excluir fornecedor"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay modal-fade-in" onClick={() => fecharModal()}>
          <div className="modal-content-f large" onClick={e => e.stopPropagation()}>
            <div className="modal-header-1">
              <div className="modal-header-content">
                <div className="modal-title-info-1">
                  <h2>
                    {editMode ? "Editar Fornecedor" : "Novo Fornecedor"}
                  </h2>
                  <p>
                    {editMode ? "Atualize as informações do fornecedor" : "Adicione um novo fornecedor ao sistema"}
                  </p>
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

            <div className="modal-body-1">
              {/* Card de Validação */}
              {showValidationCard && validationErrors.length > 0 && (
                <div className="validation-card-1">
                  <div className="validation-header">
                    <OctagonAlert size={16} />
                    <span>Por favor, corrija os seguintes erros:</span>
                  </div>
                  <ul className="validation-list">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome do Fornecedor *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Digite o nome do fornecedor"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CNPJ *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contato (Pessoa)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.contato}
                    onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                    placeholder="Nome da pessoa de contato"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer-1">
              <div className="footer-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => fecharModal()}
                  disabled={modalLoading}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => salvarFornecedor()}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <Loader2 size={16} className="loading-spinner" />
                      {editMode ? 'Atualizando...' : 'Salvando...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editMode ? 'Atualizar' : 'Salvar'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pagamento */}
      {showPagamentoModal && fornecedorSelecionado && (
        <div className="modal-overlay modal-fade-in" onClick={() => fecharModalPagamento()}>
          <div className="modal-content-f large" onClick={e => e.stopPropagation()}>
            <div className="modal-header-1">
              <div className="modal-header-content">
                <div className="modal-title-info-1">
                  <h2>Registrar Pagamento</h2>
                  <p>Pagamento para: {fornecedorSelecionado.nome}</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => fecharModalPagamento()}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-1">
              <div className="form-grid">
                <div className="form-group" style={{ 
                  border: '2px solid #3b82f6', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  backgroundColor: '#eff6ff',
                  position: 'relative'
                }}>
                  <label className="form-label" style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <DollarSign size={18} color="#1e40af" />
                    Valor Total *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={pagamentoData.valor_total}
                    onChange={(e) => {
                      const novoValor = e.target.value
                      setPagamentoData({ ...pagamentoData, valor_total: novoValor })
                      // Validar em tempo real quando usar dinheiro do caixa
                      validarValorPagamento(novoValor, pagamentoData.afeta_caixa)
                    }}
                    placeholder="0,00"
                    style={{
                      fontSize: '18px',
                      fontWeight: '500',
                      padding: '12px',
                      border: '2px solid #bfdbfe',
                      borderRadius: '8px',
                      backgroundColor: 'white'
                    }}
                  />
                  {/* Mensagem de erro instantânea */}
                  {erroSaldoInsuficiente && (
                    <div className="erro-saldo-insuficiente" style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fca5a5',
                      borderRadius: '4px',
                      color: '#dc2626',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <AlertCircle size={16} />
                      {erroSaldoInsuficiente}
                    </div>
                  )}
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={pagamentoData.afeta_caixa}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setPagamentoData({
                          ...pagamentoData,
                          afeta_caixa: checked,
                          forma_pagamento: checked ? 'dinheiro' : pagamentoData.forma_pagamento
                        })
                        // Validar quando marcar/desmarcar o checkbox
                        validarValorPagamento(pagamentoData.valor_total, checked)
                      }}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">Usar dinheiro do caixa (sangria)</span>
                  </label>
                  {pagamentoData.afeta_caixa && (
                    <div className="saldo-info" style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #0ea5e9',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      <strong>Saldo disponível em dinheiro:</strong> R$ {saldoCaixa.toFixed(2)}
                    </div>
                  )}
                  <small className="checkbox-help">
                    Quando marcado, o pagamento será registrado como sangria no caixa, afetando o saldo disponível em dinheiro. A forma de pagamento será automaticamente definida como dinheiro.
                  </small>
                </div>

                {!pagamentoData.afeta_caixa && (
                  <div className="form-group">
                    <label className="form-label">Forma de Pagamento *</label>
                    <select
                      className="form-select"
                      value={pagamentoData.forma_pagamento}
                      onChange={(e) => setPagamentoData({ ...pagamentoData, forma_pagamento: e.target.value as any })}
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_debito">Cartão Débito</option>
                      <option value="cartao_credito">Cartão Crédito</option>
                      <option value="pix">PIX</option>
                      <option value="transferencia">Transferência</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                )}

                <div className="form-group full-width">
                  {!mostrarDescricaoPagamento ? (
                    <button
                      type="button"
                      onClick={() => setMostrarDescricaoPagamento(true)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px dashed #d1d5db',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6'
                        e.currentTarget.style.color = '#3b82f6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db'
                        e.currentTarget.style.color = '#6b7280'
                      }}
                    >
                      <Plus size={16} />
                      Adicionar descrição (opcional)
                    </button>
                  ) : (
                    <div>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Descrição
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarDescricaoPagamento(false)
                            setPagamentoData({ ...pagamentoData, descricao: '' })
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '0'
                          }}
                        >
                          <X size={16} />
                        </button>
                      </label>
                      <textarea
                        className="form-textarea"
                        value={pagamentoData.descricao}
                        onChange={(e) => setPagamentoData({ ...pagamentoData, descricao: e.target.value })}
                        placeholder="Descrição do pagamento (ex: Compra de 10 unidades de produto X)"
                        rows={3}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer-1">
              <div className="footer-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => fecharModalPagamento()}
                  disabled={showPagamentoLoadingModal}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => salvarPagamento()}
                  disabled={showPagamentoLoadingModal || erroSaldoInsuficiente !== ''}
                  title={erroSaldoInsuficiente ? 'Corrija o valor do pagamento para continuar' : ''}
                >
                  <Receipt size={16} />
                  Registrar Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Consumo do Valor Inicial */}
      {showConfirmacaoConsumoInicial && (
        <div className="modal-overlay modal-fade-in" onClick={() => setShowConfirmacaoConsumoInicial(false)}>
          <div className="modal-content-f small" onClick={e => e.stopPropagation()}>
            <div className="modal-header-1">
              <div className="modal-header-content">
                <div className="modal-title-info-1">
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={20} color="#f59e0b" />
                    Atenção
                  </h2>
                  <p>Confirmação necessária</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowConfirmacaoConsumoInicial(false)}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-1">
              <div className="confirmation-content">
                <AlertCircle size={48} className="confirmation-icon warning" />
                <h3>A operação atual consumirá do valor inicial do caixa</h3>
                <p>
                  O saldo após esta operação ficará abaixo do valor inicial (fundo de caixa).
                  Isso significa que parte do dinheiro usado será do valor inicial configurado para o caixa.
                </p>
                <div className="confirmation-details">
                  <div className="detail-item">
                    <span className="detail-label">Valor do pagamento:</span>
                    <span className="detail-value">R$ {parseFloat(pagamentoData.valor_total).toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Saldo atual:</span>
                    <span className="detail-value">R$ {saldoCaixa.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Valor inicial:</span>
                    <span className="detail-value">R$ {valorInicialCaixa.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Saldo após operação:</span>
                    <span className="detail-value warning">
                      R$ {(saldoCaixa - parseFloat(pagamentoData.valor_total)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="confirmation-question">
                  Deseja continuar mesmo assim?
                </p>
              </div>
            </div>

            <div className="modal-footer-1">
              <div className="footer-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowConfirmacaoConsumoInicial(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    console.log('[CONFIRMAÇÃO] Botão Confirmar clicado')
                    executarPagamento()
                  }}
                >
                  <AlertCircle size={16} />
                  Confirmar e Continuar
                </button>
              </div>
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

      {/* Modal de Loading para Pagamento */}
      {showPagamentoLoadingModal && (
        <div className="modal-overlay modal-fade-in">
          <div className="modal-content-f small">
            <div className="loading-modal-content">
              <div className="loading-spinner-large">
                <Loader2 size={48} />
              </div>
              <h4>Registrando Pagamento</h4>
              <p>Aguarde enquanto processamos o pagamento do fornecedor...</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Senha Master */}
      {showSenhaMasterModal && (
        <div className="modal-overlay modal-fade-in" onClick={() => setShowSenhaMasterModal(false)}>
          <div className="modal-content-f medium" onClick={e => e.stopPropagation()}>
            <div className="modal-header-1">
              <div className="modal-header-content">
                <div className="modal-title-info-1">
                  <h2>Confirmação Necessária</h2>
                  <p>Este pagamento afetará o caixa. Digite a senha masterkey para confirmar.</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowSenhaMasterModal(false)}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-1">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <AlertCircle size={48} color="#f59e0b" />
                <h4 style={{ margin: '16px 0', color: '#111827' }}>Senha Master Requerida</h4>
                <p style={{ color: '#6b7280' }}>
                  Digite a senha master para autorizar este pagamento que afetará o saldo do caixa.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Senha Masterkey *</label>
                <input
                  type="password"
                  className="form-input"
                  value={validacaoSenhaForm.senha}
                  onChange={(e) => setValidacaoSenhaForm({ senha: e.target.value })}
                  placeholder="Digite a senha masterkey"
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-footer-1">
              <div className="footer-actions">
                <button
                  onClick={() => setShowSenhaMasterModal(false)}
                  className="btn btn-outline"
                  disabled={processandoPagamento}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarPagamentoComSenha}
                  className="btn btn-primary"
                  disabled={!validacaoSenhaForm.senha || processandoPagamento}
                >
                  <Lock size={16} />
                  {processandoPagamento ? 'Processando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resultado do Pagamento */}
      {showPagamentoResultModal && pagamentoResult && (
        <div className="modal-overlay modal-fade-in">
          <div className="modal-content-f medium">
            <div className="modal-header">
              <h3>{pagamentoResult.title}</h3>
            </div>
            <div className="modal-body">
              <div className={`result-message ${pagamentoResult.success ? 'success' : 'error'}`}>
                <div className="message-icon">
                  {pagamentoResult.success ? '✅' : '❌'}
                </div>
                <p className="main-message">{pagamentoResult.message}</p>
              </div>
              <div className="result-details">
                <h4>Detalhes:</h4>
                <pre>{pagamentoResult.details}</pre>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowPagamentoResultModal(false)
                  setPagamentoResult({ success: false, title: '', message: '' })
                }}
                className="btn-primary"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}