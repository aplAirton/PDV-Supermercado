"use client"

import { useState, useEffect } from "react"
import { Database, Server, Settings, CheckCircle, XCircle, Loader, HardDrive } from "lucide-react"
import Modal from "@/components/modal"

export default function ConfiguracoesPage() {
  const [showSqlTestModal, setShowSqlTestModal] = useState(false)
  const [showAppTestModal, setShowAppTestModal] = useState(false)
  const [showDatabaseModal, setShowDatabaseModal] = useState(false)
  const [showDatabaseConfirmModal, setShowDatabaseConfirmModal] = useState(false)
  const [showDatabaseProgressModal, setShowDatabaseProgressModal] = useState(false)
  const [showDatabaseResultModal, setShowDatabaseResultModal] = useState(false)
  const [selectedDatabaseType, setSelectedDatabaseType] = useState<'remote' | 'local' | null>(null)
  const [sqlTestStatus, setSqlTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [appTestStatus, setAppTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [sqlTestMessage, setSqlTestMessage] = useState('')
  const [appTestMessage, setAppTestMessage] = useState('')
  const [currentDatabase, setCurrentDatabase] = useState<'remote' | 'local'>('remote')
  const [databaseTestStatus, setDatabaseTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [databaseTestMessage, setDatabaseTestMessage] = useState('')
  const [progressSteps, setProgressSteps] = useState<Array<{
    id: string
    label: string
    status: 'pending' | 'active' | 'completed' | 'error'
    message?: string
  }>>([])
  const [finalResult, setFinalResult] = useState<{
    success: boolean
    title: string
    message: string
    details?: string
  } | null>(null)

  // Carregar configuração atual do banco de dados
  useEffect(() => {
    const savedDatabase = localStorage.getItem('database_config') as 'remote' | 'local'
    if (savedDatabase) {
      setCurrentDatabase(savedDatabase)
    }
  }, [])

  const handleDatabaseOptionClick = (type: 'remote' | 'local') => {
    if (type === currentDatabase) {
      return // Já está selecionado
    }
    setSelectedDatabaseType(type)
    setShowDatabaseModal(false)
    setShowDatabaseConfirmModal(true)
  }

  const confirmDatabaseChange = () => {
    if (!selectedDatabaseType) return
    
    setShowDatabaseConfirmModal(false)
    setShowDatabaseProgressModal(true)
    
    // Inicializar os passos do progresso
    setProgressSteps([
      { id: 'config', label: 'Alterando configuração', status: 'pending' },
      { id: 'reload', label: 'Recarregando sistema', status: 'pending' },
      { id: 'test', label: 'Testando conexão', status: 'pending' },
      { id: 'finalize', label: 'Finalizando alteração', status: 'pending' }
    ])
    
    changeDatabaseConfig(selectedDatabaseType)
  }

  const updateProgressStep = (stepId: string, status: 'active' | 'completed' | 'error', message?: string) => {
    setProgressSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message }
        : step
    ))
  }

  const changeDatabaseConfig = async (type: 'remote' | 'local') => {
    try {
      // Passo 1: Alterar configuração
      updateProgressStep('config', 'active', 'Salvando nova configuração...')
      localStorage.setItem('database_config', type)
      setCurrentDatabase(type)
      await new Promise(resolve => setTimeout(resolve, 800)) // Simular tempo de processamento
      updateProgressStep('config', 'completed', 'Configuração salva com sucesso')

      // Passo 2: Recarregar sistema
      updateProgressStep('reload', 'active', 'Enviando alteração para o servidor...')
      const response = await fetch('/api/database/reload-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type })
      })

      if (!response.ok) {
        throw new Error('Falha ao recarregar configuração no servidor')
      }
      
      updateProgressStep('reload', 'completed', 'Sistema recarregado com sucesso')

      // Passo 3: Testar conexão
      updateProgressStep('test', 'active', `Testando conexão com banco ${type === 'remote' ? 'remoto' : 'local'}...`)
      const testResponse = await fetch(`/api/testes/sql-connection?config=${type}`)
      const testData = await testResponse.json()

      if (testResponse.ok && testData.success) {
        updateProgressStep('test', 'completed', 'Conexão testada com sucesso')
        
        // Passo 4: Finalizar
        updateProgressStep('finalize', 'active', 'Aplicando alterações...')
        await new Promise(resolve => setTimeout(resolve, 500))
        updateProgressStep('finalize', 'completed', 'Alteração concluída')

        // Definir resultado final
        setFinalResult({
          success: true,
          title: 'Configuração alterada com sucesso!',
          message: `Banco de dados alterado para ${type === 'remote' ? 'remoto (AWS RDS)' : 'local (localhost)'}`,
          details: testData.details
        })
      } else {
        updateProgressStep('test', 'error', testData.error || 'Erro no teste de conexão')
        setFinalResult({
          success: false,
          title: 'Problema na conexão',
          message: `A configuração foi alterada, mas houve problema na conexão com o banco ${type === 'remote' ? 'remoto' : 'local'}`,
          details: testData.error
        })
      }

      // Mostrar resultado final após breve delay
      setTimeout(() => {
        setShowDatabaseProgressModal(false)
        setShowDatabaseResultModal(true)
      }, 1000)

    } catch (error) {
      console.error('Erro ao alterar configuração do banco:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      // Marcar passo atual como erro
      const currentStep = progressSteps.find(step => step.status === 'active')
      if (currentStep) {
        updateProgressStep(currentStep.id, 'error', errorMessage)
      }

      setFinalResult({
        success: false,
        title: 'Erro na alteração',
        message: 'Não foi possível alterar a configuração do banco de dados',
        details: errorMessage
      })

      setTimeout(() => {
        setShowDatabaseProgressModal(false)
        setShowDatabaseResultModal(true)
      }, 1500)
    }
  }

  const testSqlConnection = async () => {
    setSqlTestStatus('testing')
    setSqlTestMessage('Testando conexão com o banco de dados...')

    try {
      const response = await fetch('/api/testes/sql-connection')
      const data = await response.json()

      if (response.ok && data.success) {
        setSqlTestStatus('success')
        setSqlTestMessage(`✅ Conexão bem-sucedida!\n\nDetalhes:\n${data.details}`)
      } else {
        setSqlTestStatus('error')
        setSqlTestMessage(`❌ Falha na conexão:\n\n${data.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      setSqlTestStatus('error')
      setSqlTestMessage(`❌ Erro de rede:\n\n${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const testAppServer = async () => {
    setAppTestStatus('testing')
    setAppTestMessage('Testando servidor da aplicação...')

    try {
      const response = await fetch('/api/testes/app-server')
      const data = await response.json()

      if (response.ok && data.success) {
        setAppTestStatus('success')
        setAppTestMessage(`✅ Servidor funcionando!\n\nDetalhes:\n${data.details}`)
      } else {
        setAppTestStatus('error')
        setAppTestMessage(`❌ Servidor com problemas:\n\n${data.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      setAppTestStatus('error')
      setAppTestMessage(`❌ Erro de rede:\n\n${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  return (
    <div className="configuracoes-container">
      <div className="page-header">
        <div className="header-icon">
          <Settings size={32} />
        </div>
        <div className="header-content">
          <h1 className="page-title">Configurações do Sistema</h1>
          <p className="page-subtitle">Testes de conectividade e configurações gerais</p>
        </div>
      </div>

      <div className="configuracoes-content">
        <div className="test-section">
          <h2 className="section-title">Testes de Conectividade</h2>

          <div className="test-cards">
            <div className="test-card">
              <div className="test-card-header">
                <Database size={24} className="test-icon sql-icon" />
                <h3>Teste de Servidor SQL</h3>
              </div>
              <p className="test-description">
                Verifica a conectividade com o banco de dados MySQL/MariaDB
              </p>
              <button
                className="btn btn-primary test-btn"
                onClick={() => setShowSqlTestModal(true)}
              >
                Executar Teste
              </button>
            </div>

            <div className="test-card">
              <div className="test-card-header">
                <Server size={24} className="test-icon app-icon" />
                <h3>Teste do Servidor da Aplicação</h3>
              </div>
              <p className="test-description">
                Verifica se o servidor Next.js está respondendo corretamente
              </p>
              <button
                className="btn btn-primary test-btn"
                onClick={() => setShowAppTestModal(true)}
              >
                Executar Teste
              </button>
            </div>

            <div className="test-card">
              <div className="test-card-header">
                <HardDrive size={24} className="test-icon database-icon" />
                <h3>Banco de Dados</h3>
              </div>
              <p className="test-description">
                Alternar entre banco de dados remoto e local
              </p>
              <div className="database-status">
                <span className={`status-badge ${currentDatabase}`}>
                  {currentDatabase === 'remote' ? 'Remoto' : 'Local'}
                </span>
              </div>
              <button
                className="btn btn-outline test-btn"
                onClick={() => setShowDatabaseModal(true)}
              >
                Alterar Configuração
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Teste SQL */}
      <Modal
        isOpen={showSqlTestModal}
        onClose={() => {
          setShowSqlTestModal(false)
          setSqlTestStatus('idle')
          setSqlTestMessage('')
        }}
        title="Teste de Conexão SQL"
      >
        <div className="test-modal-content">
          <div className="test-status">
            {sqlTestStatus === 'idle' && (
              <div className="status-info">
                <Database size={48} />
                <p>Clique em "Iniciar Teste" para verificar a conexão com o banco de dados.</p>
              </div>
            )}

            {sqlTestStatus === 'testing' && (
              <div className="status-testing">
                <Loader size={48} className="spinning" />
                <p>{sqlTestMessage}</p>
              </div>
            )}

            {sqlTestStatus === 'success' && (
              <div className="status-success">
                <CheckCircle size={48} />
                <pre className="test-result">{sqlTestMessage}</pre>
              </div>
            )}

            {sqlTestStatus === 'error' && (
              <div className="status-error">
                <XCircle size={48} />
                <pre className="test-result error">{sqlTestMessage}</pre>
              </div>
            )}
          </div>

          <div className="test-modal-actions">
            {sqlTestStatus === 'idle' && (
              <button
                className="btn btn-primary"
                onClick={testSqlConnection}
              >
                Iniciar Teste
              </button>
            )}

            {sqlTestStatus !== 'idle' && (
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSqlTestStatus('idle')
                  setSqlTestMessage('')
                }}
              >
                Testar Novamente
              </button>
            )}

            <button
              className="btn btn-outline"
              onClick={() => {
                setShowSqlTestModal(false)
                setSqlTestStatus('idle')
                setSqlTestMessage('')
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Teste da Aplicação */}
      <Modal
        isOpen={showAppTestModal}
        onClose={() => {
          setShowAppTestModal(false)
          setAppTestStatus('idle')
          setAppTestMessage('')
        }}
        title="Teste do Servidor da Aplicação"
      >
        <div className="test-modal-content">
          <div className="test-status">
            {appTestStatus === 'idle' && (
              <div className="status-info">
                <Server size={48} />
                <p>Clique em "Iniciar Teste" para verificar se o servidor da aplicação está funcionando.</p>
              </div>
            )}

            {appTestStatus === 'testing' && (
              <div className="status-testing">
                <Loader size={48} className="spinning" />
                <p>{appTestMessage}</p>
              </div>
            )}

            {appTestStatus === 'success' && (
              <div className="status-success">
                <CheckCircle size={48} />
                <pre className="test-result">{appTestMessage}</pre>
              </div>
            )}

            {appTestStatus === 'error' && (
              <div className="status-error">
                <XCircle size={48} />
                <pre className="test-result error">{appTestMessage}</pre>
              </div>
            )}
          </div>

          <div className="test-modal-actions">
            {appTestStatus === 'idle' && (
              <button
                className="btn btn-primary"
                onClick={testAppServer}
              >
                Iniciar Teste
              </button>
            )}

            {appTestStatus !== 'idle' && (
              <button
                className="btn btn-outline"
                onClick={() => {
                  setAppTestStatus('idle')
                  setAppTestMessage('')
                }}
              >
                Testar Novamente
              </button>
            )}

            <button
              className="btn btn-outline"
              onClick={() => {
                setShowAppTestModal(false)
                setAppTestStatus('idle')
                setAppTestMessage('')
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Configuração do Banco de Dados */}
      <Modal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        title="Configuração do Banco de Dados"
      >
        <div className="database-modal-content">
          <p className="database-modal-description">
            Escolha qual banco de dados deseja utilizar. A alteração será aplicada imediatamente e a página será recarregada.
          </p>

          <div className="database-options">
            <div
              className={`database-option ${currentDatabase === 'remote' ? 'selected' : ''}`}
              onClick={() => handleDatabaseOptionClick('remote')}
            >
              <div className="option-header">
                <Server size={32} />
                <h4>Banco Remoto (AWS RDS)</h4>
                {currentDatabase === 'remote' && <CheckCircle size={20} className="check-icon" />}
              </div>
              <p>Conecta ao banco de dados na nuvem (Amazon RDS)</p>
              <div className="option-details">
                <small>Host: associacao.cjcs4o2mmp5e.us-east-2.rds.amazonaws.com</small><br />
                <small>Banco: pdv_supermercado</small>
              </div>
            </div>

            <div
              className={`database-option ${currentDatabase === 'local' ? 'selected' : ''}`}
              onClick={() => handleDatabaseOptionClick('local')}
            >
              <div className="option-header">
                <HardDrive size={32} />
                <h4>Banco Local</h4>
                {currentDatabase === 'local' && <CheckCircle size={20} className="check-icon" />}
              </div>
              <p>Conecta ao banco de dados local (localhost)</p>
              <div className="option-details">
                <small>Host: localhost</small><br />
                <small>Banco: pdv_supermercado</small>
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
                <span>Teste de Conexão</span>
              </div>
              <div className="test-status-message">
                {databaseTestMessage.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>
          )}

          <div className="database-modal-warning">
            <strong>⚠️ Atenção:</strong> A alteração da configuração do banco de dados irá recarregar a página e pode afetar todas as operações do sistema.
          </div>

          <div className="database-modal-actions">
            <button
              className="btn btn-outline"
              onClick={() => setShowDatabaseModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação da Alteração do Banco */}
      <Modal
        isOpen={showDatabaseConfirmModal}
        onClose={() => {
          setShowDatabaseConfirmModal(false)
          setSelectedDatabaseType(null)
        }}
        title="Confirmar Alteração do Banco de Dados"
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
                <li>Recarregar a aplicação se bem-sucedida</li>
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
            >
              Confirmar Alteração
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Progresso da Alteração */}
      <Modal
        isOpen={showDatabaseProgressModal}
        onClose={() => {}} // Não permite fechar durante o processo
        title="Alterando Configuração do Banco"
      >
        <div className="database-progress-content">
          <div className="progress-header">
            <div className="progress-icon">
              {selectedDatabaseType === 'remote' ? <Server size={32} /> : <HardDrive size={32} />}
            </div>
            <p>Alterando para banco {selectedDatabaseType === 'remote' ? 'remoto (AWS RDS)' : 'local (localhost)'}...</p>
          </div>

          <div className="progress-steps">
            {progressSteps.map((step, index) => (
              <div key={step.id} className={`progress-step ${step.status}`}>
                <div className="step-indicator">
                  {step.status === 'pending' && <div className="step-number">{index + 1}</div>}
                  {step.status === 'active' && <Loader size={16} className="step-loader" />}
                  {step.status === 'completed' && <CheckCircle size={16} className="step-check" />}
                  {step.status === 'error' && <XCircle size={16} className="step-error" />}
                </div>
                <div className="step-content">
                  <div className="step-label">{step.label}</div>
                  {step.message && <div className="step-message">{step.message}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal de Resultado Final */}
      <Modal
        isOpen={showDatabaseResultModal}
        onClose={() => setShowDatabaseResultModal(false)}
        title={finalResult?.success ? "Alteração Concluída" : "Problema na Alteração"}
      >
        <div className="database-result-content">
          <div className={`result-icon ${finalResult?.success ? 'success' : 'error'}`}>
            {finalResult?.success ? <CheckCircle size={48} /> : <XCircle size={48} />}
          </div>

          <div className="result-message">
            <h3>{finalResult?.title}</h3>
            <p>{finalResult?.message}</p>
            
            {finalResult?.details && (
              <div className="result-details">
                <h4>Detalhes:</h4>
                <div className="details-content">
                  {finalResult.details.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="result-actions">
            {finalResult?.success ? (
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setShowDatabaseResultModal(false)
                    setFinalResult(null)
                    setSelectedDatabaseType(null)
                  }}
                >
                  Fechar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Recarregar Aplicação
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setShowDatabaseResultModal(false)
                    setFinalResult(null)
                    setSelectedDatabaseType(null)
                    setShowDatabaseModal(true)
                  }}
                >
                  Tentar Novamente
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDatabaseResultModal(false)
                    setFinalResult(null)
                    setSelectedDatabaseType(null)
                  }}
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}