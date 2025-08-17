"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Package, Users, History, CreditCard, Menu, X } from "lucide-react"
import VendasPage from "./vendas/page"
import ProdutosPage from "./produtos/page"
import ClientesPage from "./clientes/page"
import HistoricoPage from "./historico/page"
import FiadosPage from "./fiados/page"
import '../styles/components.css'

type Page = "vendas" | "produtos" | "clientes" | "historico" | "fiados"

const pageConfig = {
  vendas: {
    title: "Vendas",
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
    title: "Histórico",
    subtitle: "Visualize o histórico de vendas realizadas",
    icon: History,
  },
  fiados: {
    title: "Fiados",
    subtitle: "Gerencie vendas fiadas e pagamentos",
    icon: CreditCard,
  },
}

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<Page>("vendas")
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      default:
        return <VendasPage />
    }
  }

  const currentConfig = pageConfig[currentPage]
  const IconComponent = currentConfig.icon

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">PDV Budega Airton</h1>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(pageConfig).map(([key, config]) => {
            const Icon = config.icon
            return (
              <div key={key} className="nav-item">
                <button
                  className={`nav-link ${currentPage === key ? "active" : ""}`}
                  onClick={() => {
                    setCurrentPage(key as Page)
                    setSidebarOpen(false)
                  }}
                >
                  <Icon size={20} />
                  {config.title}
                </button>
              </div>
            )
          })}
        </nav>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <button className="btn btn-outline btn-sm mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4">
            <div className="card-icon">
              <IconComponent size={24} />
            </div>
            <div>
              <h1 className="content-title">{currentConfig.title}</h1>
              <p className="content-subtitle">{currentConfig.subtitle}</p>
            </div>
          </div>
        </header>

        <div className="content-body">{renderPage()}</div>
      </main>
    </div>
  )
}
