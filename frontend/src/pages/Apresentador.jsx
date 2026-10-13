import { useState, useEffect, useCallback } from 'react'
import { salaService, perguntaService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  PlusCircle,
  CheckCircle,
  XCircle,
  Users,
  Copy,
  Sparkles,
  RefreshCw,
  Power,
  HelpCircle,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle
} from 'lucide-react'

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
  const [abaAtiva, setAbaAtiva] = useState('salas') // 'salas' | 'perguntas'

  // Mensagens globais
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  // ----------------------------------------------------
  // ESTADOS - GESTÃO DE SALAS
  // ----------------------------------------------------
  const [nomeSala, setNomeSala] = useState('')
  const [salas, setSalas] = useState([])
  const [carregandoSalas, setCarregandoSalas] = useState(true)
  const [criandoSala, setCriandoSala] = useState(false)
  const [copiado, setCopiado] = useState(null)

  const carregarSalas = useCallback(async () => {
    setCarregandoSalas(true)
    setErro('')
    try {
      const lista = await salaService.listarMinhasSalas()
      setSalas(lista || [])
    } catch (err) {
      console.error('Erro ao listar salas do apresentador:', err)
      setErro('Não foi possível carregar as salas do servidor.')
    } finally {
      setCarregandoSalas(false)
    }
  }, [])

  const handleCriarSala = async (e) => {
    e.preventDefault()
    if (!nomeSala.trim()) return

    setCriandoSala(true)
    setErro('')
    try {
      const novaSala = await salaService.criarSala({
        nome: nomeSala.trim(),
      })
      setSalas((prev) => [novaSala, ...prev])
      setNomeSala('')
      setMensagem(`Sala oficial ${novaSala.codigo} criada com sucesso!`)
      setTimeout(() => setMensagem(''), 5000)
    } catch (err) {
      console.error('Erro ao criar sala:', err)
      const msg = err.response?.data?.message || err.response?.data?.mensagem || 'Erro ao criar sala.'
      setErro(msg)
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
    } catch (err) {
      console.error('Erro ao alternar status da sala:', err)
      alert('Não foi possível alterar o status da sala.')
    }
  }

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo)
    setCopiado(codigo)
    setTimeout(() => setCopiado(null), 2000)
  }

  // ----------------------------------------------------
  // ESTADOS - GESTÃO DE PERGUNTAS
  // ----------------------------------------------------
  const [perguntas, setPerguntas] = useState([])
  const [carregandoPerguntas, setCarregandoPerguntas] = useState(false)
  const [filtroNivel, setFiltroNivel] = useState('todos')
  const [modalPerguntaAberto, setModalPerguntaAberto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [salvandoPergunta, setSalvandoPergunta] = useState(false)

  // Formulário de Pergunta
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
    setErro('')
    try {
      const lista = await perguntaService.listarTodas()
      setPerguntas(lista || [])
    } catch (err) {
      console.error('Erro ao carregar perguntas:', err)
      setErro('Não foi possível carregar as perguntas cadastradas.')
    } finally {
      setCarregandoPerguntas(false)
    }
  }, [])

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

  const handleNivelChange = (novoNivel) => {
    const n = parseInt(novoNivel, 10)
    setNivelDificuldade(n)
    setValorPremio(VALORES_SUGERIDOS_POR_NIVEL[n] || 1000)
  }

  const handleSalvarPergunta = async (e) => {
    e.preventDefault()
    if (!enunciado.trim()) return

    if (!alternativa1.trim() || !alternativa2.trim() || !alternativa3.trim() || !alternativa4.trim()) {
      alert('Preencha as 4 alternativas para a pergunta.')
      return
    }

    setSalvandoPergunta(true)
    setErro('')

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
        setMensagem('Pergunta atualizada com sucesso!')
      } else {
        await perguntaService.cadastrar(payload)
        setMensagem('Nova pergunta cadastrada no acervo oficial com sucesso!')
      }

      setModalPerguntaAberto(false)
      carregarPerguntas()
      setTimeout(() => setMensagem(''), 5000)
    } catch (err) {
      console.error('Erro ao salvar pergunta:', err)
      const msg = err.response?.data?.mensagem || err.response?.data?.message || 'Erro ao salvar pergunta.'
      alert(msg)
    } finally {
      setSalvandoPergunta(false)
    }
  }

  const handleExcluirPergunta = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta pergunta do quiz?')) return

    try {
      await perguntaService.excluir(id)
      setPerguntas((prev) => prev.filter((p) => p.id !== id))
      setMensagem('Pergunta excluída com sucesso.')
      setTimeout(() => setMensagem(''), 4000)
    } catch (err) {
      console.error('Erro ao excluir pergunta:', err)
      alert('Não foi possível excluir esta pergunta (pode haver partidas vinculadas a ela).')
    }
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return ''
    try {
      return new Date(dataStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dataStr
    }
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(valor || 0)
  }

  const perguntasFiltradas = perguntas.filter((p) => {
    if (filtroNivel === 'todos') return true
    return p.nivelDificuldade === parseInt(filtroNivel, 10)
  })

  return (
    <div className="presenter-page">
      {/* Cabeçalho da Cabine do Apresentador */}
      <header className="page-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="badge badge-cptm">
          <LayoutDashboard size={16} />
          <span>Cabine de Controle CPTM</span>
        </div>
        <h1 className="page-title">Painel do Apresentador & Mestre de Cerimônias</h1>
        <p className="page-subtitle">
          Bem-vindo, <strong>{user?.nome || 'Silvio dos Trilhos'}</strong>! Crie salas ao vivo e gerencie o acervo de perguntas oficiais da CPTM.
        </p>

        {/* Alternador de Abas */}
        <div className="presenter-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'salas'}
            onClick={() => setAbaAtiva('salas')}
            className={`btn ${abaAtiva === 'salas' ? 'btn-positive-action' : 'btn-secondary'} btn-md`}
          >
            <Users size={18} />
            <span>Salas de Jogo</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'perguntas'}
            onClick={() => setAbaAtiva('perguntas')}
            className={`btn ${abaAtiva === 'perguntas' ? 'btn-positive-action' : 'btn-secondary'} btn-md`}
          >
            <HelpCircle size={18} />
            <span>Gestão de Perguntas ({perguntas.length})</span>
          </button>
        </div>
      </header>

      {/* Alertas */}
      {mensagem && (
        <div className="alert alert-success" role="status">
          <Sparkles size={18} />
          <span>{mensagem}</span>
        </div>
      )}

      {erro && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} />
          <span>{erro}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* ABA 1: GESTÃO DE SALAS                               */}
      {/* ==================================================== */}
      {abaAtiva === 'salas' && (
        <div className="presenter-grid">
          {/* Formulário de Criação de Sala */}
          <div className="card presenter-form-card">
            <h2 className="card-title">
              <PlusCircle size={20} />
              <span>Criar Nova Sala de Jogo</span>
            </h2>
            <form onSubmit={handleCriarSala} className="admin-form">
              <div className="form-group">
                <label htmlFor="nomeSala">Nome da Sala / Estação:</label>
                <input
                  id="nomeSala"
                  type="text"
                  required
                  placeholder="Ex: Torneio Estação da Luz - Linha 10"
                  value={nomeSala}
                  onChange={(e) => setNomeSala(e.target.value)}
                  className="input-field"
                  minLength={3}
                  maxLength={100}
                />
              </div>

              <button
                type="submit"
                disabled={criandoSala}
                className="btn btn-positive-action btn-block btn-lg"
              >
                <PlusCircle size={18} />
                <span>{criandoSala ? 'Gerando Código...' : 'Gerar Código da Sala'}</span>
              </button>
            </form>
          </div>

          {/* Lista de Salas Criadas */}
          <div className="card presenter-list-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>
                <Users size={20} />
                <span>Minhas Salas Criadas</span>
              </h2>
              <button
                type="button"
                onClick={carregarSalas}
                className="btn btn-secondary btn-xs"
                title="Atualizar lista"
              >
                <RefreshCw size={14} className={carregandoSalas ? 'spin' : ''} />
                <span>Atualizar</span>
              </button>
            </div>

            {carregandoSalas ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <RefreshCw size={28} className="spin" style={{ color: 'var(--cptm-red)', marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: 700, color: 'var(--cptm-gray)' }}>Carregando salas...</p>
              </div>
            ) : salas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <p>Nenhuma sala cadastrada ainda. Crie sua primeira sala no formulário ao lado!</p>
              </div>
            ) : (
              <div className="rooms-list">
                {salas.map((sala) => (
                  <div key={sala.id} className="room-item">
                    <div className="room-item-details">
                      <div className="room-code-tag">
                        <code>{sala.codigo}</code>
                        <button
                          type="button"
                          onClick={() => copiarCodigo(sala.codigo)}
                          className="btn-copy"
                          title="Copiar código"
                        >
                          <Copy size={16} />
                          {copiado === sala.codigo && (
                            <span style={{ marginLeft: '4px', fontSize: '0.75rem', color: '#10B981', fontWeight: 800 }}>
                              Copiado!
                            </span>
                          )}
                        </button>
                      </div>
                      <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        {sala.nome}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Criada em {formatarData(sala.criadaEm)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="room-status-badge">
                        {sala.ativa ? (
                          <span className="badge-active">
                            <CheckCircle size={14} /> Ativa
                          </span>
                        ) : (
                          <span className="badge-inactive">
                            <XCircle size={14} /> Inativa
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAlternarStatus(sala.id)}
                        className="btn btn-secondary btn-xs"
                        title={sala.ativa ? 'Desativar sala' : 'Ativar sala'}
                      >
                        <Power size={14} />
                        <span>{sala.ativa ? 'Desativar' : 'Ativar'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ABA 2: GESTÃO COMPLETA DE PERGUNTAS                 */}
      {/* ==================================================== */}
      {abaAtiva === 'perguntas' && (
        <div className="card questions-management-card">
          <div className="questions-toolbar">
            <div className="toolbar-left">
              <button
                type="button"
                id="btn-nova-pergunta"
                onClick={abrirModalNovaPergunta}
                className="btn btn-positive-action btn-md"
              >
                <PlusCircle size={18} />
                <span>Nova Pergunta</span>
              </button>

              <div className="filter-group">
                <label htmlFor="selectFiltroNivel">Filtrar por Nível:</label>
                <select
                  id="selectFiltroNivel"
                  value={filtroNivel}
                  onChange={(e) => setFiltroNivel(e.target.value)}
                  className="input-field select-field"
                >
                  <option value="todos">Todos os Níveis (1 a 10)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      Nível {n} ({formatarMoeda(VALORES_SUGERIDOS_POR_NIVEL[n])})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={carregarPerguntas}
              className="btn btn-secondary btn-xs"
              title="Atualizar acervo de perguntas"
            >
              <RefreshCw size={14} className={carregandoPerguntas ? 'spin' : ''} />
              <span>Atualizar</span>
            </button>
          </div>

          {carregandoPerguntas ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <RefreshCw size={32} className="spin" style={{ color: 'var(--cptm-red)', marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 700, color: 'var(--cptm-gray)' }}>Carregando perguntas do acervo...</p>
            </div>
          ) : perguntasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p>Nenhuma pergunta encontrada para o nível selecionado.</p>
            </div>
          ) : (
            <div className="questions-grid-list">
              {perguntasFiltradas.map((p) => (
                <div key={p.id} className="question-admin-card">
                  <div className="question-admin-header">
                    <div className="q-badges">
                      <span className="badge-nivel">Nível {p.nivelDificuldade}</span>
                      <span className="badge-prize">{formatarMoeda(p.valorPremio)}</span>
                    </div>

                    <div className="q-actions">
                      <button
                        type="button"
                        onClick={() => abrirModalEditarPergunta(p)}
                        className="btn-icon btn-edit"
                        title="Editar pergunta"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirPergunta(p.id)}
                        className="btn-icon btn-delete"
                        title="Excluir pergunta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="q-statement">{p.enunciado}</h3>

                  <div className="q-alternatives-preview">
                    {p.alternativas?.map((alt) => (
                      <div
                        key={alt.id || alt.numero}
                        className={`alt-preview-item ${alt.correta ? 'is-correct' : ''}`}
                      >
                        <span className="alt-num">{alt.numero}</span>
                        <span className="alt-text">{alt.texto}</span>
                        {alt.correta && (
                          <span className="alt-correct-tag">
                            <Check size={12} /> Correta
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {p.explicacao && (
                    <div className="q-explanation-box">
                      <strong>Explicação Técnica:</strong> {p.explicacao}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL DE CADASTRO / EDIÇÃO DE PERGUNTA               */}
      {/* ==================================================== */}
      {modalPerguntaAberto && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog card modal-dialog-lg">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <HelpCircle size={22} className="icon-question" />
                <h3>{editandoId ? 'Editar Pergunta Oficial' : 'Cadastrar Nova Pergunta'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalPerguntaAberto(false)}
                className="btn-close-modal"
                aria-label="Fechar janela"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarPergunta} className="modal-form-question">
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="inputNivel">Nível da Rodada (1 a 10):</label>
                  <select
                    id="inputNivel"
                    value={nivelDificuldade}
                    onChange={(e) => handleNivelChange(e.target.value)}
                    className="input-field"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        Nível {n} ({formatarMoeda(VALORES_SUGERIDOS_POR_NIVEL[n])})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="inputPremio">Valor do Prêmio (R$):</label>
                  <input
                    id="inputPremio"
                    type="number"
                    min={100}
                    max={1000000}
                    step={100}
                    value={valorPremio}
                    onChange={(e) => setValorPremio(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="inputEnunciado">Enunciado da Pergunta:</label>
                <textarea
                  id="inputEnunciado"
                  rows={3}
                  required
                  placeholder="Ex: Qual é a cor que identifica a Linha 10 da CPTM?"
                  value={enunciado}
                  onChange={(e) => setEnunciado(e.target.value)}
                  className="input-field textarea-field"
                  maxLength={1000}
                />
              </div>

              <div className="form-group">
                <label htmlFor="inputExplicacao">Explicação Técnica / Curiosidade (exibida no resultado):</label>
                <textarea
                  id="inputExplicacao"
                  rows={2}
                  placeholder="Ex: A Linha 10-Turquesa opera o eixo sudeste do transporte metropolitano..."
                  value={explicacao}
                  onChange={(e) => setExplicacao(e.target.value)}
                  className="input-field textarea-field"
                  maxLength={1000}
                />
              </div>

              <div className="alternatives-form-box">
                <label className="section-subtitle">
                  4 Alternativas (Selecione a opção correta):
                </label>

                {[
                  { num: 1, val: alternativa1, set: setAlternativa1 },
                  { num: 2, val: alternativa2, set: setAlternativa2 },
                  { num: 3, val: alternativa3, set: setAlternativa3 },
                  { num: 4, val: alternativa4, set: setAlternativa4 },
                ].map(({ num, val, set }) => (
                  <div key={num} className={`alt-input-row ${corretaNumero === num ? 'selected-correct' : ''}`}>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="alternativaCorreta"
                        checked={corretaNumero === num}
                        onChange={() => setCorretaNumero(num)}
                      />
                      <span className="circle-num">{num}</span>
                    </label>

                    <input
                      type="text"
                      required
                      placeholder={`Texto da Alternativa ${num}`}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      className="input-field alt-text-input"
                      maxLength={500}
                    />

                    {corretaNumero === num && (
                      <span className="correct-indicator">
                        <Check size={16} /> Correta
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  onClick={() => setModalPerguntaAberto(false)}
                  className="btn btn-secondary btn-md"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvandoPergunta}
                  className="btn btn-positive-action btn-lg"
                >
                  <Save size={18} />
                  <span>{salvandoPergunta ? 'Salvando...' : editandoId ? 'Atualizar Pergunta' : 'Salvar no Acervo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
