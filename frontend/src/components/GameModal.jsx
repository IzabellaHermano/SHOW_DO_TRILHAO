import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function GameModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  size = 'md', // 'sm' | 'md' | 'lg'
  maxWidth = null,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="game-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className={`game-modal-container modal-${size}`}
        style={maxWidth ? { maxWidth } : {}}
      >
        <div className="game-modal-header">
          <div className="game-modal-title-group">
            {Icon && <Icon size={24} className="game-modal-icon" />}
            <h3 className="game-modal-title">{title}</h3>
          </div>
          {onClose && (
            <button
              type="button"
              className="game-modal-close"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="game-modal-body">{children}</div>
      </div>
    </div>
  )
}
