'use client'

import { useState, useEffect } from 'react'
import { Ban, Calendar, DollarSign, TrendingUp, TrendingDown, Filter, Eye, Search, Download, Printer, CreditCard, Smartphone, Layers, Settings, FileText, LucideFileQuestion, LucideCheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import '../../styles/pagamentos-new.css'

interface MovimentoCaixa {
  id: number
  tipo: 'entrada' | 'saida'
  categoria: 'venda_dinheiro' | 'venda_cartao' | 'venda_pix' | 'venda_multiplas' | 'pagamento_fiado' | 'ajuste' | 'outros'
  valor: number
  descricao: string
  referencia?: string
  forma_pagamento?: string
  data_movimento: string
  cliente_nome?: string
}

interface ResumoFinanceiro {
  totalEntradas: number
  totalSaidas: number
  saldo: number
  totalVendasDinheiro: number
  totalVendasCartao: number
  totalVendasPix: number
  totalVendasMultiplas: number
  totalPagamentosFiado: number
}

export default function PagamentosPage() {
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([])
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalEntradas: 0,
    totalSaidas: 0,
    saldo: 0,
    totalVendasDinheiro: 0,
    totalVendasCartao: 0,
    totalVendasPix: 0,
    totalVendasMultiplas: 0,
    totalPagamentosFiado: 0
  })
  const [filtros, setFiltros] = useState({
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    tipo: '', // 'entrada' | 'saida' | ''
    categoria: '', // categoria específica ou ''
    busca: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [filtros.dataInicio, filtros.dataFim, filtros.tipo, filtros.categoria])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        ...(filtros.tipo && { tipo: filtros.tipo }),
        ...(filtros.categoria && { categoria: filtros.categoria })
      })

      const response = await fetch(`/api/pagamentos/movimentos?${params}`)
      if (!response.ok) throw new Error('Erro ao carregar movimentos')
      
      const data = await response.json()
      setMovimentos(data.movimentos || [])
      setResumo(data.resumo || {})
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os movimentos financeiros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const movimentosFiltrados = movimentos.filter(movimento => {
    if (!filtros.busca) return true
    const busca = filtros.busca.toLowerCase()
    return movimento.descricao.toLowerCase().includes(busca) ||
           movimento.referencia?.toLowerCase().includes(busca) ||
           movimento.cliente_nome?.toLowerCase().includes(busca)
  })

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

