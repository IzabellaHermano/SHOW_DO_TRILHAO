package com.cptm.showdotrilhao.controller;

import com.cptm.showdotrilhao.dto.request.CriarSalaRequest;
import com.cptm.showdotrilhao.dto.response.SalaResponse;
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
@Tag(name = "Salas", description = "Endpoints de gerenciamento e verificação de salas de jogo")
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
