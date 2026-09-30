package com.cptm.showdotrilhao.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EntrarSalaVisitanteRequest(
        @NotBlank(message = "O código da sala é obrigatório")
        String codigoSala,

        @NotBlank(message = "O seu nome de identificação é obrigatório")
        @Size(min = 2, max = 50, message = "O nome deve ter entre 2 e 50 caracteres")
        String nomeVisitante
) {}
