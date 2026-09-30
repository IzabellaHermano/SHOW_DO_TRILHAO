package com.cptm.showdotrilhao.dto.response;

import com.cptm.showdotrilhao.model.enums.StatusPartida;
import java.time.LocalDateTime;

public record RankingItemDTO(
        int posicao,
        String nome,
        long pontuacao,
        int nivel,
        StatusPartida status,
        String tipoJogador,
        LocalDateTime data
) {}