const getIconeCategoria = (categoria: string) => {
    switch (categoria) {
        case 'venda_dinheiro':
            return <DollarSign size={18} />
        case 'venda_cartao':
            return <CreditCard size={18} />
        case 'venda_pix':
            return <Smartphone size={18} />
        case 'venda_multiplas':
            return <Layers size={18} />
        case 'pagamento_fiado':
            return <LucideCheckCircle size={18} />
        case 'ajuste':
            return <Settings size={18} />
        default:
            return <FileText size={18} />
    }
}

  const exportarRelatorio = async () => {
    try {
      const params = new URLSearchParams({
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        tipo: filtros.tipo,
        categoria: filtros.categoria,
        formato: 'csv'
      })

      const response = await fetch(`/api/pagamentos/relatorio?${params}`)
      if (!response.ok) throw new Error('Erro ao gerar relatório')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-financeiro-${filtros.dataInicio}-${filtros.dataFim}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Relatório exportado",
        description: "Download iniciado com sucesso"
      })
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o relatório",
        variant: "destructive"
      })
    }
  }

  const imprimirRecibo = async (movimentoId: number) => {
    try {
      const url = `/api/pagamentos/${movimentoId}/recibo`
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

  return (
    <div className="pagamentos-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1>Controle de Pagamentos</h1>
          <p>Gestão financeira completa</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filtros
          </button>
          <button className="btn btn-primary" onClick={exportarRelatorio}>
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de Totais - 3 em linha */}
      <div className="totals-grid">
        <div className="total-card entrada">
          <div className="card-icon">
            <TrendingUp size={20} />
          </div>
          <div className="card-content">
            <span className="card-label">Entradas</span>
            <span className="card-value">{formatarValor(resumo.totalEntradas)}</span>
          </div>
        </div>
        
        <div className="total-card saida">
          <div className="card-icon">
            <TrendingDown size={20} />
          </div>
          <div className="card-content">
            <span className="card-label">Saídas</span>
            <span className="card-value">{formatarValor(resumo.totalSaidas)}</span>
          </div>
        </div>
        
        <div className={`total-card saldo ${resumo.saldo >= 0 ? 'positivo' : 'negativo'}`}>
          <div className="card-icon">
            <DollarSign size={20} />
          </div>
          <div className="card-content">
            <span className="card-label">Saldo</span>
            <span className="card-value">{formatarValor(resumo.saldo)}</span>
          </div>
        </div>
      </div>

      {/* Detalhamento por Tipo */}
      <div className="detail-section">
        <h2>Detalhamento por Forma de Pagamento</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <DollarSign size={16} />
            <span>Dinheiro</span>
            <strong>{formatarValor(resumo.totalVendasDinheiro)}</strong>
          </div>
          <div className="detail-item">
            <CreditCard size={16} />
            <span>Cartão</span>
            <strong>{formatarValor(resumo.totalVendasCartao)}</strong>
          </div>
          <div className="detail-item">
            <Smartphone size={16} />
            <span>PIX</span>
            <strong>{formatarValor(resumo.totalVendasPix)}</strong>
          </div>
          <div className="detail-item">
            <Layers size={16} />
            <span>Múltiplas</span>
            <strong>{formatarValor(resumo.totalVendasMultiplas)}</strong>
          </div>
          <div className="detail-item">
            <LucideCheckCircle size={16} />
            <span>Fiado</span>
            <strong>{formatarValor(resumo.totalPagamentosFiado)}</strong>
          </div>
        </div>
      </div>
      {/* Filtros */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="input"
              />
            </div>
            <div className="filter-group">
              <label>Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                className="input"
              />
            </div>
            <div className="filter-group">
              <label>Tipo</label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                className="select"
              >
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Categoria</label>
              <select
                value={filtros.categoria}
                onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                className="select"
              >
                <option value="">Todas</option>
                <option value="venda_dinheiro">Dinheiro</option>
                <option value="venda_cartao">Cartão</option>
                <option value="venda_pix">PIX</option>
                <option value="venda_multiplas">Múltiplas</option>
                <option value="pagamento_fiado">Fiado</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Buscar</label>
              <div className="search-container">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  className="input search"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Movimentos */}
      <div className="movements-section">
        <div className="movements-header">
          <h2>Movimentações</h2>
          <span className="movements-count">
            {movimentosFiltrados.length} movimento{movimentosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Carregando...</span>
          </div>
        ) : movimentosFiltrados.length === 0 ? (
          <div className="empty">
            <DollarSign size={32} />
            <h3>Nenhum movimento encontrado</h3>
            <p>Não há movimentações para os filtros selecionados</p>
          </div>
        ) : (
          <div className="movements-list">
            {movimentosFiltrados.map((movimento) => (
              <div key={movimento.id} className="movement-card">
                <div className="movement-left">
                  <div className={`movement-type ${movimento.tipo}`}>
                    {getIconeCategoria(movimento.categoria)}
                  </div>
                  <div className="movement-info">
                    <h3>{movimento.descricao}</h3>
                    <div className="movement-meta">
                      <span className="date">{formatarData(movimento.data_movimento)}</span>
                      {movimento.referencia && <span className="ref">Ref: {movimento.referencia}</span>}
                      {movimento.cliente_nome && <span className="client">Cliente: {movimento.cliente_nome}</span>}
                      {movimento.forma_pagamento && <span className="payment">{movimento.forma_pagamento}</span>}
                    </div>
                  </div>
                </div>
                <div className="movement-right">
                  <div className={`movement-value ${movimento.tipo}`}>
                    {movimento.tipo === 'entrada' ? '+' : '-'} {formatarValor(Math.abs(movimento.valor))}
                  </div>
                  <button
                    onClick={() => imprimirRecibo(movimento.id)}
                    className="btn btn-sm"
                    title="Imprimir recibo"
                  >
                    <Printer size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
