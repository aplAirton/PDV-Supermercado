"use client"

import { useState, useEffect } from "react"
import { Calendar, Filter, Eye, Printer, Settings, ChevronDown, ChevronUp, Loader2, X } from "lucide-react"
import '../../styles/historico.css'
import LoadingModal from '../../components/loading-modal'

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
  const [atalhoAtivo, setAtalhoAtivo] = useState<string>("")

  useEffect(() => {
    carregarVendas()
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
      const hoje = new Date()
      const dataFim = hoje.toISOString().split('T')[0]
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
              {vendas.map((venda) => (
                <div key={venda.id} className="historico-card">
                  {/* Layout Mobile */}
                  <div className="historico-card-content-mobile">
                    <div className="historico-card-header-mobile">
                      <div className="historico-card-id-mobile">#{venda.id}</div>
                      <div className="historico-card-total-mobile">R$ {(Number(venda.total) || 0).toFixed(2)}</div>
                    </div>

                    <div className="historico-card-fields-mobile">
                      <div className="historico-field-mobile">
                        <span className="historico-field-label-mobile">Data/Hora</span>
                        <span className="historico-field-value-mobile">{formatarData(venda.data_venda)}</span>
                      </div>

                      <div className="historico-field-mobile">
                        <span className="historico-field-label-mobile">Cliente</span>
                        <span className="historico-field-value-mobile">{venda.cliente_nome || "Cliente Avulso"}</span>
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
                  </div>
                </div>
              ))}
              
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
        <div className="product-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header do Modal */}
            <div className="product-header">
              <div className="product-header-info">
                <div className="product-header-icon">
                  <Eye size={24} />
                </div>
                <div>
                  <h2 className="product-header-title">
                    Venda #{vendaSelecionada.id.toString().padStart(6, '0')}
                  </h2>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navegação por Abas */}
            <div className="modal-tabs">
              <button
                className={`tab-btn ${activeTab === "basico" ? "active" : ""}`}
                onClick={() => setActiveTab("basico")}
              >
                <Calendar size={16} />
                Básico
              </button>
              <button
                className={`tab-btn ${activeTab === "itens" ? "active" : ""}`}
                onClick={() => setActiveTab("itens")}
              >
                <Settings size={16} />
                Itens
              </button>
              <button
                className={`tab-btn ${activeTab === "pagamento" ? "active" : ""}`}
                onClick={() => setActiveTab("pagamento")}
              >
                <Printer size={16} />
                Pagamento
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="modal-body-1">
              {/* Aba Básico */}
              {activeTab === "basico" && (
                <div className="form-section">
                  <div className="form-grid-1">
                    <div className="form-group-1">
                      <label className="form-label">Data da Venda</label>
                      <div className="input-with-icon">
                        <Calendar size={16} className="input-icon" />
                        <input
                          type="text"
                          className="form-input"
                          value={formatarData(vendaSelecionada.data_venda)}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="form-group-1">
                      <label className="form-label">Cliente</label>
                      <div className="input-with-icon">
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: vendaSelecionada.cliente_nome ? 'var(--success)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            marginRight: '8px'
                          }}
                        >
                          {vendaSelecionada.cliente_nome ?
                            vendaSelecionada.cliente_nome.charAt(0).toUpperCase() :
                            'A'
                          }
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          value={vendaSelecionada.cliente_nome || "Cliente Avulso"}
                          readOnly
                          style={{ paddingLeft: '36px' }}
                        />
                      </div>
                    </div>

                    <div className="form-group-1">
                      <label className="form-label">Total da Venda</label>
                      <div className="input-with-icon">
                        <div style={{
                          color: 'var(--success)',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          marginRight: '8px'
                        }}>
                          R$
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          value={Number(vendaSelecionada.total || 0).toFixed(2)}
                          readOnly
                          style={{
                            paddingLeft: '36px',
                            fontWeight: 'bold',
                            color: 'var(--success)',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-group-1">
                      <label className="form-label">Status</label>
                      <input
                        type="text"
                        className="form-input"
                        value="Concluída"
                        readOnly
                        style={{ background: 'var(--surface)', color: 'var(--success)' }}
                      />
                    </div>
                  </div>

                  {/* Resumo da Venda */}
                  <div className="stock-summary">
                    <h4>Resumo da Venda</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-label">Produtos:</span>
                        <span className="summary-value">
                          {vendaSelecionada.itens.length} item{vendaSelecionada.itens.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Quantidade Total:</span>
                        <span className="summary-value">
                          {vendaSelecionada.itens.reduce((sum, item) => sum + Number(item.quantidade || 0), 0)} unidade{vendaSelecionada.itens.reduce((sum, item) => sum + Number(item.quantidade || 0), 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aba Itens */}
              {activeTab === "itens" && (
                <div className="form-section">
                  <div className="section-header">
                    <h3>Itens da Venda</h3>
                  </div>

                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {vendaSelecionada.itens.map((item, index) => (
                      <div key={index} className="form-group-1" style={{
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px',
                        background: index % 2 === 0 ? 'var(--surface)' : 'transparent'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                              {item.produto_nome}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                              {item.quantidade}x R$ {item.preco_unitario.toFixed(2)} cada
                            </div>
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--success)' }}>
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
                <div className="form-section">
                  <div className="form-grid-1">
                    <div className="form-group-1">
                      <label className="form-label">Forma de Pagamento</label>
                      <div className="input-with-icon">
                        <Printer size={16} className="input-icon" />
                        <input
                          type="text"
                          className="form-input"
                          value={formatarFormaPagamento(vendaSelecionada.forma_pagamento)}
                          readOnly
                        />
                      </div>
                    </div>

                    {vendaSelecionada.desconto_tipo && (Number(vendaSelecionada.desconto_valor) > 0 || Number(vendaSelecionada.desconto_percentual) > 0) && (
                      <>
                        <div className="form-group-1">
                          <label className="form-label">Tipo de Desconto</label>
                          <input
                            type="text"
                            className="form-input"
                            value={vendaSelecionada.desconto_tipo === 'percent' ? 'Percentual' : 'Valor Fixo'}
                            readOnly
                          />
                        </div>

                        <div className="form-group-1">
                          <label className="form-label">Valor do Desconto</label>
                          <div className="input-with-icon">
                            <div style={{
                              color: '#d97706',
                              fontWeight: 'bold',
                              marginRight: '8px'
                            }}>
                              -
                            </div>
                            <input
                              type="text"
                              className="form-input"
                              value={vendaSelecionada.desconto_tipo === 'percent'
                                ? `${Number(vendaSelecionada.desconto_percentual)}%`
                                : `R$ ${Number(vendaSelecionada.desconto_valor || 0).toFixed(2)}`
                              }
                              readOnly
                              style={{
                                paddingLeft: '36px',
                                color: '#d97706',
                                fontWeight: 'bold'
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="financial-summary">
                    <h4>Resumo Financeiro</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-label">Valor Bruto:</span>
                        <span className="summary-value">
                          R$ {(Number(vendaSelecionada.total) + Number(vendaSelecionada.desconto_valor || 0)).toFixed(2)}
                        </span>
                      </div>
                      {Number(vendaSelecionada.desconto_valor) > 0 && (
                        <div className="summary-item">
                          <span className="summary-label">Desconto:</span>
                          <span className="summary-value warning">
                            -R$ {Number(vendaSelecionada.desconto_valor || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="summary-item">
                        <span className="summary-label">Valor Final:</span>
                        <span className="summary-value success">
                          R$ {Number(vendaSelecionada.total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="modal-footer-1">
              <div className="footer-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-lg"
                  onClick={() => setShowModal(false)}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => imprimirCupom(vendaSelecionada)}
                >
                  <Printer size={18} />
                  Imprimir Cupom
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}