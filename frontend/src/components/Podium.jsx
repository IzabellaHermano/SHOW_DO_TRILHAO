import { Crown, Trophy, Medal } from 'lucide-react'

export default function Podium({ players = [], formatScore = (v) => v, className = '' }) {
  // players deve ter até 3 para o pódio dos 3 primeiros colocados
  const primeiro = players[0]
  const segundo = players[1]
  const terceiro = players[2]

  const getHitsLabel = (p) => {
    if (!p) return ''
    const hits = p.nivel ?? p.nivelAlcancado
    if (hits != null) return `${hits} acertos`
    return ''
  }

  const getScore = (p) => {
    if (!p) return 0
    return p.pontuacao ?? p.pontuacaoFinal ?? p.pontos ?? 0
  }

  const getName = (p, fallback = 'Passageiro') => {
    if (!p) return fallback
    return p.nome || p.nomeJogador || p.jogadorNome || fallback
  }

  return (
    <div className={`game-podium-root ${className}`}>
      {/* PÓDIO OLÍMPICO 3D DOS 3 PRIMEIROS */}
      <div className="olympic-podium-stage">
        {/* 2º LUGAR (ESQUERDA - PRATA) */}
        <div className="podium-pedestal-wrap pedestal-silver-wrap">
          {segundo ? (
            <div className="podium-winner-card">
              <div className="podium-medal-badge medal-silver">2º</div>
              <div className="podium-winner-name">{getName(segundo, '2º Lugar')}</div>
              <div className="podium-winner-score">{formatScore(getScore(segundo))}</div>
              <div className="podium-winner-hits">{getHitsLabel(segundo)}</div>
            </div>
          ) : (
            <div className="podium-winner-card placeholder-card">
              <div className="podium-medal-badge medal-silver">2º</div>
              <div className="podium-winner-name">Vago</div>
            </div>
          )}
          <div className="podium-pedestal-block pedestal-silver">
            <span className="pedestal-number">2</span>
          </div>
        </div>

        {/* 1º LUGAR (CENTRO - MAIS ALTO - OURO COM COROA) */}
        <div className="podium-pedestal-wrap pedestal-gold-wrap">
          <div className="podium-gold-crown" aria-hidden="true">
            <Crown size={38} className="crown-icon-glow" />
          </div>
          {primeiro ? (
            <div className="podium-winner-card winner-card-gold">
              <div className="podium-medal-badge medal-gold">1º</div>
              <div className="podium-winner-name">{getName(primeiro, 'Campeão')}</div>
              <div className="podium-winner-score gold-text">{formatScore(getScore(primeiro))}</div>
              <div className="podium-winner-hits">{getHitsLabel(primeiro)}</div>
            </div>
          ) : (
            <div className="podium-winner-card placeholder-card">
              <div className="podium-medal-badge medal-gold">1º</div>
              <div className="podium-winner-name">Vago</div>
            </div>
          )}
          <div className="podium-pedestal-block pedestal-gold">
            <span className="pedestal-number">1</span>
          </div>
        </div>

        {/* 3º LUGAR (DIREITA - BRONZE) */}
        <div className="podium-pedestal-wrap pedestal-bronze-wrap">
          {terceiro ? (
            <div className="podium-winner-card">
              <div className="podium-medal-badge medal-bronze">3º</div>
              <div className="podium-winner-name">{getName(terceiro, '3º Lugar')}</div>
              <div className="podium-winner-score">{formatScore(getScore(terceiro))}</div>
              <div className="podium-winner-hits">{getHitsLabel(terceiro)}</div>
            </div>
          ) : (
            <div className="podium-winner-card placeholder-card">
              <div className="podium-medal-badge medal-bronze">3º</div>
              <div className="podium-winner-name">Vago</div>
            </div>
          )}
          <div className="podium-pedestal-block pedestal-bronze">
            <span className="pedestal-number">3</span>
          </div>
        </div>
      </div>
    </div>
  )
}
