import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Trophy, Play, LogIn, LogOut, User, LayoutDashboard, HelpCircle, Award } from 'lucide-react'
import CptmLogo from './CptmLogo'
import GameModal from './GameModal'

export default function Navbar() {
  const { user, isAuthenticated, isPresenter, logout } = useAuth()
  const navigate = useNavigate()
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <header className="cptm-navbar" role="banner">
        <div className="navbar-inner">
          {/* Logo CPTM Oficial à Esquerda */}
          <Link to="/" className="navbar-brand" title="Show do Trilhão • CPTM">
            <CptmLogo size="md" />
          </Link>

          {/* Links e Ações à Direita */}
          <nav className="navbar-nav-links" aria-label="Navegação">
            <button
              type="button"
              onClick={() => setShowHowToPlay(true)}
              className="nav-link-subtle"
            >
              <HelpCircle size={15} />
              <span>Como Jogar</span>
            </button>

            <NavLink
              to="/ranking"
              className={({ isActive }) => `nav-link-subtle ${isActive ? 'active' : ''}`}
            >
              <Trophy size={15} />
              <span>Ranking</span>
            </NavLink>

            {isPresenter && (
              <NavLink
                to="/apresentador"
                className={({ isActive }) => `nav-link-subtle ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={15} />
                <span>Painel</span>
              </NavLink>
            )}

            {/* Acesso / Perfil */}
            {isAuthenticated ? (
              <div className="nav-user-dropdown">
                <div className="nav-user-badge">
                  <User size={14} />
                  <span className="nav-user-name">{user?.nome?.split(' ')[0] || 'Passageiro'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="nav-btn-logout"
                  title="Sair da conta"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="nav-btn-login">
                <LogIn size={15} />
                <span>Entrar</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Modal Educativo: Como Jogar o Show do Trilhão */}
      <GameModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        title="Regras do Show do Trilhão"
        icon={Award}
      >
        <div className="rules-modal-content">
          <div className="rule-item">
            <span className="rule-number">1</span>
            <div>
              <strong>10 Estações Rumo ao Trilhão</strong>
              <p>Cada rodada possui 10 perguntas progressivas sobre o universo ferroviário, história e operação da CPTM.</p>
            </div>
          </div>
          <div className="rule-item">
            <span className="rule-number">2</span>
            <div>
              <strong>45 Segundos no Cronômetro</strong>
              <p>A pontualidade é lei nos trilhos! Responda antes que o tempo se esgote para garantir sua pontuação.</p>
            </div>
          </div>
          <div className="rule-item">
            <span className="rule-number">3</span>
            <div>
              <strong>Errou, Perde Tudo!</strong>
              <p>Responda com atenção. Se errar uma pergunta ou o tempo zerar, o prêmio acumulado cai para R$ 0.</p>
            </div>
          </div>
          <div className="rule-item">
            <span className="rule-number">4</span>
            <div>
              <strong>Top Líderes & Salão dos Milionários</strong>
              <p>Jogadores cadastrados disputam vaga permanente no Ranking Geral dos Trilhos Paulistas.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHowToPlay(false)}
            className="btn-cptm btn-cptm-primary btn-md btn-block"
            style={{ marginTop: '1.25rem' }}
          >
            Entendido, Embarcar!
          </button>
        </div>
      </GameModal>
    </>
  )
}
