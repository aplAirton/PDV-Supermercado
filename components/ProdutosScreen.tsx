"use client"

import { useState, useEffect } from "react"
import { 
  Search, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  AlertTriangle,
  Tag,
  Barcode,
  DollarSign,
  Hash
} from "lucide-react"
import type { Produto } from "../types"

// Mock data inicial para demonstração
const mockProdutosIniciais: Produto[] = [
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

const categorias = ["Grãos", "Açúcar", "Óleos", "Laticínios", "Carnes", "Bebidas", "Limpeza", "Higiene", "Outros"]

export default function ProdutosScreen() {
  const [produtos, setProdutos] = useState<Produto[]>(mockProdutosIniciais)
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>(mockProdutosIniciais)
  const [busca, setBusca] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("")
  const [mostrarModal, setMostrarModal] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    codigoBarras: "",
    preco: "",
    quantidadeEstoque: "",
    categoria: "",
  })

  // Filtrar produtos baseado na busca e categoria
  useEffect(() => {
    let filtrados = produtos

    if (busca.trim()) {
      filtrados = filtrados.filter(
        (produto) =>
          produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
          produto.codigoBarras.includes(busca) ||
          produto.categoria.toLowerCase().includes(busca.toLowerCase()),
      )
    }

    if (categoriaFiltro) {
      filtrados = filtrados.filter((produto) => produto.categoria === categoriaFiltro)
    }

    setProdutosFiltrados(filtrados)
  }, [produtos, busca, categoriaFiltro])

  // Abrir modal para novo produto
  const abrirModalNovo = () => {
    setProdutoEditando(null)
    setFormData({
      nome: "",
      codigoBarras: "",
      preco: "",
      quantidadeEstoque: "",
      categoria: "",
    })
    setMostrarModal(true)
  }

  // Abrir modal para editar produto
  const abrirModalEdicao = (produto: Produto) => {
    setProdutoEditando(produto)
    setFormData({
      nome: produto.nome,
      codigoBarras: produto.codigoBarras,
      preco: produto.preco.toString(),
      quantidadeEstoque: produto.quantidadeEstoque.toString(),
      categoria: produto.categoria,
    })
    setMostrarModal(true)
  }

  // Fechar modal
  const fecharModal = () => {
    setMostrarModal(false)
    setProdutoEditando(null)
    setFormData({
      nome: "",
      codigoBarras: "",
      preco: "",
      quantidadeEstoque: "",
      categoria: "",
    })
  }

  // Validar formulário
  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      alert("Nome do produto é obrigatório!")
      return false
    }
    if (!formData.codigoBarras.trim()) {
      alert("Código de barras é obrigatório!")
      return false
    }
    if (!formData.preco || Number.parseFloat(formData.preco) <= 0) {
      alert("Preço deve ser maior que zero!")
      return false
    }
    if (!formData.quantidadeEstoque || Number.parseInt(formData.quantidadeEstoque) < 0) {
      alert("Quantidade em estoque deve ser maior ou igual a zero!")
      return false
    }
    if (!formData.categoria) {
      alert("Categoria é obrigatória!")
      return false
    }

    // Verificar se código de barras já existe (exceto para o produto sendo editado)
    const codigoExiste = produtos.some(
      (produto) => produto.codigoBarras === formData.codigoBarras && produto.id !== produtoEditando?.id,
    )
    if (codigoExiste) {
      alert("Código de barras já existe!")
      return false
    }

    return true
  }

  // Salvar produto (criar ou editar)
  const salvarProduto = () => {
    if (!validarFormulario()) return

    const dadosProduto = {
      nome: formData.nome.trim(),
      codigoBarras: formData.codigoBarras.trim(),
      preco: Number.parseFloat(formData.preco),
      quantidadeEstoque: Number.parseInt(formData.quantidadeEstoque),
      categoria: formData.categoria,
    }

    if (produtoEditando) {
      // Editar produto existente
      setProdutos(
        produtos.map((produto) => (produto.id === produtoEditando.id ? { ...produto, ...dadosProduto } : produto)),
      )
    } else {
      // Criar novo produto
      const novoProduto: Produto = {
        id: Math.max(...produtos.map((p) => p.id)) + 1,
        ...dadosProduto,
      }
      setProdutos([...produtos, novoProduto])
    }

    fecharModal()
  }

  // Excluir produto
  const excluirProduto = (produto: Produto) => {
    if (confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
      setProdutos(produtos.filter((p) => p.id !== produto.id))
    }
  }

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'Grãos': 'bg-amber-100 text-amber-800',
      'Açúcar': 'bg-orange-100 text-orange-800', 
      'Óleos': 'bg-yellow-100 text-yellow-800',
      'Laticínios': 'bg-blue-100 text-blue-800',
      'Carnes': 'bg-red-100 text-red-800',
      'Bebidas': 'bg-cyan-100 text-cyan-800',
      'Limpeza': 'bg-green-100 text-green-800',
      'Higiene': 'bg-purple-100 text-purple-800',
      'Outros': 'bg-gray-100 text-gray-800'
    }
    return colors[categoria] || colors['Outros']
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Gerenciar Produtos</h2>
            </div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              onClick={abrirModalNovo}
            >
              <Plus className="h-4 w-4" />
              Novo Produto
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar por nome, código ou categoria..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {produtos.length === 0 ? "Nenhum produto cadastrado" : "Nenhum produto encontrado"}
                    </p>
                  </td>
                </tr>
              ) : (
                produtosFiltrados.map((produto) => (
                  <tr key={produto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Barcode className="h-4 w-4" />
                        {produto.codigoBarras}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(produto.categoria)}`}>
                        <Tag className="h-3 w-3 mr-1" />
                        {produto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        R$ {produto.preco.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className={`font-medium ${
                          produto.quantidadeEstoque <= 10 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {produto.quantidadeEstoque}
                        </span>
                        {produto.quantidadeEstoque <= 10 && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => abrirModalEdicao(produto)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => excluirProduto(produto)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer com estatísticas */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Mostrando {produtosFiltrados.length} {produtosFiltrados.length !== produtos.length && `de ${produtos.length}`} produto{produtos.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={fecharModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {produtoEditando ? "Editar Produto" : "Novo Produto"}
              </h3>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                onClick={fecharModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Arroz Branco 5kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Barras *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.codigoBarras}
                  onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                  placeholder="Ex: 7891234567890"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estoque *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.quantidadeEstoque}
                    onChange={(e) => setFormData({ ...formData, quantidadeEstoque: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-500">* Campos obrigatórios</p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={fecharModal}
              >
                Cancelar
              </button>
              <button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={salvarProduto}
              >
                {produtoEditando ? "Salvar" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
