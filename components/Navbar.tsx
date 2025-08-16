"use client"

import { 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard, 
  BarChart3, 
  Store 
} from "lucide-react"

interface NavbarProps {
  currentScreen: string
  onScreenChange: (screen: "vendas" | "produtos" | "clientes" | "historico" | "fiado") => void
}

export default function Navbar({ currentScreen, onScreenChange }: NavbarProps) {
  const menuItems = [
    { id: "vendas", label: "Vendas", Icon: ShoppingCart },
    { id: "produtos", label: "Produtos", Icon: Package },
    { id: "clientes", label: "Clientes", Icon: Users },
    { id: "fiado", label: "Fiado", Icon: CreditCard },
    { id: "historico", label: "Histórico", Icon: BarChart3 },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">PDV Supermercado</h1>
          </div>
          
          <nav className="flex space-x-1">
            {menuItems.map((item) => {
              const Icon = item.Icon
              return (
                <button
                  key={item.id}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                    ${currentScreen === item.id 
                      ? "bg-blue-100 text-blue-700 border border-blue-200" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                  onClick={() => onScreenChange(item.id as any)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </nav>
  )
}
