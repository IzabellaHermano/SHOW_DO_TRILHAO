import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { salaService, rankingService } from '../services/api'
import { useToast } from '../context/ToastContext'
import {
  Train,
  Check,
  CheckCircle2,
  Lock,
  RotateCcw,
  Trophy,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Flame,
  Users,
  Clock,
  Sparkles,
  WifiOff
} from 'lucide-react'
import CptmLogo from '../components/CptmLogo'
import GameLogo from '../components/GameLogo'
import Podium from '../components/Podium'
import GameButton from '../components/GameButton'
import GameCard from '../components/GameCard'
import AlternativaItem from '../components/AlternativaItem'

export default function Jogo() {
  const { codigo: paramCodigo } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()

  const [codigoSala, setCodigoSala] = useState('')
  const [tokenSessao, setTokenSessao] = useState('')
  const [estadoJogador, setEstadoJogador] = useState(null)
  const [tempoRestante, setTempoRestante] = useState(45)
  const [enviandoResposta, setEnviandoResposta] = useState(false)
  const [erroSessao, setErroSessao] = useState('')
  const [reconectando, setReconectando] = useState(false)
  const [rankingFinal, setRankingFinal] = useState([])

  const versaoAnteriorRef = useRef(-1)

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(valor || 0)
  }

  // 1. Identificação da Sala e Sessão do Jogador
  useEffect(() => {
    const cod =
      paramCodigo ||
      location.state?.codigoSala ||
      sessionStorage.getItem('show_trilhao_current_sala') ||
      'CPTM-2026'

    const tok =
      location.state?.tokenSessao ||
      localStorage.getItem('show_trilhao_session_' + cod) ||
      ''

    setCodigoSala(cod)
    setTokenSessao(tok)
    sessionStorage.setItem('show_trilhao_current_sala', cod)

    if (!tok && !isAuthenticated) {
      // Se não tem sessão e não está logado, direciona para a entrada da sala
      navigate(`/sala/${cod}`, { replace: true })
    }
  }, [paramCodigo, location.state, isAuthenticated, navigate])

  // 2. Polling sincronizado do estado do jogador (a cada 1.5s)
  useEffect(() => {
    if (!codigoSala) return

    let montado = true

    const sincronizarEstado = async () => {
      try {
        const estado = await salaService.obterEstadoJogador(codigoSala, tokenSessao)
        if (!montado) return
        setReconectando(false)

        // Só atualiza todo o objeto se a versão mudou ou se é a primeira carga
        if (estado.versaoEstado !== versaoAnteriorRef.current || !estadoJogador) {
          versaoAnteriorRef.current = estado.versaoEstado
          setEstadoJogador(estado)
        }

        // Se a partida foi finalizada, carrega o ranking da sala
        if (estado.statusSala === 'FINALIZADA' || estado.faseRodada === 'FINAL') {
          try {
            const rank = await rankingService.obterRankingSala(codigoSala)
            if (montado) setRankingFinal(rank || [])
          } catch (eRank) {
            console.warn('Erro ranking sala jogador:', eRank)
          }
        }
      } catch (err) {
        if (!montado) return
        console.warn('Sync estado jogador:', err?.message || err)
        if (err.response?.status === 404) {
          setErroSessao('Sessão não encontrada nesta sala. Por favor, embarque novamente.')
        } else {
          setReconectando(true)
        }
      }
    }

    sincronizarEstado()
    const timer = setInterval(sincronizarEstado, 1500)

    return () => {
      montado = false
      clearInterval(timer)
    }
  }, [codigoSala, tokenSessao, estadoJogador])

  // 3. Cronômetro Sincronizado do Celular (calculado via prazoFinal do servidor)
  useEffect(() => {
    if (!estadoJogador || estadoJogador.statusSala !== 'EM_ANDAMENTO' || estadoJogador.faseRodada !== 'PERGUNTA' || !estadoJogador.prazoFinal) {
      return
    }

    const atualizarTimer = () => {
      const fim = new Date(estadoJogador.prazoFinal).getTime()
      const agora = Date.now()
      const segRestantes = Math.max(0, Math.ceil((fim - agora) / 1000))
      setTempoRestante(segRestantes)
    }

    atualizarTimer()
    const interval = setInterval(atualizarTimer, 500)
    return () => clearInterval(interval)
  }, [estadoJogador])

  // 4. Ação: Jogador Toca no Símbolo (1, 2, 3 ou 4)
  const handleSelecionarSimbolo = async (simboloNum) => {
    if (
      !estadoJogador ||
      estadoJogador.faseRodada !== 'PERGUNTA' ||
      estadoJogador.jaRespondeu ||
      estadoJogador.eliminado ||
      enviandoResposta ||
      tempoRestante <= 0
    ) {
      return
    }

    setEnviandoResposta(true)
    try {
      const resp = await salaService.responderSimbolo(codigoSala, tokenSessao, simboloNum)
      setEstadoJogador(resp)
      toast.success(`Símbolo ${simboloNum} enviado! Olhe para o telão.`, 'Resposta Registrada')
    } catch (err) {
      console.error('Erro ao responder símbolo:', err)
      toast.error(err.response?.data?.message || 'Não foi possível registrar sua resposta.')
    } finally {
      setEnviandoResposta(false)
    }
  }

  // ========================================================
  // RENDERIZAÇÃO: CASO DE ERRO DE SESSÃO
  // ========================================================
  if (erroSessao) {
    return (
      <div className="player-mobile-stage">
        <GameCard className="player-session-error-card" style={{ textAlign: 'center', width: '100%', maxWidth: '420px', margin: 'auto' }}>
          <AlertTriangle size={42} style={{ color: 'var(--cptm-gold)', margin: '0 auto 0.75rem auto' }} />
          <h2 style={{ color: '#FFFFFF', fontWeight: 900 }}>Embarque Necessário</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.25rem 0' }}>{erroSessao}</p>
          <GameButton
            onClick={() => navigate(`/sala/${codigoSala}`)}
            variant="primary"
            size="lg"
            block
          >
            Fazer Embarque na Sala
          </GameButton>
        </GameCard>
      </div>
    )
  }

  // Carregamento inicial do estado
  if (!estadoJogador) {
    return (
      <div className="player-mobile-stage">
        <div style={{ textAlign: 'center', color: '#FFFFFF', padding: '2rem' }}>
          <Train size={42} className="pulse" style={{ color: 'var(--cptm-red)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Conectando aos Trilhos...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Sincronizando com a sala {codigoSala}</p>
        </div>
      </div>
    )
  }

  const {
    statusSala,
    faseRodada,
    nivelAtual,
    valorPremioNivel,
    premioAcumulado,
    jaRespondeu,
    alternativaEscolhidaNumero,
    eliminado,
    acertouUltima,
    alternativaCorretaNumero,
    explicacao,
    mensagemStatus,
    jogadorNome
  } = estadoJogador

  // ========================================================
  // TELA 1: AGUARDANDO O APRESENTADOR INICIAR
  // ========================================================
  if (statusSala === 'AGUARDANDO') {
    return (
      <div className="player-mobile-stage">
        {reconectando && (
          <div className="player-reconnecting-pill">
            <WifiOff size={14} />
            <span>Reconectando...</span>
          </div>
        )}

        <GameCard className="player-waiting-box" style={{ textAlign: 'center', width: '100%', maxWidth: '420px', margin: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <CptmLogo size="sm" />
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.2)' }} />
            <GameLogo size="xs" />
          </div>

          <div className="player-ticket-chip">
            <span className="ticket-label">PASSAGEIRO</span>
            <span className="ticket-name">{jogadorNome || user?.nome || 'Você'}</span>
            <span className="ticket-room">SALA {codigoSala}</span>
          </div>

          <div className="player-train-anim-wrap">
            <Train size={54} className="player-train-icon pulse" />
          </div>

          <h2 className="player-waiting-title">Aguardando o apresentador iniciar...</h2>
          <p className="player-waiting-subtitle">
            Você já está a bordo da composição! Olhe para o telão oficial da estação para acompanhar a partida.
          </p>

          <div className="player-waiting-hint">
            <span>Quando o show começar, os 4 símbolos de resposta aparecerão aqui no seu celular.</span>
          </div>
        </GameCard>
      </div>
    )
  }

  // ========================================================
  // TELA 2: RESULTADO FINAL (PARTIDA FINALIZADA)
  // ========================================================
  if (statusSala === 'FINALIZADA' || faseRodada === 'FINAL') {
    return (
      <div className="player-mobile-stage">
        <header className="player-hud-header">
          <CptmLogo size="xs" />
          <GameLogo size="xs" />
          <span className="player-room-tag">SALA {codigoSala}</span>
        </header>

        <GameCard className="player-final-card" style={{ textAlign: 'center', width: '100%', maxWidth: '440px', margin: 'auto' }}>
          <Trophy size={48} style={{ color: 'var(--cptm-gold)', margin: '0 auto 0.75rem auto' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: '#FFFFFF', fontSize: '1.6rem' }}>
            {premioAcumulado >= 1000000 ? 'PARABÉNS! 1 MILHÃO!' : 'Fim de Jogo!'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {jogadorNome}, você conquistou:
          </p>
          <div className="player-final-score-gold">{formatarMoeda(premioAcumulado)}</div>

          <p style={{ fontSize: '0.85rem', color: '#E2E8F0', marginTop: '0.75rem' }}>
            {eliminado ? 'Você foi eliminado durante o percurso.' : `Você acertou ${nivelAtual} pergunta(s)!`}
          </p>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <GameButton
              onClick={() => navigate('/')}
              variant="primary"
              size="lg"
              block
              icon={RotateCcw}
            >
              Jogar Novamente
            </GameButton>
            <GameButton
              onClick={() => navigate('/ranking')}
              variant="secondary"
              size="lg"
              block
              icon={Trophy}
            >
              Ver Ranking Geral
            </GameButton>
          </div>
        </GameCard>
      </div>
    )
  }

  // ========================================================
  // TELA 3: GAMEPLAY MOBILE (SÍMBOLOS 1 A 4 & FEEDBACK)
  // ========================================================
  return (
    <div className="player-mobile-stage">
      {reconectando && (
        <div className="player-reconnecting-pill">
          <WifiOff size={14} />
          <span>Reconectando...</span>
        </div>
      )}

      {/* HUD SUPERIOR: NÍVEL, PRÊMIO E CRONÔMETRO */}
      <header className="player-hud-header">
        <div className="player-hud-left">
          <span className="player-hud-nivel-tag">NÍVEL {nivelAtual} DE 10</span>
          <span className="player-hud-prize-val">{formatarMoeda(valorPremioNivel)}</span>
        </div>

        {/* Cronômetro Central Sincronizado */}
        <div className={`player-timer-circle ${tempoRestante <= 10 ? 'is-urgent pulse' : ''}`}>
          <span className="player-timer-val">{faseRodada === 'REVELACAO' ? '0' : tempoRestante}</span>
          <span className="player-timer-unit">s</span>
        </div>

        <div className="player-hud-right">
          <span className="player-hud-acumulado-tag">ACUMULADO</span>
          <span className="player-hud-acumulado-val">{formatarMoeda(premioAcumulado)}</span>
        </div>
      </header>

      {/* MODO ESPECTADOR: JOGADOR ELIMINADO */}
      {eliminado && (
        <div className="player-eliminated-banner">
          <AlertTriangle size={18} />
          <span>Você foi eliminado e perdeu tudo. Continue assistindo pelo telão!</span>
        </div>
      )}

      {/* FASE REVELAÇÃO: FEEDBACK DO APRESENTADOR */}
      {faseRodada === 'REVELACAO' && (
        <div className={`player-reveal-banner ${acertouUltima ? 'is-correct' : 'is-wrong'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {acertouUltima ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
              {acertouUltima ? 'Resposta Correta! Você continua na disputa.' : 'Resposta Incorreta! Você foi eliminado.'}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.4rem', opacity: 0.9 }}>
            Gabarito oficial: Símbolo {alternativaCorretaNumero}
          </div>
        </div>
      )}

      {/* INSTRUÇÃO AO JOGADOR */}
      <div className="player-instruction-strip">
        {faseRodada === 'PERGUNTA' ? (
          jaRespondeu ? (
            <span className="text-glow-gold">Resposta enviada no Símbolo {alternativaEscolhidaNumero}! Olhe para o telão.</span>
          ) : eliminado ? (
            <span>Modo Espectador • Aguarde a revelação no telão</span>
          ) : (
            <span>Olhe para o telão e toque no símbolo correto:</span>
          )
        ) : (
          <span>Aguarde o apresentador avançar para a próxima pergunta...</span>
        )}
      </div>

      {/* OS 4 GRANDES BOTÕES DE SÍMBOLOS (CÍRCULO BRANCO COM NÚMERO AZUL ESTILO CPTM >= 64PX) */}
      <main className="player-symbols-pad" role="region" aria-label="Teclado de Respostas">
        {[1, 2, 3, 4].map((num) => {
          const isSelecionado = alternativaEscolhidaNumero === num
          const isDesabilitado =
            faseRodada !== 'PERGUNTA' ||
            jaRespondeu ||
            eliminado ||
            tempoRestante <= 0 ||
            enviandoResposta

          return (
            <AlternativaItem
              key={num}
              numero={num}
              id={`btn-simbolo-${num}`}
              isMobileController={true}
              desabilitado={isDesabilitado}
              selecionado={isSelecionado}
              correto={faseRodada === 'REVELACAO' && num === alternativaCorretaNumero}
              revelado={faseRodada === 'REVELACAO'}
              onClick={() => handleSelecionarSimbolo(num)}
            />
          )
        })}
      </main>

      {/* RODAPÉ DO CELULAR COM STATUS DA SALA */}
      <footer className="player-footer-strip">
        <span>Passageiro: <strong>{jogadorNome || user?.nome}</strong></span>
        <span>•</span>
        <span>Sala: <strong>{codigoSala}</strong></span>
      </footer>
    </div>
  )
}
