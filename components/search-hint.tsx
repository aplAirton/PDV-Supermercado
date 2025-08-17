import React from "react"
import { Search } from "lucide-react"

interface Props {
  children?: React.ReactNode
  className?: string
}

export default function SearchHint({ children, className = "" }: Props) {
  return (
    <div
      className={`flex items-center ${className}`}
      style={{
        gap: '0.5rem',
        border: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(0,0,0,0.02)',
        color: 'var(--text-muted)',
        padding: '0.75rem',
        borderRadius: '0.375rem'
      }}
      role="status"
    >
      <Search size={18} />
      <div className="text-sm">{children ?? "Digite pelo menos 3 caracteres na busca para listar produtos."}</div>
    </div>
  )
}
