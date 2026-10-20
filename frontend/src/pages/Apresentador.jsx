import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { salaService, perguntaService, rankingService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Copy,
  RefreshCw,
  Power,
  HelpCircle,
  Edit2,
  Trash2,
  Save,
  Tv,
  Play,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sparkles,
  Award,
  ChevronRight,
  Eye,
  RotateCcw,
  Trophy
} from 'lucide-react'
import CptmLogo from '../components/CptmLogo'
import GameLogo from '../components/GameLogo'
import GameTitle from '../components/GameTitle'
import PlayerPill from '../components/PlayerPill'
import GameModal from '../components/GameModal'
import Podium from '../components/Podium'
import GameButton from '../components/GameButton'
import GameCard from '../components/GameCard'
import AlternativaItem from '../components/AlternativaItem'

const VALORES_SUGERIDOS_POR_NIVEL = {
  1: 1000,
  2: 5000,
  3: 10000,
  4: 25000,
  5: 50000,
  6: 100000,
  7: 200000,
  8: 300000,
  9: 500000,
  10: 1000000,
}

export default function Apresentador() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [abaAtiva, setAbaAtiva] = useState('salas') // 'salas' | 'perguntas'
  const [salaTelaoAtiva, setSalaTelaoAtiva] = useState(null)
  const [estadoTelao, setEstadoTelao] = useState(null)
  const [tempoRestante, setTempoRestante] = useState(45)
  const [rankingFinalSala, setRankingFinalSala] = useState([])
  const [executandoAcao, setExecutandoAcao] = useState(false)

  // Gestão de Salas
  const [salas, setSalas] = useState([])
  const [carregandoSalas, setCarregandoSalas] = useState(false)
  const [modalNovaSalaAberto, setModalNovaSalaAberto] = useState(false)
  const [nomeNovaSala, setNomeNovaSala] = useState('')
  const [criandoSala, setCriandoSala] = useState(false)

  // Gestão de Perguntas
  const [perguntas, setPerguntas] = useState([])
  const [carregandoPerguntas, setCarregandoPerguntas] = useState(false)
  const [filtroNivel, setFiltroNivel] = useState('todos')
  const [modalPerguntaAberto, setModalPerguntaAberto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [salvandoPergunta, setSalvandoPergunta] = useState(false)

  const [enunciado, setEnunciado] = useState('')
  const [nivelDificuldade, setNivelDificuldade] = useState(1)
  const [valorPremio, setValorPremio] = useState(1000)
  const [explicacao, setExplicacao] = useState('')
  const [alternativa1, setAlternativa1] = useState('')
  const [alternativa2, setAlternativa2] = useState('')
  const [alternativa3, setAlternativa3] = useState('')
  const [alternativa4, setAlternativa4] = useState('')
  const [corretaNumero, setCorretaNumero] = useState(1)

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(valor || 0)
  }

  const getPublicBaseUrl = () => {
    if (import.meta.env.VITE_PUBLIC_URL) {
      return import.meta.env.VITE_PUBLIC_URL.replace(/\/$/, '')
    }
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin
    }
    return 'https://show-do-trilhao.web.app'
  }

  // Carrega Salas do Apresentador
  const carregarSalas = useCallback(async () => {
    setCarregandoSalas(true)
    try {
      const lista = await salaService.listarMinhasSalas()
      setSalas(lista || [])
    } catch (err) {
      console.error('Erro ao carregar salas:', err)
      toast.error('Não foi possível carregar as salas do servidor.')
    } finally {
      setCarregandoSalas(false)
    }
  }, [toast])

  const carregarPerguntas = useCallback(async () => {
    setCarregandoPerguntas(true)
    try {
      const lista = await perguntaService.listarTodas()
      setPerguntas(lista || [])
    } catch (err) {
      console.error('Erro ao carregar perguntas:', err)
      toast.error('Não foi possível carregar o acervo de perguntas.')
    } finally {
      setCarregandoPerguntas(false)
    }
  }, [toast])

  useEffect(() => {
    if (abaAtiva === 'salas') {
      carregarSalas()
    } else if (abaAtiva === 'perguntas') {
      carregarPerguntas()
    }
  }, [abaAtiva, carregarSalas, carregarPerguntas])

  // Abertura do Modo Telão
  const abrirLobbyTelao = (sala) => {
    setSalaTelaoAtiva(sala)
    setEstadoTelao(null)
    setRankingFinalSala([])
  }

  // Polling em tempo real do estado da sala no backend (a cada 1.5s)
  useEffect(() => {
    if (!salaTelaoAtiva) return

    let montado = true

    const sincronizarEstadoTelao = async () => {
      try {
        const estado = await salaService.obterEstadoApresentador(salaTelaoAtiva.codigo)
        if (!montado) return
        setEstadoTelao(estado)

        // Se a partida foi finalizada, carrega o ranking final para o pódio
        if (estado.statusSala === 'FINALIZADA') {
          try {
            const ranking = await rankingService.obterRankingSala(salaTelaoAtiva.codigo)
            if (montado) setRankingFinalSala(ranking || [])
          } catch (errRank) {
            console.warn('Erro ao obter ranking final:', errRank)
          }
        }
      } catch (err) {
        console.warn('Polling estado apresentador:', err?.message || err)
      }
    }

    sincronizarEstadoTelao()
    const timer = setInterval(sincronizarEstadoTelao, 1500)

    return () => {
      montado = false
      clearInterval(timer)
    }
  }, [salaTelaoAtiva])

  // Cronômetro Sincronizado do Telão (controlado pelo servidor via prazoFinal)
  useEffect(() => {
    if (!estadoTelao || estadoTelao.statusSala !== 'EM_ANDAMENTO' || estadoTelao.faseRodada !== 'PERGUNTA' || !estadoTelao.prazoFinal) {
      return
    }

    const atualizarTempo = () => {
      const fim = new Date(estadoTelao.prazoFinal).getTime()
      const agora = Date.now()
      const segRestantes = Math.max(0, Math.ceil((fim - agora) / 1000))
      setTempoRestante(segRestantes)
    }

    atualizarTempo()
    const interval = setInterval(atualizarTempo, 500)
    return () => clearInterval(interval)
  }, [estadoTelao])

  // Ações do Apresentador
  const handleIniciarJogo = async () => {
    if (!salaTelaoAtiva || executandoAcao) return
    setExecutandoAcao(true)
    try {
      const resp = await salaService.iniciarJogo(salaTelaoAtiva.codigo)
      setEstadoTelao(resp)
      toast.success(`Show iniciado! 10 perguntas montadas.`, 'Atenção aos Trilhos')
    } catch (err) {
      console.error('Erro ao iniciar jogo:', err)
      toast.error(err.response?.data?.message || 'Não foi possível iniciar o jogo.')
    } finally {
      setExecutandoAcao(false)
    }
  }

  const handleRevelarResposta = async () => {
    if (!salaTelaoAtiva || executandoAcao) return
    setExecutandoAcao(true)
    try {
      const resp = await salaService.revelarResposta(salaTelaoAtiva.codigo)
      setEstadoTelao(resp)
      toast.info('Resposta revelada no telão!', 'Gabarito Oficial')
    } catch (err) {
      console.error('Erro ao revelar resposta:', err)
      toast.error(err.response?.data?.message || 'Não foi possível revelar a resposta.')
    } finally {
      setExecutandoAcao(false)
    }
  }

  const handleProximaPergunta = async () => {
    if (!salaTelaoAtiva || executandoAcao) return
    setExecutandoAcao(true)
    try {
      const resp = await salaService.proximaPergunta(salaTelaoAtiva.codigo)
      setEstadoTelao(resp)
      if (resp.statusSala === 'FINALIZADA') {
        toast.success('Partida encerrada com sucesso! Exibindo o pódio final.', 'Fim do Show')
      } else {
        toast.success(`Nível ${resp.nivelAtual} de 10 iniciado!`, 'Próxima Estação')
      }
    } catch (err) {
      console.error('Erro ao avançar pergunta:', err)
      toast.error(err.response?.data?.message || 'Não foi possível avançar para a próxima pergunta.')
    } finally {
      setExecutandoAcao(false)
    }
  }

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo)
    toast.success(`Código ${codigo} copiado para a área de transferência!`, 'Copiado')
  }

  const copiarLink = (link) => {
    navigator.clipboard.writeText(link)
    toast.success('Link da sala copiado! Compartilhe com os participantes.', 'Link Copiado')
  }

  // ========================================================
  // MODO 1: TELÃO EM TEMPO REAL (LOBBY, PERGUNTA, REVELAÇÃO, PÓDIO)
  // ========================================================
  if (salaTelaoAtiva) {
    const gameUrl = `${getPublicBaseUrl()}/sala/${salaTelaoAtiva.codigo}`
    const participantes = estadoTelao?.participantesLobby || []
    const statusSala = estadoTelao?.statusSala || 'AGUARDANDO'
    const faseRodada = estadoTelao?.faseRodada || 'LOBBY'

    return (
      <div className="presenter-telao-root">
        {/* HEADER DO TELÃO */}
        <header className="presenter-telao-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <GameButton
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => {
                setSalaTelaoAtiva(null)
                setEstadoTelao(null)
                carregarSalas()
              }}
              title="Voltar ao Painel de Controle"
            >
              Painel
            </GameButton>
            <CptmLogo size="md" />
          </div>

          <GameLogo size="md" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="telao-sala-badge">Sala: {salaTelaoAtiva.codigo}</span>
            <div className={`lobby-status-badge ${statusSala === 'EM_ANDAMENTO' ? 'is-active pulse' : ''}`}>
              <span>{statusSala === 'AGUARDANDO' ? 'Lobby Aberto' : statusSala === 'EM_ANDAMENTO' ? 'Show ao Vivo' : 'Finalizada'}</span>
            </div>
          </div>
        </header>

        {/* FASE 1: LOBBY DA SALA (AGUARDANDO INÍCIO) */}
        {statusSala === 'AGUARDANDO' && (
          <div className="lobby-stage-container">
            <div className="lobby-card-box">
              <div className="lobby-code-display">
                <span className="lobby-code-label">Código da Sala para Embarque</span>
                <span className="lobby-code-value">{salaTelaoAtiva.codigo}</span>
              </div>

              <div className="lobby-content-grid">
                {/* Esquerda: QR Code SVG Local */}
                <div className="lobby-qr-section">
                  <div className="lobby-qr-frame">
                    <QRCodeSVG
                      value={gameUrl}
                      size={200}
                      level="H"
                      includeMargin={true}
                      className="lobby-qr-svg"
                    />
                  </div>
                  <div className="lobby-qr-caption">
                    Escaneie com a câmera do celular ou acesse:
                    <br />
                    <strong style={{ wordBreak: 'break-all' }}>{gameUrl}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
                    <GameButton
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      onClick={() => copiarLink(gameUrl)}
                    >
                      Copiar Link
                    </GameButton>
                    <GameButton
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      onClick={() => copiarCodigo(salaTelaoAtiva.codigo)}
                    >
                      Copiar Código
                    </GameButton>
                  </div>
                </div>

                {/* Centro: Participantes Reais */}
                <div className="lobby-players-center">
                  <div className="lobby-players-title">
                    Passageiros na Plataforma ({participantes.length})
                  </div>
                  {participantes.length === 0 ? (
                    <div className="lobby-empty-platform">
                      <Users size={38} style={{ color: 'var(--cptm-gold)', margin: '0 auto 0.75rem auto', opacity: 0.85 }} />
                      <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                        Plataforma vazia! Compartilhe o código para iniciar o embarque.
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Nenhum jogador fictício. Assim que participantes reais escanearem o QR code, aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="lobby-players-pills-wrap">
                      {participantes.map((nome, i) => (
                        <PlayerPill key={i} name={nome} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Direita: Totalizador */}
                <div className="lobby-stats-sidebar">
                  <Users size={32} style={{ color: 'var(--cptm-red)' }} />
                  <div className="lobby-players-count">{participantes.length}</div>
                  <div className="lobby-players-count-label">Jogadores Conectados</div>
                </div>
              </div>
            </div>

            {/* Ação de Início do Apresentador */}
            <div className="lobby-bottom-bar">
              <GameButton
                id="btn-iniciar-jogo"
                variant="gold"
                size="xl"
                icon={Play}
                disabled={executandoAcao}
                loading={executandoAcao}
                onClick={handleIniciarJogo}
                className="btn-pulse"
              >
                Iniciar Jogo
              </GameButton>
            </div>
          </div>
        )}

        {/* FASE 2: GAMEPLAY AO VIVO NO TELÃO (PERGUNTA OU REVELAÇÃO) */}
        {statusSala === 'EM_ANDAMENTO' && estadoTelao && (
          <div className="presenter-gameplay-stage">
            {/* BARRA SUPERIOR DO GAMEPLAY: NÍVEL, PRÊMIO E CRONÔMETRO */}
            <div className="presenter-hud-strip">
              <div className="presenter-hud-badge">
                <span className="hud-badge-label">NÍVEL</span>
                <span className="hud-badge-val">{estadoTelao.nivelAtual} de 10</span>
              </div>

              <div className="presenter-hud-badge gold">
                <span className="hud-badge-label">VALOR DA PERGUNTA</span>
                <span className="hud-badge-val">{formatarMoeda(estadoTelao.valorPremioNivel)}</span>
              </div>

              {/* CRONÔMETRO CENTRAL DE 45s */}
              <div className={`presenter-timer-box ${tempoRestante <= 10 ? 'is-warning pulse' : ''}`}>
                <span className="presenter-timer-num">{faseRodada === 'REVELACAO' ? 'TEMPO' : tempoRestante}</span>
                <span className="presenter-timer-label">{faseRodada === 'REVELACAO' ? 'ENCERRADO' : 'SEGUNDOS'}</span>
              </div>

              <div className="presenter-hud-badge">
                <span className="hud-badge-label">RESPOSTAS RECEBIDAS</span>
                <span className="hud-badge-val">
                  {estadoTelao.totalRespostasRecebidas} / {estadoTelao.totalJogadoresAtivos}
                </span>
              </div>
            </div>

            {/* ENUNCIADO DA PERGUNTA NO TELÃO (FONTE GRANDE E LEGÍVEL) */}
            <div className="presenter-question-banner">
              <h1 className="presenter-question-text">{estadoTelao.enunciado}</h1>
            </div>

            {/* GRID DAS 4 ALTERNATIVAS COM TEXTO COMPLETO */}
            <div className="presenter-options-grid">
              {(estadoTelao.alternativas || []).map((alt) => {
                const isCorreta = faseRodada === 'REVELACAO' && alt.numero === estadoTelao.alternativaCorretaNumero
                const votos = estadoTelao.votosPorAlternativa?.[alt.numero] || 0
                const percent = estadoTelao.totalRespostasRecebidas > 0
                  ? Math.round((votos / estadoTelao.totalRespostasRecebidas) * 100)
                  : 0

                return (
                  <AlternativaItem
                    key={alt.numero}
                    numero={alt.numero}
                    texto={alt.texto}
                    correto={isCorreta}
                    revelado={faseRodada === 'REVELACAO'}
                    votos={votos}
                    percentual={percent}
                  />
                )
              })}
            </div>

            {/* EXPLICAÇÃO PEDAGÓGICA DA CPTM (EXIBIDA APENAS NA REVELAÇÃO) */}
            {faseRodada === 'REVELACAO' && estadoTelao.explicacao && (
              <GameCard className="presenter-explanation-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cptm-gold)', fontWeight: 800 }}>
                  <Sparkles size={20} />
                  <span>Você sabia? • História da CPTM</span>
                </div>
                <p className="presenter-explanation-text">{estadoTelao.explicacao}</p>
              </GameCard>
            )}

            {/* BARRA INFERIOR DE CONTROLE DE RITMO DO APRESENTADOR */}
            <div className="presenter-controls-bar">
              {faseRodada === 'PERGUNTA' ? (
                <GameButton
                  id="btn-revelar-resposta"
                  variant="primary"
                  size="lg"
                  icon={Eye}
                  disabled={executandoAcao}
                  loading={executandoAcao}
                  onClick={handleRevelarResposta}
                >
                  Revelar Resposta
                </GameButton>
              ) : (
                <GameButton
                  id="btn-proxima-pergunta"
                  variant="gold"
                  size="lg"
                  iconRight={ChevronRight}
                  disabled={executandoAcao}
                  loading={executandoAcao}
                  onClick={handleProximaPergunta}
                  className="btn-pulse"
                >
                  {estadoTelao.nivelAtual >= 10 ? 'Ver Pódio Final' : 'Próxima Pergunta'}
                </GameButton>
              )}
            </div>
          </div>
        )}

        {/* FASE 3: RESULTADO FINAL (PÓDIO OLÍMPICO E RANKING DA SALA) */}
        {statusSala === 'FINALIZADA' && (
          <div className="presenter-final-stage">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div className="final-results-ended-tag">Partida Encerrada</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0.5rem 0' }}>
                Pódio dos Campeões • Show do Trilhão
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Sala {salaTelaoAtiva.codigo} • Resultado Oficial registrado pelo backend
              </p>
            </div>

            <Podium players={rankingFinalSala} formatScore={formatarMoeda} />

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
              <GameButton
                variant="secondary"
                size="lg"
                icon={ArrowLeft}
                onClick={() => {
                  setSalaTelaoAtiva(null)
                  setEstadoTelao(null)
                  carregarSalas()
                }}
              >
                Voltar ao Painel
              </GameButton>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ========================================================
  // MODO 2: CABINE DE CONTROLE (GESTÃO DE SALAS & PERGUNTAS)
  // ========================================================
  const handleCriarSala = async (e) => {
    e.preventDefault()
    if (!nomeNovaSala.trim()) return

    setCriandoSala(true)
    try {
      const nova = await salaService.criarSala({ nome: nomeNovaSala.trim() })
      toast.success(`Sala "${nova.nome}" criada com o código ${nova.codigo}!`, 'Sala Criada')
      setNomeNovaSala('')
      setModalNovaSalaAberto(false)
      carregarSalas()
      abrirLobbyTelao(nova)
    } catch (err) {
      console.error('Erro ao criar sala:', err)
      toast.error('Não foi possível criar a sala. Verifique a conexão com o servidor.')
    } finally {
      setCriandoSala(false)
    }
  }

  const handleAlternarStatusSala = async (id) => {
    try {
      const atualizada = await salaService.alternarStatus(id)
      toast.success(`Sala ${atualizada.codigo} ${atualizada.ativa ? 'ativada' : 'desativada'}.`)
      carregarSalas()
    } catch (err) {
      console.error('Erro ao alterar status:', err)
      toast.error('Não foi possível alterar o status da sala.')
    }
  }

  const perguntasFiltradas = perguntas.filter((p) => {
    if (filtroNivel === 'todos') return true
    return p.nivelDificuldade === Number(filtroNivel)
  })

  return (
    <div className="presenter-page-container">
      <header className="presenter-header">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', marginBottom: '0.75rem' }}>
          <CptmLogo size="lg" />
          <GameLogo size="md" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', marginTop: '0.5rem' }}>
          Cabine de Controle • Mestre de Cerimônias
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Apresentador: <strong>{user?.nome || 'Silvio dos Trilhos'}</strong>. Crie salas coletivas ou gerencie perguntas.
        </p>

        {/* Abas */}
        <div className="presenter-tabs-row" role="tablist" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <GameButton
            variant={abaAtiva === 'salas' ? 'primary' : 'secondary'}
            size="md"
            icon={LayoutDashboard}
            onClick={() => setAbaAtiva('salas')}
          >
            Salas de Jogo
          </GameButton>
          <GameButton
            variant={abaAtiva === 'perguntas' ? 'primary' : 'secondary'}
            size="md"
            icon={HelpCircle}
            onClick={() => setAbaAtiva('perguntas')}
          >
            Banco de Perguntas
          </GameButton>
        </div>
      </header>

      {/* ABA DE SALAS */}
      {abaAtiva === 'salas' && (
        <section className="presenter-section">
          <div className="section-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Minhas Salas de Jogo</h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <GameButton
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={carregarSalas}
                title="Atualizar lista de salas"
              >
                Atualizar
              </GameButton>
              <GameButton
                id="btn-abrir-modal-nova-sala"
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => setModalNovaSalaAberto(true)}
              >
                Criar Nova Sala
              </GameButton>
            </div>
          </div>

          {carregandoSalas ? (
            <div className="loading-state">
              <RefreshCw size={32} className="spin" style={{ color: 'var(--cptm-gold)' }} />
              <p>Carregando salas do servidor...</p>
            </div>
          ) : salas.length === 0 ? (
            <GameCard className="empty-state-box" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <Tv size={42} style={{ color: 'var(--cptm-gold)', opacity: 0.85, margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ color: '#FFFFFF', fontWeight: 800 }}>Nenhuma sala criada</h3>
              <p style={{ color: 'var(--text-muted)' }}>Clique no botão acima para criar uma nova sala e abrir o telão oficial do jogo.</p>
            </GameCard>
          ) : (
            <div className="rooms-grid">
              {salas.map((sala) => (
                <GameCard key={sala.id} className={`room-card ${!sala.ativa ? 'is-inactive' : ''}`}>
                  <div className="room-card-header">
                    <div>
                      <span className="room-code-tag">{sala.codigo}</span>
                      <h3 className="room-card-title">{sala.nome}</h3>
                    </div>
                    <span className={`status-pill ${sala.ativa ? 'active' : 'inactive'}`}>
                      {sala.ativa ? (sala.status || 'Ativa') : 'Desativada'}
                    </span>
                  </div>

                  <div className="room-card-meta">
                    <span>Criada em: {new Date(sala.criadaEm).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <div className="room-card-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <GameButton
                      id={`btn-abrir-telao-${sala.codigo}`}
                      variant="gold"
                      size="sm"
                      icon={Tv}
                      onClick={() => abrirLobbyTelao(sala)}
                      title="Abrir Telão da Sala"
                    >
                      Abrir Telão
                    </GameButton>
                    <GameButton
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      onClick={() => copiarCodigo(sala.codigo)}
                      title="Copiar Código"
                    >
                      Copiar
                    </GameButton>
                    <GameButton
                      variant="subtle"
                      size="sm"
                      icon={Power}
                      onClick={() => handleAlternarStatusSala(sala.id)}
                      title={sala.ativa ? 'Desativar Sala' : 'Ativar Sala'}
                    />
                  </div>
                </GameCard>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ABA DE PERGUNTAS */}
      {abaAtiva === 'perguntas' && (
        <section className="presenter-section">
          <div className="section-actions-bar">
            <div>
              <h2 className="section-title">Acervo Oficial de Perguntas</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Total de {perguntas.length} perguntas cadastradas de níveis 1 a 10.
              </p>
            </div>
            <GameButton
              variant="secondary"
              size="sm"
              onClick={carregarPerguntas}
              icon={<RefreshCw size={16} className={carregandoPerguntas ? 'spin' : ''} />}
            >
              Atualizar
            </GameButton>
          </div>

          <div className="questions-filter-strip">
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Filtrar por Nível:</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFiltroNivel('todos')}
                className={`filter-chip ${filtroNivel === 'todos' ? 'is-active' : ''}`}
              >
                Todos
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFiltroNivel(String(n))}
                  className={`filter-chip ${filtroNivel === String(n) ? 'is-active' : ''}`}
                >
                  Nível {n}
                </button>
              ))}
            </div>
          </div>

          <div className="questions-list-grid">
            {perguntasFiltradas.map((p) => (
              <div key={p.id} className="question-card">
                <div className="question-card-top">
                  <span className="question-level-badge">Nível {p.nivelDificuldade}</span>
                  <span className="question-reward-badge">{formatarMoeda(p.valorPremio)}</span>
                </div>
                <h4 className="question-card-enunciado">{p.enunciado}</h4>
                <div className="question-alts-preview">
                  {(p.alternativas || []).map((a) => (
                    <div key={a.numero} className={`alt-preview-row ${a.correta ? 'is-correct' : ''}`}>
                      <span className="alt-num">{a.numero}</span>
                      <span className="alt-txt">{a.texto}</span>
                      {a.correta && <CheckCircle size={14} style={{ color: '#22c55e', marginLeft: 'auto' }} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODAL: CRIAR NOVA SALA */}
      <GameModal
        isOpen={modalNovaSalaAberto}
        onClose={() => setModalNovaSalaAberto(false)}
        title="Criar Sala de Jogo"
      >
        <form onSubmit={handleCriarSala} className="game-form">
          <div className="form-group">
            <label htmlFor="nome-sala-input">Nome ou Identificação da Sala:</label>
            <input
              id="nome-sala-input"
              type="text"
              value={nomeNovaSala}
              onChange={(e) => setNomeNovaSala(e.target.value)}
              placeholder="Ex: Expresso Luz - Turma das 14h"
              className="input-cptm"
              maxLength={80}
              required
              autoFocus
            />
            <span className="form-hint">
              O backend irá gerar automaticamente um código exclusivo de embarque (ex: CPTM-ABCD).
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <GameButton
              type="button"
              variant="secondary"
              onClick={() => setModalNovaSalaAberto(false)}
            >
              Cancelar
            </GameButton>
            <GameButton
              type="submit"
              variant="primary"
              disabled={criandoSala || !nomeNovaSala.trim()}
              icon={<Save size={16} />}
            >
              {criandoSala ? 'Criando...' : 'Confirmar e Abrir Telão'}
            </GameButton>
          </div>
        </form>
      </GameModal>
    </div>
  )
}
