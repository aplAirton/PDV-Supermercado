"use client";

import { useState, useEffect } from "react";
import {
  Calculator,
  User,
  DollarSign,
  Shield,
  Clock,
  OctagonAlert,
  TrendingUp,
  Plus,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  Lock,
  FileText,
  Printer,
  ArrowRightLeft,
  Check,
  X,
  Banknote,
  CreditCard,
  Smartphone,
  Receipt,
  Handshake,
  ShoppingCart,
  Wallet,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import LoadingModal from "../../components/loading-modal";
import MasterPasswordConfirmation from "../../components/master-password-confirmation";
import PaymentSuccessModal from "../../components/payment-success-modal";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import "../../styles/caixa.css";

// Função toast limpa - sem alertas de navegador
const toast = ({
  title,
  description,
  variant,
}: {
  title: string;
  description?: string;
  variant?: string;
}) => {
  // Sistema de toast silencioso - apenas log no console em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    const status = variant === "destructive" ? "ERRO" : "SUCESSO";
    const message = description ? `${title}: ${description}` : title;
    console.log(`[${status}] ${message}`);
  }
};

interface Funcionario {
  id: number;
  nome: string;
  cpf: string;
  cargo: string;
  login: string;
  ativo: boolean;
}

interface Caixa {
  id: number;
  funcionario_id: number;
  funcionario_nome: string;
  status: "aberto" | "fechado";
  valor_inicial: number;
  valor_final?: number;
  data_abertura: string;
  data_fechamento?: string;
  observacoes_abertura?: string;
  observacoes_fechamento?: string;
  total_vendas: number;
  total_dinheiro: number;
  total_cartao_debito: number;
  total_cartao_credito: number;
  total_pix: number;
  total_fiado: number;
  total_suprimentos: number;
  total_sangrias: number;
}

