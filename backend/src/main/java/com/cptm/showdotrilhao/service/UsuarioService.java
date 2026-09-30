package com.cptm.showdotrilhao.service;

import com.cptm.showdotrilhao.dto.response.UsuarioResponse;
import com.cptm.showdotrilhao.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public List<UsuarioResponse> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(u -> new UsuarioResponse(
                        u.getId(),
                        u.getNome(),
                        u.getEmail(),
                        u.getRole(),
                        u.getCriadoEm()
                ))
                .collect(Collectors.toList());
    }
}
