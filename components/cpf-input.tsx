import React, { forwardRef } from 'react'

interface CPFInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  className?: string
}

export const CPFInput = forwardRef<HTMLInputElement, CPFInputProps>(
  ({ value, onChange, className = '', ...props }, ref) => {
    // Máscara para CPF
    const formatarCPF = (inputValue: string) => {
      // Remove tudo que não é dígito
      const digits = inputValue.replace(/\D/g, "")

      // Limita a 11 dígitos
      const limitedDigits = digits.slice(0, 11)

      // Aplica a máscara visual
      if (limitedDigits.length <= 3) {
        return limitedDigits
      } else if (limitedDigits.length <= 6) {
        return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3)}`
      } else if (limitedDigits.length <= 9) {
        return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6)}`
      } else {
        return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6, 9)}-${limitedDigits.slice(9)}`
      }
    }

    // Handler para mudança de valor
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const cleanValue = inputValue.replace(/\D/g, '').slice(0, 11)
      onChange(cleanValue)
    }

    // Formatar o valor para exibição
    const displayValue = formatarCPF(value || '')

    // Handler para tecla pressionada - permite apenas números e teclas de navegação
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permite teclas de controle (backspace, delete, tab, escape, enter, arrows)
      const controlKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
      ]

      // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return
      }

      // Bloqueia qualquer tecla que não seja número ou tecla de controle
      if (!controlKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
        e.preventDefault()
      }
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
    )
  }
)

CPFInput.displayName = 'CPFInput'