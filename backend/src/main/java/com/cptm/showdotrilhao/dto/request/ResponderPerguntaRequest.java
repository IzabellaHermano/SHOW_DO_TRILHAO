package com.cptm.showdotrilhao.dto.request;

public record ResponderPerguntaRequest(
        Long alternativaId,
        Long perguntaId,
        boolean tempoEsgotado
) {
    public ResponderPerguntaRequest(Long alternativaId, boolean tempoEsgotado) {
        this(alternativaId, null, tempoEsgotado);
    }
}
