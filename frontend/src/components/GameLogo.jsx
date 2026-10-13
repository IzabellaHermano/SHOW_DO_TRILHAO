import gameLogoImg from '../assets/logo.png'

export default function GameLogo({
  size = 'lg', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  style = {},
  alt = 'Show do Trilhão — Logotipo Oficial CPTM',
}) {
  const sizeClasses = {
    xs: 'game-logo-xs', // ~40px de altura (HUD / Perguntas)
    sm: 'game-logo-sm', // ~65px de altura (Lobby mobile)
    md: 'game-logo-md', // ~100px de altura (Modais / Cabeçalhos)
    lg: 'game-logo-lg', // ~160px de altura (Transição / Pódio)
    xl: 'game-logo-xl', // ~230px de altura (Home Hero Principal)
  }

  const szClass = sizeClasses[size] || sizeClasses.lg

  return (
    <div className={`game-logo-wrapper ${szClass} ${className}`} style={style}>
      <img
        src={gameLogoImg}
        alt={alt}
        className="game-logo-image"
        loading="eager"
        decoding="async"
      />
    </div>
  )
}
