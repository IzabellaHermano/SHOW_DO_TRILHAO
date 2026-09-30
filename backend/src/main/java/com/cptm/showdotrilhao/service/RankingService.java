package com.cptm.showdotrilhao.service;

import com.cptm.showdotrilhao.dto.response.RankingItemDTO;
import com.cptm.showdotrilhao.exception.ResourceNotFoundException;
import com.cptm.showdotrilhao.model.Partida;
import com.cptm.showdotrilhao.model.Sala;
import com.cptm.showdotrilhao.model.enums.StatusPartida;
import com.cptm.showdotrilhao.repository.PartidaRepository;
import com.cptm.showdotrilhao.repository.SalaRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RankingService {

    private final PartidaRepository partidaRepository;
    private final SalaRepository salaRepository;

    public RankingService(PartidaRepository partidaRepository, SalaRepository salaRepository) {
        this.partidaRepository = partidaRepository;
        this.salaRepository = salaRepository;
    }

    public List<RankingItemDTO> obterRankingGeral() {
        List<Partida> partidas = partidaRepository.findRankingGeral(StatusPartida.EM_ANDAMENTO);
        List<RankingItemDTO> ranking = new ArrayList<>();

        int pos = 1;
        for (Partida p : partidas) {
            ranking.add(new RankingItemDTO(
                    pos++,
                    p.getNomeJogador(),
                    p.getPontuacaoFinal(),
                    p.getNivelAlcancado(),
                    p.getStatus(),
                    p.getUsuario() != null ? "JOGADOR" : "VISITANTE",
                    p.getFinalizadaEm() != null ? p.getFinalizadaEm() : p.getIniciadaEm()
            ));
            if (pos > 50) break; // Limita aos top 50
        }

        return ranking;
    }

    public List<RankingItemDTO> obterRankingSala(String codigoSala) {
        Sala sala = salaRepository.findByCodigo(codigoSala.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Sala não encontrada com código: " + codigoSala));

        List<Partida> partidas = partidaRepository.findRankingSala(sala, StatusPartida.EM_ANDAMENTO);
        List<RankingItemDTO> ranking = new ArrayList<>();

        int pos = 1;
        for (Partida p : partidas) {
            ranking.add(new RankingItemDTO(
                    pos++,
                    p.getNomeJogador(),
                    p.getPontuacaoFinal(),
                    p.getNivelAlcancado(),
                    p.getStatus(),
                    p.getUsuario() != null ? "JOGADOR" : "VISITANTE",
                    p.getFinalizadaEm() != null ? p.getFinalizadaEm() : p.getIniciadaEm()
            ));
            if (pos > 50) break;
        }

        return ranking;
    }
}
