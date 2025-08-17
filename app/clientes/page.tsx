"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Loading from "@/components/loading"
import { toast } from '@/hooks/use-toast'
import ConfirmationModal from '@/components/confirmation-modal'
import { Plus, Edit, Trash2, Search, User } from "lucide-react"

interface Cliente {
  id: number
  nome: string
  cpf: string
  telefone: string
  endereco: string
  limite_credito: number
  debito_atual: number
  ativo: boolean
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filtro, setFiltro] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    endereco: "",
    limite_credito: "",
  })

  useEffect(() => {
    carregarClientes()
  }, [])

  const carregarClientes = async () => {
    setLoadingClientes(true)
    try {
      const response = await fetch("/api/clientes")
      const data = await response.json()
      setClientes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      setClientes([])
    } finally {
      setLoadingClientes(false)
    }
  }

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      cliente.cpf.includes(filtro) ||
      cliente.telefone.includes(filtro),
  )

  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const formatarTelefone = (telefone: string) => {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  // Validação simples do CPF (considera apenas dígitos e dígitos verificadores)
  const isValidCPF = (rawCpf: string) => {
    if (!rawCpf) return false
    const cpf = rawCpf.replace(/\D/g, "")
    if (cpf.length !== 11) return false
    // rejeita CPFs com todos os dígitos iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false

    const calc = (t: number) => {
      let s = 0
      for (let i = 0; i < t - 1; i++) s += Number(cpf.charAt(i)) * (t - i)
      const r = 11 - (s % 11)
      return r > 9 ? 0 : r
    }

    return calc(10) === Number(cpf.charAt(9)) && calc(11) === Number(cpf.charAt(10))
  }

  const abrirModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        nome: cliente.nome,
        cpf: cliente.cpf,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        limite_credito: cliente.limite_credito.toString(),
      })
    } else {
      setEditingCliente(null)
      setFormData({
        nome: "",
        cpf: "",
        telefone: "",
        endereco: "",
        limite_credito: "",
      })
    }
    setShowModal(true)
  }

  const fecharModal = () => {
    setShowModal(false)
    setEditingCliente(null)
  }

  const salvarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validação do CPF ao criar novo cliente
      if (!editingCliente) {
        if (!isValidCPF(formData.cpf)) {
          toast({ title: 'CPF inválido', description: 'CPF inválido. Verifique e tente novamente.', variant: 'destructive' })
          setLoading(false)
          return
        }
      }

      const url = editingCliente ? `/api/clientes/${editingCliente.id}` : "/api/clientes"
      const method = editingCliente ? "PUT" : "POST"

      // Em edição, garantimos que o CPF enviado seja o CPF original (não permitimos alteração do CPF)
      const payload = {
        ...formData,
        limite_credito: Number.parseFloat(formData.limite_credito),
        cpf: editingCliente ? editingCliente.cpf : formData.cpf,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
  await carregarClientes()
  fecharModal()
  toast({ title: editingCliente ? 'Cliente atualizado' : 'Cliente cadastrado', description: editingCliente ? 'Cliente atualizado!' : 'Cliente cadastrado!', variant: 'success' })
      } else {
        throw new Error("Erro ao salvar cliente")
      }
    } catch (error) {
  console.error("Erro ao salvar cliente:", error)
  toast({ title: 'Erro', description: 'Erro ao salvar cliente!', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const excluirCliente = async (id: number) => {
    // abrir modal de confirmação
    setConfirmExcluirId(id)
    setShowConfirmExcluir(true)
  }

  const [showConfirmExcluir, setShowConfirmExcluir] = useState(false)
  const [confirmExcluirId, setConfirmExcluirId] = useState<number | null>(null)

  const handleConfirmExcluir = async () => {
    if (confirmExcluirId === null) return
    try {
      const response = await fetch(`/api/clientes/${confirmExcluirId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await carregarClientes()
  toast({ title: 'Cliente excluído', description: 'Cliente excluído!', variant: 'success' })
      } else {
        throw new Error("Erro ao excluir cliente")
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error)
      toast({ title: 'Erro', description: 'Erro ao excluir cliente!', variant: 'destructive' })
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
            <h2 className="card-title flex items-center gap-2">
              <User size={24} />
              Gerenciar Clientes
            </h2>
            <button className="btn btn-primary" onClick={() => abrirModal()}>
              <Plus size={20} />
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Filtro */}
        <div className="form-group">
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por nome, CPF ou telefone..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <button className="btn btn-outline">
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Tabela de Clientes */}
        <div style={{ overflowX: "auto" }}>
          {loadingClientes ? (
            <Loading message="Carregando clientes..." />
          ) : (
            <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Limite Crédito</th>
                <th>Débito Atual</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>
                    <div>
                      <div className="font-bold">{cliente.nome}</div>
                      <div className="text-sm text-muted">{cliente.endereco}</div>
                    </div>
                  </td>
                  <td>{formatarCPF(cliente.cpf)}</td>
                  <td>{formatarTelefone(cliente.telefone)}</td>
                  <td>R$ {Number(cliente.limite_credito).toFixed(2)}</td>
                  <td>
                    <span
                      style={{
                        color: cliente.debito_atual > 0 ? "var(--warning-color)" : "var(--success-color)",
                      }}
                    >
                      R$ {Number(cliente.debito_atual).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        color: cliente.ativo ? "var(--success-color)" : "var(--danger-color)",
                      }}
                    >
                      {cliente.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-outline" onClick={() => abrirModal(cliente)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => excluirCliente(cliente.id)}>
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
            <h3 className="text-xl font-bold mb-4">{editingCliente ? "Editar Cliente" : "Novo Cliente"}</h3>

            <form onSubmit={salvarCliente}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">CPF</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    required
                    readOnly={!!editingCliente}
                  />
                  {editingCliente && (
                    <div className="text-sm text-muted mt-1">CPF não pode ser alterado ao editar um cliente.</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Endereço</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Limite de Crédito</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.limite_credito}
                  onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value })}
                  placeholder="0.00"
                  required
                />
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
