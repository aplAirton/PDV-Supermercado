import { useState } from 'react'
import LoadingModal from '../components/loading-modal'

export default function ExemplosLoadingModal() {
  const [loadingPagamentos, setLoadingPagamentos] = useState(false)
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false)
  const [loadingRelatorios, setLoadingRelatorios] = useState(false)

  const simularPagamentos = async () => {
    setLoadingPagamentos(true)
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 3000))
    } finally {
      setLoadingPagamentos(false)
    }
  }

  const simularFuncionarios = async () => {
    setLoadingFuncionarios(true)
    try {
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 2000))
    } finally {
      setLoadingFuncionarios(false)
    }
  }

  const simularRelatorios = async () => {
    setLoadingRelatorios(true)
    try {
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 4000))
    } finally {
      setLoadingRelatorios(false)
    }
  }

  return (
    <div style={{ padding: '40px' }}>
      <h1>Exemplos de Loading Modal</h1>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <button 
          onClick={simularPagamentos}
          className="btn btn-primary"
        >
          Simular Processamento de Pagamento
        </button>

        <button 
          onClick={simularFuncionarios}
          className="btn btn-secondary"
        >
          Simular Carregamento de Funcionários
        </button>

        <button 
          onClick={simularRelatorios}
          className="btn btn-success"
        >
          Simular Geração de Relatório
        </button>
      </div>

      {/* Loading Modals */}
      
      {/* Modal para processamento de pagamentos - tamanho médio */}
      <LoadingModal
        isOpen={loadingPagamentos}
        title="Processando Pagamento"
        message="Aguarde enquanto processamos sua transação..."
        size="medium"
        spinnerSize={50}
      />

      {/* Modal para funcionários - tamanho pequeno */}
      <LoadingModal
        isOpen={loadingFuncionarios}
        title="Carregando Funcionários"
        message="Buscando dados dos funcionários..."
        size="small"
        spinnerSize={36}
      />

      {/* Modal para relatórios - tamanho grande */}
      <LoadingModal
        isOpen={loadingRelatorios}
        title="Gerando Relatório"
        message="Por favor, aguarde. Esta operação pode levar alguns minutos..."
        size="large"
        spinnerSize={60}
      />
    </div>
  )
}

/*
EXEMPLOS DE USO EM DIFERENTES CONTEXTOS:

1. PÁGINA DE VENDAS/PDV:
```tsx
const [processandoVenda, setProcessandoVenda] = useState(false)

const finalizarVenda = async () => {
  setProcessandoVenda(true)
  try {
    await api.post('/vendas', dadosVenda)
  } finally {
    setProcessandoVenda(false)
  }
}

// No JSX:
<LoadingModal
  isOpen={processandoVenda}
  title="Finalizando Venda"
  message="Processando transação e emitindo cupom..."
  size="medium"
/>
```

2. PÁGINA DE CLIENTES:
```tsx
const [carregandoClientes, setCarregandoClientes] = useState(false)

useEffect(() => {
  const carregarClientes = async () => {
    setCarregandoClientes(true)
    try {
      const clientes = await api.get('/clientes')
      setClientes(clientes.data)
    } finally {
      setCarregandoClientes(false)
    }
  }
  carregarClientes()
}, [])

// No JSX:
<LoadingModal
  isOpen={carregandoClientes}
  title="Carregando Clientes"
  message="Buscando lista de clientes..."
  size="small"
/>
```

3. PÁGINA DE PRODUTOS:
```tsx
const [importandoProdutos, setImportandoProdutos] = useState(false)

const importarProdutos = async (arquivo: File) => {
  setImportandoProdutos(true)
  try {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    await api.post('/produtos/importar', formData)
  } finally {
    setImportandoProdutos(false)
  }
}

// No JSX:
<LoadingModal
  isOpen={importandoProdutos}
  title="Importando Produtos"
  message="Processando arquivo e atualizando estoque..."
  size="large"
  spinnerSize={64}
/>
```

4. RELATÓRIOS:
```tsx
const [gerandoRelatorio, setGerandoRelatorio] = useState(false)

const gerarRelatorioVendas = async () => {
  setGerandoRelatorio(true)
  try {
    await api.get('/relatorios/vendas/pdf')
  } finally {
    setGerandoRelatorio(false)
  }
}

// No JSX:
<LoadingModal
  isOpen={gerandoRelatorio}
  title="Gerando Relatório"
  message="Compilando dados e criando documento PDF..."
  size="large"
/>
```

TAMANHOS RECOMENDADOS:
- small: Carregamentos rápidos (buscar dados, validações)
- medium: Operações normais (processamentos, salvamentos)
- large: Operações longas (relatórios, importações, backups)

SPINNER SIZES RECOMENDADOS:
- small: 32-40px
- medium: 44-52px  
- large: 56-68px
*/
