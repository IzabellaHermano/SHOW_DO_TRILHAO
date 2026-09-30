package com.cptm.showdotrilhao.dto.response;

import java.util.List;

public record PerguntaResponse(
        Long id,
        String enunciado,
        int nivelDificuldade,
        long valorPremio,
        int numeroPerguntaAtual,
        int totalPerguntas,
        List<AlternativaResponse> alternativas
) {}
