package com.cptm.showdotrilhao.dto.response;

import com.cptm.showdotrilhao.model.enums.Role;
import java.time.LocalDateTime;

public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        Role role,
        LocalDateTime criadoEm
) {}
