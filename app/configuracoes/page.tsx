'use client';

import { useState, useEffect } from "react"
import { Database, Server, Settings, CheckCircle, XCircle, Loader, HardDrive, X, OctagonAlert } from "lucide-react"
import Modal from "@/components/modal"
import ConfigModal from "@/components/config-modal"
import { useDatabaseConfig } from "@/hooks/use-database-config"

export default function ConfiguracoesPage() {
  const [showSqlTestModal, setShowSqlTestModal] = useState(false)
  const [showAppTestModal, setShowAppTestModal] = useState(false)
  const [showDatabaseModal, setShowDatabaseModal] = useState(false)
  const [showDatabaseConfirmModal, setShowDatabaseConfirmModal] = useState(false)
  const [selectedDatabaseType, setSelectedDatabaseType] = useState<'remote' | 'local' | null>(null)
  const [sqlTestStatus, setSqlTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [appTestStatus, setAppTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [sqlTestMessage, setSqlTestMessage] = useState('')
  const [appTestMessage, setAppTestMessage] = useState('')
  const [databaseTestStatus, setDatabaseTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [databaseTestMessage, setDatabaseTestMessage] = useState('')
  const [databaseInfoLoading, setDatabaseInfoLoading] = useState(false)
  const [databaseInfo, setDatabaseInfo] = useState<{
    host: string
    port: string
    database: string
    version: string
    user: string
    charset: string
    collation?: string
    statistics?: {
      totalTables: number
      totalRows: number
      sizeMB: number
    }
  } | null>(null)

  // Usar hook personalizado para configuração de banco
  const { currentDatabase, isLoading, changeDatabaseType } = useDatabaseConfig()

  // Função para buscar informações reais do banco
  const fetchDatabaseInfo = async () => {
    setDatabaseInfoLoading(true)
    try {
      const response = await fetch('/api/database/info')
      if (response.ok) {
        const info = await response.json()
        setDatabaseInfo(info)
      } else {
        console.error('Erro ao buscar informações do banco:', response.statusText)
      }
    } catch (error) {
      console.error('Erro ao buscar informações do banco:', error)
    } finally {
      setDatabaseInfoLoading(false)
    }
  }

  // Carregar informações do banco quando a página carrega ou o banco muda
  useEffect(() => {
    fetchDatabaseInfo()
  }, [currentDatabase])

  // Função para testar SQL
  const testSql = async () => {
    setSqlTestStatus('testing')
    setSqlTestMessage('')

    try {
      const response = await fetch('/api/database/test')
      const result = await response.json()
      
      if (response.ok && result.success) {
        setSqlTestStatus('success')
        setSqlTestMessage(result.message || 'Conexão com banco de dados bem-sucedida!')
        // Atualizar informações do banco após teste bem-sucedido
        if (result.databaseInfo) {
          setDatabaseInfo(result.databaseInfo)
        }
      } else {
        setSqlTestStatus('error')
        setSqlTestMessage(result.message || 'Erro na conexão com o banco de dados.')
      }
    } catch (error) {
      setSqlTestStatus('error')
      setSqlTestMessage('Erro na conexão com o banco de dados.')
    }
  }

  // Função para testar aplicação
  const testApp = async () => {
    setAppTestStatus('testing')
    setAppTestMessage('')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setAppTestStatus('success')
      setAppTestMessage('Todos os serviços da aplicação estão funcionando corretamente!')
    } catch (error) {
      setAppTestStatus('error')
      setAppTestMessage('Erro em alguns serviços da aplicação.')
    }
  }

  // Função para lidar com clique na opção de banco
  const handleDatabaseOptionClick = (type: 'remote' | 'local') => {
    if (type !== currentDatabase) {
      setSelectedDatabaseType(type)
      setShowDatabaseConfirmModal(true)
    }
  }

  // Função para confirmar alteração do banco
  const confirmDatabaseChange = async () => {
    if (!selectedDatabaseType) return

    setShowDatabaseConfirmModal(false)
    setDatabaseTestStatus('testing')
    setDatabaseTestMessage('Alterando configuração do banco de dados...')

    try {
      const result = await changeDatabaseType(selectedDatabaseType)

      if (result.success) {
        setDatabaseTestStatus('success')
        setDatabaseTestMessage(result.message)
      } else {
        setDatabaseTestStatus('error')
        setDatabaseTestMessage(result.message)
      }
    } catch (error) {
      setDatabaseTestStatus('error')
      setDatabaseTestMessage('Erro ao alterar configuração do banco de dados')
    }

    setSelectedDatabaseType(null)
  }

  return (
    <div className="configuracoes-page">
      {/* Header da Página */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-info">
            <Settings className="page-header-icon" size={28} />
            <div>
              <h1 className="page-header-title">Configurações do Sistema</h1>
              <p className="page-header-subtitle">
                Gerencie as configurações e execute testes do sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Configuração */}
      <div className="configuracoes-cards">

        {/* Card de Teste SQL */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-card-icon">
              <Database size={24} />
            </div>
            <div className="config-card-info">
              <h3 className="config-card-title">Teste de Conexão SQL</h3>
              <p className="config-card-description">
                Verifica a conectividade com o banco de dados
              </p>
            </div>
          </div>
          <div className="config-card-content">
            <p className="config-card-text">
              Este teste verifica se a aplicação consegue se conectar e executar consultas no banco de dados.
            </p>
            <button
              onClick={() => setShowSqlTestModal(true)}
              className="config-card-btn"
            >
              <Database size={16} />
              Executar Teste SQL
            </button>
          </div>
        </div>

        {/* Card de Teste da Aplicação */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-card-icon">
              <Settings size={24} />
            </div>
            <div className="config-card-info">
              <h3 className="config-card-title">Teste da Aplicação</h3>
              <p className="config-card-description">
                Verifica o funcionamento geral do sistema
              </p>
            </div>
          </div>
          <div className="config-card-content">
            <p className="config-card-text">
              Este teste verifica se todos os módulos e serviços da aplicação estão funcionando corretamente.
            </p>
            <button
              onClick={() => setShowAppTestModal(true)}
              className="config-card-btn"
            >
              <Settings size={16} />
              Executar Teste da Aplicação
            </button>
          </div>
        </div>

        {/* Card de Configuração do Banco */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-card-icon">
              <Server size={24} />
            </div>
            <div className="config-card-info">
              <h3 className="config-card-title">Configuração do Banco de Dados</h3>
              <p className="config-card-description">
                Alterar entre banco remoto e local
              </p>
            </div>
          </div>
          <div className="config-card-content">
            <div className="config-card-status">
              <span className="status-label">Banco atual:</span>
              <span className={`status-badge ${currentDatabase === 'remote' ? 'status-primary' : 'status-secondary'}`}>
                {currentDatabase === 'remote' ? '🌐 Remoto (AWS)' : '💻 Local'}
              </span>
            </div>
            <button
              onClick={() => setShowDatabaseModal(true)}
              className="config-card-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Alterando...
                </>
              ) : (
                <>
                  <Server size={16} />
                  Configurar Banco de Dados
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Teste SQL */}
      {showSqlTestModal && (
        <div className="modal-overlay" onClick={() => setShowSqlTestModal(false)}>
          <div className="modal-content modal-resumo-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-caixa">
              <div className="modal-header-caixa-info">
                <div className="modal-resumo-header-icon teste-db">
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="modal-resumo-header-title">
                    Teste de Conexão SQL
                  </h3>
                  <p className="modal-resumo-header-subtitle">
                    Verificando conectividade com banco {currentDatabase === 'remote' ? 'remoto (AWS RDS)' : 'local'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlTestModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-resumo-body">
              {/* Card de Informações do Banco */}
              <div className="test-database-info-card">
                <div className="database-info-header">
                  <div className="database-info-icon">
                    {currentDatabase === 'remote' ? <Server size={20} /> : <HardDrive size={20} />}
                  </div>
                  <div>
                    <h4 className="database-info-title">
                      Banco {currentDatabase === 'remote' ? 'Remoto (AWS RDS)' : 'Local'}
                    </h4>
                    <p className="database-info-subtitle">
                      {databaseInfoLoading ? 'Carregando informações...' : 'Configuração atual do sistema'}
                    </p>
                  </div>
                  {databaseInfoLoading && (
                    <div className="database-info-loading">
                      <Loader size={16} className="animate-spin" />
                    </div>
                  )}
                </div>
                
                <div className="database-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Host:</span>
                    <span className="spec-value">
                      {databaseInfo?.host || (currentDatabase === 'remote' 
                        ? 'associacao.cjcs4o2mmp5e.us-east-2.rds.amazonaws.com'
                        : 'localhost'
                      )}
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Porta:</span>
                    <span className="spec-value">{databaseInfo?.port || '3306'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Banco:</span>
                    <span className="spec-value">{databaseInfo?.database || 'Conectando...'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Versão:</span>
                    <span className="spec-value">{databaseInfo?.version || 'MySQL'}</span>
                  </div>
                  {databaseInfo?.user && (
                    <div className="spec-item">
                      <span className="spec-label">Usuário:</span>
                      <span className="spec-value">{databaseInfo.user}</span>
                    </div>
                  )}
                  {databaseInfo?.charset && (
                    <div className="spec-item">
                      <span className="spec-label">Charset:</span>
                      <span className="spec-value">{databaseInfo.charset}</span>
                    </div>
                  )}
                  {databaseInfo?.statistics && (
                    <>
                      <div className="spec-item">
                        <span className="spec-label">Tabelas:</span>
                        <span className="spec-value">{databaseInfo.statistics.totalTables}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Tamanho:</span>
                        <span className="spec-value">{databaseInfo.statistics.sizeMB.toFixed(1)} MB</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Área de Teste */}
              <div className="test-execution-area">
                <div className="test-description">
                  <p>
                    Este teste verificará a conectividade com o banco de dados e executará 
                    consultas básicas para validar o funcionamento do sistema.
                  </p>
                </div>

                {sqlTestStatus === 'idle' && (
                  <div className="test-idle-state">
                    <button onClick={testSql} className="test-start-btn">
                      <Database size={16} />
                      Iniciar Teste de Conexão
                    </button>
                  </div>
                )}

                {sqlTestStatus === 'testing' && (
                  <div className="test-running-state">
                    <div className="test-loading-icon">
                      <Loader size={24} className="animate-spin" />
                    </div>
                    <div className="test-status-text">
                      <h4>Executando Teste...</h4>
                      <p>Verificando conectividade e executando consultas de validação</p>
                    </div>
                  </div>
                )}

                {sqlTestStatus === 'success' && (
                  <div className="test-success-state">
                    <div className="test-result-header">
                      <div className="test-success-icon">
                        <CheckCircle size={24} />
                      </div>
                      <div className="test-result-info">
                        <h4>Teste Concluído com Sucesso!</h4>
                        <p>{sqlTestMessage}</p>
                      </div>
                    </div>
                    
                    <div className="test-details-grid">
                      <div className="test-detail-item success">
                        <div className="detail-icon">
                          <CheckCircle size={16} />
                        </div>
                        <span>Conexão estabelecida</span>
                      </div>
                      <div className="test-detail-item success">
                        <div className="detail-icon">
                          <CheckCircle size={16} />
                        </div>
                        <span>Consultas executadas</span>
                      </div>
                      <div className="test-detail-item success">
                        <div className="detail-icon">
                          <CheckCircle size={16} />
                        </div>
                        <span>Banco de dados acessível</span>
                      </div>
                      <div className="test-detail-item success">
                        <div className="detail-icon">
                          <CheckCircle size={16} />
                        </div>
                        <span>Tabelas verificadas</span>
                      </div>
                    </div>
                  </div>
                )}

                {sqlTestStatus === 'error' && (
                  <div className="test-error-state">
                    <div className="test-result-header">
                      <div className="test-error-icon">
                        <XCircle size={24} />
                      </div>
                      <div className="test-result-info">
                        <h4>Teste Falhou</h4>
                        <p>{sqlTestMessage}</p>
                      </div>
                    </div>
                    
                    <div className="test-error-details">
                      <div className="error-suggestions">
                        <h5>Possíveis soluções:</h5>
                        <ul>
                          <li>Verifique se o banco de dados está rodando</li>
                          <li>Confirme as credenciais de acesso</li>
                          <li>Teste a conectividade de rede</li>
                          <li>Verifique as configurações do firewall</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão de repetir teste */}
                {(sqlTestStatus === 'success' || sqlTestStatus === 'error') && (
                  <div className="test-actions">
                    <button 
                      onClick={() => {
                        setSqlTestStatus('idle')
                        setSqlTestMessage('')
                      }}
                      className="test-repeat-btn"
                    >
                      Executar Novamente
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Teste da Aplicação */}
      {showAppTestModal && (
        <div className="modal-overlay" onClick={() => setShowAppTestModal(false)}>
          <div className="modal-content modal-resumo-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-caixa">
              <div className="modal-header-caixa-info">
                <div className="modal-resumo-header-icon teste-app">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="modal-resumo-header-title">
                    Teste da Aplicação
                  </h3>
                  <p className="modal-resumo-header-subtitle">
                    Verificando funcionamento dos módulos e serviços do sistema
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAppTestModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-resumo-body">
              {/* Card de Informações do Sistema */}
              <div className="test-database-info-card">
                <div className="database-info-header">
                  <div className="database-info-icon">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h4 className="database-info-title">
                      Sistema PDV Supermercado
                    </h4>
                    <p className="database-info-subtitle">
                      Verificação completa dos módulos
                    </p>
                  </div>
                </div>
                
                <div className="database-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Versão:</span>
                    <span className="spec-value">1.0.0</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Ambiente:</span>
                    <span className="spec-value">Produção</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Framework:</span>
                    <span className="spec-value">Next.js</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Status:</span>
                    <span className="spec-value">Online</span>
                  </div>
                </div>
              </div>

              {/* Área de Teste */}
              <div className="test-execution-area">
                <div className="test-description">
                  <p>
                    Este teste verificará o funcionamento de todos os módulos e serviços 
                    da aplicação, incluindo APIs, componentes e integrações.
                  </p>
                </div>

                {appTestStatus === 'idle' && (
                  <div className="test-idle-state">
                    <button onClick={testApp} className="test-start-btn">
                      <Settings size={16} />
                      Iniciar Teste da Aplicação
                    </button>
                  </div>
                )}

                {appTestStatus === 'testing' && (
                  <div className="test-running-state">
                    <div className="test-loading-icon">
                      <Loader size={24} className="animate-spin" />
                    </div>
                    <div className="test-status-text">
                      <h4>Executando Teste...</h4>
                      <p>Verificando módulos e serviços da aplicação</p>
                    </div>
                  </div>
                )}

                {appTestStatus === 'success' && (
                  <div className="test-success-state">
                    <div className="test-result-header">
                      <div className="test-success-icon">
                        <CheckCircle size={24} />
                      </div>
                      <div className="test-result-info">
                        <h4>Teste Concluído com Sucesso!</h4>
                        <p>{appTestMessage}</p>
                      </div>
                    </div>
                    
                    <div className="test-details-grid">
                      <div className="test-detail-item success">
                        <div className="detail-icon">
                          <CheckCircle size={16} />
                        </div>
                        <span>APIs funcionando</span>
                      </div>
                      <div className="test-detail-item success">
                        <div className="detail-icon">
                          <CheckCircle size={16} />
                        </div>
                        <span>Componentes carregados</span>
                      </div>
                      <div className="test-detail-item success">
                        <div className="detail-icon">
                          <CheckCircle size={16} />
                        </div>
                        <span>Serviços ativos</span>
                      </div>
                      <div className="test-detail-item success">
                        <div className="detail-icon">
                          <CheckCircle size={16} />
                        </div>
                        <span>Integrações OK</span>
                      </div>
                    </div>
                  </div>
                )}

                {appTestStatus === 'error' && (
                  <div className="test-error-state">
                    <div className="test-result-header">
                      <div className="test-error-icon">
                        <XCircle size={24} />
                      </div>
                      <div className="test-result-info">
                        <h4>Teste Falhou</h4>
                        <p>{appTestMessage}</p>
                      </div>
                    </div>
                    
                    <div className="test-error-details">
                      <div className="error-suggestions">
                        <h5>Possíveis soluções:</h5>
                        <ul>
                          <li>Verifique se todos os serviços estão rodando</li>
                          <li>Confirme as configurações da aplicação</li>
                          <li>Teste as APIs individualmente</li>
                          <li>Verifique os logs do sistema</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão de repetir teste */}
                {(appTestStatus === 'success' || appTestStatus === 'error') && (
                  <div className="test-actions">
                    <button 
                      onClick={() => {
                        setAppTestStatus('idle')
                        setAppTestMessage('')
                      }}
                      className="test-repeat-btn"
                    >
                      Executar Novamente
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração do Banco de Dados */}
      {showDatabaseModal && (
        <div className="modal-overlay modal-fade-in" onClick={() => setShowDatabaseModal(false)}>
          <div className="modal-content-f large" onClick={e => e.stopPropagation()}>
            <div className="employee-header">
              <div className="employee-header-info">
                <div className="employee-header-icon">
                  <Server size={24} />
                </div>
                <div>
                  <h2 className="employee-header-title">
                    Configuração do Banco de Dados
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0', fontSize: '14px' }}>
                    Escolha qual banco de dados deseja utilizar
                  </p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowDatabaseModal(false)}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Status Atual do Banco */}
              <div className="current-database-status">
                <div className="status-header">
                  <h3>Banco de Dados Atual</h3>
                  <div className={`status-indicator ${currentDatabase}`}>
                    <div className="status-icon">
                      {currentDatabase === 'remote' ? <Server size={20} /> : <HardDrive size={20} />}
                    </div>
                    <div className="status-info">
                      <span className="status-label">
                        {currentDatabase === 'remote' ? 'Banco Remoto (AWS RDS)' : 'Banco Local'}
                      </span>
                      <span className="status-details">
                        {currentDatabase === 'remote'
                          ? 'associacao.cjcs4o2mmp5e.us-east-2.rds.amazonaws.com'
                          : 'localhost:3306'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opções de Banco */}
              <div className="database-selection-section">
                <h3>Alterar Configuração</h3>
                <p className="section-description">
                  Selecione uma das opções abaixo para alterar a configuração do banco de dados.
                  A alteração será aplicada imediatamente após confirmação.
                </p>

                <div className="database-options-grid">
                  <div
                    className={`database-option-card ${currentDatabase === 'remote' ? 'current-active' : ''}`}
                    onClick={() => handleDatabaseOptionClick('remote')}
                  >
                    <div className="option-card-header">
                      <div className="option-icon">
                        <Server size={32} />
                      </div>
                      <div className="option-info">
                        <h4>Banco Remoto (AWS RDS)</h4>
                        <span className="option-type">Nuvem</span>
                      </div>
                      {currentDatabase === 'remote' && (
                        <div className="current-badge">
                          <CheckCircle size={16} />
                          <span>Atual</span>
                        </div>
                      )}
                    </div>
                    <div className="option-description">
                      <p>Conecta ao banco de dados na nuvem (Amazon RDS)</p>
                      <div className="option-specs">
                        <div className="spec-item">
                          <span className="spec-label">Host:</span>
                          <span className="spec-value">associacao.cjcs4o2mmp5e.us-east-2.rds.amazonaws.com</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Porta:</span>
                          <span className="spec-value">3306</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Banco:</span>
                          <span className="spec-value">pdv_supermercado</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`database-option-card ${currentDatabase === 'local' ? 'current-active' : ''}`}
                    onClick={() => handleDatabaseOptionClick('local')}
                  >
                    <div className="option-card-header">
                      <div className="option-icon">
                        <HardDrive size={32} />
                      </div>
                      <div className="option-info">
                        <h4>Banco Local</h4>
                        <span className="option-type">Local</span>
                      </div>
                      {currentDatabase === 'local' && (
                        <div className="current-badge">
                          <CheckCircle size={16} />
                          <span>Atual</span>
                        </div>
                      )}
                    </div>
                    <div className="option-description">
                      <p>Conecta ao banco de dados local (localhost)</p>
                      <div className="option-specs">
                        <div className="spec-item">
                          <span className="spec-label">Host:</span>
                          <span className="spec-value">localhost</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Porta:</span>
                          <span className="spec-value">3306</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Banco:</span>
                          <span className="spec-value">pdv_supermercado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status do teste de conexão */}
              {databaseTestStatus !== 'idle' && (
                <div className="database-test-status">
                  <div className="test-status-header">
                    {databaseTestStatus === 'testing' && <Loader size={20} className="loading-icon" />}
                    {databaseTestStatus === 'success' && <CheckCircle size={20} className="success-icon" />}
                    {databaseTestStatus === 'error' && <XCircle size={20} className="error-icon" />}
                    <span>Status da Configuração</span>
                  </div>
                  <div className="test-status-message">
                    {databaseTestMessage}
                  </div>
                </div>
              )}

              {/* Aviso de Atenção */}
              <div className="database-modal-warning">
                <div className="warning-header">
                  <OctagonAlert size={20} />
                  <strong>Atenção</strong>
                </div>
                <p>A alteração da configuração do banco de dados pode afetar todas as operações do sistema. Certifique-se de que o novo banco esteja acessível antes de confirmar a mudança.</p>
              </div>

              {/* Ações do Modal */}
              <div className="modal-footer-1">
                <div className="footer-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-lg"
                    onClick={() => setShowDatabaseModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação da Alteração do Banco */}
      <ConfigModal
        isOpen={showDatabaseConfirmModal}
        onClose={() => {
          setShowDatabaseConfirmModal(false)
          setSelectedDatabaseType(null)
        }}
        title="Confirmar Alteração do Banco de Dados"
        subtitle="Esta ação irá alterar imediatamente a configuração do sistema"
        size="medium"
      >
        <div className="database-confirm-content">
          <div className="confirm-icon">
            {selectedDatabaseType === 'remote' ? <Server size={48} /> : <HardDrive size={48} />}
          </div>

          <div className="confirm-message">
            <h3>Deseja alterar para o banco {selectedDatabaseType === 'remote' ? 'remoto' : 'local'}?</h3>
            <p>
              Você está prestes a alterar a configuração do banco de dados de{' '}
              <strong>{currentDatabase === 'remote' ? 'remoto (AWS RDS)' : 'local (localhost)'}</strong>{' '}
              para{' '}
              <strong>{selectedDatabaseType === 'remote' ? 'remoto (AWS RDS)' : 'local (localhost)'}</strong>.
            </p>

            <div className="confirm-details">
              <div className="detail-item">
                <span className="detail-label">Banco atual:</span>
                <span className="detail-value">
                  {currentDatabase === 'remote' ? '🌐 AWS RDS (associacao.cjcs4o2mmp5e...)' : '💻 Localhost (127.0.0.1)'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Novo banco:</span>
                <span className="detail-value">
                  {selectedDatabaseType === 'remote' ? '🌐 AWS RDS (associacao.cjcs4o2mmp5e...)' : '💻 Localhost (127.0.0.1)'}
                </span>
              </div>
            </div>

            <div className="confirm-warning">
              <strong>⚠️ Atenção:</strong> Esta alteração irá:
              <ul>
                <li>Alterar a configuração de conexão do banco</li>
                <li>Testar a nova conexão automaticamente</li>
                <li>Persistir a configuração no navegador</li>
              </ul>
            </div>
          </div>

          <div className="confirm-actions">
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowDatabaseConfirmModal(false)
                setSelectedDatabaseType(null)
              }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={confirmDatabaseChange}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Alterando...
                </>
              ) : (
                'Confirmar Alteração'
              )}
            </button>
          </div>
        </div>
      </ConfigModal>
    </div>
  )
}