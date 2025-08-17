import type React from "react"
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from "next"
import "./globals.css"
import "../styles/components.css"

export const metadata: Metadata = {
  title: "PDV Budega Airton",
  description: "Sistema de PDV para Supermercado com Gerenciamento de Fiado",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Toaster />
        {children}
      </body>
    </html>
  )
}
