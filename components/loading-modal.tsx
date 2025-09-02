'use client'

import { Loader2 } from 'lucide-react'

interface LoadingModalProps {
  isOpen: boolean
  title: string
  message: string
  size?: 'small' | 'medium' | 'large'
  spinnerSize?: number
}

export default function LoadingModal({ 
  isOpen, 
  title, 
  message, 
  size = 'medium',
  spinnerSize = 48 
}: LoadingModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    small: { maxWidth: '350px', padding: '30px 20px' },
    medium: { maxWidth: '400px', padding: '40px 20px' },
    large: { maxWidth: '500px', padding: '50px 20px' }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: currentSize.maxWidth, 
          width: '90%', 
          textAlign: 'center' 
        }}
      >
        <div style={{ padding: currentSize.padding }}>
          <Loader2 
            style={{ 
              width: `${spinnerSize}px`, 
              height: `${spinnerSize}px`, 
              margin: '0 auto 20px', 
              display: 'block',
              animation: 'spin 1s linear infinite',
              color: '#3b82f6'
            }} 
          />
          <h3 style={{ 
            margin: '0 0 10px 0', 
            color: '#374151',
            fontSize: size === 'small' ? '16px' : size === 'large' ? '20px' : '18px',
            fontWeight: '600'
          }}>
            {title}
          </h3>
          <p style={{ 
            margin: '0', 
            color: '#6b7280', 
            fontSize: size === 'small' ? '13px' : '14px',
            lineHeight: '1.4'
          }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
