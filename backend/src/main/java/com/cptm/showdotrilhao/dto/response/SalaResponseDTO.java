package com.cptm.showdotrilhao.dto.response;

import com.cptm.showdotrilhao.model.enums.StatusSala;
import java.time.LocalDateTime;

/**
 * DTO oficial de resposta simplificada para listagens de salas.
 */
public record SalaResponseDTO(
        Long id,
        String codigo,
        String nome,
        StatusSala status,
        LocalDateTime createdAt
) {
}
