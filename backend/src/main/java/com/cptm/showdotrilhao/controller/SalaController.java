package com.cptm.showdotrilhao.controller;

import com.cptm.showdotrilhao.dto.request.CriarSalaRequest;
import com.cptm.showdotrilhao.dto.request.EntrarSalaVisitanteRequest;
import com.cptm.showdotrilhao.dto.request.ResponderSimboloRequest;
import com.cptm.showdotrilhao.dto.response.*;
import com.cptm.showdotrilhao.security.CustomUserDetails;
import com.cptm.showdotrilhao.service.SalaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/salas")
@Tag(name = "Salas", description = "Endpoints de gerenciamento e gameplay de salas multiplayer")
public class SalaController {

    private final SalaService salaService;

    public SalaController(SalaService salaService) {
        this.salaService = salaService;
    }

    @GetMapping("/public/verificar/{codigo}")
    @Operation(summary = "Verificar se código de sala é válido e está ativo (público)")
    public ResponseEntity<SalaResponse> verificarSala(@PathVariable String codigo) {
        SalaResponse response = salaService.buscarPorCodigo(codigo);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{codigo}/entrar-visitante")
    @Operation(summary = "Embarcar visitante na sala informando código e apelido")
    public ResponseEntity<EntrarSalaResponse> entrarVisitante(
            @PathVariable String codigo,
            @Valid @RequestBody EntrarSalaVisitanteRequest request) {
        EntrarSalaResponse response = salaService.entrarSalaVisitante(codigo, request.nomeVisitante());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{codigo}/entrar-jogador")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Embarcar jogador autenticado na sala")
    public ResponseEntity<EntrarSalaResponse> entrarJogador(
            @PathVariable String codigo,
            @AuthenticationPrincipal CustomUserDetails user) {
        EntrarSalaResponse response = salaService.entrarSalaJogador(codigo, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{codigo}/iniciar")
    @PreAuthorize("hasAnyRole('APRESENTADOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Apresentador dono inicia o jogo coletivo da sala")
    public ResponseEntity<SalaApresentadorEstadoResponse> iniciarJogo(
            @PathVariable String codigo,
            @AuthenticationPrincipal CustomUserDetails user) {
        SalaApresentadorEstadoResponse response = salaService.iniciarJogo(codigo, user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{codigo}/estado-apresentador")
    @PreAuthorize("hasAnyRole('APRESENTADOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Obter estado da sala para o Telão do Apresentador")
    public ResponseEntity<SalaApresentadorEstadoResponse> obterEstadoApresentador(
            @PathVariable String codigo,
            @AuthenticationPrincipal CustomUserDetails user) {
        SalaApresentadorEstadoResponse response = salaService.obterEstadoApresentador(codigo, user.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{codigo}/revelar")
    @PreAuthorize("hasAnyRole('APRESENTADOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Apresentador revela a resposta correta da pergunta atual")
    public ResponseEntity<SalaApresentadorEstadoResponse> revelarResposta(
            @PathVariable String codigo,
            @AuthenticationPrincipal CustomUserDetails user) {
        SalaApresentadorEstadoResponse response = salaService.revelarResposta(codigo, user.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{codigo}/proxima")
    @PreAuthorize("hasAnyRole('APRESENTADOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Apresentador avança para a próxima pergunta ou encerra o jogo")
    public ResponseEntity<SalaApresentadorEstadoResponse> proximaPergunta(
            @PathVariable String codigo,
            @AuthenticationPrincipal CustomUserDetails user) {
        SalaApresentadorEstadoResponse response = salaService.proximaPergunta(codigo, user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{codigo}/estado-jogador")
    @Operation(summary = "Obter estado seguro sincronizado para o dispositivo do jogador")
    public ResponseEntity<SalaJogadorEstadoResponse> obterEstadoJogador(
            @PathVariable String codigo,
            @RequestHeader(value = "X-Session-Token", required = false) String headerToken,
            @RequestParam(value = "token", required = false) String paramToken,
            @AuthenticationPrincipal CustomUserDetails user) {
        String token = headerToken != null && !headerToken.isBlank() ? headerToken : paramToken;
        Long usuarioId = user != null ? user.getId() : null;
        SalaJogadorEstadoResponse response = salaService.obterEstadoJogador(codigo, token, usuarioId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{codigo}/responder-simbolo")
    @Operation(summary = "Jogador responde tocando em um símbolo numerado de 1 a 4")
    public ResponseEntity<SalaJogadorEstadoResponse> responderSimbolo(
            @PathVariable String codigo,
            @RequestHeader(value = "X-Session-Token", required = false) String headerToken,
            @RequestParam(value = "token", required = false) String paramToken,
            @Valid @RequestBody ResponderSimboloRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        String token = headerToken != null && !headerToken.isBlank() ? headerToken : paramToken;
        Long usuarioId = user != null ? user.getId() : null;
        SalaJogadorEstadoResponse response = salaService.responderPerguntaSimbolo(codigo, token, usuarioId, request.simboloNumero());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/apresentador")
    @PreAuthorize("hasAnyRole('APRESENTADOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Criar nova sala de jogo com código único (Apresentador/Admin)")
    public ResponseEntity<SalaResponse> criarSala(
            @Valid @RequestBody CriarSalaRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        SalaResponse response = salaService.criarSala(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/apresentador/minhas")
    @PreAuthorize("hasAnyRole('APRESENTADOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Listar salas criadas pelo apresentador logado")
    public ResponseEntity<List<SalaResponse>> listarMinhasSalas(
            @AuthenticationPrincipal CustomUserDetails user) {
        List<SalaResponse> salas = salaService.listarSalasApresentador(user.getId());
        return ResponseEntity.ok(salas);
    }

    @PatchMapping("/apresentador/{id}/alternar-status")
    @PreAuthorize("hasAnyRole('APRESENTADOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Ativar ou desativar uma sala")
    public ResponseEntity<SalaResponse> alternarStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user) {
        SalaResponse response = salaService.alternarStatusSala(id, user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/todas")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Listar todas as salas do sistema (Exclusivo Admin)")
    public ResponseEntity<List<SalaResponse>> listarTodas() {
        return ResponseEntity.ok(salaService.listarTodasSalas());
    }
}
