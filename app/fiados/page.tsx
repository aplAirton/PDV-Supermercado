'use client'

import { useState, useEffect } from 'react'
import { X, Plus, CreditCard, Clock, CheckCircle, DollarSign, FileText, Printer, Trash2, Calculator, Loader2 } from 'lucide-react'
import Modal from '@/components/modal'
import { toast } from '@/hooks/use-toast'
import '../../styles/components.css'

interface Cliente {
  id: number
  nome: string
  telefone: string
  debito_atual?: number
  limite_credito?: number
}

interface Fiado {
  id: number
  cliente_id: number
  cliente_nome: string
  valor_total?: number
  descricao: string
  data_criacao: string
  status: 'aberto' | 'parcial' | 'quitado'
  // campos opcionais que podem vir da API
  total?: number
  forma_pagamento?: any
  valor_original?: number
  valor_pago?: number
  valor_restante?: number
  venda_id?: number
}

interface MovimentoExtrato {
  id: number
  data_movimento: string
  tipo: string
  referencia: string
  descricao: string
  direcao: 'debito' | 'credito'
  valor: number
  saldo_corrente: number
  venda_id?: number // Adicionado para impressão de segunda via
}

export default function FiadosPage() {
  const [fiados, setFiados] = useState<Fiado[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [clientesLoading, setClientesLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [showConfirmacaoModal, setShowConfirmacaoModal] = useState(false)
  const [pagamentoCliente, setPagamentoCliente] = useState<Cliente | null>(null)
  const [pagamentosForm, setPagamentosForm] = useState<Array<{ tipo: string; valor: string }>>([{ tipo: 'dinheiro', valor: '' }])
  const [pagamentoLoading, setPagamentoLoading] = useState(false)
  const [fiadosComPagamentos, setFiadosComPagamentos] = useState<Record<number, any[]>>({})
  const [fiadoPaymentsLoading, setFiadoPaymentsLoading] = useState<Record<number, boolean>>({})
  const [resumoLoading, setResumoLoading] = useState(false)

  // Estados para extrato
  const [showExtrato, setShowExtrato] = useState(false)
  const [extratoCliente, setExtratoCliente] = useState<Cliente | null>(null)
  const [movimentosExtrato, setMovimentosExtrato] = useState<MovimentoExtrato[]>([])
  const [extratoLoading, setExtratoLoading] = useState(false)
  const [imprimindoExtrato, setImprimindoExtrato] = useState(false)

  // Estados do formulário
  const [novoFiado, setNovoFiado] = useState({
    cliente_id: '',
    valor_total: '',
    descricao: ''
  })

  useEffect(() => {
    carregarFiados()
    carregarClientes()
  }, [])

  const carregarFiados = async () => {
    try {
      const response = await fetch('/api/fiados')
      if (response.ok) {
        const data = await response.json()
        // A rota /api/fiados já entrega registros de fiados com campos normalizados
        const fiadosData = (Array.isArray(data) ? data : []).map((f: any) => ({
          id: f.id,
          venda_id: f.venda_id,
          cliente_id: f.cliente_id,
          cliente_nome: f.cliente_nome,
          valor_total: f.valor_original ?? f.venda_total ?? 0,
          descricao: f.descricao ?? '',
          data_criacao: f.data_fiado,
          status: f.status,
          // manter campos originais para compatibilidade
          valor_original: f.valor_original,
          valor_pago: f.valor_pago,
          valor_restante: f.valor_restante,
        }))

        setFiados(fiadosData)
        return fiadosData
      }
    } catch (error) {
      console.error('Erro ao carregar fiados:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const carregarClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (response.ok) {
        const clientesData = await response.json()
        setClientes(Array.isArray(clientesData) ? clientesData : [])
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setClientesLoading(false)
    }
  }

  const adicionarFiado = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cliente_id: parseInt(novoFiado.cliente_id),
          valor_total: parseFloat(novoFiado.valor_total),
          forma_pagamento: 'fiado',
          descricao: novoFiado.descricao
        })
      })

      if (response.ok) {
        setShowModal(false)
        setNovoFiado({ cliente_id: '', valor_total: '', descricao: '' })
        carregarFiados()
      } else {
        toast({ title: 'Erro', description: 'Erro ao adicionar fiado', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Erro ao adicionar fiado:', error)
      toast({ title: 'Erro', description: 'Erro ao adicionar fiado', variant: 'destructive' })
    }
  }

  const marcarComoPago = async (fiadoId: number) => {
    try {
      // Buscar venda atual para ler pagamentos e cliente
      const resp = await fetch(`/api/vendas/${fiadoId}`)
      if (!resp.ok) {
        toast({ title: 'Erro', description: 'Venda não encontrada', variant: 'destructive' })
        return
      }
      const venda: any = await resp.json()

      // Se forma_pagamento for JSON ou string, normalizar para array
      let pagamentos: any[] = []
      if (venda.forma_pagamento) {
        try {
          pagamentos = typeof venda.forma_pagamento === 'string' ? JSON.parse(venda.forma_pagamento) : venda.forma_pagamento
        } catch (e) {
          // formato antigo: 'fiado' -> converter para array minimal
          pagamentos = [{ tipo_pagamento: 'fiado', valor: venda.total ?? venda.valor_total ?? 0 }]
        }
      }

      // Substituir qualquer parcela fiado por pagamento em dinheiro (marca como pago)
      const newPagamentos = pagamentos.map(p => p.tipo_pagamento === 'fiado' ? { ...p, tipo_pagamento: 'dinheiro' } : p)

      const response = await fetch(`/api/vendas/${fiadoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagamentos: newPagamentos })
      })

      if (response.ok) {
        carregarFiados()
      } else {
        toast({ title: 'Erro', description: 'Erro ao marcar como pago', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      toast({ title: 'Erro', description: 'Erro ao marcar como pago', variant: 'destructive' })
    }
  }

  const calcularValorFiado = (fiado: any) => {
    const v = fiado.valor_total ?? fiado.total
    if (typeof v === 'number') return v

    // tentar derivar de forma_pagamento
    try {
      const forma = typeof fiado.forma_pagamento === 'string' ? JSON.parse(fiado.forma_pagamento) : fiado.forma_pagamento
      if (Array.isArray(forma)) return forma.reduce((s: number, p: any) => s + (Number.parseFloat(p.valor) || 0), 0)
    } catch (e) {}

    return 0
  }

  if (loading || clientesLoading) {
    return (
      <div className="container p-8">
        <div className="card">
          <div className="p-4">
            <div className="fiados-loading">
              <div className="loading-header">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-text"></div>
              </div>
              <div className="fiados-skeleton-cards">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="fiado-skeleton-card">
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
                      </div>
                    </div>
                    <div className="skeleton-card-footer">
                      <div className="skeleton skeleton-button"></div>
                      <div className="skeleton skeleton-button"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Lista clientes com débito atual > 0
  const clientesDevedores = clientes.filter(c => Number(c.debito_atual || 0) > 0)

  // abrirVisualizar removido: extrato substitui esta função

  const abrirPagamento = (cliente: Cliente) => {
    setPagamentoCliente(cliente)
    // preenche com valor total do débito
    setPagamentosForm([{ tipo: 'dinheiro', valor: Number((cliente.debito_atual || 0)).toFixed(2) }])
    setShowPagamentoModal(true)
  }

  const registrarPagamento = async () => {
    if (!pagamentoCliente) return
    setPagamentoLoading(true)
    try {
      // Validar soma dos pagamentos antes de enviar: não pode exceder o débito atual do cliente
      const somaPagamentos = pagamentosForm.reduce((s, p) => s + (Number.parseFloat(p.valor || '0') || 0), 0)
      const somaArred = Math.round((somaPagamentos + Number.EPSILON) * 100) / 100
      const debitoCliente = Number(pagamentoCliente.debito_atual || 0)

      if (somaArred <= 0) {
        toast({ title: 'Valor inválido', description: 'Informe um valor de pagamento válido maior que zero.', variant: 'destructive' })
        setPagamentoLoading(false)
        return
      }

      if (somaArred > debitoCliente) {
        toast({ title: 'Valor excede débito', description: `O valor total informado (R$ ${somaArred.toFixed(2)}) excede o débito atual do cliente (R$ ${debitoCliente.toFixed(2)}). Ajuste os valores para não pagar mais que o devido.`, variant: 'destructive' })
        setPagamentoLoading(false)
        return
      }

      const response = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: pagamentoCliente.id, pagamentos: pagamentosForm })
      })

      if (response.ok) {
        setShowPagamentoModal(false)
        setShowConfirmacaoModal(false)
        setPagamentoCliente(null)
        carregarClientes()
        carregarFiados()
        toast({ title: 'Pagamento registrado', description: 'Pagamento registrado com sucesso' })
      } else {
        const err = await response.json()
        toast({ title: 'Erro', description: err?.error || 'Erro ao registrar pagamento', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      toast({ title: 'Erro', description: 'Erro ao registrar pagamento', variant: 'destructive' })
    } finally {
      setPagamentoLoading(false)
    }
  }

  const carregarPagamentosDoFiado = async (fiadoId: number) => {
    try {
      const response = await fetch(`/api/fiados/${fiadoId}/pagamentos`)
      if (!response.ok) return []
      return await response.json()
    } catch (err) {
      return []
    }
  }

  // Funções do extrato de fiado
  const abrirExtrato = async (cliente: Cliente) => {
    setExtratoCliente(cliente)
    setShowExtrato(true)
    setExtratoLoading(true)
    try {
      const response = await fetch(`/api/fiados/${cliente.id}/extrato`)
      if (response.ok) {
        const movimentos = await response.json()
        setMovimentosExtrato(Array.isArray(movimentos) ? movimentos : [])
      } else {
        toast({ title: 'Erro', description: 'Erro ao carregar extrato', variant: 'destructive' })
        setMovimentosExtrato([])
      }
    } catch (error) {
      console.error('Erro ao carregar extrato:', error)
      toast({ title: 'Erro', description: 'Erro ao carregar extrato', variant: 'destructive' })
      setMovimentosExtrato([])
    } finally {
      setExtratoLoading(false)
    }
  }

  const imprimirExtrato = async () => {
    if (!extratoCliente) return

    try {
      setImprimindoExtrato(true)
      const url = `/api/fiados/${extratoCliente.id}/extrato/cupom`
      const newWindow = window.open(url, '_blank', 'width=400,height=600')
      
      if (!newWindow) {
        toast({
          title: "Erro ao imprimir",
          description: "Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Extrato aberto",
        description: "Janela de impressão foi aberta"
      })
    } catch (error) {
      console.error('Erro ao imprimir extrato:', error)
      toast({ 
        title: 'Erro', 
        description: 'Erro ao imprimir extrato', 
        variant: 'destructive' 
      })
    } finally {
      setImprimindoExtrato(false)
    }
  }

  const imprimirReciboMovimento = async (movimentoId: number) => {
    try {
      const url = `/api/fiados/movimentos/${movimentoId}/recibo`
      const newWindow = window.open(url, '_blank', 'width=400,height=600')
      
      if (!newWindow) {
        toast({
          title: "Erro ao imprimir",
          description: "Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Recibo aberto",
        description: "Janela de impressão foi aberta"
      })
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro ao gerar recibo",
        description: "Não foi possível gerar o recibo para impressão",
        variant: "destructive"
      })
    }
  }

  const imprimirSegundaViaCupom = (vendaId: number) => {
    // Abrir cupom HTML em nova janela
    const cupomUrl = `/api/vendas/${vendaId}/cupom`
    const w = window.open(cupomUrl, '_blank', 'width=800,height=600,scrollbars=yes')
    if (w) {
      w.focus()
      // Esperar carregar e tentar imprimir
      setTimeout(() => {
        try { 
          w.print() 
        } catch (e) { 
          console.log('Print automático não disponível') 
        }
      }, 1000)
    }
  }

  // Função para calcular dias desde o último pagamento
  const calcularDiasDesdeUltimoPagamento = async (clienteId: number) => {
    try {
      const response = await fetch(`/api/fiados/${clienteId}/extrato`)
      if (response.ok) {
        const movimentos = await response.json()
        const pagamentos = movimentos.filter((m: any) => m.tipo === 'pagamento')
        
        if (pagamentos.length > 0) {
          const ultimoPagamento = pagamentos.sort((a: any, b: any) => 
            new Date(b.data_movimento).getTime() - new Date(a.data_movimento).getTime()
          )[0]
          
          const hoje = new Date()
          const dataUltimoPagamento = new Date(ultimoPagamento.data_movimento)
          const diffTime = Math.abs(hoje.getTime() - dataUltimoPagamento.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          return diffDays
        }
      }
      return null // Nenhum pagamento encontrado
    } catch (error) {
      console.error('Erro ao calcular dias:', error)
      return null
    }
  }

  // Exibe cupom fiscal da venda (se houver) em nova janela
  const viewCupomVenda = async (vendaId?: number) => {
    if (!vendaId) {
      toast({ title: 'Comprovante indisponível', description: 'Comprovante não disponível para esta transação', variant: 'destructive' })
      return
    }
    try {
      const resp = await fetch(`/api/cupons/by-venda/${vendaId}`)
      if (!resp.ok) {
        toast({ title: 'Não encontrado', description: 'Cupom não encontrado', variant: 'destructive' })
        return
      }
      const data = await resp.json()
      const w = window.open('', '_blank')
      if (w) {
  w.document.write(`<pre class="cupom-pre">${(data.conteudo_texto || '').replace(/</g,'&lt;')}</pre>`)
        w.document.close()
        try {
          w.focus()
          setTimeout(() => {
            try { w.print() } catch (e) { /* ignore */ }
            try { w.close() } catch (e) { /* ignore */ }
          }, 200)
        } catch (e) {
          // fallback: apenas focar
        }
      }
    } catch (err) {
      console.error('Erro ao buscar cupom:', err)
      toast({ title: 'Erro', description: 'Erro ao buscar cupom', variant: 'destructive' })
    }
  }

  // Exibe comprovante simples para um pagamento (gerado a partir dos dados disponíveis)
  const viewPagamentoComprovante = (p: any, fiadoId?: number) => {
    const lines = []
    lines.push('Comprovante de Pagamento')
    lines.push('----------------------')
    const clienteForPrint = extratoCliente || pagamentoCliente
    if (clienteForPrint) lines.push(`Cliente: ${clienteForPrint.nome}`)
    if (fiadoId) lines.push(`Fiado ID: ${fiadoId}`)
    lines.push(`Valor: R$ ${Number(p.valor_pagamento || p.valor || 0).toFixed(2)}`)
    lines.push(`Forma: ${p.forma_pagamento || p.tipo || '—'}`)
    if (p.data_pagamento) lines.push(`Data: ${new Date(p.data_pagamento).toLocaleString('pt-BR')}`)
    if (p.observacoes) lines.push(`Observações: ${p.observacoes}`)

    const w = window.open('', '_blank')
    if (w) {
  w.document.write(`<pre class="cupom-pre">${lines.join('\n')}</pre>`)
      w.document.close()
      try {
        w.focus()
        setTimeout(() => {
          try { w.print() } catch (e) { /* ignore */ }
          try { w.close() } catch (e) { /* ignore */ }
        }, 200)
      } catch (e) {
        // fallback
      }
    }
  }

  // Componente Card para Fiado
  const FiadoCard = ({ 
    cliente, 
    onAbrirExtrato, 
    onAbrirPagamento, 
    pagamentoLoading
  }: {
    cliente: Cliente
    onAbrirExtrato: (cliente: Cliente) => void
    onAbrirPagamento: (cliente: Cliente) => void
    pagamentoLoading: boolean
  }) => {
    const [diasDesdeUltimoPagamento, setDiasDesdeUltimoPagamento] = useState<number | null>(null)
    const [loadingDias, setLoadingDias] = useState(false)

    useEffect(() => {
      const carregarDias = async () => {
        setLoadingDias(true)
        const dias = await calcularDiasDesdeUltimoPagamento(cliente.id)
        setDiasDesdeUltimoPagamento(dias)
        setLoadingDias(false)
      }
      carregarDias()
    }, [cliente.id])

    return (
      <div 
        className="fiado-card"
      >
        {/* Cabeçalho do Card */}
        <div className="card-header">
          <div className="cliente-info">
            <h3 className="cliente-nome">{cliente.nome}</h3>
            {diasDesdeUltimoPagamento !== null ? (
              <span className={`dias-badge ${diasDesdeUltimoPagamento > 30 ? 'atraso' : diasDesdeUltimoPagamento > 7 ? 'alerta' : 'normal'}`}>
                <Clock size={12} />
                {diasDesdeUltimoPagamento === 0 ? 'Hoje' : `${diasDesdeUltimoPagamento} dias`}
              </span>
            ) : (
              <span className="dias-badge nunca">
                <Clock size={12} />
                Nunca
              </span>
            )}
            {loadingDias && (
              <div className="dias-badge-loading">
                <div className="loading-dots">
                  <div className="dot dot1"></div>
                  <div className="dot dot2"></div>
                  <div className="dot dot3"></div>
                </div>
                <span>Calculando...</span>
              </div>
            )}
          </div>
        </div>

        {/* Corpo do Card */}
        <div className="card-body">
          <div className="card-grid">
            <div className="card-item">
              <span className="item-label">
                <DollarSign size={14} />
                Débito Atual
              </span>
              <span className="item-value debito">
                R$ {Number(cliente.debito_atual || 0).toFixed(2)}
              </span>
            </div>

            <div className="card-item">
              <span className="item-label">
                <CreditCard size={14} />
                Status
              </span>
              <span className="item-value status">
                <CheckCircle size={12} className="value-icon" />
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="card-footer-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onAbrirExtrato(cliente)}
            title="Ver extrato completo"
          >
            <FileText size={14} />
            Extrato
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onAbrirPagamento(cliente)}
            disabled={pagamentoLoading}
            title="Registrar novo pagamento"
          >
            <DollarSign size={14} />
            {pagamentoLoading ? 'Processando...' : 'Pagar'}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="content-body">
        <div className="text-center py-12">
          <div className="flex justify-center items-center mb-4">
            <Loader2 className="animate-spin" size={40} />
          </div>
          <p className="text-gray-600">Carregando fiados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-body">
      {clientesDevedores.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
            <DollarSign size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">Nenhum cliente com débito atual</p>
          <p className="text-gray-400 text-sm mt-2">Os clientes com fiados aparecerão aqui</p>
        </div>
      ) : (
        <div className="fiados-cards">
          {clientesDevedores.map((cliente, index) => (
            <FiadoCard
              key={cliente.id}
              cliente={cliente}
              onAbrirExtrato={abrirExtrato}
              onAbrirPagamento={abrirPagamento}
              pagamentoLoading={pagamentoLoading}
            />
          ))}
        </div>
      )}

      {/* Modal Registrar Pagamento */}
      <Modal isOpen={showPagamentoModal} onClose={() => setShowPagamentoModal(false)}>
        <div className="payment-modal">
          <div className="payment-header">
            <div className="payment-header-info">
              <div className="payment-header-icon">
                <DollarSign size={24} />
              </div>
              <h2 className="payment-header-title">Registrar Pagamento</h2>
            </div>
          </div>

          {pagamentoCliente && (
            <>
              <div className="payment-modal-body">
                {/* Informações do Cliente */}
                <div className="client-info-card">
                  <div className="client-info-header">
                    <div className="client-info-left">
                      <div className="client-avatar">
                        {pagamentoCliente.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="client-name">{pagamentoCliente.nome}</div>
                        <div className="client-id">Cliente ID: {pagamentoCliente.id}</div>
                      </div>
                    </div>
                    <div className="client-debt">
                      <div className="debt-amount">
                        R$ {Number(pagamentoCliente.debito_atual || 0).toFixed(2)}
                      </div>
                      <div className="debt-label">Débito Atual</div>
                    </div>
                  </div>
                </div>

                {/* Formulário de Pagamentos */}
                <div className="payment-forms-section">
                  <div className="space-y-4">
                    {pagamentosForm.map((p, idx) => (
                      <div key={idx} className="payment-form-item">
                        <div className="payment-form-header">
                          <div className="payment-form-number">{idx + 1}</div>
                          <span className="payment-form-title">Forma de Pagamento #{idx + 1}</span>
                          {pagamentosForm.length > 1 && (
                            <button 
                              className="remove-payment-btn" 
                              onClick={() => setPagamentosForm(pagamentosForm.filter((_,i) => i !== idx))}
                              title="Remover forma de pagamento"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        
                        <div className="payment-form-fields">
                          <div className="field-group">
                            <div className="input-with-icon">
                              <CreditCard size={16} className="input-icon" />
                              <select 
                                className="form-select w-full" 
                                value={p.tipo} 
                                onChange={(e) => { 
                                  const arr = [...pagamentosForm]; 
                                  arr[idx].tipo = e.target.value; 
                                  setPagamentosForm(arr) 
                                }}
                              >
                                <option value="dinheiro">Dinheiro</option>
                                <option value="cartao_debito">Cartão Débito</option>
                                <option value="cartao_credito">Cartão Crédito</option>
                                <option value="pix">PIX</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="field-group">
                            <div className="input-with-icon">
                              <DollarSign size={16} className="input-icon" />
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                max={Number(pagamentoCliente.debito_atual || 0)}
                                className="form-input w-full" 
                                value={p.valor} 
                                onChange={(e) => { 
                                  const arr = [...pagamentosForm]; 
                                  arr[idx].valor = e.target.value; 
                                  setPagamentosForm(arr) 
                                }}
                                placeholder="0,00"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      className="add-payment-btn" 
                      onClick={() => setPagamentosForm([...pagamentosForm, { tipo: 'dinheiro', valor: '' }])}
                    >
                      <Plus size={20} />
                      Adicionar outra forma
                    </button>
                  </div>
                </div>
              </div>

              {/* Botões de Ação - Fixos no rodapé */}
              <div className="payment-actions-st">
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={() => setShowPagamentoModal(false)} 
                  disabled={pagamentoLoading}
                >
                  Cancelar
                </button>
                
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => setShowConfirmacaoModal(true)} 
                  disabled={pagamentoLoading || pagamentosForm.reduce((sum, p) => sum + (Number(p.valor) || 0), 0) <= 0}
                >
                  Revisar
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal de Confirmação Final */}
      <Modal isOpen={showConfirmacaoModal} onClose={() => setShowConfirmacaoModal(false)}>
        <div className="payment-modal">
          <div className="payment-header">
            <div className="payment-header-info">
              <div className="payment-header-icon">
                <CheckCircle size={24} />
              </div>
              <h2 className="payment-header-title">Confirmar Pagamento</h2>
            </div>
            <div className="payment-date">
              {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>

          {pagamentoCliente && (
            <>
              <div className="payment-modal-body">
                {/* Resumo do Pagamento */}
                {(() => {
                  const totalPagamento = pagamentosForm.reduce((sum, p) => sum + (Number(p.valor) || 0), 0)
                  const debitoRestante = Number(pagamentoCliente.debito_atual || 0) - totalPagamento
                  const isValidPayment = totalPagamento > 0 && totalPagamento <= Number(pagamentoCliente.debito_atual || 0)

                  return (
                    <div className="payment-summary-fiados final">
                      <div className="summary-header">
                        <CheckCircle size={20} className="text-green-600" />
                        <h4 className="summary-title">Resumo do Pagamento</h4>
                      </div>

                      {/* Cards do Resumo */}
                      <div className="summary-cards">
                        {/* Card Débito Atual */}
                        <div className="summary-card">
                          <div className="summary-card-header">
                            <DollarSign size={16} className="summary-card-icon" />
                            <span className="summary-card-title">Débito Atual</span>
                          </div>
                          <div className="summary-card-value debt">
                            R$ {Number(pagamentoCliente.debito_atual || 0).toFixed(2)}
                          </div>
                        </div>

                        {/* Card Total a Pagar */}
                        <div className="summary-card">
                          <div className="summary-card-header">
                            <CreditCard size={16} className="summary-card-icon" />
                            <span className="summary-card-title">Total a Pagar</span>
                          </div>
                          <div className="summary-card-value payment">
                            R$ {totalPagamento.toFixed(2)}
                          </div>
                        </div>

                        {/* Card Restará Devendo */}
                        <div className="summary-card">
                          <div className="summary-card-header">
                            <Calculator size={16} className="summary-card-icon" />
                            <span className="summary-card-title">Restará Devendo</span>
                          </div>
                          <div className={`summary-card-value ${debitoRestante <= 0 ? 'payment' : 'remaining'}`}>
                            R$ {Math.max(0, debitoRestante).toFixed(2)}
                          </div>
                        </div>

                      </div>

                      {/* Detalhes das Formas de Pagamento */}
                      <div className="payment-details">
                        <h5 className="payment-details-title">Formas de Pagamento:</h5>
                        <div className="payment-methods-cards">
                          {pagamentosForm.map((pagamento, index) => (
                            <div key={index} className="payment-method-card">
                              <div className="payment-method-header">
                                <span className="payment-method-type">
                                  {pagamento.tipo === 'dinheiro' && 'Dinheiro'}
                                  {pagamento.tipo === 'cartao_debito' && 'Cartão Débito'}
                                  {pagamento.tipo === 'cartao_credito' && 'Cartão Crédito'}
                                  {pagamento.tipo === 'pix' && 'PIX'}
                                </span>
                                <span className="payment-method-number">#{index + 1}</span>
                              </div>
                              <div className="payment-method-value">
                                R$ {Number(pagamento.valor || 0).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Botões de Ação Final - Fixos no rodapé */}
              <div className="payment-actions-st final">
                <button
                  className="action-btn back"
                  onClick={() => setShowConfirmacaoModal(false)}
                  disabled={pagamentoLoading}
                >
                  Voltar
                </button>

                <button
                  className="action-btn confirm final"
                  onClick={registrarPagamento}
                  disabled={pagamentoLoading}
                >
                  {pagamentoLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Confirmar Pagamento
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Extrato de Fiado */}
      <Modal isOpen={showExtrato} onClose={() => setShowExtrato(false)}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Extrato de Fiado</h2>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn btn-sm btn-outline hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50" 
              onClick={imprimirExtrato}
              disabled={extratoLoading || !extratoCliente || imprimindoExtrato}
              title="Imprimir extrato"
            >
              {imprimindoExtrato ? (
                <>
                  <Loader2 className="animate-spin" size={16} style={{ marginRight: '8px' }} />
                  Gerando extrato...
                </>
              ) : (
                <>
                  <Printer size={16} />
                  Imprimir
                </>
              )}
            </button>
            <button 
              className="btn btn-sm btn-success hover:bg-green-600 transition-colors" 
              onClick={() => { if (extratoCliente) { setShowExtrato(false); abrirPagamento(extratoCliente) } }} 
              disabled={!extratoCliente || pagamentoLoading}
              title="Registrar novo pagamento"
            >
              <DollarSign size={16} />
              Pagamento
            </button>
          </div>
        </div>
        
        {extratoCliente && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-semibold text-sm">
                    {extratoCliente.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xl text-gray-800">{extratoCliente.nome}</div>
                  <div className="text-sm text-gray-600">Cliente ID: {extratoCliente.id}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  Number(extratoCliente.debito_atual || 0) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  R$ {Number(extratoCliente.debito_atual || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Débito Atual</div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t20 border-blue-200">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Limite de Crédito:</span> R$ {Number(extratoCliente.limite_credito || 0).toFixed(2)}
              </div>
              <div className="text-sm">
                <span className="font-limite">
                  {extratoCliente.limite_credito != null
                    ? `Disponível: R$ ${Math.max(0, Number(extratoCliente.limite_credito) - Number(extratoCliente.debito_atual || 0)).toFixed(2)}`
                    : 'Indisponível'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock size={18} className="text-gray-600" />
            Histórico de Movimentações
          </h3>
        </div>

        <div className="max-h-80 overflow-y-auto bg-gray-50 rounded-lg p-1">
          {extratoLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin" size={40} style={{ marginBottom: '12px' }} />
              <p className="text-gray-600 text-sm">Carregando movimentações...</p>
            </div>
          ) : movimentosExtrato.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <FileText size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-center">Nenhum movimento encontrado</p>
              <p className="text-gray-400 text-sm text-center mt-1">As transações aparecerão aqui quando realizadas</p>
            </div>
          ) : (
            <div className="space-y-3 p-2">
              {movimentosExtrato.map((movimento, index) => (
                <div key={movimento.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                        movimento.direcao === 'debito' ? 'bg-red-500' : 'bg-green-500'
                      }`}>
                        {movimento.direcao === 'debito' ? '+' : '-'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">
                            {movimento.tipo === 'lancamento' ? 'Venda a Fiado' : 
                             movimento.tipo === 'pagamento' ? 'Pagamento Recebido' : 
                             movimento.tipo.charAt(0).toUpperCase() + movimento.tipo.slice(1)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            movimento.tipo === 'lancamento' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {movimento.tipo === 'lancamento' ? 'Débito' : 'Crédito'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(movimento.data_movimento).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          movimento.direcao === 'debito' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {movimento.direcao === 'debito' ? '+' : '-'}R$ {movimento.valor.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          Saldo: R$ {movimento.saldo_corrente.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {movimento.tipo === 'pagamento' && (
                          <button
                            onClick={() => imprimirReciboMovimento(movimento.id)}
                            className="btn-recibo-small"
                            title="Imprimir recibo do pagamento"
                          >
                            <Printer size={14} />
                          </button>
                        )}
                        {movimento.tipo === 'lancamento' && movimento.venda_id && (
                          <button
                            onClick={() => imprimirSegundaViaCupom(movimento.venda_id!)}
                            className="btn-recibo-small bg-blue-500 hover:bg-blue-600"
                            title="Imprimir 2ª via do cupom"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {movimento.referencia && (
                    <div className="text-xs text-gray-500 mt-2 font-mono bg-gray-100 rounded px-2 py-1 inline-block">
                      {movimento.referencia.includes('venda') || movimento.referencia.includes('Venda') 
                        ? `Venda ${movimento.referencia.replace(/[^0-9#]/g, '')}`
                        : movimento.referencia
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

  {/* Total de movimentações e Saldo final removidos conforme solicitado */}

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Extrato atualizado em {new Date().toLocaleString('pt-BR')}
          </div>
          <button 
            className="btn btn-outline hover:bg-gray-50 transition-colors" 
            onClick={() => setShowExtrato(false)}
          >
            <X size={16} className="mr-2" />
            Fechar
          </button>
        </div>
      </Modal>

    </div>
  )
}
