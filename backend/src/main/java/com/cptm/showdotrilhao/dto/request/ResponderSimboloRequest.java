package com.cptm.showdotrilhao.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ResponderSimboloRequest(
        @NotNull(message = "O número do símbolo deve ser informado (1 a 4).")
        @Min(value = 1, message = "O símbolo mínimo é 1.")
        @Max(value = 4, message = "O símbolo máximo é 4.")
        Integer simboloNumero
) {}
