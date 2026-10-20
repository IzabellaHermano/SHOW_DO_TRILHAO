import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { partidaService, salaService } from '../services/api'
import { useToast } from '../context/ToastContext'
import { Play, Users, Train, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react'
import GameTitle from '../components/GameTitle'
import GameLogo from '../components/GameLogo'
import MetroTimeline from '../components/MetroTimeline'
import GameModal from '../components/GameModal'
import CptmLogo from '../components/CptmLogo'
import GameButton from '../components/GameButton'

export default function Home() {
  const navigate = useNavigate()
  const { codigo } = useParams()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated, isPresenter } = useAuth()
  const toast = useToast()

  // Modal "ENTRE NO JOGO" (Reproduz a Tela 4 da referência)
  const [mostrarModalEntrar, setMostrarModalEntrar] = useState(false)
  const [codigoSala, setCodigoSala] = useState('')
  const [apelido, setApelido] = useState(user?.nome || '')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Ao abrir via QR Code (ex: /entrar/CPTM-X7K2 ou /?sala=CPTM-X7K2), preenche automaticamente
  useEffect(() => {
    const codUrl = codigo || searchParams.get('sala') || searchParams.get('codigo')
    if (codUrl) {
      setCodigoSala(codUrl.toUpperCase())
      setMostrarModalEntrar(true)
    }
  }, [codigo, searchParams])

  const handleAbrirEntrar = () => {
    setErro('')
    if (user?.nome) setApelido(user.nome)
    setMostrarModalEntrar(true)
  }

  const handleCriarSala = () => {
    if (isPresenter) {
      navigate('/apresentador')
    } else {
      toast.info('Para criar uma sala oficial da CPTM, faça login com uma conta de Apresentador.', 'Acesso Restrito')
      navigate('/login', { state: { roleDefault: 'ROLE_APRESENTADOR' } })
    }
  }

  const handleEmbarcar = async (e) => {
    e.preventDefault()
    setErro('')

    const codLimpo = codigoSala.trim().toUpperCase()
    if (!codLimpo) {
      setErro('Informe o código da sala de jogo (ex: CPTM-X7K2).')
      return
    }

    if (!isAuthenticated && (!apelido.trim() || apelido.trim().length < 2)) {
      setErro('Informe seu apelido para embarcar na partida (mínimo 2 caracteres).')
      return
    }

    setCarregando(true)
    try {
      // 1. Verifica se a sala existe, está ativa e aberta para embarque
      try {
        const infoSala = await salaService.verificarSala(codLimpo)
        if (!infoSala.ativa) {
          setErro(`A sala ${codLimpo} está desativada no momento pelo apresentador.`)
          setCarregando(false)
          return
        }
        if (infoSala.status === 'EM_ANDAMENTO') {
          setErro('A partida nesta sala já está em andamento. Aguarde o encerramento da viagem para participar da próxima partida!')
          setCarregando(false)
          return
        }
        if (infoSala.status === 'FINALIZADA') {
          setErro('Esta sala já foi encerrada pelo apresentador.')
          setCarregando(false)
          return
        }
      } catch (errCheck) {
        console.warn('Verificação de sala:', errCheck)
        if (errCheck.response?.status === 404) {
          setErro(`A sala ${codLimpo} não foi encontrada. Confira as letras e números.`)
          setCarregando(false)
          return
        }
      }

      // 2. Embarca na sala coletiva como Jogador autenticado ou Visitante
      let entrada = null
      if (isAuthenticated) {
        entrada = await salaService.entrarJogador(codLimpo)
      } else {
        entrada = await salaService.entrarVisitante(codLimpo, apelido.trim())
      }

      localStorage.setItem('show_trilhao_session_' + codLimpo, entrada.tokenSessao)
      toast.success('Embarque confirmado! Você está conectado ao Show.', 'Tudo Pronto')
      navigate('/jogo', {
        state: {
          codigoSala: codLimpo,
          tokenSessao: entrada.tokenSessao,
          nomeJogador: entrada.nomeJogador || apelido.trim(),
        },
      })
    } catch (err) {
      console.error('Erro ao embarcar:', err)
      const msg =
        err.response?.data?.message ||
        err.response?.data?.mensagem ||
        'Não foi possível embarcar na sala. Confira o código e tente novamente.'
      setErro(msg)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="home-hero-stage">
      {/* Luz e ambientação central */}
      <div className="home-ambient-glow" aria-hidden="true" />

      {/* Conteúdo Central do Palco */}
      <div className="home-center-content">
        {/* Logotipo Oficial do Show do Trilhão (Protagonista da Home) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <GameLogo size="xl" />
          <p className="game-title-subtitle" style={{ marginTop: '0.85rem' }}>
            Conhecimento nos trilhos. Quem chega ao trilhão?
          </p>
        </div>

        {/* Pilha de Botões de Ação Principal */}
        <div className="home-actions-group">
          {/* Botão 1 Primário: ENTRAR NO JOGO */}
          <GameButton
            id="btn-entrar-no-jogo"
            variant="primary"
            size="xl"
            icon={Play}
            onClick={handleAbrirEntrar}
            className="btn-pulse"
          >
            Entrar no Jogo
          </GameButton>

          {/* Botão 2 Secundário: CRIAR SALA */}
          <GameButton
            id="btn-criar-sala"
            variant="secondary"
            size="lg"
            icon={Users}
            onClick={handleCriarSala}
          >
            Criar Sala
          </GameButton>
        </div>

        {/* Status discreto se o usuário já estiver logado */}
        {isAuthenticated && (
          <div className="home-logged-badge">
            <Sparkles size={14} className="gold-icon" />
            <span>Conectado como <strong>{user?.nome}</strong></span>
          </div>
        )}
      </div>

      {/* Linha Férrea com Estações no Rodapé (Panel 1) */}
      <div className="home-bottom-tracks">
        <MetroTimeline
          total={10}
          current={2}
          showLabel={false}
          variant="ambient"
        />
      </div>

      {/* MODAL: TELA 04 — ENTRAR NO JOGO (MOBILE / MODAL FIDELIDADE) */}
      <GameModal
        isOpen={mostrarModalEntrar}
        onClose={() => setMostrarModalEntrar(false)}
        title="Entre no Jogo"
        icon={Train}
        size="md"
      >
        <div className="enter-game-card-content">
          <div className="enter-game-branding">
            <CptmLogo size="md" />
            <GameLogo size="sm" />
          </div>

          <h3 className="enter-game-title">Entre no Jogo</h3>
          <p className="enter-game-desc">
            Informe o código gerado no painel da estação e seu apelido para embarcar na partida.
          </p>

          {erro && (
            <div className="game-alert game-alert-danger" role="alert">
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleEmbarcar} className="enter-game-form">
            <div className="game-form-group">
              <label htmlFor="codigoSala" className="game-form-label">
                Código da Sala
              </label>
              <input
                id="codigoSala"
                type="text"
                required
                placeholder="Ex: CPTM-X7K2"
                value={codigoSala}
                onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                className="game-input game-input-uppercase"
                maxLength={20}
                autoFocus
              />
            </div>

            <div className="game-form-group">
              <label htmlFor="apelido" className="game-form-label">
                Seu Apelido
              </label>
              <input
                id="apelido"
                type="text"
                required
                placeholder="Ex: Carlos, Ana, Ferroviário..."
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                className="game-input"
                maxLength={30}
              />
            </div>

            <GameButton
              type="submit"
              id="btn-embarcar"
              variant="primary"
              size="lg"
              block
              disabled={carregando}
              loading={carregando}
              icon={Train}
              style={{ marginTop: '0.75rem' }}
            >
              Embarcar
            </GameButton>
          </form>
        </div>
      </GameModal>
    </div>
  )
}
