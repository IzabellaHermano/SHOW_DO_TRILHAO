package com.cptm.showdotrilhao.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PerguntaRequest(
        @NotBlank(message = "O enunciado da pergunta é obrigatório")
        String enunciado,

        @NotNull(message = "O nível de dificuldade é obrigatório")
        @Min(value = 1, message = "O nível mínimo é 1")
        @Max(value = 10, message = "O nível máximo é 10")
        Integer nivelDificuldade,

        @NotNull(message = "O valor do prêmio é obrigatório")
        Long valorPremio,

        String explicacao,

        @NotNull(message = "As alternativas são obrigatórias")
        @Size(min = 4, max = 4, message = "A pergunta deve ter exatamente 4 alternativas")
        List<AlternativaRequest> alternativas
) {}
