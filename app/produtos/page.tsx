"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Loading from "@/components/loading";
import ConfirmationModal from "@/components/confirmation-modal";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Package,
  Scale,
  Hash,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Camera,
  Barcode,
  Calculator,
  Settings,
  Info,
  FileText,
  MapPin,
  Calendar,
  Tag,
} from "lucide-react";

interface Produto {
  id: number;
  codigo_barras: string;
  nome: string;
  categoria: string;
  preco: number;
  preco_kilo?: number;
  unidade_medida: "unidade" | "kilo" | "grama" | "litro" | "mililitro";
  peso_liquido?: number;
  estoque: number;
  estoque_minimo: number;
  custo_compra?: number;
  margem_lucro?: number;
  fornecedor?: string;
  localizacao?: string;
  data_validade?: string;
  lote?: string;
  observacoes?: string;
  ativo: boolean;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [filtro, setFiltro] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  const [animacaoExecutada, setAnimacaoExecutada] = useState(false)
  const [showConfirmExcluir, setShowConfirmExcluir] = useState(false);
  const [confirmExcluirId, setConfirmExcluirId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    codigo_barras: "",
    nome: "",
    categoria: "",
    preco: "",
    preco_kilo: "",
    unidade_medida: "unidade" as
      | "unidade"
      | "kilo"
      | "grama"
      | "litro"
      | "mililitro",
    peso_liquido: "",
    estoque: "",
    estoque_minimo: "",
    custo_compra: "",
    margem_lucro: "",
    fornecedor: "",
    localizacao: "",
    data_validade: "",
    lote: "",
    observacoes: "",
  });

  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "basico" | "estoque" | "financeiro" | "outros"
  >("basico");

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    if (!loadingProdutos && produtos.length > 0 && !animacaoExecutada) {
      setAnimacaoExecutada(true);
    }
  }, [loadingProdutos, produtos.length, animacaoExecutada]);

  const carregarProdutos = async () => {
    setLoadingProdutos(true);
    try {
      const response = await fetch("/api/produtos?mode=all");
      const data = await response.json();
      setProdutos(Array.isArray(data) ? data : []);
      console.log(
        `[PRODUTOS] Carregados ${
          Array.isArray(data) ? data.length : 0
        } produtos`
      );
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProdutos([]);
    } finally {
      setLoadingProdutos(false);
    }
  };

  const produtosFiltrados = produtos.filter(
    (produto) =>
      produto.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      produto.codigo_barras.includes(filtro) ||
      produto.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  const abrirModal = (produto?: Produto) => {
    if (produto) {
      setEditingProduto(produto);
      setFormData({
        codigo_barras: produto.codigo_barras,
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.preco.toString(),
        preco_kilo: produto.preco_kilo?.toString() || "",
        unidade_medida: produto.unidade_medida || "unidade",
        peso_liquido: produto.peso_liquido?.toString() || "",
        estoque: produto.estoque.toString(),
        estoque_minimo: produto.estoque_minimo.toString(),
        custo_compra: produto.custo_compra?.toString() || "",
        margem_lucro: produto.margem_lucro?.toString() || "",
        fornecedor: produto.fornecedor || "",
        localizacao: produto.localizacao || "",
        data_validade: produto.data_validade || "",
        lote: produto.lote || "",
        observacoes: produto.observacoes || "",
      });
    } else {
      setEditingProduto(null);
      setFormData({
        codigo_barras: "",
        nome: "",
        categoria: "",
        preco: "",
        preco_kilo: "",
        unidade_medida: "unidade",
        peso_liquido: "",
        estoque: "",
        estoque_minimo: "",
        custo_compra: "",
        margem_lucro: "",
        fornecedor: "",
        localizacao: "",
        data_validade: "",
        lote: "",
        observacoes: "",
      });
    }
    setShowModal(true);
    setActiveTab("basico");
    
    // Impedir scroll do body quando modal está aberto
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingProduto(null);
    setShowAdvancedFields(false);
    
    // Restaurar scroll do body quando modal é fechado
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  };

  const salvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingProduto
        ? `/api/produtos/${editingProduto.id}`
        : "/api/produtos";
      const method = editingProduto ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          preco: Number.parseFloat(formData.preco),
          preco_kilo: formData.preco_kilo
            ? Number.parseFloat(formData.preco_kilo)
            : null,
          peso_liquido: formData.peso_liquido
            ? Number.parseFloat(formData.peso_liquido)
            : null,
          estoque: Number.parseInt(formData.estoque),
          estoque_minimo: Number.parseInt(formData.estoque_minimo),
          custo_compra: formData.custo_compra
            ? Number.parseFloat(formData.custo_compra)
            : null,
          margem_lucro: formData.margem_lucro
            ? Number.parseFloat(formData.margem_lucro)
            : null,
        }),
      });

      if (response.ok) {
        await carregarProdutos();
        fecharModal();
        toast({
          title: editingProduto ? "Produto atualizado" : "Produto cadastrado",
          description: editingProduto
            ? "Produto atualizado com sucesso!"
            : "Produto cadastrado com sucesso!",
          variant: "success",
        });
      } else {
        throw new Error("Erro ao salvar produto");
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar produto!",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirProduto = async (id: number) => {
    setConfirmExcluirId(id);
    setShowConfirmExcluir(true);
  };

  const handleConfirmExcluir = async () => {
    if (confirmExcluirId === null) return;
    try {
      const response = await fetch(`/api/produtos/${confirmExcluirId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await carregarProdutos();
        toast({
          title: "Produto excluído",
          description: "Produto excluído com sucesso!",
          variant: "success",
        });
      } else {
        throw new Error("Erro ao excluir produto");
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir produto!",
        variant: "destructive",
      });
    } finally {
      setShowConfirmExcluir(false);
      setConfirmExcluirId(null);
    }
  };

  const calcularMargemLucro = () => {
    const preco = Number.parseFloat(formData.preco) || 0;
    const custo = Number.parseFloat(formData.custo_compra) || 0;
    if (preco > 0 && custo > 0) {
      const margem = ((preco - custo) / custo) * 100;
      setFormData({ ...formData, margem_lucro: margem.toFixed(2) });
    }
  };

  const calcularPrecoSugestao = () => {
    const custo = Number.parseFloat(formData.custo_compra) || 0;
    const margem = Number.parseFloat(formData.margem_lucro) || 0;
    if (custo > 0 && margem > 0) {
      const preco = custo * (1 + margem / 100);
      setFormData({ ...formData, preco: preco.toFixed(2) });
    }
  };

  if (loadingProdutos) {
    return (
      <div className="produtos-page">
        {/* Header Skeleton */}
        <div className="page-header">
          <div className="skeleton skeleton-button-primary" style={{ width: '140px', height: '44px' }}></div>
        </div>

        {/* Search Section Skeleton */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <div className="skeleton" style={{ width: '400px', height: '44px', borderRadius: '8px' }}></div>
            </div>
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="products-grid">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="product-card-skeleton">
              <div className="product-image-skeleton">
                <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '8px' }}></div>
              </div>
              <div className="product-info-skeleton">
                <div className="skeleton skeleton-title" style={{ width: '80%', height: '20px', marginBottom: '8px' }}></div>
                <div className="skeleton skeleton-label" style={{ width: '60%', height: '14px', marginBottom: '4px' }}></div>
                <div className="skeleton skeleton-value" style={{ width: '40%', height: '18px', marginBottom: '12px' }}></div>
                <div className="product-actions-skeleton">
                  <div className="skeleton skeleton-button" style={{ width: '32px', height: '32px' }}></div>
                  <div className="skeleton skeleton-button" style={{ width: '32px', height: '32px' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="produtos-page">
      {/* Header da Página */}
      <div className="page-header">
        <button className="btn btn-primary btn-lg" onClick={() => abrirModal()}>
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nome, código ou categoria..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            {filtro && (
              <button
                className="clear-search-btn"
                onClick={() => setFiltro("")}
                title="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="search-results">
            <span className="results-count">
              {produtosFiltrados.length} produto
              {produtosFiltrados.length !== 1 ? "s" : ""} encontrado
              {produtosFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="products-table-container">
        {loadingProdutos ? (
          <div className="loading-container">
            <Loading message="Carregando produtos..." />
          </div>
        ) : (
          <>
            {/* Tabela para Desktop */}
            <div className="table-responsive desktop-view">
              <table className="products-table">
                <thead>
                  <tr>
                    <th className="col-code">Código</th>
                    <th className="col-name">Nome</th>
                    <th className="col-category">Categoria</th>
                    <th className="col-unit">Unidade</th>
                    <th className="col-price">Preço</th>
                    <th className="col-stock">Estoque</th>
                    <th className="col-status">Status</th>
                    <th className="col-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((produto) => (
                    <tr key={produto.id} className="product-row">
                      <td className="product-code">
                        <div className="code-display">
                          <Barcode size={14} />
                          <span>{produto.codigo_barras}</span>
                        </div>
                      </td>
                      <td className="product-name">
                        <div className="name-info">
                          <strong>{produto.nome}</strong>
                          {produto.peso_liquido && (
                            <small className="weight-info">
                              {produto.peso_liquido}{" "}
                              {produto.unidade_medida === "kilo"
                                ? "kg"
                                : produto.unidade_medida === "grama"
                                ? "g"
                                : produto.unidade_medida === "litro"
                                ? "L"
                                : produto.unidade_medida === "mililitro"
                                ? "ml"
                                : "un"}
                            </small>
                          )}
                        </div>
                      </td>
                      <td className="product-category">
                        <span className="category-badge">
                          {produto.categoria}
                        </span>
                      </td>
                      <td className="product-unit">
                        <div className="unit-display">
                          {produto.unidade_medida === "kilo" && (
                            <Scale size={14} />
                          )}
                          {produto.unidade_medida === "grama" && (
                            <Scale size={14} />
                          )}
                          {produto.unidade_medida === "litro" && (
                            <Package size={14} />
                          )}
                          {produto.unidade_medida === "mililitro" && (
                            <Package size={14} />
                          )}
                          {produto.unidade_medida === "unidade" && (
                            <Hash size={14} />
                          )}
                          <span>
                            {produto.unidade_medida === "kilo"
                              ? "Kg"
                              : produto.unidade_medida === "grama"
                              ? "g"
                              : produto.unidade_medida === "litro"
                              ? "L"
                              : produto.unidade_medida === "mililitro"
                              ? "ml"
                              : "Un"}
                          </span>
                        </div>
                      </td>
                      <td className="product-price">
                        <div className="price-info">
                          <span className="main-price">
                            R$ {Number(produto.preco).toFixed(2)}
                          </span>
                          {produto.preco_kilo && (
                            <small className="kilo-price">
                              R$ {Number(produto.preco_kilo).toFixed(2)}/kg
                            </small>
                          )}
                        </div>
                      </td>
                      <td className="product-stock">
                        <div className="stock-info">
                          <span
                            className={`stock-value ${
                              produto.estoque <= produto.estoque_minimo
                                ? "low-stock"
                                : "good-stock"
                            }`}
                          >
                            {produto.estoque}
                          </span>
                          {produto.estoque <= produto.estoque_minimo && (
                            <AlertTriangle size={14} className="warning-icon" />
                          )}
                        </div>
                      </td>
                      <td className="product-status">
                        <span
                          className={`status-badge ${
                            produto.ativo ? "active" : "inactive"
                          }`}
                        >
                          {produto.ativo ? (
                            <>
                              <CheckCircle size={12} />
                              Ativo
                            </>
                          ) : (
                            <>
                              <X size={12} />
                              Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="product-actions">
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-outline action-btn"
                            onClick={() => abrirModal(produto)}
                            title="Editar produto"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger action-btn"
                            onClick={() => excluirProduto(produto.id)}
                            title="Excluir produto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards para Mobile */}
            <div className="mobile-view products-cards">
              {produtosFiltrados.map((produto, index) => (
                <div key={produto.id} className={`product-card ${animacaoExecutada ? '' : 'fade-in'}`} style={animacaoExecutada ? {} : { animationDelay: `${index * 0.05}s` }}>
                  {/* Cabeçalho do Card */}
                  <div className="card-header">
                    <div className="product-info">
                      <h3 className="product-name">{produto.nome}</h3>
                      <p className="product-code">
                        <Barcode size={12} />
                        {produto.codigo_barras}
                      </p>
                    </div>
                  </div>

                  {/* Tag de Categoria Centralizada */}
                  <div className="card-category">
                    <span className="category-badge">
                      {produto.categoria}
                    </span>
                  </div>

                  {/* Corpo do Card - Grid 2x2 */}
                  <div className="card-body">
                    <div className="card-grid">
                      <div className="card-item">
                        <span className="item-label">
                          <DollarSign size={14} />
                          Preço
                        </span>
                        <span className="item-value price">
                          <DollarSign size={12} className="value-icon" />
                          R$ {Number(produto.preco).toFixed(2)}
                          {produto.preco_kilo && (
                            <small>
                              R$ {Number(produto.preco_kilo).toFixed(2)}/kg
                            </small>
                          )}
                        </span>
                      </div>

                      <div className="card-item">
                        <span className="item-label">
                          <Scale size={14} />
                          Unidade
                        </span>
                        <span className="item-value">
                          <Scale size={12} className="value-icon" />
                          {produto.unidade_medida === "kilo"
                            ? "Kg"
                            : produto.unidade_medida === "grama"
                            ? "g"
                            : produto.unidade_medida === "litro"
                            ? "L"
                            : produto.unidade_medida === "mililitro"
                            ? "ml"
                            : "Un"}
                        </span>
                      </div>

                      <div className="card-item">
                        <span className="item-label">
                          <Package size={14} />
                          Estoque
                        </span>
                        <span
                          className={`item-value ${
                            produto.estoque <= produto.estoque_minimo
                              ? "low-stock"
                              : "good-stock"
                          }`}
                        >
                          <Package size={12} className="value-icon" />
                          {produto.estoque}
                          {produto.estoque <= produto.estoque_minimo && (
                            <AlertTriangle size={12} className="warning-icon" />
                          )}
                        </span>
                      </div>

                      <div className="card-item">
                        <span className="item-label">
                          <CheckCircle size={14} />
                          Status
                        </span>
                        <span
                          className={`item-value status ${
                            produto.ativo ? "active" : "inactive"
                          }`}
                        >
                          <CheckCircle size={12} className="value-icon" />
                          {produto.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>

                    {produto.peso_liquido && (
                      <div className="card-footer">
                        <small className="weight-info">
                          <Scale size={12} />
                          {produto.peso_liquido}{" "}
                          {produto.unidade_medida === "kilo"
                            ? "kg"
                            : produto.unidade_medida === "grama"
                            ? "g"
                            : produto.unidade_medida === "litro"
                            ? "L"
                            : produto.unidade_medida === "mililitro"
                            ? "ml"
                            : "un"}
                        </small>
                      </div>
                    )}
                  </div>

                  {/* Rodapé com Botões de Ação */}
                  <div className="card-footer-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => abrirModal(produto)}
                      title="Editar produto"
                    >
                      <Edit size={14} />
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => excluirProduto(produto.id)}
                      title="Excluir produto"
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

      {/* Modal de Produto */}
      {showModal && (
        <div className="product-modal-overlay" onClick={fecharModal}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header do Modal */}
            <div className="product-header">
              <div className="product-header-info">
                <div className="product-header-icon">
                  {editingProduto ? <Edit size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="product-header-title">
                    {editingProduto ? "Editar Produto" : "Novo Produto"}
                  </h2>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={fecharModal}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navegação por Abas */}
            <div className="modal-tabs">
              <button
                className={`tab-btn ${activeTab === "basico" ? "active" : ""}`}
                onClick={() => setActiveTab("basico")}
              >
                <Package size={16} />
                Básico
              </button>
              <button
                className={`tab-btn ${activeTab === "estoque" ? "active" : ""}`}
                onClick={() => setActiveTab("estoque")}
              >
                <Hash size={16} />
                Estoque
              </button>
              <button
                className={`tab-btn ${
                  activeTab === "financeiro" ? "active" : ""
                }`}
                onClick={() => setActiveTab("financeiro")}
              >
                <DollarSign size={16} />
                Financeiro
              </button>
              <button
                className={`tab-btn ${activeTab === "outros" ? "active" : ""}`}
                onClick={() => setActiveTab("outros")}
              >
                <Settings size={16} />
                Outros
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <form onSubmit={salvarProduto} className="product-form">
              <div className="modal-body-1">
                {/* Aba Básico */}
                {activeTab === "basico" && (
                  <div className="form-section">
                    <div className="form-grid-1">
                      <div className="form-group-1">
                        <label className="form-label">Código de Barras *</label>
                        <div className="input-with-icon">
                          <Barcode size={16} className="input-icon" />
                          <input
                            type="text"
                            className="form-input"
                            value={formData.codigo_barras}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                codigo_barras: e.target.value,
                              })
                            }
                            placeholder="Digite ou escaneie o código"
                            required
                          />
                          <button
                            type="button"
                            className="input-btn"
                            title="Escanear código"
                          >
                            <Camera size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">Nome do Produto *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.nome}
                          onChange={(e) =>
                            setFormData({ ...formData, nome: e.target.value })
                          }
                          placeholder="Nome completo do produto"
                          required
                        />
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">Categoria *</label>
                        <select
                          className="form-select"
                          value={formData.categoria}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              categoria: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="">Selecione uma categoria</option>
                          <option value="Alimentos">Alimentos</option>
                          <option value="Bebidas">Bebidas</option>
                          <option value="Limpeza">Limpeza</option>
                          <option value="Higiene">Higiene</option>
                          <option value="Padaria">Padaria</option>
                          <option value="Frios">Frios</option>
                          <option value="Mercearia">Mercearia</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">
                          Unidade de Medida *
                        </label>
                        <select
                          className="form-select"
                          value={formData.unidade_medida}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              unidade_medida: e.target.value as any,
                            })
                          }
                          required
                        >
                          <option value="unidade">Unidade</option>
                          <option value="kilo">Quilograma (Kg)</option>
                          <option value="grama">Grama (g)</option>
                          <option value="litro">Litro (L)</option>
                          <option value="mililitro">Mililitro (ml)</option>
                        </select>
                      </div>

                      {(formData.unidade_medida === "kilo" ||
                        formData.unidade_medida === "grama") && (
                        <div className="form-group-1">
                          <label className="form-label">Peso Líquido</label>
                          <input
                            type="number"
                            step="0.001"
                            className="form-input"
                            value={formData.peso_liquido}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                peso_liquido: e.target.value,
                              })
                            }
                            placeholder={`Peso em ${
                              formData.unidade_medida === "kilo" ? "kg" : "g"
                            }`}
                          />
                        </div>
                      )}

                      <div className="form-group-1">
                        <label className="form-label">Preço de Venda *</label>
                        <div className="input-with-icon">
                          <span className="currency-symbol">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            className="form-input currency-input"
                            value={formData.preco}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                preco: e.target.value,
                              })
                            }
                            placeholder="0,00"
                            required
                          />
                        </div>
                      </div>

                      {(formData.unidade_medida === "kilo" ||
                        formData.unidade_medida === "grama") && (
                        <div className="form-group-1">
                          <label className="form-label">Preço por Kilo</label>
                          <div className="input-with-icon">
                            <span className="currency-symbol">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              className="form-input currency-input"
                              value={formData.preco_kilo}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  preco_kilo: e.target.value,
                                })
                              }
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Aba Estoque */}
                {activeTab === "estoque" && (
                  <div className="form-section">
                    <div className="form-grid-1">
                      <div className="form-group-1">
                        <label className="form-label">
                          Quantidade em Estoque *
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.estoque}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              estoque: e.target.value,
                            })
                          }
                          placeholder="0"
                          min="0"
                          required
                        />
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">Estoque Mínimo *</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.estoque_minimo}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              estoque_minimo: e.target.value,
                            })
                          }
                          placeholder="5"
                          min="0"
                          required
                        />
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">Localização</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.localizacao}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              localizacao: e.target.value,
                            })
                          }
                          placeholder="Ex: Prateleira A-01, Geladeira 2"
                        />
                      </div>
                    </div>

                    {/* Resumo do Estoque */}
                    <div className="stock-summary">
                      <div className="summary-item">
                        <span className="summary-label">Status Atual:</span>
                        <span
                          className={`summary-value ${
                            (Number(formData.estoque) || 0) <=
                            (Number(formData.estoque_minimo) || 0)
                              ? "warning"
                              : "success"
                          }`}
                        >
                          {(Number(formData.estoque) || 0) <=
                          (Number(formData.estoque_minimo) || 0)
                            ? "Estoque Baixo"
                            : "Estoque Adequado"}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Disponível:</span>
                        <span className="summary-value">
                          {Number(formData.estoque) || 0} unidades
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Financeiro */}
                {activeTab === "financeiro" && (
                  <div className="form-section">
                    <div className="form-grid-1">
                      <div className="form-group-1">
                        <label className="form-label">Custo de Compra</label>
                        <div className="input-with-icon">
                          <span className="currency-symbol">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            className="form-input currency-input"
                            value={formData.custo_compra}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                custo_compra: e.target.value,
                              })
                            }
                            placeholder="0,00"
                          />
                        </div>
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">
                          Margem de Lucro (%)
                        </label>
                        <div className="input-with-actions">
                          <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.margem_lucro}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                margem_lucro: e.target.value,
                              })
                            }
                            placeholder="0,00"
                          />
                          <button
                            type="button"
                            className="input-action-btn"
                            onClick={calcularMargemLucro}
                            title="Calcular margem baseada no preço e custo"
                          >
                            <Calculator size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">Sugestão de Preço</label>
                        <div className="price-suggestion">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={calcularPrecoSugestao}
                            disabled={
                              !formData.custo_compra || !formData.margem_lucro
                            }
                          >
                            Calcular Preço Sugerido
                          </button>
                          <small>Baseado no custo e margem informados</small>
                        </div>
                      </div>
                    </div>

                    {/* Resumo Financeiro */}
                    {(formData.custo_compra || formData.margem_lucro) && (
                      <div className="financial-summary">
                        <h4>Resumo Financeiro</h4>
                        <div className="summary-grid">
                          {formData.custo_compra && (
                            <div className="summary-item">
                              <span className="summary-label">Custo:</span>
                              <span className="summary-value">
                                R$ {Number(formData.custo_compra).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {formData.margem_lucro && (
                            <div className="summary-item">
                              <span className="summary-label">Margem:</span>
                              <span className="summary-value">
                                {Number(formData.margem_lucro).toFixed(2)}%
                              </span>
                            </div>
                          )}
                          {formData.preco && formData.custo_compra && (
                            <div className="summary-item">
                              <span className="summary-label">Lucro:</span>
                              <span className="summary-value success">
                                R${" "}
                                {(
                                  Number(formData.preco) -
                                  Number(formData.custo_compra)
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Aba Outros */}
                {activeTab === "outros" && (
                  <div className="form-section">
                    <div className="form-grid-1">
                      <div className="form-group-1">
                        <label className="form-label">Fornecedor</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.fornecedor}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fornecedor: e.target.value,
                            })
                          }
                          placeholder="Nome do fornecedor"
                        />
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">Lote</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.lote}
                          onChange={(e) =>
                            setFormData({ ...formData, lote: e.target.value })
                          }
                          placeholder="Número do lote"
                        />
                      </div>

                      <div className="form-group-1">
                        <label className="form-label">Data de Validade</label>
                        <input
                          type="date"
                          className="form-input"
                          value={formData.data_validade}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data_validade: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-group-1 full-width">
                        <label className="form-label">Observações</label>
                        <textarea
                          className="form-textarea"
                          value={formData.observacoes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              observacoes: e.target.value,
                            })
                          }
                          placeholder="Observações adicionais sobre o produto..."
                          rows={3}
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
                    className="btn btn-primary btn-lg"
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
                        {editingProduto ? "Atualizar" : "Salvar"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação para exclusão */}
      {showConfirmExcluir && (
        <ConfirmationModal
          isOpen={showConfirmExcluir}
          onClose={() => setShowConfirmExcluir(false)}
          onConfirm={handleConfirmExcluir}
          title="Confirmar exclusão"
          message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
          type="danger"
          confirmText="Excluir"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
}
