import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { partidaService } from '../services/api'
import confetti from 'canvas-confetti'
import { Clock, AlertTriangle, CheckCircle, ArrowLeft, Train, Award, Check, RotateCcw, Trophy } from 'lucide-react'
import apresentadorImg from '../assets/apresentador.png'
import gameLogo from '../assets/logo.png'

// Escada oficial das 10 perguntas até 1 Milhão
const ESCADA_PREMIOS = [
  { numero: 10, valor: 'R$ 1.000.000', valorNumerico: 1000000, especial: true },
  { numero: 9, valor: 'R$ 500.000', valorNumerico: 500000 },
  { numero: 8, valor: 'R$ 300.000', valorNumerico: 300000 },
  { numero: 7, valor: 'R$ 200.000', valorNumerico: 200000 },
  { numero: 6, valor: 'R$ 100.000', valorNumerico: 100000 },
  { numero: 5, valor: 'R$ 50.000', valorNumerico: 50000 },
  { numero: 4, valor: 'R$ 25.000', valorNumerico: 25000 },
  { numero: 3, valor: 'R$ 10.000', valorNumerico: 10000 },
  { numero: 2, valor: 'R$ 5.000', valorNumerico: 5000 },
  { numero: 1, valor: 'R$ 1.000', valorNumerico: 1000 },
]

const LETRAS = ['A', 'B', 'C', 'D']

