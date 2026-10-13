import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6)
    const newToast = { id, type, title, message }
    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  const toast = {
    success: (message, title = 'Sucesso nos Trilhos') => addToast({ type: 'success', title, message }),
    error: (message, title = 'Aviso da Estação') => addToast({ type: 'error', title, message }),
    warning: (message, title = 'Atenção, Passageiro') => addToast({ type: 'warning', title, message }),
    info: (message, title = 'Informação') => addToast({ type: 'info', title, message }),
  }

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
    // Fallback seguro caso usado fora do provider
    return {
      success: (m) => console.log('Toast success:', m),
      error: (m) => console.error('Toast error:', m),
      warning: (m) => console.warn('Toast warning:', m),
      info: (m) => console.info('Toast info:', m),
    }
  }
  return context
}
