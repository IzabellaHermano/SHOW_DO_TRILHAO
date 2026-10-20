import React from 'react'
import CptmLogo from './CptmLogo'
import GameLogo from './GameLogo'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Show do Trilhão - Erro capturado pelo ErrorBoundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #001233 0%, #300008 50%, #4a000d 100%)',
          color: '#ffffff',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(70, 0, 10, 0.95)',
            border: '1.5px solid rgba(255, 255, 255, 0.45)',
            borderRadius: '16px',
            padding: '2.5rem 1.75rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <CptmLogo size="md" />
              <div style={{ height: '24px', width: '1px', background: 'rgba(255, 255, 255, 0.3)' }} />
              <GameLogo size="xs" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFC629', marginBottom: '0.75rem' }}>
              Falha Temporária nos Trilhos
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Ocorreu uma instabilidade na renderização desta estação. Clique abaixo para reconectar com segurança.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
