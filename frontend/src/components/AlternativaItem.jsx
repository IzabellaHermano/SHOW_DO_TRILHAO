import React from 'react'
import { Check, CheckCircle2 } from 'lucide-react'

/**
 * Componente oficial de Alternativa do Show do Trilhão
 * Estética fixa: Círculo branco com número azul, acompanhado pelo texto da alternativa
 * Suporta modo interativo (botão do jogador) e modo telão (apresentador)
 */
export default function AlternativaItem({
  numero, // 1, 2, 3 ou 4
  texto = null, // Texto completo da alternativa (ou null no mobile do jogador)
  selecionado = false,
  correto = false,
  revelado = false,
  desabilitado = false,
  votos = null,
  percentual = null,
  onClick = null,
  id = null,
  className = '',
  isMobileController = false,
}) {
  const estadoClass = [
    selecionado ? 'is-selected' : '',
    revelado && correto ? 'is-correct' : '',
    revelado && selecionado && !correto ? 'is-wrong' : '',
    desabilitado ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {/* Círculo branco com número azul oficial */}
      <div className="alt-circle-badge">
        <span className="alt-circle-digit">{numero}</span>
      </div>

      {/* Texto da alternativa (se fornecido) */}
      {texto && <div className="alt-text-content">{texto}</div>}

      {/* Indicador de Seleção / Check */}
      {selecionado && !revelado && (
        <div className="alt-selected-badge" title="Alternativa escolhida">
          <Check size={18} strokeWidth={3} />
        </div>
      )}

      {/* Estatísticas de votos (apenas na fase de revelação do telão) */}
      {revelado && percentual !== null && (
        <div className={`alt-votes-tag ${correto ? 'is-correct-tag' : ''}`}>
          <span>
            {votos !== null ? `${votos} voto${votos === 1 ? '' : 's'}` : ''} ({percentual}%)
          </span>
        </div>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        id={id || `btn-alternativa-${numero}`}
        type="button"
        disabled={desabilitado}
        onClick={onClick}
        aria-label={`Alternativa ${numero}${texto ? `: ${texto}` : ''}`}
        className={`game-alt-item ${isMobileController ? 'is-mobile-controller' : ''} ${estadoClass} ${className}`.trim()}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      id={id || `card-alternativa-${numero}`}
      className={`game-alt-item ${isMobileController ? 'is-mobile-controller' : ''} ${estadoClass} ${className}`.trim()}
    >
      {content}
    </div>
  )
}
