"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from '@/hooks/use-toast'
import ConfirmationModal from '@/components/confirmation-modal'
import VirtualKeyboard from '@/components/virtual-keyboard'
import Loading from "@/components/loading"
import SearchHint from "@/components/search-hint"
import { Search, Plus, Minus, Trash2, ShoppingCart, X } from "lucide-react"
import '../../styles/components.css'

interface Produto {
  id: number
  codigo_barras: string
  nome: string
  preco: number
  estoque: number
}

interface Cliente {
  id: number
  nome: string
  cpf: string
  limite_credito: number
  debito_atual: number
}

interface ItemVenda {
  produto: Produto
  quantidade: number
  subtotal: number
}

export default function VendasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([])
  const [codigoBusca, setCodigoBusca] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  
  // Modal de pagamento
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [pagamentos, setPagamentos] = useState<
    Array<{ tipo: "dinheiro" | "cartao_debito" | "cartao_credito" | "pix" | "fiado"; valor: string }>
  >([{ tipo: "dinheiro", valor: "" }])
  
  const [loading, setLoading] = useState(false)
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [vendaConcluida, setVendaConcluida] = useState(false)
  const [cupomTexto, setCupomTexto] = useState<string | null>(null)

  // Estados para modal de identificação de cliente
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [buscarClienteQuery, setBuscarClienteQuery] = useState("")

  // Estados para confirmação de split automático de fiado
  const [showConfirmSplit, setShowConfirmSplit] = useState(false)
  const [pendingSplit, setPendingSplit] = useState<{ available: number; remaining: number } | null>(null)

  // Discount support: type can be 'none' | 'valor' | 'percent'
  const [discountType, setDiscountType] = useState<"none" | "valor" | "percent">("none")
  const [discountValue, setDiscountValue] = useState("")

  // Estados para teclado virtual
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null)
  const [activeInputField, setActiveInputField] = useState<string>("")

  const totalBeforeDiscount = carrinho.reduce((sum, item) => sum + Number(item.subtotal), 0)
  const parsedDiscount = Math.max(0, Number.parseFloat(discountValue || "0")) || 0
  let discountAmount = 0
  if (discountType === "valor") {
    discountAmount = Math.min(parsedDiscount, totalBeforeDiscount)
  } else if (discountType === "percent") {
    discountAmount = Math.min((parsedDiscount / 100) * totalBeforeDiscount, totalBeforeDiscount)
  }
  const total = Math.max(0, totalBeforeDiscount - discountAmount)

  // Helper: arredonda para centavos (evita problemas de comparação float)
  const roundCents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
  const totalRounded = roundCents(total)

  // disponibilidade do cliente selecionado (limite - débito atual)
  const clienteAvailable = clienteSelecionado ? Math.max(0, clienteSelecionado.limite_credito - (clienteSelecionado.debito_atual || 0)) : 0
  const clienteLimiteInsuficiente = clienteSelecionado ? clienteAvailable < totalRounded : false
  // total pretendido em fiado (usado para avisos dentro do modal)
  const totalFiadoSelected = pagamentos
    .filter((p) => p.tipo === "fiado")
    .reduce((s, p) => s + (Number.parseFloat(p.valor || "0") || 0), 0)

                {/* Mensagem de limite do cliente selecionado (mostra erro no próprio card/modal) */}
                {clienteSelecionado && pagamentos.some((p) => p.tipo === 'fiado') && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    {clienteLimiteInsuficiente ? (
                      <div style={{ color: 'var(--danger-color)', fontWeight: 600 }}>
                        Limite insuficiente: disponível R$ {clienteAvailable.toFixed(2)}. O restante será cobrado por outra forma de pagamento.
                      </div>
                    ) : (
                      <div style={{ color: 'var(--success-color)' }}>
                        Limite disponível: R$ {clienteAvailable.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
  const sumPagamentosRaw = pagamentos.reduce((s, p) => s + (Number.parseFloat(p.valor || "0") || 0), 0)
  const sumPagamentos = roundCents(sumPagamentosRaw)
  const restante = Math.max(0, roundCents(totalRounded - sumPagamentos))
  const troco = Math.max(0, roundCents(sumPagamentos - totalRounded))

  useEffect(() => {
    carregarClientes()
  }, [])

  // Nova função de busca de produtos mais robusta
  const buscarProdutos = async (query: string, mode: 'search' | 'exact' = 'search') => {
    if (!query || query.trim().length < 2) {
      setProdutos([])
      return
    }

    setLoadingProdutos(true)
    console.log(`[VENDAS] Buscando produtos: "${query}" (modo: ${mode})`)
    
    try {
      const params = new URLSearchParams({ 
        q: query.trim(), 
        mode: mode,
        limit: "15" 
      })
      
      const response = await fetch(`/api/produtos?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setProdutos(Array.isArray(data) ? data : [])
        console.log(`[VENDAS] Encontrados ${Array.isArray(data) ? data.length : 0} produtos`)
      } else {
        console.error('[VENDAS] Erro na API:', data)
        setProdutos([])
      }
    } catch (error) {
      console.error("[VENDAS] Erro ao buscar produtos:", error)
      setProdutos([])
    } finally {
      setLoadingProdutos(false)
    }
  }

  // Debounce otimizado para busca automática
  const debounceRef = useRef<number | null>(null)
  useEffect(() => {
    // Limpa produtos se input muito curto
    if (!codigoBusca || codigoBusca.trim().length < 2) {
      setProdutos([])
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      return
    }

    // Cancela busca anterior se ainda pendente
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Nova busca após 250ms de inatividade
    debounceRef.current = window.setTimeout(() => {
      buscarProdutos(codigoBusca, 'search')
    }, 250)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [codigoBusca])

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

  // Buscar produto e adicionar ao carrinho; quando utilizado via ENTER tenta correspondência exata
  const buscarProduto = async (exact = false) => {
    if (!codigoBusca || codigoBusca.trim().length === 0) return

    // Se exact=true, consultamos servidor com o codigo completo
    await buscarProdutos(codigoBusca, exact ? 'exact' : 'search')

    let produto: Produto | undefined
    if (exact) {
      produto = produtos.find((p) => p.codigo_barras === codigoBusca || p.nome.toLowerCase() === codigoBusca.toLowerCase())
    } else {
      produto = produtos.find(
        (p) => p.codigo_barras === codigoBusca || p.nome.toLowerCase().includes(codigoBusca.toLowerCase()),
      )
    }

    if (produto) {
      adicionarAoCarrinho(produto)
      setCodigoBusca("")
      setProdutos([])
    } else {
      toast({ title: 'Produto não encontrado', description: 'Produto não encontrado!', variant: 'warning' })
    }
  }

  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find((item) => item.produto.id === produto.id)

    if (itemExistente) {
      if (itemExistente.quantidade < produto.estoque) {
        setCarrinho(
          carrinho.map((item) =>
            item.produto.id === produto.id
              ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * produto.preco }
              : item,
          ),
        )
        } else {
        toast({ title: 'Estoque insuficiente', description: 'Estoque insuficiente!' , variant: 'destructive'})
      }
    } else {
      if (produto.estoque > 0) {
        setCarrinho([
          ...carrinho,
          {
            produto,
            quantidade: 1,
            subtotal: produto.preco,
          },
        ])
      } else {
        toast({ title: 'Produto sem estoque', description: 'Produto sem estoque!' , variant: 'destructive'})
      }
    }
  }

  const alterarQuantidade = (produtoId: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId)
      return
    }

    const produto = produtos.find((p) => p.id === produtoId)
    if (produto && novaQuantidade <= produto.estoque) {
      setCarrinho(
        carrinho.map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: novaQuantidade, subtotal: novaQuantidade * item.produto.preco }
            : item,
        ),
      )
    } else {
      toast({ title: 'Quantidade inválida', description: 'Quantidade excede o estoque disponível!', variant: 'destructive' })
    }
  }

  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho(carrinho.filter((item) => item.produto.id !== produtoId))
  }

  const abrirModalPagamento = () => {
    if (carrinho.length === 0) {
      toast({ title: 'Carrinho vazio', description: 'Carrinho vazio!' , variant: 'destructive'})
      return
    }

    // Resetar pagamentos para o valor total
    // sempre abrir com um único campo; usar total arredondado
    setPagamentos([{ tipo: "dinheiro", valor: totalRounded.toFixed(2) }])
    setShowPagamentoModal(true)
  }

  const fecharModalPagamento = () => {
    // Resetar modal e desfazer transação
    setPagamentos([{ tipo: "dinheiro", valor: "" }])
    setShowPagamentoModal(false)
    // Resetar teclado virtual
    setActiveInputIndex(null)
    setActiveInputField("")
    // Note: não resetamos clienteSelecionado aqui pois pode ter sido selecionado via botão "Identificar Cliente"
  }

  // Funções do teclado virtual
  const handleInputFocus = (index: number, fieldName: string) => {
    setActiveInputIndex(index)
    setActiveInputField(fieldName)
  }

  const handleKeyPress = (key: string) => {
    if (activeInputIndex === null) return

    const currentPagamento = pagamentos[activeInputIndex]
    if (!currentPagamento) return

    let currentValue = currentPagamento.valor || ""
    
    if (key === ".") {
      // Adicionar vírgula decimal se não existir
      if (!currentValue.includes(",")) {
        currentValue += ","
      }
    } else {
      // Para números, simplesmente adicionar
      currentValue += key
    }

    // Limitar a 2 casas decimais após a vírgula
    if (currentValue.includes(",")) {
      const parts = currentValue.split(",")
      if (parts[1] && parts[1].length > 2) {
        currentValue = parts[0] + "," + parts[1].substring(0, 2)
      }
    }

    // Atualizar o valor
    const newPagamentos = [...pagamentos]
    newPagamentos[activeInputIndex].valor = currentValue
    setPagamentos(newPagamentos)
  }

  const handleBackspace = () => {
    if (activeInputIndex === null) return

    const currentPagamento = pagamentos[activeInputIndex]
    if (!currentPagamento) return

    let currentValue = currentPagamento.valor || ""
    currentValue = currentValue.slice(0, -1)

    const newPagamentos = [...pagamentos]
    newPagamentos[activeInputIndex].valor = currentValue
    setPagamentos(newPagamentos)
  }

  const handleClear = () => {
    if (activeInputIndex === null) return

    const newPagamentos = [...pagamentos]
    newPagamentos[activeInputIndex].valor = ""
    setPagamentos(newPagamentos)
  }

  const processarPagamento = async () => {
    // Proteção contra múltiplas execuções simultâneas
    if (loading) {
      return
    }
    
    // Se houver pagamento fiado, precisa ter cliente selecionado
    const totalFiado = pagamentos
      .filter((p) => p.tipo === "fiado")
      .reduce((s, p) => s + (Number.parseFloat(p.valor || "0") || 0), 0)

    if (totalFiado > 0 && !clienteSelecionado) {
      toast({ title: 'Cliente necessário', description: 'Selecione um cliente para venda fiado!', variant: 'destructive' })
      return
    }

    // Validação: soma dos pagamentos deve cobrir o total (usar valores arredondados)
    if (sumPagamentos < totalRounded) {
      toast({ title: 'Pagamento insuficiente', description: 'Valor pago insuficiente. Adicione outra forma de pagamento ou ajuste os valores.', variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      // Se existir pagamento fiado, verificar limite disponível e oferecer split automático
      if (totalFiado > 0 && clienteSelecionado) {
        const available = Math.max(0, clienteSelecionado.limite_credito - clienteSelecionado.debito_atual)
        if (totalFiado > available) {
          const remaining = totalFiado - available
          // abrir modal de confirmação (assíncrono)
          setPendingSplit({ available, remaining })
          setShowConfirmSplit(true)
          setLoading(false)
          return
        }
      }

      const vendaData = {
        cliente_id: clienteSelecionado?.id || null,
        total: totalRounded,
        pagamentos: pagamentos.map((p) => ({ tipo_pagamento: p.tipo, valor: Number.parseFloat(p.valor || "0") })),
        troco,
        itens: carrinho.map((item) => ({
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          preco_unitario: item.produto.preco,
          subtotal: item.subtotal,
        })),
      }

      const response = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendaData),
      })

      if (response.ok) {
        toast({ title: 'Venda finalizada', description: 'Venda finalizada com sucesso!', variant: 'success' })
        setCarrinho([])
        setClienteSelecionado(null)
        setPagamentos([{ tipo: "dinheiro", valor: "" }])
        setShowPagamentoModal(false)
        // Atualiza a listagem atual (caso haja uma busca ativa)
        if (codigoBusca && codigoBusca.trim().length >= 2) {
          buscarProdutos(codigoBusca, 'search')
        }
        carregarClientes() // Atualizar débitos

        // Buscar cupom gerado para essa venda e marcar estado de venda concluída
        try {
          const respJson = await response.json()
          const vendaId = respJson.vendaId
          const cupResp = await fetch(`/api/cupons/by-venda/${vendaId}`)
          if (cupResp.ok) {
            const cup = await cupResp.json()
            setCupomTexto(cup.conteudo_texto)
            setVendaConcluida(true)
          }
        } catch (err) {
          console.error('Erro ao buscar cupom:', err)
        }
       } else {
         throw new Error("Erro ao finalizar venda")
       }
    } catch (error) {
      console.error("Erro ao finalizar venda:", error)
      toast({ title: 'Erro', description: 'Erro ao finalizar venda!', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSplit = async () => {
    if (!pendingSplit) return
    
    const { available, remaining } = pendingSplit

    // Ajustar pagamentos: reduzir fiado ao limite disponível e adicionar pagamento para o restante
    let adjusted = false
    const newPagamentos = pagamentos.map((p) => {
      if (p.tipo === "fiado" && !adjusted) {
        adjusted = true
        return { ...p, valor: String(available.toFixed(2)) }
      }
      return p
    })

    // adicionar pagamento para remainder (usar dinheiro por padrão)
    newPagamentos.push({ tipo: "dinheiro", valor: String(remaining.toFixed(2)) })
    
    // atualizar estado local para refletir a divisão automática
    setPagamentos(newPagamentos)

    // limpar estados do modal
    setPendingSplit(null)
    setShowConfirmSplit(false)
    
    // Processar novamente sem setTimeout para evitar duplicação
    processarPagamento()
  }

  const buscarCupomFiscal = async () => {
    if (carrinho.length === 0) return

    try {
      const response = await fetch(`/api/cupom-fiscal?codigo_venda=${btoa(JSON.stringify(carrinho))}`)
      const data = await response.json()

      if (response.ok) {
        setCupomTexto(data.cupom || null)
        setVendaConcluida(true)
      } else {
        console.error('[CUPOM FISCAL] Erro na API:', data)
        setCupomTexto(null)
      }
    } catch (error) {
      console.error("[CUPOM FISCAL] Erro ao buscar cupom:", error)
      setCupomTexto(null)
    }
  }

  return (
    <div className="pdv-container">
      {/* Área de Produtos / Novo ciclo */}
      {!vendaConcluida ? (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Adicionar Produtos</h2>
          </div>

          <div className="card-content">
            <div className="form-group" style={{ flexShrink: 0 }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Código de barras ou nome do produto"
                    value={codigoBusca}
                    onChange={(e) => setCodigoBusca(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        buscarProduto(true)
    
                        {/* Modal de confirmação para split automático de fiado */}
                        {showConfirmSplit && pendingSplit && (
                          <ConfirmationModal
                            isOpen={showConfirmSplit}
                            onClose={() => { setShowConfirmSplit(false); setPendingSplit(null) }}
                            onConfirm={handleConfirmSplit}
                            title="Confirmar divisão de pagamento"
                            message={`Cliente tem disponível R$ ${pendingSplit.available.toFixed(2)} para fiado. Deseja anotar R$ ${pendingSplit.available.toFixed(2)} no fiado e cobrar R$ ${pendingSplit.remaining.toFixed(2)} por outra forma de pagamento?`}
                            type="warning"
                            confirmText="Dividir e continuar"
                            cancelText="Cancelar"
                          />
                        )}

                    }
                  }}
                />
                <button className="btn btn-primary" onClick={() => buscarProduto(false)}>
                  <Search size={20} />
                </button>
              </div>
          </div>

          <div className="card-scrollable">
            {loadingProdutos ? (
              <div className="p-4">
                <Loading />
              </div>
            ) : codigoBusca.trim().length >= 2 ? (
              produtos.length === 0 ? (
                <div className="p-4">
                  <SearchHint>Nenhum produto encontrado para "{codigoBusca}". Tente termos diferentes.</SearchHint>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Preço</th>
                      <th>Estoque</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((produto) => (
                      <tr key={produto.id}>
                        <td>
                          <div>
                            <div className="font-bold">{produto.nome}</div>
                            <div className="text-sm text-muted">{produto.codigo_barras}</div>
                          </div>
                        </td>
                        <td>R$ {Number(produto.preco).toFixed(2)}</td>
                        <td>{produto.estoque}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => adicionarAoCarrinho(produto)}
                            disabled={produto.estoque === 0}
                          >
                            <Plus size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              <div className="p-4">
                <SearchHint>Digite pelo menos 2 caracteres para buscar produtos (código ou nome).</SearchHint>
              </div>
            )}
          </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <h3 className="font-bold">Venda concluída</h3>
            <p className="text-sm text-muted">A venda foi finalizada com sucesso.</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => {
                // reiniciar estado para nova venda
                setVendaConcluida(false)
                setCupomTexto(null)
                setCarrinho([])
                setClienteSelecionado(null)
                setPagamentos([{ tipo: 'dinheiro', valor: '' }])
                setCodigoBusca('')
              }}>Nova venda</button>
            </div>
          </div>
        </div>
      )}

      {/* Carrinho PDV */}
      <div className="card">
        {/* Header do Carrinho */}
        <div className="card-header" style={{ padding: "1rem", borderBottom: "2px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <h2 className="card-title flex items-center gap-2" style={{ margin: 0, fontSize: "1.25rem" }}>
              <ShoppingCart size={20} />
              PDV - Carrinho
            </h2>
            <div className="text-sm text-muted">
              {carrinho.length} {carrinho.length === 1 ? "item" : "itens"}
            </div>
          </div>
          
          {/* Botão Identificar Cliente no topo do carrinho */}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            {!clienteSelecionado ? (
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', fontSize: '0.9rem' }}
                onClick={() => setShowClienteModal(true)}
                disabled={carrinho.length === 0}
              >
                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                Identificar Cliente
              </button>
            ) : (
              <div className="client-identified">
                <div className="client-identified-header">
                  <div style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    background: 'var(--primary)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </div>
                  Cliente Identificado
                </div>
                
                <div className="client-identified-name">
                  {clienteSelecionado.nome}
                </div>
                
                <div className="client-identified-info">
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>ID:</div>
                    <div>{clienteSelecionado.id}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Crédito:</div>
                    <div style={{ 
                      color: Math.max(0, clienteSelecionado.limite_credito - (clienteSelecionado.debito_atual || 0)) > 0 
                        ? '#059669' : '#dc2626',
                      fontWeight: '600'
                    }}>
                      R$ {Math.max(0, clienteSelecionado.limite_credito - (clienteSelecionado.debito_atual || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="client-identified-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setClienteSelecionado(null)}
                    title="Remover identificação"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.8rem'
                    }}
                  >
                    <X size={14} />
                    Alterar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Itens */}
        <div 
          style={{ 
            maxHeight: "280px", 
            overflowY: "auto", 
            background: "var(--background)",
            borderBottom: "1px solid var(--border)"
          }}
        >
          {carrinho.length === 0 ? (
            <div className="text-center p-8" style={{ color: "var(--text-muted)" }}>
              <ShoppingCart size={48} style={{ opacity: 0.3, margin: "0 auto 1rem" }} />
              <p style={{ margin: 0, fontSize: "1.1rem" }}>Carrinho vazio</p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>Escaneie ou busque produtos para adicionar</p>
            </div>
          ) : (
            <div style={{ padding: "0.5rem 0" }}>
              {carrinho.map((item, index) => (
                <div 
                  key={item.produto.id} 
                  className="pdv-item"
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: index < carrinho.length - 1 ? "1px solid var(--border)" : "none",
                    background: index % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)"
                  }}
                >
                  {/* Linha principal do produto */}
                  <div className="flex items-start justify-between mb-2">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-semibold" style={{ 
                        fontSize: "0.95rem", 
                        lineHeight: "1.2",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {item.produto.nome}
                      </div>
                      <div style={{ 
                        fontSize: "0.8rem", 
                        color: "var(--text-muted)",
                        fontFamily: "monospace"
                      }}>
                        {item.produto.codigo_barras}
                      </div>
                    </div>

                    <button 
                      className="btn btn-xs btn-danger" 
                      onClick={() => removerDoCarrinho(item.produto.id)}
                      style={{ 
                        padding: "0.25rem", 
                        minWidth: "auto",
                        marginLeft: "0.5rem"
                      }}
                      title="Remover item"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Linha de quantidade e valores */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        R$ {Number(item.produto.preco).toFixed(2)} un
                      </div>
                      
                      {/* Controles de quantidade */}
                      <div className="flex items-center" style={{ 
                        border: "1px solid var(--border)", 
                        borderRadius: "0.25rem",
                        background: "white"
                      }}>
                        <button 
                          className="btn-qty" 
                          onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                          style={{
                            border: "none",
                            background: "none",
                            padding: "0.25rem 0.5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center"
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <div style={{ 
                          padding: "0.25rem 0.75rem",
                          borderLeft: "1px solid var(--border)",
                          borderRight: "1px solid var(--border)",
                          minWidth: "3rem",
                          textAlign: "center",
                          fontWeight: "600"
                        }}>
                          {item.quantidade}
                        </div>
                        <button 
                          className="btn-qty" 
                          onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                          style={{
                            border: "none",
                            background: "none",
                            padding: "0.25rem 0.5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center"
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal do item */}
                    <div className="font-bold" style={{ 
                      fontSize: "1rem", 
                      color: "var(--primary-color)",
                      minWidth: "5rem",
                      textAlign: "right"
                    }}>
                      R$ {Number(item.subtotal).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seção de Desconto */}
        {carrinho.length > 0 && (
          <div style={{ 
            padding: "1rem", 
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)"
          }}>
            <div className="flex items-center gap-2 mb-2">
              <label className="font-semibold" style={{ fontSize: "0.9rem" }}>Desconto:</label>
              <select 
                className="form-select" 
                value={discountType} 
                onChange={(e) => setDiscountType(e.target.value as any)}
                style={{ fontSize: "0.85rem", padding: "0.25rem 0.5rem" }}
              >
                <option value="none">Sem desconto</option>
                <option value="valor">Valor (R$)</option>
                <option value="percent">Porcentagem (%)</option>
              </select>

              {discountType !== "none" && (
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  style={{ 
                    width: "7rem", 
                    fontSize: "0.85rem", 
                    padding: "0.25rem 0.5rem" 
                  }}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percent" ? "0-100" : "0.00"}
                />
              )}
            </div>

            {discountAmount > 0 && (
              <div style={{ 
                fontSize: "0.85rem", 
                color: "var(--warning-color)",
                fontWeight: "500"
              }}>
                Desconto aplicado: -R$ {Number(discountAmount).toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Resumo de Totais */}
        {carrinho.length > 0 && (
          <div style={{ 
            padding: "1rem",
            background: "var(--surface)",
            borderBottom: "2px solid var(--border)"
          }}>
            <div className="flex justify-between mb-2" style={{ fontSize: "0.9rem" }}>
              <span>Subtotal:</span>
              <span>R$ {Number(totalBeforeDiscount).toFixed(2)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between mb-2" style={{ 
                fontSize: "0.9rem",
                color: "var(--warning-color)"
              }}>
                <span>Desconto:</span>
                <span>-R$ {Number(discountAmount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between" style={{ 
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "var(--primary-color)",
              borderTop: "1px solid var(--border)",
              paddingTop: "0.5rem"
            }}>
              <span>TOTAL:</span>
              <span>R$ {Number(total).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Botão Finalizar / Estado de venda concluída */}
        <div style={{ padding: "1rem" }}>
          {!vendaConcluida ? (
            <button
              className="btn btn-success"
              style={{ 
                width: "100%", 
                fontSize: "1.1rem",
                padding: "0.75rem",
                fontWeight: "bold",
                borderRadius: "0.5rem"
              }}
              onClick={abrirModalPagamento}
              disabled={carrinho.length === 0}
            >
              <div className="flex items-center justify-center gap-2">
                <ShoppingCart size={20} />
                FINALIZAR VENDA - R$ {Number(total).toFixed(2)}
              </div>
            </button>
          ) : (
            <div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', fontSize: "1rem", padding: "0.6rem" }}
                onClick={() => {
                  if (cupomTexto) {
                      const w = window.open('', '_blank')
                      if (w) {
                        w.document.write(`<pre style="font-family: 'Courier New', Courier, monospace; white-space: pre-wrap;">${cupomTexto.replace(/</g,'&lt;')}</pre>`) 
                        w.document.close()
                        // Tenta abrir a janela de impressão automaticamente e fecha a janela ao final
                        try {
                          w.focus()
                          // esperar o conteúdo renderizar antes de chamar print
                          setTimeout(() => {
                            try { w.print() } catch (e) { /* ignore */ }
                            try { w.close() } catch (e) { /* ignore */ }
                          }, 200)
                        } catch (e) {
                          // fallback: apenas focar
                        }
                      }
                    } else {
                      toast({ title: 'Cupom indisponível', description: 'Cupom ainda não disponível', variant: 'destructive' })
                    }
                }}
              >
                Imprimir cupom fiscal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Busca de Cliente */}
      {showClienteModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1100,
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => {
            setShowClienteModal(false)
            setBuscarClienteQuery('')
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            style={{
              maxWidth: '600px',
              width: '100%',
              background: 'var(--card)',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface)'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                fontWeight: '700',
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'var(--primary)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  👤
                </div>
                Selecionar Cliente
              </h3>
            </div>
            
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ 
                  fontWeight: '600', 
                  marginBottom: '0.75rem',
                  display: 'block'
                }}>
                  Buscar cliente:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Digite o nome do cliente..."
                  value={buscarClienteQuery}
                  onChange={(e) => setBuscarClienteQuery(e.target.value)}
                  autoFocus
                  style={{
                    fontSize: '1rem',
                    padding: '0.875rem'
                  }}
                />
              </div>
              
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                paddingRight: '0.5rem',
                marginRight: '-0.5rem'
              }}>
                {clientes
                  .filter(cliente => 
                    buscarClienteQuery === '' || 
                    cliente.nome.toLowerCase().includes(buscarClienteQuery.toLowerCase())
                  )
                  .map((cliente) => {
                    const creditoDisponivel = Math.max(0, cliente.limite_credito - (cliente.debito_atual || 0));
                    return (
                      <div
                        key={cliente.id}
                        className="client-card"
                        onClick={() => {
                          setClienteSelecionado(cliente)
                          setShowClienteModal(false)
                          setBuscarClienteQuery('')
                        }}
                      >
                        <div className="client-card-name">
                          {cliente.nome}
                        </div>
                        <div className="client-card-details">
                          <span>ID: {cliente.id}</span>
                          <div className={`client-card-credit ${creditoDisponivel > 0 ? 'positive' : 'negative'}`}>
                            R$ {creditoDisponivel.toFixed(2)} disponível
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {clientes.filter(cliente => 
                  buscarClienteQuery === '' || 
                  cliente.nome.toLowerCase().includes(buscarClienteQuery.toLowerCase())
                ).length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem 2rem', 
                    color: 'var(--muted-foreground)' 
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: '0.3' }}>🔍</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {buscarClienteQuery === '' ? 'Carregando clientes...' : 'Nenhum cliente encontrado'}
                    </div>
                    {buscarClienteQuery !== '' && (
                      <div style={{ fontSize: '0.9rem' }}>
                        Tente buscar com outro nome
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer" style={{ 
              padding: '1rem 1.5rem', 
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex', 
              justifyContent: 'flex-end' 
            }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowClienteModal(false)
                  setBuscarClienteQuery('')
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pagamento */}
      {showPagamentoModal && (
        <div className="modal-overlay">
          <div className="modal payment-modal">
            <div className="payment-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Finalizar Pagamento</h3>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => fecharModalPagamento()}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4 p-4 rounded" style={{ background: "var(--surface)" }}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    Total: R$ {Number(total).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted mt-1">
                    {carrinho.length} {carrinho.length === 1 ? "item" : "itens"}
                  </div>
                </div>
              </div>

            {/* Gerenciador de Múltiplas Formas de Pagamento */}
            <div className="form-group mb-3">
              <label className="form-label font-semibold">Formas de Pagamento</label>
              <div className="space-y-2">
                {pagamentos.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      className="form-select"
                      value={p.tipo}
                      onChange={(e) => {
                        const newPag = [...pagamentos]
                        newPag[idx].tipo = e.target.value as any
                        setPagamentos(newPag)
                      }}
                      style={{ width: "45%" }}
                    >
                      <option value="dinheiro">💵 Dinheiro</option>
                      <option value="cartao_debito">💳 Cartão Débito</option>
                      <option value="cartao_credito">💳 Cartão Crédito</option>
                      <option value="pix">📱 PIX</option>
                      <option value="fiado">📋 Fiado</option>
                    </select>

                    <input
                      type="text"
                      className={`form-input ${activeInputIndex === idx ? 'keyboard-active' : ''}`}
                      value={p.valor}
                      onChange={(e) => {
                        const newPag = [...pagamentos]
                        newPag[idx].valor = e.target.value
                        setPagamentos(newPag)
                      }}
                      onFocus={() => handleInputFocus(idx, `Pagamento ${idx + 1}`)}
                      onBlur={() => {
                        const newPag = [...pagamentos]
                        const parsed = Math.max(0, Number.parseFloat(newPag[idx].valor?.replace(',', '.') || "0") || 0)
                        newPag[idx].valor = parsed.toFixed(2).replace('.', ',')
                        setPagamentos(newPag)
                      }}
                      placeholder="0,00"
                      style={{ width: "35%" }}
                      readOnly={activeInputIndex === idx}
                    />

                    {pagamentos.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-xs btn-danger"
                        onClick={() => setPagamentos(pagamentos.filter((_, i) => i !== idx))}
                        title="Remover pagamento"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      // Adicionar nova forma com o restante se houver, senão vazio
                      const valorInicial = restante > 0 ? restante.toFixed(2) : ""
                      setPagamentos([...pagamentos, { tipo: "dinheiro", valor: valorInicial }])
                    }}
                  >
                    <Plus size={16} />
                    Adicionar forma de pagamento
                  </button>
                </div>
              </div>
            </div>

            {/* Resumo de Pagamentos */}
            <div className="mb-4 p-3 rounded" style={{ background: "var(--surface)" }}>
              <div className="flex justify-between mb-2">
                <span>Total dos pagamentos:</span>
                <span className="font-semibold">R$ {Number(sumPagamentos).toFixed(2)}</span>
              </div>
              
              {sumPagamentos > total && (
                <div className="flex justify-between mb-2" style={{ color: "var(--success-color)" }}>
                  <span>Troco:</span>
                  <span className="font-semibold">R$ {Number(troco).toFixed(2)}</span>
                </div>
              )}
              
              {sumPagamentos < totalRounded && (
                <div className="flex justify-between" style={{ color: "var(--danger-color)" }}>
                  <span>Falta pagar:</span>
                  <span className="font-semibold">R$ {Number(restante).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Aviso em card: saldo insuficiente (unificado para evitar redundância) */}
            {clienteSelecionado && clienteAvailable < totalRounded && (
              <div style={{
                border: `1px solid rgba(255, 193, 7, 0.3)`,
                background: 'rgba(255, 193, 7, 0.05)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--warning-color)', marginBottom: '0.25rem', fontSize: '1rem' }}>⚠️ Crédito insuficiente</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Cliente: <strong>{clienteSelecionado.nome}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Crédito disponível: <strong>R$ {clienteAvailable.toFixed(2)}</strong> • Total da compra: <strong>R$ {totalRounded.toFixed(2)}</strong>
                  {pagamentos.some((p) => p.tipo === 'fiado') && totalFiadoSelected > clienteAvailable && (
                    <>
                      <br />
                      Valor solicitado em fiado: <strong>R$ {Number(totalFiadoSelected).toFixed(2)}</strong>. O sistema usará R$ {clienteAvailable.toFixed(2)} em fiado e cobrará R$ {Number(totalFiadoSelected - clienteAvailable).toFixed(2)} por outra forma automaticamente.
                    </>
                  )}
                  {!pagamentos.some((p) => p.tipo === 'fiado') && (
                    <>
                      <br />
                      É necessário utilizar outras formas de pagamento para completar a transação.
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Cliente (se houver qualquer parcela em fiado) */}
            {pagamentos.some((p) => p.tipo === "fiado") && (
              <div className="form-group mb-3">
                <label className="form-label font-semibold">Cliente para fiado</label>
                {clienteSelecionado ? (
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'var(--surface)', 
                    borderRadius: '0.375rem', 
                    border: '1px solid var(--border)' 
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {clienteSelecionado.nome}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Crédito disponível: R$ {clienteAvailable.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      style={{ marginTop: '0.25rem' }}
                      onClick={() => setClienteSelecionado(null)}
                    >
                      Alterar cliente
                    </button>
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value=""
                    onChange={(e) => {
                      const cliente = clientes.find((c) => c.id === Number.parseInt(e.target.value))
                      setClienteSelecionado(cliente || null)

                      // Se houver parcela em fiado e o cliente selecionado tiver limite inferior
                      // ao valor pedido em fiado, dividimos automaticamente
                      if (cliente) {
                        const totalFiado = pagamentos
                          .filter((p) => p.tipo === "fiado")
                          .reduce((s, p) => s + (Number.parseFloat(p.valor || "0") || 0), 0)

                        const available = Math.max(0, cliente.limite_credito - (cliente.debito_atual || 0))
                        if (totalFiado > 0 && totalFiado > available) {
                          const remaining = roundCents(totalFiado - available)

                          // Ajustar o primeiro pagamento fiado encontrado para o valor disponível
                          let adjusted = false
                          const newPagamentos = pagamentos.map((p) => {
                            if (p.tipo === "fiado" && !adjusted) {
                              adjusted = true
                              return { ...p, valor: available.toFixed(2) }
                            }
                            return p
                          })

                          // Adiciona pagamento complementar (dinheiro) para o restante
                          newPagamentos.push({ tipo: "dinheiro", valor: remaining.toFixed(2) })
                          setPagamentos(newPagamentos)

                          // Processar automaticamente com os pagamentos ajustados
                          // Chamar diretamente - `processarPagamento` tem proteção contra chamadas simultâneas via `loading`.
                          processarPagamento()
                        }
                      }
                    }}
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome} - Limite disponível: R$ {Number(Math.max(0, cliente.limite_credito - (cliente.debito_atual || 0))).toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Botões do Modal */}
            <div className="flex gap-2 justify-end mt-4">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => fecharModalPagamento()}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={processarPagamento}
                // bloquear enquanto houver restante a pagar
                disabled={loading || restante > 0}
              >
                {loading ? (
                  <>
                    <div className="loading" style={{ width: "16px", height: "16px" }}></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Confirmar Pagamento
                  </>
                )}
              </button>
            </div>
            </div>

            {/* Teclado Virtual */}
            <div className="payment-keyboard">
              <VirtualKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
                activeInput={activeInputIndex !== null ? `Pagamento ${activeInputIndex + 1}` : undefined}
              />
            </div>
          </div>
        </div>
      )}

  {/* cupom fiscal agora é acessível via o botão na área de venda concluída; bloco removido para evitar redundância */}
    </div>
  )
}
