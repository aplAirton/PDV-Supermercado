'use client'

import { useState, useEffect } from 'react'
import { Calculator, User, DollarSign, Clock, TrendingUp, Plus, Settings, Eye, AlertCircle, CheckCircle, Loader2, ArrowUp, ArrowDown, Filter } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import '../../styles/caixa.css'

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
  const [filtro, setFiltro] = useState<'todos' | 'aberto' | 'fechado'>('todos')
  
  const [novoForm, setNovoForm] = useState({
    funcionario_id: '',
    valor_inicial: '',
    observacoes: ''
  })

  useEffect(() => {
    carregarDados()
  }, [])

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
    try {
      const response = await fetch('/api/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionario_id: parseInt(novoForm.funcionario_id),
          valor_inicial: parseFloat(novoForm.valor_inicial) || 0,
          observacoes_abertura: novoForm.observacoes
        })
      })

      if (response.ok) {
        toast({
          title: "Caixa aberto com sucesso",
          description: "O caixa foi aberto e está pronto para operação"
        })
        setShowNovoModal(false)
        setNovoForm({ funcionario_id: '', valor_inicial: '', observacoes: '' })
        carregarDados()
      } else {
        throw new Error('Erro ao abrir caixa')
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
                          // Ver detalhes
                        }}
                        className="btn btn-sm btn-outline"
                        title="Ver detalhes"
                      >
                        <Eye size={14} />
                      </button>
                      {caixa.status === 'aberto' && (
                        <button
                          onClick={() => {
                            // Fechar caixa
                          }}
                          className="btn btn-sm btn-outline danger"
                          title="Fechar caixa"
                        >
                          Fechar
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
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="funcionario" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Funcionário
                </label>
                <select
                  id="funcionario"
                  value={novoForm.funcionario_id}
                  onChange={(e) => setNovoForm({...novoForm, funcionario_id: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Selecione um funcionário</option>
                  {funcionarios.map((funcionario) => (
                    <option key={funcionario.id} value={funcionario.id}>
                      {funcionario.nome} - {funcionario.cargo}
                    </option>
                  ))}
                </select>
              </div>

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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowNovoModal(false)} 
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Abrir Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
