"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Loading from "@/components/loading"
import { toast } from '@/hooks/use-toast'
import ConfirmationModal from '@/components/confirmation-modal'
import LoadingModal from '@/components/loading-modal'
import { Plus, Edit, Trash2, Search, User, Loader2, X, DollarSign, MapPin, Save, OctagonAlert } from "lucide-react"

interface Cliente {
  id: number
  nome: string
  cpf: string
  telefone: string
  endereco: string
  limite_credito: number
  debito_atual: number
  ativo: boolean
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filtro, setFiltro] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(true)

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    endereco: "",
    limite_credito: "",
  })

  const [activeTab, setActiveTab] = useState<
    "basico" | "credito" | "endereco"
  >("basico");

  const [showValidationCard, setShowValidationCard] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const [messageCard, setMessageCard] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    title: string
    message: string
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  })

  const [animacaoExecutada, setAnimacaoExecutada] = useState(false)

  const [showLoadingModal, setShowLoadingModal] = useState(false)

  // Máscara para CPF (apenas visual)
  const formatarCPFInput = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, "");
    
    // Limita a 11 dígitos
    const limitedDigits = digits.slice(0, 11);
    
    // Aplica a máscara visual
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3)}`;
    } else if (limitedDigits.length <= 9) {
      return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6)}`;
    } else {
      return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6, 9)}-${limitedDigits.slice(9)}`;
    }
  };

  // Máscara para Telefone (apenas visual)
  const formatarTelefoneInput = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, "");
    
    // Limita a 11 dígitos
    const limitedDigits = digits.slice(0, 11);
    
    // Aplica a máscara visual
    if (limitedDigits.length <= 2) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
    } else if (limitedDigits.length <= 10) {
      return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6)}`;
    } else {
      return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
    }
  };

  // Handler para CPF com máscara visual
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatarCPFInput(e.target.value);
    setFormData({ ...formData, cpf: formattedValue });
    // Limpar erros de validação quando usuário começa a editar
    if (showValidationCard) {
      setShowValidationCard(false);
      setValidationErrors([]);
    }
  };

  // Handler para Telefone com máscara visual
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatarTelefoneInput(e.target.value);
    setFormData({ ...formData, telefone: formattedValue });
    // Limpar erros de validação quando usuário começa a editar
    if (showValidationCard) {
      setShowValidationCard(false);
      setValidationErrors([]);
    }
  };

  // Função para mostrar cards de mensagem temporários
  const showMessageCard = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setMessageCard({ show: true, type, title, message })
    // Auto-hide após 2 segundos
    setTimeout(() => {
      setMessageCard(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // Função para esconder card de mensagem manualmente
  const hideMessageCard = () => {
    setMessageCard(prev => ({ ...prev, show: false }))
  }

  // Função de validação completa
  const validarFormulario = (): string[] => {
    const errors: string[] = []

    // Validação do nome
    if (!formData.nome.trim()) {
      errors.push("Nome é obrigatório")
    } else if (formData.nome.trim().length < 2) {
      errors.push("Nome deve ter pelo menos 2 caracteres")
    }

    // Validação do CPF (apenas para novos clientes)
    if (!editingCliente) {
      const cpfDigits = formData.cpf.replace(/\D/g, "")
      if (!cpfDigits) {
        errors.push("CPF é obrigatório")
      } else if (cpfDigits.length !== 11) {
        errors.push("CPF deve ter 11 dígitos")
      } else if (!isValidCPF(cpfDigits)) {
        errors.push("CPF inválido")
      }
    }

    // Validação do limite de crédito (opcional, mas se preenchido deve ser válido)
    if (formData.limite_credito.trim()) {
      const limite = Number.parseFloat(formData.limite_credito)
      if (isNaN(limite)) {
        errors.push("Limite de crédito deve ser um número válido")
      } else if (limite < 0) {
        errors.push("Limite de crédito não pode ser negativo")
      }
    }

    return errors
  }

  useEffect(() => {
    carregarClientes()
  }, [])

  useEffect(() => {
    if (!loadingClientes && clientes.length > 0 && !animacaoExecutada) {
      setAnimacaoExecutada(true)
    }
  }, [loadingClientes, clientes.length, animacaoExecutada])

  const carregarClientes = async () => {
    setLoadingClientes(true)
    try {
      const response = await fetch("/api/clientes")
      const data = await response.json()
      setClientes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      setClientes([])
      showMessageCard('error', 'Erro ao carregar', 'Não foi possível carregar a lista de clientes. Verifique sua conexão.')
    } finally {
      setLoadingClientes(false)
    }
  }

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      cliente.cpf.includes(filtro) ||
      cliente.telefone.includes(filtro),
  )

  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const formatarTelefone = (telefone: string) => {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  // Validação simples do CPF (considera apenas dígitos e dígitos verificadores)
  const isValidCPF = (rawCpf: string) => {
    if (!rawCpf) return false
    const cpf = rawCpf.replace(/\D/g, "")
    if (cpf.length !== 11) return false

    // CPFs aceitos de forma excepcional
    const cpfsExcepcionais = [
      "11111111111", "22222222222", "33333333333", "44444444444",
      "55555555555", "66666666666", "77777777777", "88888888888",
      "99999999999", "12345678910"
    ]

    // Se for um CPF excepcional, aceitar
    if (cpfsExcepcionais.includes(cpf)) return true

    // rejeita CPFs com todos os dígitos iguais (exceto os excepcionais já tratados)
    if (/^(\d)\1{10}$/.test(cpf)) return false

    const calc = (t: number) => {
      let s = 0
      for (let i = 0; i < t - 1; i++) s += Number(cpf.charAt(i)) * (t - i)
      const r = 11 - (s % 11)
      return r > 9 ? 0 : r
    }

    return calc(10) === Number(cpf.charAt(9)) && calc(11) === Number(cpf.charAt(10))
  }

  const abrirModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        nome: cliente.nome,
        cpf: cliente.cpf,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        limite_credito: cliente.limite_credito.toString(),
      })
    } else {
      setEditingCliente(null)
      setFormData({
        nome: "",
        cpf: "",
        telefone: "",
        endereco: "",
        limite_credito: "",
      })
    }
    setShowModal(true)
    
    // Impedir scroll do body quando modal está aberto
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  }

  const fecharModal = () => {
    setShowModal(false)
    setEditingCliente(null)
    
    // Restaurar scroll do body quando modal é fechado
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  const salvarCliente = async (e: React.FormEvent) => {
    e.preventDefault()

    // Executar validação completa
    const errors = validarFormulario()
    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowValidationCard(true)
      return
    }

    // Limpar erros anteriores
    setValidationErrors([])
    setShowValidationCard(false)

    setLoading(true)

    try {
      const url = editingCliente ? `/api/clientes/${editingCliente.id}` : "/api/clientes"
      const method = editingCliente ? "PUT" : "POST"

      // Em edição, garantimos que o CPF enviado seja o CPF original (não permitimos alteração do CPF)
      const payload = {
        ...formData,
        limite_credito: Number.parseFloat(formData.limite_credito || "0"),
        cpf: editingCliente ? editingCliente.cpf : formData.cpf.replace(/\D/g, ""),
        telefone: formData.telefone.replace(/\D/g, ""),
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await carregarClientes()
        fecharModal()
        showMessageCard('success', editingCliente ? 'Cliente atualizado' : 'Cliente cadastrado', editingCliente ? 'As informações do cliente foram atualizadas com sucesso!' : 'Novo cliente cadastrado com sucesso!')
      } else {
        // tentar extrair mensagem do servidor (por exemplo: 'CPF é obrigatório') e mostrar ao usuário
        const errBody = await response.json().catch(() => null)
        let message = errBody && errBody.error ? String(errBody.error) : `Erro ao ${editingCliente ? 'atualizar' : 'cadastrar'} cliente`
        
        // Verificar se é erro de CPF duplicado
        if (message.includes('Duplicate entry') && message.includes('clientes_cpf_key')) {
          message = 'CPF já cadastrado no sistema'
        }
        
        // Mostrar erro dentro do modal
        setValidationErrors([message])
        setShowValidationCard(true)
        setLoading(false)
        return
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
      showMessageCard('error', 'Erro de conexão', `Não foi possível ${editingCliente ? 'atualizar' : 'cadastrar'} o cliente. Verifique sua conexão e tente novamente.`)
    } finally {
      setLoading(false)
    }
  }

  const excluirCliente = async (id: number) => {
    // abrir modal de confirmação
    setConfirmExcluirId(id)
    setShowConfirmExcluir(true)
  }

  const [showConfirmExcluir, setShowConfirmExcluir] = useState(false)
  const [confirmExcluirId, setConfirmExcluirId] = useState<number | null>(null)

  const handleConfirmExcluir = async () => {
    if (confirmExcluirId === null) return
    
    // Verificar se o cliente tem débito
    const cliente = clientes.find(c => c.id === confirmExcluirId)
    if (cliente && Number(cliente.debito_atual) > 0) {
      const debitoFormatado = Number(cliente.debito_atual).toFixed(2)
      showMessageCard('warning', 'Exclusão não permitida', `Não é possível excluir o cliente ${cliente.nome} pois ele possui um débito de R$ ${debitoFormatado}.`)
      setShowConfirmExcluir(false)
      setConfirmExcluirId(null)
      return
    }
    
    // Mostrar modal de loading
    setShowLoadingModal(true)
    
    try {
      const response = await fetch(`/api/clientes/${confirmExcluirId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await carregarClientes()
        showMessageCard('success', 'Cliente excluído', 'Cliente excluído com sucesso!')
      } else {
        throw new Error("Erro ao excluir cliente")
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error)
      showMessageCard('error', 'Erro ao excluir', 'Não foi possível excluir o cliente. Tente novamente.')
    } finally {
      setShowLoadingModal(false)
      setShowConfirmExcluir(false)
      setConfirmExcluirId(null)
    }
  }

  if (loadingClientes) {
    return (
      <div className="clientes-page">
        {/* Header Skeleton */}
        <div className="card">
          <div className="card-header">
            <div className="header-actions">
              <div className="skeleton skeleton-button-primary"></div>
            </div>
          </div>

          {/* Filtro Skeleton */}
          <div className="form-group">
            <div className="flex gap-2">
              <div className="skeleton" style={{ width: '300px', height: '40px', borderRadius: '8px' }}></div>
              <div className="skeleton skeleton-button" style={{ width: '40px', height: '40px' }}></div>
            </div>
          </div>

          {/* Tabela Skeleton */}
          <div style={{ overflowX: "auto" }}>
            <div className="desktop-view">
              <div className="table">
                <div className="table-header">
                  <div className="skeleton skeleton-title" style={{ width: '100px', height: '20px', marginBottom: '16px' }}></div>
                </div>
                <div className="table-body">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="table-row">
                      <div className="table-cell">
                        <div className="skeleton" style={{ width: '120px', height: '16px' }}></div>
                      </div>
                      <div className="table-cell">
                        <div className="skeleton" style={{ width: '100px', height: '16px' }}></div>
                      </div>
                      <div className="table-cell">
                        <div className="skeleton" style={{ width: '110px', height: '16px' }}></div>
                      </div>
                      <div className="table-cell">
                        <div className="skeleton" style={{ width: '80px', height: '16px' }}></div>
                      </div>
                      <div className="table-cell">
                        <div className="skeleton" style={{ width: '70px', height: '16px' }}></div>
                      </div>
                      <div className="table-cell">
                        <div className="skeleton" style={{ width: '60px', height: '16px', borderRadius: '12px' }}></div>
                      </div>
                      <div className="table-cell">
                        <div className="flex gap-2">
                          <div className="skeleton skeleton-button" style={{ width: '32px', height: '32px' }}></div>
                          <div className="skeleton skeleton-button" style={{ width: '32px', height: '32px' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="clientes-page">
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <button className="btn btn-primary" onClick={() => abrirModal()}>
              <Plus size={20} />
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Card de Mensagem Temporário */}
        {messageCard.show && (
          <div className={`message-card message-${messageCard.type}`}>
            <div className="message-body">
              <p className="message-text">{messageCard.message}</p>
              <button
                className="message-close"
                onClick={hideMessageCard}
                title="Fechar"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Filtro */}
        <div className="form-group">
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por nome, CPF ou telefone..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <button className="btn btn-outline">
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Tabela de Clientes */}
        <div style={{ overflowX: "auto" }}>
          {loadingClientes ? (
            <Loading message="Carregando clientes..." />
          ) : (
            <>
              {/* Tabela para Desktop */}
              <div className="desktop-view">
                <table className={`table ${animacaoExecutada ? '' : 'fade-in'}`}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Telefone</th>
                      <th>Limite Crédito</th>
                      <th>Débito Atual</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map((cliente) => (
                      <tr key={cliente.id}>
                        <td>
                          <div>
                            <div className="font-bold">{cliente.nome}</div>
                            <div className="text-sm text-muted">{cliente.endereco}</div>
                          </div>
                        </td>
                        <td>{formatarCPF(cliente.cpf)}</td>
                        <td>{formatarTelefone(cliente.telefone)}</td>
                        <td>R$ {Number(cliente.limite_credito).toFixed(2)}</td>
                        <td>
                          <span
                            style={{
                              color: Number(cliente.debito_atual) > 0 ? "var(--warning-color)" : "var(--success-color)",
                            }}
                          >
                            R$ {Number(cliente.debito_atual).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              color: cliente.ativo ? "var(--success-color)" : "var(--danger-color)",
                            }}
                          >
                            {cliente.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-outline" onClick={() => abrirModal(cliente)}>
                              <Edit size={16} />
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => excluirCliente(cliente.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards para Mobile */}
              <div className="mobile-view clients-cards">
                {clientesFiltrados.map((cliente) => (
                  <div key={cliente.id} className="client-card">
                    {/* Cabeçalho do Card */}
                    <div className="card-header">
                      <div className="client-info">
                        <h3 className="client-name">{cliente.nome}</h3>
                        <p className="client-cpf">
                          <User size={12} />
                          {formatarCPF(cliente.cpf)}
                        </p>
                      </div>
                    </div>

                    {/* Tag de Status Centralizada */}
                    <div className="card-status">
                      <span className={`status-badge ${cliente.ativo ? "active" : "inactive"}`}>
                        {cliente.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    {/* Corpo do Card - Grid 2x2 */}
                    <div className="card-body">
                      <div className="card-grid">
                        <div className="card-item">
                          <span className="item-label">
                            <Search size={14} />
                            Telefone
                          </span>
                          <span className="item-value">
                            {formatarTelefone(cliente.telefone)}
                          </span>
                        </div>

                        <div className="card-item">
                          <span className="item-label">
                            <Plus size={14} />
                            Limite
                          </span>
                          <span className="item-value credit">
                            R$ {Number(cliente.limite_credito).toFixed(2)}
                          </span>
                        </div>

                        <div className="card-item">
                          <span className="item-label">
                            <Trash2 size={14} />
                            Débito
                          </span>
                          <span className={`item-value ${Number(cliente.debito_atual) > 0 ? "debt" : "no-debt"}`}>
                            R$ {Number(cliente.debito_atual).toFixed(2)}
                          </span>
                        </div>

                        <div className="card-item">
                          <span className="item-label">
                            <Edit size={14} />
                            Disponível
                          </span>
                          <span className={`item-value ${Number(cliente.limite_credito) - Number(cliente.debito_atual) >= 0 ? "available" : "overdue"}`}>
                            R$ {(Number(cliente.limite_credito) - Number(cliente.debito_atual)).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Endereço */}
                      {cliente.endereco && (
                        <div className="card-address">
                          <small className="address-info">
                            <Search size={12} />
                            {cliente.endereco}
                          </small>
                        </div>
                      )}
                    </div>

                    {/* Rodapé com Botões de Ação */}
                    <div className="card-footer-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => abrirModal(cliente)}
                        title="Editar cliente"
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => excluirCliente(cliente.id)}
                        title="Excluir cliente"
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="product-modal-overlay" onClick={fecharModal}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header do Modal */}
            <div className="modal-header-1">
              <div className="modal-header-content">
                <div className="modal-title-info-1">
                  <h2>
                    {editingCliente ? "Editar Cliente" : "Novo Cliente"}
                  </h2>
                  <p>
                    {editingCliente ? "Atualize as informações do cliente" : "Adicione um novo cliente ao sistema"}
                  </p>
                </div>
              </div>
            </div>

            {/* Navegação por Abas */}
            <div className="modal-tabs">
              <button
                className={`tab-btn ${activeTab === "basico" ? "active" : ""}`}
                onClick={() => setActiveTab("basico")}
              >
                <User size={16} />
                Básico
              </button>
              <button
                className={`tab-btn ${activeTab === "credito" ? "active" : ""}`}
                onClick={() => setActiveTab("credito")}
              >
                <DollarSign size={16} />
                Crédito
              </button>
              <button
                className={`tab-btn ${activeTab === "endereco" ? "active" : ""}`}
                onClick={() => setActiveTab("endereco")}
              >
                <MapPin size={16} />
                Endereço
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <form onSubmit={salvarCliente} className="product-form">
              {/* Card de Validação */}
              {showValidationCard && validationErrors.length > 0 && (
              <div className="validation-card-1">
                <div className="validation-body">
                <ul className="validation-list">
                  {validationErrors.map((error, index) => (
                  <li key={index} className="validation-item">
                    <OctagonAlert size={24} className="validation-bullet" />
                    {error}
                  </li>
                  ))}
                </ul>
                </div>
              </div>
              )}

              <div className="modal-body-1">
                {/* Aba Básico */}
                {activeTab === "basico" && (
                  <div className="form-section">
                    <div className="form-grid-1">
                      <div className="form-group-1">
                        <label className="form-label">Nome Completo *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.nome}
                          onChange={(e) => {
                            setFormData({ ...formData, nome: e.target.value });
                            // Limpar erros de validação quando usuário começa a editar
                            if (showValidationCard) {
                              setShowValidationCard(false);
                              setValidationErrors([]);
                            }
                          }}
                          placeholder="Nome completo do cliente"
                          required
                        />
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">CPF *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.cpf}
                          onChange={handleCPFChange}
                          placeholder="000.000.000-00"
                          required
                          readOnly={!!editingCliente}
                        />
                        {editingCliente && (
                          <div className="text-sm text-muted mt-1">CPF não pode ser alterado ao editar um cliente.</div>
                        )}
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">Telefone</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.telefone}
                          onChange={handleTelefoneChange}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Crédito */}
                {activeTab === "credito" && (
                  <div className="form-section">
                    <div className="form-grid-1">
                      <div className="form-group-1">
                        <label className="form-label">Limite de Crédito *</label>
                        <div className="input-with-icon">
                          <span className="currency-symbol">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            className="form-input currency-input"
                            value={formData.limite_credito}
                            onChange={(e) => {
                              setFormData({ ...formData, limite_credito: e.target.value });
                              // Limpar erros de validação quando usuário começa a editar
                              if (showValidationCard) {
                                setShowValidationCard(false);
                                setValidationErrors([]);
                              }
                            }}
                            placeholder="0,00"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resumo do Crédito */}
                    {formData.limite_credito && (
                      <div className="financial-summary">
                        <h4>Resumo do Crédito</h4>
                        <div className="summary-grid">
                          <div className="summary-item">
                            <span className="summary-label">Limite:</span>
                            <span className="summary-value success">
                              R$ {Number(formData.limite_credito).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Aba Endereço */}
                {activeTab === "endereco" && (
                  <div className="form-section">
                    <div className="form-grid-1">
                      <div className="form-group-1 full-width">
                        <label className="form-label">Endereço Completo</label>
                        <textarea
                          className="form-textarea"
                          value={formData.endereco}
                          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                          placeholder="Rua, número, bairro, cidade, CEP..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer do Modal */}
              <div className="modal-footer-1">
                <div className="footer-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-lg"
                    onClick={fecharModal}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        {editingCliente ? "Atualizar" : "Salvar"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação para exclusão de cliente */}
      {showConfirmExcluir && (
        <ConfirmationModal
          isOpen={showConfirmExcluir}
          onClose={() => setShowConfirmExcluir(false)}
          onConfirm={handleConfirmExcluir}
          title="Confirmar exclusão"
          message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
          type="danger"
          confirmText="Excluir"
          cancelText="Cancelar"
        />
      )}

      {/* Modal de Loading */}
      {showLoadingModal && (
        <LoadingModal
          isOpen={showLoadingModal}
          title="Excluindo cliente..."
          message="Aguarde enquanto o cliente é removido do sistema."
        />
      )}
    </div>
  )
}
