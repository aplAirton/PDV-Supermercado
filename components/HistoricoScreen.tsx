"use client"

import { useState, useEffect } from "react"
import type { Venda, Cliente, Produto } from "../types"

// Mock data para demonstração
const mockProdutos: Produto[] = [
  {
    id: 1,
    nome: "Arroz Branco 5kg",
    codigoBarras: "7891234567890",
    preco: 25.9,
    quantidadeEstoque: 50,
    categoria: "Grãos",
  },
  {
    id: 2,
    nome: "Feijão Preto 1kg",
    codigoBarras: "7891234567891",
    preco: 8.5,
    quantidadeEstoque: 30,
    categoria: "Grãos",
  },
  {
    id: 3,
    nome: "Açúcar Cristal 1kg",
    codigoBarras: "7891234567892",
    preco: 4.2,
    quantidadeEstoque: 25,
    categoria: "Açúcar",
  },
  {
    id: 4,
    nome: "Óleo de Soja 900ml",
    codigoBarras: "7891234567893",
    preco: 6.8,
    quantidadeEstoque: 40,
    categoria: "Óleos",
  },
  {
    id: 5,
    nome: "Leite Integral 1L",
    codigoBarras: "7891234567894",
    preco: 4.5,
    quantidadeEstoque: 60,
    categoria: "Laticínios",
  },
]

const mockClientes: Cliente[] = [
  {
    id: 1,
    nome: "João Silva",
    cpf: "123.456.789-00",
    endereco: "Rua das Flores, 123 - Centro",
    telefone: "(11) 99999-9999",
    limiteCredito: 500.0,
  },
  {
    id: 2,
    nome: "Maria Santos",
    cpf: "987.654.321-00",
    endereco: "Av. Principal, 456 - Jardim",
    telefone: "(11) 88888-8888",
    limiteCredito: 300.0,
  },
  {
    id: 3,
    nome: "Pedro Oliveira",
    cpf: "456.789.123-00",
    endereco: "Rua da Paz, 789 - Vila Nova",
    telefone: "(11) 77777-7777",
    limiteCredito: 800.0,
  },
]

const mockVendasIniciais: Venda[] = [
  {
    id: 1001,
    data: "2024-01-20T14:30:00",
    valorTotal: 45.6,
    cliente: mockClientes[0],
    formaPagamento: "dinheiro",
    itens: [
      {
        id: 1,
        produto: mockProdutos[0],
        quantidade: 1,
        precoUnitario: 25.9,
        subtotal: 25.9,
      },
      {
        id: 2,
        produto: mockProdutos[1],
        quantidade: 2,
        precoUnitario: 8.5,
        subtotal: 17.0,
      },
      {
        id: 3,
        produto: mockProdutos[3],
        quantidade: 1,
        precoUnitario: 6.8,
        subtotal: 6.8,
      },
    ],
  },
  {
    id: 1002,
    data: "2024-01-20T15:45:00",
    valorTotal: 28.4,
    formaPagamento: "cartao",
    itens: [
      {
        id: 4,
        produto: mockProdutos[2],
        quantidade: 3,
        precoUnitario: 4.2,
        subtotal: 12.6,
      },
      {
        id: 5,
        produto: mockProdutos[4],
        quantidade: 2,
        precoUnitario: 4.5,
        subtotal: 9.0,
      },
      {
        id: 6,
        produto: mockProdutos[3],
        quantidade: 1,
        precoUnitario: 6.8,
        subtotal: 6.8,
      },
    ],
  },
  {
    id: 1003,
    data: "2024-01-19T10:15:00",
    valorTotal: 120.3,
    cliente: mockClientes[2],
    formaPagamento: "fiado",
    itens: [
      {
        id: 7,
        produto: mockProdutos[0],
        quantidade: 3,
        precoUnitario: 25.9,
        subtotal: 77.7,
      },
      {
        id: 8,
        produto: mockProdutos[1],
        quantidade: 5,
        precoUnitario: 8.5,
        subtotal: 42.5,
      },
    ],
  },
  {
    id: 1004,
    data: "2024-01-19T16:20:00",
    valorTotal: 67.8,
    formaPagamento: "pix",
    itens: [
      {
        id: 9,
        produto: mockProdutos[4],
        quantidade: 10,
        precoUnitario: 4.5,
        subtotal: 45.0,
      },
      {
        id: 10,
        produto: mockProdutos[2],
        quantidade: 2,
        precoUnitario: 4.2,
        subtotal: 8.4,
      },
      {
        id: 11,
        produto: mockProdutos[3],
        quantidade: 2,
        precoUnitario: 6.8,
        subtotal: 13.6,
      },
    ],
  },
  {
    id: 1005,
    data: "2024-01-18T11:30:00",
    valorTotal: 89.9,
    cliente: mockClientes[1],
    formaPagamento: "cartao",
    itens: [
      {
        id: 12,
        produto: mockProdutos[0],
        quantidade: 2,
        precoUnitario: 25.9,
        subtotal: 51.8,
      },
      {
        id: 13,
        produto: mockProdutos[1],
        quantidade: 3,
        precoUnitario: 8.5,
        subtotal: 25.5,
      },
      {
        id: 14,
        produto: mockProdutos[2],
        quantidade: 3,
        precoUnitario: 4.2,
        subtotal: 12.6,
      },
    ],
  },
]

