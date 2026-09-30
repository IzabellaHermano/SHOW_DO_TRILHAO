import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { partidaService } from '../services/api'
import { Play, Trophy, Users, ShieldAlert, ArrowRight, UserPlus } from 'lucide-react'
import cptmLogoWhite from '../assets/cptm-logo-white.png'
import apresentadorImg from '../assets/apresentador.png'

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [codigoSala, setCodigoSala] = useState('')
  const [nomeVisitante, setNomeVisitante] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleEntrarSala = async (e) => {
    e.preventDefault()
    setErro('')

    if (!codigoSala.trim()) {
      setErro('Informe o código da sala de jogo.')
      return
    }

    if (!isAuthenticated && !nomeVisitante.trim()) {
      setErro('Visitantes precisam informar um apelido para jogar.')
      return
    }

    setCarregando(true)
    try {
      if (isAuthenticated) {
        const partida = await partidaService.iniciarJogador(codigoSala.trim().toUpperCase())
        navigate(`/jogo/${partida.id || 'nova'}`)
      } else {
        const partida = await partidaService.iniciarVisitante(
          codigoSala.trim().toUpperCase(),
          nomeVisitante.trim()
        )
        navigate(`/jogo/${partida.id || 'visitante'}`)
      }
    } catch (err) {
      console.warn('Conexão offline com o backend de partidas:', err)
      navigate('/jogo', {
        state: {
          codigoSala: codigoSala.toUpperCase(),
          nomeJogador: isAuthenticated ? user?.nome : nomeVisitante,
        },
      })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="home-container">
      {/* Hero Principal do Game Show */}
      <section className="hero-section">
        <div className="hero-content">
          {/* Selo Oficial Show do Trilhão • CPTM */}
          <div className="badge badge-cptm">
            <img
              src={cptmLogoWhite}
              alt="CPTM"
              className="badge-cptm-icon"
            />
            <span>Show do Trilhão • CPTM</span>
          </div>

          <h1 className="hero-title">
            Acerte as perguntas e chegue ao <span className="highlight-trilhao">Trilhão</span>!
          </h1>
          <p className="hero-subtitle">
            Embarque no maior game show do transporte sobre trilhos de São Paulo.
            Responda 10 perguntas desafiadoras sobre a CPTM e cultura geral para conquistar o prêmio máximo!
          </p>

          {/* Card de Entrada Rápida na Sala */}
          <div className="card enter-room-card">
            <h2 className="card-title">
              <Users size={22} />
              <span>Entrar em uma Sala de Jogo</span>
            </h2>

            {erro && (
              <div className="alert alert-danger" role="alert">
                <ShieldAlert size={20} />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleEntrarSala} className="room-form">
              <div className="form-group">
                <label htmlFor="codigoSala">Código de Acesso da Estação:</label>
                <input
                  id="codigoSala"
                  type="text"
                  placeholder="Ex: CPTM2026"
                  value={codigoSala}
                  onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                  className="input-field uppercase-input"
                  maxLength={10}
                  autoComplete="off"
                />
              </div>

              {!isAuthenticated && (
                <div className="form-group">
                  <label htmlFor="nomeVisitante">Seu Apelido / Nome de Passageiro:</label>
                  <input
                    id="nomeVisitante"
                    type="text"
                    placeholder="Como deseja ser chamado no ranking?"
                    value={nomeVisitante}
                    onChange={(e) => setNomeVisitante(e.target.value)}
                    className="input-field"
                    maxLength={30}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="btn btn-primary btn-block btn-lg btn-pulse"
              >
                <Play size={20} />
                <span>{carregando ? 'Conectando ao Trem...' : 'Entrar na Corrida'}</span>
                <ArrowRight size={20} />
              </button>
            </form>
          </div>

          {/* Atalhos Rápidos Alinhados */}
          <div className="quick-actions">
            <button
              type="button"
              onClick={() => navigate('/ranking')}
              className="btn btn-secondary btn-md"
            >
              <Trophy size={18} />
              <span>Ver Ranking Geral</span>
            </button>

            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn btn-outline btn-md"
              >
                <UserPlus size={18} />
                <span>Fazer Login ou Cadastrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Ilustração e Apresentador no Palco */}
        <div className="hero-visual">
          <div className="presenter-card">
            <div className="presenter-frame">
              <img
                src={apresentadorImg}
                alt="Apresentador do Show do Trilhão"
                className="presenter-image"
              />
            </div>
            <div className="presenter-balloon">
              <p>
                <strong>"Preparado para a viagem rumo ao Trilhão?"</strong>
              </p>
              <span>Digite o código de acesso e mostre que você domina os trilhos!</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
