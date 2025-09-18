'use client'

import { useState, useEffect } from 'react'
import { generateMasterPasswordForTime, getMasterPasswordInfo } from '@/lib/master-password'

export default function MasterPasswordTestPage() {
  const [currentInfo, setCurrentInfo] = useState<any>(null)
  const [testTime, setTestTime] = useState('')
  const [testResult, setTestResult] = useState('')
  
  useEffect(() => {
    // Atualizar informações a cada segundo
    const interval = setInterval(() => {
      setCurrentInfo(getMasterPasswordInfo())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const testTimePassword = () => {
    if (testTime.match(/^\d{2}:\d{2}$/)) {
      const password = generateMasterPasswordForTime(testTime)
      setTestResult(password)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Teste do Sistema de Senha Mestra</h1>
      
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h2>🔐 Senha Atual (Tempo Real)</h2>
        {currentInfo && (
          <div>
            <p><strong>Hora Atual:</strong> {currentInfo.currentTime}</p>
            <p><strong>Número da Hora:</strong> {currentInfo.timeNumber}</p>
            <p><strong>Elevado ao Quadrado:</strong> {currentInfo.squared.toLocaleString()}</p>
            <p><strong>Dividido por π (3.14):</strong> {currentInfo.dividedByPI.toFixed(2)}</p>
            <p><strong>Senha Mestra:</strong> <code style={{ background: '#e5e7eb', padding: '4px 8px', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold' }}>{currentInfo.masterPassword}</code></p>
            <p><strong>Cálculo:</strong> {currentInfo.calculation}</p>
          </div>
        )}
      </div>

      <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h2>⚠️ Como Funciona</h2>
        <ol>
          <li><strong>Captura da Hora:</strong> Pega hora atual no formato 24h (ex: 12:45 = 1245)</li>
          <li><strong>Elevação ao Quadrado:</strong> 1245² = 1,550,025</li>
          <li><strong>Divisão por π:</strong> 1,550,025 ÷ 3.14 = 493,642...</li>
          <li><strong>Extração da Senha:</strong> Pega os 4 primeiros dígitos → 4936</li>
        </ol>
      </div>

      <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h2>🧪 Teste com Hora Específica</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <input
            type="time"
            value={testTime}
            onChange={(e) => setTestTime(e.target.value)}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
          <button
            onClick={testTimePassword}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Calcular
          </button>
        </div>
        {testResult && (
          <p><strong>Senha para {testTime}:</strong> <code style={{ background: '#e5e7eb', padding: '4px 8px', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold' }}>{testResult}</code></p>
        )}
      </div>

      <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '8px' }}>
        <h2>🛡️ Segurança</h2>
        <ul>
          <li><strong>Baseada em Tempo:</strong> A senha muda a cada minuto</li>
          <li><strong>Cálculo Determinístico:</strong> Mesma hora sempre gera mesma senha</li>
          <li><strong>Tolerância:</strong> Sistema aceita ±1 minuto para compensar atrasos na digitação</li>
          <li><strong>Validação no Servidor:</strong> Cálculo e validação sempre do lado servidor</li>
          <li><strong>Não Armazenada:</strong> Senha nunca é armazenada, sempre calculada</li>
        </ul>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', background: '#e0f2fe', borderRadius: '8px' }}>
        <p><strong>💡 Exemplos de Teste:</strong></p>
        <ul>
          <li>12:45 → Senha: {generateMasterPasswordForTime('12:45')}</li>
          <li>08:30 → Senha: {generateMasterPasswordForTime('08:30')}</li>
          <li>23:59 → Senha: {generateMasterPasswordForTime('23:59')}</li>
          <li>00:01 → Senha: {generateMasterPasswordForTime('00:01')}</li>
        </ul>
      </div>
    </div>
  )
}