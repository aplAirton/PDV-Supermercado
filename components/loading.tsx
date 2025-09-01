"use client"

import { Loader2 } from "lucide-react"

export default function Loading({ message = "Carregando..." }: { message?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <Loader2 className="animate-spin" size={24} />
      <div style={{ marginLeft: 12 }}>{message}</div>
    </div>
  )
}
