package com.cptm.showdotrilhao.dto.response;

import com.cptm.showdotrilhao.model.enums.FaseRodada;
import com.cptm.showdotrilhao.model.enums.StatusSala;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO para o Telão do Apresentador (computador/TV/projetor).
 * Exibe a pergunta completa, alternativas em texto, cronômetro e contagem de respostas em tempo real.
 */
public record SalaApresentadorEstadoResponse(
        String codigoSala,
        String nomeSala,
        StatusSala statusSala,
        FaseRodada faseRodada,
        long versaoEstado,
        int nivelAtual,
        long valorPremioNivel,
        LocalDateTime prazoFinal,
        LocalDateTime horaServidor,
        Long perguntaId,
        String enunciado,
        String explicacao,
        List<AlternativaResponse> alternativas,
        Integer alternativaCorretaNumero,
        int totalJogadoresConectados,
        int totalJogadoresAtivos,
        int totalJogadoresEliminados,
        int totalRespostasRecebidas,
        Map<Integer, Long> votosPorAlternativa,
        List<String> participantesLobby
) {}
