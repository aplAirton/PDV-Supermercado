"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Loading from "@/components/loading"
import ConfirmationModal from '@/components/confirmation-modal'
import { toast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Search } from "lucide-react"

interface Produto {
  id: number
  codigo_barras: string
  nome: string
  categoria: string
  preco: number
  estoque: number
  estoque_minimo: number
  ativo: boolean
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [filtro, setFiltro] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProdutos, setLoadingProdutos] = useState(false)

  const [formData, setFormData] = useState({
    codigo_barras: "",
    nome: "",
    categoria: "",
    preco: "",
    estoque: "",
    estoque_minimo: "",
  })

  useEffect(() => {
    carregarProdutos()
  }, [])

  const carregarProdutos = async () => {
    setLoadingProdutos(true)
    try {
      const response = await fetch("/api/produtos?mode=all")
      const data = await response.json()
      setProdutos(Array.isArray(data) ? data : [])
      console.log(`[PRODUTOS] Carregados ${Array.isArray(data) ? data.length : 0} produtos`)
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      setProdutos([])
    } finally {
      setLoadingProdutos(false)
    }
  }

  const produtosFiltrados = produtos.filter(
    (produto) =>
      produto.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      produto.codigo_barras.includes(filtro) ||
      produto.categoria.toLowerCase().includes(filtro.toLowerCase()),
  )

  const abrirModal = (produto?: Produto) => {
    if (produto) {
      setEditingProduto(produto)
      setFormData({
        codigo_barras: produto.codigo_barras,
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.preco.toString(),
        estoque: produto.estoque.toString(),
        estoque_minimo: produto.estoque_minimo.toString(),
      })
    } else {
      setEditingProduto(null)
      setFormData({
        codigo_barras: "",
        nome: "",
        categoria: "",
        preco: "",
        estoque: "",
        estoque_minimo: "",
      })
    }
    setShowModal(true)
  }

  const fecharModal = () => {
    setShowModal(false)
    setEditingProduto(null)
  }

  const salvarProduto = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingProduto ? `/api/produtos/${editingProduto.id}` : "/api/produtos"
      const method = editingProduto ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          preco: Number.parseFloat(formData.preco),
          estoque: Number.parseInt(formData.estoque),
          estoque_minimo: Number.parseInt(formData.estoque_minimo),
        }),
      })

      if (response.ok) {
        await carregarProdutos()
        fecharModal()
  toast({ title: editingProduto ? 'Produto atualizado' : 'Produto cadastrado', description: editingProduto ? 'Produto atualizado!' : 'Produto cadastrado!', variant: 'success' })
      } else {
        throw new Error("Erro ao salvar produto")
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      toast({ title: 'Erro', description: 'Erro ao salvar produto!', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const excluirProduto = async (id: number) => {
    setConfirmExcluirId(id)
    setShowConfirmExcluir(true)
  }

  const [showConfirmExcluir, setShowConfirmExcluir] = useState(false)
  const [confirmExcluirId, setConfirmExcluirId] = useState<number | null>(null)

  const handleConfirmExcluir = async () => {
    if (confirmExcluirId === null) return
    try {
      const response = await fetch(`/api/produtos/${confirmExcluirId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await carregarProdutos()
  toast({ title: 'Produto excluído', description: 'Produto excluído!', variant: 'success' })
      } else {
        throw new Error("Erro ao excluir produto")
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      toast({ title: 'Erro', description: 'Erro ao excluir produto!', variant: 'destructive' })
    } finally {
      setShowConfirmExcluir(false)
      setConfirmExcluirId(null)
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="card-title">Gerenciar Produtos</h2>
            <button className="btn btn-primary" onClick={() => abrirModal()}>
              <Plus size={20} />
              Novo Produto
            </button>
          </div>
        </div>

        {/* Filtro */}
        <div className="form-group">
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por nome, código ou categoria..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <button className="btn btn-outline">
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div style={{ overflowX: "auto" }}>
          {loadingProdutos ? (
            <Loading message="Carregando produtos..." />
          ) : (
            <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Est. Mín.</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.codigo_barras}</td>
                  <td>{produto.nome}</td>
                  <td>{produto.categoria}</td>
                  <td>R$ {Number(produto.preco).toFixed(2)}</td>
                  <td>
                    <span
                      style={{
                        color: produto.estoque <= produto.estoque_minimo ? "var(--danger-color)" : "inherit",
                      }}
                    >
                      {produto.estoque}
                    </span>
                  </td>
                  <td>{produto.estoque_minimo}</td>
                  <td>
                    <span
                      style={{
                        color: produto.ativo ? "var(--success-color)" : "var(--danger-color)",
                      }}
                    >
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-outline" onClick={() => abrirModal(produto)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => excluirProduto(produto.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="text-xl font-bold mb-4">{editingProduto ? "Editar Produto" : "Novo Produto"}</h3>

            <form onSubmit={salvarProduto}>
              <div className="form-group">
                <label className="form-label">Código de Barras</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.codigo_barras}
                  onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoria</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Preço</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estoque</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.estoque}
                    onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estoque Mínimo</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.estoque_minimo}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button type="button" className="btn btn-outline" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="loading"></div>
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
