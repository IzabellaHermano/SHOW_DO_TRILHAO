import React from 'react'

/**
 * Componente oficial e reutilizável de Botão do Show do Trilhão
 * Variantes:
 *  - 'primary': Verde de ação principal (letreiro de TV, alto contraste)
 *  - 'secondary': Fundo translúcido com borda branca fina
 *  - 'danger': Vermelho de perigo (abandonar/excluir/fechar)
 *  - 'subtle': Discreto / ghost
 *  - 'gold': Destaque dourado (iniciar partida / prêmio)
 *
 * Tamanhos:
 *  - 'sm': 40px
 *  - 'md': 48px (toque padrão)
 *  - 'lg': 54px
 *  - 'xl': 60px
 */
export default function GameButton({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  icon = null,
  iconRight = null,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  onClick,
  id,
  title,
  style = {},
  ...props
}) {
  const variantClass = {
    primary: 'game-btn-primary',
    secondary: 'game-btn-secondary',
    danger: 'game-btn-danger',
    subtle: 'game-btn-subtle',
    gold: 'game-btn-gold',
  }[variant] || 'game-btn-primary'

  const sizeClass = {
    sm: 'game-btn-sm',
    md: 'game-btn-md',
    lg: 'game-btn-lg',
    xl: 'game-btn-xl',
  }[size] || 'game-btn-md'

  const blockClass = block ? 'game-btn-block' : ''

  const renderIcon = (iconProp, isRight = false) => {
    if (!iconProp) return null
    if (React.isValidElement(iconProp)) {
      return <span className={isRight ? 'game-btn-icon-right' : 'game-btn-icon'} aria-hidden="true">{iconProp}</span>
    }
    const IconComp = iconProp
    return <IconComp size={size === 'sm' ? 16 : size === 'xl' ? 24 : 20} className={isRight ? 'game-btn-icon-right' : 'game-btn-icon'} aria-hidden="true" />
  }

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      style={style}
      className={`game-btn ${variantClass} ${sizeClass} ${blockClass} ${className}`.trim()}
      {...props}
    >
      {renderIcon(icon, false)}
      <span className="game-btn-text">{loading ? 'Aguarde...' : children}</span>
      {renderIcon(iconRight, true)}
    </button>
  )
}
