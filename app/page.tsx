"use client"

import { useState } from "react"
import Navbar from "../components/Navbar"
import VendasScreen from "../components/VendasScreen"
import ProdutosScreen from "../components/ProdutosScreen"
import ClientesScreen from "../components/ClientesScreen"
import HistoricoScreen from "../components/HistoricoScreen"
import FiadoScreen from "../components/FiadoScreen"

type Screen = "vendas" | "produtos" | "clientes" | "historico" | "fiado"

export default function HomePage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("vendas")

  const renderScreen = () => {
    switch (currentScreen) {
      case "vendas":
        return <VendasScreen />
      case "produtos":
        return <ProdutosScreen />
      case "clientes":
        return <ClientesScreen />
      case "historico":
        return <HistoricoScreen />
      case "fiado":
        return <FiadoScreen />
      default:
        return <VendasScreen />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      <main>{renderScreen()}</main>
    </div>
  )
}
