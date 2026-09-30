package com.cptm.showdotrilhao.controller;

import com.cptm.showdotrilhao.dto.response.RankingItemDTO;
import com.cptm.showdotrilhao.service.RankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ranking")
@Tag(name = "Rankings", description = "Endpoints para consulta do Ranking Geral e Ranking por Sala")
public class RankingController {

    private final RankingService rankingService;

    public RankingController(RankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping("/geral")
    @Operation(summary = "Obter ranking geral dos jogadores cadastrados")
    public ResponseEntity<List<RankingItemDTO>> obterRankingGeral() {
        return ResponseEntity.ok(rankingService.obterRankingGeral());
    }

    @GetMapping("/sala/{codigo}")
    @Operation(summary = "Obter ranking de uma sala específica (inclui participantes visitantes)")
    public ResponseEntity<List<RankingItemDTO>> obterRankingSala(@PathVariable String codigo) {
        return ResponseEntity.ok(rankingService.obterRankingSala(codigo));
    }
}
