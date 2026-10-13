import { useState, useEffect } from 'react'
import { healthService } from '../services/api'
import { Sparkles, RefreshCw, X, CheckCircle } from 'lucide-react'

export default function ColdStartBanner() {
  const [visivel, setVisivel] = useState(false)
  const [mensagem, setMensagem] = useState('O servidor gratuito no Render está acordando. Aguarde alguns segundos...')
  const [tentando, setTentando] = useState(false)
  const [recuperado, setRecuperado] = useState(false)

  useEffect(() => {
    const handleColdStart = (e) => {
      setMensagem(e.detail?.message || 'O servidor gratuito no Render está acordando. Aguarde alguns segundos...')
      setVisivel(true)
      setRecuperado(false)
    }

    const handleServerOnline = () => {
      if (visivel) {
        setRecuperado(true)
        setTimeout(() => {
          setVisivel(false)
          setRecuperado(false)
        }, 2500)
      }
    }

    window.addEventListener('server-cold-start', handleColdStart)
    window.addEventListener('server-online', handleServerOnline)

    return () => {
      window.removeEventListener('server-cold-start', handleColdStart)
      window.removeEventListener('server-online', handleServerOnline)
    }
  }, [visivel])

  const testarConexao = async () => {
    setTentando(true)
    try {
      await healthService.checkHealth()
      setRecuperado(true)
      setTimeout(() => {
        setVisivel(false)
        setRecuperado(false)
      }, 2000)
    } catch (err) {
      console.warn('Servidor ainda em cold start:', err)
    } finally {
      setTentando(false)
    }
  }

  if (!visivel) return null

  return (
    <aside className="cold-start-banner" role="status" aria-live="polite">
      <div className="cold-start-content">
        {recuperado ? (
          <>
            <CheckCircle size={20} className="icon-success" />
            <span className="cold-start-text">
              <strong>Servidor Conectado!</strong> O sistema da CPTM está pronto para jogar.
            </span>
          </>
        ) : (
          <>
            <Sparkles size={20} className="icon-pulse" />
            <span className="cold-start-text">
              <strong>Servidor em Inicialização:</strong> {mensagem}
            </span>
            <button
              type="button"
              onClick={testarConexao}
              disabled={tentando}
              className="btn btn-cold-start-retry"
              title="Testar resposta do servidor"
            >
              <RefreshCw size={14} className={tentando ? 'spin' : ''} />
              <span>{tentando ? 'Verificando...' : 'Testar agora'}</span>
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setVisivel(false)}
          className="btn-cold-start-close"
          aria-label="Fechar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  )
}
