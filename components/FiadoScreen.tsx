"use client"

import { useState } from "react"
import { 
  CreditCard, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  User, 
  Users,
  CheckCircle, 
  Clock, 
  AlertCircle,
  Receipt,
  HandCoins,
  Smartphone
} from "lucide-react"
import type { Cliente, Fiado } from "../types"

// Mock data para demonstração
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
  {
    id: 4,
    nome: "Ana Costa",
    cpf: "321.654.987-00",
    endereco: "Rua do Comércio, 321 - Centro",
    telefone: "(11) 66666-6666",
    limiteCredito: 200.0,
  },
]

const mockFiadosIniciais: Fiado[] = [
  {
    id: 1,
    cliente: mockClientes[0],
    valor: 75.5,
    dataCompra: "2024-01-15",
    status: "pendente",
    vendaId: 1001,
  },
  {
    id: 2,
    cliente: mockClientes[0],
    valor: 45.0,
    dataCompra: "2024-01-18",
    status: "pendente",
    vendaId: 1002,
  },
  {
    id: 3,
    cliente: mockClientes[2],
    valor: 120.3,
    dataCompra: "2024-01-10",
    status: "pendente",
    vendaId: 1003,
  },
  {
    id: 4,
    cliente: mockClientes[3],
    valor: 89.9,
    dataCompra: "2024-01-12",
    status: "pendente",
    vendaId: 1004,
  },
  {
    id: 5,
    cliente: mockClientes[3],
    valor: 67.2,
    dataCompra: "2024-01-20",
    status: "quitado",
    vendaId: 1005,
  },
]

interface Pagamento {
  id: number
  fiadoId: number
  valor: number
  data: string
  formaPagamento: "dinheiro" | "cartao" | "pix"
}

const mockPagamentos: Pagamento[] = [
  {
    id: 1,
    fiadoId: 5,
    valor: 67.2,
    data: "2024-01-22",
    formaPagamento: "dinheiro",
  },
]

