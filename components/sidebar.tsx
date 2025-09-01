"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Package, Users, History, CreditCard, Menu, X, DollarSign, Calculator, UserCog } from "lucide-react"

type Page = "vendas" | "produtos" | "clientes" | "historico" | "fiados" | "pagamentos" | "caixa" | "funcionarios"

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
  caixa: {
    title: "Caixa",
    subtitle: "Gerenciamento de abertura e fechamento do caixa",
    icon: Calculator,
  },
  funcionarios: {
    title: "Funcionários",
    subtitle: "Cadastre e gerencie funcionários",
    icon: UserCog,
  },
}

interface SidebarProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Fechar sidebar com Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Prevenir scroll quando sidebar aberta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handlePageChange = (page: Page) => {
    onPageChange(page)
    setIsOpen(false)
  }

  return (
    <>
      {/* Overlay para mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Botão mobile menu no header */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">PDV Sistema</h1>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(pageConfig).map(([key, config]) => {
            const Icon = config.icon
            const isActive = currentPage === key
            
            return (
              <div key={key} className="nav-item">
                <button
                  className={`nav-link ${isActive ? "active" : ""}`}
                  onClick={() => handlePageChange(key as Page)}
                >
                  <Icon size={20} />
                  <span className="nav-text">{config.title}</span>
                </button>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
