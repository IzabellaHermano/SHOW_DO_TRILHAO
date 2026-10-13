export default function CircularTimer({
  seconds = 45,
  totalSeconds = 45,
  size = 'md', // 'sm' | 'md' | 'lg'
  urgentThreshold = 10,
}) {
  const isUrgent = seconds <= urgentThreshold
  const progressPercent = Math.max(0, Math.min(100, (seconds / totalSeconds) * 100))

  // Dimensões SVG por tamanho
  const configs = {
    sm: { diameter: 48, stroke: 3, radius: 21, fontSize: '1.05rem', sub: false },
    md: { diameter: 72, stroke: 4, radius: 32, fontSize: '1.4rem', sub: false },
    lg: { diameter: 120, stroke: 6, radius: 54, fontSize: '2.5rem', sub: true },
  }

  const { diameter, stroke, radius, fontSize, sub } = configs[size] || configs.md
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div
      className={`circular-timer-box timer-${size} ${isUrgent ? 'timer-urgent pulse-glow' : ''}`}
      aria-label={`Tempo restante: ${seconds} segundos`}
      role="timer"
    >
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        className="timer-svg"
      >
        {/* Trilho base circular escuro */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="#0D1E36"
          strokeWidth={stroke}
        />
        {/* Anel de progresso iluminado */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={isUrgent ? '#FF1938' : '#ED102B'}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="timer-center-content">
        <span className="timer-number" style={{ fontSize }}>
          {seconds}
        </span>
        {sub && <span className="timer-subtext">segundos</span>}
      </div>
    </div>
  )
}
