import { useState, useEffect, useCallback } from 'react'
import { rankingService } from '../services/api'
import { Trophy, Award, Search, Users, RefreshCw, CheckCircle, UserCheck, UserX } from 'lucide-react'

export default function Ranking() {
  const [aba, setAba] = useState('geral') // 'geral' | 'sala'
  const [codigoSala, setCodigoSala] = useState('CPTM-2026')
  const [ranking, setRanking] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregarRanking = useCallback(async () => {
    setCarregando(true)
    setErro('')

    try {
      if (aba === 'geral') {
        const dados = await rankingService.obterRankingGeral()
        setRanking(dados || [])
      } else if (codigoSala.trim()) {
        const dados = await rankingService.obterRankingSala(codigoSala.trim().toUpperCase())
        setRanking(dados || [])
      } else {
        setRanking([])
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do ranking:', err)
      setErro('Não foi possível carregar o ranking no momento. Verifique a conexão com o servidor.')
      setRanking([])
    } finally {
      setCarregando(false)
    }
  }, [aba, codigoSala])

  useEffect(() => {
    carregarRanking()
  }, [carregarRanking])

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(valor || 0)
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return ''
    try {
      return new Date(dataStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dataStr
    }
  }

  const primeiro = ranking[0]
  const segundo = ranking[1]
  const terceiro = ranking[2]

  return (
    <div className="ranking-page-container">
      {/* Cabeçalho do Quadro de Líderes */}
      <header className="ranking-header">
        <div className="badge badge-cptm">
          <Trophy size={18} />
          <span>Quadro Oficial de Líderes CPTM</span>
        </div>
        <h1 className="page-title">Galeria dos Milionários dos Trilhos</h1>
        <p className="page-subtitle">
          Veja quem conquistou os maiores prêmios e acertou mais estações na ferrovia paulista.
        </p>

        {/* Abas: Ranking Geral vs Ranking por Sala */}
        <div className="ranking-tabs-group" role="tablist">
          <button
            type="button"
            id="tab-ranking-geral"
            role="tab"
            aria-selected={aba === 'geral'}
            className={`btn ${aba === 'geral' ? 'btn-positive-action' : 'btn-secondary'} btn-md`}
            onClick={() => setAba('geral')}
          >
            <Award size={18} />
            <span>Ranking Geral (Contas Cadastradas)</span>
          </button>

          <button
            type="button"
            id="tab-ranking-sala"
            role="tab"
            aria-selected={aba === 'sala'}
            className={`btn ${aba === 'sala' ? 'btn-positive-action' : 'btn-secondary'} btn-md`}
            onClick={() => setAba('sala')}
          >
            <Users size={18} />
            <span>Ranking por Sala (Inclui Visitantes)</span>
          </button>
        </div>

        {/* Formulário de Busca por Sala quando na aba "sala" */}
        {aba === 'sala' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              carregarRanking()
            }}
            className="room-search-bar"
          >
            <input
              type="text"
              required
              placeholder="Digite o código da sala (ex: CPTM-2026)"
              value={codigoSala}
              onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
              className="input-field"
            />
            <button type="submit" className="btn btn-positive-action btn-md">
              <Search size={16} />
              <span>Consultar Sala</span>
            </button>
          </form>
        )}
      </header>

      {/* PÓDIO DOS 3 PRIMEIROS COLOCADOS */}
      {ranking.length >= 1 && (
        <section className="podium-section" aria-label="Pódio dos Melhores Colocados">
          {/* 2º Lugar */}
          {segundo ? (
            <div className="podium-step step-silver">
              <div className="podium-badge-medal">🥈 2º Lugar</div>
              <h4 className="podium-user-name">{segundo.nomeJogador}</h4>
              <span className="podium-score-tag">{formatarMoeda(segundo.pontuacaoFinal)}</span>
              <span className="podium-level-sub">Nível {segundo.nivelAlcancado} de 10</span>
            </div>
          ) : (
            <div className="podium-step step-placeholder" />
          )}

          {/* 1º Campeão (Centro, Mais Alto) */}
          {primeiro && (
            <div className="podium-step step-gold">
              <div className="podium-crown">👑</div>
              <div className="podium-badge-medal">🥇 Campeão Absoluto</div>
              <h3 className="podium-user-name">{primeiro.nomeJogador}</h3>
              <span className="podium-score-tag gold-glow">{formatarMoeda(primeiro.pontuacaoFinal)}</span>
              <span className="podium-level-sub">Nível {primeiro.nivelAlcancado} de 10</span>
            </div>
          )}

          {/* 3º Lugar */}
          {terceiro ? (
            <div className="podium-step step-bronze">
              <div className="podium-badge-medal">🥉 3º Lugar</div>
              <h4 className="podium-user-name">{terceiro.nomeJogador}</h4>
              <span className="podium-score-tag">{formatarMoeda(terceiro.pontuacaoFinal)}</span>
              <span className="podium-level-sub">Nível {terceiro.nivelAlcancado} de 10</span>
            </div>
          ) : (
            <div className="podium-step step-placeholder" />
          )}
        </section>
      )}

      {/* TABELA DE CLASSIFICAÇÃO COM TODAS AS COLUNAS PEDIDAS */}
      <div className="card ranking-table-card">
        <div className="ranking-table-top-row">
          <h3>
            {aba === 'geral'
              ? 'Classificação Geral de Jogadores Cadastrados'
              : `Resultados da Sala: ${codigoSala || ''}`}
          </h3>
          <button
            type="button"
            onClick={carregarRanking}
            className="btn btn-secondary btn-xs"
            title="Atualizar ranking"
          >
            <RefreshCw size={14} className={carregando ? 'spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>

        {erro && (
          <div className="alert alert-warning" role="alert">
            <span>{erro}</span>
          </div>
        )}

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <RefreshCw size={32} className="spin" style={{ color: 'var(--cptm-red)', marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 700, color: 'var(--cptm-gray)' }}>Buscando partidas no banco de dados...</p>
          </div>
        ) : ranking.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <p>Nenhuma partida finalizada registrada para esta consulta.</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Inicie uma partida e dispute o prêmio de 1 Milhão para aparecer no topo!
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="ranking-full-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Posição</th>
                  <th>Passageiro / Jogador</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'center' }}>Nível / Acertos</th>
                  <th style={{ textAlign: 'right' }}>Prêmio Acumulado</th>
                  <th style={{ textAlign: 'right' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, index) => {
                  const isTop3 = index < 3
                  return (
                    <tr key={item.id || index} className={isTop3 ? 'top-three-row' : ''}>
                      <td className="rank-position-col">
                        {index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`}
                      </td>
                      <td className="rank-player-col">
                        <strong>{item.nomeJogador}</strong>
                        {item.status === 'VITORIA' && (
                          <span className="badge-milionario">
                            <CheckCircle size={12} /> Milionário
                          </span>
                        )}
                      </td>
                      <td className="rank-type-col">
                        {item.tipoJogador === 'JOGADOR' ? (
                          <span className="tag-jogador">
                            <UserCheck size={13} /> Jogador Oficial
                          </span>
                        ) : (
                          <span className="tag-visitante">
                            <UserX size={13} /> Visitante
                          </span>
                        )}
                      </td>
                      <td className="rank-level-col" style={{ textAlign: 'center' }}>
                        <span className="level-counter-badge">
                          {item.nivelAlcancado} de 10
                        </span>
                      </td>
                      <td className="rank-prize-col" style={{ textAlign: 'right' }}>
                        <span className="prize-amount-badge">
                          {formatarMoeda(item.pontuacaoFinal)}
                        </span>
                      </td>
                      <td className="rank-date-col" style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatarData(item.data)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
