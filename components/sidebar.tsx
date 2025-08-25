"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, Package, Users, History, Settings, Menu, X } from "lucide-react"

const menuItems = [
  { href: "/", icon: ShoppingCart, label: "Carrinho", description: "Realizar vendas" },
  { href: "/produtos", icon: Package, label: "Produtos", description: "Gerenciar produtos" },
  { href: "/clientes", icon: Users, label: "Clientes", description: "Cadastro de clientes" },
  { href: "/historico", icon: History, label: "Vendas", description: "Vendas realizadas" },
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <ShoppingCart size={24} className="brand-icon" />
          {!isCollapsed && <span className="brand-text">PDV Sistema</span>}
        </div>
        <button className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)} aria-label="Alternar sidebar">
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
              <Icon size={20} className="nav-icon" />
              {!isCollapsed && (
                <div className="nav-content">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className={`nav-item ${pathname === "/configuracoes" ? "active" : ""}`}>
          <Settings size={20} className="nav-icon" />
          {!isCollapsed && (
            <div className="nav-content">
              <span className="nav-label">Configurações</span>
              <span className="nav-description">Sistema</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
