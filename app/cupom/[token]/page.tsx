'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface CupomData {
  venda_id: number
  data_venda: string
  total: number
  troco: number
  forma_pagamento: string
  forma_pagamento_json: string
  cliente_nome: string
  conteudo_texto: string
  criado_em: string
  itens: Array<{
    produto_nome: string
    quantidade: number
    preco_unitario: number
    subtotal: number
  }>
}

export default function CupomPublicoPage() {
  const params = useParams()
  const token = params?.token as string
  const [cupom, setCupom] = useState<CupomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token não fornecido')
      setLoading(false)
      return
    }

    fetch(`/api/cupom/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setCupom(data.cupom)
        }
      })
      .catch(err => {
        console.error('Erro ao carregar cupom:', err)
        setError('Erro ao carregar cupom')
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando cupom...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">Erro!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (!cupom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cupom não encontrado</p>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 text-center">
          <h1 className="text-2xl font-bold">Cupom Fiscal</h1>
          <p className="text-blue-100 mt-2">Venda #{cupom.venda_id}</p>
        </div>

        {/* Cupom Content - Apenas o texto original formatado */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
              {cupom.conteudo_texto}
            </pre>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Cupom gerado em {new Date(cupom.criado_em).toLocaleString('pt-BR')}
          </p>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Imprimir
          </button>
        </div>
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-2xl, .max-w-2xl * {
            visibility: visible;
          }
          .max-w-2xl {
            position: absolute;
            left: 0;
            top: 0;
          }
          .bg-gray-50 {
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}
