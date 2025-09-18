"use client"

import { X } from "lucide-react"
import type { ReactNode } from "react"

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  size?: 'small' | 'medium' | 'large'
}

export default function ConfigModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  size = 'medium' 
}: ConfigModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content-f ${size}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header-1">
            <div className="modal-header-content">
              <div className="modal-title-info-1">
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
              </div>
            </div>
            <button onClick={onClose} className="modal-close-btn">
              <X size={18} />
            </button>
          </div>
        )}

        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}