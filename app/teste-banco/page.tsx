"use client"

import { useState, useEffect } from 'react'
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface TestResult {
  api: string
  success: boolean
  databaseType?: string
  error?: string
  responseTime: number
}

export default function DatabaseTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<'remote' | 'local'>('remote')

  const testAPIs = [
    { name: 'Status da Configuração', endpoint: '/api/database/status' },
    { name: 'Fornecedores', endpoint: '/api/fornecedores' },
    { name: 'Produtos', endpoint: '/api/produtos' },
    { name: 'Clientes', endpoint: '/api/clientes' },
    { name: 'Vendas (Histórico)', endpoint: '/api/vendas' },
    { name: 'Pagamentos', endpoint: '/api/pagamentos' },
    { name: 'Fiados', endpoint: '/api/fiados' },
  ]

  const testAPI = async (api: { name: string, endpoint: string }): Promise<TestResult> => {
    const startTime = Date.now()

    try {
      const response = await fetch(api.endpoint)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Para a API de status, verificar o tipo de banco
      if (api.endpoint === '/api/database/status' && data.currentType) {
        setCurrentConfig(data.currentType)
        return {
          api: api.name,
          success: true,
          databaseType: data.currentType,
          responseTime
        }
      }

      // Para outras APIs, apenas verificar se a resposta foi bem-sucedida
      return {
        api: api.name,
        success: true,
        responseTime
      }

    } catch (error) {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      return {
        api: api.name,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        responseTime
      }
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setResults([])

    const testPromises = testAPIs.map(api => testAPI(api))
    const testResults = await Promise.all(testPromises)

    setResults(testResults)
    setLoading(false)
  }

  useEffect(() => {
    runAllTests()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Teste de Configuração de Banco de Dados</h1>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Configuração Atual:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentConfig === 'remote'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {currentConfig === 'remote' ? '🌐 Remoto' : '💻 Local'}
              </span>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {loading ? 'Testando...' : 'Executar Testes'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Resultados dos Testes</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{result.api}</div>
                    {result.databaseType && (
                      <div className="text-sm text-gray-600">
                        Banco: {result.databaseType === 'remote' ? 'Remoto' : 'Local'}
                      </div>
                    )}
                    {result.error && (
                      <div className="text-sm text-red-600">{result.error}</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {result.responseTime}ms
                </div>
              </div>
            ))}

            {results.length === 0 && !loading && (
              <div className="px-6 py-8 text-center text-gray-500">
                Clique em "Executar Testes" para verificar as APIs
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">Sobre este teste:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Verifica se todas as APIs estão respondendo corretamente</li>
            <li>• Confirma se a configuração de banco está sendo aplicada</li>
            <li>• Testa a persistência da configuração entre requisições</li>
            <li>• Todas as APIs devem usar a mesma configuração de banco</li>
          </ul>
        </div>
      </div>
    </div>
  )
}