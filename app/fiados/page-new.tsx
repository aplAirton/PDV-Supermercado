'use client'

import { useState, useEffect } from 'react'
import { toast } from '../../hooks/use-toast'
import { Plus, CreditCard, Clock, CheckCircle } from 'lucide-react'
import Modal from '../../components/modal'
import '../../styles/components.css'

interface Cliente {
  id: number
  nome: string
  telefone: string
}

interface Fiado {
  id: number
  cliente_id: number
  cliente_nome: string
  valor_total: number
  descricao: string
  data_criacao: string
  status: 'aberto' | 'pago'
}

export default function FiadosPage() {
  const [fiados, setFiados] = useState<Fiado[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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
      const response = await fetch('/api/vendas')
      if (response.ok) {
        const vendas = await response.json()
        // Filtrar apenas vendas fiadas
        const fiadosData = vendas.filter((venda: any) => venda.forma_pagamento === 'fiado')
        setFiados(fiadosData)
      }
    } catch (error) {
      console.error('Erro ao carregar fiados:', error)
    } finally {
      setLoading(false)
    }
  }

  const carregarClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (response.ok) {
        const clientesData = await response.json()
        setClientes(clientesData)
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
      const response = await fetch(`/api/vendas/${fiadoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          forma_pagamento: 'dinheiro' // Alterar de fiado para pago
        })
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

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '24rem', padding: '2rem' }}>
        <div className="loading" style={{ width: '2rem', height: '2rem' }}></div>
      </div>
    )
  }

  const totalEmAberto = fiados
    .filter(fiado => fiado.status === 'aberto')
    .reduce((total, fiado) => total + fiado.valor_total, 0)

  return (
    <div className="container p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Controle de Fiados</h1>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary"
        >
          <Plus size={16} />
          Novo Fiado
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Total em Aberto</h3>
              <Clock size={16} className="text-muted" />
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>
              R$ {totalEmAberto.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Fiados Ativos</h3>
              <CreditCard size={16} className="text-muted" />
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
              {fiados.filter(f => f.status === 'aberto').length}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Fiados Pagos</h3>
              <CheckCircle size={16} className="text-muted" />
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold" style={{ color: '#10b981' }}>
              {fiados.filter(f => f.status === 'pago').length}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Fiados */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Lista de Fiados</h2>
        </div>
        <div className="p-4">
          {fiados.length === 0 ? (
            <p className="text-center text-muted" style={{ padding: '1rem 0' }}>
              Nenhum fiado encontrado
            </p>
          ) : (
            <div className="space-y-4">
              {fiados.map((fiado) => (
                <div
                  key={fiado.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{fiado.cliente_nome}</h3>
                      <span 
                        className="px-2 py-1 text-xs rounded"
                        style={{
                          backgroundColor: fiado.status === 'aberto' ? '#fee2e2' : '#dcfce7',
                          color: fiado.status === 'aberto' ? '#dc2626' : '#16a34a',
                          border: `1px solid ${fiado.status === 'aberto' ? '#fecaca' : '#bbf7d0'}`
                        }}
                      >
                        {fiado.status === 'aberto' ? 'Em Aberto' : 'Pago'}
                      </span>
                    </div>
                    <p className="text-sm text-muted mb-1">
                      {fiado.descricao}
                    </p>
                    <p className="text-xs text-muted">
                      Data: {new Date(fiado.data_criacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        R$ {fiado.valor_total.toFixed(2)}
                      </p>
                    </div>
                    {fiado.status === 'aberto' && (
                      <button
                        onClick={() => marcarComoPago(fiado.id)}
                        className="btn btn-outline btn-sm"
                      >
                        Marcar como Pago
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Novo Fiado */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2 className="text-xl font-bold mb-4">Novo Fiado</h2>
        <form onSubmit={adicionarFiado} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select
              value={novoFiado.cliente_id}
              onChange={(e) => setNovoFiado({ ...novoFiado, cliente_id: e.target.value })}
              className="form-select"
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Valor Total</label>
            <input
              type="number"
              step="0.01"
              value={novoFiado.valor_total}
              onChange={(e) => setNovoFiado({ ...novoFiado, valor_total: e.target.value })}
              className="form-input"
              placeholder="0,00"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea
              value={novoFiado.descricao}
              onChange={(e) => setNovoFiado({ ...novoFiado, descricao: e.target.value })}
              className="form-input"
              rows={3}
              placeholder="Descrição dos itens ou observações"
              required
              style={{ resize: 'vertical', minHeight: '5rem' }}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Adicionar Fiado
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
