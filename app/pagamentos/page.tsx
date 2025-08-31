'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, TrendingUp, TrendingDown, Filter, Eye, Search, Download, Printer } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import '../../styles/components.css'

interface MovimentoCaixa {
  id: number
  tipo: 'entrada' | 'saida'
  categoria: 'venda_dinheiro' | 'venda_cartao' | 'venda_pix' | 'pagamento_fiado' | 'ajuste' | 'outros'
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
      case 'venda_dinheiro': return '💰'
      case 'venda_cartao': return '💳'
      case 'venda_pix': return '📱'
      case 'pagamento_fiado': return '🏦'
      case 'ajuste': return '⚙️'
      default: return '📋'
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
      <div className="page-header">
        <h1 className="page-title">
          <DollarSign size={32} />
          Controle de Pagamentos
        </h1>
        <p className="page-subtitle">Entradas e saídas do movimento de caixa</p>
      </div>

      {/* Resumo Financeiro */}
      <div className="resumo-financeiro">
        <div className="card-resumo entrada">
          <div className="card-resumo-header">
            <TrendingUp size={24} />
            <span>Total Entradas</span>
          </div>
          <div className="card-resumo-valor">
            {formatarValor(resumo.totalEntradas)}
          </div>
        </div>

        <div className="card-resumo saida">
          <div className="card-resumo-header">
            <TrendingDown size={24} />
            <span>Total Saídas</span>
          </div>
          <div className="card-resumo-valor">
            {formatarValor(resumo.totalSaidas)}
          </div>
        </div>

        <div className={`card-resumo saldo ${resumo.saldo >= 0 ? 'positivo' : 'negativo'}`}>
          <div className="card-resumo-header">
            <DollarSign size={24} />
            <span>Saldo</span>
          </div>
          <div className="card-resumo-valor">
            {formatarValor(resumo.saldo)}
          </div>
        </div>
      </div>

      {/* Detalhamento por Categoria */}
      <div className="categorias-resumo">
        <div className="categoria-item">
          <span className="categoria-icone">💰</span>
          <div className="categoria-info">
            <span className="categoria-nome">Vendas Dinheiro</span>
            <span className="categoria-valor">{formatarValor(resumo.totalVendasDinheiro)}</span>
          </div>
        </div>
        
        <div className="categoria-item">
          <span className="categoria-icone">💳</span>
          <div className="categoria-info">
            <span className="categoria-nome">Vendas Cartão</span>
            <span className="categoria-valor">{formatarValor(resumo.totalVendasCartao)}</span>
          </div>
        </div>

        <div className="categoria-item">
          <span className="categoria-icone">📱</span>
          <div className="categoria-info">
            <span className="categoria-nome">Vendas PIX</span>
            <span className="categoria-valor">{formatarValor(resumo.totalVendasPix)}</span>
          </div>
        </div>

        <div className="categoria-item">
          <span className="categoria-icone">🏦</span>
          <div className="categoria-info">
            <span className="categoria-nome">Pagamentos Fiado</span>
            <span className="categoria-valor">{formatarValor(resumo.totalPagamentosFiado)}</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="controles-section">
        <button 
          className="btn-filters-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>

        <button className="btn-secondary" onClick={exportarRelatorio}>
          <Download size={18} />
          Exportar Relatório
        </button>
      </div>

      {showFilters && (
        <div className="filters-section">
          <div className="filters-grid">
            <div className="form-group">
              <label>Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Tipo</label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                className="form-select"
              >
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
            </div>

            <div className="form-group">
              <label>Categoria</label>
              <select
                value={filtros.categoria}
                onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                className="form-select"
              >
                <option value="">Todas</option>
                <option value="venda_dinheiro">Vendas - Dinheiro</option>
                <option value="venda_cartao">Vendas - Cartão</option>
                <option value="venda_pix">Vendas - PIX</option>
                <option value="pagamento_fiado">Pagamentos de Fiado</option>
                <option value="ajuste">Ajustes</option>
              </select>
            </div>

            <div className="form-group">
              <label>Buscar</label>
              <div className="search-input">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar por descrição, referência ou cliente..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Movimentos */}
      <div className="movimentos-section">
        <div className="section-header">
          <h2>Movimentações</h2>
          <span className="movimentos-count">
            {movimentosFiltrados.length} movimento{movimentosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-spinner">Carregando movimentos...</div>
        ) : movimentosFiltrados.length === 0 ? (
          <div className="no-data">
            <DollarSign size={48} />
            <h3>Nenhum movimento encontrado</h3>
            <p>Não há movimentações para o período e filtros selecionados</p>
          </div>
        ) : (
          <div className="movimentos-list">
            {movimentosFiltrados.map((movimento) => (
              <div key={movimento.id} className={`movimento-card ${movimento.tipo}`}>
                <div className="movimento-header">
                  <div className="movimento-categoria">
                    <span className="categoria-icone">
                      {getIconeCategoria(movimento.categoria)}
                    </span>
                    <div className="movimento-info">
                      <h4 className="movimento-descricao">{movimento.descricao}</h4>
                      {movimento.referencia && (
                        <span className="movimento-referencia">{movimento.referencia}</span>
                      )}
                      {movimento.cliente_nome && (
                        <span className="movimento-cliente">Cliente: {movimento.cliente_nome}</span>
                      )}
                    </div>
                  </div>
                  <div className="movimento-actions">
                    <div className={`movimento-valor ${movimento.tipo}`}>
                      <span className="valor-sinal">{movimento.tipo === 'entrada' ? '+' : '-'}</span>
                      {formatarValor(Math.abs(movimento.valor))}
                    </div>
                    <button
                      onClick={() => imprimirRecibo(movimento.id)}
                      className="btn-recibo"
                      title="Imprimir recibo"
                    >
                      <Printer size={16} />
                      Recibo
                    </button>
                  </div>
                </div>
                
                <div className="movimento-footer">
                  <span className="movimento-data">{formatarData(movimento.data_movimento)}</span>
                  {movimento.forma_pagamento && (
                    <span className="movimento-forma">{movimento.forma_pagamento}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
