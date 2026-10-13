import cptmLogoImg from '../assets/cptm-logo.png'
import cptmLogoWhiteImg from '../assets/cptm-logo-white.png'

export default function CptmLogo({
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant = 'default', // 'default' | 'white'
  className = '',
  style = {},
  alt = 'CPTM — Companhia Paulista de Trens Metropolitanos',
}) {
  const sizeClasses = {
    xs: 'cptm-logo-xs', // ~24px altura
    sm: 'cptm-logo-sm', // ~32px altura
    md: 'cptm-logo-md', // ~42px altura
    lg: 'cptm-logo-lg', // ~56px altura
    xl: 'cptm-logo-xl', // ~72px altura
  }

  const szClass = sizeClasses[size] || sizeClasses.md
  const logoSrc = variant === 'white' ? cptmLogoWhiteImg : cptmLogoImg

  return (
    <div className={`cptm-logo-wrapper ${szClass} ${className}`} style={style}>
      <img
        src={logoSrc}
        alt={alt}
        className="cptm-logo-image"
        loading="eager"
        decoding="async"
      />
    </div>
  )
}
