"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Package, Users, History, CreditCard, Menu, X, DollarSign, Calculator, UserCog, Truck, Settings, Globe, HardDrive } from "lucide-react"

type Page = "vendas" | "produtos" | "clientes" | "historico" | "fiados" | "pagamentos" | "caixa" | "funcionarios" | "fornecedores" | "configuracoes"

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
  fornecedores: {
    title: "Fornecedores",
    subtitle: "Gerencie fornecedores e pagamentos",
    icon: Truck,
  },
  configuracoes: {
    title: "Configurações",
    subtitle: "Testes e configurações do sistema",
    icon: Settings,
  },
}

interface SidebarProps {
  currentPage: Page
  onPageChange: (page: Page) => void
  isOpen?: boolean
  onToggle?: (open: boolean) => void
  currentDatabase?: 'remote' | 'local'
}

export default function Sidebar({ currentPage, onPageChange, isOpen: isOpenProp, onToggle, currentDatabase = 'remote' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(isOpenProp || false)

  // Sincronizar com prop externa
  useEffect(() => {
    if (isOpenProp !== undefined) {
      setIsOpen(isOpenProp)
    }
  }, [isOpenProp])

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

  // Prevenir scroll quando sidebar aberta e sincronizar classes
  useEffect(() => {
    const bodyElement = document.body;
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    const overlayElement = document.querySelector('.sidebar-overlay') as HTMLElement;
    
    if (isOpen) {
      bodyElement.style.overflow = 'hidden'
      bodyElement.classList.add('sidebar-open');
      if (mainContent) mainContent.classList.add('sidebar-open');
      if (overlayElement) overlayElement.classList.add('show');
    } else {
      bodyElement.style.overflow = 'unset'
      bodyElement.classList.remove('sidebar-open');
      if (mainContent) mainContent.classList.remove('sidebar-open');
      if (overlayElement) overlayElement.classList.remove('show');
    }

    return () => {
      document.body.style.overflow = 'unset'
      bodyElement.classList.remove('sidebar-open');
      if (mainContent) mainContent.classList.remove('sidebar-open');
      if (overlayElement) overlayElement.classList.remove('show');
    }
  }, [isOpen])

  const handlePageChange = (page: Page) => {
    onPageChange(page)
    setIsOpen(false) // useEffect vai cuidar das classes
    if (onToggle) onToggle(false) // Notificar componente pai
  }

  return (
    <>
      {/* Overlay para mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={() => {
          setIsOpen(false) // useEffect vai cuidar das classes
          if (onToggle) onToggle(false) // Notificar componente pai
        }}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">PDV Airton</h1>
        </div>

        <nav className="sidebar-nav">
          {/* Área de Vendas */}
          <div className="nav-section">
            <h3 className="nav-section-title">Vendas</h3>
            <div className="nav-item">
              <button
                className={`nav-link ${currentPage === 'vendas' ? "active" : ""}`}
                onClick={() => handlePageChange('vendas')}
              >
                <ShoppingCart size={20} />
                <span className="nav-text">Carrinho</span>
              </button>
            </div>
            <div className="nav-item">
              <button
                className={`nav-link ${currentPage === 'historico' ? "active" : ""}`}
                onClick={() => handlePageChange('historico')}
              >
                <History size={20} />
                <span className="nav-text">Vendas</span>
              </button>
            </div>
            <div className="nav-item">
              <button
                className={`nav-link ${currentPage === 'fiados' ? "active" : ""}`}
                onClick={() => handlePageChange('fiados')}
              >
                <CreditCard size={20} />
                <span className="nav-text">Fiados</span>
              </button>
            </div>
          </div>

          {/* Área de Gestão */}
          <div className="nav-section">
            <h3 className="nav-section-title">Gestão</h3>
            <div className="nav-item">
              <button
                className={`nav-link ${currentPage === 'produtos' ? "active" : ""}`}
                onClick={() => handlePageChange('produtos')}
              >
                <Package size={20} />
                <span className="nav-text">Produtos</span>
              </button>
            </div>
            <div className="nav-item">
              <button
                className={`nav-link ${currentPage === 'clientes' ? "active" : ""}`}
                onClick={() => handlePageChange('clientes')}
              >
                <Users size={20} />
                <span className="nav-text">Clientes</span>
              </button>
            </div>
            <div className="nav-item">
              <button
                className={`nav-link ${currentPage === 'funcionarios' ? "active" : ""}`}
                onClick={() => handlePageChange('funcionarios')}
              >
                <UserCog size={20} />
                <span className="nav-text">Funcionários</span>
              </button>
            </div>
          </div>

          {/* Área Financeira */}
          <div className="nav-section">
            <h3 className="nav-section-title">Financeiro</h3>
            <div className="nav-item">
              <button
                className={`nav-link ${currentPage === 'pagamentos' ? "active" : ""}`}
                onClick={() => handlePageChange('pagamentos')}
              >
                <DollarSign size={20} />
                <span className="nav-text">Pagamentos</span>
              </button>
            </div>
            <div className="nav-item">
              <button
                className={`nav-link ${currentPage === 'caixa' ? "active" : ""}`}
                onClick={() => handlePageChange('caixa')}
              >
                <Calculator size={20} />
                <span className="nav-text">Caixa</span>
              </button>
            </div>
            <div className="nav-item">
              <button
                className={`nav-link ${currentPage === 'fornecedores' ? "active" : ""}`}
                onClick={() => handlePageChange('fornecedores')}
              >
                <Truck size={20} />
                <span className="nav-text">Fornecedores</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Rodapé do Sidebar */}
        <div className="sidebar-footer">
          <div className="database-status-indicator">
            <button
              className={`database-badge ${currentDatabase}`}
              onClick={() => handlePageChange('configuracoes')}
              title="Configurações do Sistema"
            >
              {currentDatabase === 'remote' ? (
                <>
                  <Globe size={14} />
                  Remoto
                </>
              ) : (
                <>
                  <HardDrive size={14} />
                  Local
                </>
              )}
            </button>
          </div>
          <div className="footer-info">
            <p className="footer-version">PDV Airton v1.0</p>
            <p className="footer-company">© 2025 Airton Lopes</p>
          </div>
        </div>
      </aside>
    </>
  )
}
