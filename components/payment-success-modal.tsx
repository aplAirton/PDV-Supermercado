import React from 'react'
import { CheckCircle, X, DollarSign, FileText, Clock, User, CreditCard, AlertCircle, Printer, Loader2 } from 'lucide-react'

interface PaymentData {
  id: number | string
  valor: number
  fornecedor: {
    nome: string
    cnpj: string
  }
  forma_pagamento: string
  data_pagamento: string
  descricao?: string
  afeta_caixa: boolean
}

interface PaymentSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  paymentData: PaymentData | null
  onPrint?: () => void
  isLoadingPrint?: boolean
}

export default function PaymentSuccessModal({
  isOpen,
  onClose,
  paymentData,
  onPrint,
  isLoadingPrint = false
}: PaymentSuccessModalProps) {
  if (!isOpen || !paymentData) return null

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="modal-overlay modal-fade-in">
      <div className="modal-content-f large">
        <div className="modal-header-1">
          <div className="modal-header-content">
            <div className="modal-title-info-1">
              <h2>Concluído!</h2>
              <p>Comprovante do pagamento efetuado</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-1">
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <CheckCircle size={48} color="#22c55e" />
            </div>

            <h3
              style={{
                color: "#22c55e",
                marginBottom: "8px",
                fontSize: "24px",
                fontWeight: "600",
              }}
            >
              Pagamento realizado!
            </h3>
          </div>
          
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
            <div
              style={{
                fontSize: "24px",
                color: "#1e40af",
                fontWeight: "bold",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                padding: "16px",
                backgroundColor: "#eff6ff",
                borderRadius: "8px",
              }}
            >
              <DollarSign size={24} color="#1e40af" />
              <span>
                Valor Pago: {formatarValor(paymentData.valor)}
              </span>
            </div>
          </div>
          
          <div
            className="comprovante-detalhes"
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "24px",
              margin: "20px 0",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileText size={16} color="#6b7280" />
                <span>
                  <strong>Pagamento #:</strong> {paymentData.id}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Clock size={16} color="#6b7280" />
                <span>
                  <strong>Data:</strong>{" "}
                  {new Date(paymentData.data_pagamento).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: "20px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <User size={16} color="#6b7280" />
                <span>
                  <strong>Fornecedor:</strong> {paymentData.fornecedor.nome}
                </span>
              </div>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileText size={16} color="#6b7280" />
                <span>
                  <strong>CNPJ:</strong> {paymentData.fornecedor.cnpj}
                </span>
              </div>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CreditCard size={16} color="#6b7280" />
                <span>
                  <strong>Forma de Pagamento:</strong> {paymentData.forma_pagamento}
                </span>
              </div>
              {paymentData.afeta_caixa && (
                <div
                  style={{
                    marginBottom: "12px",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px",
                    backgroundColor: "#fef2f2",
                    borderRadius: "6px",
                  }}
                >
                  <AlertCircle size={16} color="#dc2626" />
                  <strong>Este pagamento afetou o caixa (sangria)</strong>
                </div>
              )}
            </div>

            {paymentData.descricao && (
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "20px",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FileText size={16} color="#6b7280" />
                  <strong>Descrição:</strong>
                </div>
                <div
                  style={{
                    backgroundColor: "#f1f5f9",
                    padding: "16px",
                    borderRadius: "8px",
                    fontStyle: "italic",
                    borderLeft: "4px solid #3b82f6",
                  }}
                >
                  {paymentData.descricao}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "20px",
              fontSize: "14px",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <AlertCircle size={16} color="#dc2626" />
            <div>
              <strong>Importante:</strong> Guarde este comprovante como
              prova do pagamento realizado.
            </div>
          </div>
        </div>

        <div className="modal-footer-1">
          <div className="footer-actions">
            <button
              onClick={onClose}
              className="btn btn-outline"
            >
              Fechar
            </button>
            {onPrint && (
              <button
                onClick={onPrint}
                className="btn btn-primary"
                disabled={isLoadingPrint}
              >
                {isLoadingPrint ? (
                  <>
                    <Loader2 size={16} className="loading-spinner" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Printer size={16} />
                    Imprimir Comprovante
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}