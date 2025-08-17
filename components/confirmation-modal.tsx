"use client"

import { AlertTriangle, CheckCircle } from "lucide-react"
import Modal from "./modal"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  type?: "warning" | "success" | "danger"
  confirmText?: string
  cancelText?: string
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
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={48} className="text-green-600" />
      case "danger":
        return <AlertTriangle size={48} className="text-red-600" />
      default:
        return <AlertTriangle size={48} className="text-yellow-600" />
    }
  }

  const getButtonClass = () => {
    switch (type) {
      case "success":
        return "btn-success"
      case "danger":
        return "btn-danger"
      default:
        return "btn-warning"
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center">
        <div className="flex justify-center mb-4">{getIcon()}</div>
        <p className="text-lg mb-6">{message}</p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-outline">
            {cancelText}
          </button>
          <button onClick={handleConfirm} className={`btn ${getButtonClass()}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
