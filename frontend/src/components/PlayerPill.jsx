const AVATAR_COLORS = [
  '#0879F9', // Azul
  '#00CC74', // Verde
  '#ED102B', // Vermelho
  '#FFB900', // Dourado/Amarelo
  '#9B51E0', // Roxo
  '#FF6B00', // Laranja
  '#00C2CB', // Ciano
  '#E056FD', // Magenta
]

function getAvatarColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export default function PlayerPill({ name = 'Jogador', isMe = false, onRemove = null }) {
  const initial = (name.trim()[0] || 'J').toUpperCase()
  const avatarColor = getAvatarColor(name)

  return (
    <div className={`player-pill ${isMe ? 'player-pill-me' : ''}`}>
      <span className="player-avatar-circle" style={{ backgroundColor: avatarColor }}>
        {initial}
      </span>
      <span className="player-name-text">{name}</span>
      {isMe && <span className="player-me-tag">Você</span>}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="player-remove-btn"
          title="Remover participante"
          aria-label={`Remover ${name}`}
        >
          ×
        </button>
      )}
    </div>
  )
}
