"use client"

import { useState, useEffect } from "react"
import { Calendar, Filter, Eye, Printer } from "lucide-react"

interface Venda {
  id: number
  cliente_nome: string | null
  total: number
  forma_pagamento: string
  data_venda: string
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
    }
    finally {
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

  const imprimirCupom = async (venda: Venda | null) => {
    if (!venda) return

    // Tentar buscar o cupom salvo no servidor (mesmo formato gerado ao concluir a venda)
    try {
      const resp = await fetch(`/api/cupons/by-venda/${venda.id}`)
      if (resp.ok) {
        const data = await resp.json()
        const conteudo = data.conteudo_texto || data.conteudo || ''
        if (conteudo) {
          const w = window.open('', '_blank')
          if (!w) return
          w.document.write(`<html><head><title>Cupom Venda #${venda.id}</title></head><body><pre style="font-family: 'Courier New', Courier, monospace; white-space: pre-wrap;">${conteudo.replace(/</g,'&lt;')}</pre></body></html>`)
          w.document.close()
          try { w.focus() } catch (e) { /* ignore */ }
          // esperar o conteúdo renderizar antes de chamar print
          setTimeout(() => {
            try { w.print() } catch (e) { /* ignore */ }
            try { w.close() } catch (e) { /* ignore */ }
          }, 200)
          return
        }
      }
    } catch (err) {
      console.error('Erro ao buscar cupom salvo:', err)
      // fallback para geração local
    }

    // Fallback: gerar um cupom simples localmente caso não exista cupom salvo
    const linhas: string[] = []
    linhas.push('--- CUPOM FISCAL ---')
    linhas.push(`Venda: #${venda.id}`)
    linhas.push(`Data: ${formatarData(venda.data_venda)}`)
    linhas.push(`Cliente: ${venda.cliente_nome || 'Cliente Avulso'}`)
    linhas.push('')
    linhas.push('Itens:')
    venda.itens.forEach((it) => {
      const nome = it.produto_nome
      const qtd = Number(it.quantidade || 0)
      const preco = Number(it.preco_unitario || 0)
      const subtotal = Number(it.subtotal || qtd * preco)
      linhas.push(`${nome}  x${qtd}  R$ ${preco.toFixed(2)}  -> R$ ${subtotal.toFixed(2)}`)
    })
    linhas.push('')
    linhas.push(`TOTAL: R$ ${(Number(venda.total) || 0).toFixed(2)}`)

    const texto = linhas.join('\n')
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<html><head><title>Cupom Venda #${venda.id}</title></head><body><pre>${texto}</pre></body></html>`)
    w.document.close()
    try { w.focus() } catch (e) { /* ignore */ }
    try { w.print() } catch (e) { /* ignore */ }
  }

  const totalVendas = vendas.reduce((sum, venda) => sum + Number(venda.total || 0), 0)

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2">
            <Calendar size={24} />
            Vendas
          </h2>
        </div>

        {/* Filtros */}
        <div className="card mb-4" style={{ background: "var(--surface)" }}>
          <div className="grid grid-cols-4 gap-4">
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

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={aplicarFiltros}>
              <Filter size={20} />
              Aplicar Filtros
            </button>
            <button className="btn btn-outline" onClick={limparFiltros}>
              Limpar
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--primary-color)" }}>
              {vendas.length}
            </div>
            <div className="text-muted">Total de Vendas</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--success-color)" }}>
              R$ {(Number(totalVendas) || 0).toFixed(2)}
            </div>
            <div className="text-muted">Valor Total</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--warning-color)" }}>
              R$ {vendas.length > 0 ? (totalVendas / vendas.length).toFixed(2) : "0.00"}
            </div>
            <div className="text-muted">Ticket Médio</div>
          </div>
        </div>

        {/* Tabela de Vendas */}
        {loadingVendas ? (
          <div className="p-6 text-center">
            <div className="loading" style={{ width: '2rem', height: '2rem', margin: '0 auto' }}></div>
            <div className="text-muted" style={{ marginTop: '0.75rem' }}>Carregando vendas...</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data/Hora</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Pagamento</th>
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
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.875rem",
                          background: venda.forma_pagamento === "fiado" ? "var(--warning-color)" : "var(--success-color)",
                          color: "white",
                        }}
                      >
                        {formatarFormaPagamento(venda.forma_pagamento)}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => verDetalhes(venda)}>
                        <Eye size={16} />
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showModal && vendaSelecionada && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="text-xl font-bold mb-4">Detalhes da Venda #{vendaSelecionada.id}</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <strong>Data/Hora:</strong>
                <br />
                {formatarData(vendaSelecionada.data_venda)}
              </div>
              <div>
                <strong>Cliente:</strong>
                <br />
                {vendaSelecionada.cliente_nome || "Cliente Avulso"}
              </div>
              <div>
                <strong>Forma de Pagamento:</strong>
                <br />
                {formatarFormaPagamento(vendaSelecionada.forma_pagamento)}
              </div>
              <div>
                <strong>Total:</strong>
                <br />
                <span className="text-xl font-bold" style={{ color: "var(--success-color)" }}>
                  R$ {(Number(vendaSelecionada.total) || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <h4 className="font-bold mb-2">Itens da Venda:</h4>
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
                {vendaSelecionada.itens.map((item, index) => (
                  <tr key={index}>
                    <td>{item.produto_nome}</td>
                    <td>{item.quantidade}</td>
                    <td>R$ {item.preco_unitario.toFixed(2)}</td>
                    <td>R$ {item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-4 gap-2">
              <button className="btn btn-primary" onClick={() => imprimirCupom(vendaSelecionada)}>
                <Printer size={16} />
                Imprimir Cupom
              </button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
