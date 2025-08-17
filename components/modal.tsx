"use client"

import { X } from "lucide-react"
import type { ReactNode } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <div className="flex justify-between items-center">
              <h2 className="modal-title">{title}</h2>
              <button onClick={onClose} className="btn btn-outline btn-sm">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        {!title && (
          <div className="flex justify-end mb-4">
            <button onClick={onClose} className="btn btn-outline btn-sm">
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
