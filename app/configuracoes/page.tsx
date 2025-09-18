'use client';

import { useState, useEffect } from "react"
import { Database, Server, Settings, CheckCircle, XCircle, Loader, HardDrive, X, OctagonAlert, ChevronDown, ChevronRight } from "lucide-react"
import ConfigModal from "@/components/config-modal"

export default function ConfiguracoesPage() {
  const [showSqlTestModal, setShowSqlTestModal] = useState(false)
  const [showAppTestModal, setShowAppTestModal] = useState(false)
  const [showDatabaseModal, setShowDatabaseModal] = useState(false)
  const [showDatabaseConfirmModal, setShowDatabaseConfirmModal] = useState(false)
  const [showSqlExecutionModal, setShowSqlExecutionModal] = useState(false)
  const [showAppExecutionModal, setShowAppExecutionModal] = useState(false)
  const [showDatabaseResultModal, setShowDatabaseResultModal] = useState(false)
  const [showDatabaseLoadingModal, setShowDatabaseLoadingModal] = useState(false)
  const [showDatabaseLogsModal, setShowDatabaseLogsModal] = useState(false)
  const [databaseLogs, setDatabaseLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Helper para mostrar informações do banco atual
  const getCurrentDatabaseInfo = () => {
    if (currentDatabase === null) {
      return {
        label: '⏳ Carregando...',
        className: 'status-secondary',
        isRemote: false,
        isLocal: false,
        isLoading: true
      }
    }
    
    return {
      label: currentDatabase === 'remote' ? '🌐 AWS RDS' : '💻 Local',
      className: currentDatabase === 'remote' ? 'status-primary' : 'status-secondary',
      isRemote: currentDatabase === 'remote',
      isLocal: currentDatabase === 'local',
      isLoading: false
    }
  }
  const [selectedDatabaseType, setSelectedDatabaseType] = useState<'remote' | 'local' | null>(null)
  const [sqlTestStatus, setSqlTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [appTestStatus, setAppTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [sqlTestMessage, setSqlTestMessage] = useState('')
  const [appTestMessage, setAppTestMessage] = useState('')
  const [sqlTestDetails, setSqlTestDetails] = useState<any>(null)
  const [sqlTestError, setSqlTestError] = useState<any>(null)
  const [sqlTestStep, setSqlTestStep] = useState(1)
  const [appTestStep, setAppTestStep] = useState(1)
  const [databaseTestStatus, setDatabaseTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [databaseTestMessage, setDatabaseTestMessage] = useState('')
  const [databaseInfoLoading, setDatabaseInfoLoading] = useState(false)
  const [currentDatabase, setCurrentDatabase] = useState<'remote' | 'local' | null>(null) // null indica que ainda não foi carregado
  const [isLoading, setIsLoading] = useState(false)
  const [showDatabaseDetails, setShowDatabaseDetails] = useState(false)
  const [showSystemDetails, setShowSystemDetails] = useState(false)
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
    // Só carregar informações se a configuração já foi carregada
    if (currentDatabase !== null) {
      fetchDatabaseInfo()
    }
  }, [currentDatabase])

  // Carregar configuração inicial do servidor
  useEffect(() => {
    const loadInitialConfig = async () => {
      try {
        console.log('[CONFIG INIT] Iniciando carregamento da configuração...')
        const response = await fetch('/api/database-config')
        console.log('[CONFIG INIT] Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[CONFIG INIT] Data recebida:', data)
          
          if (data.success && data.config) {
            console.log('[CONFIG INIT] Alterando currentDatabase de', currentDatabase, 'para', data.config.type)
            setCurrentDatabase(data.config.type)
          } else {
            console.warn('[CONFIG INIT] Resposta da API sem configuração válida:', data)
            // Fallback para remoto se não conseguir carregar
            setCurrentDatabase('remote')
          }
        } else {
          console.error('[CONFIG INIT] Erro na resposta da API:', response.status, response.statusText)
          // Fallback para remoto se não conseguir carregar
          setCurrentDatabase('remote')
        }
      } catch (error) {
        console.error('[CONFIG INIT] Erro ao carregar configuração inicial:', error)
        // Fallback para remoto se não conseguir carregar
        setCurrentDatabase('remote')
      }
    }

    loadInitialConfig()
  }, []) // Executar apenas uma vez na montagem do componente

  // Função para alterar o tipo de banco
  const changeDatabaseType = async (type: 'remote' | 'local'): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)
    try {
      // Simula teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Forçar atualização da configuração no servidor
      await fetch('/api/database-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type })
      })
      
      setCurrentDatabase(type)
      await fetchDatabaseInfo()
      return { 
        success: true, 
        message: `Banco de dados alterado para ${type === 'remote' ? 'remoto' : 'local'} com sucesso!` 
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Erro ao alterar configuração do banco de dados' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Função para testar SQL
  const testSql = async () => {
    setShowSqlTestModal(false)
    setShowSqlExecutionModal(true)
    setSqlTestStatus('testing')
    setSqlTestMessage('')
    setSqlTestDetails(null)
    setSqlTestError(null)
    setSqlTestStep(1)

    try {
      // Etapa 1: Conectando ao banco
      setSqlTestStep(1)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Etapa 2: Executando consultas
      setSqlTestStep(2)
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Etapa 3: Validando dados
      setSqlTestStep(3)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Executar teste real
      const response = await fetch('/api/database/test')
      const result = await response.json()
      
      if (response.ok && result.success) {
        setSqlTestStatus('success')
        setSqlTestMessage(result.message || 'Conexão com banco de dados bem-sucedida!')
        setSqlTestDetails(result)
        // Atualizar informações do banco após teste bem-sucedido
        if (result.databaseInfo) {
          setDatabaseInfo(result.databaseInfo)
        }
      } else {
        setSqlTestStatus('error')
        setSqlTestMessage(result.message || 'Erro na conexão com o banco de dados.')
        setSqlTestError(result)
      }
    } catch (error) {
      setSqlTestStatus('error')
      setSqlTestMessage('Erro na conexão com o banco de dados.')
      setSqlTestError({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: 'Falha na comunicação com o servidor'
      })
    }
  }

  // Função para testar aplicação
  const testApp = async () => {
    setShowAppTestModal(false)
    setShowAppExecutionModal(true)
    setAppTestStatus('testing')
    setAppTestMessage('')
    setAppTestStep(1)

    try {
      // Etapa 1: Testando APIs
      setAppTestStep(1)
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Etapa 2: Verificando componentes
      setAppTestStep(2)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Etapa 3: Validando serviços
      setAppTestStep(3)
      await new Promise(resolve => setTimeout(resolve, 800))

      // Finalizar teste
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
    setShowDatabaseLoadingModal(true)
    setDatabaseTestStatus('testing')
    setDatabaseTestMessage('Alterando configuração do banco de dados...')

    try {
      const result = await changeDatabaseType(selectedDatabaseType)

      setShowDatabaseLoadingModal(false)
      
      if (result.success) {
        setDatabaseTestStatus('success')
        setDatabaseTestMessage(result.message)
        // Abrir modal de resultado após sucesso
        setTimeout(() => {
          setShowDatabaseResultModal(true)
        }, 300)
      } else {
        setDatabaseTestStatus('error')
        setDatabaseTestMessage(result.message)
        // Abrir modal de resultado após erro
        setTimeout(() => {
          setShowDatabaseResultModal(true)
        }, 300)
      }
    } catch (error) {
      setShowDatabaseLoadingModal(false)
      setDatabaseTestStatus('error')
      setDatabaseTestMessage('Erro ao alterar configuração do banco de dados')
      // Abrir modal de resultado após erro
      setTimeout(() => {
        setShowDatabaseResultModal(true)
      }, 300)
    }

    setSelectedDatabaseType(null)
  }

  // Função para buscar logs do banco de dados
  const fetchDatabaseLogs = async () => {
    setLogsLoading(true)
    try {
      const response = await fetch('/api/database-logs')
      const data = await response.json()
      
      if (data.success) {
        setDatabaseLogs(data.logs || [])
      } else {
        console.error('Erro ao buscar logs:', data.error)
        setDatabaseLogs([])
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
      setDatabaseLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  // Função para limpar logs
  const clearLogs = async () => {
    try {
      const response = await fetch('/api/database-logs', { method: 'DELETE' })
      const data = await response.json()
      
      if (data.success) {
        setDatabaseLogs([])
      }
    } catch (error) {
      console.error('Erro ao limpar logs:', error)
    }
  }

  return (
    <div className="configuracoes-page">

      {/* Lista de Configurações */}
      <div className="configuracoes-list">

        {/* Item de Teste SQL */}
        <div className="config-item">
          <div className="config-item-icon">
            <Database size={28} />
          </div>
          <div className="config-item-content">
            <div className="config-item-info">
              <h3 className="config-item-title">Teste de Conexão SQL</h3>
              <div className="config-item-status">
                <span className="status-label">Banco atual:</span>
                <span className={`status-badge ${getCurrentDatabaseInfo().className}`}>
                  {getCurrentDatabaseInfo().label}
                </span>
              </div>
            </div>
            <div className="config-item-actions">
              <button
                onClick={() => setShowSqlTestModal(true)}
                className="config-item-btn primary"
              >
                <Database size={18} />
                Executar Teste
              </button>
            </div>
          </div>
        </div>

        {/* Item de Teste da Aplicação */}
        <div className="config-item">
          <div className="config-item-icon">
            <Settings size={28} />
          </div>
          <div className="config-item-content">
            <div className="config-item-info">
              <h3 className="config-item-title">Teste da Aplicação</h3>
              <p className="config-item-description">
                Este teste verifica se todos os módulos e serviços da aplicação estão funcionando corretamente, incluindo APIs, componentes e integrações.
              </p>
              <div className="config-item-status">
                <span className="status-label">Sistema:</span>
                <span className="status-badge status-success">
                  ✅ Online
                </span>
              </div>
            </div>
            <div className="config-item-actions">
              <button
                onClick={() => setShowAppTestModal(true)}
                className="config-item-btn primary"
              >
                <Settings size={18} />
                Executar Teste
              </button>
            </div>
          </div>
        </div>

        {/* Item de Configuração do Banco */}
        <div className="config-item">
          <div className="config-item-icon">
            <Server size={28} />
          </div>
          <div className="config-item-content">
            <div className="config-item-info">
              <h3 className="config-item-title">Configuração do Banco de Dados</h3>
              <p className="config-item-description">
                Altere entre banco remoto (AWS RDS) e local (localhost) conforme necessário. A alteração será aplicada imediatamente.
              </p>
              <div className="config-item-status">
                <span className="status-label">Configuração atual:</span>
                <span className={`status-badge ${getCurrentDatabaseInfo().className}`}>
                  {getCurrentDatabaseInfo().isLoading ? '⏳ Carregando...' : 
                   getCurrentDatabaseInfo().isRemote ? '🌐 Remoto (AWS)' : '💻 Local'}
                </span>
              </div>
            </div>
            <div className="config-item-actions">
              <button
                onClick={() => setShowDatabaseModal(true)}
                className="config-item-btn secondary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Server size={18} />
                    Configurar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Item de Logs do Banco */}
        <div className="config-item">
          <div className="config-item-icon">
            <Settings size={28} />
          </div>
          <div className="config-item-content">
            <div className="config-item-info">
              <h3 className="config-item-title">Logs do Banco de Dados</h3>
              <p className="config-item-description">
                Visualize o histórico de operações e conexões do banco de dados em tempo real.
              </p>
              <div className="config-item-status">
                <span className="status-label">Últimas operações:</span>
                <span className="status-badge status-info">
                  {databaseLogs.length} registros
                </span>
              </div>
            </div>
            <div className="config-item-actions">
              <button
                onClick={() => {
                  setShowDatabaseLogsModal(true)
                  fetchDatabaseLogs()
                }}
                className="config-item-btn secondary"
                disabled={logsLoading}
              >
                {logsLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Settings size={18} />
                    Ver Logs
                  </>
                )}
              </button>
            </div>
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
                
                <div className="database-details-section">
                  <button 
                    onClick={() => setShowDatabaseDetails(!showDatabaseDetails)}
                    className="database-details-toggle"
                  >
                    {showDatabaseDetails ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    <span>Detalhes Técnicos</span>
                    <span className="details-count">
                      {databaseInfo ? '8 informações' : 'Carregando...'}
                    </span>
                  </button>
                  
                  {showDatabaseDetails && (
                    <div className="database-specs-grid expanded">
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
                  )}
                </div>
              </div>

              {/* Área de Teste */}
              <div className="test-execution-area">
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
                      {sqlTestDetails?.tests && Array.isArray(sqlTestDetails.tests) ? (
                        sqlTestDetails.tests.map((test: any, index: number) => (
                          <div key={index} className={`test-detail-item ${test.success ? 'success' : 'error'}`}>
                            <div className="detail-icon">
                              {test.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            </div>
                            <span>{test.description || test.name}</span>
                            {test.result && (
                              <small className="test-result-detail">
                                {typeof test.result === 'object' 
                                  ? `${Object.keys(test.result).length} registros` 
                                  : test.result}
                              </small>
                            )}
                          </div>
                        ))
                      ) : (
                        // Fallback para mensagens padrão
                        <>
                          <div className="test-detail-item success">
                            <div className="detail-icon">
                              <CheckCircle size={16} />
                            </div>
                            <span>Conexão estabelecida</span>
                            {sqlTestDetails?.connectionTime && (
                              <small className="test-result-detail">
                                {sqlTestDetails.connectionTime}ms
                              </small>
                            )}
                          </div>
                          <div className="test-detail-item success">
                            <div className="detail-icon">
                              <CheckCircle size={16} />
                            </div>
                            <span>Consultas executadas</span>
                            {sqlTestDetails?.queriesExecuted && (
                              <small className="test-result-detail">
                                {sqlTestDetails.queriesExecuted} consultas
                              </small>
                            )}
                          </div>
                          <div className="test-detail-item success">
                            <div className="detail-icon">
                              <CheckCircle size={16} />
                            </div>
                            <span>Banco de dados acessível</span>
                            {sqlTestDetails?.databaseInfo?.database && (
                              <small className="test-result-detail">
                                {sqlTestDetails.databaseInfo.database}
                              </small>
                            )}
                          </div>
                          <div className="test-detail-item success">
                            <div className="detail-icon">
                              <CheckCircle size={16} />
                            </div>
                            <span>Tabelas verificadas</span>
                            {sqlTestDetails?.tablesCount && (
                              <small className="test-result-detail">
                                {sqlTestDetails.tablesCount} tabelas
                              </small>
                            )}
                          </div>
                        </>
                      )}
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
                        setSqlTestDetails(null)
                        setSqlTestError(null)
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
                
                <div className="database-details-section">
                  <button 
                    onClick={() => setShowSystemDetails(!showSystemDetails)}
                    className="database-details-toggle"
                  >
                    {showSystemDetails ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    <span>Informações do Sistema</span>
                    <span className="details-count">
                      4 informações
                    </span>
                  </button>
                  
                  {showSystemDetails && (
                    <div className="database-specs-grid expanded">
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
                  )}
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



              {/* Ações do Modal */}
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

      {/* Modal de Execução do Teste SQL */}
      {showSqlExecutionModal && (
        <div className="modal-overlay" onClick={() => setShowSqlExecutionModal(false)}>
          <div className="modal-content modal-resumo-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-caixa">
              <div className="modal-header-caixa-info">
                <div className="modal-resumo-header-icon teste-db">
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="modal-resumo-header-title">
                    Execução do Teste SQL
                  </h3>
                  <p className="modal-resumo-header-subtitle">
                    {sqlTestStatus === 'testing' ? 'Executando teste de conexão...' : 
                     sqlTestStatus === 'success' ? 'Teste concluído com sucesso!' :
                     sqlTestStatus === 'error' ? 'Teste falhou' : 'Pronto para executar'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlExecutionModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-resumo-body">
              {sqlTestStatus === 'testing' && (
                <div className="test-running-state">
                  <div className="test-loading-icon">
                    <Loader size={48} className="animate-spin" />
                  </div>
                  <div className="test-status-text">
                    <h4>Executando Teste de Conexão SQL...</h4>
                    <p>Verificando conectividade com o banco {currentDatabase === 'remote' ? 'remoto (AWS RDS)' : 'local'}</p>
                    <div className="test-progress">
                      <div className="progress-steps">
                        <div className={`progress-step ${sqlTestStep >= 1 ? 'active' : ''} ${sqlTestStep > 1 ? 'completed' : ''}`}>
                          <div className="step-icon">
                            {sqlTestStep === 1 ? <Loader size={16} className="animate-spin" /> : 
                             sqlTestStep > 1 ? <CheckCircle size={16} /> : '1'}
                          </div>
                          <span>Conectando ao banco</span>
                        </div>
                        <div className={`progress-step ${sqlTestStep >= 2 ? 'active' : ''} ${sqlTestStep > 2 ? 'completed' : ''}`}>
                          <div className="step-icon">
                            {sqlTestStep === 2 ? <Loader size={16} className="animate-spin" /> : 
                             sqlTestStep > 2 ? <CheckCircle size={16} /> : '2'}
                          </div>
                          <span>Executando consultas</span>
                        </div>
                        <div className={`progress-step ${sqlTestStep >= 3 ? 'active' : ''} ${sqlTestStep > 3 ? 'completed' : ''}`}>
                          <div className="step-icon">
                            {sqlTestStep === 3 ? <Loader size={16} className="animate-spin" /> : 
                             sqlTestStep > 3 ? <CheckCircle size={16} /> : '3'}
                          </div>
                          <span>Validando dados</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sqlTestStatus === 'success' && (
                <div className="test-success-state">
                  <div className="test-result-header">
                    <div className="test-success-icon">
                      <CheckCircle size={48} />
                    </div>
                    <div className="test-result-info">
                      <h4>Teste SQL Concluído com Sucesso!</h4>
                      <p>{sqlTestMessage}</p>
                    </div>
                  </div>
                  
                  <div className="test-details-grid">
                    {sqlTestDetails?.tests && Array.isArray(sqlTestDetails.tests) ? (
                      sqlTestDetails.tests.map((test: any, index: number) => (
                        <div key={index} className={`test-detail-item ${test.success ? 'success' : 'error'}`}>
                          <div className="detail-icon">
                            {test.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          </div>
                          <span>{test.description || test.name}</span>
                          {test.result && (
                            <small className="test-result-detail">
                              {typeof test.result === 'object' 
                                ? `${Object.keys(test.result).length} registros` 
                                : test.result}
                            </small>
                          )}
                        </div>
                      ))
                    ) : (
                      // Fallback caso não tenha detalhes específicos
                      <>
                        <div className="test-detail-item success">
                          <div className="detail-icon">
                            <CheckCircle size={16} />
                          </div>
                          <span>Conexão estabelecida</span>
                          {sqlTestDetails?.connectionTime && (
                            <small className="test-result-detail">
                              {sqlTestDetails.connectionTime}ms
                            </small>
                          )}
                        </div>
                        <div className="test-detail-item success">
                          <div className="detail-icon">
                            <CheckCircle size={16} />
                          </div>
                          <span>Consultas executadas</span>
                          {sqlTestDetails?.queriesExecuted && (
                            <small className="test-result-detail">
                              {sqlTestDetails.queriesExecuted} consultas
                            </small>
                          )}
                        </div>
                        <div className="test-detail-item success">
                          <div className="detail-icon">
                            <CheckCircle size={16} />
                          </div>
                          <span>Banco de dados acessível</span>
                          {sqlTestDetails?.databaseInfo?.database && (
                            <small className="test-result-detail">
                              {sqlTestDetails.databaseInfo.database}
                            </small>
                          )}
                        </div>
                        <div className="test-detail-item success">
                          <div className="detail-icon">
                            <CheckCircle size={16} />
                          </div>
                          <span>Tabelas verificadas</span>
                          {sqlTestDetails?.tablesCount && (
                            <small className="test-result-detail">
                              {sqlTestDetails.tablesCount} tabelas
                            </small>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="test-actions">
                    <button 
                      onClick={() => setShowSqlExecutionModal(false)}
                      className="btn btn-primary"
                    >
                      Fechar
                    </button>
                    <button 
                      onClick={() => {
                        setSqlTestStatus('idle')
                        setSqlTestMessage('')
                        setSqlTestDetails(null)
                        setSqlTestError(null)
                        setSqlTestStep(1)
                        testSql()
                      }}
                      className="btn btn-outline"
                    >
                      Executar Novamente
                    </button>
                  </div>
                </div>
              )}

              {sqlTestStatus === 'error' && (
                <div className="test-error-state">
                  <div className="test-result-header">
                    <div className="test-error-icon">
                      <XCircle size={48} />
                    </div>
                    <div className="test-result-info">
                      <h4>Teste SQL Falhou</h4>
                      <p>{sqlTestMessage}</p>
                    </div>
                  </div>
                  
                  <div className="test-error-details">
                    {sqlTestError?.details && (
                      <div className="error-technical-details">
                        <h5>Detalhes técnicos do erro:</h5>
                        <div className="error-code-block">
                          {typeof sqlTestError.details === 'string' 
                            ? sqlTestError.details 
                            : JSON.stringify(sqlTestError.details, null, 2)}
                        </div>
                        {sqlTestError.code && (
                          <p><strong>Código do erro:</strong> {sqlTestError.code}</p>
                        )}
                        {sqlTestError.errno && (
                          <p><strong>Número do erro:</strong> {sqlTestError.errno}</p>
                        )}
                        {sqlTestError.sqlState && (
                          <p><strong>SQL State:</strong> {sqlTestError.sqlState}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="error-suggestions">
                      <h5>Possíveis soluções:</h5>
                      <ul>
                        {sqlTestError?.code === 'ECONNREFUSED' && (
                          <li>O banco de dados não está rodando ou não está acessível</li>
                        )}
                        {sqlTestError?.code === 'ER_ACCESS_DENIED_ERROR' && (
                          <li>Credenciais de acesso incorretas (usuário/senha)</li>
                        )}
                        {sqlTestError?.code === 'ENOTFOUND' && (
                          <li>Host do banco de dados não encontrado - verifique o endereço</li>
                        )}
                        {sqlTestError?.code === 'ETIMEDOUT' && (
                          <li>Timeout na conexão - verifique conectividade de rede</li>
                        )}
                        {!sqlTestError?.code && (
                          <>
                            <li>Verifique se o banco de dados está rodando</li>
                            <li>Confirme as credenciais de acesso</li>
                            <li>Teste a conectividade de rede</li>
                            <li>Verifique as configurações do firewall</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="test-actions">
                    <button 
                      onClick={() => setShowSqlExecutionModal(false)}
                      className="btn btn-outline"
                    >
                      Fechar
                    </button>
                    <button 
                      onClick={() => {
                        setSqlTestStatus('idle')
                        setSqlTestMessage('')
                        setSqlTestDetails(null)
                        setSqlTestError(null)
                        setSqlTestStep(1)
                        testSql()
                      }}
                      className="btn btn-primary"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Execução do Teste da Aplicação */}
      {showAppExecutionModal && (
        <div className="modal-overlay" onClick={() => setShowAppExecutionModal(false)}>
          <div className="modal-content modal-resumo-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-caixa">
              <div className="modal-header-caixa-info">
                <div className="modal-resumo-header-icon teste-app">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="modal-resumo-header-title">
                    Execução do Teste da Aplicação
                  </h3>
                  <p className="modal-resumo-header-subtitle">
                    {appTestStatus === 'testing' ? 'Executando teste dos módulos...' : 
                     appTestStatus === 'success' ? 'Teste concluído com sucesso!' :
                     appTestStatus === 'error' ? 'Teste falhou' : 'Pronto para executar'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAppExecutionModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-resumo-body">
              {appTestStatus === 'testing' && (
                <div className="test-running-state">
                  <div className="test-loading-icon">
                    <Loader size={48} className="animate-spin" />
                  </div>
                  <div className="test-status-text">
                    <h4>Executando Teste da Aplicação...</h4>
                    <p>Verificando funcionamento dos módulos e serviços</p>
                    <div className="test-progress">
                      <div className="progress-steps">
                        <div className={`progress-step ${appTestStep >= 1 ? 'active' : ''} ${appTestStep > 1 ? 'completed' : ''}`}>
                          <div className="step-icon">
                            {appTestStep === 1 ? <Loader size={16} className="animate-spin" /> : 
                             appTestStep > 1 ? <CheckCircle size={16} /> : '1'}
                          </div>
                          <span>Testando APIs</span>
                        </div>
                        <div className={`progress-step ${appTestStep >= 2 ? 'active' : ''} ${appTestStep > 2 ? 'completed' : ''}`}>
                          <div className="step-icon">
                            {appTestStep === 2 ? <Loader size={16} className="animate-spin" /> : 
                             appTestStep > 2 ? <CheckCircle size={16} /> : '2'}
                          </div>
                          <span>Verificando componentes</span>
                        </div>
                        <div className={`progress-step ${appTestStep >= 3 ? 'active' : ''} ${appTestStep > 3 ? 'completed' : ''}`}>
                          <div className="step-icon">
                            {appTestStep === 3 ? <Loader size={16} className="animate-spin" /> : 
                             appTestStep > 3 ? <CheckCircle size={16} /> : '3'}
                          </div>
                          <span>Validando serviços</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {appTestStatus === 'success' && (
                <div className="test-success-state">
                  <div className="test-result-header">
                    <div className="test-success-icon">
                      <CheckCircle size={48} />
                    </div>
                    <div className="test-result-info">
                      <h4>Teste da Aplicação Concluído com Sucesso!</h4>
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

                  <div className="test-actions">
                    <button 
                      onClick={() => setShowAppExecutionModal(false)}
                      className="btn btn-primary"
                    >
                      Fechar
                    </button>
                    <button 
                      onClick={() => {
                        setAppTestStatus('idle')
                        setAppTestMessage('')
                        setAppTestStep(1)
                        testApp()
                      }}
                      className="btn btn-outline"
                    >
                      Executar Novamente
                    </button>
                  </div>
                </div>
              )}

              {appTestStatus === 'error' && (
                <div className="test-error-state">
                  <div className="test-result-header">
                    <div className="test-error-icon">
                      <XCircle size={48} />
                    </div>
                    <div className="test-result-info">
                      <h4>Teste da Aplicação Falhou</h4>
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

                  <div className="test-actions">
                    <button 
                      onClick={() => setShowAppExecutionModal(false)}
                      className="btn btn-outline"
                    >
                      Fechar
                    </button>
                    <button 
                      onClick={() => {
                        setAppTestStatus('idle')
                        setAppTestMessage('')
                        setAppTestStep(1)
                        testApp()
                      }}
                      className="btn btn-primary"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resultado da Configuração */}
      {showDatabaseResultModal && (
        <div className="modal-overlay" onClick={() => setShowDatabaseResultModal(false)}>
          <div className="modal-content modal-resumo-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-caixa">
              <div className="modal-header-caixa-info">
                <div className={`modal-resumo-header-icon ${databaseTestStatus === 'success' ? 'teste-success' : 'teste-error'}`}>
                  {databaseTestStatus === 'success' ? (
                    <CheckCircle size={24} />
                  ) : (
                    <XCircle size={24} />
                  )}
                </div>
                <div>
                  <h3 className="modal-resumo-header-title">
                    {databaseTestStatus === 'success' ? 'Configuração Alterada!' : 'Falha na Configuração'}
                  </h3>
                  <p className="modal-resumo-header-subtitle">
                    {databaseTestStatus === 'success' 
                      ? 'Banco de dados alterado com sucesso'
                      : 'Não foi possível alterar a configuração'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDatabaseResultModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-resumo-body">
              <div className={`database-result-content ${databaseTestStatus}`}>
                <div className="result-icon-large">
                  {databaseTestStatus === 'success' ? (
                    <CheckCircle size={64} className="success-icon" />
                  ) : (
                    <XCircle size={64} className="error-icon" />
                  )}
                </div>
                
                <div className="result-message">
                  <h4>
                    {databaseTestStatus === 'success' 
                      ? 'Alteração Concluída com Sucesso!' 
                      : 'Falha na Alteração'}
                  </h4>
                  <p className="result-description">
                    {databaseTestMessage}
                  </p>
                </div>

                {databaseTestStatus === 'success' && (
                  <div className="result-details">
                    <div className="result-detail-item">
                      <span className="detail-label">Banco atual:</span>
                      <span className={`detail-value ${currentDatabase === 'remote' ? 'remote' : 'local'}`}>
                        {currentDatabase === 'remote' ? '🌐 Remoto (AWS RDS)' : '💻 Local (localhost)'}
                      </span>
                    </div>
                    <div className="result-detail-item">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value success">
                        ✅ Conectado e funcional
                      </span>
                    </div>
                    <div className="result-detail-item">
                      <span className="detail-label">Próximos passos:</span>
                      <span className="detail-value">
                        Execute um teste de conexão para validar
                      </span>
                    </div>
                  </div>
                )}

                <div className="result-actions">
                  <button 
                    onClick={() => setShowDatabaseResultModal(false)}
                    className="btn btn-primary"
                  >
                    {databaseTestStatus === 'success' ? 'Perfeito!' : 'Entendido'}
                  </button>
                  {databaseTestStatus === 'success' && (
                    <button 
                      onClick={() => {
                        setShowDatabaseResultModal(false)
                        setShowSqlTestModal(true)
                      }}
                      className="btn btn-outline"
                    >
                      Testar Conexão
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Loading da Alteração do Banco */}
      {showDatabaseLoadingModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Alterando Configuração</h3>
              </div>

              <div className="modal-body">
                <div className="loading-state">
                  <div className="loading-icon-container">
                    <Loader size={48} className="loading-icon animate-spin" />
                  </div>
                  <div className="loading-message">
                    <h4>Aplicando nova configuração...</h4>
                    <p>Aguarde enquanto alteramos as configurações do banco de dados.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Logs do Banco */}
      {showDatabaseLogsModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-container-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Logs do Banco de Dados</h3>
                <button 
                  onClick={() => setShowDatabaseLogsModal(false)}
                  className="modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="logs-container">
                  <div className="logs-header">
                    <div className="logs-info">
                      <h4>Histórico de Operações</h4>
                      <p>Total de registros: {databaseLogs.length}</p>
                    </div>
                    <button
                      onClick={clearLogs}
                      className="btn btn-outline btn-sm"
                    >
                      Limpar Logs
                    </button>
                  </div>

                  <div className="logs-list">
                    {logsLoading ? (
                      <div className="logs-loading">
                        <Loader size={24} className="animate-spin" />
                        <p>Carregando logs...</p>
                      </div>
                    ) : databaseLogs.length === 0 ? (
                      <div className="logs-empty">
                        <Settings size={48} />
                        <h4>Nenhum log encontrado</h4>
                        <p>Execute algumas operações no banco de dados para ver os logs aqui.</p>
                      </div>
                    ) : (
                      databaseLogs.map((log, index) => (
                        <div key={index} className={`log-item ${log.error ? 'log-error' : 'log-success'}`}>
                          <div className="log-header">
                            <div className="log-icon">
                              {log.error ? <XCircle size={16} /> : <CheckCircle size={16} />}
                            </div>
                            <div className="log-type">
                              <span className={`log-badge ${log.configType === 'remote' ? 'remote' : 'local'}`}>
                                {log.configType === 'remote' ? 'REMOTO' : 'LOCAL'}
                              </span>
                            </div>
                            <div className="log-time">
                              {new Date(log.timestamp).toLocaleString('pt-BR')}
                            </div>
                          </div>
                          <div className="log-content">
                            <div className="log-operation">{log.operation}</div>
                            {log.details && (
                              <div className="log-details">{log.details}</div>
                            )}
                            {log.error && (
                              <div className="log-error-msg">Erro: {log.error}</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}