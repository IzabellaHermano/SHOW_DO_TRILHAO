import React from 'react'
import { Save } from 'lucide-react'
import GameModal from './GameModal'
import GameButton from './GameButton'

/**
 * ModalCriarSala / CreateRoomModal
 * Modal dedicado para criação de nova sala do Show do Trilhão
 *
 * Estrutura e Estilização Exigidas:
 * 1. Cabeçalho do Modal:
 *    - Título: "Criar Sala de Jogo" alinhado à esquerda.
 *    - Botão de fechar (X) alinhado à direita no topo.
 * 2. Corpo do Formulário (Layout em Coluna / Flex Direction Column):
 *    - Rótulo (Label): "Nome ou Identificação da Sala:" em uma linha dedicada acima do campo.
 *    - Campo de Entrada (Input):
 *      - Largura total (width: 100%) em linha própria abaixo do rótulo.
 *      - Fundo escuro harmonizado com o modal (tom escuro/azulado), borda fina suavizada e cantos arredondados (border-radius: 8px).
 *      - Contraste de Texto: Cor da fonte digitada visível (branca/clara #ffffff) e placeholder legível (Ex: Sala do Pedro).
 *      - Padding interno adequado para o cursor não colar nas bordas.
 *    - Texto Auxiliar / Descrição:
 *      - "O backend irá gerar automaticamente um código exclusivo de embarque (ex: CPTM-ABCD)." posicionado logo abaixo do input em nova linha.
 * 3. Rodapé de Ações:
 *    - Botões CANCELAR (secundário) e CONFIRMAR E ABRIR TELÃO (primário verde) alinhados lado a lado no rodapé com bom espaçamento.
 */
export default function ModalCriarSala({
  isOpen,
  onClose,
  nomeSala,
  setNomeSala,
  onSubmit,
  loading = false,
  criandoSala = false,
}) {
  const isLoading = Boolean(loading || criandoSala)

  return (
    <GameModal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Sala de Jogo"
      size="md"
    >
      <form onSubmit={onSubmit} className="game-form modal-form-criar-sala">
        <div className="form-group game-form-group">
          <label htmlFor="nome-sala-input" className="form-label game-form-label">
            Nome ou Identificação da Sala:
          </label>
          <input
            id="nome-sala-input"
            type="text"
            value={nomeSala}
            onChange={(e) => setNomeSala(e.target.value)}
            placeholder="Ex: Sala do Pedro"
            className="input-cptm game-input"
            maxLength={80}
            required
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
          <span className="form-hint game-form-hint">
            O backend irá gerar automaticamente um código exclusivo de embarque (ex: CPTM-ABCD).
          </span>
        </div>

        <div className="modal-actions-footer">
          <GameButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            id="btn-cancelar-criar-sala"
          >
            Cancelar
          </GameButton>
          <GameButton
            type="submit"
            variant="primary"
            disabled={isLoading || !nomeSala || !nomeSala.trim()}
            icon={<Save size={16} />}
            id="btn-confirmar-criar-sala"
          >
            {isLoading ? 'Criando...' : 'Confirmar e Abrir Telão'}
          </GameButton>
        </div>
      </form>
    </GameModal>
  )
}

// Alias exportável para manter interoperabilidade com especificações em inglês e português
export const CreateRoomModal = ModalCriarSala
