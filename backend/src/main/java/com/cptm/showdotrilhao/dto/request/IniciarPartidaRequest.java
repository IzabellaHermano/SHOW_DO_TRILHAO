package com.cptm.showdotrilhao.dto.request;

import jakarta.validation.constraints.NotBlank;

public record IniciarPartidaRequest(
        @NotBlank(message = "O código da sala é obrigatório")
        String codigoSala
) {}
