export interface Produto {
  id: number
  nome: string
  codigoBarras: string
  preco: number
  quantidadeEstoque: number
  categoria: string
}

export interface Cliente {
  id: number
  nome: string
  cpf: string
  endereco: string
  telefone: string
  limiteCredito: number
}

export interface ItemVenda {
  id: number
  produto: Produto
  quantidade: number
  precoUnitario: number
  subtotal: number
}

export interface Venda {
  id: number
  data: string
  valorTotal: number
  cliente?: Cliente
  formaPagamento: "dinheiro" | "cartao" | "pix" | "fiado"
  itens: ItemVenda[]
}

export interface Fiado {
  id: number
  cliente: Cliente
  valor: number
  dataCompra: string
  status: "pendente" | "quitado"
  vendaId: number
}
