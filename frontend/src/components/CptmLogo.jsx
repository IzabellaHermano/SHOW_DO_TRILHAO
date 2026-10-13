export default function CptmLogo({ size = 'md', showText = true, className = '' }) {
  const pixelSizes = {
    sm: { icon: 20, font: '0.85rem' },
    md: { icon: 28, font: '1.1rem' },
    lg: { icon: 38, font: '1.4rem' },
    xl: { icon: 48, font: '1.75rem' },
  }

  const s = pixelSizes[size] || pixelSizes.md

  return (
    <div className={`cptm-brand-badge ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
      {/* Símbolo oficial CPTM em losango vermelho */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="cptm-diamond-icon"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M50 4L96 50L50 96L4 50L50 4Z"
          fill="#ED102B"
        />
        {/* Setas entrelaçadas características da CPTM */}
        <path
          d="M50 22L78 50L64 64L36 36L50 22Z"
          fill="#FFFFFF"
        />
        <path
          d="M50 78L22 50L36 36L64 64L50 78Z"
          fill="#FFFFFF"
        />
        <path
          d="M50 38L62 50L50 62L38 50L50 38Z"
          fill="#ED102B"
        />
      </svg>
      {showText && (
        <span
          className="cptm-brand-text"
          style={{
            fontFamily: 'var(--font-display, "Outfit", sans-serif)',
            fontWeight: 900,
            letterSpacing: '0.04em',
            color: '#FFFFFF',
            fontSize: s.font,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          CPTM
        </span>
      )}
    </div>
  )
}
