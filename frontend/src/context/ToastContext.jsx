import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  // Ref para controlar cooldown de mensagens duplicadas (evita spam de toasts idênticos)
  const recentMessagesRef = useRef(new Map())
  // Ref para controlar estado de conexão e evitar notificações repetidas
  const connectionStateRef = useRef({ isOffline: false })

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
    if (!message) return

    const key = `${type}::${title || ''}::${message}`
    const now = Date.now()
    const lastShown = recentMessagesRef.current.get(key)

    // Se a mesma notificação foi disparada nos últimos 5 segundos, ignora para não floodar
    if (lastShown && now - lastShown < 5000) {
      return
    }
    recentMessagesRef.current.set(key, now)

    // Limpa chaves antigas do mapa após 15 segundos
    setTimeout(() => {
      recentMessagesRef.current.delete(key)
    }, 15000)

    const id = `${now}_${Math.random().toString(36).substring(2, 6)}`
    const newToast = { id, type, title, message }

    setToasts((prev) => {
      // Limita a no máximo 3 notificações visíveis simultaneamente
      const filtered = prev.filter((t) => !(t.type === type && t.message === message))
      const updated = [...filtered, newToast]
      return updated.slice(-3)
    })

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  // Tratamento específico de status de conexão solicitado nos requisitos
  const notifyConnectionLost = useCallback(() => {
    if (!connectionStateRef.current.isOffline) {
      connectionStateRef.current.isOffline = true
      addToast({
        type: 'warning',
        title: 'Aviso da Estação',
        message: 'Conexão interrompida. Tentando reconectar...',
        duration: 5000,
      })
    }
  }, [addToast])

  const notifyConnectionRestored = useCallback(() => {
    if (connectionStateRef.current.isOffline) {
      connectionStateRef.current.isOffline = false
      addToast({
        type: 'success',
        title: 'Estação Conectada',
        message: 'Conexão restabelecida! Sua viagem continua.',
        duration: 4000,
      })
    }
  }, [addToast])

  // Métodos estáveis e memoizados para não recriar a referência do objeto toast
  const success = useCallback((message, title = 'Sucesso nos Trilhos') => {
    addToast({ type: 'success', title, message })
  }, [addToast])

  const error = useCallback((message, title = 'Aviso da Estação') => {
    addToast({ type: 'error', title, message })
  }, [addToast])

  const warning = useCallback((message, title = 'Atenção, Passageiro') => {
    addToast({ type: 'warning', title, message })
  }, [addToast])

  const info = useCallback((message, title = 'Informação') => {
    addToast({ type: 'info', title, message })
  }, [addToast])

  const toast = useMemo(
    () => ({
      success,
      error,
      warning,
      info,
      notifyConnectionLost,
      notifyConnectionRestored,
    }),
    [success, error, warning, info, notifyConnectionLost, notifyConnectionRestored]
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="game-toast-container" role="region" aria-label="Notificações">
        {toasts.map((t) => (
          <div key={t.id} className={`game-toast game-toast-${t.type}`} role="alert">
            <div className="game-toast-icon">
              {t.type === 'success' && <CheckCircle2 size={22} />}
              {t.type === 'error' && <AlertCircle size={22} />}
              {t.type === 'warning' && <AlertTriangle size={22} />}
              {t.type === 'info' && <Info size={22} />}
            </div>
            <div className="game-toast-body">
              {t.title && <div className="game-toast-title">{t.title}</div>}
              <div className="game-toast-message">{t.message}</div>
            </div>
            <button
              type="button"
              className="game-toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      success: (m) => console.log('Toast success:', m),
      error: (m) => console.error('Toast error:', m),
      warning: (m) => console.warn('Toast warning:', m),
      info: (m) => console.info('Toast info:', m),
      notifyConnectionLost: () => console.warn('Conexão perdida'),
      notifyConnectionRestored: () => console.info('Conexão restabelecida'),
    }
  }
  return context
}
