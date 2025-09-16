'use client'

import { useState, useEffect } from 'react'
import { Ban, Calendar, ArrowDownUp, DollarSign, Banknote, TrendingUp, TrendingDown, Filter, Eye, Search, Download, Printer, CreditCard, Smartphone, Layers, Settings, FileText, LucideFileQuestion, LucideCheckCircle, Loader2, Menu, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import LoadingModal from '../../components/loading-modal'
import '../../styles/pagamentos-new.css'

interface MovimentoCaixa {
  id: number
  tipo: 'entrada' | 'saida'
  categoria: 'venda_dinheiro' | 'venda_cartao' | 'venda_pix' | 'venda_multiplas' | 'pagamento_fiado' | 'pagamento_fornecedor' | 'ajuste' | 'outros'
  valor: number
  descricao: string
  referencia?: string
  forma_pagamento?: string
  forma_pagamento_json?: string | null
  valor_pago?: number | null
  troco?: number | null
  data_movimento: string
  cliente_nome?: string
}

interface ResumoFinanceiro {
  totalEntradas: number
  totalSaidas: number
  saldo: number
  totalVendasDinheiro: number
  totalVendasCartaoDebito: number
  totalVendasCartaoCredito: number
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
    totalVendasCartaoDebito: 0,
    totalVendasCartaoCredito: 0,
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
  const [showExtratosModal, setShowExtratosModal] = useState(false)
  const [loadingComprovante, setLoadingComprovante] = useState(false)

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

  // Função para verificar se há filtros ativos
  const temFiltrosAtivos = () => {
    return filtros.tipo !== '' || 
           filtros.categoria !== '' || 
           filtros.busca !== '' ||
           filtros.dataInicio !== new Date().toISOString().split('T')[0] ||
           filtros.dataFim !== new Date().toISOString().split('T')[0]
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

const renderFormasPagamento = (movimento: MovimentoCaixa) => {
  // Exibir formas como pills com valor (mantendo dimensões do card)
  if (movimento.forma_pagamento_json) {
    try {
      const arr = JSON.parse(movimento.forma_pagamento_json)
      if (Array.isArray(arr) && arr.length > 0) {
        return (
          <div className="formas-pagamento-pills">
            {arr.map((p: any, idx: number) => {
              const tipoRaw = (p.tipo || p.tipo_pagamento || '').toString()
              const valor = Number(p.valor || 0)
              const labelMap: Record<string, {label: string, class?: string}> = {
                dinheiro: { label: 'Dinheiro', class: 'fp-dinheiro' },
                cartao_debito: { label: 'Cartão Débito', class: 'fp-cartao-debito' },
                cartao_credito: { label: 'Cartão Crédito', class: 'fp-cartao-credito' },
                pix: { label: 'PIX', class: 'fp-pix' },
                fiado: { label: 'Fiado', class: 'fp-fiado' }
              }
              const meta = labelMap[tipoRaw] || { label: tipoRaw.replace(/_/g, ' '), class: '' }

              // não renderizar fiado nos totais do resumo — mas exibição no card é permitida
              return (
                <div key={idx} className={`forma-pill ${meta.class}`} title={`${meta.label}: ${formatarValor(valor)}`}>
                  <span className="pill-label">{meta.label}</span>
                  <span className="pill-valor">{formatarValor(valor)}</span>
                </div>
              )
            })}
          </div>
        )
      }
    } catch (e) {
      return movimento.forma_pagamento || null
    }
  }

  return movimento.forma_pagamento || null
}

  if (loading) {
    return (
      <div className="pagamentos-container">
        {/* Header Skeleton */}
        <div className="page-header">
          <div className="header-actions">
            <div className="skeleton skeleton-button-primary"></div>
          </div>
        </div>

        {/* Card de Filtros Skeleton */}
        <div className="pagamentos-filter-section card mb-4">
          <div className="skeleton skeleton-button" style={{ width: '200px', height: '40px', marginBottom: '16px' }}></div>
          <div className="pagamentos-filter-options expanded">
            <div className="pagamentos-filters-grid">
              <div className="form-group">
                <div className="skeleton skeleton-label" style={{ width: '100px', height: '16px', marginBottom: '8px' }}></div>
                <div className="skeleton skeleton-input" style={{ width: '100%', height: '40px' }}></div>
              </div>
              <div className="form-group">
                <div className="skeleton skeleton-label" style={{ width: '80px', height: '16px', marginBottom: '8px' }}></div>
                <div className="skeleton skeleton-input" style={{ width: '100%', height: '40px' }}></div>
              </div>
              <div className="form-group">
                <div className="skeleton skeleton-label" style={{ width: '60px', height: '16px', marginBottom: '8px' }}></div>
                <div className="skeleton skeleton-select" style={{ width: '100%', height: '40px' }}></div>
              </div>
              <div className="form-group">
                <div className="skeleton skeleton-label" style={{ width: '90px', height: '16px', marginBottom: '8px' }}></div>
                <div className="skeleton skeleton-select" style={{ width: '100%', height: '40px' }}></div>
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <div className="skeleton skeleton-label" style={{ width: '120px', height: '16px', marginBottom: '8px' }}></div>
              <div className="skeleton skeleton-input" style={{ width: '100%', height: '40px' }}></div>
            </div>
            <div className="filter-actions" style={{ gridColumn: '1 / -1' }}>
              <div className="skeleton skeleton-button" style={{ width: '100px', height: '40px' }}></div>
              <div className="skeleton skeleton-button" style={{ width: '120px', height: '40px' }}></div>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro Skeleton */}
        <div className="pagamentos-resumo-grid">
          <div className="resumo-card">
            <div className="skeleton skeleton-icon" style={{ width: '48px', height: '48px', borderRadius: '50%', marginBottom: '12px' }}></div>
            <div className="skeleton skeleton-label" style={{ width: '120px', height: '16px', marginBottom: '8px' }}></div>
            <div className="skeleton skeleton-value" style={{ width: '100px', height: '24px' }}></div>
          </div>
          <div className="resumo-card">
            <div className="skeleton skeleton-icon" style={{ width: '48px', height: '48px', borderRadius: '50%', marginBottom: '12px' }}></div>
            <div className="skeleton skeleton-label" style={{ width: '100px', height: '16px', marginBottom: '8px' }}></div>
            <div className="skeleton skeleton-value" style={{ width: '90px', height: '24px' }}></div>
          </div>
          <div className="resumo-card">
            <div className="skeleton skeleton-icon" style={{ width: '48px', height: '48px', borderRadius: '50%', marginBottom: '12px' }}></div>
            <div className="skeleton skeleton-label" style={{ width: '80px', height: '16px', marginBottom: '8px' }}></div>
            <div className="skeleton skeleton-value" style={{ width: '110px', height: '24px' }}></div>
          </div>
        </div>

        {/* Lista de Movimentos Skeleton */}
        <div className="pagamentos-table-container">
          <div className="table-header">
            <div className="skeleton skeleton-title" style={{ width: '200px', height: '24px' }}></div>
            <div className="skeleton skeleton-badge" style={{ width: '80px', height: '24px' }}></div>
          </div>
          <div className="pagamentos-cards">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="pagamento-skeleton-card">
                <div className="skeleton-card-header">
                  <div className="skeleton skeleton-icon" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
                  <div className="skeleton-card-info">
                    <div className="skeleton skeleton-title" style={{ width: '150px', height: '20px', marginBottom: '4px' }}></div>
                    <div className="skeleton skeleton-label" style={{ width: '100px', height: '14px' }}></div>
                  </div>
                  <div className="skeleton skeleton-value" style={{ width: '80px', height: '20px' }}></div>
                </div>
                <div className="skeleton-card-body">
                  <div className="skeleton-grid">
                    <div className="skeleton-item">
                      <div className="skeleton skeleton-label" style={{ width: '60px', height: '12px', marginBottom: '4px' }}></div>
                      <div className="skeleton skeleton-value" style={{ width: '80px', height: '14px' }}></div>
                    </div>
                    <div className="skeleton-item">
                      <div className="skeleton skeleton-label" style={{ width: '50px', height: '12px', marginBottom: '4px' }}></div>
                      <div className="skeleton skeleton-value" style={{ width: '70px', height: '14px' }}></div>
                    </div>
                    <div className="skeleton-item">
                      <div className="skeleton skeleton-label" style={{ width: '40px', height: '12px', marginBottom: '4px' }}></div>
                      <div className="skeleton skeleton-value" style={{ width: '60px', height: '14px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const gerarHistoricoMovimentacoes = async () => {
    try {
      const params = new URLSearchParams({
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        tipo: filtros.tipo,
        categoria: filtros.categoria
      })

      const url = `/api/pagamentos/historico-movimentacoes?${params}`
      const newWindow = window.open(url, '_blank', 'width=400,height=600')
      
      if (!newWindow) {
        toast({
          title: "Erro ao gerar histórico",
          description: "Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.",
          variant: "destructive"
        })
        return
      }

      setShowExtratosModal(false)
      toast({
        title: "Histórico gerado",
        description: "Janela de impressão foi aberta"
      })
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro ao gerar histórico",
        description: "Não foi possível gerar o histórico de movimentações",
        variant: "destructive"
      })
    }
  }

  const gerarExtratoMovimentos = async () => {
    try {
      const params = new URLSearchParams({
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        tipo: filtros.tipo,
        categoria: filtros.categoria
      })

      const url = `/api/pagamentos/extrato-movimentos?${params}`
      const newWindow = window.open(url, '_blank', 'width=400,height=600')
      
      if (!newWindow) {
        toast({
          title: "Erro ao gerar extrato",
          description: "Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.",
          variant: "destructive"
        })
        return
      }

      setShowExtratosModal(false)
      toast({
        title: "Extrato gerado",
        description: "Janela de impressão foi aberta"
      })
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro ao gerar extrato",
        description: "Não foi possível gerar o extrato de movimentos",
        variant: "destructive"
      })
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

  const imprimirRecibo = async (movimento: MovimentoCaixa) => {
    try {
      setLoadingComprovante(true)

      // Verificar se é um movimento de venda
      const isVenda = movimento.categoria?.startsWith('venda_') ||
                     movimento.descricao?.toLowerCase().includes('venda #') ||
                     movimento.referencia?.toLowerCase().includes('venda #')

      if (isVenda) {
        // Para vendas, usar API genérica que agora trata vendas
        const url = `/api/pagamentos/${movimento.id}/recibo`
        const newWindow = window.open(url, '_blank', 'width=400,height=600')

        if (!newWindow) {
          toast({
            title: "Erro ao imprimir",
            description: "Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.",
            variant: "destructive"
          })
          return
        }

        // Aguardar carregar e tentar imprimir automaticamente
        setTimeout(() => {
          try {
            newWindow.print()
          } catch (e) {
            console.log('Print automático não disponível')
          }
        }, 1000)

        toast({
          title: "Recibo aberto",
          description: "Impressão automática iniciada"
        })
        return
      }

      // Verificar se é um movimento de pagamento a fornecedor
      const isPagamentoFornecedor = movimento.categoria === 'pagamento_fornecedor' ||
                                   movimento.descricao?.toLowerCase().includes('fornecedor') ||
                                   movimento.referencia?.toLowerCase().includes('fornecedor')

      if (isPagamentoFornecedor) {
        // Para pagamentos a fornecedores, usar EXATAMENTE a mesma API que funciona no caixa
        const response = await fetch(`/api/pagamentos/${movimento.id}/dados-fornecedor`)
        if (response.ok) {
          const dadosFornecedor = await response.json()

          // Determinar se afetou o caixa baseado no campo afeta_caixa do pagamento
          const afetaCaixa = dadosFornecedor.afeta_caixa ? 'true' : 'false'

          // Criar URL com parâmetros EXATAMENTE como no caixa
          const params = new URLSearchParams({
            fornecedor_nome: dadosFornecedor.fornecedor_nome,
            fornecedor_cnpj: dadosFornecedor.fornecedor_cpf_cnpj,
            valor: dadosFornecedor.valor.toString(),
            forma_pagamento: dadosFornecedor.forma_pagamento,
            descricao: dadosFornecedor.observacoes || '',
            afeta_caixa: afetaCaixa,
            data_pagamento: dadosFornecedor.data_pagamento,
            pagamento_id: dadosFornecedor.pagamento_id.toString()
          })

          const url = `/api/fornecedores/pagamentos/${dadosFornecedor.pagamento_id}/comprovante?${params.toString()}`

          const newWindow = window.open(url, '_blank', 'width=400,height=600')

          if (!newWindow) {
            toast({
              title: "Erro ao imprimir",
              description: "Verifique o bloqueador de pop-ups",
              variant: "destructive"
            })
            return
          }

          // Mesmo comportamento do caixa - sem print automático
          toast({
            title: "Recibo aberto",
            description: "Janela de impressão foi aberta"
          })
          return
        }
      }

      // Para outros tipos de movimento, usar API genérica
      const url = `/api/pagamentos/${movimento.id}/recibo`
      const newWindow = window.open(url, '_blank', 'width=400,height=600')

      if (!newWindow) {
        toast({
          title: "Erro ao imprimir",
          description: "Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.",
          variant: "destructive"
        })
        return
      }

      // Aguardar carregar e tentar imprimir automaticamente
      setTimeout(() => {
        try {
          newWindow.print()
        } catch (e) {
          console.log('Print automático não disponível')
        }
      }, 1000)

      toast({
        title: "Recibo aberto",
        description: "Impressão automática iniciada"
      })
    } catch (error) {
      console.error('Erro ao imprimir recibo:', error)
      toast({
        title: "Erro ao gerar recibo",
        description: "Não foi possível gerar o recibo para impressão",
        variant: "destructive"
      })
    } finally {
      setLoadingComprovante(false)
    }
  }

  return (
    <div className="pagamentos-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowExtratosModal(true)}>
            <Download size={16} />
            Extratos
          </button>
        </div>
      </div>

      {/* Card de Filtros */}
      <div className="pagamentos-filter-section card mb-4" style={{ background: "var(--surface)" }}>
        {/* Botão para mostrar/ocultar filtros */}
        <button
          type="button"
          className={`btn-options-toggle mb-3 ${temFiltrosAtivos() ? 'filters-active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="btn-options-content">
            <Settings size={16} />
            <span>Filtros de Busca</span>
            {temFiltrosAtivos() && <span className="filter-indicator">•</span>}
          </div>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Opções de filtro */}
        <div className={`pagamentos-filter-options ${showFilters ? 'expanded' : 'collapsed'}`}>
          <div>
            <div className="pagamentos-filters-grid">
              <div className="form-group">
                <label className="form-label">Data Início</label>
                <input
                  type="date"
                  className="form-input"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data Fim</label>
                <input
                  type="date"
                  className="form-input"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select
                  className="form-select"
                  value={filtros.tipo}
                  onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="entrada">Entradas</option>
                  <option value="saida">Saídas</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select
                  className="form-select"
                  value={filtros.categoria}
                  onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                >
                  <option value="">Todas</option>
                  <option value="venda_dinheiro">Dinheiro</option>
                  <option value="venda_cartao">Cartão</option>
                  <option value="venda_pix">PIX</option>
                  <option value="venda_multiplas">Múltiplas Formas</option>
                  <option value="pagamento_fiado">Pagamento Fiado</option>
                  <option value="ajuste">Ajustes</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Buscar</label>
                <div className="search-container">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="form-input search-input"
                    value={filtros.busca}
                    onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
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
            <span>Cartão Débito</span>
            <strong>{formatarValor(resumo.totalVendasCartaoDebito)}</strong>
          </div>
          <div className="detail-item">
            <CreditCard size={16} />
            <span>Cartão Crédito</span>
            <strong>{formatarValor(resumo.totalVendasCartaoCredito)}</strong>
          </div>
          <div className="detail-item">
            <Smartphone size={16} />
            <span>PIX</span>
            <strong>{formatarValor(resumo.totalVendasPix)}</strong>
          </div>
          <div className="detail-item">
            <LucideCheckCircle size={16} />
            <span>Pagamento Fiado</span>
            <strong>{formatarValor(resumo.totalPagamentosFiado)}</strong>
          </div>
        </div>
      </div>
      {/* Lista de Movimentos */}
      <div className="movements-section">
        <div className="movements-header">
          <h2>Movimentações</h2>
          <span className="movements-count">
            {movimentosFiltrados.length} movimento{movimentosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {movimentosFiltrados.length === 0 ? (
          <div className="empty">
            <DollarSign size={32} />
            <h3>Nenhum movimento para o período</h3>
            <p>Não há movimentações para os filtros selecionados</p>
          </div>
        ) : (
          <div className="movements-list">
            {movimentosFiltrados.map((movimento) => (
              <div key={movimento.id} className="movement-card">
                {/* Layout Desktop */}
                <div className="movement-content-desktop">
                  <div className="movement-left">
                    <div className={`movement-icon ${movimento.tipo}`}>
                      {getIconeCategoria(movimento.categoria)}
                    </div>
                    <div className="movement-details">
                      <div className="movement-title">{movimento.descricao}</div>
                      <div className="movement-metadata">
                        <span className="movement-date">{formatarData(movimento.data_movimento)}</span>
                        {movimento.referencia && (
                          <span className="movement-ref">Ref: {movimento.referencia}</span>
                        )}
                        {movimento.cliente_nome && (
                          <span className="movement-client">{movimento.cliente_nome}</span>
                        )}
                      </div>
                      {movimento.forma_pagamento && (
                        <div className="movement-payment-methods">
                          {renderFormasPagamento(movimento)}
                        </div>
                      )}
                      {(movimento.valor_pago !== undefined && movimento.valor_pago !== null) && (
                        <div className="movement-additional-info">
                          <span className="movement-received">
                            Recebido: {formatarValor(Number(movimento.valor_pago))}
                          </span>
                          {(movimento.troco !== undefined && movimento.troco !== null && Number(movimento.troco) > 0) && (
                            <span className="movement-change">
                              Troco: {formatarValor(Number(movimento.troco))}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="movement-right">
                    <div className={`movement-value ${movimento.tipo}`}>
                      {movimento.tipo === 'entrada' ? '+' : '-'} {formatarValor(Math.abs(movimento.valor))}
                    </div>
                    <button
                      onClick={() => imprimirRecibo(movimento)}
                      className="movement-action-btn"
                      title="Imprimir recibo"
                    >
                      <Printer size={16} />
                    </button>
                  </div>
                </div>

                {/* Layout Mobile */}
                <div className="movement-content-mobile">
                  <div className="movement-header-mobile">
                    <div className="movement-title-mobile">
                      <div className={`movement-icon-mobile ${movimento.tipo}`}>
                        {getIconeCategoria(movimento.categoria)}
                      </div>
                      <div className="movement-info-mobile">
                        <h4 className="movement-name">{movimento.descricao}</h4>
                        <span className="movement-date-mobile">{formatarData(movimento.data_movimento)}</span>
                      </div>
                    </div>
                    <div className="movement-value-mobile-container">
                      <div className={`movement-value-mobile ${movimento.tipo}`}>
                        {movimento.tipo === 'entrada' ? '+' : '-'} {formatarValor(Math.abs(movimento.valor))}
                      </div>
                      <button
                        onClick={() => imprimirRecibo(movimento)}
                        className="movement-action-btn-mobile"
                        title="Imprimir recibo"
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {(movimento.referencia || movimento.cliente_nome || movimento.forma_pagamento) && (
                    <div className="movement-details-mobile">
                      {movimento.referencia && (
                        <div className="movement-detail-item">
                          <span className="detail-label">Referência:</span>
                          <span className="detail-value">{movimento.referencia}</span>
                        </div>
                      )}
                      {movimento.cliente_nome && (
                        <div className="movement-detail-item">
                          <span className="detail-label">Cliente:</span>
                          <span className="detail-value">{movimento.cliente_nome}</span>
                        </div>
                      )}
                      {movimento.forma_pagamento && (
                        <div className="movement-detail-item">
                          <span className="detail-label">Pagamento:</span>
                          <div className="detail-value-payment">
                            {renderFormasPagamento(movimento)}
                          </div>
                        </div>
                      )}
                      {(movimento.valor_pago !== undefined && movimento.valor_pago !== null) && (
                        <div className="movement-additional-mobile">
                          <div className="movement-detail-item">
                            <span className="detail-label">Recebido:</span>
                            <span className="detail-value detail-money">{formatarValor(Number(movimento.valor_pago))}</span>
                          </div>
                          {(movimento.troco !== undefined && movimento.troco !== null && Number(movimento.troco) > 0) && (
                            <div className="movement-detail-item">
                              <span className="detail-label">Troco:</span>
                              <span className="detail-value detail-money">{formatarValor(Number(movimento.troco))}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Extratos */}
      {showExtratosModal && (
        <div className="modal-overlay modal-fade-in" onClick={() => setShowExtratosModal(false)}>
          <div className="modal-content-pag extratos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pag">
              <h2>Selecione o tipo de extrato</h2>
              <button 
                className="modal-close"
                onClick={() => setShowExtratosModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="extratos-grid">
              <div className="extrato-card" onClick={gerarExtratoMovimentos}>
                <div className="extrato-icon">
                  <ArrowDownUp size={32} color='blue' />
                </div>
                <h3>Extrato de Movimentos</h3>
                <p>Gera um extrato completo com resumo financeiro e detalhamento das formas de pagamento</p>
              </div>
              
              <div className="extrato-card" onClick={gerarHistoricoMovimentacoes}>
                <div className="extrato-icon">
                  <Banknote size={32} color='green' />
                </div>
                <h3>Histórico de Pagamentos</h3>
                <p>Listagem detalhada de todas as movimentações financeiras do período</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <LoadingModal
        isOpen={loadingComprovante}
        title="Gerando Comprovante"
        message="Aguarde enquanto o comprovante de pagamento é gerado..."
        size="small"
      />
    </div>
  )
}
