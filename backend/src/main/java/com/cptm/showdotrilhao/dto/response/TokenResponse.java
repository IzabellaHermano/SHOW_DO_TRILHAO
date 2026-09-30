package com.cptm.showdotrilhao.dto.response;

import com.cptm.showdotrilhao.model.enums.Role;

public record TokenResponse(
        String token,
        String tipo,
        Long id,
        String nome,
        String email,
        Role role
) {
    public TokenResponse(String token, Long id, String nome, String email, Role role) {
        this(token, "Bearer", id, nome, email, role);
    }
}
