"use client"

import { useState, useEffect } from "react"
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  HandCoins,
  Package,
  User
} from "lucide-react"
import type { Produto, ItemVenda, Cliente } from "../types"

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
    endereco: "Rua A, 123",
    telefone: "(11) 99999-9999",
    limiteCredito: 500.0,
  },
  {
    id: 2,
    nome: "Maria Santos",
    cpf: "987.654.321-00",
    endereco: "Rua B, 456",
    telefone: "(11) 88888-8888",
    limiteCredito: 300.0,
  },
]

export default function VendasScreen() {
  const [busca, setBusca] = useState("")
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([])
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [formaPagamento, setFormaPagamento] = useState<"dinheiro" | "cartao" | "pix" | "fiado">("dinheiro")
  const [valorRecebido, setValorRecebido] = useState("")
  const [mostrarPagamento, setMostrarPagamento] = useState(false)

  // Filtrar produtos baseado na busca
  useEffect(() => {
    if (busca.trim()) {
      const filtrados = mockProdutos.filter(
        (produto) =>
          produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
          produto.codigoBarras.includes(busca) ||
          produto.categoria.toLowerCase().includes(busca.toLowerCase()),
      )
      setProdutosFiltrados(filtrados)
    } else {
      setProdutosFiltrados([])
    }
  }, [busca])

  // Calcular total do carrinho
  const totalCarrinho = carrinho.reduce((total, item) => total + item.subtotal, 0)

  // Adicionar produto ao carrinho
  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find((item) => item.produto.id === produto.id)

    if (itemExistente) {
      setCarrinho(
        carrinho.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.precoUnitario }
            : item,
        ),
      )
    } else {
      const novoItem: ItemVenda = {
        id: Date.now(),
        produto,
        quantidade: 1,
        precoUnitario: produto.preco,
        subtotal: produto.preco,
      }
      setCarrinho([...carrinho, novoItem])
    }
    setBusca("")
    setProdutosFiltrados([])
  }

  // Remover item do carrinho
  const removerDoCarrinho = (itemId: number) => {
    setCarrinho(carrinho.filter((item) => item.id !== itemId))
  }

  // Alterar quantidade do item
  const alterarQuantidade = (itemId: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(itemId)
      return
    }

    setCarrinho(
      carrinho.map((item) =>
        item.id === itemId
          ? { ...item, quantidade: novaQuantidade, subtotal: novaQuantidade * item.precoUnitario }
          : item,
      ),
    )
  }

  // Finalizar venda
  const finalizarVenda = () => {
    if (carrinho.length === 0) {
      alert("Carrinho vazio!")
      return
    }

    if (formaPagamento === "fiado" && !clienteSelecionado) {
      alert("Selecione um cliente para venda no fiado!")
      return
    }

    // Aqui seria feita a integração com o backend
    console.log("Venda finalizada:", {
      itens: carrinho,
      total: totalCarrinho,
      cliente: clienteSelecionado,
      formaPagamento,
      valorRecebido: formaPagamento === "dinheiro" ? Number.parseFloat(valorRecebido) : totalCarrinho,
    })

    // Limpar carrinho após venda
    setCarrinho([])
    setClienteSelecionado(null)
    setFormaPagamento("dinheiro")
    setValorRecebido("")
    setMostrarPagamento(false)

    alert("Venda realizada com sucesso!")
  }

  const calcularTroco = () => {
    const recebido = Number.parseFloat(valorRecebido) || 0
    return recebido - totalCarrinho
  }

  const getPaymentIcon = (payment: string) => {
    switch (payment) {
      case "dinheiro": return HandCoins
      case "cartao": return CreditCard
      case "pix": return Smartphone
      case "fiado": return User
      default: return DollarSign
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Busca e Produtos */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Buscar Produtos
              </h2>
            </div>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite o nome, código de barras ou categoria..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  autoFocus
                />
              </div>

              {produtosFiltrados.length > 0 && (
                <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
                  {produtosFiltrados.map((produto) => (
                    <div
                      key={produto.id}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => adicionarAoCarrinho(produto)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{produto.nome}</h3>
                          <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                            <span>{produto.codigoBarras}</span>
                            <span className="inline-flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {produto.categoria}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            R$ {produto.preco.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Estoque: {produto.quantidadeEstoque}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita - Carrinho e Pagamento */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Carrinho de Compras
                </h2>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {totalCarrinho.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="p-4">
              {carrinho.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Carrinho vazio. Busque e adicione produtos.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-80 overflow-y-auto space-y-3">
                    {carrinho.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900 flex-1">{item.produto.nome}</h4>
                          <button
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                            onClick={() => removerDoCarrinho(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <button
                              className="p-1 rounded-full border border-gray-300 hover:bg-gray-50"
                              onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-medium min-w-[2rem] text-center">{item.quantidade}</span>
                            <button
                              className="p-1 rounded-full border border-gray-300 hover:bg-gray-50"
                              onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              R$ {item.precoUnitario.toFixed(2)} cada
                            </div>
                            <div className="font-semibold">R$ {item.subtotal.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!mostrarPagamento ? (
                    <button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      onClick={() => setMostrarPagamento(true)}
                    >
                      <DollarSign className="h-4 w-4" />
                      Finalizar Venda
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Forma de Pagamento
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: "dinheiro", label: "Dinheiro", Icon: HandCoins },
                            { value: "cartao", label: "Cartão", Icon: CreditCard },
                            { value: "pix", label: "PIX", Icon: Smartphone },
                            { value: "fiado", label: "Fiado", Icon: User },
                          ].map(({ value, label, Icon }) => (
                            <button
                              key={value}
                              className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                                formaPagamento === value
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => setFormaPagamento(value as any)}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="font-medium">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {formaPagamento === "fiado" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cliente
                          </label>
                          <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={clienteSelecionado?.id || ""}
                            onChange={(e) => {
                              const cliente = mockClientes.find((c) => c.id === Number.parseInt(e.target.value))
                              setClienteSelecionado(cliente || null)
                            }}
                          >
                            <option value="">Selecione um cliente</option>
                            {mockClientes.map((cliente) => (
                              <option key={cliente.id} value={cliente.id}>
                                {cliente.nome} - Limite: R$ {cliente.limiteCredito.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {formaPagamento === "dinheiro" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor Recebido
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            value={valorRecebido}
                            onChange={(e) => setValorRecebido(e.target.value)}
                          />
                          {valorRecebido && (
                            <div className="mt-2 p-3 bg-green-50 rounded-lg">
                              <span className="text-green-800 font-medium">
                                Troco: R$ {calcularTroco().toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                          onClick={() => setMostrarPagamento(false)}
                        >
                          Cancelar
                        </button>
                        <button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          onClick={finalizarVenda}
                        >
                          <DollarSign className="h-4 w-4" />
                          Confirmar Venda
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
