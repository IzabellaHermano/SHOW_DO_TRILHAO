package com.cptm.showdotrilhao.controller;

import com.cptm.showdotrilhao.dto.request.PerguntaRequest;
import com.cptm.showdotrilhao.dto.response.PerguntaAdminResponse;
import com.cptm.showdotrilhao.service.PerguntaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/perguntas/gestao")
@PreAuthorize("hasAnyRole('APRESENTADOR', 'ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Perguntas (Gestão)", description = "CRUD de perguntas do quiz para Apresentadores e Administradores")
public class PerguntaController {

    private final PerguntaService perguntaService;

    public PerguntaController(PerguntaService perguntaService) {
        this.perguntaService = perguntaService;
    }

    @GetMapping
    @Operation(summary = "Listar todas as perguntas cadastradas com gabarito")
    public ResponseEntity<List<PerguntaAdminResponse>> listarTodas() {
        return ResponseEntity.ok(perguntaService.listarTodasAdmin());
    }

    @PostMapping
    @Operation(summary = "Cadastrar nova pergunta para o quiz")
    public ResponseEntity<PerguntaAdminResponse> cadastrar(@Valid @RequestBody PerguntaRequest request) {
        PerguntaAdminResponse response = perguntaService.cadastrarPergunta(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar pergunta existente")
    public ResponseEntity<PerguntaAdminResponse> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody PerguntaRequest request) {
        PerguntaAdminResponse response = perguntaService.atualizarPergunta(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir pergunta")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        perguntaService.excluirPergunta(id);
        return ResponseEntity.noContent().build();
    }
}
