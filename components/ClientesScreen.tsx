"use client"

import { useState, useEffect } from "react"
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  User, 
  Phone, 
  MapPin, 
  CreditCard,
  IdCard
} from "lucide-react"
import type { Cliente } from "../types"

// Mock data inicial para demonstração
const mockClientesIniciais: Cliente[] = [
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
  {
    id: 4,
    nome: "Ana Costa",
    cpf: "321.654.987-00",
    endereco: "Rua do Comércio, 321 - Centro",
    telefone: "(11) 66666-6666",
    limiteCredito: 200.0,
  },
]

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>(mockClientesIniciais)
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>(mockClientesIniciais)
  const [busca, setBusca] = useState("")
  const [mostrarModal, setMostrarModal] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [mostrarDetalhes, setMostrarDetalhes] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    endereco: "",
    telefone: "",
    limiteCredito: "",
  })

  // Filtrar clientes baseado na busca
  useEffect(() => {
    if (busca.trim()) {
      const filtrados = clientes.filter(
        (cliente) =>
          cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
          cliente.cpf.includes(busca.replace(/\D/g, "")) ||
          cliente.telefone.includes(busca.replace(/\D/g, "")) ||
          cliente.endereco.toLowerCase().includes(busca.toLowerCase()),
      )
      setClientesFiltrados(filtrados)
    } else {
      setClientesFiltrados(clientes)
    }
  }, [clientes, busca])

  // Formatar CPF
  const formatarCPF = (cpf: string) => {
    const numeros = cpf.replace(/\D/g, "")
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  // Formatar telefone
  const formatarTelefone = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, "")
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }

  // Validar CPF (algoritmo básico)
  const validarCPF = (cpf: string) => {
    const numeros = cpf.replace(/\D/g, "")
    if (numeros.length !== 11) return false
    if (/^(\d)\1{10}$/.test(numeros)) return false

    let soma = 0
    for (let i = 0; i < 9; i++) {
      soma += Number.parseInt(numeros.charAt(i)) * (10 - i)
    }
    let resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== Number.parseInt(numeros.charAt(9))) return false

    soma = 0
    for (let i = 0; i < 10; i++) {
      soma += Number.parseInt(numeros.charAt(i)) * (11 - i)
    }
    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    return resto === Number.parseInt(numeros.charAt(10))
  }

  // Abrir modal para novo cliente
  const abrirModalNovo = () => {
    setClienteEditando(null)
    setFormData({
      nome: "",
      cpf: "",
      endereco: "",
      telefone: "",
      limiteCredito: "",
    })
    setMostrarModal(true)
  }

  // Abrir modal para editar cliente
  const abrirModalEdicao = (cliente: Cliente) => {
    setClienteEditando(cliente)
    setFormData({
      nome: cliente.nome,
      cpf: cliente.cpf,
      endereco: cliente.endereco,
      telefone: cliente.telefone,
      limiteCredito: cliente.limiteCredito.toString(),
    })
    setMostrarModal(true)
  }

  // Fechar modal
  const fecharModal = () => {
    setMostrarModal(false)
    setClienteEditando(null)
    setFormData({
      nome: "",
      cpf: "",
      endereco: "",
      telefone: "",
      limiteCredito: "",
    })
  }
  // Validar formulário
  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      alert("Nome do cliente é obrigatório!")
      return false
    }
    if (!formData.cpf.trim()) {
      alert("CPF é obrigatório!")
      return false
    }
    if (!validarCPF(formData.cpf)) {
      alert("CPF inválido!")
      return false
    }
    if (!formData.endereco.trim()) {
      alert("Endereço é obrigatório!")
      return false
    }
    if (!formData.telefone.trim()) {
      alert("Telefone é obrigatório!")
      return false
    }
    if (!formData.limiteCredito || Number.parseFloat(formData.limiteCredito) < 0) {
      alert("Limite de crédito deve ser maior ou igual a zero!")
      return false
    }

    // Verificar se CPF já existe (exceto para o cliente sendo editado)
    const cpfNumeros = formData.cpf.replace(/\D/g, "")
    const cpfExiste = clientes.some(
      (cliente) => cliente.cpf.replace(/\D/g, "") === cpfNumeros && cliente.id !== clienteEditando?.id,
    )
    if (cpfExiste) {
      alert("CPF já cadastrado!")
      return false
    }

    return true
  }

  // Salvar cliente (criar ou editar)
  const salvarCliente = () => {
    if (!validarFormulario()) return

    const dadosCliente = {
      nome: formData.nome.trim(),
      cpf: formatarCPF(formData.cpf),
      endereco: formData.endereco.trim(),
      telefone: formatarTelefone(formData.telefone),
      limiteCredito: Number.parseFloat(formData.limiteCredito),
    }

    if (clienteEditando) {
      // Editar cliente existente
      setClientes(
        clientes.map((cliente) => (cliente.id === clienteEditando.id ? { ...cliente, ...dadosCliente } : cliente)),
      )
    } else {
      // Criar novo cliente
      const novoCliente: Cliente = {
        id: Math.max(...clientes.map((c) => c.id)) + 1,
        ...dadosCliente,
      }
      setClientes([...clientes, novoCliente])
    }

    fecharModal()
  }

  // Excluir cliente
  const excluirCliente = (cliente: Cliente) => {
    if (confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"?`)) {
      setClientes(clientes.filter((c) => c.id !== cliente.id))
    }
  }

  // Calcular débito total do cliente (mock - seria integrado com sistema de fiado)
  const calcularDebitoCliente = (clienteId: number) => {
    // Mock: alguns clientes têm débitos para demonstração
    const debitos: Record<number, number> = {
      1: 150.5,
      2: 0,
      3: 75.3,
      4: 220.8,
    }
    return debitos[clienteId] || 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok": return "bg-green-100 text-green-800"
      case "atencao": return "bg-yellow-100 text-yellow-800"
      case "bloqueado": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Gerenciar Clientes</h2>
            </div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              onClick={abrirModalNovo}
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar por nome, CPF, telefone ou endereço..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limite de Crédito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Débito Atual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {clientes.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
                    </p>
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => {
                  const debito = calcularDebitoCliente(cliente.id)
                  const creditoDisponivel = cliente.limiteCredito - debito
                  const statusCredito = creditoDisponivel <= 0 ? "bloqueado" : creditoDisponivel < 50 ? "atencao" : "ok"

                  return (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <IdCard className="h-3 w-3" />
                              {cliente.cpf}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {cliente.telefone}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {cliente.endereco.length > 30 ? `${cliente.endereco.substring(0, 30)}...` : cliente.endereco}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-blue-600 font-semibold flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          R$ {cliente.limiteCredito.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${debito > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          R$ {debito.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(statusCredito)}`}>
                          {statusCredito === "ok" ? "OK" : statusCredito === "atencao" ? "ATENÇÃO" : "BLOQUEADO"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => setMostrarDetalhes(cliente)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => abrirModalEdicao(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => excluirCliente(cliente)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer com estatísticas */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Mostrando {clientesFiltrados.length} {clientesFiltrados.length !== clientes.length && `de ${clientes.length}`} cliente{clientes.length !== 1 ? 's' : ''}
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
                {clienteEditando ? "Editar Cliente" : "Novo Cliente"}
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
                  Nome Completo *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cpf}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, "")
                    if (valor.length <= 11) {
                      setFormData({ ...formData, cpf: formatarCPF(valor) })
                    }
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Ex: Rua das Flores, 123 - Centro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.telefone}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, "")
                      if (valor.length <= 11) {
                        setFormData({ ...formData, telefone: formatarTelefone(valor) })
                      }
                    }}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite de Crédito (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.limiteCredito}
                    onChange={(e) => setFormData({ ...formData, limiteCredito: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
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
                onClick={salvarCliente}
              >
                {clienteEditando ? "Salvar" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Cliente */}
      {mostrarDetalhes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setMostrarDetalhes(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Cliente</h3>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                onClick={() => setMostrarDetalhes(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <div className="text-gray-900 font-medium">{mostrarDetalhes.nome}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">CPF</label>
                  <div className="text-gray-900">{mostrarDetalhes.cpf}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <div className="text-gray-900">{mostrarDetalhes.telefone}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Limite de Crédito</label>
                  <div className="text-blue-600 font-semibold">
                    R$ {mostrarDetalhes.limiteCredito.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Endereço</label>
                <div className="text-gray-900">{mostrarDetalhes.endereco}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Situação Financeira</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Débito Atual</label>
                    <div className="text-red-600 font-semibold">
                      R$ {calcularDebitoCliente(mostrarDetalhes.id).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Crédito Disponível</label>
                    <div className="text-green-600 font-semibold">
                      R$ {(mostrarDetalhes.limiteCredito - calcularDebitoCliente(mostrarDetalhes.id)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
