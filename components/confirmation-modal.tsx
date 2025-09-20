"use client"

import { AlertTriangle, CheckCircle, XCircle, ShoppingCart, X } from "lucide-react"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  type?: "warning" | "success" | "danger"
  confirmText?: string
  cancelText?: string
  modalType?: "default" | "vendas"
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  modalType = "default",
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle size={56} />,
          iconColor: "text-success-primary",
          iconBg: "bg-success-light",
          confirmClass: "btn-success",
          headerBg: "bg-success-gradient"
        }
      case "danger":
        return {
          icon: <XCircle size={56} />,
          iconColor: "text-danger-primary",
          iconBg: "bg-danger-light",
          confirmClass: "btn-danger",
          headerBg: "bg-danger-gradient"
        }
      default:
        return {
          icon: <AlertTriangle size={56} />,
          iconColor: "text-warning-primary",
          iconBg: "bg-warning-light",
          confirmClass: "btn-warning",
          headerBg: "bg-warning-gradient"
        }
    }
  }

  const config = getTypeConfig()

  // Detecta se é o modal do carrinho/vendas
  const isCartModal = message.includes("itens no carrinho") || message.includes("dados do carrinho") || modalType === "vendas"
  const isVendasModal = modalType === "vendas" || isCartModal

  return (
    <div className={`confirmation-modal-overlay ${isVendasModal ? 'modal-confirm-sair-vendas-overlay' : ''}`}>
      <div className={`confirmation-modal ${isVendasModal ? 'modal-confirm-sair-vendas' : ''}`}>
        {/* Cabeçalho */}
        <div className={`confirmation-modal-header ${config.headerBg} ${isVendasModal ? 'modal-confirm-sair-vendas-header' : ''}`}>
          <div className="header-content">
            <div className="header-text">
              <h3 className="header-title">{title}</h3>
            </div>
          </div>
          <button 
            className="header-close"
            onClick={onClose}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className={`confirmation-modal-content ${isVendasModal ? 'modal-confirm-sair-vendas-content' : ''}`}>
          {isCartModal ? (
            <div className="cart-warning-content">
              <div className={`warning-icon-large ${config.iconBg}`}>
                <ShoppingCart size={48} className={config.iconColor} />
              </div>
              <div className="warning-text">
                <h4>Atenção: Itens no carrinho</h4>
                <p>
                  Você possui itens adicionados ao carrinho de vendas. 
                  Ao navegar para outra seção, <strong>todos os dados serão perdidos</strong> 
                  &nbsp;e você precisará adicionar os produtos novamente.
                </p>
              </div>
            </div>
          ) : (
            <div className="standard-content">
              <div className={`content-icon ${config.iconBg}`}>
                <span className={config.iconColor}>
                  {config.icon}
                </span>
              </div>
              <p className="content-message">{message}</p>
            </div>
          )}
        </div>

        {/* Rodapé com ações */}
        <div className={`confirmation-modal-footer ${isVendasModal ? 'modal-confirm-sair-vendas-footer' : ''}`}>
          <div className="footer-actions">
            <button 
              onClick={onClose} 
              className="btn btn-outline btn-lg cancel-btn"
            >
              <X size={18} />
              {cancelText}
            </button>
            <button 
              onClick={handleConfirm} 
              className={`btn ${config.confirmClass} btn-lg confirm-btn`}
            >
              <CheckCircle size={18} />
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
