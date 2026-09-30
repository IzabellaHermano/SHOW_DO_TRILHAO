package com.cptm.showdotrilhao.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AlternativaRequest(
        @NotNull(message = "O número da alternativa é obrigatório")
        @Min(1) @Max(4)
        Integer numero,

        @NotBlank(message = "O texto da alternativa é obrigatório")
        String texto,

        @NotNull(message = "A indicação se a alternativa é correta é obrigatória")
        Boolean correta
) {}
