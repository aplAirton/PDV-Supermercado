'use client'

import { useState, useEffect } from 'react'
import { Plus, CreditCard, Clock, CheckCircle, Eye, DollarSign, FileText, Printer, Trash2, Calculator } from 'lucide-react'
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
}

export default function FiadosPage() {
  const [fiados, setFiados] = useState<Fiado[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '24rem', padding: '2rem' }}>
        <div className="loading" style={{ width: '2rem', height: '2rem' }}></div>
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
      const response = await fetch(`/api/fiados/${extratoCliente.id}/extrato/cupom`)
      if (response.ok) {
        const data = await response.json()
        
        // Abrir nova janela para impressão
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Extrato de Fiado - ${extratoCliente.nome}</title>
                <style>
                  body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
                  pre { white-space: pre-wrap; word-wrap: break-word; }
                  .print-button { margin-bottom: 20px; }
                  @media print { .print-button { display: none; } }
                </style>
              </head>
              <body>
                <div class="print-button">
                  <button onclick="window.print()">Imprimir</button>
                  <button onclick="window.close()">Fechar</button>
                </div>
                <pre>${data.cupom}</pre>
              </body>
            </html>
          `)
          printWindow.document.close()
        }
      } else {
        toast({ title: 'Erro', description: 'Erro ao gerar cupom de extrato', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Erro ao imprimir extrato:', error)
      toast({ title: 'Erro', description: 'Erro ao imprimir extrato', variant: 'destructive' })
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
        w.document.write(`<pre style="font-family: 'Courier New', Courier, monospace; white-space: pre-wrap;">${(data.conteudo_texto || '').replace(/</g,'&lt;')}</pre>`)
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
      w.document.write(`<pre style="font-family: 'Courier New', Courier, monospace; white-space: pre-wrap;">${lines.join('\n')}</pre>`)
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

  return (
    <div className="container p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes com Débito</h1>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Devedores</h2>
        </div>
        <div className="p-4">
          {clientesDevedores.length === 0 ? (
            <p className="text-center text-muted">Nenhum cliente com débito atual</p>
          ) : (
            <div className="space-y-3">
              {clientesDevedores.map(cliente => (
                <div key={cliente.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">{cliente.nome}</div>
                    <div className="text-sm text-muted">Débito: R$ {Number(cliente.debito_atual || 0).toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    {/* botão Visualizar removido: extrato substitui esta função */}
                    <button className="btn btn-sm btn-secondary" onClick={() => abrirExtrato(cliente)}>
                      <FileText size={14} />
                      Extrato
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={() => abrirPagamento(cliente)} disabled={pagamentoLoading}>
                      <DollarSign size={14} />
                      {pagamentoLoading ? 'Registrando pagamento...' : 'Registrar Pagamento'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

  {/* Modal Visualizar removido: função substituída pelo Extrato */}

      {/* Modal Registrar Pagamento */}
      <Modal isOpen={showPagamentoModal} onClose={() => setShowPagamentoModal(false)}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Registrar Pagamento</h2>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>

        {pagamentoCliente && (
          <div>
            {/* Informações do Cliente */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                    <span className="text-green-700 font-semibold text-sm">
                      {pagamentoCliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-800">{pagamentoCliente.nome}</div>
                    <div className="text-sm text-gray-600">Cliente ID: {pagamentoCliente.id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-600 font-bold text-xl">
                    R$ {Number(pagamentoCliente.debito_atual || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Débito Atual</div>
                </div>
              </div>
            </div>

            {/* Calculadora de Pagamento */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator size={18} className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">Formas de Pagamento</h3>
              </div>

              <div className="space-y-4">
                {pagamentosForm.map((p, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-xs">{idx + 1}</span>
                      </div>
                      <span className="font-medium text-gray-700">Forma de Pagamento #{idx + 1}</span>
                      {pagamentosForm.length > 1 && (
                        <button 
                          className="ml-auto w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors" 
                          onClick={() => setPagamentosForm(pagamentosForm.filter((_,i) => i !== idx))}
                          title="Remover forma de pagamento"
                        >
                          <Trash2 size={12} className="text-red-600" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                        <div className="relative">
                          <select 
                            className="form-select w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" 
                            value={p.tipo} 
                            onChange={(e) => { 
                              const arr = [...pagamentosForm]; 
                              arr[idx].tipo = e.target.value; 
                              setPagamentosForm(arr) 
                            }}
                          >
                            <option value="dinheiro">💵 Dinheiro</option>
                            <option value="cartao_debito">💳 Cartão Débito</option>
                            <option value="cartao_credito">💳 Cartão Crédito</option>
                            <option value="pix">📱 PIX</option>
                          </select>
                          <CreditCard size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            max={Number(pagamentoCliente.debito_atual || 0)}
                            className="form-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                            value={p.valor} 
                            onChange={(e) => { 
                              const arr = [...pagamentosForm]; 
                              arr[idx].valor = e.target.value; 
                              setPagamentosForm(arr) 
                            }}
                            placeholder="0,00"
                          />
                          <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2" 
                  onClick={() => setPagamentosForm([...pagamentosForm, { tipo: 'dinheiro', valor: '' }])}
                >
                  <Plus size={18} />
                  Adicionar Forma de Pagamento
                </button>
              </div>
            </div>

            {/* Resumo do Pagamento */}
            {(() => {
              const totalPagamento = pagamentosForm.reduce((sum, p) => sum + (Number(p.valor) || 0), 0)
              const debitoRestante = Number(pagamentoCliente.debito_atual || 0) - totalPagamento
              const isValidPayment = totalPagamento > 0 && totalPagamento <= Number(pagamentoCliente.debito_atual || 0)
              
              return (
                <div className={`mb-6 p-4 rounded-xl border ${
                  totalPagamento === 0 
                    ? 'bg-gray-50 border-gray-200' 
                    : isValidPayment 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={18} className={
                      totalPagamento === 0 
                        ? 'text-gray-400' 
                        : isValidPayment 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    } />
                    <h4 className="font-semibold text-gray-800">Resumo do Pagamento</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Débito Atual:</span>
                      <div className="font-bold text-lg text-red-600">
                        R$ {Number(pagamentoCliente.debito_atual || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total a Pagar:</span>
                      <div className={`font-bold text-lg ${
                        totalPagamento === 0 ? 'text-gray-500' : 'text-green-600'
                      }`}>
                        R$ {totalPagamento.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Restará Devendo:</span>
                      <div className={`font-bold text-lg ${
                        debitoRestante <= 0 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        R$ {Math.max(0, debitoRestante).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className={`font-medium text-sm ${
                        totalPagamento === 0 
                          ? 'text-gray-500' 
                          : isValidPayment 
                          ? debitoRestante <= 0 ? 'text-green-600' : 'text-orange-600'
                          : 'text-red-600'
                      }`}>
                        {totalPagamento === 0 
                          ? 'Aguardando valores' 
                          : isValidPayment 
                          ? debitoRestante <= 0 ? '✅ Quitado' : '⚠️ Parcial'
                          : '❌ Valor inválido'
                        }
                      </div>
                    </div>
                  </div>

                  {!isValidPayment && totalPagamento > 0 && (
                    <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-sm">
                      ⚠️ O valor total não pode exceder o débito atual do cliente.
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button 
                className="flex-1 btn btn-outline hover:bg-gray-50 transition-colors" 
                onClick={() => setShowPagamentoModal(false)} 
                disabled={pagamentoLoading}
              >
                <Eye size={16} className="mr-2" />
                Cancelar
              </button>
              
              <button 
                className="flex-2 btn btn-success hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={registrarPagamento} 
                disabled={pagamentoLoading || pagamentosForm.reduce((sum, p) => sum + (Number(p.valor) || 0), 0) <= 0}
              >
                {pagamentoLoading ? (
                  <>
                    <div className="loading" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                    Processando Pagamento...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Confirmar Pagamento
                  </>
                )}
              </button>
            </div>
          </div>
        )}
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
              className="btn btn-sm btn-outline hover:bg-blue-50 hover:border-blue-300 transition-colors" 
              onClick={imprimirExtrato}
              disabled={extratoLoading || !extratoCliente}
              title="Imprimir extrato"
            >
              <Printer size={16} />
              Imprimir
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
            <div className="flex justify-between items-center pt-2 border-t border-blue-200">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Limite de Crédito:</span> R$ {Number(extratoCliente.limite_credito || 0).toFixed(2)}
              </div>
              <div className="text-sm">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  Number(extratoCliente.debito_atual || 0) === 0 
                    ? 'bg-green-100 text-green-800'
                    : Number(extratoCliente.debito_atual || 0) >= Number(extratoCliente.limite_credito || 0) * 0.8
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {Number(extratoCliente.debito_atual || 0) === 0 
                    ? 'Em dia'
                    : Number(extratoCliente.debito_atual || 0) >= Number(extratoCliente.limite_credito || 0) * 0.8
                    ? 'Limite alto'
                    : 'Devendo'
                  }
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
              <div className="loading" style={{ width: '40px', height: '40px', marginBottom: '12px' }}></div>
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
                  </div>
                  {movimento.descricao && (
                    <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">
                      <strong>Descrição:</strong> {movimento.descricao}
                    </div>
                  )}
                  {movimento.referencia && (
                    <div className="text-xs text-gray-500 mt-2 font-mono bg-gray-100 rounded px-2 py-1 inline-block">
                      ID: {movimento.referencia}
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
            <Eye size={16} className="mr-2" />
            Fechar
          </button>
        </div>
      </Modal>

    </div>
  )
}
