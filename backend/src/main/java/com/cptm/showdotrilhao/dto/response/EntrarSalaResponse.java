package com.cptm.showdotrilhao.dto.response;

import com.cptm.showdotrilhao.model.enums.FaseRodada;
import com.cptm.showdotrilhao.model.enums.StatusSala;

public record EntrarSalaResponse(
        String tokenSessao,
        Long partidaId,
        String codigoSala,
        String nomeJogador,
        StatusSala statusSala,
        FaseRodada faseRodada
) {}
