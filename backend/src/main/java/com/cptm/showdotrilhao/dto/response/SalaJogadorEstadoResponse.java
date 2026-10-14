package com.cptm.showdotrilhao.dto.response;

import com.cptm.showdotrilhao.model.enums.FaseRodada;
import com.cptm.showdotrilhao.model.enums.StatusSala;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO seguro enviado para o dispositivo do jogador.
 * Conforme requisito de segurança, NÃO contém enunciado, texto das alternativas nem gabarito antecipado.
 */
public record SalaJogadorEstadoResponse(
        String codigoSala,
        String nomeSala,
        StatusSala statusSala,
        FaseRodada faseRodada,
        long versaoEstado,
        int nivelAtual,
        long valorPremioNivel,
        long premioAcumulado,
        LocalDateTime prazoFinal,
        LocalDateTime horaServidor,
        int totalSimbolos,
        List<Integer> simbolos,
        boolean jaRespondeu,
        Integer alternativaEscolhidaNumero,
        boolean eliminado,
        Boolean acertouUltima,
        Integer alternativaCorretaNumero,
        String explicacao,
        String mensagemStatus,
        String jogadorNome
) {}
