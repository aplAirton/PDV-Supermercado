import type React from "react"
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from "next"
import "./globals.css"
import "../styles/globals.css"
import "../styles/components.css"
import "../styles/caixa.css"
import "../styles/funcionarios.css"
import "../styles/produtos.css"
import "../styles/clientes.css"
import "../styles/fornecedores.css"

export const metadata: Metadata = {
  title: "PDV Airton",
  description: "Sistema de PDV",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <Toaster />
        {children}
      </body>
    </html>
  )
}
