'use client'

import { useState, useEffect } from 'react'
import { Plus, CreditCard, Clock, CheckCircle, Eye, DollarSign } from 'lucide-react'
import Modal from '@/components/modal'
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

export default function FiadosPage() {
  const [fiados, setFiados] = useState<Fiado[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showVisualizar, setShowVisualizar] = useState(false)
  const [visualizarCliente, setVisualizarCliente] = useState<Cliente | null>(null)
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [pagamentoCliente, setPagamentoCliente] = useState<Cliente | null>(null)
  const [pagamentosForm, setPagamentosForm] = useState<Array<{ tipo: string; valor: string }>>([{ tipo: 'dinheiro', valor: '' }])
  const [pagamentoLoading, setPagamentoLoading] = useState(false)
  const [fiadosComPagamentos, setFiadosComPagamentos] = useState<Record<number, any[]>>({})

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
        alert('Erro ao adicionar fiado')
      }
    } catch (error) {
      console.error('Erro ao adicionar fiado:', error)
      alert('Erro ao adicionar fiado')
    }
  }

  const marcarComoPago = async (fiadoId: number) => {
    try {
      // Buscar venda atual para ler pagamentos e cliente
      const resp = await fetch(`/api/vendas/${fiadoId}`)
      if (!resp.ok) {
        alert('Venda não encontrada')
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
        alert('Erro ao marcar como pago')
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      alert('Erro ao marcar como pago')
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

  const abrirVisualizar = async (cliente: Cliente) => {
    setVisualizarCliente(cliente)
    setShowVisualizar(true)

    // Carregar fiados atualizados e filtrar por cliente
    const fiadosData = await carregarFiados()
    const fiadosCliente = (Array.isArray(fiadosData) ? fiadosData : fiados).filter((f: any) => f.cliente_id === cliente.id)

    const map: Record<number, any[]> = {}
    for (const f of fiadosCliente) {
      try {
        const pagamentos = await carregarPagamentosDoFiado(f.id)
        map[f.id] = pagamentos
      } catch (e) {
        map[f.id] = []
      }
    }
    setFiadosComPagamentos(map)
  }

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
        alert('Informe um valor de pagamento válido maior que zero.')
        setPagamentoLoading(false)
        return
      }

      if (somaArred > debitoCliente) {
        alert(`O valor total informado (R$ ${somaArred.toFixed(2)}) excede o débito atual do cliente (R$ ${debitoCliente.toFixed(2)}). Ajuste os valores para não pagar mais que o devido.`)
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
        alert('Pagamento registrado com sucesso')
      } else {
        const err = await response.json()
        alert(err?.error || 'Erro ao registrar pagamento')
      }
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      alert('Erro ao registrar pagamento')
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
                    <button className="btn btn-sm btn-outline" onClick={() => abrirVisualizar(cliente)}>
                      <Eye size={14} />
                      Visualizar
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

      {/* Modal Visualizar */}
      <Modal isOpen={showVisualizar} onClose={() => setShowVisualizar(false)}>
        <h2 className="text-xl font-bold mb-4">Resumo do Cliente</h2>
        {visualizarCliente ? (
          <div>
            {/* Cabeçalho com informações principais e totais */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{visualizarCliente.nome}</div>
                <div className="text-sm text-muted">{visualizarCliente.telefone}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div>Débito atual: <strong>R$ {Number(visualizarCliente.debito_atual || 0).toFixed(2)}</strong></div>
                <div>Limite crédito: <strong>R$ {Number(visualizarCliente.limite_credito || 0).toFixed(2)}</strong></div>
                <div>Limite disponível: <strong>R$ {Number(Math.max(0, (visualizarCliente.limite_credito || 0) - (visualizarCliente.debito_atual || 0))).toFixed(2)}</strong></div>
              </div>
            </div>

            {/* Totais consolidados */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              {(() => {
                const fiadosCliente = fiados.filter(f => f.cliente_id === visualizarCliente.id)
                const totalOriginal = fiadosCliente.reduce((s, f) => s + Number(f.valor_original ?? f.valor_total ?? 0), 0)
                const totalPago = fiadosCliente.reduce((s, f) => s + Number(f.valor_pago || 0), 0)
                const totalRestante = fiadosCliente.reduce(
                  (s, f) => s + Number((f.valor_restante != null) ? f.valor_restante : ((f.valor_original ?? 0) - (f.valor_pago || 0))),
                  0,
                )
                return (
                  <>
                    <div style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)' }}>
                      <div className="text-sm text-muted">Total Fiados</div>
                      <div style={{ fontWeight: 700 }}>R$ {Number(totalOriginal).toFixed(2)}</div>
                    </div>
                    <div style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)' }}>
                      <div className="text-sm text-muted">Total Pago</div>
                      <div style={{ fontWeight: 700 }}>R$ {Number(totalPago).toFixed(2)}</div>
                    </div>
                    <div style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)' }}>
                      <div className="text-sm text-muted">Restante</div>
                      <div style={{ fontWeight: 700, color: totalRestante > 0 ? 'var(--warning-color)' : 'var(--success-color)' }}>R$ {Number(totalRestante).toFixed(2)}</div>
                    </div>
                  </>
                )
              })()}
            </div>

            <div>
              <h3 className="font-semibold">Lançamentos</h3>
              <div className="space-y-3" style={{ marginTop: '0.5rem' }}>
                {fiados.filter(f => f.cliente_id === visualizarCliente.id).map(f => (
                  <div key={f.id} className="p-3 border rounded-lg" style={{ background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>R$ {Number(calcularValorFiado(f)).toFixed(2)} <span style={{ fontWeight: 500, color: '#666', marginLeft: '0.5rem' }}>{f.descricao}</span></div>
                        <div className="text-sm text-muted">Venda ID: {f.venda_id ?? '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem' }}>Data: {f.data_criacao ? new Date(f.data_criacao).toLocaleDateString('pt-BR') : '—'}</div>
                        <div style={{ marginTop: '0.25rem' }}>
                          <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: f.status === 'quitado' ? 'var(--success-color)' : 'var(--surface)', color: f.status === 'quitado' ? 'white' : 'inherit', fontSize: '0.8rem' }}>{f.status}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="text-sm text-muted">Detalhes financeiros</div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                        <div>Original: <strong>R$ {Number(f.valor_original ?? f.valor_total ?? 0).toFixed(2)}</strong></div>
                        <div>Pago: <strong>R$ {Number(f.valor_pago || 0).toFixed(2)}</strong></div>
                        <div>Restante: <strong>R$ {Number(f.valor_restante != null ? f.valor_restante : ((f.valor_original ?? 0) - (f.valor_pago || 0))).toFixed(2)}</strong></div>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <strong>Pagamentos:</strong>
                      <ul className="list-disc ml-5" style={{ marginTop: '0.25rem' }}>
                        {(fiadosComPagamentos[f.id] || []).map((p, i) => (
                          <li key={i}>R$ {Number(p.valor_pagamento).toFixed(2)} — {p.forma_pagamento} — {new Date(p.data_pagamento).toLocaleDateString('pt-BR')}</li>
                        ))}
                        {(fiadosComPagamentos[f.id] || []).length === 0 && <li className="text-sm text-muted">Nenhum pagamento registrado</li>}
                      </ul>
                    </div>
                  </div>
                ))}
                {fiados.filter(f => f.cliente_id === visualizarCliente.id).length === 0 && (
                  <div className="text-sm text-muted">Nenhum lançamento encontrado para esse cliente.</div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end" style={{ marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowVisualizar(false)}>Fechar</button>
              <button className="btn btn-primary" onClick={() => { setShowVisualizar(false); abrirPagamento(visualizarCliente) }}>Registrar Pagamento</button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal Registrar Pagamento */}
      <Modal isOpen={showPagamentoModal} onClose={() => setShowPagamentoModal(false)}>
        <h2 className="text-xl font-bold mb-4">Registrar Pagamento</h2>
        {pagamentoCliente && (
          <div>
            <div className="mb-2">Cliente: <strong>{pagamentoCliente.nome}</strong></div>
            <div className="mb-2">Débito atual: R$ {Number(pagamentoCliente.debito_atual || 0).toFixed(2)}</div>

            <div className="form-group mb-3">
              <label className="form-label">Formas de Pagamento</label>
              <div className="space-y-2">
                {pagamentosForm.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select className="form-select" value={p.tipo} onChange={(e) => { const arr = [...pagamentosForm]; arr[idx].tipo = e.target.value; setPagamentosForm(arr) }} style={{ width: '50%' }}>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_debito">Cartão Débito</option>
                      <option value="cartao_credito">Cartão Crédito</option>
                      <option value="pix">PIX</option>
                    </select>
                    <input type="number" step="0.01" className="form-input" value={p.valor} onChange={(e) => { const arr = [...pagamentosForm]; arr[idx].valor = e.target.value; setPagamentosForm(arr) }} style={{ width: '35%' }} />
                    {pagamentosForm.length > 1 && <button className="btn btn-xs btn-danger" onClick={() => setPagamentosForm(pagamentosForm.filter((_,i) => i !== idx))}>Remover</button>}
                  </div>
                ))}
                <div>
                  <button className="btn btn-sm btn-outline" onClick={() => setPagamentosForm([...pagamentosForm, { tipo: 'dinheiro', valor: '' }])}>Adicionar forma</button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button className="btn btn-outline" onClick={() => setShowPagamentoModal(false)} disabled={pagamentoLoading}>Cancelar</button>
              <button className="btn btn-primary" onClick={registrarPagamento} disabled={pagamentoLoading}>
                {pagamentoLoading ? (
                  <>
                    <div className="loading" style={{ width: '14px', height: '14px', marginRight: '8px' }}></div>
                    Registrando pagamento...
                  </>
                ) : (
                  'Confirmar Pagamento'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
