package com.cptm.showdotrilhao.dto.response;

import java.util.List;

public record PerguntaAdminResponse(
        Long id,
        String enunciado,
        int nivelDificuldade,
        long valorPremio,
        String explicacao,
        List<AlternativaAdminResponse> alternativas
) {
    public record AlternativaAdminResponse(
            Long id,
            int numero,
            String texto,
            boolean correta
    ) {}
}