export default function FiadoScreen() {
  const [fiados, setFiados] = useState<Fiado[]>(mockFiadosIniciais)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(mockPagamentos)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pendente" | "quitado">("pendente")
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false)
  const [fiadoParaPagar, setFiadoParaPagar] = useState<Fiado | null>(null)
  const [valorPagamento, setValorPagamento] = useState("")
  const [formaPagamento, setFormaPagamento] = useState<"dinheiro" | "cartao" | "pix">("dinheiro")
  const [mostrarDetalhesCliente, setMostrarDetalhesCliente] = useState<Cliente | null>(null)

  // Filtrar fiados
  const fiadosFiltrados = fiados.filter((fiado) => {
    const matchCliente = !clienteSelecionado || fiado.cliente.id === clienteSelecionado.id
    const matchStatus = filtroStatus === "todos" || fiado.status === filtroStatus
    return matchCliente && matchStatus
  })

  // Calcular totais por cliente
  const calcularTotaisCliente = (cliente: Cliente) => {
    const fiadosCliente = fiados.filter((f) => f.cliente.id === cliente.id)
    const totalPendente = fiadosCliente.filter((f) => f.status === "pendente").reduce((sum, f) => sum + f.valor, 0)
    const totalQuitado = fiadosCliente.filter((f) => f.status === "quitado").reduce((sum, f) => sum + f.valor, 0)
    const creditoDisponivel = cliente.limiteCredito - totalPendente

    return {
      totalPendente,
      totalQuitado,
      creditoDisponivel,
      quantidadePendente: fiadosCliente.filter((f) => f.status === "pendente").length,
    }
  }

  // Calcular totais gerais
  const totaisGerais = {
    totalPendente: fiados.filter((f) => f.status === "pendente").reduce((sum, f) => sum + f.valor, 0),
    totalQuitado: fiados.filter((f) => f.status === "quitado").reduce((sum, f) => sum + f.valor, 0),
    clientesComDebito: new Set(fiados.filter((f) => f.status === "pendente").map((f) => f.cliente.id)).size,
  }

  // Abrir modal de pagamento
  const abrirModalPagamento = (fiado: Fiado) => {
    setFiadoParaPagar(fiado)
    setValorPagamento(fiado.valor.toString())
    setFormaPagamento("dinheiro")
    setMostrarModalPagamento(true)
  }

  // Fechar modal de pagamento
  const fecharModalPagamento = () => {
    setMostrarModalPagamento(false)
    setFiadoParaPagar(null)
    setValorPagamento("")
    setFormaPagamento("dinheiro")
  }

  // Processar pagamento
  const processarPagamento = () => {
    if (!fiadoParaPagar) return

    const valor = Number.parseFloat(valorPagamento)
    if (!valor || valor <= 0) {
      alert("Valor do pagamento deve ser maior que zero!")
      return
    }

    if (valor > fiadoParaPagar.valor) {
      alert("Valor do pagamento não pode ser maior que o débito!")
      return
    }

    // Registrar pagamento
    const novoPagamento: Pagamento = {
      id: Math.max(...pagamentos.map((p) => p.id), 0) + 1,
      fiadoId: fiadoParaPagar.id,
      valor,
      data: new Date().toISOString().split("T")[0],
      formaPagamento,
    }
    setPagamentos([...pagamentos, novoPagamento])

    // Atualizar status do fiado
    if (valor === fiadoParaPagar.valor) {
      // Pagamento total - quitar fiado
      setFiados(fiados.map((f) => (f.id === fiadoParaPagar.id ? { ...f, status: "quitado" as const } : f)))
    } else {
      // Pagamento parcial - reduzir valor do fiado
      setFiados(fiados.map((f) => (f.id === fiadoParaPagar.id ? { ...f, valor: f.valor - valor } : f)))
    }

    fecharModalPagamento()
    alert(`Pagamento de R$ ${valor.toFixed(2)} registrado com sucesso!`)
  }

  // Formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR")
  }

  const getPaymentIcon = (payment: string) => {
    switch (payment) {
      case "dinheiro": return HandCoins
      case "cartao": return CreditCard
      case "pix": return Smartphone
      default: return DollarSign
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-red-600 mb-1">
            R$ {totaisGerais.totalPendente.toFixed(2)}
          </h3>
          <p className="text-gray-500">Total em Aberto</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-600 mb-1">
            R$ {totaisGerais.totalQuitado.toFixed(2)}
          </h3>
          <p className="text-gray-500">Total Quitado</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-blue-600 mb-1">
            {totaisGerais.clientesComDebito}
          </h3>
          <p className="text-gray-500">Clientes com Débito</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Lista de Clientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Clientes com Fiado</h3>
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto space-y-3">
            {mockClientes.map((cliente) => {
              const totais = calcularTotaisCliente(cliente)
              if (totais.totalPendente === 0 && filtroStatus === "pendente") return null

              return (
                <div
                  key={cliente.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    clienteSelecionado?.id === cliente.id
                      ? "bg-blue-50 border-blue-200"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setClienteSelecionado(cliente)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{cliente.nome}</h4>
                        <p className="text-sm text-gray-500">{cliente.cpf}</p>
                      </div>
                    </div>
                    <button
                      className="text-gray-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMostrarDetalhesCliente(cliente)
                      }}
                    >
                      <Receipt className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Débito:</span>
                      <div className="font-semibold text-red-600">
                        R$ {totais.totalPendente.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Crédito:</span>
                      <div className="font-semibold text-green-600">
                        R$ {totais.creditoDisponivel.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {totais.quantidadePendente > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {totais.quantidadePendente} compra(s) pendente(s)
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Coluna Direita - Detalhes dos Fiados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {clienteSelecionado ? `Fiados - ${clienteSelecionado.nome}` : "Selecione um Cliente"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as any)}
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="quitado">Quitados</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!clienteSelecionado ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Selecione um cliente na lista ao lado para ver os detalhes dos fiados</p>
              </div>
            ) : (
              <div>
                {fiadosFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum fiado encontrado para este cliente</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {fiadosFiltrados.map((fiado) => (
                      <div key={fiado.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Receipt className="h-4 w-4 text-gray-400" />
                              <h4 className="font-medium text-gray-900">Venda #{fiado.vendaId}</h4>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {formatarData(fiado.dataCompra)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-semibold ${
                              fiado.status === "pendente" ? "text-red-600" : "text-green-600"
                            }`}>
                              R$ {fiado.valor.toFixed(2)}
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              fiado.status === "pendente" 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {fiado.status === "pendente" ? (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  PENDENTE
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  QUITADO
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {fiado.status === "pendente" && (
                          <div className="flex justify-end pt-3 border-t border-gray-100">
                            <button
                              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                              onClick={() => abrirModalPagamento(fiado)}
                            >
                              <DollarSign className="h-4 w-4" />
                              Receber Pagamento
                            </button>
                          </div>
                        )}

                        {/* Histórico de pagamentos */}
                        {pagamentos.filter((p) => p.fiadoId === fiado.id).length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                              <Receipt className="h-3 w-3" />
                              Histórico de Pagamentos
                            </h5>
                            <div className="space-y-1">
                              {pagamentos
                                .filter((p) => p.fiadoId === fiado.id)
                                .map((pagamento) => {
                                  const IconComponent = getPaymentIcon(pagamento.formaPagamento)
                                  return (
                                    <div key={pagamento.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                      <span className="flex items-center gap-1">
                                        <IconComponent className="h-3 w-3" />
                                        {formatarData(pagamento.data)}
                                      </span>
                                      <span className="font-medium">R$ {pagamento.valor.toFixed(2)}</span>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {mostrarModalPagamento && fiadoParaPagar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={fecharModalPagamento}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Receber Pagamento</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg" onClick={fecharModalPagamento}>
                <Receipt className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{fiadoParaPagar.cliente.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Venda:</span>
                  <span className="font-medium">#{fiadoParaPagar.vendaId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data da Compra:</span>
                  <span className="font-medium">{formatarData(fiadoParaPagar.dataCompra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Total:</span>
                  <span className="font-semibold text-red-600">R$ {fiadoParaPagar.valor.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor do Pagamento (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={fiadoParaPagar.valor}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo: R$ {fiadoParaPagar.valor.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "dinheiro", label: "Dinheiro", Icon: HandCoins },
                    { value: "cartao", label: "Cartão", Icon: CreditCard },
                    { value: "pix", label: "PIX", Icon: Smartphone },
                  ].map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                        formaPagamento === value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setFormaPagamento(value as any)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {valorPagamento && Number.parseFloat(valorPagamento) < fiadoParaPagar.valor && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Pagamento Parcial</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Valor restante: R$ {(fiadoParaPagar.valor - Number.parseFloat(valorPagamento)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={fecharModalPagamento}
              >
                Cancelar
              </button>
              <button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                onClick={processarPagamento}
              >
                <CheckCircle className="h-4 w-4" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Cliente */}
      {mostrarDetalhesCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setMostrarDetalhesCliente(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Cliente</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg" onClick={() => setMostrarDetalhesCliente(null)}>
                <User className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <div className="text-gray-900 font-medium">{mostrarDetalhesCliente.nome}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">CPF</label>
                  <div className="text-gray-900">{mostrarDetalhesCliente.cpf}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <div className="text-gray-900">{mostrarDetalhesCliente.telefone}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Limite de Crédito</label>
                  <div className="text-blue-600 font-semibold">
                    R$ {mostrarDetalhesCliente.limiteCredito.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Endereço</label>
                <div className="text-gray-900">{mostrarDetalhesCliente.endereco}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Resumo Financeiro
                </h4>
                {(() => {
                  const totais = calcularTotaisCliente(mostrarDetalhesCliente)
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Pendente</label>
                        <div className="text-red-600 font-semibold">
                          R$ {totais.totalPendente.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Quitado</label>
                        <div className="text-green-600 font-semibold">
                          R$ {totais.totalQuitado.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Crédito Disponível</label>
                        <div className={`font-semibold ${
                          totais.creditoDisponivel > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          R$ {totais.creditoDisponivel.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Compras Pendentes</label>
                        <div className="text-gray-900 font-medium">{totais.quantidadePendente}</div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
