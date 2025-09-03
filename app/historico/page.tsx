"use client"

import { useState, useEffect } from "react"
import { Calendar, Filter, Eye, Printer, Settings, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import '../../styles/historico.css'

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
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loadingVendas, setLoadingVendas] = useState(false)
  const [filtros, setFiltros] = useState({
    data_inicio: "",
    data_fim: "",
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

  const aplicarFiltros = () => {
    carregarVendas()
  }

  const limparFiltros = () => {
    setFiltros({
      data_inicio: "",
      data_fim: "",
      forma_pagamento: "",
      cliente: "",
    })
    setShowFilterOptions(false)
    setShowMobileFilters(false)
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

  // Função para verificar se há filtros ativos
  const temFiltrosAtivos = () => {
    return Object.values(filtros).some(valor => valor !== "")
  }

  return (
    <div className="historico-main-container">
      {/* Desktop: Layout original */}
      <div className="card desktop-layout">
        <h1 className="page-title">Histórico de Vendas</h1>

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
              {/* Layout Desktop - Tabela */}
              <div className="historico-table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Data/Hora</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.map((venda) => (
                      <tr key={venda.id}>
                        <td>#{venda.id}</td>
                        <td>{formatarData(venda.data_venda)}</td>
                        <td>{venda.cliente_nome || "Cliente Avulso"}</td>
                        <td>R$ {(Number(venda.total) || 0).toFixed(2)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Layout Mobile - Cards */}
              <div className="historico-cards-container">
                {vendas.map((venda) => (
                  <div key={venda.id} className="historico-card">
                    <div className="historico-card-header">
                      <div className="historico-card-id">#{venda.id}</div>
                      <div className="historico-card-total">R$ {(Number(venda.total) || 0).toFixed(2)}</div>
                    </div>

                    <div className="historico-card-content">
                      <div className="historico-card-field">
                        <span className="historico-field-label">Data/Hora:</span>
                        <span className="historico-field-value">{formatarData(venda.data_venda)}</span>
                      </div>

                      <div className="historico-card-field">
                        <span className="historico-field-label">Cliente:</span>
                        <span className="historico-field-value">{venda.cliente_nome || "Cliente Avulso"}</span>
                      </div>
                    </div>

                    <div className="historico-card-actions">
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
              <span>Resumo das Vendas (Período)</span>
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
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={18} />
            Lista de Vendas ({vendas.length})
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
                  <div className="historico-card-header">
                    <div className="historico-card-id">#{venda.id}</div>
                    <div className="historico-card-total">R$ {(Number(venda.total) || 0).toFixed(2)}</div>
                  </div>

                  <div className="historico-card-content">
                    <div className="historico-card-field">
                      <span className="historico-field-label">Data/Hora:</span>
                      <span className="historico-field-value">{formatarData(venda.data_venda)}</span>
                    </div>

                    <div className="historico-card-field">
                      <span className="historico-field-label">Cliente:</span>
                      <span className="historico-field-value">{venda.cliente_nome || "Cliente Avulso"}</span>
                    </div>
                  </div>

                  <div className="historico-card-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => verDetalhes(venda)} style={{ flex: 1 }}>
                      <Eye size={14} />
                      Ver Detalhes
                    </button>
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => imprimirCupomSegundaVia(venda.id)}
                      title="Imprimir 2ª via do cupom"
                      style={{ flex: 1 }}
                    >
                      <Printer size={14} />
                      2ª Via
                    </button>
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

      {/* Modal de Detalhes da Venda */}
      {showModal && vendaSelecionada && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px', width: '90%' }}>
            {/* Cabeçalho */}
            <div style={{ 
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', 
              color: 'black', 
              padding: '12px 16px', 
              borderRadius: '6px 6px 0 0',
              marginBottom: '0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={18} />
                  <div>
                    <h3 className="text-base font-bold margin-0">Venda #{vendaSelecionada.id.toString().padStart(6, '0')}</h3>
                  </div>
                </div>
                <button 
                  className="btn" 
                  onClick={() => setShowModal(false)}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    padding: '2px 6px',
                    fontSize: '14px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: '16px' }}>
              {/* Seção: Informações da Venda */}
              <div style={{ 
                background: 'var(--surface)', 
                padding: '12px', 
                borderRadius: '6px',
                border: '1px solid var(--border-light)',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Data da Venda</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                    R$ {(Number(vendaSelecionada.total) || 0).toFixed(2)}
                  </span>
                </div>
                
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {formatarData(vendaSelecionada.data_venda)}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      background: vendaSelecionada.cliente_nome ? 'var(--success)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '10px'
                    }}>
                      {vendaSelecionada.cliente_nome ? 
                        vendaSelecionada.cliente_nome.charAt(0).toUpperCase() : 
                        'A'
                      }
                    </div>
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {vendaSelecionada.cliente_nome || "Cliente Avulso"}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatarFormaPagamento(vendaSelecionada.forma_pagamento)}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {vendaSelecionada.itens.length} produto{vendaSelecionada.itens.length !== 1 ? 's' : ''}
                    <br />
                    {vendaSelecionada.itens.reduce((sum, item) => sum + Number(item.quantidade || 0), 0)} iten{vendaSelecionada.itens.reduce((sum, item) => sum + Number(item.quantidade || 0), 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Seção: Desconto (se houver) */}
              {vendaSelecionada.desconto_tipo && (Number(vendaSelecionada.desconto_valor) > 0 || Number(vendaSelecionada.desconto_percentual) > 0) && (
                <div style={{ 
                  background: '#fff8dc', 
                  padding: '12px', 
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#d9534f' }}>
                        Desconto Aplicado
                      </span>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#d9534f' }}>
                      {vendaSelecionada.desconto_tipo === 'percent' 
                        ? `${Number(vendaSelecionada.desconto_percentual)}%`
                        : 'Valor fixo'
                      } (-R$ {Number(vendaSelecionada.desconto_valor || 0).toFixed(2)})
                    </span>
                  </div>
                </div>
              )}

              {/* Seção: Itens da Venda */}
              <div style={{ marginBottom: '12px' }}>
                <h4 className="text-sm font-semibold margin-0" style={{ 
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  paddingBottom: '3px',
                  borderBottom: '1px solid var(--border-light)'
                }}>
                  Itens da Venda
                </h4>
                
                <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  {vendaSelecionada.itens.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      background: index % 2 === 0 ? 'var(--surface)' : 'transparent',
                      borderRadius: '3px',
                      marginBottom: '1px',
                      fontSize: '13px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div className="font-medium" style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {item.produto_nome}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          {item.quantidade}x R$ {item.preco_unitario.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-semibold" style={{ color: 'var(--success)' }}>
                        R$ {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção: Resumo e Ações */}
              <div style={{ 
                borderTop: '1px solid var(--border-light)',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>
                    Total Geral
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--success)' }}>
                    R$ {(Number(vendaSelecionada.total) || 0).toFixed(2)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => imprimirCupom(vendaSelecionada)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      padding: '6px 10px',
                      fontSize: '12px'
                    }}
                  >
                    <Printer size={12} />
                    Cupom
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setShowModal(false)}
                    style={{ 
                      padding: '6px 10px',
                      fontSize: '12px'
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}