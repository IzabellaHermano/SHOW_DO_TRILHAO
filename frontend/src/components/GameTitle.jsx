export default function GameTitle({ size = 'lg', subtitle = null, gold = false, className = '' }) {
  const sizeClasses = {
    sm: 'game-title-sm',
    md: 'game-title-md',
    lg: 'game-title-lg',
    xl: 'game-title-xl',
  }

  const szClass = sizeClasses[size] || sizeClasses.lg

  return (
    <div className={`game-title-container ${szClass} ${gold ? 'gold-theme' : ''} ${className}`}>
      <div className="game-title-wrapper">
        <span className="game-title-top">SHOW DO</span>
        <div className="game-title-main">
          <span className="trilhao-text">TRILH</span>
          <span className="trilhao-slash-a">
            <span className="a-char">Ã</span>
            <span className="red-track-slash" aria-hidden="true" />
          </span>
          <span className="trilhao-text">O</span>
        </div>
      </div>
      {subtitle && <p className="game-title-subtitle">{subtitle}</p>}
    </div>
  )
}
