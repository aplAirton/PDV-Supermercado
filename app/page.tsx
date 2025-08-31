"use client"

import { useState } from "react"
import { ShoppingCart, Package, Users, History, CreditCard, DollarSign } from "lucide-react"
import VendasPage from "./vendas/page"
import ProdutosPage from "./produtos/page"
import ClientesPage from "./clientes/page"
import HistoricoPage from "./historico/page"
import FiadosPage from "./fiados/page"
import PagamentosPage from "./pagamentos/page"
import Sidebar from "@/components/sidebar"
import '../styles/components.css'

type Page = "vendas" | "produtos" | "clientes" | "historico" | "fiados" | "pagamentos"

const pageConfig = {
  vendas: {
    title: "Carrinho",
    subtitle: "Realize vendas e gerencie o carrinho de compras",
    icon: ShoppingCart,
  },
  produtos: {
    title: "Produtos",
    subtitle: "Cadastre e gerencie produtos do estoque",
    icon: Package,
  },
  clientes: {
    title: "Clientes",
    subtitle: "Cadastre e gerencie informações dos clientes",
    icon: Users,
  },
  historico: {
    title: "Vendas",
    subtitle: "Visualize o histórico de vendas realizadas",
    icon: History,
  },
  fiados: {
    title: "Fiados",
    subtitle: "Gerencie vendas fiadas e pagamentos",
    icon: CreditCard,
  },
  pagamentos: {
    title: "Pagamentos",
    subtitle: "Controle de entradas e saídas do caixa",
    icon: DollarSign,
  },
}

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<Page>("vendas")

  const renderPage = () => {
    switch (currentPage) {
      case "vendas":
        return <VendasPage />
      case "produtos":
        return <ProdutosPage />
      case "clientes":
        return <ClientesPage />
      case "historico":
        return <HistoricoPage />
      case "fiados":
        return <FiadosPage />
      case "pagamentos":
        return <PagamentosPage />
      default:
        return <VendasPage />
    }
  }

  const currentConfig = pageConfig[currentPage]
  const IconComponent = currentConfig.icon

  return (
    <div className="app-layout">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />

      <main className="main-content">
        <header className="content-header">
          <div className="header-content">
            <div className="header-icon">
              <IconComponent size={24} />
            </div>
            <div className="header-text">
              <h1 className="content-title">{currentConfig.title}</h1>
              <p className="content-subtitle">{currentConfig.subtitle}</p>
            </div>
          </div>
        </header>

        <div className="content-body">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
