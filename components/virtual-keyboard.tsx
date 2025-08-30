'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, X } from 'lucide-react'

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
  activeInput?: string
  className?: string
}

export default function VirtualKeyboard({ 
  onKeyPress, 
  onBackspace, 
  onClear, 
  activeInput, 
  className = '' 
}: VirtualKeyboardProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null)

  const handleKeyPress = (key: string) => {
    setPressedKey(key)
    onKeyPress(key)
    
    // Remove pressed state after animation
    setTimeout(() => setPressedKey(null), 150)
  }

  const handleBackspace = () => {
    setPressedKey('backspace')
    onBackspace()
    setTimeout(() => setPressedKey(null), 150)
  }

  const handleClear = () => {
    setPressedKey('clear')
    onClear()
    setTimeout(() => setPressedKey(null), 150)
  }

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeInput) return

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleKeyPress(e.key)
      } else if (e.key === '.') {
        e.preventDefault()
        handleKeyPress('.')
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      } else if (e.key === 'Delete' || e.key === 'Escape') {
        e.preventDefault()
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeInput])

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className={`virtual-keyboard ${className}`}>
      <div className="text-sm text-gray-600 mb-3 text-center">
        {activeInput ? `Editando: ${activeInput}` : 'Selecione um campo para editar'}
      </div>
      
      {/* Numbers 1-9 */}
      <div className="keyboard-grid">
        {numbers.map((num) => (
          <button
            key={num}
            className={`keyboard-btn ${pressedKey === num ? 'pressed' : ''}`}
            onClick={() => handleKeyPress(num)}
            disabled={!activeInput}
            type="button"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Bottom row: 0, decimal point, backspace, clear */}
      <div className="keyboard-bottom-row">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            className={`keyboard-btn ${pressedKey === '0' ? 'pressed' : ''}`}
            onClick={() => handleKeyPress('0')}
            disabled={!activeInput}
            type="button"
          >
            0
          </button>
          <button
            className={`keyboard-btn ${pressedKey === '.' ? 'pressed' : ''}`}
            onClick={() => handleKeyPress('.')}
            disabled={!activeInput}
            type="button"
          >
            ,
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '0.75rem' }}>
          <button
            className={`keyboard-btn special ${pressedKey === 'backspace' ? 'pressed' : ''}`}
            onClick={handleBackspace}
            disabled={!activeInput}
            type="button"
            title="Apagar último dígito"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            className={`keyboard-btn danger ${pressedKey === 'clear' ? 'pressed' : ''}`}
            onClick={handleClear}
            disabled={!activeInput}
            type="button"
            title="Limpar campo"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-3 text-center">
        Você também pode usar o teclado físico
      </div>
    </div>
  )
}
