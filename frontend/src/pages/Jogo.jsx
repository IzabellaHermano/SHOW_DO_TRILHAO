import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { partidaService, rankingService } from '../services/api'
import { useToast } from '../context/ToastContext'
import confetti from 'canvas-confetti'
import {
  Train,
  Check,
  CheckCircle2,
  Lock,
  RotateCcw,
  Trophy,
  LogOut,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Flame,
  Users
} from 'lucide-react'
import CptmLogo from '../components/CptmLogo'
import GameTitle from '../components/GameTitle'
import CircularTimer from '../components/CircularTimer'
import MetroTimeline from '../components/MetroTimeline'
import GameModal from '../components/GameModal'
import Podium from '../components/Podium'

export default function Jogo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const toast = useToast()

  // Estados Base da Partida
  const [partidaId, setPartidaId] = useState(id || null)
  const [partidaInfo, setPartidaInfo] = useState(null)
  const [pergunta, setPergunta] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erroInicial, setErroInicial] = useState('')

  // Estados de Fluxo das Telas (Painéis 3, 5, 6, 7, 8, 9, 10, 11)
  const [faseTela, setFaseTela] = useState('lobby_jogador') // 'lobby_jogador' | 'pergunta' | 'travada' | 'reveal' | 'transicao' | 'fim'
  const [selecionada, setSelecionada] = useState(null)
  const [tempoRestante, setTempoRestante] = useState(45)
  const [enviandoResposta, setEnviandoResposta] = useState(false)
  const [respostaFeedback, setRespostaFeedback] = useState(null)
  const [proximaPerguntaPendente, setProximaPerguntaPendente] = useState(null)
  const [premioAcumulado, setPremioAcumulado] = useState(0)

  // Gamificação & Estatísticas
  const [sequenciaAcertos, setSequenciaAcertos] = useState(0)
  const [posicaoDelta, setPosicaoDelta] = useState(1)
  const [participantesRespondidos, setParticipantesRespondidos] = useState(1)
  const [totalParticipantes, setTotalParticipantes] = useState(1)
  const [rankingSala, setRankingSala] = useState([])

  // Modal de Abandono
  const [mostrarModalAbandono, setMostrarModalAbandono] = useState(false)
  const [abandonando, setAbandonando] = useState(false)

  // Fim de Jogo
  const [fimDeJogo, setFimDeJogo] = useState(null) // 'vitoria' | 'derrota' | null
  const [acertosFinais, setAcertosFinais] = useState(0)
  const [motivoDerrota, setMotivoDerrota] = useState('')

  const confettiIntervalRef = useRef(null)

  const dispararConfetes = useCallback((count = 120) => {
    confetti({
      particleCount: count,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#FFC629', '#ED102B', '#0879F9', '#00CC74', '#FFFFFF'],
    })
  }, [])

  // Formatação de Moeda
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(valor || 0)
  }

  // Inicialização da Partida
  useEffect(() => {
    let montado = true

    const inicializar = async () => {
      setCarregando(true)
      setErroInicial('')

      try {
        let currentId = id

        // Se veio redirecionado com código de sala pelo state
        if (!currentId && location.state?.codigoSala) {
          const codigo = location.state.codigoSala
          const nome = location.state.nomeJogador || 'Passageiro'
          let partidaCriada = null

          if (isAuthenticated) {
            partidaCriada = await partidaService.iniciarJogador(codigo)
          } else {
            partidaCriada = await partidaService.iniciarVisitante(codigo, nome)
          }

          if (partidaCriada && partidaCriada.id) {
            currentId = partidaCriada.id
            setPartidaId(currentId)
            navigate(`/jogo/${currentId}`, { replace: true, state: location.state })
          }
        }

        if (!currentId) {
          setErroInicial('Nenhuma partida informada. Volte à página inicial e entre em uma sala.')
          setCarregando(false)
          return
        }

        const status = await partidaService.buscarStatus(currentId)
        if (!montado) return

        setPartidaInfo(status)
        setPremioAcumulado(status.pontuacaoFinal || 0)

        // Carrega dados de ranking da sala para o pódio e top 5
        if (status.codigoSala) {
          try {
            const ranking = await rankingService.obterRankingSala(status.codigoSala)
            if (ranking && ranking.length) {
              setRankingSala(ranking)
              setTotalParticipantes(Math.max(ranking.length, 1))
            }
          } catch (eRank) {
            console.warn('Ranking de sala:', eRank)
          }
        }

        if (status.status === 'VITORIA') {
          setFimDeJogo('vitoria')
          setAcertosFinais(10)
          setFaseTela('fim')
        } else if (status.status === 'ELIMINADO' || status.status === 'ABANDONADA') {
          setFimDeJogo('derrota')
          setAcertosFinais(status.nivelAlcancado || 0)
          setMotivoDerrota(status.status === 'ABANDONADA' ? 'Você abandonou a partida.' : 'Não foi dessa vez, você errou.')
          setFaseTela('fim')
        } else if (status.perguntaAtual) {
          setPergunta(status.perguntaAtual)
          setTempoRestante(45)
          // Se o usuário veio pelo fluxo de entrada, exibe brevemente o Lobby do Jogador (Panel 3)
          // antes de abrir a pergunta, garantindo a visualização da tela de confirmação
          if (location.state?.codigoSala && !sessionStorage.getItem(`lobby_visto_${currentId}`)) {
            sessionStorage.setItem(`lobby_visto_${currentId}`, 'true')
            setFaseTela('lobby_jogador')
          } else {
            setFaseTela('pergunta')
          }
        } else {
          setErroInicial('Não foi possível carregar a pergunta atual desta partida.')
        }
      } catch (err) {
        if (!montado) return
        console.error('Erro ao buscar status da partida:', err)
        const msg = err.response?.data?.mensagem || err.response?.data?.message || 'Erro ao conectar à partida no servidor.'
        setErroInicial(msg)
      } finally {
        if (montado) setCarregando(false)
      }
    }

    inicializar()

    return () => {
      montado = false
    }
  }, [id, isAuthenticated, location.state, navigate])

  // Trata tempo esgotado (45 segundos)
  const handleTempoEsgotado = useCallback(async () => {
    if (faseTela !== 'pergunta' || enviandoResposta || fimDeJogo || !pergunta) return
    setEnviandoResposta(true)

    try {
      const resp = await partidaService.responder(partidaId, {
        alternativaId: null,
        perguntaId: pergunta.id,
        tempoEsgotado: true,
      })

      setRespostaFeedback(resp)
      setAcertosFinais(resp.nivelAlcancado || 0)
      setPremioAcumulado(0)
      setMotivoDerrota('Tempo esgotado! Nos trilhos da CPTM, a pontualidade é essencial.')

      setFaseTela('reveal')
      setTimeout(() => {
        setFimDeJogo('derrota')
        setFaseTela('fim')
      }, 3500)
    } catch (err) {
      console.error('Erro ao registrar tempo esgotado:', err)
      setPremioAcumulado(0)
      setFimDeJogo('derrota')
      setFaseTela('fim')
    } finally {
      setEnviandoResposta(false)
    }
  }, [faseTela, enviandoResposta, fimDeJogo, partidaId, pergunta])

  // Cronômetro Regressivo de 45 segundos
  useEffect(() => {
    if (faseTela !== 'pergunta' || carregando || tempoRestante <= 0 || mostrarModalAbandono) return

    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTempoEsgotado()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [faseTela, carregando, tempoRestante, mostrarModalAbandono, handleTempoEsgotado])

  // Chuva de confetes na tela de vitória
  useEffect(() => {
    if (fimDeJogo === 'vitoria') {
      dispararConfetes(180)
      confettiIntervalRef.current = setInterval(() => {
        dispararConfetes(60)
      }, 3000)
    }
    return () => {
      if (confettiIntervalRef.current) {
        clearInterval(confettiIntervalRef.current)
        confettiIntervalRef.current = null
      }
    }
  }, [fimDeJogo, dispararConfetes])

  // Ação de Travar Resposta (Painel 7 -> Painel 8 -> Painel 9)
  const handleTravarResposta = async () => {
    if (!selecionada || enviandoResposta || !pergunta) return
    setFaseTela('travada')
    setEnviandoResposta(true)

    try {
      const resp = await partidaService.responder(partidaId, {
        alternativaId: selecionada,
        perguntaId: pergunta.id,
        tempoEsgotado: false,
      })

      setRespostaFeedback(resp)

      // Breve pausa dramática com cadeado (Painel 8: Resposta Travada)
      setTimeout(() => {
        setFaseTela('reveal')

        if (resp.acertou) {
          dispararConfetes(90)
          setSequenciaAcertos((s) => s + 1)
          setPosicaoDelta((p) => Math.min(p + 1, 3))
          setPremioAcumulado(resp.pontuacaoAtual || pergunta.valorPremio)

          if (resp.statusPartida === 'VITORIA') {
            setAcertosFinais(10)
            setPremioAcumulado(1000000)
            setTimeout(() => {
              setFimDeJogo('vitoria')
              setFaseTela('fim')
            }, 3000)
          } else {
            setProximaPerguntaPendente(resp.proximaPergunta)
          }
        } else {
          setSequenciaAcertos(0)
          setAcertosFinais(resp.nivelAlcancado || 0)
          setPremioAcumulado(0)
          setMotivoDerrota('Não foi dessa vez, você errou.')
          setTimeout(() => {
            setFimDeJogo('derrota')
            setFaseTela('fim')
          }, 3500)
        }
      }, 1400)
    } catch (err) {
      console.error('Erro ao responder pergunta:', err)
      const msg = err.response?.data?.mensagem || 'Erro ao processar resposta no servidor.'
      toast.error(msg, 'Erro na Estação')
      setFaseTela('pergunta')
    } finally {
      setEnviandoResposta(false)
    }
  }

  // Avançar para Próxima Pergunta com Transição (Painel 10)
  const handleAvancarProxima = () => {
    if (!proximaPerguntaPendente) return

    // Ativa Tela 10 (Transição com tunel iluminado)
    setFaseTela('transicao')

    setTimeout(() => {
      setPergunta(proximaPerguntaPendente)
      setProximaPerguntaPendente(null)
      setSelecionada(null)
      setRespostaFeedback(null)
      setTempoRestante(45)
      setFaseTela('pergunta')
    }, 2000)
  }

  // Abandonar Partida
  const handleConfirmarAbandono = async () => {
    setAbandonando(true)
    try {
      await partidaService.abandonar(partidaId)
      setMostrarModalAbandono(false)
      setPremioAcumulado(0)
      setMotivoDerrota('Você abandonou a partida e perdeu todo o prêmio acumulado.')
      setFimDeJogo('derrota')
      setFaseTela('fim')
    } catch (err) {
      console.error('Erro ao abandonar partida:', err)
      toast.error('Não foi possível abandonar a partida.', 'Aviso')
    } finally {
      setAbandonando(false)
    }
  }

  // Letra correspondente à alternativa (A, B, C, D)
  const getLetraAlternativa = (numero) => {
    const letras = ['A', 'B', 'C', 'D']
    return letras[numero - 1] || 'A'
  }

  const getClasseCorAlternativa = (numero) => {
    const classes = ['option-btn-a', 'option-btn-b', 'option-btn-c', 'option-btn-d']
    return classes[numero - 1] || 'option-btn-a'
  }

  // ========================================================
  // ESTADO DE CARREGAMENTO & ERRO INICIAL
  // ========================================================
  if (carregando) {
    return (
      <div className="home-hero-stage">
        <div className="player-lobby-card-box">
          <div className="player-train-badge">
            <Train size={42} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Preparando seu trem para a viagem...
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Calibrando cronômetro e sorteando perguntas oficiais.</p>
        </div>
      </div>
    )
  }

  if (erroInicial) {
    return (
      <div className="home-hero-stage">
        <div className="player-lobby-card-box" style={{ maxWidth: 480 }}>
          <AlertTriangle size={54} color="#ED102B" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Aviso da Estação</h2>
          <p style={{ color: 'var(--text-muted)' }}>{erroInicial}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-cptm btn-cptm-primary btn-lg"
            style={{ marginTop: '1rem' }}
          >
            Voltar ao Menu Principal
          </button>
        </div>
      </div>
    )
  }

  const nivelAtual =
    pergunta?.nivelDificuldade ||
    (partidaInfo?.perguntaAtualIndex != null ? partidaInfo.perguntaAtualIndex + 1 : 1)
  const nomeExibicao =
    partidaInfo?.nomeJogador || location.state?.nomeJogador || user?.nome || 'Passageiro'

  // ========================================================
  // TELA 03 — LOBBY DO JOGADOR (MOBILE - PAINEL 3)
  // ========================================================
  if (faseTela === 'lobby_jogador') {
    return (
      <div className="player-lobby-mobile">
        <div className="player-lobby-header">
          <CptmLogo size="md" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            SHOW DO TRILHÃO
          </span>
        </div>

        <div className="player-lobby-card-box">
          <div className="player-train-badge" aria-hidden="true">
            <Train size={44} />
          </div>

          <h1 className="player-lobby-title">Você está no Jogo</h1>

          <div className="player-name-chip-big">
            {nomeExibicao}
          </div>

          <div className="player-confirmed-tag">
            <CheckCircle2 size={20} />
            <span>Embarque confirmado!</span>
          </div>

          <button
            type="button"
            onClick={() => setFaseTela('pergunta')}
            className="btn-cptm btn-cptm-primary btn-lg btn-pulse"
            style={{ width: '100%', maxWidth: '300px', marginTop: '0.5rem' }}
          >
            <ArrowRight size={20} />
            <span>Iniciar Rodada</span>
          </button>
        </div>

        <div className="player-lobby-footer">
          <MetroTimeline total={10} current={1} showLabel={false} />
          <p className="player-waiting-text">
            Aguardando o apresentador iniciar o show...
          </p>
        </div>
      </div>
    )
  }

  // ========================================================
  // TELA 08 — RESPOSTA TRAVADA (PAINEL 8)
  // ========================================================
  if (faseTela === 'travada') {
    return (
      <div className="locked-screen-mobile">
        <div className="player-lobby-header">
          <CptmLogo size="md" />
        </div>

        <div className="locked-padlock-circle">
          <Lock size={56} />
        </div>

        <div>
          <h2 className="locked-title">Resposta Travada</h2>
          <p className="locked-subtext">Aguardando os outros jogadores...</p>
        </div>

        <div className="hud-bottom-bar" style={{ justifyContent: 'center' }}>
          <div className="responses-counter-pill">
            <Users size={18} />
            <span>{participantesRespondidos} / {totalParticipantes} responderam</span>
            <div className="responses-progress-track">
              <div
                className="responses-progress-fill"
                style={{ width: `${Math.min(100, (participantesRespondidos / totalParticipantes) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========================================================
  // TELA 10 — PRÓXIMA PERGUNTA (TRANSIÇÃO - PAINEL 10)
  // ========================================================
  if (faseTela === 'transicao') {
    return (
      <div className="transition-screen-stage">
        <GameTitle size="md" gold />
        <h1 className="transition-title-glow">Próxima Pergunta</h1>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <MetroTimeline total={10} current={nivelAtual + 1} showLabel={false} />
        </div>
      </div>
    )
  }

  // ========================================================
  // TELA 11 — RESULTADO FINAL (PÓDIO & TOP 5 - PAINEL 11)
  // ========================================================
  if (faseTela === 'fim' || fimDeJogo) {
    const rankingMockOuReal =
      rankingSala.length > 0
        ? rankingSala
        : [
            { id: 1, nomeJogador: nomeExibicao, pontuacaoFinal: premioAcumulado, nivelAlcancado: acertosFinais },
            { id: 2, nomeJogador: 'Carlos', pontuacaoFinal: 8110, nivelAlcancado: 9 },
            { id: 3, nomeJogador: 'Mariana', pontuacaoFinal: 7950, nivelAlcancado: 9 },
            { id: 4, nomeJogador: 'Pedro', pontuacaoFinal: 7120, nivelAlcancado: 8 },
            { id: 5, nomeJogador: 'Lucas', pontuacaoFinal: 6840, nivelAlcancado: 7 },
          ]

    return (
      <div className="final-results-stage">
        <header className="final-results-header">
          <CptmLogo size="md" />
          <GameTitle size="md" gold />
          <div className="final-results-ended-tag">Partida Encerrada</div>
        </header>

        <div className="final-results-body-grid">
          {/* Pódio Olímpico 3D */}
          <Podium players={rankingMockOuReal} formatScore={formatarMoeda} />

          {/* Lateral: TOP 5 FINAL */}
          <div className="top-5-card">
            <div className="top-5-title">TOP 5 FINAL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rankingMockOuReal.slice(0, 5).map((player, idx) => (
                <div
                  key={player.id || idx}
                  className={`top-5-row ${idx === 0 ? 'is-top-1' : ''}`}
                >
                  <div className="top-5-player-left">
                    <span style={{ color: idx === 0 ? '#FFC629' : 'var(--text-muted)' }}>
                      {idx + 1}º
                    </span>
                    <span>{player.nomeJogador || player.nome}</span>
                  </div>
                  <span className="top-5-score-gold">
                    {formatarMoeda(player.pontuacaoFinal || player.pontos)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ações Finais */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-cptm btn-cptm-primary btn-lg"
          >
            <RotateCcw size={18} />
            <span>Jogar Novamente</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/ranking')}
            className="btn-cptm btn-cptm-secondary btn-lg"
          >
            <Trophy size={18} />
            <span>Ver Ranking Geral</span>
          </button>
        </div>
      </div>
    )
  }

  // ========================================================
  // TELA 05 & 06 — PERGUNTA (TELÃO E MOBILE) & TELA 09 (REVEAL)
  // ========================================================
  return (
    <div className="gameplay-hud-container">
      {/* HUD SUPERIOR: LOGO + METRO TIMELINE + PRÊMIO + CRONÔMETRO */}
      <header className="hud-top-bar" role="banner">
        <CptmLogo size="md" />

        <div style={{ flex: 1, maxWidth: 420 }}>
          <MetroTimeline total={10} current={nivelAtual} showLabel />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="hud-prize-badge" title="Valor desta pergunta">
            {formatarMoeda(pergunta?.valorPremio || 25000)}
          </div>

          <CircularTimer
            seconds={tempoRestante}
            totalSeconds={45}
            size="md"
          />
        </div>
      </header>

      {/* ÁREA CENTRAL: ENUNCIADO E ALTERNATIVAS OU REVEAL */}
      <main style={{ margin: 'auto 0', width: '100%' }}>
        {faseTela === 'reveal' ? (
          /* TELA 09 — REVEAL / RESULTADO (PAINEL 9) */
          <div className="reveal-stage-container">
            {/* Banner Resposta Correta */}
            <div className="reveal-correct-box">
              <CheckCircle2 size={36} />
              <div>
                <div className="reveal-correct-badge">Resposta Correta!</div>
                <div className="reveal-correct-text">
                  {respostaFeedback?.textoCorreta ||
                    pergunta?.alternativas?.find((a) => a.correta)?.texto ||
                    'Opção Certa'}
                </div>
              </div>
            </div>

            {/* Barras Horizontais Kahoot de Estatísticas */}
            <div className="kahoot-bars-container">
              {[
                { letra: 'A', bg: '#ED102B', pct: 18 },
                { letra: 'B', bg: '#0879F9', pct: 12 },
                { letra: 'C', bg: '#00CC74', pct: 62 },
                { letra: 'D', bg: '#FFB900', pct: 8 },
              ].map(({ letra, bg, pct }) => (
                <div key={letra} className="kahoot-bar-row">
                  <div className="kahoot-bar-letter" style={{ backgroundColor: bg }}>
                    {letra}
                  </div>
                  <div className="kahoot-bar-track">
                    <div
                      className="kahoot-bar-fill"
                      style={{ width: `${pct}%`, backgroundColor: bg }}
                    />
                  </div>
                  <div className="kahoot-bar-percent">{pct}%</div>
                </div>
              ))}
            </div>

            {/* Card de Resultado Individual do Passageiro */}
            <div className="player-result-summary-card">
              <div className="player-result-header">Seu Resultado</div>
              <div className={`player-result-status-text ${respostaFeedback?.acertou ? 'status-acertou' : 'status-errou'}`}>
                {respostaFeedback?.acertou ? (
                  <>
                    <CheckCircle2 size={32} />
                    <span>Acertou!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={32} />
                    <span>Errou!</span>
                  </>
                )}
              </div>

              {respostaFeedback?.acertou && (
                <div className="player-result-points">
                  +{formatarMoeda(pergunta?.valorPremio || 25000)}
                </div>
              )}

              <div className="player-result-stats-row">
                <span>Total: <strong>{formatarMoeda(premioAcumulado)}</strong></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#00CC74' }}>
                  <TrendingUp size={15} /> {posicaoDelta} posições
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#FFB900' }}>
                  <Flame size={15} /> {sequenciaAcertos} seguidos
                </span>
              </div>
            </div>

            {/* Botão de Avanço */}
            {proximaPerguntaPendente && (
              <button
                type="button"
                id="btn-avancar-proxima"
                onClick={handleAvancarProxima}
                className="btn-cptm btn-cptm-primary btn-xl btn-block btn-pulse"
                style={{ marginTop: '0.5rem' }}
              >
                <span>Próxima Pergunta</span>
                <ArrowRight size={22} />
              </button>
            )}
          </div>
        ) : (
          /* TELA 05 / 06 / 07 — ENUNCIADO E ALTERNATIVAS */
          <>
            <div className="question-card-tv">
              <h1 className="question-text-tv">{pergunta?.enunciado}</h1>
            </div>

            <div className="options-grid-stage" role="radiogroup" aria-label="Alternativas">
              {pergunta?.alternativas?.map((alt) => {
                const isSelected = selecionada === alt.id
                const isDimmed = selecionada && !isSelected
                const letra = getLetraAlternativa(alt.numero)
                const corClasse = getClasseCorAlternativa(alt.numero)

                return (
                  <button
                    key={alt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={enviandoResposta}
                    onClick={() => setSelecionada(alt.id)}
                    className={`option-btn-kahoot ${corClasse} ${isSelected ? 'selected-option' : ''} ${isDimmed ? 'dimmed-option' : ''}`}
                  >
                    <div className="option-badge-letter">{letra}</div>
                    <div className="option-text-label">{alt.texto}</div>
                    {isSelected && (
                      <Check size={26} className="option-check-icon" strokeWidth={3} />
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </main>

      {/* HUD INFERIOR: CONTADOR DE RESPOSTAS + BOTÃO TRAVAR + BOTÃO ABANDONAR */}
      <footer className="hud-bottom-bar">
        <div className="responses-counter-pill">
          <Users size={18} />
          <span>{participantesRespondidos} / {totalParticipantes} responderam</span>
          <div className="responses-progress-track">
            <div
              className="responses-progress-fill"
              style={{ width: `${Math.min(100, (participantesRespondidos / totalParticipantes) * 100)}%` }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* TELA 07: BOTÃO TRAVAR RESPOSTA */}
          {faseTela === 'pergunta' && selecionada && (
            <button
              type="button"
              id="btn-travar-resposta"
              disabled={enviandoResposta}
              onClick={handleTravarResposta}
              className="btn-cptm btn-cptm-primary btn-lg btn-pulse"
            >
              <Lock size={18} />
              <span>Travar Resposta</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMostrarModalAbandono(true)}
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
            }}
            title="Abandonar partida"
          >
            <LogOut size={14} />
            <span>Abandonar</span>
          </button>
        </div>
      </footer>

      {/* MODAL DE CONFIRMAÇÃO DE ABANDONO */}
      <GameModal
        isOpen={mostrarModalAbandono}
        onClose={() => setMostrarModalAbandono(false)}
        title="Abandonar Partida?"
        icon={AlertTriangle}
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
            Atenção! Ao abandonar a partida você <strong>perde todo o prêmio acumulado</strong> ({formatarMoeda(premioAcumulado)}) e encerra com <strong>R$ 0</strong>.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setMostrarModalAbandono(false)}
              className="btn-cptm btn-cptm-secondary btn-md"
            >
              Continuar
            </button>
            <button
              type="button"
              disabled={abandonando}
              onClick={handleConfirmarAbandono}
              className="btn-cptm btn-cptm-primary btn-md"
            >
              {abandonando ? 'Saindo...' : 'Sim, Abandonar'}
            </button>
          </div>
        </div>
      </GameModal>
    </div>
  )
}
