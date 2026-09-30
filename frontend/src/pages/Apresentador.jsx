import { useState } from 'react'
import { salaService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, PlusCircle, CheckCircle, XCircle, Users, Copy, Sparkles } from 'lucide-react'

export default function Apresentador() {
  const { user } = useAuth()
  const [nomeSala, setNomeSala] = useState('')
  const [tempoPergunta, setTempoPergunta] = useState(30)
  const [salas, setSalas] = useState([
    {
      id: 1,
      codigo: 'CPTM-LUZ',
      nome: 'Torneio Estação da Luz',
      tempoLimiteSegundos: 30,
      ativa: true,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
    },
    {
      id: 2,
      codigo: 'CPTM-EXP',
      nome: 'Expresso Linha 13 Jade',
      tempoLimiteSegundos: 20,
      ativa: true,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
    },
  ])
  const [mensagem, setMensagem] = useState('')
  const [copiado, setCopiado] = useState(null)

  const handleCriarSala = async (e) => {
    e.preventDefault()
    if (!nomeSala.trim()) return

    const nova = {
      id: Date.now(),
      codigo: `TRILHAO-${Math.floor(1000 + Math.random() * 9000)}`,
      nome: nomeSala,
      tempoLimiteSegundos: Number(tempoPergunta),
      ativa: true,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
    }

    try {
      await salaService.criarSala({
        nome: nomeSala,
        tempoLimiteSegundos: Number(tempoPergunta),
      })
    } catch {
      // Criação local para demonstração
    }

    setSalas([nova, ...salas])
    setNomeSala('')
    setMensagem(`Sala de transmissão ${nova.codigo} aberta com sucesso!`)
    setTimeout(() => setMensagem(''), 4000)
  }

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo)
    setCopiado(codigo)
    setTimeout(() => setCopiado(null), 2000)
  }

  return (
    <div className="presenter-page">
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="badge badge-cptm">
          <LayoutDashboard size={16} />
          <span>Cabine de Controle CPTM</span>
        </div>
        <h1 className="page-title">Gestão de Salas do Show</h1>
        <p className="page-subtitle">
          Bem-vindo, Apresentador <strong>{user?.nome || 'Oficial'}</strong>! Crie salas com códigos exclusivos para comandar rodadas ao vivo ou gincanas ferroviárias.
        </p>
      </div>

      {mensagem && (
        <div className="alert alert-success" role="status">
          <Sparkles size={18} />
          <span>{mensagem}</span>
        </div>
      )}

      <div className="presenter-grid">
        {/* Formulário de Criação de Sala */}
        <div className="card presenter-form-card">
          <h2 className="card-title">
            <PlusCircle size={20} />
            <span>Criar Nova Sala</span>
          </h2>
          <form onSubmit={handleCriarSala} className="admin-form">
            <div className="form-group">
              <label htmlFor="nomeSala">Nome da Sala ou Linha:</label>
              <input
                id="nomeSala"
                type="text"
                required
                placeholder="Ex: Treinamento Linha 10 Turquesa"
                value={nomeSala}
                onChange={(e) => setNomeSala(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tempoPergunta">Tempo por Pergunta:</label>
              <select
                id="tempoPergunta"
                value={tempoPergunta}
                onChange={(e) => setTempoPergunta(e.target.value)}
                className="input-field"
              >
                <option value={20}>20 segundos (Expresso Veloz)</option>
                <option value={30}>30 segundos (Padrão de Auditório)</option>
                <option value={45}>45 segundos (Moderado)</option>
                <option value={60}>60 segundos (Desafio Especial)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg btn-pulse">
              <PlusCircle size={18} />
              <span>Gerar Código da Sala</span>
            </button>
          </form>
        </div>

        {/* Lista de Salas Criadas */}
        <div className="card presenter-list-card">
          <h2 className="card-title">
            <Users size={20} />
            <span>Salas de Jogo em Aberto</span>
          </h2>

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
                        <span style={{ marginLeft: '4px', fontSize: '0.75rem', color: 'var(--color-correct)', fontWeight: 800 }}>
                          Copiado!
                        </span>
                      )}
                    </button>
                  </div>
                  <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{sala.nome}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {sala.tempoLimiteSegundos}s por pergunta • Criada em {sala.dataCriacao}
                  </span>
                </div>
                <div className="room-status-badge">
                  {sala.ativa ? (
                    <span className="badge-active">
                      <CheckCircle size={14} /> Ao Vivo
                    </span>
                  ) : (
                    <span className="badge-inactive">
                      <XCircle size={14} /> Encerrada
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
