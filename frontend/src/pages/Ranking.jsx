import { useState, useEffect, useCallback } from 'react'
import { rankingService } from '../services/api'
import { useToast } from '../context/ToastContext'
import { Trophy, Award, Search, Users, RefreshCw, CheckCircle, UserCheck, UserX } from 'lucide-react'
import CptmLogo from '../components/CptmLogo'
import Podium from '../components/Podium'

export default function Ranking() {
  const toast = useToast()
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
      console.warn('Erro ao carregar ranking:', err)
      setErro('Não foi possível carregar os dados de pontuação do servidor.')
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

  return (
    <div className="ranking-page-shell">
      {/* Cabeçalho */}
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <CptmLogo size="lg" />
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.4rem', marginTop: '0.75rem', letterSpacing: '0.02em' }}>
          Galeria dos Milionários dos Trilhos
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 600, margin: '0.5rem auto 0 auto' }}>
          Conheça os passageiros que dominaram as estações da CPTM e acumularam as maiores premiações.
        </p>

        {/* Abas */}
        <div className="ranking-top-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={aba === 'geral'}
            className={`btn-cptm ${aba === 'geral' ? 'btn-cptm-primary' : 'btn-cptm-secondary'} btn-md`}
            onClick={() => setAba('geral')}
          >
            <Award size={18} />
            <span>Ranking Geral (Oficial)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={aba === 'sala'}
            className={`btn-cptm ${aba === 'sala' ? 'btn-cptm-primary' : 'btn-cptm-secondary'} btn-md`}
            onClick={() => setAba('sala')}
          >
            <Users size={18} />
            <span>Ranking por Sala</span>
          </button>
        </div>

        {/* Busca por Sala */}
        {aba === 'sala' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              carregarRanking()
            }}
            className="ranking-search-form"
          >
            <input
              type="text"
              required
              placeholder="Digite o código da sala (ex: CPTM-2026)"
              value={codigoSala}
              onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
              className="game-input game-input-uppercase"
            />
            <button type="submit" className="btn-cptm btn-cptm-primary btn-md">
              <Search size={16} />
              <span>Buscar</span>
            </button>
          </form>
        )}
      </header>

      {/* PÓDIO 3D DOS 3 PRIMEIROS */}
      {ranking.length >= 1 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <Podium players={ranking.slice(0, 3)} formatScore={formatarMoeda} />
        </div>
      )}

      {/* TABELA DE CLASSIFICAÇÃO */}
      <div className="ranking-table-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
            {aba === 'geral'
              ? 'Classificação Geral de Milionários'
              : `Resultados da Sala: ${codigoSala || ''}`}
          </h2>
          <button
            type="button"
            onClick={carregarRanking}
            className="btn-cptm btn-cptm-secondary btn-sm"
            title="Atualizar ranking"
          >
            <RefreshCw size={14} className={carregando ? 'spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>

        {erro && (
          <div className="game-alert game-alert-warning" role="alert">
            <span>{erro}</span>
          </div>
        )}

        {carregando ? (
          <p style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            Consultando registros no banco de dados...
          </p>
        ) : ranking.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            Nenhuma partida finalizada registrada nesta modalidade.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cptm-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Posição</th>
                  <th>Passageiro</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'center' }}>Acertos</th>
                  <th style={{ textAlign: 'right' }}>Prêmio</th>
                  <th style={{ textAlign: 'right' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, index) => (
                  <tr key={item.id || index}>
                    <td style={{ fontWeight: 900, color: index === 0 ? '#FFC629' : index === 1 ? '#94A3B8' : index === 2 ? '#D97706' : 'var(--text-light)' }}>
                      {index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <strong style={{ color: '#FFFFFF' }}>{item.nomeJogador}</strong>
                        {item.status === 'VITORIA' && (
                          <span style={{ fontSize: '0.72rem', color: '#00CC74', display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'rgba(0, 204, 116, 0.15)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                            <CheckCircle size={11} /> Milionário
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {item.tipoJogador === 'JOGADOR' ? (
                        <span style={{ fontSize: '0.78rem', color: '#0879F9', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <UserCheck size={13} /> Oficial
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <UserX size={13} /> Visitante
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {item.nivelAlcancado} de 10
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 900, color: '#FFC629' }}>
                      {formatarMoeda(item.pontuacaoFinal)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {formatarData(item.data)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
