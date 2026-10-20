import React from 'react'

/**
 * Componente oficial de Card do Show do Trilhão
 * Estética fixa: caixa vermelha escura com borda branca fina arredondada
 */
export default function GameCard({
  children,
  title = null,
  subtitle = null,
  headerAction = null,
  className = '',
  style = {},
  variant = 'default', // 'default' | 'elevated' | 'compact'
  ...props
}) {
  return (
    <div className={`game-card game-card-${variant} ${className}`.trim()} style={style} {...props}>
      {(title || subtitle || headerAction) && (
        <div className="game-card-header">
          <div>
            {title && <h3 className="game-card-title">{title}</h3>}
            {subtitle && <p className="game-card-subtitle">{subtitle}</p>}
          </div>
          {headerAction && <div className="game-card-action">{headerAction}</div>}
        </div>
      )}
      <div className="game-card-body">{children}</div>
    </div>
  )
}
