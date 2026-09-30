import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Trophy, Play, LogIn, LogOut, User, LayoutDashboard } from 'lucide-react'
import cptmLogoWhite from '../assets/cptm-logo-white.png'
import gameLogo from '../assets/logo.png'

export default function Navbar() {
  const { user, isAuthenticated, isPresenter, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Marca Oficial CPTM + Show do Trilhão */}
        <Link to="/" className="navbar-brand" title="Página Inicial - Show do Trilhão">
          <div className="navbar-logo-wrap">
            <img
              src={cptmLogoWhite}
              alt="CPTM - Companhia Paulista de Trens Metropolitanos"
              className="navbar-cptm-logo"
            />
            <img
              src={gameLogo}
              alt="Logo Show do Trilhão"
              className="navbar-game-logo"
            />
          </div>
          <span className="navbar-title">
            SHOW DO <span className="highlight-trilhao">TRILHÃO</span>
          </span>
        </Link>

        {/* Links Centrais de Navegação */}
        <nav className="nav-links" aria-label="Navegação Principal">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            Início
          </NavLink>

          <NavLink
            to="/ranking"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <Trophy size={18} />
            <span>Ranking</span>
          </NavLink>

          <NavLink
            to="/jogo"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <Play size={18} />
            <span>Jogar</span>
          </NavLink>

          {isPresenter && (
            <NavLink
              to="/apresentador"
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <LayoutDashboard size={18} />
              <span>Painel</span>
            </NavLink>
          )}
        </nav>

        {/* Autenticação & Perfil à Direita */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="user-profile">
              <div className="user-badge">
                <User size={16} />
                <span className="user-name">{user?.nome || 'Jogador'}</span>
                {user?.role && (
                  <span className="role-tag">
                    {user.role.replace('ROLE_', '')}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Sair da conta"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm btn-pulse">
              <LogIn size={16} />
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
