import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Home, Trophy } from 'lucide-react'
import CptmLogo from '../components/CptmLogo'
import GameLogo from '../components/GameLogo'
import GameCard from '../components/GameCard'
import GameButton from '../components/GameButton'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="home-hero-stage" style={{ minHeight: 'calc(100dvh - 65px)', justifyContent: 'center', padding: '1rem' }}>
      <GameCard elevation="high" style={{ margin: 'auto', textAlign: 'center', maxWidth: 480, width: '100%', padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <CptmLogo size="lg" />
          <GameLogo size="sm" />
        </div>
        <div style={{ margin: '1.5rem 0 0.5rem 0', color: '#ED102B' }}>
          <AlertTriangle size={64} style={{ margin: '0 auto' }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2.5rem, 8vw, 3.5rem)', lineHeight: 1, color: '#FFFFFF' }}>
          404
        </h1>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)', marginTop: '0.25rem', color: '#FFC629' }}>
          Estação Não Encontrada!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.75rem auto 1.75rem auto', maxWidth: 360 }}>
          O trem pegou um desvio ou essa linha ferroviária ainda não existe no mapa do Show do Trilhão.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <GameButton variant="primary" onClick={() => navigate('/')} icon={<Home size={18} />}>
            Voltar ao Início
          </GameButton>
          <GameButton variant="secondary" onClick={() => navigate('/ranking')} icon={<Trophy size={18} />}>
            Ver Ranking
          </GameButton>
        </div>
      </GameCard>
    </div>
  )
}
