package com.cptm.showdotrilhao.dto.response;

import java.time.LocalDateTime;

public record SalaResponse(
        Long id,
        String codigo,
        String nome,
        String apresentadorNome,
        boolean ativa,
        LocalDateTime criadaEm
) {}
