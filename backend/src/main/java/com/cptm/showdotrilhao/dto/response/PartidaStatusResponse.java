package com.cptm.showdotrilhao.dto.response;

import com.cptm.showdotrilhao.model.enums.StatusPartida;
import java.time.LocalDateTime;

public record PartidaStatusResponse(
        Long id,
        String salaCodigo,
        String salaNome,
        String jogadorNome,
        StatusPartida status,
        int nivelAlcancado,
        long pontuacaoFinal,
        int perguntaAtualIndex,
        LocalDateTime iniciadaEm,
        LocalDateTime finalizadaEm,
        PerguntaResponse perguntaAtual
) {}
