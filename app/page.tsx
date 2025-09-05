"use client"

import { useState, useRef, useEffect } from "react"
import { ShoppingCart, Package, Users, History, CreditCard, DollarSign, Calculator, UserCog, Menu, User } from "lucide-react"
import VendasPage from "./vendas/page"
import ProdutosPage from "./produtos/page"
import ClientesPage from "./clientes/page"
import HistoricoPage from "./historico/page"
import FiadosPage from "./fiados/page"
import PagamentosPage from "./pagamentos/page"
import CaixaPage from "./caixa/page"
import FuncionariosPage from "./funcionarios/page"
import Sidebar from "@/components/sidebar"
import ConfirmationModal from '@/components/confirmation-modal'
import '../styles/components.css'

type Page = "vendas" | "produtos" | "clientes" | "historico" | "fiados" | "pagamentos" | "caixa" | "funcionarios"

const pageConfig = {
  vendas: {
    title: "Carrinho",
    subtitle: "Realize vendas e gerencie o carrinho de compras",
    icon: ShoppingCart,
  },
  produtos: {
    title: "Gerenciamento de Produtos",
    subtitle: "Cadastre e gerencie produtos do estoque",
    icon: Package,
  },
  clientes: {
    title: "Gerenciamento de Clientes",
    subtitle: "Cadastre e gerencie informações dos clientes",
    icon: Users,
  },
  historico: {
    title: "Histórico deVendas",
    subtitle: "Visualize o histórico de vendas realizadas",
    icon: History,
  },
  fiados: {
    title: "Gerenciamento de Fiados",
    subtitle: "Gerencie vendas fiadas e pagamentos",
    icon: CreditCard,
  },
  pagamentos: {
    title: "Gerenciamento de Pagamentos",
    subtitle: "Controle de entradas e saídas do caixa",
    icon: DollarSign,
  },
  caixa: {
    title: "Gerenciamento de Caixa",
    subtitle: "Gerenciamento de abertura e fechamento do caixa",
    icon: Calculator,
  },
  funcionarios: {
    title: "Gerenciamento de Funcionários",
    subtitle: "Cadastre e gerencie funcionários",
    icon: UserCog,
  },
}

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<Page>("vendas")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Estados para controle de carrinho e confirmação de navegação
  const [hasCartItems, setHasCartItems] = useState(false)
  const [showConfirmNavigation, setShowConfirmNavigation] = useState(false)
  const [pendingPage, setPendingPage] = useState<Page | null>(null)
  const [dadosOperador, setDadosOperador] = useState<{
    funcionario_nome: string
    funcionario_cargo: string
  } | null>(null)
  
  const vendasPageRef = useRef<any>(null)

  // Effect para verificar dados do localStorage
  useEffect(() => {
    const checkCartAndOperator = () => {
      // Verificar se há itens no carrinho
      const cartItems = localStorage.getItem('vendas_carrinho')
      setHasCartItems(cartItems ? JSON.parse(cartItems).length > 0 : false)
      
      // Verificar dados do operador
      const operatorData = localStorage.getItem('vendas_operador')
      setDadosOperador(operatorData ? JSON.parse(operatorData) : null)
    }

    // Verificação inicial
    checkCartAndOperator()

    // Listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vendas_carrinho' || e.key === 'vendas_operador') {
        checkCartAndOperator()
      }
    }

    // Listener customizado para mudanças no mesmo contexto
    const handleCustomUpdate = () => {
      checkCartAndOperator()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('vendas_data_updated', handleCustomUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('vendas_data_updated', handleCustomUpdate)
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Função para controlar navegação com verificação de carrinho
  const handlePageChange = (newPage: Page) => {
    if (currentPage === "vendas" && hasCartItems && newPage !== "vendas") {
      setPendingPage(newPage)
      setShowConfirmNavigation(true)
    } else {
      setCurrentPage(newPage)
      setSidebarOpen(false)
    }
  }

  // Confirmar navegação perdendo dados do carrinho
  const confirmNavigation = () => {
    if (pendingPage) {
      setCurrentPage(pendingPage)
      setPendingPage(null)
    }
    setShowConfirmNavigation(false)
    setSidebarOpen(false)
    // Resetar estado do carrinho
    setHasCartItems(false)
    
    // Limpar dados do localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vendas_carrinho')
      localStorage.removeItem('vendas_operador')
      window.dispatchEvent(new Event('vendas_data_updated'))
    }
  }

  // Cancelar navegação
  const cancelNavigation = () => {
    setPendingPage(null)
    setShowConfirmNavigation(false)
  }

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
      case "caixa":
        return <CaixaPage />
      case "funcionarios":
        return <FuncionariosPage />
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
        onPageChange={handlePageChange}
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <main className="main-content">
        <header className="content-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn-header" 
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="content-title">{currentConfig.title}</h1>
            <div className="header-icon">
              <IconComponent size={24} />
            </div>
          </div>
          
          {/* Informações do operador no canto direito - apenas na tela de carrinho */}
          <div className="header-right">
            {currentPage === "vendas" && dadosOperador && (
              <div className="funcionario-info-header">
                <span>{dadosOperador.funcionario_nome}</span>
              </div>
            )}
          </div>
        </header>

        <div className="content-body">
          {renderPage()}
        </div>
      </main>
      
      {/* Modal de confirmação de navegação */}
      {showConfirmNavigation && (
        <ConfirmationModal
          isOpen={showConfirmNavigation}
          onClose={cancelNavigation}
          onConfirm={confirmNavigation}
          title="Confirmar navegação"
          message="Há itens no carrinho. Ao navegar para outra seção, todos os dados do carrinho serão perdidos. Deseja continuar?"
          type="warning"
          confirmText="Sim, continuar"
          cancelText="Cancelar"
        />
      )}
    </div>
  )
}
