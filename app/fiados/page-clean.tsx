"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CreditCard, DollarSign } from "lucide-react"

interface Fiado {
  id: number
  cliente_id: number
  cliente_nome: string
  cliente_cpf: string
  venda_id: number
  valor_original: number
  valor_pago: number
  valor_restante: number
  status: "aberto" | "parcial" | "quitado"
  data_fiado: string
  data_vencimento: string
  dias_vencimento: number
}

interface PagamentoFiado {
  valor_pagamento: number
  forma_pagamento: "dinheiro" | "cartao_debito" | "cartao_credito" | "pix"
}

export default function FiadosPage() {
  const [fiados, setFiados] = useState<Fiado[]>([])
  const [showModal, setShowModal] = useState(false)
  const [fiadoSelecionado, setFiadoSelecionado] = useState<Fiado | null>(null)
  const [pagamento, setPagamento] = useState<PagamentoFiado>({
    valor_pagamento: 0,
    forma_pagamento: "dinheiro",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    carregarFiados()
  }, [])

  const carregarFiados = async () => {
    try {
      const response = await fetch("/api/fiados")
      const data = await response.json()
      setFiados(data)
    } catch (error) {
      console.error("Erro ao carregar fiados:", error)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR")
  }

  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "var(--danger-color)"
      case "parcial":
        return "var(--warning-color)"
      case "quitado":
        return "var(--success-color)"
      default:
        return "var(--text-secondary)"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "aberto":
        return "Em Aberto"
      case "parcial":
        return "Parcial"
      case "quitado":
        return "Quitado"
      default:
        return status
    }
  }

  const abrirModalPagamento = (fiado: Fiado) => {
    setFiadoSelecionado(fiado)
    setPagamento({
      valor_pagamento: fiado.valor_restante,
      forma_pagamento: "dinheiro",
    })
    setShowModal(true)
  }

  const fecharModal = () => {
    setShowModal(false)
    setFiadoSelecionado(null)
  }

  const processarPagamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fiadoSelecionado) return

    setLoading(true)

    try {
      const response = await fetch(`/api/fiados/${fiadoSelecionado.id}/pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pagamento),
      })

      if (response.ok) {
        await carregarFiados()
        fecharModal()
        alert("Pagamento processado com sucesso!")
      } else {
        throw new Error("Erro ao processar pagamento")
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error)
      alert("Erro ao processar pagamento!")
    } finally {
      setLoading(false)
    }
  }

  const fiadosAbertos = fiados.filter((f) => f.status !== "quitado")
  const totalAberto = fiadosAbertos.reduce((sum, fiado) => sum + fiado.valor_restante, 0)
  const fiadosVencidos = fiadosAbertos.filter((f) => f.dias_vencimento < 0)

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2">
            <CreditCard size={24} />
            Gerenciar Fiados
          </h2>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--danger-color)" }}>
              {fiadosAbertos.length}
            </div>
            <div className="text-muted">Fiados Abertos</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--warning-color)" }}>
              R$ {totalAberto.toFixed(2)}
            </div>
            <div className="text-muted">Total em Aberto</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--danger-color)" }}>
              {fiadosVencidos.length}
            </div>
            <div className="text-muted">Vencidos</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--success-color)" }}>
              {fiados.filter((f) => f.status === "quitado").length}
            </div>
            <div className="text-muted">Quitados</div>
          </div>
        </div>

        {/* Tabela de Fiados */}
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Venda</th>
                <th>Valor Original</th>
                <th>Valor Pago</th>
                <th>Valor Restante</th>
                <th>Status</th>
                <th>Data Fiado</th>
                <th>Vencimento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fiados.map((fiado) => (
                <tr
                  key={fiado.id}
                  style={{
                    background:
                      fiado.dias_vencimento < 0 && fiado.status !== "quitado"
                        ? "rgba(220, 38, 38, 0.1)"
                        : "transparent",
                  }}
                >
                  <td>
                    <div>
                      <div className="font-bold">{fiado.cliente_nome}</div>
                      <div className="text-sm text-muted">{formatarCPF(fiado.cliente_cpf)}</div>
                    </div>
                  </td>
                  <td>#{fiado.venda_id}</td>
                  <td>R$ {fiado.valor_original.toFixed(2)}</td>
                  <td>R$ {fiado.valor_pago.toFixed(2)}</td>
                  <td>
                    <span className="font-bold" style={{ color: getStatusColor(fiado.status) }}>
                      R$ {fiado.valor_restante.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.875rem",
                        background: getStatusColor(fiado.status),
                        color: "white",
                      }}
                    >
                      {getStatusText(fiado.status)}
                    </span>
                  </td>
                  <td>{formatarData(fiado.data_fiado)}</td>
                  <td>
                    <div>
                      <div>{formatarData(fiado.data_vencimento)}</div>
                      {fiado.status !== "quitado" && (
                        <div
                          className="text-sm"
                          style={{
                            color: fiado.dias_vencimento < 0 ? "var(--danger-color)" : "var(--text-muted)",
                          }}
                        >
                          {fiado.dias_vencimento < 0
                            ? `${Math.abs(fiado.dias_vencimento)} dias em atraso`
                            : `${fiado.dias_vencimento} dias restantes`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {fiado.status !== "quitado" && (
                      <button className="btn btn-sm btn-success" onClick={() => abrirModalPagamento(fiado)}>
                        <DollarSign size={16} />
                        Receber
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {showModal && fiadoSelecionado && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="text-xl font-bold mb-4">Receber Pagamento - {fiadoSelecionado.cliente_nome}</h3>

            <div className="mb-4 p-4" style={{ background: "var(--surface)", borderRadius: "0.375rem" }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Valor Original:</strong>
                  <br />
                  R$ {fiadoSelecionado.valor_original.toFixed(2)}
                </div>
                <div>
                  <strong>Valor Pago:</strong>
                  <br />
                  R$ {fiadoSelecionado.valor_pago.toFixed(2)}
                </div>
                <div>
                  <strong>Valor Restante:</strong>
                  <br />
                  <span className="text-xl font-bold" style={{ color: "var(--danger-color)" }}>
                    R$ {fiadoSelecionado.valor_restante.toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong>Vencimento:</strong>
                  <br />
                  {formatarData(fiadoSelecionado.data_vencimento)}
                </div>
              </div>
            </div>

            <form onSubmit={processarPagamento}>
              <div className="form-group">
                <label className="form-label">Valor do Pagamento</label>
                <input
                  type="number"
                  step="0.01"
                  max={fiadoSelecionado.valor_restante}
                  className="form-input"
                  value={pagamento.valor_pagamento}
                  onChange={(e) =>
                    setPagamento({
                      ...pagamento,
                      valor_pagamento: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Forma de Pagamento</label>
                <select
                  className="form-select"
                  value={pagamento.forma_pagamento}
                  onChange={(e) =>
                    setPagamento({
                      ...pagamento,
                      forma_pagamento: e.target.value as any,
                    })
                  }
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_debito">Cartão Débito</option>
                  <option value="cartao_credito">Cartão Crédito</option>
                  <option value="pix">PIX</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button type="button" className="btn btn-outline" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success" disabled={loading || pagamento.valor_pagamento <= 0}>
                  {loading ? (
                    <>
                      <div className="loading"></div>
                      Processando...
                    </>
                  ) : (
                    "Confirmar Pagamento"
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
