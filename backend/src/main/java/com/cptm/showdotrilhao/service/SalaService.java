package com.cptm.showdotrilhao.service;

import com.cptm.showdotrilhao.dto.request.CriarSalaRequest;
import com.cptm.showdotrilhao.dto.response.SalaResponse;
import com.cptm.showdotrilhao.exception.RegraNegocioException;
import com.cptm.showdotrilhao.exception.ResourceNotFoundException;
import com.cptm.showdotrilhao.model.Sala;
import com.cptm.showdotrilhao.model.Usuario;
import com.cptm.showdotrilhao.repository.SalaRepository;
import com.cptm.showdotrilhao.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SalaService {

    private final SalaRepository salaRepository;
    private final UsuarioRepository usuarioRepository;
    private static final String CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();

    public SalaService(SalaRepository salaRepository, UsuarioRepository usuarioRepository) {
        this.salaRepository = salaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public SalaResponse criarSala(CriarSalaRequest request, Long apresentadorId) {
        Usuario apresentador = usuarioRepository.findById(apresentadorId)
                .orElseThrow(() -> new ResourceNotFoundException("Apresentador não encontrado."));

        String codigo = gerarCodigoUnico();
        Sala sala = new Sala(codigo, request.nome().trim(), apresentador);
        sala = salaRepository.save(sala);

        return toDto(sala);
    }

    public SalaResponse buscarPorCodigo(String codigo) {
        Sala sala = salaRepository.findByCodigo(codigo.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Sala não encontrada com o código: " + codigo));

        if (!sala.isAtiva()) {
            throw new RegraNegocioException("Esta sala foi desativada pelo apresentador.");
        }

        return toDto(sala);
    }

    public List<SalaResponse> listarSalasApresentador(Long apresentadorId) {
        Usuario apresentador = usuarioRepository.findById(apresentadorId)
                .orElseThrow(() -> new ResourceNotFoundException("Apresentador não encontrado."));

        return salaRepository.findByApresentadorOrderByCriadaEmDesc(apresentador)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<SalaResponse> listarTodasSalas() {
        return salaRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SalaResponse alternarStatusSala(Long salaId, Long apresentadorId) {
        Sala sala = salaRepository.findById(salaId)
                .orElseThrow(() -> new ResourceNotFoundException("Sala não encontrada."));

        if (!sala.getApresentador().getId().equals(apresentadorId)) {
            throw new RegraNegocioException("Você só pode alterar o status das salas que você criou.");
        }

        sala.setAtiva(!sala.isAtiva());
        sala = salaRepository.save(sala);
        return toDto(sala);
    }

    private String gerarCodigoUnico() {
        String codigo;
        do {
            StringBuilder sb = new StringBuilder("CPTM-");
            for (int i = 0; i < 4; i++) {
                sb.append(CARACTERES.charAt(random.nextInt(CARACTERES.length())));
            }
            codigo = sb.toString();
        } while (salaRepository.existsByCodigo(codigo));
        return codigo;
    }

    public SalaResponse toDto(Sala sala) {
        return new SalaResponse(
                sala.getId(),
                sala.getCodigo(),
                sala.getNome(),
                sala.getApresentador().getNome(),
                sala.isAtiva(),
                sala.getCriadaEm()
        );
    }
}
