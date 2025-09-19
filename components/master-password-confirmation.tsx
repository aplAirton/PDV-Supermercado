import React from 'react'
import { AlertCircle } from 'lucide-react'

interface MasterPasswordConfirmationProps {
  title?: string
  message?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showIcon?: boolean
}

export default function MasterPasswordConfirmation({
  title = "Confirmação de Senha",
  message = "Digite sua senha para continuar.",
  value,
  onChange,
  placeholder = "Digite a senha",
  showIcon = true
}: MasterPasswordConfirmationProps) {
  return (
    <div className="confirm-content">
      {showIcon && (
        <div className="confirm-icon">
          <AlertCircle size={48} />
        </div>
      )}
      <h4>{title}</h4>
      <p>{message}</p>
      <div className="password-input-group">
        <input
          type="password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="password-input"
        />
      </div>
    </div>
  )
}