export default function CaixaPage() {
  const [loading, setLoading] = useState(true);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [showResumoModal, setShowResumoModal] = useState(false);
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [loadingAbrirCaixa, setLoadingAbrirCaixa] = useState(false);
  const [loadingFecharCaixa, setLoadingFecharCaixa] = useState(false);
  const [loadingDados, setLoadingDados] = useState(false);
  const [showSangriaModal, setShowSangriaModal] = useState(false);
  const [formasPagamentoExpanded, setFormasPagamentoExpanded] = useState(false);
  const [sangriaForm, setSangriaForm] = useState({
    valor: "",
    descricao: "",
  });
  const [processandoSangria, setProcessandoSangria] = useState(false);
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false);
  const [showValidacaoSenhaModal, setShowValidacaoSenhaModal] = useState(false);
  const [showTipoMovimentoModal, setShowTipoMovimentoModal] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [pagamentoEtapa, setPagamentoEtapa] = useState<
    "fornecedor" | "dados" | "senha" | null
  >(null);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [loadingFornecedoresInicial, setLoadingFornecedoresInicial] =
    useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<any>(null);
  const [showCadastroFornecedor, setShowCadastroFornecedor] = useState(false);
  const [mostrarDescricaoPagamento, setMostrarDescricaoPagamento] =
    useState(false);
  const [pagamentoForm, setPagamentoForm] = useState({
    valor: "",
    forma_pagamento: "dinheiro",
    descricao: "",
    afeta_caixa: true,
  });
  const [cadastroFornecedorForm, setCadastroFornecedorForm] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
  });
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [validacaoSenhaForm, setValidacaoSenhaForm] = useState({ senha: "" });
  const [saldoDinheiroDisponivel, setSaldoDinheiroDisponivel] = useState(0);
  const [valorInicialCaixa, setValorInicialCaixa] = useState(0);
  const [showConfirmacaoConsumoInicial, setShowConfirmacaoConsumoInicial] =
    useState(false);
  const [erroSaldoInsuficientePagamento, setErroSaldoInsuficientePagamento] =
    useState(""); // Novo: erro de saldo no pagamento
  const [tipoMovimentoSelecionado, setTipoMovimentoSelecionado] = useState<
    "sangria" | "suprimento" | "pagamento" | null
  >(null);
  const [movimentoForm, setMovimentoForm] = useState({
    valor: "",
    descricao: "",
  });
  const [processandoMovimento, setProcessandoMovimento] = useState(false);
  const [caixaSelecionado, setCaixaSelecionado] = useState<Caixa | null>(null);
  const [caixaAtual, setCaixaAtual] = useState<{
    id: number;
    funcionario_nome: string;
    funcionario_cargo: string;
    valor_inicial: number;
  } | null>(null);

  // Persistir funcionário validado durante a etapa de abertura (evita perda entre etapas)
  const [funcionarioAbertura, setFuncionarioAbertura] =
    useState<Funcionario | null>(null);

  // Estados para abertura em etapas
  const [etapaAbertura, setEtapaAbertura] = useState<
    "login" | "configuracao" | "confirmacao"
  >("login");
  const [loginForm, setLoginForm] = useState({
    cpf: "",
    senha: "",
  });

  // Estados para fechamento em etapas
  const [etapaFechamento, setEtapaFechamento] = useState<
    "login" | "contagem" | "resumo"
  >("login");
  const [funcionarioFechamento, setFuncionarioFechamento] =
    useState<Funcionario | null>(null);
  const [resumoFechamento, setResumoFechamento] = useState<any>(null);
  const [showValidacaoSenhaFechamento, setShowValidacaoSenhaFechamento] =
    useState(false);
  const [showContagemDinheiro, setShowContagemDinheiro] = useState(false);
  const [showResumoFechamento, setShowResumoFechamento] = useState(false);
  const [processandoFechamento, setProcessandoFechamento] = useState(false);

  // Estados para comprovante de abertura
  const [showComprovanteAbertura, setShowComprovanteAbertura] = useState(false);
  const [showComprovantePagamento, setShowComprovantePagamento] =
    useState(false);
  const [dadosPagamentoComprovante, setDadosPagamentoComprovante] =
    useState<any>(null);
  const [dadosAbertura, setDadosAbertura] = useState<any>(null);

  // Estados para feedbacks de erro de senha
  const [erroSenhaAbertura, setErroSenhaAbertura] = useState<string>("");
  const [erroSenhaFechamento, setErroSenhaFechamento] = useState<string>("");
  const [erroSenhaMovimentacao, setErroSenhaMovimentacao] =
    useState<string>("");

  const [novoForm, setNovoForm] = useState({
    valor_inicial: "",
    observacoes: "",
  });

  const [fecharForm, setFecharForm] = useState({
    senha: "",
    valor_contado_dinheiro: "",
    observacoes: "",
  });

  useEffect(() => {
    verificarStatusCaixa();
    carregarDados();
  }, []);

  // Impedir rolagem do fundo quando modal estiver ativo
  useEffect(() => {
    if (showResumoModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    // Cleanup ao desmontar componente
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showResumoModal]);

  const verificarStatusCaixa = async () => {
    try {
      const response = await fetch("/api/caixa/status");
      const data = await response.json();

      if (data.caixaAberto) {
        setCaixaAtual(data.caixa);
      }
    } catch (error) {
      console.error("Erro ao verificar status do caixa:", error);
    }
  };

  // === FUNÇÕES DE ABERTURA ===

  const cancelarAberturaCaixa = () => {
    // Cancelamento transacional - limpa todos os estados de abertura
    setShowNovoModal(false);
    setEtapaAbertura("login");
    setLoginForm({ cpf: "", senha: "" });
    setNovoForm({ valor_inicial: "", observacoes: "" });
    setFuncionarioAbertura(null);
    sessionStorage.removeItem("funcionario_caixa");
    // Limpar erros
    setErroSenhaAbertura("");
  };

  // === FUNÇÕES DE FECHAMENTO EM ETAPAS ===

  const iniciarFechamentoCaixa = () => {
    if (!caixaSelecionado) return;

    // Reset de estados
    setEtapaFechamento("login");
    setFuncionarioFechamento(null);
    setResumoFechamento(null);
    setFecharForm({ senha: "", valor_contado_dinheiro: "", observacoes: "" });

    // Iniciar fluxo
    setShowValidacaoSenhaFechamento(true);
  };

  const cancelarFechamentoCaixa = () => {
    // Cancelamento transacional - limpa todos os estados
    setShowValidacaoSenhaFechamento(false);
    setShowContagemDinheiro(false);
    setShowResumoFechamento(false);
    setEtapaFechamento("login");
    setFuncionarioFechamento(null);
    setResumoFechamento(null);
    setFecharForm({ senha: "", valor_contado_dinheiro: "", observacoes: "" });
    setProcessandoFechamento(false);
    // Limpar erros
    setErroSenhaFechamento("");
  };

  const voltarEtapaFechamento = () => {
    // Volta para a etapa anterior do fluxo de fechamento
    if (etapaFechamento === "resumo") {
      setEtapaFechamento("contagem");
      setShowResumoFechamento(false);
      setShowContagemDinheiro(true);
    } else if (etapaFechamento === "contagem") {
      setEtapaFechamento("login");
      setShowContagemDinheiro(false);
      setShowValidacaoSenhaFechamento(true);
    }
  };

  const validarSenhaFechamento = async () => {
    if (!caixaSelecionado || !fecharForm.senha) return;

    // Limpar erros anteriores
    setErroSenhaFechamento("");
    setProcessandoFechamento(true); // Adicionar loading
    try {
      const response = await fetch("/api/caixa/validar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcionario_id: caixaSelecionado.funcionario_id,
          senha: fecharForm.senha,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setErroSenhaFechamento(error.error || "Senha incorreta");
        return;
      }

      const funcionario = await response.json();
      setFuncionarioFechamento(funcionario);

      // Avançar para próxima etapa
      setEtapaFechamento("contagem");
      setShowValidacaoSenhaFechamento(false);
      setShowContagemDinheiro(true);
    } catch (error) {
      console.error("Erro na validação:", error);
      setErroSenhaFechamento("Falha na validação da senha");
    } finally {
      setProcessandoFechamento(false);
    }
  };

  const processarContagem = async () => {
    if (!caixaSelecionado || !fecharForm.valor_contado_dinheiro) return;

    setProcessandoFechamento(true); // Adicionar loading
    try {
      // Buscar resumo de lançamentos do caixa
      const resumoResponse = await fetch(
        `/api/caixa/${caixaSelecionado.id}/resumo`
      );
      const resumoData = await resumoResponse.json();

      if (!resumoResponse.ok) {
        throw new Error(resumoData.error || "Erro ao buscar resumo do caixa");
      }

      // Calcular diferença
      const valorContado = parseFloat(fecharForm.valor_contado_dinheiro) || 0;
      const valorEsperado = resumoData.valores.esperado;
      const diferenca = valorContado - valorEsperado;

      // Preparar resumo completo
      const resumoCompleto = {
        id: caixaSelecionado.id,
        funcionario_nome: caixaSelecionado.funcionario_nome,
        funcionario_cargo: funcionarioFechamento?.cargo || "",
        data_abertura: caixaSelecionado.data_abertura,
        data_fechamento: new Date().toISOString(),
        valores: {
          inicial: caixaSelecionado.valor_inicial,
          vendas: resumoData.valores?.vendas || 0,
          vendas_dinheiro: resumoData.valores?.vendas_dinheiro || 0,
          suprimentos: resumoData.valores?.suprimentos || 0,
          sangrias: resumoData.valores?.sangrias || 0,
          esperado: valorEsperado,
          contado: valorContado,
          diferenca: diferenca,
        },
        vendas: resumoData.vendas || { total_transacoes: 0, valor_total: 0 },
        status_reconciliacao:
          diferenca === 0 ? "perfeito" : diferenca > 0 ? "sobra" : "falta",
        observacoes: fecharForm.observacoes,
      };

      setResumoFechamento(resumoCompleto);

      // Avançar para próxima etapa
      setEtapaFechamento("resumo");
      setShowContagemDinheiro(false);
      setShowResumoFechamento(true);
    } catch (error) {
      console.error("Erro ao processar contagem:", error);
      toast({
        title: "Erro",
        description: "Falha ao processar contagem",
        variant: "destructive",
      });
    } finally {
      setProcessandoFechamento(false);
    }
  };

  const confirmarFechamentoCaixa = async () => {
    if (!caixaSelecionado || !resumoFechamento) return;

    setProcessandoFechamento(true);
    try {
      // Realizar o fechamento efetivo
      const response = await fetch(`/api/caixa/${caixaSelecionado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "fechado",
          valor_contado_dinheiro: resumoFechamento.valores.contado,
          observacoes_fechamento: resumoFechamento.observacoes,
          diferenca_caixa: resumoFechamento.valores.diferenca,
          status_reconciliacao: resumoFechamento.status_reconciliacao,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Sucesso - fechar modais de fechamento e mostrar resumo final
        setShowResumoFechamento(false);
        setCaixaSelecionado(null);

        // Mostrar o modal de resumo final
        setShowResumoModal(true);

        carregarDados();
        verificarStatusCaixa();

        // Reset estados de fechamento
        setEtapaFechamento("login");
        setFuncionarioFechamento(null);
        setFecharForm({
          senha: "",
          valor_contado_dinheiro: "",
          observacoes: "",
        });

        // Limpar informações de login armazenadas
        sessionStorage.removeItem("funcionario_caixa");
        setFuncionarioAbertura(null);
        setLoginForm({ cpf: "", senha: "" });
        setNovoForm({ valor_inicial: "", observacoes: "" });
      } else {
        toast({
          title: "Erro ao fechar caixa",
          description: result.error || "Não foi possível fechar o caixa",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao fechar caixa",
        description: "Não foi possível fechar o caixa",
        variant: "destructive",
      });
    } finally {
      setProcessandoFechamento(false);
    }
  };

  // Função antiga mantida para compatibilidade (não será mais usada)
  const fecharCaixa = async () => {
    // Redireciona para o novo fluxo
    iniciarFechamentoCaixa();
  };

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Só mostrar loading modal se for uma operação inicial (não refresh rápido)
      const shouldShowModal = !caixas.length || !funcionarios.length;
      if (shouldShowModal) {
        setLoadingDados(true);
      }

      const [caixasRes, funcionariosRes] = await Promise.all([
        fetch("/api/caixa"),
        fetch("/api/funcionarios"),
      ]);

      if (caixasRes.ok) {
        const caixasData = await caixasRes.json();
        console.log("Dados dos caixas carregados:", caixasData);
        setCaixas(caixasData);
      }

      if (funcionariosRes.ok) {
        const funcionariosData = await funcionariosRes.json();
        setFuncionarios(funcionariosData.filter((f: Funcionario) => f.ativo));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do caixa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingDados(false); // Sempre limpar, mesmo que não tenha sido ativado
    }
  };

  const abrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpar erros anteriores
    setErroSenhaAbertura("");

    if (etapaAbertura === "login") {
      // Validar login (mais robusto)
      const cpfInput = (loginForm.cpf || "").toString().trim();
      const senhaInput = (loginForm.senha || "").toString().trim();

      // Se não houver dados no formulário, verificar se já existe um funcionário validado no sessionStorage
      const storedFuncionario = sessionStorage.getItem("funcionario_caixa");

      if ((!cpfInput || !senhaInput) && !storedFuncionario) {
        setErroSenhaAbertura("CPF e senha são obrigatórios");
        return;
      }

      // Validar se CPF tem exatamente 11 dígitos
      if (cpfInput && cpfInput.length !== 11) {
        setErroSenhaAbertura("CPF deve ter exatamente 11 dígitos");
        return;
      }

      // Se houver funcionário armazenado, avançar automaticamente para etapa de fundos
      if ((!cpfInput || !senhaInput) && storedFuncionario) {
        try {
          const parsed = JSON.parse(storedFuncionario);
          setFuncionarioAbertura(parsed);
          setEtapaAbertura("configuracao");
          return;
        } catch (err) {
          // se parsing falhar, prosseguir com validação normal
          console.error("Erro ao ler funcionario armazenado:", err);
        }
      }

      try {
        setLoadingAbrirCaixa(true);
        // Validar credenciais
        const response = await fetch("/api/funcionarios/validar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cpf: cpfInput,
            senha: senhaInput,
          }),
        });

        if (response.ok) {
          const funcionario = await response.json();
          // Debug: verificar dados recebidos
          console.log("🔐 Login validado:", { funcionario, cpf: cpfInput });

          // Salvar dados do funcionário para uso posterior (sessionStorage + estado local)
          sessionStorage.setItem(
            "funcionario_caixa",
            JSON.stringify(funcionario)
          );
          setFuncionarioAbertura(funcionario);
          setEtapaAbertura("configuracao");
          // Toast removido - transição silenciosa
        } else {
          const error = await response.json();
          setErroSenhaAbertura(error.error || "CPF ou senha incorretos");
        }
      } catch (error) {
        console.error("Erro:", error);
        setErroSenhaAbertura("Não foi possível validar as credenciais");
      } finally {
        setLoadingAbrirCaixa(false);
      }
    } else if (etapaAbertura === "configuracao") {
      // Avançar para confirmação
      setEtapaAbertura("confirmacao");
    } else if (etapaAbertura === "confirmacao") {
      // Abrir caixa com fundos
      try {
        setLoadingAbrirCaixa(true);
        // Preferir o estado local (mais confiável durante fluxo), senão fallback para sessionStorage
        const funcionarioData =
          funcionarioAbertura ||
          JSON.parse(sessionStorage.getItem("funcionario_caixa") || "{}");

        // Debug: verificar estado antes de abrir caixa
        console.log("💰 Tentando abrir caixa:", {
          funcionarioAbertura: !!funcionarioAbertura,
          sessionStorage: !!sessionStorage.getItem("funcionario_caixa"),
          funcionarioData,
          etapa: etapaAbertura,
        });

        // Validação robusta: se não temos dados do funcionário, forçar volta para login
        if (!funcionarioData || !funcionarioData.id) {
          console.error("[ERRO] Dados do funcionário perdidos!");
          toast({
            title: "Erro de sessão",
            description: "Sessão expirada. Faça login novamente.",
            variant: "destructive",
          });
          setEtapaAbertura("login");
          setFuncionarioAbertura(null);
          sessionStorage.removeItem("funcionario_caixa");
          return;
        }

        const response = await fetch("/api/caixa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cpf: loginForm.cpf,
            senha: loginForm.senha,
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0,
            observacoes_abertura: novoForm.observacoes,
          }),
        });

        const result = await response.json();

        // Debug: verificar resposta da API
        console.log("🔥 Resposta da API /api/caixa:", {
          status: response.status,
          ok: response.ok,
          result,
          requestBody: {
            cpf: loginForm.cpf,
            senha: "***",
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0,
            observacoes_abertura: novoForm.observacoes,
          },
        });

        if (response.ok) {
          // Abertura realizada com sucesso - sem toast

          // Preparar dados do comprovante de abertura
          setDadosAbertura({
            caixa_id: result.caixa_id,
            funcionario_nome: funcionarioData.nome,
            funcionario_cargo: funcionarioData.cargo,
            funcionario_cpf: loginForm.cpf,
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0,
            observacoes: novoForm.observacoes,
            data_abertura: new Date().toISOString(),
          });

          // Atualizar estado do caixa atual
          setCaixaAtual({
            id: result.caixa_id,
            funcionario_nome: funcionarioData.nome,
            funcionario_cargo: funcionarioData.cargo,
            valor_inicial: parseFloat(novoForm.valor_inicial) || 0,
          });

          // Limpar estado após abrir o caixa
          setShowNovoModal(false);
          setEtapaAbertura("login");
          setLoginForm({ cpf: "", senha: "" });
          setNovoForm({ valor_inicial: "", observacoes: "" });
          setFuncionarioAbertura(null);
          sessionStorage.removeItem("funcionario_caixa");

          // Mostrar comprovante de abertura
          setShowComprovanteAbertura(true);

          carregarDados();
        } else {
          toast({
            title: "Erro ao abrir caixa",
            description: result.error || "Não foi possível abrir o caixa",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro:", error);
        toast({
          title: "Erro ao abrir caixa",
          description: "Não foi possível abrir o caixa",
          variant: "destructive",
        });
      } finally {
        setLoadingAbrirCaixa(false);
      }
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const verResumo = async (caixa: Caixa) => {
    try {
      // garantir que o caixa selecionado esteja definido para o modal
      setCaixaSelecionado(caixa);
      setLoadingResumo(true);

      const response = await fetch(`/api/caixa/${caixa.id}/resumo`);
      const resumo = await response.json();

      if (response.ok) {
        console.log("[CAIXA] Resumo carregado:", {
          id: resumo.id,
          valores: resumo.valores,
          vendas: resumo.vendas,
        });
        setResumoFechamento(resumo);
        setShowResumoModal(true);
      } else {
        toast({
          title: "Erro ao carregar resumo",
          description: resumo.error || "Não foi possível carregar o resumo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar resumo:", error);
      toast({
        title: "Erro ao carregar resumo",
        description: "Não foi possível carregar o resumo",
        variant: "destructive",
      });
    } finally {
      setLoadingResumo(false);
    }
  };

  const realizarSangria = async () => {
    if (!caixaSelecionado) return;

    const valor = parseFloat(sangriaForm.valor);
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido para sangria",
        variant: "destructive",
      });
      return;
    }

    setProcessandoSangria(true);

    try {
      const response = await fetch(`/api/caixa/${caixaSelecionado.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao: "movimentacao",
          tipo: "sangria",
          valor: valor,
          descricao: sangriaForm.descricao || "Sangria do caixa",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao realizar sangria");
      }

      toast({
        title: "Sucesso",
        description: `Sangria de ${formatarValor(valor)} realizada com sucesso`,
        variant: "default",
      });

      // Limpar formulário e fechar modal
      setSangriaForm({ valor: "", descricao: "" });
      setShowSangriaModal(false);

      // Atualizar lista de caixas
      await carregarDados();

      // Se havia resumo aberto, recarregar
      if (showResumoModal) {
        await verResumo(caixaSelecionado);
      }
    } catch (error) {
      console.error("Erro ao realizar sangria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a sangria",
        variant: "destructive",
      });
    } finally {
      setProcessandoSangria(false);
    }
  };

  const iniciarMovimentacao = (caixa: Caixa) => {
    setCaixaSelecionado(caixa);
    setShowValidacaoSenhaModal(true);
  };

  const validarSenhaMovimentacao = async () => {
    if (!caixaSelecionado || !validacaoSenhaForm.senha) {
      toast({
        title: "Erro",
        description: "Senha é obrigatória",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/caixa/validar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcionario_id: caixaSelecionado.funcionario_id,
          senha: validacaoSenhaForm.senha,
        }),
      });

      if (response.ok) {
        setShowValidacaoSenhaModal(false);
        setValidacaoSenhaForm({ senha: "" });
        setShowTipoMovimentoModal(true);
      } else {
        const error = await response.json();
        setErroSenhaMovimentacao(error.error || "Senha incorreta");
      }
    } catch (error) {
      console.error("Erro:", error);
      setErroSenhaMovimentacao("Falha na validação da senha");
    }
  };

  const buscarSaldoDinheiroDisponivel = async () => {
    try {
      const response = await fetch("/api/caixa/saldo-dinheiro");
      if (response.ok) {
        const data = await response.json();
        // Corrigido: usar saldoCaixa em vez de saldoDinheiro
        setSaldoDinheiroDisponivel(data.saldoCaixa || 0);
        setValorInicialCaixa(data.valorInicial || 0);
        console.log("[CAIXA PAGE] Saldo atualizado:", data.saldoCaixa);
      }
    } catch (error) {
      console.error("Erro ao buscar saldo em dinheiro:", error);
      setSaldoDinheiroDisponivel(0);
      setValorInicialCaixa(0);
    }
  };

  // Função para validar valor do pagamento em tempo real
  const validarValorPagamentoCaixa = (
    valor: string,
    afetaCaixa: boolean = pagamentoForm.afeta_caixa
  ) => {
    if (!afetaCaixa) {
      setErroSaldoInsuficientePagamento("");
      return;
    }

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErroSaldoInsuficientePagamento("");
      return;
    }

    if (valorNumerico > saldoDinheiroDisponivel) {
      setErroSaldoInsuficientePagamento(
        `Valor R$ ${valorNumerico.toFixed(
          2
        )} é superior ao saldo disponível R$ ${saldoDinheiroDisponivel.toFixed(
          2
        )}`
      );
    } else {
      setErroSaldoInsuficientePagamento("");
    }
  };

  const selecionarTipoMovimento = async (
    tipo: "sangria" | "suprimento" | "pagamento"
  ) => {
    setTipoMovimentoSelecionado(tipo);
    setShowTipoMovimentoModal(false);

    if (tipo === "pagamento") {
      // Mostrar modal de loading inicial
      setLoadingFornecedoresInicial(true);

      // Buscar saldo disponível em dinheiro para validação
      await buscarSaldoDinheiroDisponivel();

      // Iniciar busca de fornecedores (o modal será fechado quando terminar)
      buscarFornecedores();
    } else {
      setShowTipoMovimentoModal(true);
    }
  };

  const buscarFornecedores = async () => {
    try {
      const response = await fetch("/api/fornecedores");
      if (response.ok) {
        const data = await response.json();
        setFornecedores(data);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao buscar fornecedores",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast({
        title: "Erro",
        description: "Erro ao buscar fornecedores",
        variant: "destructive",
      });
    } finally {
      // Fechar modal de loading inicial e abrir modal de fornecedores
      setLoadingFornecedoresInicial(false);
      setShowPagamentoModal(true);
      setPagamentoEtapa("fornecedor");
      setLoadingFornecedores(false);
    }
  };

  const selecionarFornecedor = (fornecedor: any) => {
    setFornecedorSelecionado(fornecedor);
    setPagamentoEtapa("dados");
  };

  const avancarParaDadosPagamento = () => {
    setPagamentoEtapa("dados");
  };

  const voltarParaFornecedor = () => {
    setPagamentoEtapa("fornecedor");
    setFornecedorSelecionado(null);
  };

  const cancelarPagamento = () => {
    setShowPagamentoModal(false);
    setPagamentoEtapa(null);
    setFornecedorSelecionado(null);
    setShowCadastroFornecedor(false);
    setPagamentoForm({
      valor: "",
      forma_pagamento: "dinheiro",
      descricao: "",
      afeta_caixa: true,
    });
    setCadastroFornecedorForm({ nome: "", cnpj: "", telefone: "" });
    setErroSaldoInsuficientePagamento(""); // Limpar erro ao cancelar pagamento
  };

  const avancarParaPagamento = () => {
    // Validações básicas
    if (!pagamentoForm.valor || parseFloat(pagamentoForm.valor) <= 0) {
      toast({
        title: "Erro",
        description:
          "Valor do pagamento é obrigatório e deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    // Validar saldo disponível quando usar dinheiro do caixa
    if (pagamentoForm.afeta_caixa) {
      const valorPagamento = parseFloat(pagamentoForm.valor);
      if (valorPagamento > saldoDinheiroDisponivel) {
        toast({
          title: "Saldo Insuficiente",
          description: `O valor do pagamento (R$ ${valorPagamento.toFixed(
            2
          )}) é superior ao saldo disponível em dinheiro (R$ ${saldoDinheiroDisponivel.toFixed(
            2
          )}). Saldo disponível: R$ ${saldoDinheiroDisponivel.toFixed(2)}`,
          variant: "destructive",
        });
        return;
      }

      // Verificar se a operação consumirá do valor inicial
      const saldoAposOperacao = saldoDinheiroDisponivel - valorPagamento;
      if (
        saldoAposOperacao < valorInicialCaixa &&
        !showConfirmacaoConsumoInicial
      ) {
        setShowConfirmacaoConsumoInicial(true);
        return;
      }
    }

    if (pagamentoForm.afeta_caixa) {
      setPagamentoEtapa("senha");
    } else {
      confirmarPagamento();
    }
  };

  const confirmarPagamentoComSenha = async () => {
    if (!validacaoSenhaForm.senha) return;

    try {
      const response = await fetch("/api/validar-senha-gerencial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: validacaoSenhaForm.senha }),
      });

      if (response.ok) {
        confirmarPagamento();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Senha incorreta",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro na validação da senha:", error);
      toast({
        title: "Erro",
        description: "Erro na validação da senha",
        variant: "destructive",
      });
    }
  };

  const confirmarPagamento = async () => {
    if (!fornecedorSelecionado || !pagamentoForm.valor) return;

    setProcessandoPagamento(true);

    try {
      const response = await fetch("/api/fornecedores/pagamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornecedor_id: fornecedorSelecionado.id,
          valor_total: pagamentoForm.valor,
          forma_pagamento: pagamentoForm.forma_pagamento,
          descricao: pagamentoForm.descricao,
          afeta_caixa: pagamentoForm.afeta_caixa,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Sucesso",
          description: `Pagamento de ${formatarValor(
            parseFloat(pagamentoForm.valor)
          )} realizado com sucesso`,
        });

        // Preparar dados para o comprovante
        const dadosComprovante = {
          id: result.id,
          fornecedor: fornecedorSelecionado,
          valor: parseFloat(pagamentoForm.valor),
          forma_pagamento: pagamentoForm.forma_pagamento,
          descricao: pagamentoForm.descricao,
          afeta_caixa: pagamentoForm.afeta_caixa,
          data_pagamento: new Date().toISOString(),
        };

        // Mostrar modal de resumo
        setDadosPagamentoComprovante(dadosComprovante);
        setShowComprovantePagamento(true);

        // Fechar modal de pagamento
        cancelarPagamento();

        // Recarregar dados do caixa
        if (caixaSelecionado) {
          await verResumo(caixaSelecionado);
        }
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao realizar pagamento",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao realizar pagamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao realizar pagamento",
        variant: "destructive",
      });
    } finally {
      setProcessandoPagamento(false);
      setShowConfirmacaoConsumoInicial(false);
    }
  };

  const cadastrarFornecedor = async () => {
    if (
      !cadastroFornecedorForm.nome ||
      !cadastroFornecedorForm.cnpj ||
      !cadastroFornecedorForm.telefone
    )
      return;

    try {
      const response = await fetch("/api/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cadastroFornecedorForm),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Fornecedor cadastrado com sucesso",
        });
        setShowCadastroFornecedor(false);
        setCadastroFornecedorForm({ nome: "", cnpj: "", telefone: "" });
        buscarFornecedores(); // Recarregar lista de fornecedores
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao cadastrar fornecedor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao cadastrar fornecedor:", error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar fornecedor",
        variant: "destructive",
      });
    }
  };

  const imprimirComprovantePagamento = async () => {
    try {
      if (!dadosPagamentoComprovante) {
        console.error("[Frontend] Dados do comprovante não encontrados");
        return;
      }

      console.log(
        "[Frontend] Dados do comprovante:",
        dadosPagamentoComprovante
      );

      // Criar URL com parâmetros para o comprovante de pagamento
      const params = new URLSearchParams({
        fornecedor_nome: dadosPagamentoComprovante.fornecedor.nome,
        fornecedor_cnpj: dadosPagamentoComprovante.fornecedor.cnpj,
        valor: dadosPagamentoComprovante.valor.toString(),
        forma_pagamento: dadosPagamentoComprovante.forma_pagamento,
        descricao: dadosPagamentoComprovante.descricao || "",
        afeta_caixa: dadosPagamentoComprovante.afeta_caixa.toString(),
        data_pagamento: dadosPagamentoComprovante.data_pagamento,
        pagamento_id: dadosPagamentoComprovante.id.toString(),
      });

      const url = `/api/fornecedores/pagamentos/${
        dadosPagamentoComprovante.id
      }/comprovante?${params.toString()}`;
      console.log("[Frontend] URL gerada:", url);

      const newWindow = window.open(url, "_blank", "width=400,height=600");

      if (!newWindow) {
        toast({
          title: "Erro ao imprimir",
          description: "Verifique o bloqueador de pop-ups",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Erro ao imprimir comprovante:", error);
      toast({
        title: "Erro ao imprimir",
        description: "Não foi possível imprimir o comprovante",
        variant: "destructive",
      });
    }
  };

  const realizarMovimentacao = async () => {
    if (!caixaSelecionado || !tipoMovimentoSelecionado) return;

    const valor = parseFloat(movimentoForm.valor);
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido",
        variant: "destructive",
      });
      return;
    }

    setProcessandoMovimento(true);

    try {
      const response = await fetch(`/api/caixa/${caixaSelecionado.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao: "movimentacao_financeira",
          tipo: tipoMovimentoSelecionado,
          valor: valor,
          descricao:
            movimentoForm.descricao ||
            `${
              tipoMovimentoSelecionado === "sangria" ? "Sangria" : "Suprimento"
            } do caixa`,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao realizar movimentação");
      }

      toast({
        title: "Sucesso",
        description: `${
          tipoMovimentoSelecionado === "sangria" ? "Sangria" : "Suprimento"
        } de ${formatarValor(valor)} realizada com sucesso`,
        variant: "default",
      });

      // Limpar formulários e fechar modais
      setMovimentoForm({ valor: "", descricao: "" });
      setShowTipoMovimentoModal(false);
      setTipoMovimentoSelecionado(null);
      setCaixaSelecionado(null);

      // Atualizar lista de caixas
      await carregarDados();
    } catch (error) {
      console.error("Erro ao realizar movimentação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a movimentação",
        variant: "destructive",
      });
    } finally {
      setProcessandoMovimento(false);
    }
  };

  const cancelarMovimentacao = () => {
    setShowValidacaoSenhaModal(false);
    setShowTipoMovimentoModal(false);
    setValidacaoSenhaForm({ senha: "" });
    setMovimentoForm({ valor: "", descricao: "" });
    setTipoMovimentoSelecionado(null);
    setCaixaSelecionado(null);
    // Limpar erros
    setErroSenhaMovimentacao("");
  };

  const imprimirComprovanteAbertura = async () => {
    try {
      if (!dadosAbertura) return;

      // Criar URL com parâmetros para o comprovante de abertura
      const params = new URLSearchParams({
        funcionario: dadosAbertura.funcionario_nome,
        cargo: dadosAbertura.funcionario_cargo,
        cpf: dadosAbertura.funcionario_cpf,
        valor_inicial: dadosAbertura.valor_inicial.toString(),
        observacoes: dadosAbertura.observacoes || "",
        data_abertura: dadosAbertura.data_abertura,
      });

      const url = `/api/caixa/${
        dadosAbertura.caixa_id
      }/comprovante-abertura?${params.toString()}`;
      const newWindow = window.open(url, "_blank", "width=400,height=600");

      if (!newWindow) {
        toast({
          title: "Erro ao imprimir",
          description: "Verifique o bloqueador de pop-ups",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Erro ao imprimir comprovante:", error);
      toast({
        title: "Erro ao imprimir",
        description: "Não foi possível imprimir o comprovante",
        variant: "destructive",
      });
    }
  };

  const imprimirResumoCaixa = async (caixaId: number) => {
    try {
      const url = `/api/caixa/${caixaId}/resumo/cupom`;
      const newWindow = window.open(url, "_blank", "width=400,height=600");

      if (!newWindow) {
        toast({
          title: "Erro ao imprimir",
          description: "Verifique o bloqueador de pop-ups",
          variant: "destructive",
        });
        return;
      }

      // Impressão aberta - sem toast de confirmação
    } catch (error) {
      console.error("Erro ao imprimir resumo:", error);
      toast({
        title: "Erro ao imprimir",
        description: "Não foi possível imprimir o resumo",
        variant: "destructive",
      });
    }
  };

  const caixasAbertos = caixas.filter((c) => c.status === "aberto");
  const caixasFechados = caixas.filter((c) => c.status === "fechado");

  if (loading) {
    return (
      <div className="caixa-container">
        {/* Header Skeleton */}
        <div className="page-header">
          <div className="header-info">
            <div
              className="skeleton skeleton-title"
              style={{ width: "250px", height: "32px", marginBottom: "8px" }}
            ></div>
            <div
              className="skeleton skeleton-label"
              style={{ width: "350px", height: "16px", marginBottom: "16px" }}
            ></div>
            <div className="header-stats">
              <div className="stat-item">
                <div
                  className="skeleton skeleton-label"
                  style={{ width: "80px", height: "12px", marginBottom: "4px" }}
                ></div>
                <div
                  className="skeleton skeleton-value"
                  style={{ width: "30px", height: "20px" }}
                ></div>
              </div>
              <div className="stat-item">
                <div
                  className="skeleton skeleton-label"
                  style={{ width: "90px", height: "12px", marginBottom: "4px" }}
                ></div>
                <div
                  className="skeleton skeleton-value"
                  style={{ width: "25px", height: "20px" }}
                ></div>
              </div>
              <div className="stat-item">
                <div
                  className="skeleton skeleton-label"
                  style={{ width: "85px", height: "12px", marginBottom: "4px" }}
                ></div>
                <div
                  className="skeleton skeleton-value"
                  style={{ width: "28px", height: "20px" }}
                ></div>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <div className="funcionario-info">
              <div className="funcionario-avatar">
                <div
                  className="skeleton"
                  style={{ width: "48px", height: "48px", borderRadius: "50%" }}
                ></div>
              </div>
              <div className="funcionario-details">
                <div
                  className="skeleton skeleton-title"
                  style={{
                    width: "150px",
                    height: "20px",
                    marginBottom: "4px",
                  }}
                ></div>
                <div
                  className="skeleton skeleton-label"
                  style={{
                    width: "100px",
                    height: "14px",
                    marginBottom: "8px",
                  }}
                ></div>
                <div className="status-indicator">
                  <div
                    className="skeleton"
                    style={{
                      width: "60px",
                      height: "16px",
                      borderRadius: "8px",
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div
              className="skeleton skeleton-button-primary"
              style={{ width: "120px", height: "40px" }}
            ></div>
          </div>
        </div>

        {/* Status do Caixa Skeleton */}
        <div className="caixa-status-section">
          <div className="caixa-status-card">
            <div
              className="skeleton skeleton-icon"
              style={{ width: "48px", height: "48px", borderRadius: "50%" }}
            ></div>
            <div className="status-content">
              <div
                className="skeleton skeleton-label"
                style={{ width: "150px", height: "16px", marginBottom: "8px" }}
              ></div>
              <div
                className="skeleton skeleton-value"
                style={{ width: "100px", height: "24px" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Cards de Ação Skeleton */}
        <div className="caixa-actions-grid">
          <div className="action-card">
            <div
              className="skeleton skeleton-icon"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                marginBottom: "16px",
              }}
            ></div>
            <div
              className="skeleton skeleton-title"
              style={{ width: "120px", height: "20px", marginBottom: "8px" }}
            ></div>
            <div
              className="skeleton skeleton-label"
              style={{ width: "180px", height: "14px", marginBottom: "16px" }}
            ></div>
            <div
              className="skeleton skeleton-button-primary"
              style={{ width: "100%", height: "44px" }}
            ></div>
          </div>
          <div className="action-card">
            <div
              className="skeleton skeleton-icon"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                marginBottom: "16px",
              }}
            ></div>
            <div
              className="skeleton skeleton-title"
              style={{ width: "100px", height: "20px", marginBottom: "8px" }}
            ></div>
            <div
              className="skeleton skeleton-label"
              style={{ width: "160px", height: "14px", marginBottom: "16px" }}
            ></div>
            <div
              className="skeleton skeleton-button"
              style={{ width: "100%", height: "44px" }}
            ></div>
          </div>
          <div className="action-card">
            <div
              className="skeleton skeleton-icon"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                marginBottom: "16px",
              }}
            ></div>
            <div
              className="skeleton skeleton-title"
              style={{ width: "110px", height: "20px", marginBottom: "8px" }}
            ></div>
            <div
              className="skeleton skeleton-label"
              style={{ width: "170px", height: "14px", marginBottom: "16px" }}
            ></div>
            <div
              className="skeleton skeleton-button"
              style={{ width: "100%", height: "44px" }}
            ></div>
          </div>
        </div>

        {/* Lista de Caixas Skeleton */}
        <div className="caixa-list-section">
          <div className="section-header">
            <div
              className="skeleton skeleton-title"
              style={{ width: "150px", height: "24px" }}
            ></div>
            <div
              className="skeleton skeleton-badge"
              style={{ width: "60px", height: "24px" }}
            ></div>
          </div>

          <div className="caixa-cards-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="caixa-skeleton-card">
                <div className="caixa-card-header">
                  <div
                    className="skeleton skeleton-icon"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                    }}
                  ></div>
                  <div className="caixa-card-info">
                    <div
                      className="skeleton skeleton-title"
                      style={{
                        width: "120px",
                        height: "18px",
                        marginBottom: "4px",
                      }}
                    ></div>
                    <div
                      className="skeleton skeleton-label"
                      style={{ width: "80px", height: "14px" }}
                    ></div>
                  </div>
                  <div
                    className="skeleton skeleton-value"
                    style={{ width: "70px", height: "18px" }}
                  ></div>
                </div>
                <div className="caixa-card-body">
                  <div className="caixa-info-grid">
                    <div className="info-item">
                      <div
                        className="skeleton skeleton-label"
                        style={{
                          width: "50px",
                          height: "12px",
                          marginBottom: "4px",
                        }}
                      ></div>
                      <div
                        className="skeleton skeleton-value"
                        style={{ width: "60px", height: "14px" }}
                      ></div>
                    </div>
                    <div className="info-item">
                      <div
                        className="skeleton skeleton-label"
                        style={{
                          width: "45px",
                          height: "12px",
                          marginBottom: "4px",
                        }}
                      ></div>
                      <div
                        className="skeleton skeleton-value"
                        style={{ width: "55px", height: "14px" }}
                      ></div>
                    </div>
                    <div className="info-item">
                      <div
                        className="skeleton skeleton-label"
                        style={{
                          width: "40px",
                          height: "12px",
                          marginBottom: "4px",
                        }}
                      ></div>
                      <div
                        className="skeleton skeleton-value"
                        style={{ width: "50px", height: "14px" }}
                      ></div>
                    </div>
                    <div className="info-item">
                      <div
                        className="skeleton skeleton-label"
                        style={{
                          width: "55px",
                          height: "12px",
                          marginBottom: "4px",
                        }}
                      ></div>
                      <div
                        className="skeleton skeleton-value"
                        style={{ width: "65px", height: "14px" }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="caixa-card-footer">
                  <div
                    className="skeleton skeleton-button"
                    style={{ width: "80px", height: "36px" }}
                  ></div>
                  <div
                    className="skeleton skeleton-button"
                    style={{ width: "90px", height: "36px" }}
                  ></div>
                  <div
                    className="skeleton skeleton-button"
                    style={{ width: "70px", height: "36px" }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="caixa-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-actions">
          {caixaAtual && (
            <div className="funcionario-info">
              <div className="funcionario-avatar">
                <User size={20} />
              </div>
              <div className="funcionario-details">
                <span className="funcionario-name">
                  {caixaAtual.funcionario_nome}
                </span>
                <small className="funcionario-role">
                  {caixaAtual.funcionario_cargo}
                </small>
              </div>
              <div className="status-indicator">
                <div className="status-dot active"></div>
                <span className="status-text">Caixa Aberto</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowNovoModal(true)}
            className="btn btn-primary"
            disabled={caixasAbertos.length > 0}
            style={{
              opacity: caixasAbertos.length > 0 ? 0.5 : 1,
              cursor: caixasAbertos.length > 0 ? "not-allowed" : "pointer",
            }}
            title={
              caixasAbertos.length > 0
                ? "Há um caixa aberto. Feche-o antes de abrir um novo."
                : "Abrir novo caixa"
            }
          >
            <Plus size={16} />
            Abrir Caixa
          </button>
        </div>
      </div>

      {/* resumo removido conforme solicitado */}

      {/* Card do Caixa Aberto */}
      {caixasAbertos.length > 0 && (
        <div className="caixa-aberto-card">
          {caixasAbertos.map((caixa) => {
            console.log("Dados do caixa aberto:", caixa);
            const valorInicial = Number(caixa.valor_inicial) || 0;
            const totalVendas = Number(caixa.total_vendas) || 0;
            const totalSuprimentos = Number(caixa.total_suprimentos) || 0;
            const totalSangrias = Number(caixa.total_sangrias) || 0;
            const totalCaixa =
              valorInicial + totalVendas + totalSuprimentos - totalSangrias;

            // DEBUG: Verificar cálculo do total do caixa
            console.log("🔍 DEBUG - Cálculo Total do Caixa:", {
              caixaId: caixa.id,
              valorInicial: {
                original: caixa.valor_inicial,
                convertido: valorInicial,
                tipo: typeof caixa.valor_inicial,
              },
              totalVendas: {
                original: caixa.total_vendas,
                convertido: totalVendas,
                tipo: typeof caixa.total_vendas,
              },
              totalSuprimentos: {
                original: caixa.total_suprimentos,
                convertido: totalSuprimentos,
                tipo: typeof caixa.total_suprimentos,
                existe: caixa.hasOwnProperty("total_suprimentos"),
              },
              totalSangrias: {
                original: caixa.total_sangrias,
                convertido: totalSangrias,
                tipo: typeof caixa.total_sangrias,
                existe: caixa.hasOwnProperty("total_sangrias"),
              },
              calculo: `${valorInicial} + ${totalVendas} + ${totalSuprimentos} - ${totalSangrias} = ${totalCaixa}`,
              totalCaixa,
              camposDisponiveis: Object.keys(caixa),
            });

            return (
              <div key={caixa.id}>
                <div className="caixa-aberto-header">
                  <div className="caixa-aberto-title">
                    <h2>
                      Caixa #{caixa.id} • {caixa.funcionario_nome}
                    </h2>
                  </div>
                </div>

                <div className="caixa-aberto-stats">
                  <div className="total-caixa">
                    <div
                      className="stat-label"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <Calculator size={18} style={{ color: "#10b981" }} />
                      Total do Caixa
                    </div>
                    <div className="stat-value">
                      {formatarValor(totalCaixa)}
                    </div>
                  </div>
                </div>

                <div className="caixa-aberto-actions">
                  <button
                    onClick={() => verResumo(caixa)}
                    className="btn btn-caixa-action info"
                  >
                    <FileText size={16} />
                    Resumo
                  </button>
                  <button
                    onClick={() => imprimirResumoCaixa(caixa.id)}
                    className="btn btn-caixa-action secondary"
                  >
                    <Printer size={16} />
                    Imprimir
                  </button>
                  <button
                    onClick={() => {
                      setCaixaSelecionado(caixa);
                      setShowTipoMovimentoModal(true);
                    }}
                    className="btn btn-caixa-action primary"
                  >
                    <ArrowRightLeft size={16} />
                    Movimentação
                  </button>
                  <button
                    onClick={() => {
                      setCaixaSelecionado(caixa);
                      iniciarFechamentoCaixa();
                    }}
                    className="btn btn-caixa-action danger"
                  >
                    <Lock size={16} />
                    Fechar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico de Caixas */}
      <div className="caixas-table-container">
        <div className="table-header">
          <h3>Histórico de Caixas ({caixasFechados.length})</h3>
        </div>

        <div className="caixas-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Total Vendas</th>
                <th>Abertura</th>
                <th>Fechamento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {caixasFechados.map((caixa) => (
                <tr key={caixa.id}>
                  <td>
                    <div className="user-info">
                      <User size={16} />
                      {caixa.funcionario_nome}
                    </div>
                  </td>
                  <td className="currency">
                    {formatarValor(caixa.total_vendas)}
                  </td>
                  <td style={{ fontSize: "13px", color: "#6b7280" }}>
                    {formatarData(caixa.data_abertura)}
                  </td>
                  <td style={{ fontSize: "13px", color: "#6b7280" }}>
                    {caixa.data_fechamento
                      ? formatarData(caixa.data_fechamento)
                      : "-"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => verResumo(caixa)}
                        className="btn-caixa-action info"
                        title="Ver resumo do caixa"
                      >
                        <FileText size={14} />
                        Resumo
                      </button>
                      <button
                        onClick={() => imprimirResumoCaixa(caixa.id)}
                        className="btn-caixa-action secondary"
                        title="Imprimir resumo do caixa"
                      >
                        <Printer size={14} />
                        Imprimir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Layout responsivo em cards para telas pequenas */}
        <div className="caixas-cards">
          {caixasFechados.map((caixa) => (
            <div key={`card-${caixa.id}`} className="caixa-card">
              <div className="caixa-card-header">
                <div className="caixa-card-info">
                  <h4>
                    <User size={16} />
                    {caixa.funcionario_nome}
                  </h4>
                  <p>Caixa #{caixa.id}</p>
                </div>
                <div className="caixa-card-status">
                  <span className="status-badge fechado">Fechado</span>
                </div>
              </div>

              <div className="caixa-card-details">
                <div className="caixa-detail-item">
                  <div className="caixa-detail-label">Total de Vendas</div>
                  <div className="caixa-detail-value currency">
                    {formatarValor(caixa.total_vendas)}
                  </div>
                </div>
                <div className="caixa-detail-item">
                  <div className="caixa-detail-label">Abertura</div>
                  <div className="caixa-detail-value">
                    {formatarData(caixa.data_abertura)}
                  </div>
                </div>
                <div className="caixa-detail-item">
                  <div className="caixa-detail-label">Fechamento</div>
                  <div className="caixa-detail-value">
                    {caixa.data_fechamento
                      ? formatarData(caixa.data_fechamento)
                      : "-"}
                  </div>
                </div>
              </div>

              <div className="caixa-card-actions">
                <button
                  onClick={() => verResumo(caixa)}
                  className="btn-caixa-action info"
                  title="Ver resumo do caixa"
                >
                  <FileText size={14} />
                  Resumo
                </button>
                <button
                  onClick={() => imprimirResumoCaixa(caixa.id)}
                  className="btn-caixa-action secondary"
                  title="Imprimir resumo do caixa"
                >
                  <Printer size={14} />
                  Imprimir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Novo Caixa */}
      {showNovoModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div
            className="modal-content-f medium"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-1">
              <div className="modal-header-content">
                <div className="modal-title-info-1">
                  <h2>Abrir Novo Caixa</h2>
                  <p>
                    {etapaAbertura === "login"
                      ? "Valide suas credenciais para continuar"
                      : etapaAbertura === "configuracao"
                      ? "Configure os parâmetros iniciais do caixa"
                      : "Confirme os dados antes de abrir o caixa"}
                  </p>
                </div>
                {/* Indicador de Etapa */}
                <div className="step-indicator">
                  <div
                    className={`step ${
                      etapaAbertura === "login" ? "active" : "completed"
                    }`}
                  >
                    <div className="step-number">1</div>
                    <span>Login</span>
                  </div>
                  <div className="step-line"></div>
                  <div
                    className={`step ${
                      etapaAbertura === "configuracao"
                        ? "active"
                        : etapaAbertura === "confirmacao"
                        ? "completed"
                        : ""
                    }`}
                  >
                    <div className="step-number">2</div>
                    <span>Configuração</span>
                  </div>
                  <div className="step-line"></div>
                  <div
                    className={`step ${
                      etapaAbertura === "confirmacao" ? "active" : ""
                    }`}
                  >
                    <div className="step-number">3</div>
                    <span>Confirmação</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={abrirCaixa}>
              {/* Etapa 1: Login */}
              {etapaAbertura === "login" && (
                <div className="tab-content">
                  <div className="form-section">
                    <div className="form-section-header">
                      <User size={18} />
                      <h4>Validação de Credenciais</h4>
                    </div>
                    <p className="form-section-description">
                      Digite seu CPF e senha para validar sua identidade antes
                      de abrir o caixa.
                    </p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>CPF do Funcionário *</label>
                      <input
                        type="text"
                        value={loginForm.cpf}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 11);
                          setLoginForm({ ...loginForm, cpf: value });
                          if (erroSenhaAbertura) setErroSenhaAbertura("");
                        }}
                        className={`form-control ${
                          erroSenhaAbertura ? "error" : ""
                        }`}
                        placeholder="00000000000"
                        maxLength={11}
                        required
                      />
                      <small className="form-hint">
                        Digite apenas números (11 dígitos)
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Senha *</label>
                      <input
                        type="password"
                        value={loginForm.senha}
                        onChange={(e) => {
                          setLoginForm({ ...loginForm, senha: e.target.value });
                          if (erroSenhaAbertura) setErroSenhaAbertura("");
                        }}
                        className={`form-control ${
                          erroSenhaAbertura ? "error" : ""
                        }`}
                        placeholder="Digite sua senha"
                        required
                      />
                    </div>
                  </div>

                  {erroSenhaAbertura && (
                    <div className="error-message-card">
                      <OctagonAlert size={20} />
                      <div>
                        <strong>Erro de validação</strong>
                        <p>{erroSenhaAbertura}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Etapa 2: Configuração */}
              {etapaAbertura === "configuracao" && (
                <div className="tab-content">
                  <div className="form-section">
                    <div className="form-section-header">
                      <Settings size={18} />
                      <h4>Configuração do Caixa</h4>
                    </div>
                    <p className="form-section-description">
                      Defina o valor inicial e observações para abertura do
                      caixa.
                    </p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Valor Inicial *</label>
                      <div className="input-with-icon">
                        <DollarSign size={16} />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={novoForm.valor_inicial}
                          onChange={(e) =>
                            setNovoForm({
                              ...novoForm,
                              valor_inicial: e.target.value,
                            })
                          }
                          className="form-control"
                          placeholder="0,00"
                          required
                        />
                      </div>
                      <small className="form-hint">
                        Valor em dinheiro que será depositado no caixa
                      </small>
                    </div>

                    <div className="form-group form-group-full">
                      <label>Observações</label>
                      <textarea
                        value={novoForm.observacoes}
                        onChange={(e) =>
                          setNovoForm({
                            ...novoForm,
                            observacoes: e.target.value,
                          })
                        }
                        className="form-control"
                        placeholder="Observações sobre a abertura do caixa (opcional)"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Etapa 3: Confirmação */}
              {etapaAbertura === "confirmacao" && (
                <div className="tab-content">
                  <div className="form-section">
                    <div className="form-section-header">
                      <CheckCircle size={18} />
                      <h4>Confirmação de Abertura</h4>
                    </div>
                    <p className="form-section-description">
                      Revise atentamente todas as informações abaixo. Após
                      confirmar, o caixa será aberto e registrado no sistema.
                    </p>
                  </div>

                  <div className="confirmation-summary">
                    <div className="confirmation-alert">
                      <AlertCircle size={20} />
                      <div>
                        <strong>Atenção:</strong> Certifique-se de que todas as
                        informações estão corretas antes de prosseguir.
                      </div>
                    </div>
                    <div className="summary-card summary-card-primary summary-card-horizontal">
                      <div className="summary-header">
                        <User size={20} />
                        <h5>Funcionário Responsável</h5>
                      </div>
                      <div className="summary-content">
                        <div className="summary-item">
                          <span className="summary-label">Nome:</span>
                          <span className="summary-value">
                            {funcionarioAbertura?.nome}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Cargo:</span>
                          <span className="summary-value">
                            {funcionarioAbertura?.cargo}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">CPF:</span>
                          <span className="summary-value">
                            {loginForm.cpf.replace(
                              /(\d{3})(\d{3})(\d{3})(\d{2})/,
                              "$1.$2.$3-$4"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="summary-card summary-card-horizontal">
                      <div className="summary-header">
                        <Clock size={20} />
                        <h5>Data e Hora da Abertura</h5>
                      </div>
                      <div className="summary-content">
                        <div className="summary-item">
                          <span className="summary-label">Data:</span>
                          <span className="summary-value">
                            {new Date().toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Hora:</span>
                          <span className="summary-value">
                            {new Date().toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="summary-card">
                      <div className="summary-header">
                        <Wallet size={20} />
                        <h5>Configuração do Caixa</h5>
                      </div>
                      <div className="summary-content">
                        <div className="summary-item">
                          <span className="summary-label">Valor Inicial:</span>
                          <span className="summary-value currency">
                            {formatarValor(
                              parseFloat(novoForm.valor_inicial) || 0
                            )}
                          </span>
                        </div>
                        {novoForm.observacoes && (
                          <div className="summary-item">
                            <span className="summary-label">Observações:</span>
                            <span className="summary-value">
                              {novoForm.observacoes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer do Modal */}
              <div className="modal-footer-1">
                <div className="footer-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-lg"
                    onClick={() => cancelarAberturaCaixa()}
                    disabled={loadingAbrirCaixa}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loadingAbrirCaixa}
                  >
                    {loadingAbrirCaixa ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        {etapaAbertura === "login"
                          ? "Validando..."
                          : "Abrindo Caixa..."}
                      </>
                    ) : (
                      <>
                        {etapaAbertura === "login" ? (
                          <>
                            <Shield size={18} />
                            Validar Login
                          </>
                        ) : etapaAbertura === "configuracao" ? (
                          <>
                            <Settings size={18} />
                            Continuar
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Confirmar Abertura
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modais de Fechamento em Etapas */}

      {/* Modal 1: Validação de Senha para Fechamento */}
      {showValidacaoSenhaFechamento && caixaSelecionado && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "450px", width: "90%" }}
          >
            <div className="modal-header-caixa">
              <h3>Fechar Caixa - Validação</h3>
              <button onClick={cancelarFechamentoCaixa} className="modal-close">
                ×
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div
                className="info-section"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 12px 0", color: "#dc2626" }}>
                  Informações do Caixa
                </h4>
                <p style={{ margin: "4px 0" }}>
                  <strong>Funcionário:</strong>{" "}
                  {caixaSelecionado.funcionario_nome}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <strong>Valor Inicial:</strong>{" "}
                  {formatarValor(caixaSelecionado.valor_inicial)}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <strong>Aberto em:</strong>{" "}
                  {formatarData(caixaSelecionado.data_abertura)}
                </p>
              </div>

              <p style={{ marginBottom: "20px", color: "#374151" }}>
                Digite sua senha para iniciar o processo de fechamento:
              </p>

              <div className="form-group">
                <label htmlFor="senha-fechamento">Senha do Operador *</label>
                <input
                  id="senha-fechamento"
                  type="password"
                  placeholder="Digite sua senha"
                  value={fecharForm.senha}
                  onChange={(e) => {
                    setFecharForm({ ...fecharForm, senha: e.target.value });
                    if (erroSenhaFechamento) setErroSenhaFechamento(""); // Limpar erro ao digitar
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: erroSenhaFechamento
                      ? "1px solid #ef4444"
                      : "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  onKeyPress={(e) =>
                    e.key === "Enter" && validarSenhaFechamento()
                  }
                />
                {erroSenhaFechamento && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "12px",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <AlertCircle
                      size={16}
                      style={{ color: "#ef4444", marginRight: "8px" }}
                    />
                    <span style={{ color: "#dc2626", fontSize: "13px" }}>
                      {erroSenhaFechamento}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer-caixa">
              <button
                onClick={validarSenhaFechamento}
                className="btn btn-primary"
                disabled={!fecharForm.senha || processandoFechamento}
                style={{
                  opacity: !fecharForm.senha || processandoFechamento ? 0.5 : 1,
                }}
              >
                {processandoFechamento ? (
                  <>
                    <Loader2
                      size={16}
                      style={{
                        marginRight: "6px",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Validando...
                  </>
                ) : (
                  "Validar e Continuar"
                )}
              </button>
              <button
                onClick={cancelarFechamentoCaixa}
                className="btn btn-outline"
                disabled={processandoFechamento}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Contagem de Dinheiro */}
      {showContagemDinheiro && caixaSelecionado && funcionarioFechamento && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "500px", width: "90%" }}
          >
            <div className="modal-header-caixa">
              <h3>Fechar Caixa - Contagem</h3>
              <button onClick={cancelarFechamentoCaixa} className="modal-close">
                ×
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div
                style={{
                  backgroundColor: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <Calculator
                    size={20}
                    style={{ marginRight: "8px", color: "#0369a1" }}
                  />
                  <strong style={{ color: "#0369a1" }}>
                    Contagem do Dinheiro em Caixa
                  </strong>
                </div>
                <p style={{ margin: "0", fontSize: "14px", color: "#374151" }}>
                  Conte fisicamente todo o dinheiro presente no caixa e informe
                  o valor total encontrado.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="valor-contado">
                  Valor Total Contado em Dinheiro *
                </label>
                <input
                  id="valor-contado"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={fecharForm.valor_contado_dinheiro}
                  onChange={(e) =>
                    setFecharForm({
                      ...fecharForm,
                      valor_contado_dinheiro: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                />
                <small style={{ color: "#6b7280", fontSize: "13px" }}>
                  Informe o valor exato encontrado na contagem física
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="observacoes-contagem">
                  Observações do Fechamento
                </label>
                <textarea
                  id="observacoes-contagem"
                  placeholder="Observações sobre o fechamento (opcional)"
                  value={fecharForm.observacoes}
                  onChange={(e) =>
                    setFecharForm({
                      ...fecharForm,
                      observacoes: e.target.value,
                    })
                  }
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            <div className="modal-footer-caixa">
              <button
                onClick={processarContagem}
                className="btn btn-primary"
                disabled={
                  !fecharForm.valor_contado_dinheiro ||
                  parseFloat(fecharForm.valor_contado_dinheiro) < 0 ||
                  processandoFechamento
                }
                style={{
                  opacity:
                    !fecharForm.valor_contado_dinheiro ||
                    parseFloat(fecharForm.valor_contado_dinheiro) < 0 ||
                    processandoFechamento
                      ? 0.5
                      : 1,
                }}
              >
                {processandoFechamento ? (
                  <>
                    <Loader2
                      size={16}
                      style={{
                        marginRight: "6px",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Processando...
                  </>
                ) : (
                  <>
                    <Calculator size={16} style={{ marginRight: "6px" }} />
                    Processar Contagem
                  </>
                )}
              </button>
              <button
                onClick={cancelarFechamentoCaixa}
                className="btn btn-outline"
                disabled={processandoFechamento}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Resumo do Fechamento */}
      {showResumoFechamento && resumoFechamento && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "700px", width: "95%" }}
          >
            <div className="modal-header-caixa">
              <div
                style={{ display: "flex", alignItems: "center", gap: "15px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "50px",
                    height: "50px",
                    backgroundColor:
                      resumoFechamento.status_reconciliacao === "perfeito"
                        ? "#1f6fd1ff"
                        : resumoFechamento.status_reconciliacao === "sobra"
                        ? "#15af4eff"
                        : "#f25757ff",
                    borderRadius: "25%",
                    color: "white",
                  }}
                >
                  <Lock size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      margin: "0",
                      fontSize: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    Fechar Caixa #{resumoFechamento.id}
                  </h3>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    Confirme os dados antes de finalizar
                  </p>
                </div>
                <div
                  style={{
                    textAlign: "right",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  <div style={{ fontWeight: "500", color: "#374151" }}>
                    {resumoFechamento.funcionario_nome}
                  </div>
                  <div>{formatarData(resumoFechamento.data_fechamento)}</div>
                </div>
              </div>
              <button onClick={cancelarFechamentoCaixa} className="modal-close">
                ×
              </button>
            </div>

            <div style={{ padding: "1rem 1rem 0 1rem" }}>
              {/* Card de Status da Reconciliação */}
              <div
                style={{
                  background:
                    resumoFechamento.status_reconciliacao === "perfeito"
                      ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                      : resumoFechamento.status_reconciliacao === "sobra"
                      ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                      : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  borderRadius: "15px",
                  padding: "25px",
                  color: "white",
                  marginBottom: "25px",
                  position: "relative",
                  overflow: "hidden",
                  border: "none",
                }}
              >
                <div style={{ position: "relative", zIndex: 2 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "20px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          margin: "0 0 5px 0",
                          fontSize: "16px",
                          fontWeight: "600",
                          opacity:
                            resumoFechamento.status_reconciliacao === "perfeito"
                              ? "0.7"
                              : "0.9",
                        }}
                      >
                        Status do Fechamento
                      </h4>
                      <div
                        style={{
                          fontSize: "28px",
                          fontWeight: "bold",
                          margin: "0 0 15px 0",
                        }}
                      >
                        {resumoFechamento.status_reconciliacao === "perfeito"
                          ? "PERFEITO"
                          : resumoFechamento.status_reconciliacao === "sobra"
                          ? "SOBRA"
                          : "FALTA"}
                      </div>
                      {resumoFechamento.status_reconciliacao !== "perfeito" && (
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            marginBottom: "15px",
                            opacity:
                              resumoFechamento.status_reconciliacao ===
                              "perfeito"
                                ? "0.7"
                                : "0.9",
                          }}
                        >
                          {formatarValor(
                            Math.abs(resumoFechamento.valores.diferenca)
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {resumoFechamento.status_reconciliacao === "perfeito" && (
                        <CheckCircle
                          size={40}
                          style={{ opacity: 0.8, color: "#60a5fa" }}
                        />
                      )}
                      {resumoFechamento.status_reconciliacao === "sobra" && (
                        <TrendingUp
                          size={40}
                          style={{ opacity: 0.8, color: "#4ade80" }}
                        />
                      )}
                      {resumoFechamento.status_reconciliacao === "falta" && (
                        <AlertCircle
                          size={40}
                          style={{ opacity: 0.8, color: "#fca5a5" }}
                        />
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px",
                      fontSize: "14px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          opacity:
                            resumoFechamento.status_reconciliacao === "perfeito"
                              ? "0.6"
                              : "0.8",
                          marginBottom: "2px",
                        }}
                      >
                        Esperado (Dinheiro)
                      </div>
                      <div style={{ fontWeight: "600" }}>
                        {formatarValor(resumoFechamento.valores.esperado)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          opacity:
                            resumoFechamento.status_reconciliacao === "perfeito"
                              ? "0.6"
                              : "0.8",
                          marginBottom: "2px",
                        }}
                      >
                        Contado
                      </div>
                      <div style={{ fontWeight: "600" }}>
                        {formatarValor(resumoFechamento.valores.contado)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "15px",
                    paddingBottom: "10px",
                    borderBottom: "2px solid #e2e8f0",
                  }}
                >
                  <Calculator size={20} style={{ color: "#10b981" }} />
                  <h4
                    style={{
                      margin: "0",
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#374151",
                    }}
                  >
                    Resumo Financeiro
                  </h4>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "15px",
                  }}
                >
                  <div className="cartao-resumo">
                    <div className="cartao-resumo-label">Valor Inicial</div>
                    <div className="cartao-resumo-valor">
                      {formatarValor(resumoFechamento.valores.inicial)}
                    </div>
                  </div>
                  <div className="cartao-resumo">
                    <div className="cartao-resumo-label">Total Vendas</div>
                    <div className="cartao-resumo-valor positive">
                      {formatarValor(resumoFechamento.valores.vendas)}
                    </div>
                  </div>
                  {resumoFechamento.valores.suprimentos > 0 && (
                    <div className="cartao-resumo">
                      <div className="cartao-resumo-label">Suprimentos</div>
                      <div className="cartao-resumo-valor positive">
                        +{formatarValor(resumoFechamento.valores.suprimentos)}
                      </div>
                    </div>
                  )}
                  {resumoFechamento.valores.sangrias > 0 && (
                    <div className="cartao-resumo">
                      <div className="cartao-resumo-label">Sangrias</div>
                      <div className="cartao-resumo-valor negative">
                        -{formatarValor(resumoFechamento.valores.sangrias)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer-caixa">
              <button
                onClick={voltarEtapaFechamento}
                disabled={processandoFechamento}
                className="btn btn-outline"
                style={{ marginRight: "auto" }}
              >
                <ArrowLeft size={16} style={{ marginRight: "6px" }} />
                Voltar
              </button>
              <button
                onClick={confirmarFechamentoCaixa}
                disabled={processandoFechamento}
                className="btn"
                style={{
                  backgroundColor: processandoFechamento
                    ? "#9ca3af"
                    : resumoFechamento.status_reconciliacao === "perfeito"
                    ? "#1d4ed8"
                    : resumoFechamento.status_reconciliacao === "sobra"
                    ? "#16a34a"
                    : "#dc2626",
                  color: "white",
                  border: `1px solid ${
                    processandoFechamento
                      ? "#9ca3af"
                      : resumoFechamento.status_reconciliacao === "perfeito"
                      ? "#1d4ed8"
                      : resumoFechamento.status_reconciliacao === "sobra"
                      ? "#16a34a"
                      : "#dc2626"
                  }`,
                  opacity: processandoFechamento ? 0.5 : 1,
                }}
              >
                {processandoFechamento ? (
                  <>
                    <Loader2
                      size={16}
                      style={{
                        marginRight: "6px",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Processando...
                  </>
                ) : (
                  <>Confirmar Fechamento</>
                )}
              </button>
              <button
                onClick={cancelarFechamentoCaixa}
                disabled={processandoFechamento}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Loading Resumo */}
      <LoadingModal
        isOpen={loadingResumo}
        title="Carregando Resumo"
        message="Buscando informações do caixa..."
        size="medium"
      />

      {/* Modal de Confirmação de Consumo do Valor Inicial */}
      {showConfirmacaoConsumoInicial && (
        <div
          className="modal-overlay modal-fade-in"
          onClick={() => setShowConfirmacaoConsumoInicial(false)}
        >
          <div
            className="modal-content-f small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-1">
              <div className="modal-header-content">
                <div className="modal-title-info-1">
                  <h2
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <AlertCircle size={20} color="#f59e0b" />
                    Atenção
                  </h2>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowConfirmacaoConsumoInicial(false)}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-1">
              <div className="confirmation-content">
                <AlertCircle size={48} className="confirmation-icon warning" />
                <h3>A operação atual consumirá do valor inicial do caixa</h3>
                <p>
                  O saldo após esta operação ficará abaixo do valor inicial
                  (fundo de caixa). Isso significa que parte do dinheiro usado
                  será do valor inicial configurado para o caixa.
                </p>
                <div className="confirmation-details">
                  <div className="detail-item">
                    <span className="detail-label">Valor do pagamento:</span>
                    <span className="detail-value">
                      R$ {parseFloat(pagamentoForm.valor).toFixed(2)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Saldo atual:</span>
                    <span className="detail-value">
                      R$ {saldoDinheiroDisponivel.toFixed(2)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Valor inicial:</span>
                    <span className="detail-value">
                      R$ {valorInicialCaixa.toFixed(2)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Saldo após operação:</span>
                    <span className="detail-value warning">
                      R${" "}
                      {(
                        saldoDinheiroDisponivel -
                        parseFloat(pagamentoForm.valor)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="confirmation-question">
                  Deseja continuar mesmo assim?
                </p>
              </div>
            </div>

            <div className="modal-footer-1">
              <div className="footer-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowConfirmacaoConsumoInicial(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    setShowConfirmacaoConsumoInicial(false);
                    if (pagamentoForm.afeta_caixa) {
                      setPagamentoEtapa("senha");
                    } else {
                      confirmarPagamento();
                    }
                  }}
                >
                  <AlertCircle size={16} />
                  Confirmar e Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resumo */}
      {showResumoModal && resumoFechamento && (
        <div className="modal-overlay">
          <div className="modal-content modal-resumo-content">
            <div className="modal-header-caixa">
              <div className="modal-header-caixa-info">
                <div
                  className={`modal-resumo-header-icon ${
                    resumoFechamento.status === "aberto" ? "aberto" : "fechado"
                  }`}
                >
                  <Calculator size={24} />
                </div>
                <div>
                  <h3 className="modal-resumo-header-title">
                    Caixa #{resumoFechamento.id}
                  </h3>
                  <p className="modal-resumo-header-subtitle">
                    {resumoFechamento.operador_abertura} •{" "}
                    {new Date(
                      resumoFechamento.data_abertura
                    ).toLocaleDateString("pt-BR")}
                    {resumoFechamento.data_fechamento && (
                      <>
                        {" "}
                        -{" "}
                        {new Date(
                          resumoFechamento.data_fechamento
                        ).toLocaleDateString("pt-BR")}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowResumoModal(false);
                  setResumoFechamento(null);
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-resumo-body">
              {/* Cards de Status e Total */}
              <div
                className={`modal-resumo-cards-grid ${
                  resumoFechamento.status === "fechado" ? "fechado" : "aberto"
                }`}
              >
                {/* Card Total do Caixa */}
                <div className="modal-resumo-total-card">
                  <div className="modal-resumo-total-content">
                    <div className="modal-resumo-total-header">
                      <div>
                        <h4 className="modal-resumo-total-title">
                          Total do Caixa
                        </h4>
                        <div className="modal-resumo-total-value">
                          {formatarValor(
                            resumoFechamento.valores.inicial +
                              resumoFechamento.valores.vendas +
                              resumoFechamento.valores.suprimentos -
                              resumoFechamento.valores.sangrias -
                              (resumoFechamento.valores.pagamentos_fornecedor ||
                                0)
                          )}
                        </div>
                      </div>
                      <Wallet size={40} style={{ opacity: 0.8 }} />
                    </div>
                    <div className="modal-resumo-total-breakdown">
                      {/* Primeira linha: Inicial e Vendas lado a lado */}
                      <div className="modal-resumo-principal-row">
                        <div className="modal-resumo-principal-item">
                          <div className="modal-resumo-total-item-label">
                            Inicial
                          </div>
                          <div className="modal-resumo-total-item-value">
                            {formatarValor(resumoFechamento.valores.inicial)}
                          </div>
                        </div>
                        <div className="modal-resumo-principal-item">
                          <div className="modal-resumo-total-item-label">
                            Vendas
                          </div>
                          <div className="modal-resumo-total-item-value">
                            +{formatarValor(resumoFechamento.valores.vendas)}
                          </div>
                        </div>
                      </div>

                      {/* Segunda linha: Suprimentos, Sangrias e Fornecedores lado a lado */}
                      <div className="modal-resumo-movimentacoes-row">
                        <div className="modal-resumo-movimentacao-item">
                          <div className="modal-resumo-total-item-label">
                            Suprimentos
                          </div>
                          <div className="modal-resumo-total-item-value">
                            +
                            {formatarValor(
                              resumoFechamento.valores.suprimentos
                            )}
                          </div>
                        </div>
                        <div className="modal-resumo-movimentacao-item">
                          <div className="modal-resumo-total-item-label">
                            Sangrias
                          </div>
                          <div className="modal-resumo-total-item-value">
                            -{formatarValor(resumoFechamento.valores.sangrias)}
                          </div>
                        </div>
                        <div className="modal-resumo-movimentacao-item">
                          <div className="modal-resumo-total-item-label">
                            Fornecedores
                          </div>
                          <div className="modal-resumo-total-item-value">
                            -
                            {formatarValor(
                              resumoFechamento.valores.pagamentos_fornecedor ||
                                0
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-resumo-total-decoration" />
                </div>

                {/* Card Reconciliação (só para caixas fechados) */}
                {resumoFechamento.status === "fechado" && (
                  <div
                    className={`modal-resumo-reconciliacao-card ${
                      resumoFechamento.valores.diferenca === 0
                        ? "perfeito"
                        : resumoFechamento.valores.diferenca > 0
                        ? "sobra"
                        : "falta"
                    }`}
                  >
                    <div
                      className={`modal-resumo-reconciliacao-icon ${
                        resumoFechamento.valores.diferenca === 0
                          ? "perfeito"
                          : resumoFechamento.valores.diferenca > 0
                          ? "sobra"
                          : "falta"
                      }`}
                    >
                      {resumoFechamento.valores.diferenca === 0 && (
                        <CheckCircle size={32} style={{ margin: "0 auto" }} />
                      )}
                      {resumoFechamento.valores.diferenca > 0 && (
                        <TrendingUp size={32} style={{ margin: "0 auto" }} />
                      )}
                      {resumoFechamento.valores.diferenca < 0 && (
                        <AlertCircle size={32} style={{ margin: "0 auto" }} />
                      )}
                    </div>
                    <h4
                      className={`modal-resumo-reconciliacao-title ${
                        resumoFechamento.valores.diferenca === 0
                          ? "perfeito"
                          : resumoFechamento.valores.diferenca > 0
                          ? "sobra"
                          : "falta"
                      }`}
                    >
                      {resumoFechamento.valores.diferenca === 0
                        ? "PERFEITO"
                        : resumoFechamento.valores.diferenca > 0
                        ? "SOBRA"
                        : "FALTA"}
                    </h4>
                    <div
                      className={`modal-resumo-reconciliacao-value ${
                        resumoFechamento.valores.diferenca === 0
                          ? "perfeito"
                          : resumoFechamento.valores.diferenca > 0
                          ? "sobra"
                          : "falta"
                      }`}
                    >
                      {formatarValor(
                        Math.abs(resumoFechamento.valores.diferenca)
                      )}
                    </div>
                    <div className="modal-resumo-reconciliacao-details">
                      Esperado:{" "}
                      {formatarValor(resumoFechamento.valores.esperado)}
                      <br />
                      Contado: {formatarValor(resumoFechamento.valores.contado)}
                    </div>
                  </div>
                )}
              </div>

              {/* Formas de Pagamento - Expansível */}
              <Collapsible
                open={formasPagamentoExpanded}
                onOpenChange={setFormasPagamentoExpanded}
              >
                <div className="modal-resumo-pagamentos-container">
                  <CollapsibleTrigger asChild>
                    <div className="modal-resumo-pagamentos-header collapsible">
                      <h4 className="modal-resumo-pagamentos-title">
                        Formas de Pagamento
                      </h4>
                      <ChevronRight
                        size={20}
                        className="collapsible-icon"
                        data-state={formasPagamentoExpanded ? "open" : "closed"}
                      />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="modal-resumo-pagamentos-grid">
                      {/* Dinheiro */}
                      {(resumoFechamento.vendas?.valor_dinheiro || 0) > 0 && (
                        <div className="modal-resumo-pagamento-card">
                          <div className="modal-resumo-pagamento-info">
                            <div className="modal-resumo-pagamento-icon dinheiro">
                              <Banknote
                                size={18}
                                style={{ color: "#059669" }}
                              />
                            </div>
                            <span className="modal-resumo-pagamento-name">
                              Dinheiro
                            </span>
                          </div>
                          <strong className="modal-resumo-pagamento-value">
                            {formatarValor(
                              resumoFechamento.vendas?.valor_dinheiro || 0
                            )}
                          </strong>
                        </div>
                      )}

                      {/* Cartão Débito */}
                      {(resumoFechamento.vendas?.valor_cartao_debito || 0) >
                        0 && (
                        <div className="modal-resumo-pagamento-card">
                          <div className="modal-resumo-pagamento-info">
                            <div className="modal-resumo-pagamento-icon debito">
                              <CreditCard
                                size={18}
                                style={{ color: "#2563eb" }}
                              />
                            </div>
                            <span className="modal-resumo-pagamento-name">
                              Débito
                            </span>
                          </div>
                          <strong className="modal-resumo-pagamento-value debito">
                            {formatarValor(
                              resumoFechamento.vendas?.valor_cartao_debito || 0
                            )}
                          </strong>
                        </div>
                      )}

                      {/* Cartão Crédito */}
                      {(resumoFechamento.vendas?.valor_cartao_credito || 0) >
                        0 && (
                        <div className="modal-resumo-pagamento-card">
                          <div className="modal-resumo-pagamento-info">
                            <div className="modal-resumo-pagamento-icon credito">
                              <CreditCard
                                size={18}
                                style={{ color: "#dc2626" }}
                              />
                            </div>
                            <span className="modal-resumo-pagamento-name">
                              Crédito
                            </span>
                          </div>
                          <strong className="modal-resumo-pagamento-value credito">
                            {formatarValor(
                              resumoFechamento.vendas?.valor_cartao_credito || 0
                            )}
                          </strong>
                        </div>
                      )}

                      {/* PIX */}
                      {(resumoFechamento.vendas?.valor_pix || 0) > 0 && (
                        <div className="modal-resumo-pagamento-card">
                          <div className="modal-resumo-pagamento-info">
                            <div className="modal-resumo-pagamento-icon pix">
                              <Smartphone
                                size={18}
                                style={{ color: "#7c3aed" }}
                              />
                            </div>
                            <span className="modal-resumo-pagamento-name">
                              PIX
                            </span>
                          </div>
                          <strong className="modal-resumo-pagamento-value pix">
                            {formatarValor(
                              resumoFechamento.vendas?.valor_pix || 0
                            )}
                          </strong>
                        </div>
                      )}

                      {/* Fiado */}
                      {(resumoFechamento.vendas?.valor_fiado || 0) > 0 && (
                        <div className="modal-resumo-pagamento-card">
                          <div className="modal-resumo-pagamento-info">
                            <div className="modal-resumo-pagamento-icon fiado">
                              <Handshake
                                size={18}
                                style={{ color: "#ea580c" }}
                              />
                            </div>
                            <span className="modal-resumo-pagamento-name">
                              Fiado
                            </span>
                          </div>
                          <strong className="modal-resumo-pagamento-value fiado">
                            {formatarValor(
                              resumoFechamento.vendas?.valor_fiado || 0
                            )}
                          </strong>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>

            <div className="modal-footer-caixa">
              <button
                onClick={() => imprimirResumoCaixa(resumoFechamento.id)}
                className="btn btn-primary"
              >
                Imprimir
              </button>
              <button
                onClick={() => {
                  setShowResumoModal(false);
                  setResumoFechamento(null);
                }}
                className="btn btn-outline"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sangria */}
      {showSangriaModal && caixaSelecionado && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "500px", width: "90%" }}
          >
            <div className="modal-header">
              <h3>Realizar Sangria - Caixa #{caixaSelecionado.id}</h3>
              <button
                onClick={() => {
                  setShowSangriaModal(false);
                  setSangriaForm({ valor: "", descricao: "" });
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div className="alerta-sangria">
                <div className="alerta-sangria-header">
                  <AlertCircle size={20} style={{ marginRight: "8px" }} />
                  <strong>Atenção - Sangria do Caixa</strong>
                </div>
                <p>
                  Esta operação irá retirar dinheiro do caixa. O valor será
                  subtraído do total disponível.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="sangria-valor">Valor da Sangria *</label>
                <input
                  id="sangria-valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={sangriaForm.valor}
                  onChange={(e) =>
                    setSangriaForm({ ...sangriaForm, valor: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="sangria-descricao">Descrição/Motivo</label>
                <textarea
                  id="sangria-descricao"
                  placeholder="Motivo da sangria (opcional)"
                  value={sangriaForm.descricao}
                  onChange={(e) =>
                    setSangriaForm({
                      ...sangriaForm,
                      descricao: e.target.value,
                    })
                  }
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            <div className="modal-footer-caixa">
              <button
                onClick={realizarSangria}
                disabled={
                  processandoSangria ||
                  !sangriaForm.valor ||
                  parseFloat(sangriaForm.valor) <= 0
                }
                className="btn"
                style={{
                  backgroundColor: processandoSangria ? "#9ca3af" : "#ef4444",
                  color: "white",
                  border: `1px solid ${
                    processandoSangria ? "#9ca3af" : "#ef4444"
                  }`,
                  opacity:
                    processandoSangria ||
                    !sangriaForm.valor ||
                    parseFloat(sangriaForm.valor) <= 0
                      ? 0.5
                      : 1,
                }}
              >
                {processandoSangria ? (
                  <>
                    <Loader2
                      size={16}
                      style={{
                        marginRight: "6px",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Processando...
                  </>
                ) : (
                  <>
                    <ArrowDown size={16} style={{ marginRight: "6px" }} />
                    Confirmar Sangria
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowSangriaModal(false);
                  setSangriaForm({ valor: "", descricao: "" });
                }}
                disabled={processandoSangria}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Validação Senha para Movimentação */}
      {showValidacaoSenhaModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "400px", width: "90%" }}
          >
            <div className="modal-header">
              <h3>Validação de Senha</h3>
              <button onClick={cancelarMovimentacao} className="modal-close">
                ×
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <p style={{ marginBottom: "20px", color: "#374151" }}>
                Digite sua senha para acessar as movimentações financeiras:
              </p>

              <div className="form-group">
                <label htmlFor="validacao-senha">Senha *</label>
                <input
                  id="validacao-senha"
                  type="password"
                  placeholder="Digite sua senha"
                  value={validacaoSenhaForm.senha}
                  onChange={(e) => {
                    setValidacaoSenhaForm({ senha: e.target.value });
                    if (erroSenhaMovimentacao) setErroSenhaMovimentacao(""); // Limpar erro ao digitar
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: erroSenhaMovimentacao
                      ? "1px solid #ef4444"
                      : "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  onKeyPress={(e) =>
                    e.key === "Enter" && validarSenhaMovimentacao()
                  }
                />
                {erroSenhaMovimentacao && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "12px",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <AlertCircle
                      size={16}
                      style={{ color: "#ef4444", marginRight: "8px" }}
                    />
                    <span style={{ color: "#dc2626", fontSize: "13px" }}>
                      {erroSenhaMovimentacao}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer-caixa">
              <button
                onClick={validarSenhaMovimentacao}
                className="btn btn-primary"
                disabled={!validacaoSenhaForm.senha}
              >
                Validar
              </button>
              <button
                onClick={cancelarMovimentacao}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tipo de Movimento */}
      {showTipoMovimentoModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "500px", width: "90%" }}
          >
            <div className="modal-header-caixa">
              <h3>Selecione</h3>
              <button onClick={cancelarMovimentacao} className="modal-close">
                ×
              </button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <div className="tipo-movimento-grid">
                {/* Card Suprimento */}
                <button
                  onClick={() => selecionarTipoMovimento("suprimento")}
                  className="tipo-movimento-card suprimento"
                >
                  <ArrowUp size={32} color="#10b981" />
                  <div className="tipo-movimento-content">
                    <h4 className="tipo-movimento-title suprimento">
                      Suprimento
                    </h4>
                    <p className="tipo-movimento-description">
                      Adicionar dinheiro ao caixa
                    </p>
                  </div>
                </button>

                {/* Card Pagamento */}
                <button
                  onClick={() => selecionarTipoMovimento("pagamento")}
                  className="tipo-movimento-card pagamento"
                >
                  <Handshake size={32} color="#3b82f6" />
                  <div className="tipo-movimento-content">
                    <h4 className="tipo-movimento-title pagamento">
                      Pagamento
                    </h4>
                    <p className="tipo-movimento-description">
                      Pagar fornecedor
                    </p>
                  </div>
                </button>

                {/* Card Sangria */}
                <button
                  onClick={() => selecionarTipoMovimento("sangria")}
                  className="tipo-movimento-card sangria"
                >
                  <ArrowDown size={32} color="#ef4444" />
                  <div className="tipo-movimento-content">
                    <h4 className="tipo-movimento-title sangria">Sangria</h4>
                    <p className="tipo-movimento-description">
                      Retirar dinheiro do caixa
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="modal-footer-caixa">
              <button
                onClick={cancelarMovimentacao}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagamento a Fornecedor */}
      {showPagamentoModal && (
        <div
          className="modal-overlay modal-fade-in"
          onClick={() => cancelarPagamento()}
        >
          <div
            className="modal-content-f large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-1">
              <div className="modal-header-content">
                <div className="modal-title-info-1">
                  <h2>
                    {pagamentoEtapa === "fornecedor" && "Selecionar Fornecedor"}
                    {pagamentoEtapa === "dados" && "Registrar Pagamento"}
                    {pagamentoEtapa === "senha" && "Confirmar Pagamento"}
                  </h2>
                  <p>
                    {pagamentoEtapa === "fornecedor" &&
                      "Escolha o fornecedor para o pagamento"}
                    {pagamentoEtapa === "dados" &&
                      fornecedorSelecionado &&
                      `Pagamento para: ${fornecedorSelecionado.nome}`}
                    {pagamentoEtapa === "senha" &&
                      "Confirme com sua senha master"}
                  </p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => cancelarPagamento()}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-1">
              {/* Etapa 1: Seleção de Fornecedor */}
              {pagamentoEtapa === "fornecedor" && (
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <button
                      onClick={() => setShowCadastroFornecedor(true)}
                      className="btn btn-primary"
                      style={{ marginBottom: "15px" }}
                    >
                      <Plus size={16} style={{ marginRight: "8px" }} />
                      Novo Fornecedor
                    </button>
                  </div>

                  <div style={{ maxHeight: "300px", overflow: "auto" }}>
                    {loadingFornecedores ? (
                      <div className="loading-fornecedores">
                        <Loader2 size={24} className="animate-spin" />
                        Carregando lista de fornecedores, aguarde.
                      </div>
                    ) : fornecedores.length === 0 ? (
                      <p
                        style={{
                          textAlign: "center",
                          color: "#6b7280",
                          padding: "40px",
                        }}
                      >
                        Nenhum fornecedor cadastrado
                      </p>
                    ) : (
                      fornecedores.map((fornecedor: any) => (
                        <button
                          key={fornecedor.id}
                          onClick={() => selecionarFornecedor(fornecedor)}
                          className="fornecedor-button"
                        >
                          <div className="fornecedor-nome">
                            {fornecedor.nome}
                          </div>
                          <div className="fornecedor-info">
                            CNPJ: {fornecedor.cnpj} | Tel: {fornecedor.telefone}
                          </div>
                          {fornecedor.total_debito > 0 && (
                            <div className="fornecedor-debito">
                              Débito: R${" "}
                              {formatarValor(fornecedor.total_debito)}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Etapa 2: Dados do Pagamento */}
              {pagamentoEtapa === "dados" && fornecedorSelecionado && (
                <div className="form-grid">
                  <div className="form-group-1 form-group-valor-total">
                    <label className="form-label form-label-valor-total">
                      <DollarSign size={18} color="#1e40af" />
                      Valor Total *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input form-input-valor-total"
                      value={pagamentoForm.valor}
                      onChange={(e) => {
                        const novoValor = e.target.value;
                        setPagamentoForm({
                          ...pagamentoForm,
                          valor: novoValor,
                        });
                        // Validar em tempo real
                        validarValorPagamentoCaixa(
                          novoValor,
                          pagamentoForm.afeta_caixa
                        );
                      }}
                      placeholder="0,00"
                    />
                    {/* Mensagem de erro instantânea */}
                    {erroSaldoInsuficientePagamento && (
                      <div className="erro-saldo-insuficiente">
                        <AlertCircle size={16} />
                        {erroSaldoInsuficientePagamento}
                      </div>
                    )}
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={pagamentoForm.afeta_caixa}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPagamentoForm({
                            ...pagamentoForm,
                            afeta_caixa: checked,
                            forma_pagamento: checked
                              ? "dinheiro"
                              : pagamentoForm.forma_pagamento,
                          });
                          // Validar quando marcar/desmarcar o checkbox
                          validarValorPagamentoCaixa(
                            pagamentoForm.valor,
                            checked
                          );
                        }}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">
                        Usar dinheiro do caixa (sangria)
                      </span>
                    </label>
                    {pagamentoForm.afeta_caixa && (
                      <div
                        className="saldo-info"
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "#f0f9ff",
                          border: "1px solid #0ea5e9",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      >
                        <strong>Saldo disponível em dinheiro:</strong> R${" "}
                        {saldoDinheiroDisponivel.toFixed(2)}
                      </div>
                    )}
                    <small className="checkbox-help">
                      Quando marcado, o pagamento será registrado como sangria
                      no caixa, afetando o saldo disponível em dinheiro. A forma
                      de pagamento será automaticamente definida como dinheiro.
                    </small>
                  </div>

                  {!pagamentoForm.afeta_caixa && (
                    <div className="form-group">
                      <label className="form-label">Forma de Pagamento *</label>
                      <select
                        className="form-select"
                        value={pagamentoForm.forma_pagamento}
                        onChange={(e) =>
                          setPagamentoForm({
                            ...pagamentoForm,
                            forma_pagamento: e.target.value,
                          })
                        }
                      >
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao_debito">Cartão Débito</option>
                        <option value="cartao_credito">Cartão Crédito</option>
                        <option value="pix">PIX</option>
                        <option value="transferencia">Transferência</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  )}

                  <div className="form-group full-width">
                    {!mostrarDescricaoPagamento ? (
                      <button
                        type="button"
                        onClick={() => setMostrarDescricaoPagamento(true)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px dashed #d1d5db",
                          borderRadius: "8px",
                          backgroundColor: "transparent",
                          color: "#6b7280",
                          fontSize: "14px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.color = "#3b82f6";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#d1d5db";
                          e.currentTarget.style.color = "#6b7280";
                        }}
                      >
                        <Plus size={16} />
                        Adicionar descrição (opcional)
                      </button>
                    ) : (
                      <div>
                        <label
                          className="form-label"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          Descrição
                          <button
                            type="button"
                            onClick={() => {
                              setMostrarDescricaoPagamento(false);
                              setPagamentoForm({
                                ...pagamentoForm,
                                descricao: "",
                              });
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#6b7280",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: "0",
                            }}
                          >
                            <X size={16} />
                          </button>
                        </label>
                        <textarea
                          className="form-textarea"
                          value={pagamentoForm.descricao}
                          onChange={(e) =>
                            setPagamentoForm({
                              ...pagamentoForm,
                              descricao: e.target.value,
                            })
                          }
                          placeholder="Descrição do pagamento (ex: Compra de 10 unidades de produto X)"
                          rows={3}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Etapa 3: Senha Masterkey (apenas se afeta_caixa) */}
              {pagamentoEtapa === "senha" && (
                <MasterPasswordConfirmation
                  title="Confirmação de Pagamento"
                  message="Este pagamento afetará o caixa. Digite a senha masterkey para confirmar a operação."
                  value={validacaoSenhaForm.senha}
                  onChange={(senha) => setValidacaoSenhaForm({ senha })}
                  placeholder="Digite a senha masterkey"
                />
              )}
            </div>

            <div className="modal-footer-1">
              <div className="footer-actions">
                {pagamentoEtapa === "fornecedor" && (
                  <button
                    onClick={cancelarPagamento}
                    className="btn btn-outline"
                  >
                    Cancelar
                  </button>
                )}

                {pagamentoEtapa === "dados" && (
                  <>
                    <button
                      onClick={voltarParaFornecedor}
                      className="btn btn-outline"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={avancarParaPagamento}
                      className="btn btn-success"
                      disabled={
                        !pagamentoForm.valor ||
                        parseFloat(pagamentoForm.valor) <= 0 ||
                        erroSaldoInsuficientePagamento !== ""
                      }
                      title={
                        erroSaldoInsuficientePagamento
                          ? "Corrija o valor do pagamento para continuar"
                          : ""
                      }
                    >
                      <Receipt size={16} />
                      Registrar Pagamento
                    </button>
                  </>
                )}

                {pagamentoEtapa === "senha" && (
                  <>
                    <button
                      onClick={() => setPagamentoEtapa("dados")}
                      className="btn btn-outline"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={confirmarPagamentoComSenha}
                      className="btn btn-primary"
                      disabled={
                        !validacaoSenhaForm.senha || processandoPagamento
                      }
                    >
                      {processandoPagamento
                        ? "Processando..."
                        : "Confirmar Pagamento"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro de Fornecedor */}
      {showCadastroFornecedor && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "500px", width: "90%" }}
          >
            <div className="modal-header-caixa">
              <h3>Cadastrar Novo Fornecedor</h3>
              <button
                onClick={() => setShowCadastroFornecedor(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ display: "grid", gap: "15px" }}>
                <div>
                  <label className="form-label-inline">
                    Nome do Fornecedor *
                  </label>
                  <input
                    type="text"
                    value={cadastroFornecedorForm.nome}
                    onChange={(e) =>
                      setCadastroFornecedorForm({
                        ...cadastroFornecedorForm,
                        nome: e.target.value,
                      })
                    }
                    placeholder="Nome completo do fornecedor"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div>
                  <label className="form-label-inline">CNPJ *</label>
                  <input
                    type="text"
                    value={cadastroFornecedorForm.cnpj}
                    onChange={(e) =>
                      setCadastroFornecedorForm({
                        ...cadastroFornecedorForm,
                        cnpj: e.target.value,
                      })
                    }
                    placeholder="00.000.000/0000-00"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div>
                  <label className="form-label-inline">Telefone *</label>
                  <input
                    type="text"
                    value={cadastroFornecedorForm.telefone}
                    onChange={(e) =>
                      setCadastroFornecedorForm({
                        ...cadastroFornecedorForm,
                        telefone: e.target.value,
                      })
                    }
                    placeholder="(00) 00000-0000"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer-caixa">
              <button
                onClick={() => setShowCadastroFornecedor(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={cadastrarFornecedor}
                className="btn btn-primary"
                disabled={
                  !cadastroFornecedorForm.nome ||
                  !cadastroFornecedorForm.cnpj ||
                  !cadastroFornecedorForm.telefone
                }
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulário de Movimento */}
      {showTipoMovimentoModal &&
        tipoMovimentoSelecionado &&
        tipoMovimentoSelecionado !== "pagamento" && (
          <div className="modal-overlay">
            <div
              className="modal-content"
              style={{ maxWidth: "500px", width: "90%" }}
            >
              <div className="modal-header">
                <h3>
                  {tipoMovimentoSelecionado === "sangria"
                    ? "Realizar Sangria"
                    : "Realizar Suprimento"}
                </h3>
                <button onClick={cancelarMovimentacao} className="modal-close">
                  ×
                </button>
              </div>

              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor:
                      tipoMovimentoSelecionado === "sangria"
                        ? "#fef2f2"
                        : "#f0fdf4",
                    borderRadius: "8px",
                    color:
                      tipoMovimentoSelecionado === "sangria"
                        ? "#dc2626"
                        : "#16a34a",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    {tipoMovimentoSelecionado === "sangria" ? (
                      <ArrowDown size={20} style={{ marginRight: "8px" }} />
                    ) : (
                      <ArrowUp size={20} style={{ marginRight: "8px" }} />
                    )}
                    <strong>
                      {tipoMovimentoSelecionado === "sangria"
                        ? "Sangria do Caixa"
                        : "Suprimento ao Caixa"}
                    </strong>
                  </div>
                  <p style={{ margin: "0", fontSize: "14px" }}>
                    {tipoMovimentoSelecionado === "sangria"
                      ? "Esta operação irá retirar dinheiro do caixa."
                      : "Esta operação irá adicionar dinheiro ao caixa."}
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="movimento-valor">
                    Valor{" "}
                    {tipoMovimentoSelecionado === "sangria"
                      ? "da Sangria"
                      : "do Suprimento"}{" "}
                    *
                  </label>
                  <input
                    id="movimento-valor"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={movimentoForm.valor}
                    onChange={(e) =>
                      setMovimentoForm({
                        ...movimentoForm,
                        valor: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="movimento-descricao">Descrição/Motivo</label>
                  <textarea
                    id="movimento-descricao"
                    placeholder={`Motivo ${
                      tipoMovimentoSelecionado === "sangria"
                        ? "da sangria"
                        : "do suprimento"
                    } (opcional)`}
                    value={movimentoForm.descricao}
                    onChange={(e) =>
                      setMovimentoForm({
                        ...movimentoForm,
                        descricao: e.target.value,
                      })
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer-caixa">
                <button
                  onClick={realizarMovimentacao}
                  disabled={
                    processandoMovimento ||
                    !movimentoForm.valor ||
                    parseFloat(movimentoForm.valor) <= 0
                  }
                  className="btn"
                  style={{
                    backgroundColor: processandoMovimento
                      ? "#9ca3af"
                      : tipoMovimentoSelecionado === "sangria"
                      ? "#ef4444"
                      : "#10b981",
                    color: "white",
                    border: `1px solid ${
                      processandoMovimento
                        ? "#9ca3af"
                        : tipoMovimentoSelecionado === "sangria"
                        ? "#ef4444"
                        : "#10b981"
                    }`,
                    opacity:
                      processandoMovimento ||
                      !movimentoForm.valor ||
                      parseFloat(movimentoForm.valor) <= 0
                        ? 0.5
                        : 1,
                  }}
                >
                  {processandoMovimento ? (
                    <>
                      <Loader2
                        size={16}
                        style={{
                          marginRight: "6px",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Processando...
                    </>
                  ) : (
                    <>
                      {tipoMovimentoSelecionado === "sangria" ? (
                        <ArrowDown size={16} style={{ marginRight: "6px" }} />
                      ) : (
                        <ArrowUp size={16} style={{ marginRight: "6px" }} />
                      )}
                      Confirmar{" "}
                      {tipoMovimentoSelecionado === "sangria"
                        ? "Sangria"
                        : "Suprimento"}
                    </>
                  )}
                </button>
                <button
                  onClick={cancelarMovimentacao}
                  disabled={processandoMovimento}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal Comprovante de Pagamento */}
      {showComprovantePagamento && dadosPagamentoComprovante && (
        <div className="modal-overlay modal-fade-in">
          <div className="modal-content-f large">
            <div className="modal-header-1">
              <div className="modal-header-content">
                <div className="modal-title-info-1">
                  <h2>Concluído!</h2>
                  <p>Comprovante do pagamento efetuado</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowComprovantePagamento(false);
                  setDadosPagamentoComprovante(null);
                }}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-1">
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <CheckCircle size={48} color="#22c55e" />
                </div>

                <h3
                  style={{
                    color: "#22c55e",
                    marginBottom: "8px",
                    fontSize: "24px",
                    fontWeight: "600",
                  }}
                >
                  Pagamento realizado!
                </h3>
              </div>
              <div
                style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    color: "#1e40af",
                    fontWeight: "bold",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    padding: "16px",
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                  }}
                >
                  <DollarSign size={24} color="#1e40af" />
                  <span>
                    Valor Pago: {formatarValor(dadosPagamentoComprovante.valor)}
                  </span>
                </div>
              </div>
              <div
                className="comprovante-detalhes"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "24px",
                  margin: "20px 0",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FileText size={16} color="#6b7280" />
                    <span>
                      <strong>Pagamento #:</strong>{" "}
                      {dadosPagamentoComprovante.id}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Clock size={16} color="#6b7280" />
                    <span>
                      <strong>Data:</strong>{" "}
                      {new Date(
                        dadosPagamentoComprovante.data_pagamento
                      ).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <User size={16} color="#6b7280" />
                    <span>
                      <strong>Fornecedor:</strong>{" "}
                      {dadosPagamentoComprovante.fornecedor.nome}
                    </span>
                  </div>
                  <div
                    style={{
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FileText size={16} color="#6b7280" />
                    <span>
                      <strong>CNPJ:</strong>{" "}
                      {dadosPagamentoComprovante.fornecedor.cnpj}
                    </span>
                  </div>
                  <div
                    style={{
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <CreditCard size={16} color="#6b7280" />
                    <span>
                      <strong>Forma de Pagamento:</strong>{" "}
                      {dadosPagamentoComprovante.forma_pagamento}
                    </span>
                  </div>
                  {dadosPagamentoComprovante.afeta_caixa && (
                    <div
                      style={{
                        marginBottom: "12px",
                        color: "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px",
                        backgroundColor: "#fef2f2",
                        borderRadius: "6px",
                      }}
                    >
                      <AlertCircle size={16} color="#dc2626" />
                      <strong>Este pagamento afetou o caixa (sangria)</strong>
                    </div>
                  )}
                </div>

                {dadosPagamentoComprovante.descricao && (
                  <div
                    style={{
                      borderTop: "1px solid #e2e8f0",
                      paddingTop: "20px",
                      marginTop: "20px",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <FileText size={16} color="#6b7280" />
                      <strong>Descrição:</strong>
                    </div>
                    <div
                      style={{
                        backgroundColor: "#f1f5f9",
                        padding: "16px",
                        borderRadius: "8px",
                        fontStyle: "italic",
                        borderLeft: "4px solid #3b82f6",
                      }}
                    >
                      {dadosPagamentoComprovante.descricao}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <AlertCircle size={16} color="#dc2626" />
                <div>
                  <strong>Importante:</strong> Guarde este comprovante como
                  prova do pagamento realizado.
                </div>
              </div>
            </div>

            <div className="modal-footer-1">
              <div className="footer-actions">
                <button
                  onClick={() => {
                    setShowComprovantePagamento(false);
                    setDadosPagamentoComprovante(null);
                  }}
                  className="btn btn-outline"
                >
                  Fechar
                </button>
                <button
                  onClick={imprimirComprovantePagamento}
                  className="btn btn-primary"
                >
                  <Printer size={16} />
                  Imprimir Comprovante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Comprovante de Abertura */}
      {showComprovanteAbertura && dadosAbertura && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "500px", width: "90%" }}
          >
            <div className="modal-header-caixa">
              <h3>Caixa Aberto com Sucesso!</h3>
              <button
                onClick={() => {
                  setShowComprovanteAbertura(false);
                  setDadosAbertura(null);
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: "20px", textAlign: "center" }}>
              <div
                className="success-icon"
                style={{
                  color: "#22c55e",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <CheckCircle size={48} />
              </div>

              <h4 style={{ color: "#22c55e", marginBottom: "20px" }}>
                COMPROVANTE DE ABERTURA
              </h4>

              <div
                className="comprovante-detalhes"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "20px",
                  margin: "20px 0",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <strong>Caixa #:</strong> {dadosAbertura.caixa_id}
                  </div>
                  <div>
                    <strong>Data:</strong>{" "}
                    {new Date(dadosAbertura.data_abertura).toLocaleDateString(
                      "pt-BR"
                    )}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Operador:</strong> {dadosAbertura.funcionario_nome}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Cargo:</strong> {dadosAbertura.funcionario_cargo}
                  </div>
                </div>

                <div
                  style={{ borderTop: "1px solid #e2e8f0", paddingTop: "15px" }}
                >
                  <div
                    style={{
                      fontSize: "18px",
                      color: "#1e40af",
                      fontWeight: "bold",
                    }}
                  >
                    <strong>Valor Inicial:</strong>{" "}
                    {formatarValor(dadosAbertura.valor_inicial)}
                  </div>
                </div>

                {dadosAbertura.observacoes && (
                  <div
                    style={{
                      borderTop: "1px solid #e2e8f0",
                      paddingTop: "15px",
                      marginTop: "15px",
                    }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Observações:</strong>
                    </div>
                    <div
                      style={{
                        backgroundColor: "#f1f5f9",
                        padding: "10px",
                        borderRadius: "4px",
                        fontStyle: "italic",
                      }}
                    >
                      {dadosAbertura.observacoes}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  padding: "12px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: "#dc2626",
                }}
              >
                <strong>Importante:</strong> Guarde este comprovante como prova
                da abertura do caixa.
              </div>
            </div>

            <div className="modal-footer-caixa">
              <button
                onClick={imprimirComprovanteAbertura}
                className="btn btn-primary"
              >
                <FileText size={16} style={{ marginRight: "6px" }} />
                Imprimir Comprovante
              </button>
              <button
                onClick={() => {
                  setShowComprovanteAbertura(false);
                  setDadosAbertura(null);
                }}
                className="btn btn-outline"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Loading */}
      <LoadingModal
        isOpen={loadingAbrirCaixa}
        title="Abrindo Caixa"
        message={
          etapaAbertura === "login"
            ? "Validando credenciais..."
            : "Criando novo caixa..."
        }
        size="medium"
      />

      <LoadingModal
        isOpen={loadingFecharCaixa}
        title="Fechando Caixa"
        message="Processando fechamento do caixa..."
        size="medium"
      />

      <LoadingModal
        isOpen={loadingDados}
        title="Carregando Dados"
        message="Buscando informações do sistema..."
        size="small"
        spinnerSize={40}
      />

      <LoadingModal
        isOpen={loadingFornecedoresInicial}
        title="Aguarde"
        message="Carregando dados para pagamento de fornecedores..."
        size="medium"
        spinnerSize={48}
      />
    </div>
  );
}
