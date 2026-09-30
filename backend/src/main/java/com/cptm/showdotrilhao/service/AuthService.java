package com.cptm.showdotrilhao.service;

import com.cptm.showdotrilhao.dto.request.LoginRequest;
import com.cptm.showdotrilhao.dto.request.RegisterRequest;
import com.cptm.showdotrilhao.dto.response.TokenResponse;
import com.cptm.showdotrilhao.exception.RegraNegocioException;
import com.cptm.showdotrilhao.model.Usuario;
import com.cptm.showdotrilhao.model.enums.Role;
import com.cptm.showdotrilhao.repository.UsuarioRepository;
import com.cptm.showdotrilhao.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        // Regra de segurança: Cadastro público NUNCA pode criar usuário ADMIN
        if (request.role() == Role.ROLE_ADMIN) {
            throw new RegraNegocioException("Não é permitido cadastrar usuário Administrador pelo formulário público.");
        }

        if (usuarioRepository.existsByEmail(request.email())) {
            throw new RegraNegocioException("Já existe um usuário cadastrado com este e-mail.");
        }

        Usuario usuario = new Usuario(
                request.nome().trim(),
                request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.senha()),
                request.role()
        );

        usuario = usuarioRepository.save(usuario);
        String token = tokenProvider.generateToken(usuario.getEmail(), usuario.getId(), usuario.getRole().name());

        return new TokenResponse(token, usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getRole());
    }

    public TokenResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.senha())
        );

        Usuario usuario = usuarioRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new RegraNegocioException("Usuário não encontrado."));

        String token = tokenProvider.generateToken(usuario.getEmail(), usuario.getId(), usuario.getRole().name());

        return new TokenResponse(token, usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getRole());
    }
}
