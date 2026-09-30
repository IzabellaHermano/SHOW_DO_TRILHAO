package com.cptm.showdotrilhao.dto.response;

import com.cptm.showdotrilhao.model.enums.StatusPartida;

public record ResultadoRespostaResponse(
        boolean acertou,
        int corretaNumero,
        String textoCorreta,
        String explicacao,
        StatusPartida statusPartida,
        int nivelAlcancado,
        long pontuacaoAtual,
        PerguntaResponse proximaPergunta,
        String mensagem
) {}
