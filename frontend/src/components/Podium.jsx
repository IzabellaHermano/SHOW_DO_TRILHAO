import { Crown, Trophy, Medal } from 'lucide-react'

export default function Podium({ players = [], formatScore = (v) => v, className = '' }) {
  // players deve ter até 3 para o pódio e até 5 para o top 5
  const primeiro = players[0]
  const segundo = players[1]
  const terceiro = players[2]

  return (
    <div className={`game-podium-root ${className}`}>
      {/* PÓDIO OLÍMPICO 3D DOS 3 PRIMEIROS */}
      <div className="olympic-podium-stage">
        {/* 2º LUGAR (ESQUERDA - PRATA) */}
        <div className="podium-pedestal-wrap pedestal-silver-wrap">
          {segundo ? (
            <div className="podium-winner-card">
              <div className="podium-medal-badge medal-silver">2º</div>
              <div className="podium-winner-name">{segundo.nomeJogador || segundo.nome || 'Jogador 2'}</div>
              <div className="podium-winner-score">{formatScore(segundo.pontuacaoFinal || segundo.pontos || 0)}</div>
              <div className="podium-winner-hits">
                {segundo.nivelAlcancado != null ? `${segundo.nivelAlcancado} acertos` : '9 acertos'}
              </div>
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
              <div className="podium-winner-name">{primeiro.nomeJogador || primeiro.nome || 'Campeão'}</div>
              <div className="podium-winner-score gold-text">{formatScore(primeiro.pontuacaoFinal || primeiro.pontos || 0)}</div>
              <div className="podium-winner-hits">
                {primeiro.nivelAlcancado != null ? `${primeiro.nivelAlcancado} acertos` : '10 acertos'}
              </div>
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
              <div className="podium-winner-name">{terceiro.nomeJogador || terceiro.nome || 'Jogador 3'}</div>
              <div className="podium-winner-score">{formatScore(terceiro.pontuacaoFinal || terceiro.pontos || 0)}</div>
              <div className="podium-winner-hits">
                {terceiro.nivelAlcancado != null ? `${terceiro.nivelAlcancado} acertos` : '8 acertos'}
              </div>
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
