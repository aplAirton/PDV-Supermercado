import React from "react"
import { Search } from "lucide-react"

interface Props {
  children?: React.ReactNode
  className?: string
}

export default function SearchHint({ children, className = "" }: Props) {
  return (
    <div
      className={`flex items-center gap-2 border border-[rgba(0,0,0,0.06)] bg-[rgba(0,0,0,0.02)] text-muted p-3 rounded-md ${className}`}
      role="status"
    >
      <Search size={18} />
      <div className="text-sm">{children ?? "Digite pelo menos 3 caracteres na busca para listar produtos."}</div>
    </div>
  )
}
