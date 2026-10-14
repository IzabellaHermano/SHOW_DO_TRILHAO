import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Sparkles
} from 'lucide-react'
import CptmLogo from '../components/CptmLogo'
import GameLogo from '../components/GameLogo'
import GameTitle from '../components/GameTitle'
import PlayerPill from '../components/PlayerPill'
import GameModal from '../components/GameModal'

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
  const [salaTelaoAtiva, setSalaTelaoAtiva] = useState(null) // Sala selecionada para exibição no Telão (Painel 2)

  // ----------------------------------------------------
  // GESTÃO DE SALAS
  // ----------------------------------------------------
  const [nomeSala, setNomeSala] = useState('')
  const [salas, setSalas] = useState([])
  const [carregandoSalas, setCarregandoSalas] = useState(true)
  const [criandoSala, setCriandoSala] = useState(false)
  const [mostrarModalCriar, setMostrarModalCriar] = useState(false)
  const [participantesLobby, setParticipantesLobby] = useState([])

  const carregarSalas = useCallback(async () => {
    setCarregandoSalas(true)
    try {
      const lista = await salaService.listarMinhasSalas()
      setSalas(lista || [])
    } catch (err) {
      console.error('Erro ao listar salas do apresentador:', err)
      toast.error('Não foi possível carregar as salas do servidor.', 'Erro de Conexão')
    } finally {
      setCarregandoSalas(false)
    }
  }, [toast])

  const handleCriarSala = async (e) => {
    e.preventDefault()
    if (!nomeSala.trim()) return

    setCriandoSala(true)
    try {
      const novaSala = await salaService.criarSala({
        nome: nomeSala.trim(),
      })
      setSalas((prev) => [novaSala, ...prev])
      setNomeSala('')
      setMostrarModalCriar(false)
      toast.success(`Sala oficial ${novaSala.codigo} criada com sucesso!`, 'Sala Criada')
      // Abre automaticamente no Telão com plataforma limpa
      abrirLobbyTelao(novaSala)
    } catch (err) {
      console.error('Erro ao criar sala:', err)
      const msg = err.response?.data?.message || err.response?.data?.mensagem || 'Erro ao criar sala.'
      toast.error(msg, 'Erro ao Criar Sala')
    } finally {
      setCriandoSala(false)
    }
  }

  const handleAlternarStatus = async (id) => {
    try {
      const atualizada = await salaService.alternarStatus(id)
      setSalas((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ativa: atualizada.ativa } : s))
      )
      toast.info(`Status da sala alterado para: ${atualizada.ativa ? 'Ativa' : 'Inativa'}`)
    } catch (err) {
      console.error('Erro ao alternar status da sala:', err)
      toast.error('Não foi possível alterar o status da sala.')
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

  // Abre o Lobby do Apresentador / Telão (Painel 2 da referência)
  const abrirLobbyTelao = (sala) => {
    setSalaTelaoAtiva(sala)
    setParticipantesLobby([]) // Inicializa rigorosamente vazio: ZERO jogadores fictícios
  }

  // Polling em tempo real dos participantes reais da sala no backend
  useEffect(() => {
    if (!salaTelaoAtiva) return

    let montado = true

    const buscarParticipantes = async () => {
      try {
        const ranking = await rankingService.obterRankingSala(salaTelaoAtiva.codigo)
        if (!montado) return
        if (ranking && Array.isArray(ranking)) {
          // Extrai os nomes reais dos participantes (nome ou nomeJogador)
          const nomes = ranking.map((r) => r.nome || r.nomeJogador).filter(Boolean)
          setParticipantesLobby(nomes)
        } else {
          setParticipantesLobby([])
        }
      } catch (err) {
        // Se a sala ainda não tem partidas ou der erro, mantém lista vazia sem mocks
        console.warn('Lobby participante sync:', err?.message || err)
        if (montado && participantesLobby.length === 0) {
          setParticipantesLobby([])
        }
      }
    }

    // Busca imediata
    buscarParticipantes()

    // Atualiza a cada 2.5s para sincronizar os participantes entrando ao vivo
    const timer = setInterval(buscarParticipantes, 2500)

    return () => {
      montado = false
      clearInterval(timer)
    }
  }, [salaTelaoAtiva])

  // Iniciar o Show no Telão
  const handleIniciarShow = () => {
    if (!salaTelaoAtiva) return
    toast.success(`Iniciando o Show na sala ${salaTelaoAtiva.codigo}!`, 'Atenção aos Trilhos')
    navigate('/jogo', {
      state: {
        codigoSala: salaTelaoAtiva.codigo,
        nomeJogador: user?.nome || 'Apresentador',
        isApresentador: true,
      },
    })
  }

  // ----------------------------------------------------
  // GESTÃO DE PERGUNTAS
  // ----------------------------------------------------
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

  const abrirModalNovaPergunta = () => {
    setEditandoId(null)
    setEnunciado('')
    setNivelDificuldade(1)
    setValorPremio(VALORES_SUGERIDOS_POR_NIVEL[1])
    setExplicacao('')
    setAlternativa1('')
    setAlternativa2('')
    setAlternativa3('')
    setAlternativa4('')
    setCorretaNumero(1)
    setModalPerguntaAberto(true)
  }

  const abrirModalEditarPergunta = (p) => {
    setEditandoId(p.id)
    setEnunciado(p.enunciado || '')
    setNivelDificuldade(p.nivelDificuldade || 1)
    setValorPremio(p.valorPremio || VALORES_SUGERIDOS_POR_NIVEL[p.nivelDificuldade || 1])
    setExplicacao(p.explicacao || '')

    const alts = p.alternativas || []
    setAlternativa1(alts[0]?.texto || '')
    setAlternativa2(alts[1]?.texto || '')
    setAlternativa3(alts[2]?.texto || '')
    setAlternativa4(alts[3]?.texto || '')

    const correta = alts.find((a) => a.correta)
    setCorretaNumero(correta?.numero || 1)

    setModalPerguntaAberto(true)
  }

  const handleSalvarPergunta = async (e) => {
    e.preventDefault()
    if (!enunciado.trim()) return

    if (!alternativa1.trim() || !alternativa2.trim() || !alternativa3.trim() || !alternativa4.trim()) {
      toast.warning('Preencha todas as 4 alternativas da pergunta.')
      return
    }

    setSalvandoPergunta(true)
    const payload = {
      enunciado: enunciado.trim(),
      nivelDificuldade: parseInt(nivelDificuldade, 10),
      valorPremio: parseInt(valorPremio, 10),
      explicacao: explicacao.trim() || null,
      alternativas: [
        { numero: 1, texto: alternativa1.trim(), correta: corretaNumero === 1 },
        { numero: 2, texto: alternativa2.trim(), correta: corretaNumero === 2 },
        { numero: 3, texto: alternativa3.trim(), correta: corretaNumero === 3 },
        { numero: 4, texto: alternativa4.trim(), correta: corretaNumero === 4 },
      ],
    }

    try {
      if (editandoId) {
        await perguntaService.atualizar(editandoId, payload)
        toast.success('Pergunta atualizada com sucesso!')
      } else {
        await perguntaService.cadastrar(payload)
        toast.success('Nova pergunta cadastrada no acervo oficial!')
      }
      setModalPerguntaAberto(false)
      carregarPerguntas()
    } catch (err) {
      console.error('Erro ao salvar pergunta:', err)
      const msg = err.response?.data?.mensagem || err.response?.data?.message || 'Erro ao salvar pergunta.'
      toast.error(msg)
    } finally {
      setSalvandoPergunta(false)
    }
  }

  const handleExcluirPergunta = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta pergunta do quiz?')) return
    try {
      await perguntaService.excluir(id)
      setPerguntas((prev) => prev.filter((p) => p.id !== id))
      toast.info('Pergunta excluída com sucesso.')
    } catch (err) {
      console.error('Erro ao excluir pergunta:', err)
      toast.error('Não foi possível excluir a pergunta (partidas podem estar vinculadas).')
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
  // TELA 02 — LOBBY DO APRESENTADOR / TELÃO (PAINEL 2)
  // ========================================================
  if (salaTelaoAtiva) {
    const origin = window.location.origin
    const gameUrl = `${origin}/entrar/${salaTelaoAtiva.codigo}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(gameUrl)}`

    return (
      <div className="lobby-stage-container">
        {/* Barra Superior do Telão */}
        <header className="lobby-top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setSalaTelaoAtiva(null)}
              className="btn-cptm btn-cptm-secondary btn-sm"
              title="Voltar ao Painel"
            >
              <ArrowLeft size={16} />
              <span>Painel</span>
            </button>
            <CptmLogo size="md" />
          </div>

          <GameLogo size="md" />

          <div className="lobby-status-badge pulse">
            <span>Aguardando Início</span>
          </div>
        </header>

        {/* Card Central do Telão (Painel 2) */}
        <div className="lobby-card-box">
          <div className="lobby-code-display">
            <span className="lobby-code-label">Entre no Jogo</span>
            <span className="lobby-code-value">{salaTelaoAtiva.codigo}</span>
          </div>

          <div className="lobby-content-grid">
            {/* Esquerda: QR Code */}
            <div className="lobby-qr-section">
              <div className="lobby-qr-frame">
                <img
                  src={qrUrl}
                  alt={`QR Code para entrar na sala ${salaTelaoAtiva.codigo}`}
                  className="lobby-qr-img"
                />
              </div>
              <div className="lobby-qr-caption">
                Escaneie o QR Code ou acesse:
                <br />
                <strong style={{ wordBreak: 'break-all' }}>{gameUrl}</strong>
              </div>
              <button
                type="button"
                onClick={() => copiarLink(gameUrl)}
                className="btn-cptm btn-cptm-secondary btn-sm"
                style={{ marginTop: '0.65rem' }}
              >
                <Copy size={15} />
                <span>Copiar Link da Sala</span>
              </button>
            </div>

            {/* Centro: Grid de Participantes Reais com Avatares */}
            <div className="lobby-players-center">
              <div className="lobby-players-title">
                Passageiros na Plataforma
              </div>
              {participantesLobby.length === 0 ? (
                <div className="lobby-empty-platform" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <Users size={38} style={{ color: 'var(--cptm-gold)', margin: '0 auto 0.75rem auto', opacity: 0.85 }} />
                  <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Plataforma vazia! Compartilhe o código para iniciar o embarque.
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Assim que os passageiros escanearem o QR Code ou informarem o código <strong>{salaTelaoAtiva.codigo}</strong>, aparecerão aqui ao vivo.
                  </p>
                </div>
              ) : (
                <div className="lobby-players-pills-wrap">
                  {participantesLobby.map((nome, i) => (
                    <PlayerPill key={i} name={nome} />
                  ))}
                </div>
              )}
            </div>

            {/* Direita: Contador Gigante de Jogadores */}
            <div className="lobby-stats-sidebar">
              <Users size={32} style={{ color: 'var(--cptm-red)' }} />
              <div className="lobby-players-count">{participantesLobby.length}</div>
              <div className="lobby-players-count-label">Jogadores na Sala</div>
            </div>
          </div>
        </div>

        {/* Botão Gigante Dourado: INICIAR O SHOW */}
        <div className="lobby-bottom-bar">
          <button
            type="button"
            id="btn-iniciar-o-show"
            onClick={handleIniciarShow}
            className="btn-cptm btn-cptm-gold btn-xl btn-pulse"
          >
            <Play size={26} fill="currentColor" />
            <span>Iniciar o Show</span>
          </button>
        </div>
      </div>
    )
  }

  // ========================================================
  // CABINE DE CONTROLE DO APRESENTADOR (GESTÃO DE SALAS & PERGUNTAS)
  // ========================================================
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
          Apresentador: <strong>{user?.nome || 'Silvio dos Trilhos'}</strong>. Crie salas ao vivo ou gerencie perguntas.
        </p>

        {/* Abas */}
        <div className="presenter-tabs-row" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'salas'}
            onClick={() => setAbaAtiva('salas')}
            className={`btn-cptm ${abaAtiva === 'salas' ? 'btn-cptm-primary' : 'btn-cptm-secondary'} btn-md`}
          >
            <Users size={18} />
            <span>Salas de Jogo ({salas.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'perguntas'}
            onClick={() => setAbaAtiva('perguntas')}
            className={`btn-cptm ${abaAtiva === 'perguntas' ? 'btn-cptm-primary' : 'btn-cptm-secondary'} btn-md`}
          >
            <HelpCircle size={18} />
            <span>Gestão de Perguntas ({perguntas.length})</span>
          </button>
        </div>
      </header>

      {/* ABA 1: SALAS */}
      {abaAtiva === 'salas' && (
        <div className="presenter-card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>
                Salas Oficiais da CPTM
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Abra o lobby no telão para exibir o código e QR Code aos jogadores.
              </p>
            </div>

            <button
              type="button"
              id="btn-abrir-modal-criar-sala"
              onClick={() => setMostrarModalCriar(true)}
              className="btn-cptm btn-cptm-primary btn-md btn-pulse"
            >
              <PlusCircle size={18} />
              <span>Criar Nova Sala</span>
            </button>
          </div>

          <div className="rooms-admin-grid">
            {carregandoSalas ? (
              <p style={{ color: 'var(--text-muted)' }}>Carregando salas...</p>
            ) : salas.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nenhuma sala criada ainda. Clique em "Criar Nova Sala".</p>
            ) : (
              salas.map((sala) => (
                <div key={sala.id} className="room-card-item">
                  <div className="room-card-header">
                    <span className="room-code-badge">{sala.codigo}</span>
                    <button
                      type="button"
                      onClick={() => copiarCodigo(sala.codigo)}
                      className="nav-link-subtle"
                      title="Copiar Código"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <div>
                    <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>{sala.nome}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Status: {sala.ativa ? <span style={{ color: '#00CC74' }}>Ativa</span> : <span style={{ color: '#ED102B' }}>Inativa</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => abrirLobbyTelao(sala)}
                      className="btn-cptm btn-cptm-gold btn-sm btn-block"
                    >
                      <Tv size={16} />
                      <span>Abrir Telão</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlternarStatus(sala.id)}
                      className="btn-cptm btn-cptm-secondary btn-sm"
                      title={sala.ativa ? 'Desativar sala' : 'Ativar sala'}
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA 2: PERGUNTAS */}
      {abaAtiva === 'perguntas' && (
        <div className="presenter-card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                id="btn-nova-pergunta-admin"
                onClick={abrirModalNovaPergunta}
                className="btn-cptm btn-cptm-primary btn-md"
              >
                <PlusCircle size={18} />
                <span>Nova Pergunta</span>
              </button>

              <select
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
                className="game-input"
                style={{ width: 'auto', padding: '0.6rem 1rem' }}
              >
                <option value="todos">Todos os Níveis (1 a 10)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    Nível {n} ({formatarMoeda(VALORES_SUGERIDOS_POR_NIVEL[n])})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={carregarPerguntas}
              className="btn-cptm btn-cptm-secondary btn-sm"
            >
              <RefreshCw size={14} />
              <span>Atualizar</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {perguntas
              .filter((p) => (filtroNivel === 'todos' ? true : p.nivelDificuldade === parseInt(filtroNivel, 10)))
              .map((p) => (
                <div key={p.id} className="room-card-item" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="lobby-status-badge">Nível {p.nivelDificuldade}</span>
                      <span className="hud-prize-badge" style={{ padding: '0.15rem 0.6rem', fontSize: '0.8rem' }}>
                        {formatarMoeda(p.valorPremio)}
                      </span>
                    </div>
                    <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>{p.enunciado}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => abrirModalEditarPergunta(p)}
                      className="nav-link-subtle"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluirPergunta(p.id)}
                      className="nav-link-subtle"
                      title="Excluir"
                    >
                      <Trash2 size={16} color="#ED102B" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVA SALA */}
      <GameModal
        isOpen={mostrarModalCriar}
        onClose={() => setMostrarModalCriar(false)}
        title="Criar Sala de Jogo"
        icon={PlusCircle}
        size="md"
      >
        <form onSubmit={handleCriarSala} className="enter-game-form">
          <div className="game-form-group">
            <label htmlFor="inputNomeSala" className="game-form-label">
              Nome da Sala / Estação
            </label>
            <input
              id="inputNomeSala"
              type="text"
              required
              placeholder="Ex: Torneio Estação da Luz - Linha 11"
              value={nomeSala}
              onChange={(e) => setNomeSala(e.target.value)}
              className="game-input"
              minLength={3}
              maxLength={80}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setMostrarModalCriar(false)}
              className="btn-cptm btn-cptm-secondary btn-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={criandoSala}
              className="btn-cptm btn-cptm-primary btn-md"
            >
              {criandoSala ? 'Gerando...' : 'Gerar Código e Abrir Telão'}
            </button>
          </div>
        </form>
      </GameModal>

      {/* MODAL: EDITAR / CRIAR PERGUNTA */}
      <GameModal
        isOpen={modalPerguntaAberto}
        onClose={() => setModalPerguntaAberto(false)}
        title={editandoId ? 'Editar Pergunta Oficial' : 'Cadastrar Nova Pergunta'}
        icon={HelpCircle}
        size="lg"
      >
        <form onSubmit={handleSalvarPergunta} className="enter-game-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="game-form-group">
              <label htmlFor="formNivel" className="game-form-label">Nível (1 a 10)</label>
              <select
                id="formNivel"
                value={nivelDificuldade}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  setNivelDificuldade(n)
                  setValorPremio(VALORES_SUGERIDOS_POR_NIVEL[n] || 1000)
                }}
                className="game-input"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>Nível {n}</option>
                ))}
              </select>
            </div>
            <div className="game-form-group">
              <label htmlFor="formPremio" className="game-form-label">Valor do Prêmio (R$)</label>
              <input
                id="formPremio"
                type="number"
                value={valorPremio}
                onChange={(e) => setValorPremio(e.target.value)}
                className="game-input"
                required
              />
            </div>
          </div>

          <div className="game-form-group">
            <label htmlFor="formEnunciado" className="game-form-label">Enunciado da Pergunta</label>
            <textarea
              id="formEnunciado"
              rows={3}
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              className="game-input"
              placeholder="Digite o enunciado da pergunta..."
              required
            />
          </div>

          <div className="game-form-group">
            <label className="game-form-label">4 Alternativas (Marque a Correta):</label>
            {[
              { num: 1, val: alternativa1, set: setAlternativa1, letra: 'A', cor: '#ED102B' },
              { num: 2, val: alternativa2, set: setAlternativa2, letra: 'B', cor: '#0879F9' },
              { num: 3, val: alternativa3, set: setAlternativa3, letra: 'C', cor: '#00CC74' },
              { num: 4, val: alternativa4, set: setAlternativa4, letra: 'D', cor: '#FFB900' },
            ].map(({ num, val, set, letra, cor }) => (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <input
                  type="radio"
                  name="corretaNumero"
                  checked={corretaNumero === num}
                  onChange={() => setCorretaNumero(num)}
                  style={{ width: 18, height: 18, accentColor: '#00CC74' }}
                />
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 4,
                    backgroundColor: cor,
                    color: num === 4 ? '#050B17' : '#FFFFFF',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  {letra}
                </span>
                <input
                  type="text"
                  required
                  placeholder={`Texto da alternativa ${letra}`}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="game-input"
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setModalPerguntaAberto(false)}
              className="btn-cptm btn-cptm-secondary btn-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoPergunta}
              className="btn-cptm btn-cptm-primary btn-md"
            >
              <Save size={18} />
              <span>{salvandoPergunta ? 'Salvando...' : 'Salvar Pergunta'}</span>
            </button>
          </div>
        </form>
      </GameModal>
    </div>
  )
}