export default function HistoricoScreen() {
  const [vendas] = useState<Venda[]>(mockVendasIniciais)
  const [vendasFiltradas, setVendasFiltradas] = useState<Venda[]>(mockVendasIniciais)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [clienteFiltro, setClienteFiltro] = useState("")
  const [formaPagamentoFiltro, setFormaPagamentoFiltro] = useState("")
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)
  const [mostrarRelatorios, setMostrarRelatorios] = useState(false)

  // Aplicar filtros
  useEffect(() => {
    let filtradas = vendas

    // Filtro por data
    if (dataInicio) {
      filtradas = filtradas.filter((venda) => new Date(venda.data) >= new Date(dataInicio))
    }
    if (dataFim) {
      filtradas = filtradas.filter((venda) => new Date(venda.data) <= new Date(dataFim + "T23:59:59"))
    }

    // Filtro por cliente
    if (clienteFiltro) {
      filtradas = filtradas.filter((venda) => venda.cliente?.id === Number.parseInt(clienteFiltro))
    }

    // Filtro por forma de pagamento
    if (formaPagamentoFiltro) {
      filtradas = filtradas.filter((venda) => venda.formaPagamento === formaPagamentoFiltro)
    }

    setVendasFiltradas(filtradas)
  }, [vendas, dataInicio, dataFim, clienteFiltro, formaPagamentoFiltro])

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const totalVendas = vendasFiltradas.reduce((sum, venda) => sum + venda.valorTotal, 0)
    const quantidadeVendas = vendasFiltradas.length
    const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0

    // Vendas por forma de pagamento
    const vendasPorPagamento = vendasFiltradas.reduce(
      (acc, venda) => {
        acc[venda.formaPagamento] = (acc[venda.formaPagamento] || 0) + venda.valorTotal
        return acc
      },
      {} as Record<string, number>,
    )

    // Produtos mais vendidos
    const produtosVendidos = vendasFiltradas.flatMap((venda) => venda.itens)
    const produtosMaisVendidos = produtosVendidos.reduce(
      (acc, item) => {
        const key = item.produto.id
        if (!acc[key]) {
          acc[key] = {
            produto: item.produto,
            quantidade: 0,
            valorTotal: 0,
          }
        }
        acc[key].quantidade += item.quantidade
        acc[key].valorTotal += item.subtotal
        return acc
      },
      {} as Record<number, { produto: Produto; quantidade: number; valorTotal: number }>,
    )

    const topProdutos = Object.values(produtosMaisVendidos)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)

    return {
      totalVendas,
      quantidadeVendas,
      ticketMedio,
      vendasPorPagamento,
      topProdutos,
    }
  }

  const estatisticas = calcularEstatisticas()

  // Formatar data e hora
  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString("pt-BR")
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR")
  }

  // Limpar filtros
  const limparFiltros = () => {
    setDataInicio("")
    setDataFim("")
    setClienteFiltro("")
    setFormaPagamentoFiltro("")
  }

  return (
    <div>
      {/* Toggle entre Histórico e Relatórios */}
      <div className="card mb-4">
        <div className="flex" style={{ gap: "12px" }}>
          <button
            className={`btn ${!mostrarRelatorios ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setMostrarRelatorios(false)}
          >
            Histórico de Vendas
          </button>
          <button
            className={`btn ${mostrarRelatorios ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setMostrarRelatorios(true)}
          >
            Relatórios
          </button>
        </div>
      </div>

      {!mostrarRelatorios ? (
        // Tela de Histórico
        <div>
          <div className="card">
            <div className="card-header">
              <div className="flex-between">
                <h2 className="card-title">Histórico de Vendas</h2>
                <div style={{ fontSize: "18px", fontWeight: "600", color: "var(--primary-color)" }}>
                  {vendasFiltradas.length} venda(s) - R$ {estatisticas.totalVendas.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-4 mb-4">
              <div className="form-group">
                <label className="form-label">Data Início</label>
                <input
                  type="date"
                  className="form-input"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Data Fim</label>
                <input
                  type="date"
                  className="form-input"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cliente</label>
                <select
                  className="form-select"
                  value={clienteFiltro}
                  onChange={(e) => setClienteFiltro(e.target.value)}
                >
                  <option value="">Todos os clientes</option>
                  {mockClientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pagamento</label>
                <select
                  className="form-select"
                  value={formaPagamentoFiltro}
                  onChange={(e) => setFormaPagamentoFiltro(e.target.value)}
                >
                  <option value="">Todas as formas</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="pix">PIX</option>
                  <option value="fiado">Fiado</option>
                </select>
              </div>
            </div>

            <div className="flex" style={{ gap: "12px", marginBottom: "20px" }}>
              <button className="btn btn-secondary" onClick={limparFiltros}>
                Limpar Filtros
              </button>
            </div>

            {/* Lista de Vendas */}
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data/Hora</th>
                    <th>Cliente</th>
                    <th>Itens</th>
                    <th>Pagamento</th>
                    <th>Total</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasFiltradas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center"
                        style={{ padding: "40px", color: "var(--text-secondary)" }}
                      >
                        Nenhuma venda encontrada
                      </td>
                    </tr>
                  ) : (
                    vendasFiltradas.map((venda) => (
                      <tr key={venda.id}>
                        <td>
                          <strong>#{venda.id}</strong>
                        </td>
                        <td>{formatarDataHora(venda.data)}</td>
                        <td>{venda.cliente ? venda.cliente.nome : "Cliente não identificado"}</td>
                        <td>{venda.itens.length} item(s)</td>
                        <td>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor:
                                venda.formaPagamento === "dinheiro"
                                  ? "var(--success-color)"
                                  : venda.formaPagamento === "cartao"
                                    ? "var(--primary-color)"
                                    : venda.formaPagamento === "pix"
                                      ? "var(--secondary-color)"
                                      : "var(--warning-color)",
                              color: "white",
                            }}
                          >
                            {venda.formaPagamento.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ color: "var(--success-color)", fontWeight: "600" }}>
                          R$ {venda.valorTotal.toFixed(2)}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => setVendaSelecionada(venda)}
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // Tela de Relatórios
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Relatórios de Vendas</h2>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-3 mb-4">
              <div className="card" style={{ textAlign: "center" }}>
                <h3 style={{ color: "var(--success-color)", fontSize: "2rem", margin: "0 0 8px 0" }}>
                  R$ {estatisticas.totalVendas.toFixed(2)}
                </h3>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>Faturamento Total</p>
              </div>
              <div className="card" style={{ textAlign: "center" }}>
                <h3 style={{ color: "var(--primary-color)", fontSize: "2rem", margin: "0 0 8px 0" }}>
                  {estatisticas.quantidadeVendas}
                </h3>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>Total de Vendas</p>
              </div>
              <div className="card" style={{ textAlign: "center" }}>
                <h3 style={{ color: "var(--secondary-color)", fontSize: "2rem", margin: "0 0 8px 0" }}>
                  R$ {estatisticas.ticketMedio.toFixed(2)}
                </h3>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>Ticket Médio</p>
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: "24px" }}>
              {/* Vendas por Forma de Pagamento */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Vendas por Forma de Pagamento</h3>
                </div>
                <div>
                  {Object.entries(estatisticas.vendasPorPagamento).map(([forma, valor]) => (
                    <div
                      key={forma}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 0",
                        borderBottom: "1px solid var(--border-color)",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor:
                              forma === "dinheiro"
                                ? "var(--success-color)"
                                : forma === "cartao"
                                  ? "var(--primary-color)"
                                  : forma === "pix"
                                    ? "var(--secondary-color)"
                                    : "var(--warning-color)",
                            color: "white",
                            marginRight: "8px",
                          }}
                        >
                          {forma.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontWeight: "600", color: "var(--success-color)" }}>R$ {valor.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Produtos Mais Vendidos */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Produtos Mais Vendidos</h3>
                </div>
                <div>
                  {estatisticas.topProdutos.map((item, index) => (
                    <div
                      key={item.produto.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 0",
                        borderBottom: "1px solid var(--border-color)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "600" }}>
                          {index + 1}. {item.produto.nome}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {item.quantidade} unidades vendidas
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: "600", color: "var(--success-color)" }}>
                          R$ {item.valorTotal.toFixed(2)}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          R$ {(item.valorTotal / item.quantidade).toFixed(2)}/un
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Venda */}
      {vendaSelecionada && (
        <div className="modal-overlay" onClick={() => setVendaSelecionada(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes da Venda #{vendaSelecionada.id}</h3>
            </div>
            <div className="modal-body">
              <div className="grid grid-2" style={{ gap: "16px", marginBottom: "20px" }}>
                <div>
                  <strong>Data/Hora:</strong>
                  <div>{formatarDataHora(vendaSelecionada.data)}</div>
                </div>
                <div>
                  <strong>Forma de Pagamento:</strong>
                  <div>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor:
                          vendaSelecionada.formaPagamento === "dinheiro"
                            ? "var(--success-color)"
                            : vendaSelecionada.formaPagamento === "cartao"
                              ? "var(--primary-color)"
                              : vendaSelecionada.formaPagamento === "pix"
                                ? "var(--secondary-color)"
                                : "var(--warning-color)",
                        color: "white",
                      }}
                    >
                      {vendaSelecionada.formaPagamento.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <strong>Cliente:</strong>
                  <div>{vendaSelecionada.cliente ? vendaSelecionada.cliente.nome : "Cliente não identificado"}</div>
                </div>
                <div>
                  <strong>Total:</strong>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "var(--success-color)" }}>
                    R$ {vendaSelecionada.valorTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: "16px" }}>Itens da Venda</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Qtd</th>
                      <th>Preço Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendaSelecionada.itens.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.produto.nome}</strong>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {item.produto.categoria}
                          </div>
                        </td>
                        <td>{item.quantidade}</td>
                        <td>R$ {item.precoUnitario.toFixed(2)}</td>
                        <td style={{ fontWeight: "600" }}>R$ {item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setVendaSelecionada(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
