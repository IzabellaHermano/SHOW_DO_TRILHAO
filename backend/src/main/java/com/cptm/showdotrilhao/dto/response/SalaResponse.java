package com.cptm.showdotrilhao.dto.response;

import com.cptm.showdotrilhao.model.enums.FaseRodada;
import com.cptm.showdotrilhao.model.enums.StatusSala;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public record SalaResponse(
        Long id,
        String codigo,
        String nome,
        String apresentadorNome,
        boolean ativa,
        StatusSala status,
        FaseRodada faseRodada,
        int perguntaAtualIndex,
        LocalDateTime criadaEm
) {
    public SalaResponse(Long id, String codigo, String nome, String apresentadorNome, boolean ativa, LocalDateTime criadaEm) {
        this(id, codigo, nome, apresentadorNome, ativa, StatusSala.AGUARDANDO, FaseRodada.LOBBY, 0, criadaEm);
    }

    @JsonProperty("createdAt")
    public LocalDateTime getCreatedAt() {
        return criadaEm;
    }
}
