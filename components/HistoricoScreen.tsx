"use client"

import { useState, useEffect } from "react"
import { 
  Calendar,
  Filter,
  Receipt,
  User,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  TrendingUp,
  BarChart3,
  Eye,
  X
} from "lucide-react"
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
    <div className="space-y-4">
      {/* Toggle entre Histórico e Relatórios */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex gap-3">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              !mostrarRelatorios 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setMostrarRelatorios(false)}
          >
            <Receipt className="w-4 h-4" />
            Histórico de Vendas
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              mostrarRelatorios 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setMostrarRelatorios(true)}
          >
            <BarChart3 className="w-4 h-4" />
            Relatórios
          </button>
        </div>
      </div>

      {!mostrarRelatorios ? (
        // Tela de Histórico
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Histórico de Vendas</h2>
              </div>
              <div className="text-lg font-semibold text-blue-600">
                {vendasFiltradas.length} venda(s) - R$ {estatisticas.totalVendas.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Filtros */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-700">Filtros</h3>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data Início
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data Fim
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Cliente
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Pagamento
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="mt-4">
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                  onClick={limparFiltros}
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros
                </button>
              </div>
            </div>

            {/* Lista de Vendas */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Data/Hora</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Cliente</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Itens</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Pagamento</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Total</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasFiltradas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-gray-500"
                      >
                        <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhuma venda encontrada</p>
                      </td>
                    </tr>
                  ) : (
                    vendasFiltradas.map((venda) => (
                      <tr key={venda.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">#{venda.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-600">{formatarDataHora(venda.data)}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{venda.cliente ? venda.cliente.nome : "Cliente não identificado"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-gray-400" />
                            <span>{venda.itens.length} item(s)</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                              venda.formaPagamento === "dinheiro"
                                ? "bg-green-100 text-green-800"
                                : venda.formaPagamento === "cartao"
                                  ? "bg-blue-100 text-blue-800"
                                  : venda.formaPagamento === "pix"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {venda.formaPagamento === "dinheiro" && <Banknote className="w-3 h-3" />}
                            {venda.formaPagamento === "cartao" && <CreditCard className="w-3 h-3" />}
                            {venda.formaPagamento === "pix" && <Smartphone className="w-3 h-3" />}
                            {venda.formaPagamento === "fiado" && <User className="w-3 h-3" />}
                            {venda.formaPagamento.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-semibold text-green-600">
                          R$ {venda.valorTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-2">
                          <button
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-1"
                            onClick={() => setVendaSelecionada(venda)}
                          >
                            <Eye className="w-3 h-3" />
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Relatórios de Vendas</h2>
            </div>
          </div>

          <div className="p-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 text-center border border-green-200">
                <div className="flex items-center justify-center mb-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-green-600 mb-2">
                  R$ {estatisticas.totalVendas.toFixed(2)}
                </h3>
                <p className="text-green-700 font-medium">Faturamento Total</p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 text-center border border-blue-200">
                <div className="flex items-center justify-center mb-3">
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-blue-600 mb-2">
                  {estatisticas.quantidadeVendas}
                </h3>
                <p className="text-blue-700 font-medium">Total de Vendas</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 text-center border border-purple-200">
                <div className="flex items-center justify-center mb-3">
                  <Receipt className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-3xl font-bold text-purple-600 mb-2">
                  R$ {estatisticas.ticketMedio.toFixed(2)}
                </h3>
                <p className="text-purple-700 font-medium">Ticket Médio</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Vendas por Forma de Pagamento */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Vendas por Forma de Pagamento</h3>
                </div>
                <div className="space-y-4">
                  {Object.entries(estatisticas.vendasPorPagamento).map(([forma, valor]) => (
                    <div
                      key={forma}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        {forma === "dinheiro" && <Banknote className="w-5 h-5 text-green-600" />}
                        {forma === "cartao" && <CreditCard className="w-5 h-5 text-blue-600" />}
                        {forma === "pix" && <Smartphone className="w-5 h-5 text-purple-600" />}
                        {forma === "fiado" && <User className="w-5 h-5 text-yellow-600" />}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            forma === "dinheiro"
                              ? "bg-green-100 text-green-800"
                              : forma === "cartao"
                                ? "bg-blue-100 text-blue-800"
                                : forma === "pix"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {forma.toUpperCase()}
                        </span>
                      </div>
                      <div className="font-semibold text-green-600">R$ {valor.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Produtos Mais Vendidos */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Produtos Mais Vendidos</h3>
                </div>
                <div className="space-y-4">
                  {estatisticas.topProdutos.map((item, index) => (
                    <div
                      key={item.produto.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? "bg-yellow-500" : 
                          index === 1 ? "bg-gray-400" : 
                          index === 2 ? "bg-yellow-600" : "bg-gray-300"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{item.produto.nome}</div>
                          <div className="text-sm text-gray-500">
                            <ShoppingCart className="w-3 h-3 inline mr-1" />
                            {item.quantidade} unidades vendidas
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          R$ {item.valorTotal.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setVendaSelecionada(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Detalhes da Venda #{vendaSelecionada.id}</h3>
                </div>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setVendaSelecionada(null)}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Data/Hora:</span>
                  </div>
                  <div className="text-gray-900">{formatarDataHora(vendaSelecionada.data)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Forma de Pagamento:</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                      vendaSelecionada.formaPagamento === "dinheiro"
                        ? "bg-green-100 text-green-800"
                        : vendaSelecionada.formaPagamento === "cartao"
                          ? "bg-blue-100 text-blue-800"
                          : vendaSelecionada.formaPagamento === "pix"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {vendaSelecionada.formaPagamento === "dinheiro" && <Banknote className="w-3 h-3" />}
                    {vendaSelecionada.formaPagamento === "cartao" && <CreditCard className="w-3 h-3" />}
                    {vendaSelecionada.formaPagamento === "pix" && <Smartphone className="w-3 h-3" />}
                    {vendaSelecionada.formaPagamento === "fiado" && <User className="w-3 h-3" />}
                    {vendaSelecionada.formaPagamento.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Cliente:</span>
                  </div>
                  <div className="text-gray-900">{vendaSelecionada.cliente ? vendaSelecionada.cliente.nome : "Cliente não identificado"}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-700">Total:</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {vendaSelecionada.valorTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Itens da Venda</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Produto</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Qtd</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Preço Unit.</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendaSelecionada.itens.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 px-2">
                            <div>
                              <div className="font-medium text-gray-900">{item.produto.nome}</div>
                              <div className="text-sm text-gray-500">{item.produto.categoria}</div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-gray-600">{item.quantidade}</td>
                          <td className="py-3 px-2 text-gray-600">R$ {item.precoUnitario.toFixed(2)}</td>
                          <td className="py-3 px-2 font-semibold text-gray-900">R$ {item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <button 
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setVendaSelecionada(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
