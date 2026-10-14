package com.cptm.showdotrilhao.controller;

import com.cptm.showdotrilhao.dto.request.EntrarSalaVisitanteRequest;
import com.cptm.showdotrilhao.dto.request.IniciarPartidaRequest;
import com.cptm.showdotrilhao.dto.request.ResponderPerguntaRequest;
import com.cptm.showdotrilhao.dto.response.PartidaStatusResponse;
import com.cptm.showdotrilhao.dto.response.ResultadoRespostaResponse;
import com.cptm.showdotrilhao.security.CustomUserDetails;
import com.cptm.showdotrilhao.service.PartidaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/partidas")
@Tag(name = "Partidas", description = "Endpoints de gameplay: iniciar partida, responder perguntas e abandonar")
public class PartidaController {

    private final PartidaService partidaService;

    public PartidaController(PartidaService partidaService) {
        this.partidaService = partidaService;
    }

    @PostMapping("/iniciar")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Endpoint descontinuado - utilizar fluxo oficial de sala /salas/{codigo}/entrar-jogador")
    public ResponseEntity<PartidaStatusResponse> iniciarJogador(
            @Valid @RequestBody IniciarPartidaRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        throw new com.cptm.showdotrilhao.exception.RegraNegocioException(
                "O início avulso de partidas na sala foi bloqueado. Por favor, conecte-se pelo fluxo oficial da sala em /salas/" + request.codigoSala() + "/entrar-jogador"
        );
    }

    @PostMapping("/visitante/iniciar")
    @Operation(summary = "Endpoint descontinuado - utilizar fluxo oficial de sala /salas/{codigo}/entrar-visitante")
    public ResponseEntity<PartidaStatusResponse> iniciarVisitante(
            @Valid @RequestBody EntrarSalaVisitanteRequest request) {
        throw new com.cptm.showdotrilhao.exception.RegraNegocioException(
                "O início avulso de partidas na sala foi bloqueado. Por favor, conecte-se pelo fluxo oficial da sala em /salas/" + request.codigoSala() + "/entrar-visitante"
        );
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Obter status atual da partida e pergunta corrente")
    public ResponseEntity<PartidaStatusResponse> buscarStatus(@PathVariable Long id) {
        PartidaStatusResponse response = partidaService.buscarStatus(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/responder")
    @Operation(summary = "Responder à pergunta atual da partida ou registrar tempo esgotado")
    public ResponseEntity<ResultadoRespostaResponse> responderPergunta(
            @PathVariable Long id,
            @RequestBody ResponderPerguntaRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        Long usuarioId = user != null ? user.getId() : null;
        ResultadoRespostaResponse response = partidaService.responderPergunta(id, request, usuarioId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/abandonar")
    @Operation(summary = "Abandonar a partida em andamento (penalidade: perde tudo)")
    public ResponseEntity<PartidaStatusResponse> abandonarPartida(@PathVariable Long id) {
        PartidaStatusResponse response = partidaService.abandonarPartida(id);
        return ResponseEntity.ok(response);
    }
}
