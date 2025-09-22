"use client"

import { useState, useEffect } from "react"
import { Calendar, Filter, Eye, Printer, Settings, ChevronDown, ChevronUp, Loader2, X } from "lucide-react"
import '../../styles/historico.css'
import LoadingModal from '../../components/loading-modal'
import Modal from '@/components/modal'

interface Venda {
  id: number
  cliente_nome: string | null
  total: number
  forma_pagamento: string
  data_venda: string
  desconto_tipo?: string | null
  desconto_valor?: number | null
  desconto_percentual?: number | null
  itens: {
    produto_nome: string
    quantidade: number
    preco_unitario: number
    subtotal: number
  }[]
}

export default function HistoricoPage() {
  // Função para obter a data atual no formato YYYY-MM-DD
  const getDataAtual = () => {
    const hoje = new Date()
    return hoje.toISOString().split('T')[0]
  }

  const [vendas, setVendas] = useState<Venda[]>([])
  const [loadingVendas, setLoadingVendas] = useState(false)
  const [filtros, setFiltros] = useState({
    data_inicio: getDataAtual(),
    data_fim: getDataAtual(),
    forma_pagamento: "",
    cliente: "",
  })
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Estado para controlar a exibição dos filtros
  const [showFilterOptions, setShowFilterOptions] = useState(false)
  
  // Estado para controlar a exibição dos filtros mobile
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  // Estado para controlar a exibição do resumo mobile
  const [showMobileResumo, setShowMobileResumo] = useState(false)

  // Estado para controlar a aba ativa do modal de detalhes da venda
  const [activeTab, setActiveTab] = useState("basico")

  // Estado para controlar o modal de loading dos filtros
  const [showFilterLoading, setShowFilterLoading] = useState(false)

  // Estado para controlar qual card de atalho está ativo
  const [atalhoAtivo, setAtalhoAtivo] = useState<string>("0-dias")

  // Estado para controlar quais cards estão expandidos (usando Set de IDs)
  const [cardsExpandidos, setCardsExpandidos] = useState<Set<number>>(new Set())

  // Função para alternar expansão de um card
  const toggleCardExpansao = (vendaId: number) => {
    setCardsExpandidos(prev => {
      const novoSet = new Set(prev)
      if (novoSet.has(vendaId)) {
        novoSet.delete(vendaId)
      } else {
        novoSet.add(vendaId)
      }
      return novoSet
    })
  }

  useEffect(() => {
    // Carregar vendas do dia atual por padrão usando a mesma lógica do filtro "Hoje"
    aplicarAtalhoPeriodo(0)
  }, [])

  const carregarVendas = async () => {
    setLoadingVendas(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/vendas?${params}`)
      const data = await response.json()
      // Sanitizar e garantir que campos numéricos sejam Number
      const sanitized = Array.isArray(data)
        ? data.map((v: any) => ({
            ...v,
            total: Number(v.total ?? 0),
            itens: Array.isArray(v.itens)
              ? v.itens.map((it: any) => ({
                  ...it,
                  quantidade: Number(it.quantidade ?? 0),
                  preco_unitario: Number(it.preco_unitario ?? 0),
                  subtotal: Number(it.subtotal ?? 0),
                }))
              : [],
          }))
        : []

      setVendas(sanitized as Venda[])
    } catch (error) {
      console.error("Erro ao carregar vendas:", error)
    } finally {
      // garantir que o indicador de loading seja visível por um pequeno período
      await new Promise((res) => setTimeout(res, 150))
      setLoadingVendas(false)
    }
  }

  const aplicarFiltros = async () => {
    setShowFilterLoading(true)
    setAtalhoAtivo("") // Remove atalho ativo quando usa filtros manuais
    try {
      await carregarVendas()
    } finally {
      setShowFilterLoading(false)
    }
  }

  const limparFiltros = () => {
    aplicarTodoPeriodo()
    setShowFilterOptions(false)
    setShowMobileFilters(false)
  }

  // Funções para atalhos de período
  const aplicarAtalhoPeriodo = async (dias: number) => {
    setShowFilterLoading(true)
    setAtalhoAtivo(`${dias}-dias`)
    try {
      // Para "Hoje" (dias = 0), usar filtro simplificado por data atual
      if (dias === 0) {
        // Obter data local sem conversão para UTC
        const hoje = new Date()
        const ano = hoje.getFullYear()
        const mes = String(hoje.getMonth() + 1).padStart(2, '0')
        const dia = String(hoje.getDate()).padStart(2, '0')
        const dataAtual = `${ano}-${mes}-${dia}`

        setFiltros({
          ...filtros,
          data_inicio: dataAtual,
          data_fim: dataAtual,
        })

        const params = new URLSearchParams()
        params.append('data_atual', dataAtual) // Parâmetro específico para hoje
        if (filtros.forma_pagamento) params.append('forma_pagamento', filtros.forma_pagamento)
        if (filtros.cliente) params.append('cliente', filtros.cliente)

        const response = await fetch(`/api/vendas?${params}`)
        const data = await response.json()
        const sanitized = Array.isArray(data)
          ? data.map((v: any) => ({
              ...v,
              total: Number(v.total ?? 0),
              itens: Array.isArray(v.itens)
                ? v.itens.map((it: any) => ({
                    ...it,
                    quantidade: Number(it.quantidade ?? 0),
                    preco_unitario: Number(it.preco_unitario ?? 0),
                    subtotal: Number(it.subtotal ?? 0),
                  }))
                : [],
            }))
          : []
        setVendas(sanitized as Venda[])
      } else {
        // Para outros períodos, manter lógica existente
        const hoje = new Date()
        const dataAtual = hoje.toISOString().split('T')[0]
        const dataFim = dataAtual
        const dataInicio = new Date(hoje.getTime() - (dias * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]

        setFiltros({
          ...filtros,
          data_inicio: dataInicio,
          data_fim: dataFim,
        })

        const params = new URLSearchParams()
        params.append('data_inicio', dataInicio)
        params.append('data_fim', dataFim)
        if (filtros.forma_pagamento) params.append('forma_pagamento', filtros.forma_pagamento)
        if (filtros.cliente) params.append('cliente', filtros.cliente)

        const response = await fetch(`/api/vendas?${params}`)
        const data = await response.json()
        const sanitized = Array.isArray(data)
          ? data.map((v: any) => ({
              ...v,
              total: Number(v.total ?? 0),
              itens: Array.isArray(v.itens)
                ? v.itens.map((it: any) => ({
                    ...it,
                    quantidade: Number(it.quantidade ?? 0),
                    preco_unitario: Number(it.preco_unitario ?? 0),
                    subtotal: Number(it.subtotal ?? 0),
                  }))
                : [],
            }))
          : []
        setVendas(sanitized as Venda[])
      }
    } catch (error) {
      console.error("Erro ao carregar vendas:", error)
    } finally {
      setShowFilterLoading(false)
    }
  }

  const aplicarTodoPeriodo = async () => {
    setShowFilterLoading(true)
    setAtalhoAtivo("todo-periodo")
    try {
      setFiltros({
        ...filtros,
        data_inicio: "",
        data_fim: "",
      })
      
      const params = new URLSearchParams()
      if (filtros.forma_pagamento) params.append('forma_pagamento', filtros.forma_pagamento)
      if (filtros.cliente) params.append('cliente', filtros.cliente)

      const response = await fetch(`/api/vendas?${params}`)
      const data = await response.json()
      const sanitized = Array.isArray(data)
        ? data.map((v: any) => ({
            ...v,
            total: Number(v.total ?? 0),
            itens: Array.isArray(v.itens)
              ? v.itens.map((it: any) => ({
                  ...it,
                  quantidade: Number(it.quantidade ?? 0),
                  preco_unitario: Number(it.preco_unitario ?? 0),
                  subtotal: Number(it.subtotal ?? 0),
                }))
              : [],
          }))
        : []
      setVendas(sanitized as Venda[])
    } catch (error) {
      console.error("Erro ao carregar vendas:", error)
    } finally {
      setShowFilterLoading(false)
    }
  }

  // Função para verificar se há filtros aplicados além do padrão
  const temFiltrosAplicados = () => {
    return filtros.forma_pagamento !== "" || filtros.cliente !== ""
  }

  // Função para formatar o período do filtro
  const getPeriodoFiltro = () => {
    const dataInicio = filtros.data_inicio
    const dataFim = filtros.data_fim

    if (!dataInicio && !dataFim) return "Todo o período"

    if (dataInicio === dataFim) {
      // Mesmo dia
      const data = new Date(dataInicio + 'T00:00:00')
      return data.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } else {
      // Período
      const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR') : '?'
      const fim = dataFim ? new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR') : '?'
      return `Período: ${inicio} - ${fim}`
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR")
  }

  const formatarFormaPagamento = (forma: string) => {
    const formas: { [key: string]: string } = {
      dinheiro: "Dinheiro",
      cartao_debito: "Cartão Débito",
      cartao_credito: "Cartão Crédito",
      pix: "PIX",
      fiado: "Fiado",
    }
    return formas[forma] || forma
  }

  const verDetalhes = (venda: Venda) => {
    setVendaSelecionada(venda)
    setShowModal(true)
  }

  const imprimirCupomSegundaVia = (vendaId: number) => {
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

  const imprimirCupom = async (venda: Venda | null) => {
    if (!venda) return
    
    // Usar a mesma lógica da função que funciona (imprimirCupomSegundaVia)
    const cupomUrl = `/api/vendas/${venda.id}/cupom`
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

  const totalVendas = vendas.reduce((sum, venda) => sum + Number(venda.total || 0), 0)

  // Função para verificar se há filtros ativos além do padrão
  const temFiltrosAtivos = () => {
    return Object.values(filtros).some(valor => valor !== "")
  }

  return (
    <div className="historico-main-container">
      {/* Cabeçalho da Página */}
      <div className="historico-header">
        <div className="historico-periodo-section">
          <div className="periodo-display">{getPeriodoFiltro()}</div>
          {temFiltrosAplicados() && (
            <span className="filtro-indicator">• Filtros aplicados</span>
          )}
        </div>
      </div>

      {/* Desktop: Layout original */}
      <div className="card desktop-layout">

        {/* Filtros */}
        <div className="historico-filter-section card mb-4" style={{ background: "var(--surface)" }}>
          {/* Botão para mostrar/ocultar filtros */}
          <button
            type="button"
            className={`btn-options-toggle mb-3 ${temFiltrosAtivos() ? 'filters-active' : ''}`}
            onClick={() => setShowFilterOptions(!showFilterOptions)}
          >
            <div className="btn-options-content">
              <Settings size={16} />
              <span>Filtros de Busca</span>
              {temFiltrosAtivos() && <span className="filter-indicator">•</span>}
            </div>
            {showFilterOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Opções de filtro */}
          <div className={`historico-filter-options ${showFilterOptions ? 'expanded' : 'collapsed'}`}>
            <div>
              {/* Cards de Atalho de Período */}
              <div className="historico-periodo-atalhos">
                <div className="atalhos-title">Períodos Rápidos</div>
                <div className="atalhos-grid">
                  <button 
                    className={`atalho-card atalho-hoje ${atalhoAtivo === '0-dias' ? 'ativo' : ''}`}
                    onClick={() => aplicarAtalhoPeriodo(0)}
                    title="Vendas realizadas hoje"
                  >
                    <div className="atalho-titulo">Hoje</div>
                    <div className="atalho-subtitulo">Vendas do dia</div>
                    <div className="atalho-data">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                  </button>
                  <button 
                    className={`atalho-card atalho-3dias ${atalhoAtivo === '3-dias' ? 'ativo' : ''}`}
                    onClick={() => aplicarAtalhoPeriodo(3)}
                    title="Últimas 3 dias de vendas"
                  >
                    <div className="atalho-titulo">3 Dias</div>
                    <div className="atalho-subtitulo">Últimas vendas</div>
                    <div className="atalho-data">
                      {new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </button>
                  <button 
                    className={`atalho-card atalho-7dias ${atalhoAtivo === '7-dias' ? 'ativo' : ''}`}
                    onClick={() => aplicarAtalhoPeriodo(7)}
                    title="Últimos 7 dias de vendas"
                  >
                    <div className="atalho-titulo">7 Dias</div>
                    <div className="atalho-subtitulo">Últimas vendas</div>
                    <div className="atalho-data">
                      {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </button>
                  <button 
                    className={`atalho-card atalho-30dias ${atalhoAtivo === '30-dias' ? 'ativo' : ''}`}
                    onClick={() => aplicarAtalhoPeriodo(30)}
                    title="Últimos 30 dias de vendas"
                  >
                    <div className="atalho-titulo">30 Dias</div>
                    <div className="atalho-subtitulo">Últimas vendas</div>
                    <div className="atalho-data">
                      {new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </button>
                  <button 
                    className={`atalho-card atalho-todo-periodo ${atalhoAtivo === 'todo-periodo' ? 'ativo' : ''}`}
                    onClick={aplicarTodoPeriodo}
                    title="Todo o histórico de vendas"
                  >
                    <div className="atalho-titulo">Todo Período</div>
                    <div className="atalho-subtitulo">Histórico completo</div>
                    <div className="atalho-data">Desde o início</div>
                  </button>
                </div>
              </div>

              <div className="filter-separator"></div>

              <div className="historico-filters-grid">
                <div className="form-group">
                  <label className="form-label">Data Início</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filtros.data_inicio}
                    onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data Fim</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filtros.data_fim}
                    onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Forma de Pagamento</label>
                  <select
                    className="form-select"
                    value={filtros.forma_pagamento}
                    onChange={(e) => setFiltros({ ...filtros, forma_pagamento: e.target.value })}
                  >
                    <option value="">Todas</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_debito">Cartão Débito</option>
                    <option value="cartao_credito">Cartão Crédito</option>
                    <option value="pix">PIX</option>
                    <option value="fiado">Fiado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cliente</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nome do cliente"
                    value={filtros.cliente}
                    onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
                  />
                </div>
              </div>

              <div className="historico-filter-actions">
                <button className="btn btn-primary" onClick={aplicarFiltros}>
                  <Filter size={20} />
                  Aplicar Filtros
                </button>
                <button className="btn btn-outline" onClick={limparFiltros}>
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="historico-resumo-container">
          <div className="historico-resumo-card">
            <div className="historico-resumo-valor" style={{ color: "var(--primary-color)" }}>
              {vendas.length}
            </div>
            <div className="historico-resumo-label">Total de Vendas</div>
          </div>
          <div className="historico-resumo-card">
            <div className="historico-resumo-valor" style={{ color: "var(--success-color)" }}>
              R$ {(Number(totalVendas) || 0).toFixed(2)}
            </div>
            <div className="historico-resumo-label">Valor Total</div>
          </div>
          <div className="historico-resumo-card">
            <div className="historico-resumo-valor" style={{ color: "var(--warning-color)" }}>
              R$ {vendas.length > 0 ? (totalVendas / vendas.length).toFixed(2) : "0.00"}
            </div>
            <div className="historico-resumo-label">Ticket Médio</div>
          </div>
        </div>

        {/* Seção de Vendas */}
        <div className="historico-vendas-section">
          {loadingVendas ? (
            <div className="p-6 text-center">
              <Loader2 className="animate-spin mx-auto" size={32} />
              <div className="text-muted" style={{ marginTop: '0.75rem' }}>Carregando vendas...</div>
            </div>
          ) : (
            <>
              {/* Layout Desktop - Cards */}
              <div className="historico-cards-container">
                {vendas.map((venda) => (
                  <div key={venda.id} className="historico-card">
                    {/* Layout Desktop */}
                    <div className="historico-card-content-desktop">
                      <div className="historico-card-id-desktop">#{venda.id}</div>
                      
                      <div className="historico-card-info-desktop">
                        <div className="historico-info-item-desktop">
                          <div className="historico-info-label-desktop">Data/Hora</div>
                          <div className="historico-info-value-desktop">{formatarData(venda.data_venda)}</div>
                        </div>
                        
                        <div className="historico-info-item-desktop">
                          <div className="historico-info-label-desktop">Cliente</div>
                          <div className="historico-info-value-desktop">{venda.cliente_nome || "Cliente Avulso"}</div>
                        </div>
                      </div>
                      
                      <div className="historico-card-total-desktop">R$ {(Number(venda.total) || 0).toFixed(2)}</div>
                      
                      <div className="historico-card-actions-desktop">
                        <button className="btn btn-sm btn-outline" onClick={() => verDetalhes(venda)}>
                          <Eye size={16} />
                          Ver Detalhes
                        </button>
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => imprimirCupomSegundaVia(venda.id)}
                          title="Imprimir 2ª via do cupom"
                        >
                          <Printer size={16} />
                          2ª Via
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile: Cards separados */}
      <div className="mobile-layout">
        {/* Card 1: Filtros Mobile */}
        <div className="historico-filter-card">
          <button
            type="button"
            className={`mobile-filter-toggle ${temFiltrosAtivos() ? 'filters-active' : ''}`}
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} />
              <span>Filtros de Busca</span>
              {temFiltrosAtivos() && <span style={{ 
                color: 'var(--primary)', 
                fontSize: '1.5rem', 
                lineHeight: '1',
                marginLeft: '0.25rem' 
              }}>•</span>}
            </div>
            {showMobileFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          <div className={`mobile-filter-content ${showMobileFilters ? 'expanded' : 'collapsed'}`}>
            <div className="mobile-filter-inner">
              {/* Cards de Atalho de Período Mobile */}
              <div className="mobile-periodo-atalhos">
                <div className="mobile-atalhos-title">Períodos Rápidos</div>
                <div className="mobile-atalhos-grid">
                  <button 
                    className={`mobile-atalho-card mobile-atalho-hoje ${atalhoAtivo === '0-dias' ? 'ativo' : ''}`}
                    onClick={() => aplicarAtalhoPeriodo(0)}
                    title="Vendas realizadas hoje"
                  >
                    <div className="mobile-atalho-titulo">Hoje</div>
                    <div className="mobile-atalho-subtitulo">Vendas do dia</div>
                    <div className="mobile-atalho-data">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                  </button>
                  <button 
                    className={`mobile-atalho-card mobile-atalho-3dias ${atalhoAtivo === '3-dias' ? 'ativo' : ''}`}
                    onClick={() => aplicarAtalhoPeriodo(3)}
                    title="Últimas 3 dias de vendas"
                  >
                    <div className="mobile-atalho-titulo">3 Dias</div>
                    <div className="mobile-atalho-subtitulo">Últimas vendas</div>
                    <div className="mobile-atalho-data">
                      {new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </button>
                  <button 
                    className={`mobile-atalho-card mobile-atalho-7dias ${atalhoAtivo === '7-dias' ? 'ativo' : ''}`}
                    onClick={() => aplicarAtalhoPeriodo(7)}
                    title="Últimos 7 dias de vendas"
                  >
                    <div className="mobile-atalho-titulo">7 Dias</div>
                    <div className="mobile-atalho-subtitulo">Últimas vendas</div>
                    <div className="mobile-atalho-data">
                      {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </button>
                  <button 
                    className={`mobile-atalho-card mobile-atalho-30dias ${atalhoAtivo === '30-dias' ? 'ativo' : ''}`}
                    onClick={() => aplicarAtalhoPeriodo(30)}
                    title="Últimos 30 dias de vendas"
                  >
                    <div className="mobile-atalho-titulo">30 Dias</div>
                    <div className="mobile-atalho-subtitulo">Últimas vendas</div>
                    <div className="mobile-atalho-data">
                      {new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </button>
                  <button 
                    className={`mobile-atalho-card mobile-atalho-todo-periodo ${atalhoAtivo === 'todo-periodo' ? 'ativo' : ''}`}
                    onClick={aplicarTodoPeriodo}
                    title="Todo o histórico de vendas"
                  >
                    <div className="mobile-atalho-titulo">Todo Período</div>
                    <div className="mobile-atalho-subtitulo">Histórico completo</div>
                    <div className="mobile-atalho-data">Desde o início</div>
                  </button>
                </div>
              </div>

              <div className="mobile-filter-separator"></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Data Início</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filtros.data_inicio}
                    onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data Fim</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filtros.data_fim}
                    onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Forma de Pagamento</label>
                  <select
                    className="form-select"
                    value={filtros.forma_pagamento}
                    onChange={(e) => setFiltros({ ...filtros, forma_pagamento: e.target.value })}
                  >
                    <option value="">Todas</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_debito">Cartão Débito</option>
                    <option value="cartao_credito">Cartão Crédito</option>
                    <option value="pix">PIX</option>
                    <option value="fiado">Fiado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cliente</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nome do cliente"
                    value={filtros.cliente}
                    onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={aplicarFiltros} style={{ flex: 1 }}>
                  <Filter size={16} />
                  Aplicar
                </button>
                <button className="btn btn-outline" onClick={limparFiltros} style={{ flex: 1 }}>
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Resumo Mobile */}
        <div className="historico-resumo-card-mobile">
          <button
            type="button"
            className="mobile-resumo-toggle"
            onClick={() => setShowMobileResumo(!showMobileResumo)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} />
              <span>Resumo (Período)</span>
            </div>
            {showMobileResumo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          <div className={`mobile-resumo-content ${showMobileResumo ? 'expanded' : 'collapsed'}`}>
            <div className="mobile-resumo-inner">
              <div className="historico-resumo-mobile">
                <div className="historico-resumo-card vendas">
                  <div className="resumo-info">
                    <div className="resumo-valor" style={{ color: "#3b82f6" }}>
                      {vendas.length}
                    </div>
                    <div className="resumo-label">Total de Vendas</div>
                  </div>
                </div>
                
                <div className="historico-resumo-card valor">
                  <div className="resumo-info">
                    <div className="resumo-valor" style={{ color: "#10b981" }}>
                      R$ {(Number(totalVendas) || 0).toFixed(2)}
                    </div>
                    <div className="resumo-label">Valor Total</div>
                  </div>
                </div>
                
                <div className="historico-resumo-card ticket">
                  <div className="resumo-info">
                    <div className="resumo-valor" style={{ color: "#f59e0b" }}>
                      R$ {vendas.length > 0 ? (totalVendas / vendas.length).toFixed(2) : "0.00"}
                    </div>
                    <div className="resumo-label">Ticket Médio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Vendas Mobile */}
        <div className="historico-vendas-card-mobile">
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Últimas vendas ({vendas.length})
          </h2>
          
          {loadingVendas ? (
            <div className="p-6 text-center">
              <Loader2 className="animate-spin mx-auto" size={32} />
              <div className="text-muted" style={{ marginTop: '0.75rem' }}>Carregando vendas...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {vendas.map((venda) => {
                const isExpandido = cardsExpandidos.has(venda.id)
                return (
                  <div key={venda.id} className={`historico-card ${isExpandido ? 'expanded' : ''}`}>
                    {/* Header sempre visível - clicável para expandir/colapsar */}
                    <div 
                      className="historico-card-header-mobile"
                      onClick={() => toggleCardExpansao(venda.id)}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div className="historico-card-id-mobile">#{venda.id}</div>
                      <div className="historico-card-total-mobile">R$ {(Number(venda.total) || 0).toFixed(2)}</div>
                    </div>

                    {/* Conteúdo expandido - só mostra quando expandido */}
                    {isExpandido && (
                      <>
                        <div className="historico-card-fields-mobile">
                          <div className="historico-card-field-item">
                            <div className="historico-field-label">Data/Hora</div>
                            <div className="historico-field-value">{formatarData(venda.data_venda)}</div>
                          </div>

                          <div className="historico-card-field-item">
                            <div className="historico-field-label">Cliente</div>
                            <div className="historico-field-value">{venda.cliente_nome || "Cliente Avulso"}</div>
                          </div>
                        </div>

                        <div className="historico-card-actions-mobile">
                          <button className="btn btn-sm btn-outline" onClick={() => verDetalhes(venda)}>
                            <Eye size={14} />
                            Ver Detalhes
                          </button>
                          <button 
                            className="btn btn-sm btn-primary" 
                            onClick={() => imprimirCupomSegundaVia(venda.id)}
                            title="Imprimir 2ª via do cupom"
                          >
                            <Printer size={14} />
                            2ª Via
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
              
              {vendas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhuma venda encontrada
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Loading para Filtros */}
      <LoadingModal
        isOpen={showFilterLoading}
        title="Aplicando Filtros"
        message="Carregando vendas do período selecionado..."
        size="medium"
        spinnerSize={40}
      />

      {/* Modal de Detalhes da Venda */}
      {showModal && vendaSelecionada && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye size={20} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Detalhes da Venda #{vendaSelecionada.id.toString().padStart(6, '0')}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-primary hover:bg-blue-600 transition-colors"
                onClick={() => imprimirCupom(vendaSelecionada)}
              >
                <Printer size={16} />
                Imprimir Cupom
              </button>
            </div>
          </div>

          {/* Navegação por Abas */}
          <div className="mb-6">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "basico"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("basico")}
              >
                <Calendar size={16} className="inline mr-2" />
                Básico
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "itens"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("itens")}
              >
                <Settings size={16} className="inline mr-2" />
                Itens
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "pagamento"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("pagamento")}
              >
                <Printer size={16} className="inline mr-2" />
                Pagamento
              </button>
            </div>
          </div>

          {/* Conteúdo do Modal */}
          <div className="space-y-6">
            {/* Aba Básico */}
            {activeTab === "basico" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Data da Venda</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                        value={formatarData(vendaSelecionada.data_venda)}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Cliente</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                        {vendaSelecionada.cliente_nome ? vendaSelecionada.cliente_nome.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <input
                        type="text"
                        className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                        value={vendaSelecionada.cliente_nome || "Cliente Avulso"}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Total da Venda</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-bold text-base">
                        R$
                      </div>
                      <input
                        type="text"
                        className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-green-600 font-bold text-base"
                        value={Number(vendaSelecionada.total || 0).toFixed(2)}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-green-700 font-medium"
                      value="Concluída"
                      readOnly
                    />
                  </div>
                </div>

                {/* Resumo da Venda */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Resumo da Venda</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Produtos:</span>
                      <span className="font-medium text-gray-900">
                        {vendaSelecionada.itens.length} item{vendaSelecionada.itens.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantidade Total:</span>
                      <span className="font-medium text-gray-900">
                        {vendaSelecionada.itens.reduce((sum, item) => sum + Number(item.quantidade || 0), 0)} unidade{vendaSelecionada.itens.reduce((sum, item) => sum + Number(item.quantidade || 0), 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Aba Itens */}
            {activeTab === "itens" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Itens da Venda</h3>
                  <span className="text-sm text-gray-500">{vendaSelecionada.itens.length} produto{vendaSelecionada.itens.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3">
                  {vendaSelecionada.itens.map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-gray-200`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">
                            {item.produto_nome}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.quantidade}x R$ {item.preco_unitario.toFixed(2)} cada
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          R$ {item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aba Pagamento */}
            {activeTab === "pagamento" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                    <div className="relative">
                      <Printer size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                        value={formatarFormaPagamento(vendaSelecionada.forma_pagamento)}
                        readOnly
                      />
                    </div>
                  </div>

                  {vendaSelecionada.desconto_tipo && (Number(vendaSelecionada.desconto_valor) > 0 || Number(vendaSelecionada.desconto_percentual) > 0) && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Tipo de Desconto</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                          value={vendaSelecionada.desconto_tipo === 'percent' ? 'Percentual' : 'Valor Fixo'}
                          readOnly
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Valor do Desconto</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600 font-bold">
                            -
                          </div>
                          <input
                            type="text"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md bg-orange-50 text-orange-700 font-bold"
                            value={vendaSelecionada.desconto_tipo === 'percent'
                              ? `${Number(vendaSelecionada.desconto_percentual)}%`
                              : `R$ ${Number(vendaSelecionada.desconto_valor || 0).toFixed(2)}`
                            }
                            readOnly
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Resumo Financeiro */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Resumo Financeiro</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Bruto:</span>
                      <span className="font-medium text-gray-900">
                        R$ {(Number(vendaSelecionada.total) + Number(vendaSelecionada.desconto_valor || 0)).toFixed(2)}
                      </span>
                    </div>
                    {Number(vendaSelecionada.desconto_valor) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Desconto:</span>
                        <span className="font-medium text-orange-600">
                          -R$ {Number(vendaSelecionada.desconto_valor || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span className="text-gray-800 font-medium">Valor Final:</span>
                      <span className="font-bold text-green-600 text-lg">
                        R$ {Number(vendaSelecionada.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

            {/* Footer do Modal */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn btn-outline hover:bg-gray-50 transition-colors"
                onClick={() => setShowModal(false)}
              >
                <X size={16} className="mr-2" />
                Fechar
              </button>
            </div>
        </Modal>
      )}
    </div>
  )
}