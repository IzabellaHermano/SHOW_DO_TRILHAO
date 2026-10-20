import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Trophy, LogIn, LogOut, LayoutDashboard, HelpCircle, Award } from 'lucide-react'
import CptmLogo from './CptmLogo'
import GameLogo from './GameLogo'
import GameModal from './GameModal'
import GameButton from './GameButton'
import apresentadorImg from '../assets/apresentador.png'

export default function TopBar() {
  const { user, isAuthenticated, isPresenter, logout } = useAuth()
  const navigate = useNavigate()
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <header className="topbar-navbar" role="banner">
        <div className="topbar-inner">
          {/* Logo CPTM Oficial + Show do Trilhão + Avatar do Apresentador */}
          <div className="topbar-brand-group">
            <Link to="/" className="topbar-brand-link" title="Show do Trilhão • Início">
              <CptmLogo size="sm" />
              <div className="topbar-divider" />
              <GameLogo size="xs" />
            </Link>

            {/* Foto Oficial do Apresentador sem distorção */}
            <div className="topbar-presenter-badge" title="Apresentador Silvio dos Trilhos">
              <img
                src={apresentadorImg}
                alt="Apresentador Oficial"
                className="topbar-presenter-avatar"
                loading="eager"
              />
            </div>
          </div>

          {/* Links e Ações Centrais / Direita */}
          <nav className="topbar-nav" aria-label="Navegação Principal">
            <GameButton
              variant="subtle"
              size="sm"
              icon={HelpCircle}
              onClick={() => setShowHowToPlay(true)}
              className="topbar-btn-nav"
            >
              Como Jogar
            </GameButton>

            <NavLink to="/ranking" className={({ isActive }) => `topbar-nav-link ${isActive ? 'is-active' : ''}`}>
              <Trophy size={16} />
              <span>Ranking</span>
            </NavLink>

            {isPresenter && (
              <NavLink to="/apresentador" className={({ isActive }) => `topbar-nav-link ${isActive ? 'is-active' : ''}`}>
                <LayoutDashboard size={16} />
                <span>Painel</span>
              </NavLink>
            )}

            {/* Acesso / Perfil */}
            {isAuthenticated ? (
              <div className="topbar-user-group">
                <span className="topbar-user-name">
                  {user?.nome?.split(' ')[0] || 'Passageiro'}
                </span>
                <GameButton
                  variant="subtle"
                  size="sm"
                  icon={LogOut}
                  onClick={handleLogout}
                  title="Sair da conta"
                  aria-label="Sair da conta"
                  className="topbar-logout-btn"
                >
                  Sair
                </GameButton>
              </div>
            ) : (
              <GameButton
                variant="primary"
                size="sm"
                icon={LogIn}
                onClick={() => navigate('/login')}
                id="btn-topbar-entrar"
              >
                Entrar
              </GameButton>
            )}
          </nav>
        </div>
      </header>

      {/* Modal Educativo: Regras Oficiais */}
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
              <p>Cada rodada possui 10 perguntas de valor crescente até R$ 1.000.000.</p>
            </div>
          </div>
          <div className="rule-item">
            <span className="rule-number">2</span>
            <div>
              <strong>45 Segundos de Prazo</strong>
              <p>Nos trilhos da CPTM, pontualidade é tudo! O servidor controla estritamente o tempo.</p>
            </div>
          </div>
          <div className="rule-item">
            <span className="rule-number">3</span>
            <div>
              <strong>Errou, Perde Tudo!</strong>
              <p>Errou a pergunta, o tempo zerou ou abandonou a partida: o prêmio acumulado cai para R$ 0.</p>
            </div>
          </div>
          <div className="rule-item">
            <span className="rule-number">4</span>
            <div>
              <strong>Controle Mobile com 4 Símbolos</strong>
              <p>O jogador vê em seu celular apenas os 4 botões numerados e acompanha o telão oficial.</p>
            </div>
          </div>
          <div style={{ marginTop: '1.25rem' }}>
            <GameButton
              variant="primary"
              size="md"
              block
              onClick={() => setShowHowToPlay(false)}
            >
              Entendido, Embarcar!
            </GameButton>
          </div>
        </div>
      </GameModal>
    </>
  )
}
