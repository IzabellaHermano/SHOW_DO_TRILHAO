import { Link } from 'react-router-dom'
import { AlertTriangle, Home, Trophy } from 'lucide-react'
import CptmLogo from '../components/CptmLogo'
import GameLogo from '../components/GameLogo'

export default function NotFound() {
  return (
    <div className="home-hero-stage" style={{ minHeight: 'calc(100vh - 65px)', justifyContent: 'center' }}>
      <div className="game-modal-container modal-md" style={{ margin: 'auto 0', textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <CptmLogo size="lg" />
          <GameLogo size="sm" />
        </div>
        <div style={{ margin: '1.5rem 0 0.5rem 0', color: '#ED102B' }}>
          <AlertTriangle size={64} style={{ margin: '0 auto' }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3.5rem', lineHeight: 1, color: '#FFFFFF' }}>
          404
        </h1>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', marginTop: '0.25rem', color: '#FFC629' }}>
          Estação Não Encontrada!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.75rem auto 1.75rem auto', maxWidth: 400 }}>
          O trem pegou um desvio ou essa linha ferroviária ainda não existe no mapa do Show do Trilhão.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn-cptm btn-cptm-primary btn-md">
            <Home size={18} />
            <span>Voltar ao Início</span>
          </Link>
          <Link to="/ranking" className="btn-cptm btn-cptm-secondary btn-md">
            <Trophy size={18} />
            <span>Ver Ranking</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
