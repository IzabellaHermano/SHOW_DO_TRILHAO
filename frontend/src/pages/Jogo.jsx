import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { partidaService } from '../services/api'
import confetti from 'canvas-confetti'
import { Clock, AlertTriangle, ArrowRight, RotateCcw, Trophy, LogOut, CheckCircle2 } from 'lucide-react'
import apresentadorImg from '../assets/apresentador.png'
import gameLogo from '../assets/logo.png'

export default function Jogo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  // Estados da Partida
  const [partidaId, setPartidaId] = useState(id || null)
  const [partidaInfo, setPartidaInfo] = useState(null)
  const [pergunta, setPergunta] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erroInicial, setErroInicial] = useState('')

  // Estados de Gameplay
  const [selecionada, setSelecionada] = useState(null)
  const [confirmado, setConfirmado] = useState(false)
  const [enviandoResposta, setEnviandoResposta] = useState(false)
  const [tempoRestante, setTempoRestante] = useState(45)
  const [respostaFeedback, setRespostaFeedback] = useState(null)
  const [proximaPerguntaPendente, setProximaPerguntaPendente] = useState(null)
  const [premioAcumulado, setPremioAcumulado] = useState(0)

  // Modal de Abandono
  const [mostrarModalAbandono, setMostrarModalAbandono] = useState(false)
  const [abandonando, setAbandonando] = useState(false)

  // Estados de Fim de Jogo
  const [fimDeJogo, setFimDeJogo] = useState(null) // 'vitoria' | 'derrota' | null
  const [acertosFinais, setAcertosFinais] = useState(0)
  const [motivoDerrota, setMotivoDerrota] = useState('')

  // Intervalo de Confetes contínuos na tela de vitória
  const confettiIntervalRef = useRef(null)

  const dispararConfetes = useCallback((count = 100) => {
    confetti({
      particleCount: count,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#F5B800', '#FFFFFF', '#E2001A', '#0047AB', '#00A859'],
    })
  }, [])

  // Inicialização da Partida
  useEffect(() => {
    let montado = true

    const inicializar = async () => {
      setCarregando(true)
      setErroInicial('')

      try {
        let currentId = id

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

        const status = await partidaService.buscarStatus(currentId)
        if (!montado) return

        setPartidaInfo(status)
        setPremioAcumulado(status.pontuacaoFinal || 0)

        if (status.status === 'VITORIA') {
          setFimDeJogo('vitoria')
          setAcertosFinais(10)
        } else if (status.status === 'ELIMINADO' || status.status === 'ABANDONADA') {
          setFimDeJogo('derrota')
          setAcertosFinais(status.nivelAlcancado || 0)
          setMotivoDerrota(status.status === 'ABANDONADA' ? 'Você abandonou a partida.' : 'Não foi dessa vez, você errou')
        } else if (status.perguntaAtual) {
          setPergunta(status.perguntaAtual)
          setTempoRestante(45)
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

  // Trata tempo esgotado (45s) -> Errou perde tudo
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
      setPremioAcumulado(0)
      setMotivoDerrota('Tempo esgotado! Nos trilhos da CPTM, a pontualidade é regra.')

      setTimeout(() => {
        setFimDeJogo('derrota')
      }, 2000)
    } catch (err) {
      console.error('Erro ao registrar tempo esgotado:', err)
      setPremioAcumulado(0)
      setFimDeJogo('derrota')
    } finally {
      setEnviandoResposta(false)
    }
  }, [confirmado, enviandoResposta, fimDeJogo, partidaId, pergunta])

  // Cronômetro Regressivo de 45 segundos
  useEffect(() => {
    if (confirmado || fimDeJogo || carregando || tempoRestante <= 0 || mostrarModalAbandono) return

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
  }, [confirmado, fimDeJogo, carregando, tempoRestante, mostrarModalAbandono, handleTempoEsgotado])

  // Chuva de confetes na tela de vitória
  useEffect(() => {
    if (fimDeJogo === 'vitoria') {
      dispararConfetes(160)
      confettiIntervalRef.current = setInterval(() => {
        dispararConfetes(60)
      }, 2500)
    }

    return () => {
      if (confettiIntervalRef.current) {
        clearInterval(confettiIntervalRef.current)
        confettiIntervalRef.current = null
      }
    }
  }, [fimDeJogo, dispararConfetes])

  // Envio de Resposta
  const handleConfirmarResposta = async () => {
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
        dispararConfetes(90)
        setPremioAcumulado(resp.pontuacaoAtual || pergunta.valorPremio)

        if (resp.statusPartida === 'VITORIA') {
          setAcertosFinais(10)
          setPremioAcumulado(1000000)
          setTimeout(() => {
            setFimDeJogo('vitoria')
          }, 1600)
        } else {
          setProximaPerguntaPendente(resp.proximaPergunta)
        }
      } else {
        // Errou = perde tudo (R$ 0)
        setAcertosFinais(resp.nivelAlcancado || 0)
        setPremioAcumulado(0)
        setMotivoDerrota('Não foi dessa vez, você errou')
        setTimeout(() => {
          setFimDeJogo('derrota')
        }, 2200)
      }
    } catch (err) {
      console.error('Erro ao responder pergunta:', err)
      const msg = err.response?.data?.mensagem || 'Erro ao processar resposta no servidor.'
      alert(msg)
      setConfirmado(false)
    } finally {
      setEnviandoResposta(false)
    }
  }

  // Avançar para próxima pergunta
  const handleAvancarProxima = () => {
    if (!proximaPerguntaPendente) return
    setPergunta(proximaPerguntaPendente)
    setProximaPerguntaPendente(null)
    setSelecionada(null)
    setConfirmado(false)
    setRespostaFeedback(null)
    setTempoRestante(45)
  }

  // Ação de Abandonar Partida (perde o prêmio acumulado = R$ 0)
  const handleConfirmarAbandono = async () => {
    setAbandonando(true)
    try {
      await partidaService.abandonar(partidaId)
      setMostrarModalAbandono(false)
      setPremioAcumulado(0)
      setMotivoDerrota('Você abandonou a partida e perdeu todo o prêmio acumulado.')
      setFimDeJogo('derrota')
    } catch (err) {
      console.error('Erro ao abandonar partida:', err)
      alert('Não foi possível abandonar a partida.')
    } finally {
      setAbandonando(false)
    }
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(valor || 0)
  }

  // ========================================================
  // TELA DE VITÓRIA (ACERTOU AS 10 PERGUNTAS)
  // ========================================================
  if (fimDeJogo === 'vitoria') {
    return (
      <div className="victory-fullscreen-wrapper">
        {/* Balões Dourados Subindo Pela Tela */}
        <div className="balloons-floating-area" aria-hidden="true">
          <div className="balloon-gold b1" />
          <div className="balloon-gold b2" />
          <div className="balloon-gold b3" />
          <div className="balloon-gold b4" />
          <div className="balloon-gold b5" />
          <div className="balloon-gold b6" />
          <div className="balloon-gold b7" />
        </div>

        <div className="victory-container-content">
          {/* Logo Grande do Show */}
          <div className="victory-logo-box">
            <img src={gameLogo} alt="Show do Trilhão" className="victory-logo-img" />
          </div>

          {/* Foto do Apresentador Oficial */}
          <div className="victory-host-box">
            <img src={apresentadorImg} alt="Silvio dos Trilhos" className="victory-host-photo" />
          </div>

          {/* Mensagem Obrigatória do Show */}
          <h1 className="victory-message-text">
            Vocês ganharam 1 Milhão de oportunidades para conhecer e explorar a ferrovia
          </h1>

          {/* 1000000 Grande, Dourado e Pulsando */}
          <div className="victory-gold-number pulse-gold" aria-label="1000000">
            1.000.000
          </div>

          <p className="victory-award-sub">
            Parabéns, novo milionário dos trilhos paulistas! Você dominou todas as 10 estações da CPTM com maestria absoluta!
          </p>

          <div className="victory-buttons-row">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-positive-action btn-lg"
            >
              <RotateCcw size={20} />
              <span>Jogar Novamente</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/ranking')}
              className="btn btn-show-light btn-lg"
            >
              <Trophy size={20} />
              <span>Ver Ranking Oficial</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========================================================
  // TELA DE ERRO / DERROTA (ERROU OU ABANDONOU = PERDE TUDO)
  // ========================================================
  if (fimDeJogo === 'derrota') {
    return (
      <div className="defeat-fullscreen-wrapper">
        <div className="defeat-card-box">
          <div className="defeat-icon-circle">
            <AlertTriangle size={56} className="defeat-alert-icon" />
          </div>

          <h1 className="defeat-heading">
            {motivoDerrota || 'Não foi dessa vez, você errou'}
          </h1>

          <div className="defeat-summary-box">
            <div className="summary-field">
              <span className="summary-label">Perguntas Acertadas:</span>
              <span className="summary-value">{acertosFinais} de 10</span>
            </div>
            <div className="summary-field">
              <span className="summary-label">Prêmio Final Conquistado:</span>
              <span className="summary-value zero-prize">R$ 0</span>
            </div>
          </div>

          {respostaFeedback && respostaFeedback.textoCorreta && (
            <div className="defeat-explanation-card">
              <p className="defeat-gabarito">
                Gabarito oficial: alternativa <strong>{respostaFeedback.corretaNumero}</strong>: "{respostaFeedback.textoCorreta}"
              </p>
              {respostaFeedback.explicacao && (
                <p className="defeat-exp-text">{respostaFeedback.explicacao}</p>
              )}
            </div>
          )}

          <p className="defeat-encouragement">
            Nos trilhos da vida e da ferrovia, cada parada é uma chance de aprender. Volte à plataforma e tente de novo!
          </p>

          <div className="defeat-actions-row">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-positive-action btn-lg"
            >
              <RotateCcw size={20} />
              <span>Tentar Novamente</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/ranking')}
              className="btn btn-secondary-show btn-lg"
            >
              <Trophy size={20} />
              <span>Ver Ranking</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Carregamento Inicial
  if (carregando) {
    return (
      <div className="game-loading-stage">
        <div className="game-loading-card">
          <div className="loading-spinner-cptm" />
          <h2>Aguarde, estamos preparando seu trem...</h2>
          <p>Sorteando perguntas oficiais e calibrando o cronômetro da rodada.</p>
        </div>
      </div>
    )
  }

  // Erro Inicial
  if (erroInicial) {
    return (
      <div className="game-loading-stage">
        <div className="game-loading-card">
          <AlertTriangle size={48} style={{ color: '#E2001A', margin: '0 auto 1rem auto' }} />
          <h2>Aviso dos Trilhos</h2>
          <p>{erroInicial}</p>
          <button type="button" onClick={() => navigate('/')} className="btn btn-positive-action btn-md" style={{ marginTop: '1.5rem' }}>
            <span>Voltar ao Menu Principal</span>
          </button>
        </div>
      </div>
    )
  }

  if (!pergunta) return null

  const nivelAtual = pergunta.nivelDificuldade || (partidaInfo?.perguntaAtualIndex != null ? partidaInfo.perguntaAtualIndex + 1 : 1)

  // ========================================================
  // TELA DE GAMEPLAY (QUIZ SHOW EM ANDAMENTO)
  // ========================================================
  return (
    <div className="gameplay-stage-wrapper">
      {/* BARRA SUPERIOR (HUD DO SHOW) */}
      <header className="gameplay-top-bar" role="banner">
        <div className="top-bar-left">
          <span className="game-show-title">SHOW DO TRILHÃO</span>
          <span className="game-level-tag">Nível {nivelAtual} de 10</span>
        </div>

        {/* Cronômetro Regressivo de 45 segundos */}
        <div className={`top-bar-center timer-pill ${tempoRestante <= 10 ? 'timer-urgent' : ''}`} aria-label={`Cronômetro: ${tempoRestante} segundos`}>
          <Clock size={22} className="timer-icon" />
          <span className="timer-seconds">{tempoRestante.toString().padStart(2, '0')}s</span>
        </div>

        <div className="top-bar-right">
          <div className="accumulated-box">
            <span className="accumulated-label">Prêmio Acumulado:</span>
            <span className="accumulated-value">{formatarMoeda(premioAcumulado)}</span>
          </div>
          <div className="current-prize-box">
            <span className="current-prize-label">Vale nesta pergunta:</span>
            <span className="current-prize-value">{formatarMoeda(pergunta.valorPremio)}</span>
          </div>
        </div>
      </header>

      {/* ÁREA CENTRAL DO QUIZ */}
      <main className="gameplay-main-stage">
        {/* CARD DO ENUNCIADO EM VERMELHO ESCURO DEGRADÊ COM BORDA BRANCA */}
        <section className="statement-box-tv" aria-labelledby="pergunta-enunciado">
          <div className="statement-header-row">
            <div className="statement-host-badge">
              <img src={apresentadorImg} alt="Silvio dos Trilhos" className="statement-host-img" />
              <span className="statement-host-caption">Silvio dos Trilhos pergunta:</span>
            </div>
            <span className="statement-stage-counter">Pergunta #{nivelAtual}</span>
          </div>
          <h2 id="pergunta-enunciado" className="statement-text-tv">
            {pergunta.enunciado}
          </h2>
        </section>

        {/* 4 ALTERNATIVAS EM LISTA VERTICAL COM CÍRCULO BRANCO E NÚMERO EM AZUL */}
        <div className="options-vertical-list" role="radiogroup" aria-label="Alternativas">
          {pergunta.alternativas?.map((alt) => {
            let itemClass = 'option-row-item'
            if (selecionada === alt.id) itemClass += ' selected'

            if (confirmado && respostaFeedback) {
              const ehCorreta = respostaFeedback.corretaNumero === alt.numero
              if (ehCorreta) {
                itemClass += ' correct'
              } else if (selecionada === alt.id && !respostaFeedback.acertou) {
                itemClass += ' wrong'
              }
            }

            return (
              <button
                key={alt.id}
                type="button"
                role="radio"
                aria-checked={selecionada === alt.id}
                disabled={confirmado || enviandoResposta}
                onClick={() => setSelecionada(alt.id)}
                className={itemClass}
              >
                {/* Círculo branco numerado com o número em azul */}
                <span className="option-circle-blue-num" aria-hidden="true">
                  {alt.numero}
                </span>

                {/* Texto da alternativa */}
                <span className="option-row-text">
                  {alt.texto}
                </span>
              </button>
            )
          })}
        </div>

        {/* FEEDBACK VISUAL APÓS CONFIRMAR */}
        {confirmado && respostaFeedback && (
          <div className={`answer-banner-tv ${respostaFeedback.acertou ? 'banner-correct' : 'banner-wrong'}`} role="status">
            {respostaFeedback.acertou ? (
              <>
                <CheckCircle2 size={28} />
                <div>
                  <strong>Certa Resposta!</strong> {respostaFeedback.mensagem || 'Você garantiu o prêmio e avança para a próxima estação!'}
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={28} />
                <div>
                  <strong>Não foi dessa vez, você errou!</strong> Encerrando a partida...
                </div>
              </>
            )}
          </div>
        )}

        {/* CONTROLES DE AÇÃO E BOTÃO DISCRETO DE ABANDONAR PARTIDA */}
        <div className="gameplay-footer-actions">
          {/* Botões de Ação Positiva em Verde */}
          <div className="footer-actions-left">
            {!confirmado ? (
              <button
                type="button"
                id="btn-confirmar-resposta"
                disabled={!selecionada || enviandoResposta}
                onClick={handleConfirmarResposta}
                className="btn btn-positive-action btn-xl btn-pulse"
              >
                <span>{enviandoResposta ? 'Avaliando Resposta...' : 'Confirmar Resposta'}</span>
                <ArrowRight size={20} />
              </button>
            ) : proximaPerguntaPendente ? (
              <button
                type="button"
                id="btn-proxima-pergunta"
                onClick={handleAvancarProxima}
                className="btn btn-positive-action btn-xl btn-pulse"
              >
                <span>Próxima Pergunta</span>
                <ArrowRight size={20} />
              </button>
            ) : null}
          </div>

          {/* Botão Discreto no Canto Inferior Direito: Abandonar Partida */}
          <div className="footer-actions-right">
            <button
              type="button"
              id="btn-abandonar-partida"
              onClick={() => setMostrarModalAbandono(true)}
              className="btn-abandon-subtle"
              title="Abandonar partida (penalidade: perde tudo)"
            >
              <LogOut size={16} />
              <span>Abandonar partida</span>
            </button>
          </div>
        </div>
      </main>

      {/* MODAL DE CONFIRMAÇÃO DE ABANDONO */}
      {mostrarModalAbandono && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog card abandon-modal-dialog">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <AlertTriangle size={24} style={{ color: '#E2001A' }} />
                <h3>Abandonar Partida?</h3>
              </div>
            </div>

            <p className="modal-desc" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              Atenção! Conforme as regras oficiais do Show do Trilhão, ao abandonar a partida você <strong>perde todo o prêmio acumulado</strong> ({formatarMoeda(premioAcumulado)}) e encerra com <strong>R$ 0</strong>.
            </p>

            <div className="modal-footer-actions">
              <button
                type="button"
                onClick={() => setMostrarModalAbandono(false)}
                className="btn btn-secondary btn-md"
              >
                Continuar Jogando
              </button>

              <button
                type="button"
                disabled={abandonando}
                onClick={handleConfirmarAbandono}
                className="btn btn-danger-action btn-md"
              >
                <span>{abandonando ? 'Abandonando...' : 'Confirmar e Perder Tudo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
