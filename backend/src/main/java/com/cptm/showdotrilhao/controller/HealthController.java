package com.cptm.showdotrilhao.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
@Tag(name = "Health Check", description = "Monitoramento de integridade e liveness do serviço para o Render")
public class HealthController {

    @GetMapping
    @Operation(summary = "Verifica se a aplicação está operacional")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "Show do Trilhão API");
        status.put("timestamp", LocalDateTime.now());
        status.put("version", "1.0.0");
        return ResponseEntity.ok(status);
    }
}
