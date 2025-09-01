"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from '@/hooks/use-toast'
import ConfirmationModal from '@/components/confirmation-modal'
import VirtualKeyboard from '@/components/virtual-keyboard'
import Loading from "@/components/loading"
import SearchHint from "@/components/search-hint"
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Settings, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
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
  const [ultimaVenda, setUltimaVenda] = useState<any>(null)

  // Estados para modal de identificação de cliente
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [buscarClienteQuery, setBuscarClienteQuery] = useState("")

  // Estados para confirmação de split automático de fiado
  const [showConfirmSplit, setShowConfirmSplit] = useState(false)
  const [pendingSplit, setPendingSplit] = useState<{ available: number; remaining: number } | null>(null)

  // Discount support: type can be 'none' | 'valor' | 'percent'
  const [discountType, setDiscountType] = useState<"none" | "valor" | "percent">("none")
  const [discountValue, setDiscountValue] = useState("")

  // Estado para controlar a exibição das opções de filtro/desconto
  const [showFilterOptions, setShowFilterOptions] = useState(false)

  // Estados para teclado virtual
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null)
  const [activeInputField, setActiveInputField] = useState<string>("")
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const paymentInputRef = useRef<HTMLInputElement | null>(null)
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState<boolean>(false)

  const totalBeforeDiscount = carrinho.reduce((sum, item) => sum + Number(item.subtotal), 0)
  const parsedDiscount = Math.max(0, parseCurrency(discountValue || "0")) || 0
  let discountAmount = 0
  if (discountType === "valor") {
    discountAmount = Math.min(parsedDiscount, totalBeforeDiscount)
  } else if (discountType === "percent") {
    discountAmount = Math.min((parsedDiscount / 100) * totalBeforeDiscount, totalBeforeDiscount)
  }
  const total = Math.max(0, totalBeforeDiscount - discountAmount)

  // Helper: arredonda para centavos (evita problemas de comparação float)
  function roundCents(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100
  }
  // Helper: parseia string de moeda que pode usar vírgula como separador decimal
  function parseCurrency(v?: string): number {
    if (!v) return 0
    // remover espaços e substituir vírgula por ponto
    const cleaned = String(v).trim().replace(/\s+/g, '').replace(',', '.')
    const num = Number.parseFloat(cleaned)
    if (Number.isNaN(num)) return 0
    return roundCents(num)
  }
  const totalRounded = roundCents(total)

  // disponibilidade do cliente selecionado (limite - débito atual)
  const clienteAvailable = clienteSelecionado ? Math.max(0, clienteSelecionado.limite_credito - (clienteSelecionado.debito_atual || 0)) : 0
  const clienteLimiteInsuficiente = clienteSelecionado ? clienteAvailable < totalRounded : false
  // total pretendido em fiado (usado para avisos dentro do modal)
  const totalFiadoSelected = pagamentos
    .filter((p) => p.tipo === "fiado")
    .reduce((s, p) => s + parseCurrency(p.valor), 0)

                {/* Mensagem de limite do cliente selecionado (mostra erro no próprio card/modal) */}
                {clienteSelecionado && pagamentos.some((p) => p.tipo === 'fiado') && (
                  <div className="muted-small">
                    {clienteLimiteInsuficiente ? (
                      <div className="danger-strong">
                        Limite insuficiente: disponível R$ {clienteAvailable.toFixed(2)}. O restante será cobrado por outra forma de pagamento.
                      </div>
                    ) : (
                      <div className="success-strong">
                        Limite disponível: R$ {clienteAvailable.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
  const sumPagamentosRaw = pagamentos.reduce((s, p) => s + parseCurrency(p.valor), 0)
  const sumPagamentos = roundCents(sumPagamentosRaw)
  const restante = Math.max(0, roundCents(totalRounded - sumPagamentos))
  const troco = Math.max(0, roundCents(sumPagamentos - totalRounded))

  // Validação de troco: apenas dinheiro permite valor superior ao total
  const pagamentosDinheiro = pagamentos.filter(p => p.tipo === "dinheiro")
  const pagamentosNaoDinheiro = pagamentos.filter(p => p.tipo !== "dinheiro")
  const totalDinheiro = pagamentosDinheiro.reduce((s, p) => s + parseCurrency(p.valor), 0)
  const totalNaoDinheiro = pagamentosNaoDinheiro.reduce((s, p) => s + parseCurrency(p.valor), 0)
  
  // Verificar se há excesso em formas não-dinheiro
  const excessoNaoDinheiro = totalNaoDinheiro > totalRounded
  const valorExcedente = Math.max(0, totalNaoDinheiro - totalRounded)
  
  // Se há múltiplas formas, verificar se o excesso é coberto pelo dinheiro
  const temMultiplasFormas = pagamentos.length > 1
  const excessoNaoPermitido = excessoNaoDinheiro || (temMultiplasFormas && totalNaoDinheiro > (totalRounded - totalDinheiro) && totalDinheiro < troco)

  useEffect(() => {
    carregarClientes()
  }, [])

  // manter foco no campo de busca por padrão
  useEffect(() => {
    if (searchInputRef.current) {
      try { searchInputRef.current.focus() } catch (e) { /* ignore */ }
    }
  }, [])

  // Focar no primeiro input de pagamento quando o modal abrir
  useEffect(() => {
    if (showPagamentoModal && paymentInputRef.current) {
      setTimeout(() => {
        try { 
          paymentInputRef.current?.focus()
          // Ativar o primeiro input para o teclado virtual
          setActiveInputIndex(0)
          setActiveInputField("Pagamento 1")
        } catch (e) { /* ignore */ }
      }, 100)
    }
  }, [showPagamentoModal])

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

  const buscarUltimaVenda = async () => {
    try {
      const response = await fetch("/api/vendas?limit=1&order=desc")
      const data = await response.json()
      if (response.ok && Array.isArray(data) && data.length > 0) {
        console.log("Dados da última venda:", data[0])
        setUltimaVenda(data[0])
      }
    } catch (error) {
      console.error("Erro ao buscar última venda:", error)
      setUltimaVenda(null)
    }
  }

  // Helper para processar formas de pagamento da última venda
  const getFormasPagamentoUltimaVenda = () => {
    if (!ultimaVenda) return []
    
    try {
      // Primeiro tenta o campo forma_pagamento_json
      if (ultimaVenda.forma_pagamento_json) {
        const pagamentosJson = JSON.parse(ultimaVenda.forma_pagamento_json)
        console.log("Dados do forma_pagamento_json:", pagamentosJson)
        if (Array.isArray(pagamentosJson)) {
          return pagamentosJson
        }
      }
      
      // Fallback para o campo pagamentos (se existir)
      if (ultimaVenda.pagamentos && Array.isArray(ultimaVenda.pagamentos)) {
        console.log("Dados do campo pagamentos:", ultimaVenda.pagamentos)
        return ultimaVenda.pagamentos
      }
      
      return []
    } catch (error) {
      console.error("Erro ao processar formas de pagamento:", error)
      return []
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
      try { searchInputRef.current?.focus() } catch (e) { /* ignore */ }
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
  try { searchInputRef.current?.focus() } catch (e) { /* ignore */ }
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
      .reduce((s, p) => s + parseCurrency(p.valor), 0)

    if (totalFiado > 0 && !clienteSelecionado) {
      toast({ title: 'Cliente necessário', description: 'Selecione um cliente para venda fiado!', variant: 'destructive' })
      return
    }

    // Validação: soma dos pagamentos deve cobrir o total (usar valores arredondados)
    if (sumPagamentos < totalRounded) {
      toast({ title: 'Pagamento insuficiente', description: 'Valor pago insuficiente. Adicione outra forma de pagamento ou ajuste os valores.', variant: 'destructive' })
      return
    }

    // Validação: troco apenas permitido em dinheiro
    if (excessoNaoDinheiro) {
      toast({ title: 'Valor superior não permitido', description: 'Formas de pagamento como cartão, PIX e fiado não permitem valores superiores ao total da compra.', variant: 'destructive' })
      return
    }

    // Validação: se há troco, deve haver dinheiro suficiente para cobri-lo
    if (troco > 0 && totalDinheiro < troco) {
      toast({ title: 'Troco inválido', description: 'Apenas pagamentos em dinheiro permitem troco. Ajuste os valores ou adicione dinheiro suficiente.', variant: 'destructive' })
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
        pagamentos: pagamentos.map((p) => ({ tipo_pagamento: p.tipo, valor: parseCurrency(p.valor) })),
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
  try { searchInputRef.current?.focus() } catch (e) { }
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
            // Buscar dados da última venda para exibir no resumo
            await buscarUltimaVenda()
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
      <div className="form-group form-group-no-shrink">
        <div className="row row-gap">
                  <input
                    ref={searchInputRef}
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
        <div className="card center-card">
          <div className="center-text">
            <h3 className="font-bold">Venda Concluída</h3>
            <p className="text-sm text-muted">A venda foi finalizada com sucesso.</p>
            
            {/* Resumo da Venda */}
            <div className="sale-summary-card">
              <div className="sale-summary-row">
                <span className="summary-label">Quantidade:</span>
                <span className="summary-value">
                  {ultimaVenda ? ultimaVenda.itens?.length || 0 : 0} {(ultimaVenda?.itens?.length || 0) === 1 ? "item" : "itens"}
                </span>
              </div>
              
              <div className="sale-summary-row">
                <span className="summary-label">Valor total:</span>
                <span className="summary-value">R$ {ultimaVenda ? Number(ultimaVenda.total || 0).toFixed(2) : "0,00"}</span>
              </div>
              
              <div className="sale-summary-row">
                <span className="summary-label">Pagamento:</span>
                <div className="summary-payments">
                  {getFormasPagamentoUltimaVenda().length > 0 ? (
                    getFormasPagamentoUltimaVenda().map((p: any, idx: number) => (
                      <div key={idx} className="payment-item">
                        <span className="payment-type">
                          {(p.tipo || p.tipo_pagamento) === 'dinheiro' ? 'Dinheiro' : 
                           (p.tipo || p.tipo_pagamento) === 'cartao_debito' ? 'Débito' :
                           (p.tipo || p.tipo_pagamento) === 'cartao_credito' ? 'Crédito' :
                           (p.tipo || p.tipo_pagamento) === 'pix' ? 'PIX' : 
                           (p.tipo || p.tipo_pagamento) === 'fiado' ? 'Fiado' : 
                           `❓ ${p.tipo || p.tipo_pagamento || 'Desconhecido'}`}
                        </span>
                        <span className="payment-value">R$ {Number(p.valor || 0).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="payment-item">
                      <span className="payment-type">Carregando...</span>
                      <span className="payment-value">R$ 0,00</span>
                    </div>
                  )}
                </div>
              </div>
              
              {ultimaVenda && Number(ultimaVenda.troco || 0) > 0 && (
                <div className="sale-summary-row troco-highlight">
                  <span className="summary-label">Troco:</span>
                  <span className="summary-value troco-value">R$ {Number(ultimaVenda.troco || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="center-actions">
              <button className="btn btn-outline" onClick={() => {
                // reiniciar estado para nova venda
                setVendaConcluida(false)
                setCupomTexto(null)
                setCarrinho([])
                setClienteSelecionado(null)
                setPagamentos([{ tipo: 'dinheiro', valor: '' }])
                setCodigoBusca('')
                setDiscountType('none')
                setDiscountValue('')
                setShowFilterOptions(false)
                setUltimaVenda(null)
              }}>Nova venda</button>
            </div>
          </div>
        </div>
      )}

      {/* Carrinho PDV */}
      <div className="card">
        {/* Header do Carrinho */}
          <div className="card-header card-header-custom">
          <div className="row row-between">
            <h2 className="card-title title-row card-title-large">
              <ShoppingCart size={20} />
              PDV - Carrinho
            </h2>
            <div className="text-sm text-muted">
              {carrinho.length} {carrinho.length === 1 ? "item" : "itens"}
            </div>
          </div>
          
          {/* Botão Identificar Cliente no topo do carrinho */}
          <div className="section-top-border">
            {!clienteSelecionado ? (
              <button
                type="button"
                className="btn btn-outline full-width-small"
                onClick={() => setShowClienteModal(true)}
                disabled={carrinho.length === 0}
              >
                <Plus size={16} className="icon-margin-right" />
                Identificar Cliente
              </button>
            ) : (
              <div className="client-identified">
                <div className="client-identified-content">
                  <div className="client-identified-icon client-identified-icon-style">✓</div>
                  
                  <div className="client-identified-name">
                    Cliente: {clienteSelecionado.nome}
                  </div>
                </div>
                
                <div className="client-identified-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setClienteSelecionado(null)}
                    title="Alterar cliente identificado"
                  >
                    Alterar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Itens */}
  <div className="cart-list-scroll">
          {carrinho.length === 0 ? (
            <div className="text-center p-8 empty-cart-muted">
              <ShoppingCart size={48} className="empty-cart-icon" />
              <p className="empty-cart-title">Carrinho vazio</p>
              <p className="empty-cart-sub">Escaneie ou busque produtos para adicionar</p>
            </div>
          ) : (
            <div className="section-padding-y">
              {carrinho.map((item, index) => (
                <div 
                  key={item.produto.id} 
                  className="pdv-item list-item-row"
                >
                  {/* Linha principal do produto */}
                  <div className="row-start-between mb-2">
                    <div className="flex-grow-min">
                      <div className="font-semibold list-item-title">
                        {item.produto.nome}
                      </div>
                      <div className="list-item-sub muted-small monospace">
                        {item.produto.codigo_barras}
                      </div>
                    </div>

                    <button 
                      className="btn btn-xs btn-danger btn-remove-item" 
                      onClick={() => removerDoCarrinho(item.produto.id)}
                      title="Remover item"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Linha de quantidade e valores */}
                  <div className="row row-start-between">
                    <div className="row row-gap-lg">
                      <div className="muted-small">R$ {Number(item.produto.preco).toFixed(2)} un</div>
                      
                      {/* Controles de quantidade */}
                      <div className="qty-control">
                        <button 
                          className="btn-qty" 
                          onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <div className="qty-value">
                          {item.quantidade}
                        </div>
                        <button 
                          className="btn-qty" 
                          onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal do item */}
                    <div className="font-bold item-subtotal">R$ {Number(item.subtotal).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seção de Opções Avançadas (Desconto) */}
        {carrinho.length > 0 && (
          <div className="section-surface-1">
            {/* Botão para mostrar/ocultar opções */}
            <button
              type="button"
              className="btn-options-toggle mb-2"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
            >
              <div className="btn-options-content">
                <Settings size={16} />
                <span>Opções Avançadas</span>
              </div>
              {showFilterOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Opções de desconto (visíveis apenas quando expandido) */}
            <div className={`filter-options ${showFilterOptions ? 'expanded' : 'collapsed'}`}>
              <div>
                <div className="row row-gap-lg mb-2">
                  <label className="font-semibold label-small">Desconto:</label>
                  <select 
                    className="form-select" 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value as any)}
                  >
                    <option value="none">Sem desconto</option>
                    <option value="valor">Valor (R$)</option>
                    <option value="percent">Porcentagem (%)</option>
                  </select>

                  {discountType !== "none" && (
                    <input
                      type="number"
                      step="0.01"
                      className="form-input input-width-7"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percent" ? "0-100" : "0.00"}
                    />
                  )}
                </div>

                {discountAmount > 0 && (
                  <div className="muted-small muted-warning fw-600">
                    Desconto aplicado: -R$ {Number(discountAmount).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resumo de Totais */}
        {carrinho.length > 0 && (
          <div className="section-surface-2">
            <div className="row row-between mb-2 muted-small">
              <span>Subtotal:</span>
              <span>R$ {Number(totalBeforeDiscount).toFixed(2)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="row row-between mb-2 muted-small muted-warning">
                <span>Desconto:</span>
                <span>-R$ {Number(discountAmount).toFixed(2)}</span>
              </div>
            )}

            <div className="row row-between total-display">
              <span>TOTAL:</span>
              <span>R$ {Number(total).toFixed(2)}</span>
            </div>
          </div>
        )}

    {/* Botão Finalizar / Estado de venda concluída */}
        <div className="section-padding">
          {!vendaConcluida ? (
              <button
              className="btn btn-success btn-full"
              onClick={abrirModalPagamento}
              disabled={carrinho.length === 0}
            >
              <div className="center-justify">
                <ShoppingCart size={20} />
                FINALIZAR VENDA - R$ {Number(total).toFixed(2)}
              </div>
            </button>
          ) : (
            <div>
              <button
                className="btn btn-primary btn-full"
                onClick={() => {
                  if (cupomTexto) {
                      const w = window.open('', '_blank')
                      if (w) {
                        w.document.write(`<pre class="cupom-pre">${cupomTexto.replace(/</g,'&lt;')}</pre>`) 
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
  <div className="modal-backdrop" onClick={() => { setShowClienteModal(false); setBuscarClienteQuery(''); try { searchInputRef.current?.focus() } catch (e) { } }}>
          <div className="modal modal-large" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <div className="modal-avatar">👤</div>
                Selecionar Cliente
              </h3>
            </div>
            
            <div className="modal-body">
              <div className="mb-2">
                <label className="form-label">
                  Buscar cliente:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Digite o nome do cliente..."
                  value={buscarClienteQuery}
                  onChange={(e) => setBuscarClienteQuery(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="modal-list-container">
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
                          try { searchInputRef.current?.focus() } catch (e) { }
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
                  <div className="empty-client-state">
                    <div className="empty-client-icon">🔍</div>
                    <div className="empty-client-title">{buscarClienteQuery === '' ? 'Carregando clientes...' : 'Nenhum cliente encontrado'}</div>
                    {buscarClienteQuery !== '' && (
                      <div className="empty-client-sub">Tente buscar com outro nome</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowClienteModal(false)
                  setBuscarClienteQuery('')
                  try { searchInputRef.current?.focus() } catch (e) { }
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
          <div className={`modal payment-modal ${showVirtualKeyboard ? 'with-keyboard' : ''}`}>
            <div className="payment-layout">
              <div className="payment-content">
                <div className="modal-header-row">
                  <h3 className="modal-title-text">Finalizar Pagamento</h3>
                  <button 
                    className="btn btn-sm btn-outline modal-close-btn"
                    onClick={() => fecharModalPagamento()}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="payment-summary-card payment-summary-center">
                  <div className="payment-total-amount">Total: R$ {Number(total).toFixed(2)}</div>
                  <div className="payment-items-count">{carrinho.length} {carrinho.length === 1 ? "item" : "itens"}</div>
                  
                  {/* Opção de Teclado Virtual */}
                  <div className="keyboard-toggle-section">
                    <button
                      type="button"
                      className={`btn btn-xs ${showVirtualKeyboard ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
                      title={showVirtualKeyboard ? 'Ocultar teclado virtual' : 'Exibir teclado virtual'}
                    >
                      🔢 {showVirtualKeyboard ? 'Ocultar' : 'Exibir'} Teclado Virtual
                    </button>
                  </div>
                </div>

            {/* Gerenciador de Múltiplas Formas de Pagamento */}
            <div className="form-group mb-3">
              <label className="form-label font-semibold">Formas de Pagamento</label>
              <div className="space-y-2">
                {pagamentos.map((p, idx) => (
                  <div key={idx} className="row row-gap">
                    <select
                      className="form-select select-45"
                      value={p.tipo}
                      onChange={(e) => {
                        const newPag = [...pagamentos]
                        newPag[idx].tipo = e.target.value as any
                        setPagamentos(newPag)
                      }}
                    
                    >
                      <option value="dinheiro">💵 Dinheiro</option>
                      <option value="cartao_debito">💳 Cartão Débito</option>
                      <option value="cartao_credito">💳 Cartão Crédito</option>
                      <option value="pix">📱 PIX</option>
                      <option value="fiado">📋 Fiado</option>
                    </select>

                    <input
                      ref={idx === 0 ? paymentInputRef : undefined}
                      type="text"
                      className={`form-input ${activeInputIndex === idx ? 'keyboard-active' : ''} input-35`}
                      value={p.valor}
                      onChange={(e) => {
                        const newPag = [...pagamentos]
                        newPag[idx].valor = e.target.value
                        setPagamentos(newPag)
                      }}
                      onFocus={() => handleInputFocus(idx, `Pagamento ${idx + 1}`)}
                      onBlur={() => {
                        const newPag = [...pagamentos]
                        const parsed = Math.max(0, parseCurrency(newPag[idx].valor))
                        newPag[idx].valor = parsed.toFixed(2).replace('.', ',')
                        setPagamentos(newPag)
                      }}
                      placeholder="0,00"
                      
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
            <div className="payment-summary-box">
              <div className="summary-row">
                <span>Total dos pagamentos:</span>
                <span className="font-semibold">R$ {Number(sumPagamentos).toFixed(2)}</span>
              </div>

              {sumPagamentos > total && (
                <div className="summary-row text-success">
                  <span>Troco:</span>
                  <span className="font-semibold">R$ {Number(troco).toFixed(2)}</span>
                </div>
              )}

              {sumPagamentos < totalRounded && (
                <div className="summary-row text-danger">
                  <span>Falta pagar:</span>
                  <span className="font-semibold">R$ {Number(restante).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Aviso: Troco apenas em dinheiro */}
            {(excessoNaoDinheiro || (temMultiplasFormas && sumPagamentos > totalRounded && totalDinheiro === 0)) && (
              <div className="alert-danger">
                <div className="alert-title">🚫 Valor superior não permitido</div>
                <div className="alert-body">
                  {excessoNaoDinheiro ? (
                    <>
                      Formas de pagamento como <strong>cartão</strong>, <strong>PIX</strong> e <strong>fiado</strong> não permitem valores superiores ao total da compra.
                      {valorExcedente > 0 && (
                        <>
                          <br />
                          <strong>Valor excedente:</strong> R$ {valorExcedente.toFixed(2)}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      Apenas pagamentos em <strong>dinheiro</strong> permitem troco. 
                      {troco > 0 && (
                        <>
                          <br />
                          Adicione R$ {troco.toFixed(2)} em dinheiro para cobrir o troco ou ajuste os valores.
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Aviso em card: saldo insuficiente (unificado para evitar redundância) */}
            {clienteSelecionado && clienteAvailable < totalRounded && (
              <div className="alert-warning">
                <div className="alert-title">⚠️ Crédito insuficiente</div>
                <div className="alert-body mb-0-5">
                  Cliente: <strong>{clienteSelecionado.nome}</strong>
                </div>
                <div className="alert-body">
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
                  <div className="client-fiado-box">
                    <div className="client-fiado-name">
                      {clienteSelecionado.nome}
                    </div>
                    <div className="client-fiado-meta">
                      Crédito disponível: R$ {clienteAvailable.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline mt-1"
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
                          .reduce((s, p) => s + parseCurrency(p.valor), 0)

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
            <div className="payment-actions">
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
                // bloquear enquanto houver restante a pagar ou problemas de troco
                disabled={loading || restante > 0 || excessoNaoDinheiro || (troco > 0 && totalDinheiro < troco)}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
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
              {showVirtualKeyboard && (
                <div className="payment-keyboard-wrapper">
                  <VirtualKeyboard
                    onKeyPress={handleKeyPress}
                    onBackspace={handleBackspace}
                    onClear={handleClear}
                    activeInput={activeInputIndex !== null ? `Pagamento ${activeInputIndex + 1}` : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

  {/* cupom fiscal agora é acessível via o botão na área de venda concluída; bloco removido para evitar redundância */}
    </div>
  )
}