export default function Jogo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  // Estados de Partida
  const [partidaId, setPartidaId] = useState(id || null)
  const [partidaInfo, setPartidaInfo] = useState(null)
  const [pergunta, setPergunta] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erroInicial, setErroInicial] = useState('')

  // Estados de Gameplay
  const [selecionada, setSelecionada] = useState(null)
  const [confirmado, setConfirmado] = useState(false)
  const [enviandoResposta, setEnviandoResposta] = useState(false)
  const [tempoRestante, setTempoRestante] = useState(30)
  const [respostaFeedback, setRespostaFeedback] = useState(null) // dados do retorno da resposta
  const [proximaPerguntaPendente, setProximaPerguntaPendente] = useState(null)

  // Estados de Fim de Jogo
  const [fimDeJogo, setFimDeJogo] = useState(null) // 'vitoria' | 'derrota' | null
  const [acertosFinais, setAcertosFinais] = useState(0)
  const [premioFinal, setPremioFinal] = useState(0)

  // Ref para controle de confetes contínuos na tela de vitória
  const confettiIntervalRef = useRef(null)

  // Função auxiliar de confete com cores CPTM
  const dispararConfetesCPTM = useCallback((particleCount = 100) => {
    confetti({
      particleCount,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#E2001A', '#FFFFFF', '#707173', '#F5B800'],
    })
  }, [])

  // Inicialização ou carregamento da partida
  useEffect(() => {
    let montado = true

    const inicializar = async () => {
      setCarregando(true)
      setErroInicial('')

      try {
        let currentId = id

        // Se não tiver ID na URL, mas veio pelo state de navegação da Home
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
            navigate(`/jogo/${currentId}`, { replace: true })
          }
        }

        if (!currentId) {
          setErroInicial('Nenhuma partida informada. Volte à página inicial e entre em uma sala.')
          setCarregando(false)
          return
        }

        // Busca o status atual no backend
        const status = await partidaService.buscarStatus(currentId)
        if (!montado) return

        setPartidaInfo(status)

        if (status.status === 'VITORIA') {
          setFimDeJogo('vitoria')
          setAcertosFinais(10)
          setPremioFinal(1000000)
        } else if (status.status === 'ELIMINADO' || status.status === 'ABANDONADA') {
          setFimDeJogo('derrota')
          setAcertosFinais(status.nivelAlcancado || 0)
          setPremioFinal(status.pontuacaoFinal || 0)
        } else if (status.perguntaAtual) {
          setPergunta(status.perguntaAtual)
          setTempoRestante(30)
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

  // Trata tempo esgotado
  const handleTempoEsgotado = useCallback(async () => {
    if (confirmado || enviandoResposta || fimDeJogo || !pergunta) return
    setConfirmado(true)
    setEnviandoResposta(true)

    try {
      const resp = await partidaService.responder(partidaId, {
        alternativaId: null,
        perguntaId: pergunta.id,
        tempoEsgotado: true,
      })

      setRespostaFeedback(resp)
      setAcertosFinais(resp.nivelAlcancado || 0)
      setPremioFinal(resp.pontuacaoAtual || 0)

      setTimeout(() => {
        setFimDeJogo('derrota')
      }, 1800)
    } catch (err) {
      console.error('Erro ao registrar tempo esgotado:', err)
      setFimDeJogo('derrota')
    } finally {
      setEnviandoResposta(false)
    }
  }, [confirmado, enviandoResposta, fimDeJogo, partidaId, pergunta])

  // Timer regressivo
  useEffect(() => {
    if (confirmado || fimDeJogo || carregando || tempoRestante <= 0) return

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
  }, [confirmado, fimDeJogo, carregando, tempoRestante, handleTempoEsgotado])

  // Efeito de confetes contínuos na tela de vitória
  useEffect(() => {
    if (fimDeJogo === 'vitoria') {
      dispararConfetesCPTM(150)
      confettiIntervalRef.current = setInterval(() => {
        dispararConfetesCPTM(50)
      }, 2500)
    }

    return () => {
      if (confettiIntervalRef.current) {
        clearInterval(confettiIntervalRef.current)
        confettiIntervalRef.current = null
      }
    }
  }, [fimDeJogo, dispararConfetesCPTM])

  // Submissão da Resposta
  const handleConfirmar = async () => {
    if (!selecionada || confirmado || enviandoResposta || !pergunta) return
    setConfirmado(true)
    setEnviandoResposta(true)

    try {
      const resp = await partidaService.responder(partidaId, {
        alternativaId: selecionada,
        perguntaId: pergunta.id,
        tempoEsgotado: false,
      })

      setRespostaFeedback(resp)

      if (resp.acertou) {
        dispararConfetesCPTM(100)

        if (resp.statusPartida === 'VITORIA') {
          // Vitória! 10ª pergunta acertada
          setAcertosFinais(10)
          setPremioFinal(1000000)
          setTimeout(() => {
            setFimDeJogo('vitoria')
          }, 1500)
        } else {
          // Continua para próxima
          setProximaPerguntaPendente(resp.proximaPergunta)
        }
      } else {
        // Errou: encerra a partida na hora
        setAcertosFinais(resp.nivelAlcancado || 0)
        setPremioFinal(resp.pontuacaoAtual || 0)
        setTimeout(() => {
          setFimDeJogo('derrota')
        }, 2200)
      }
    } catch (err) {
      console.error('Erro ao responder pergunta:', err)
      const msg = err.response?.data?.mensagem || 'Erro ao processar resposta.'
      alert(msg)
      setConfirmado(false)
    } finally {
      setEnviandoResposta(false)
    }
  };

  // Avançar para a próxima pergunta recebida do backend
  const handleAvancarProxima = () => {
    if (!proximaPerguntaPendente) return
    setPergunta(proximaPerguntaPendente)
    setProximaPerguntaPendente(null)
    setSelecionada(null)
    setConfirmado(false)
    setRespostaFeedback(null)
    setTempoRestante(30)
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(valor || 0)
  }

  // ========================================================
  // RENDER: TELA DE VITÓRIA (ACERTOU AS 10 PERGUNTAS)
  // ========================================================
  if (fimDeJogo === 'vitoria') {
    return (
      <div className="victory-screen-wrapper">
        {/* Balões Dourados Flutuantes (CSS Puro, pointer-events: none) */}
        <div className="balloons-container" aria-hidden="true">
          <div className="balloon balloon-1" style={{ left: '8%', animationDelay: '0s', animationDuration: '6.5s' }} />
          <div className="balloon balloon-2" style={{ left: '20%', animationDelay: '1.8s', animationDuration: '5.8s' }} />
          <div className="balloon balloon-3" style={{ left: '35%', animationDelay: '0.7s', animationDuration: '7.2s' }} />
          <div className="balloon balloon-4" style={{ left: '52%', animationDelay: '2.4s', animationDuration: '6.1s' }} />
          <div className="balloon balloon-5" style={{ left: '68%', animationDelay: '1.1s', animationDuration: '6.9s' }} />
          <div className="balloon balloon-6" style={{ left: '82%', animationDelay: '2.8s', animationDuration: '5.5s' }} />
          <div className="balloon balloon-7" style={{ left: '92%', animationDelay: '0.4s', animationDuration: '7.5s' }} />
        </div>

        <div className="card victory-card">
          {/* Logo do Jogo Grande Centralizado */}
          <div className="victory-logo-wrap">
            <img src={gameLogo} alt="Show do Trilhão" className="victory-logo-large" />
          </div>

          {/* Apresentador do Show do Trilhão */}
          <div className="victory-presenter-wrap">
            <img src={apresentadorImg} alt="Apresentador Show do Trilhão" className="victory-presenter-image" />
          </div>

          {/* Mensagem Obrigatória de Vitória */}
          <h1 className="victory-headline">
            Vocês ganharam 1 Milhão de oportunidades para conhecer e explorar a ferrovia
          </h1>

          {/* Número 1.000.000 Dourado Pulsante */}
          <div className="victory-prize-number" aria-label="1 milhão">
            1.000.000
          </div>

          <p className="victory-subtext">
            Parabéns! Você completou as 10 estações do conhecimento ferroviário e se consagrou campeão absoluto dos trilhos da CPTM!
          </p>

          <div className="victory-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-primary btn-lg btn-pulse"
            >
              <RotateCcw size={20} />
              <span>Jogar de novo</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/ranking')}
              className="btn btn-secondary btn-lg"
            >
              <Trophy size={20} />
              <span>Ver ranking</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========================================================
  // RENDER: TELA DE DERROTA (ERROU QUALQUER PERGUNTA)
  // ========================================================
  if (fimDeJogo === 'derrota') {
    return (
      <div className="defeat-screen-wrapper">
        <div className="card defeat-card">
          <div className="defeat-icon-wrap">
            <AlertTriangle size={64} className="defeat-icon" />
          </div>

          {/* Mensagem Obrigatória de Derrota */}
          <h1 className="defeat-title">
            Não foi dessa vez, você errou
          </h1>

          <div className="defeat-stats-box">
            <div className="defeat-stat-item">
              <span className="stat-label">Perguntas Acertadas:</span>
              <span className="stat-value">{acertosFinais} de 10</span>
            </div>
            <div className="defeat-stat-divider" />
            <div className="defeat-stat-item">
              <span className="stat-label">Prêmio Acumulado:</span>
              <span className="stat-value gold-text">{formatarMoeda(premioFinal)}</span>
            </div>
          </div>

          {respostaFeedback && respostaFeedback.textoCorreta && (
            <div className="defeat-answer-recap">
              <p>A resposta correta era a alternativa <strong>{respostaFeedback.corretaNumero}</strong>: <em>"{respostaFeedback.textoCorreta}"</em></p>
              {respostaFeedback.explicacao && (
                <small className="defeat-explanation">{respostaFeedback.explicacao}</small>
              )}
            </div>
          )}

          <p className="defeat-subtext">
            Nos trilhos da CPTM, cada viagem é um novo aprendizado. Retorne à plataforma e tente novamente alcançar o 1 Milhão!
          </p>

          <div className="defeat-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-primary btn-lg"
            >
              <RotateCcw size={20} />
              <span>Jogar de novo</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/ranking')}
              className="btn btn-secondary btn-lg"
            >
              <Trophy size={20} />
              <span>Ver ranking</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========================================================
  // RENDER: CARREGAMENTO OU ERRO INICIAL
  // ========================================================
  if (carregando) {
    return (
      <div className="game-loading-container">
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Train size={48} className="pulse" style={{ color: 'var(--cptm-red)', margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ textTransform: 'uppercase', fontWeight: 900, marginBottom: '0.5rem' }}>Embarcando na Partida...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Conectando aos trilhos da CPTM e preparando suas 10 perguntas.</p>
        </div>
      </div>
    )
  }

  if (erroInicial) {
    return (
      <div className="game-error-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '560px', margin: '0 auto' }}>
          <AlertTriangle size={48} style={{ color: 'var(--cptm-red)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ textTransform: 'uppercase', fontWeight: 900, marginBottom: '1rem' }}>Aviso da Estação</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>{erroInicial}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button type="button" onClick={() => navigate('/')} className="btn btn-primary btn-md">
              <ArrowLeft size={18} />
              <span>Voltar para o Início</span>
            </button>
            <button type="button" onClick={() => navigate('/ranking')} className="btn btn-secondary btn-md">
              <Trophy size={18} />
              <span>Ver Ranking</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!pergunta) {
    return null
  }

  const numeroAtual = pergunta.numeroPerguntaAtual || (partidaInfo?.perguntaAtualIndex != null ? partidaInfo.perguntaAtualIndex + 1 : 1)

  // ========================================================
  // RENDER: TELA DE GAMEPLAY (QUIZ EM ANDAMENTO)
  // ========================================================
  return (
    <div className="game-screen">
      {/* Placar Eletrônico / HUD Superior */}
      <div className="game-status-bar card">
        <div className="game-info-col">
          <span className="badge badge-cptm">
            Pergunta {numeroAtual} de 10
          </span>
          <span className="game-diff">Nível: {pergunta.nivelDificuldade}</span>
          <span className="room-sub">
            {partidaInfo?.salaNome || 'Linhas da CPTM'} • {partidaInfo?.jogadorNome || user?.nome || 'Passageiro'}
          </span>
        </div>

        <div className="game-timer-col" aria-label="Cronômetro">
          <Clock size={24} className={tempoRestante <= 10 ? 'timer-danger' : ''} />
          <span className={`timer-count ${tempoRestante <= 10 ? 'pulse' : ''}`}>
            {tempoRestante.toString().padStart(2, '0')}s
          </span>
        </div>

        <div className="game-prize-col">
          <span className="prize-label">Prêmio Desta Pergunta:</span>
          <span className="prize-value">
            {formatarMoeda(pergunta.valorPremio)}
          </span>
        </div>
      </div>

      {/* Grid Principal de Jogo com Escada de Prêmios */}
      <div className="game-layout-grid">
        {/* Painel Central da Pergunta e Alternativas */}
        <div className="game-main-area">
          <div className="card question-card">
            {/* Bloco do Apresentador e Enunciado */}
            <div className="presenter-bubble">
              <img
                src={apresentadorImg}
                alt="Apresentador"
                className="presenter-mini"
              />
              <div className="speech-text">
                <span className="category-tag">Pergunta {numeroAtual} de 10</span>
                <h2 className="question-statement">{pergunta.enunciado}</h2>
              </div>
            </div>

            {/* 4 Alternativas em formato Pílula / Game Show */}
            <div className="options-grid" role="group" aria-label="Alternativas da Pergunta">
              {pergunta.alternativas?.map((alt, idx) => {
                let btnClass = 'option-btn'
                if (selecionada === alt.id) btnClass += ' selected'

                if (confirmado && respostaFeedback) {
                  const isCorreta = respostaFeedback.corretaNumero === alt.numero
                  if (isCorreta) {
                    btnClass += ' correct'
                  } else if (selecionada === alt.id && !respostaFeedback.acertou) {
                    btnClass += ' wrong'
                  }
                }

                return (
                  <button
                    key={alt.id}
                    type="button"
                    disabled={confirmado || enviandoResposta}
                    onClick={() => setSelecionada(alt.id)}
                    className={btnClass}
                  >
                    <span className="option-letter">{alt.numero ? LETRAS[alt.numero - 1] : LETRAS[idx]}</span>
                    <span className="option-text">{alt.texto}</span>
                  </button>
                )
              })}
            </div>

            {/* Feedback Visual Imediato */}
            {confirmado && respostaFeedback && (
              <div className={`answer-feedback ${respostaFeedback.acertou ? 'acertou' : 'errou'}`} role="alert">
                {respostaFeedback.acertou ? (
                  <>
                    <CheckCircle size={32} />
                    <div>
                      <h4>Certa Resposta!</h4>
                      <p>{respostaFeedback.mensagem || 'Você garantiu mais uma etapa rumo ao 1 Milhão!'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={32} />
                    <div>
                      <h4>Resposta Incorreta!</h4>
                      <p>Encerrando a partida...</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Controles de Ação da Partida */}
            <div className="game-actions">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn btn-secondary btn-md"
              >
                <ArrowLeft size={16} />
                <span>Desembarcar</span>
              </button>

              {!confirmado ? (
                <button
                  type="button"
                  disabled={!selecionada || enviandoResposta}
                  onClick={handleConfirmar}
                  className="btn btn-primary btn-lg btn-pulse"
                >
                  <span>{enviandoResposta ? 'Validando...' : 'Confirmar Resposta'}</span>
                </button>
              ) : proximaPerguntaPendente ? (
                <button
                  type="button"
                  onClick={handleAvancarProxima}
                  className="btn btn-primary btn-lg btn-pulse"
                >
                  <span>Próxima Estação</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Escada de Prêmios (Painel Lateral de Progresso) */}
        <aside className="card prize-ladder-card" aria-label="Escada de Prêmios">
          <div className="prize-ladder-title">
            <Award size={18} />
            <span>Escada do Trilhão</span>
          </div>

          <div className="ladder-list">
            {ESCADA_PREMIOS.map((degrau) => {
              const isAtual = degrau.numero === numeroAtual
              const isVencido = degrau.numero < numeroAtual
              let stepClass = 'ladder-step'
              if (isAtual) stepClass += ' current'
              if (isVencido) stepClass += ' cleared'
              if (degrau.especial) stepClass += ' trilhao-step'

              return (
                <div key={degrau.numero} className={stepClass}>
                  <div className="step-label">
                    {isAtual ? (
                      <Train size={14} className="pulse" />
                    ) : isVencido ? (
                      <Check size={14} />
                    ) : (
                      <span>{degrau.numero}</span>
                    )}
                    <span>Estação {degrau.numero}</span>
                  </div>
                  <span className="step-value">{degrau.valor}</span>
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}
