package com.cptm.showdotrilhao.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CriarSalaRequest(
        @NotBlank(message = "O nome da sala é obrigatório")
        @Size(min = 3, max = 100, message = "O nome da sala deve ter entre 3 e 100 caracteres")
        String nome
) {}
