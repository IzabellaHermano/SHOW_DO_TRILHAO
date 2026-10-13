import { Train } from 'lucide-react'

export default function MetroTimeline({
  total = 10,
  current = 1,
  showLabel = true,
  variant = 'compact', // 'compact' | 'full' | 'ambient'
  className = '',
}) {
  const dots = Array.from({ length: total }, (_, i) => i + 1)

  return (
    <div className={`metro-timeline-wrapper timeline-${variant} ${className}`}>
      {showLabel && (
        <div className="metro-timeline-label">
          <span>Pergunta {current} de {total}</span>
        </div>
      )}
      <div className="metro-track-line">
        <div
          className="metro-track-progress"
          style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
        />
        <div className="metro-stations-row">
          {dots.map((step) => {
            const isCompleted = step < current
            const isCurrent = step === current
            return (
              <div
                key={step}
                className={`metro-station-dot ${isCompleted ? 'completed' : ''} ${
                  isCurrent ? 'active pulse-dot' : ''
                }`}
                title={`Estação ${step}`}
              >
                {isCurrent && variant !== 'ambient' && (
                  <span className="station-train-pin" aria-hidden="true">
                    <Train size={12} />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
