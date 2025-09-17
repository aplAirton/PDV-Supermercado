"use client"

import { useState } from "react"
import { Database, Server, Settings, CheckCircle, XCircle, Loader } from "lucide-react"
import Modal from "@/components/modal"

export default function ConfiguracoesPage() {
  const [showSqlTestModal, setShowSqlTestModal] = useState(false)
  const [showAppTestModal, setShowAppTestModal] = useState(false)
  const [sqlTestStatus, setSqlTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [appTestStatus, setAppTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [sqlTestMessage, setSqlTestMessage] = useState('')
  const [appTestMessage, setAppTestMessage] = useState('')

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
    </div>
  )
}