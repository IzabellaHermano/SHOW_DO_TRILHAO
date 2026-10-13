import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { partidaService } from '../services/api'
import { Play, LogIn, UserPlus, Trophy, LayoutDashboard, ArrowRight, ShieldAlert, Train, X } from 'lucide-react'
import gameLogo from '../assets/logo.png'
import apresentadorImg from '../assets/apresentador.png'

export default function Home() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [mostrarModalSala, setMostrarModalSala] = useState(false)
  const [codigoSala, setCodigoSala] = useState('')
  const [nomeVisitante, setNomeVisitante] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleAbrirSala = () => {
    setErro('')
    setMostrarModalSala(true)
  }

  const handleEntrarSala = async (e) => {
    e.preventDefault()
    setErro('')

    if (!codigoSala.trim()) {
      setErro('Por favor, informe o código da sala de jogo (ex: CPTM-2026).')
      return
    }

    if (!isAuthenticated && (!nomeVisitante.trim() || nomeVisitante.trim().length < 2)) {
      setErro('Visitantes precisam informar um apelido ou nome (mínimo 2 letras).')
      return
    }

    setCarregando(true)
    try {
      if (isAuthenticated) {
        const partida = await partidaService.iniciarJogador(codigoSala.trim().toUpperCase())
        navigate(`/jogo/${partida.id}`)
      } else {
        const partida = await partidaService.iniciarVisitante(
          codigoSala.trim().toUpperCase(),
          nomeVisitante.trim()
        )
        navigate(`/jogo/${partida.id}`)
      }
    } catch (err) {
      console.error('Erro ao conectar à sala:', err)
      const msg =
        err.response?.data?.message ||
        err.response?.data?.mensagem ||
        'Não foi possível conectar à sala. Verifique se o código está correto e ativo.'
      setErro(msg)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="menu-wireframe-container">
      {/* Container Central do Menu do Show */}
      <div className="menu-card-main">
        {/* Logo Central de Destaque */}
        <div className="menu-logo-wrapper">
          <img
            src={gameLogo}
            alt="Show do Trilhão - CPTM"
            className="menu-main-logo"
          />
        </div>

        <p className="menu-tagline">
          O Game Show do Transporte sobre Trilhos de São Paulo
        </p>

        {/* Apresentador Discreto na Boas-Vindas */}
        <div className="menu-host-badge">
          <img
            src={apresentadorImg}
            alt="Silvio dos Trilhos"
            className="menu-host-avatar"
          />
          <span>Comandado por <strong>Silvio dos Trilhos</strong> • Rumo a 1 Milhão!</span>
        </div>

        {/* Informação do Jogador Logado (se houver) */}
        {isAuthenticated && (
          <div className="menu-user-status">
            <span>Passageiro conectado: <strong>{user?.nome}</strong> ({user?.role === 'ROLE_APRESENTADOR' ? 'Apresentador' : user?.role === 'ROLE_ADMIN' ? 'Administrador' : 'Jogador Oficial'})</span>
          </div>
        )}

        {/* AÇÕES PRINCIPAIS DO MENU */}
        <div className="menu-actions-stack">
          {/* Botão Primário de Destaque */}
          <button
            type="button"
            id="btn-iniciar-partida"
            onClick={handleAbrirSala}
            className="btn btn-primary-show btn-pulse"
          >
            <Play size={24} className="icon-play" />
            <span>Iniciar Partida / Entrar com Código de Sala</span>
          </button>

          {/* Botões Secundários: Entrar e Criar Conta */}
          <div className="menu-secondary-buttons">
            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  id="btn-entrar"
                  onClick={() => navigate('/login', { state: { register: false } })}
                  className="btn btn-secondary-show"
                >
                  <LogIn size={18} />
                  <span>Entrar</span>
                </button>

                <button
                  type="button"
                  id="btn-criar-conta"
                  onClick={() => navigate('/login', { state: { register: true } })}
                  className="btn btn-secondary-show"
                >
                  <UserPlus size={18} />
                  <span>Criar Conta</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn btn-secondary-show"
              >
                <span>Alternar Conta</span>
              </button>
            )}
          </div>
        </div>

        {/* SEÇÃO INFERIOR: LINKS SEPARADOS */}
        <div className="menu-links-separated">
          <button
            type="button"
            id="link-ranking-geral"
            onClick={() => navigate('/ranking')}
            className="menu-link-item"
          >
            <Trophy size={18} className="link-icon gold-icon" />
            <span>Ranking Geral</span>
          </button>

          <span className="menu-links-divider" aria-hidden="true">•</span>

          <button
            type="button"
            id="link-painel-apresentador"
            onClick={() => navigate('/apresentador')}
            className="menu-link-item"
          >
            <LayoutDashboard size={18} className="link-icon" />
            <span>Painel do Apresentador / Admin</span>
          </button>
        </div>
      </div>

      {/* MODAL / TELA DE ENTRAR COM CÓDIGO DE SALA */}
      {mostrarModalSala && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Train size={24} className="icon-train" />
                <h3>Entrar com Código de Sala</h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalSala(false)}
                className="btn-close-modal"
                aria-label="Fechar janela"
              >
                <X size={20} />
              </button>
            </div>

            <p className="modal-desc">
              Digite o código da sala fornecido pelo seu mestre de sala ou apresentador para iniciar sua jornada nos trilhos.
            </p>

            {erro && (
              <div className="alert alert-danger" role="alert">
                <ShieldAlert size={18} />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleEntrarSala} className="modal-form">
              <div className="form-group">
                <label htmlFor="inputCodigoSala">Código da Sala:</label>
                <input
                  id="inputCodigoSala"
                  type="text"
                  required
                  placeholder="Ex: CPTM-2026"
                  value={codigoSala}
                  onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                  className="input-field uppercase-input"
                  maxLength={20}
                  autoFocus
                />
              </div>

              {!isAuthenticated && (
                <div className="form-group">
                  <label htmlFor="inputNomeVisitante">Seu Nome / Apelido de Visitante:</label>
                  <input
                    id="inputNomeVisitante"
                    type="text"
                    required
                    placeholder="Como deseja ser chamado no ranking da sala?"
                    value={nomeVisitante}
                    onChange={(e) => setNomeVisitante(e.target.value)}
                    className="input-field"
                    maxLength={35}
                  />
                  <small className="form-help">
                    Visitantes disputam o ranking da sala. Para disputar o ranking geral de milionários da CPTM, faça login.
                  </small>
                </div>
              )}

              <div className="modal-footer-actions">
                <button
                  type="button"
                  onClick={() => setMostrarModalSala(false)}
                  className="btn btn-secondary btn-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carregando}
                  className="btn btn-positive-action btn-lg"
                >
                  <span>{carregando ? 'Conectando...' : 'Entrar no Jogo'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
