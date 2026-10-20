package com.cptm.showdotrilhao.service;

import com.cptm.showdotrilhao.dto.request.CriarSalaRequest;
import com.cptm.showdotrilhao.dto.request.PerguntaRequest;
import com.cptm.showdotrilhao.dto.response.*;
import com.cptm.showdotrilhao.exception.RegraNegocioException;
import com.cptm.showdotrilhao.exception.ResourceNotFoundException;
import com.cptm.showdotrilhao.model.*;
import com.cptm.showdotrilhao.model.enums.FaseRodada;
import com.cptm.showdotrilhao.model.enums.StatusPartida;
import com.cptm.showdotrilhao.model.enums.StatusSala;
import com.cptm.showdotrilhao.repository.PartidaRepository;
import com.cptm.showdotrilhao.repository.PerguntaRepository;
import com.cptm.showdotrilhao.repository.RespostaPartidaRepository;
import com.cptm.showdotrilhao.repository.SalaRepository;
import com.cptm.showdotrilhao.repository.UsuarioRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SalaService {

    private final SalaRepository salaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PartidaRepository partidaRepository;
    private final RespostaPartidaRepository respostaPartidaRepository;
    private final PerguntaService perguntaService;
    private static final String CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();

    public SalaService(SalaRepository salaRepository,
                       UsuarioRepository usuarioRepository,
                       PartidaRepository partidaRepository,
                       RespostaPartidaRepository respostaPartidaRepository,
                       PerguntaService perguntaService) {
        this.salaRepository = salaRepository;
        this.usuarioRepository = usuarioRepository;
        this.partidaRepository = partidaRepository;
        this.respostaPartidaRepository = respostaPartidaRepository;
        this.perguntaService = perguntaService;
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

    @Transactional(readOnly = true)
    public SalaResponse buscarPorCodigo(String codigo) {
        Sala sala = obterSalaAtiva(codigo);
        return toDto(sala);
    }

    @Transactional(readOnly = true)
    public List<SalaResponse> listarSalasApresentador(Long apresentadorId) {
        Usuario apresentador = usuarioRepository.findById(apresentadorId)
                .orElseThrow(() -> new ResourceNotFoundException("Apresentador não encontrado."));

        return salaRepository.findByApresentadorOrderByCriadaEmDesc(apresentador)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalaResponse> listarTodasSalas() {
        return salaRepository.findAllWithApresentador()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SalaResponse alternarStatusSala(Long salaId, Long apresentadorId) {
        Sala sala = salaRepository.findById(salaId)
                .orElseThrow(() -> new ResourceNotFoundException("Sala não encontrada."));

        validarDonoSala(sala, apresentadorId);

        sala.setAtiva(!sala.isAtiva());
        sala = salaRepository.save(sala);
        return toDto(sala);
    }

    // ========================================================
    // ENTRADA DE PARTICIPANTES (VISITANTE E LOGADO)
    // ========================================================

    @Transactional
    public EntrarSalaResponse entrarSalaVisitante(String codigo, String nomeVisitante) {
        if (nomeVisitante == null || nomeVisitante.trim().length() < 2) {
            throw new RegraNegocioException("Por favor, informe seu nome ou apelido para embarcar no jogo.");
        }
        String nomeNormalizado = nomeVisitante.trim();
        Sala sala = obterSalaAtiva(codigo);

        if (sala.getStatus() == StatusSala.EM_ANDAMENTO) {
            throw new RegraNegocioException("A partida nesta sala já está em andamento. Aguarde o encerramento da viagem para participar da próxima partida!");
        }
        if (sala.getStatus() == StatusSala.FINALIZADA) {
            throw new RegraNegocioException("Esta sala já foi encerrada pelo apresentador.");
        }

        if (partidaRepository.existsBySalaAndNomeVisitanteIgnoreCase(sala, nomeNormalizado)) {
            throw new RegraNegocioException("Já existe um passageiro com o apelido '" + nomeNormalizado + "' nesta sala. Por favor, escolha outro nome.");
        }

        String tokenSessao = UUID.randomUUID().toString();
        Partida partida = new Partida(sala, null, nomeNormalizado, null);
        partida.setTokenSessao(tokenSessao);
        partida.setStatus(StatusPartida.EM_ANDAMENTO);
        partida = partidaRepository.save(partida);

        sala.incrementarVersao();
        salaRepository.save(sala);

        return new EntrarSalaResponse(
                tokenSessao,
                partida.getId(),
                sala.getCodigo(),
                partida.getNomeJogador(),
                sala.getStatus(),
                sala.getFaseRodada()
        );
    }

    @Transactional
    public EntrarSalaResponse entrarSalaJogador(String codigo, Long usuarioId) {
        Sala sala = obterSalaAtiva(codigo);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        // Se o jogador já possui uma partida nesta sala, reaproveita a sessão
        Optional<Partida> partidaExistente = partidaRepository.findBySalaAndUsuarioId(sala, usuarioId);
        if (partidaExistente.isPresent()) {
            Partida p = partidaExistente.get();
            if (p.getTokenSessao() == null) {
                p.setTokenSessao(UUID.randomUUID().toString());
                p = partidaRepository.save(p);
            }
            return new EntrarSalaResponse(
                    p.getTokenSessao(),
                    p.getId(),
                    sala.getCodigo(),
                    p.getNomeJogador(),
                    sala.getStatus(),
                    sala.getFaseRodada()
            );
        }

        if (sala.getStatus() == StatusSala.EM_ANDAMENTO) {
            throw new RegraNegocioException("A partida nesta sala já está em andamento. Aguarde o encerramento da viagem para participar da próxima partida!");
        }
        if (sala.getStatus() == StatusSala.FINALIZADA) {
            throw new RegraNegocioException("Esta sala já foi encerrada pelo apresentador.");
        }

        String tokenSessao = UUID.randomUUID().toString();
        Partida partida = new Partida(sala, usuario, null, null);
        partida.setTokenSessao(tokenSessao);
        partida.setStatus(StatusPartida.EM_ANDAMENTO);
        partida = partidaRepository.save(partida);

        sala.incrementarVersao();
        salaRepository.save(sala);

        return new EntrarSalaResponse(
                tokenSessao,
                partida.getId(),
                sala.getCodigo(),
                partida.getNomeJogador(),
                sala.getStatus(),
                sala.getFaseRodada()
        );
    }

    // ========================================================
    // CONTROLE DE PARTIDA PELO APRESENTADOR
    // ========================================================

    @Transactional
    public SalaApresentadorEstadoResponse iniciarJogo(String codigo, Long apresentadorId) {
        Sala sala = obterSalaAtiva(codigo);
        validarDonoSala(sala, apresentadorId);

        if (sala.getStatus() != StatusSala.AGUARDANDO) {
            throw new RegraNegocioException("A partida desta sala já foi iniciada ou finalizada.");
        }

        // Monta as 10 perguntas da partida preservando perguntas personalizadas vinculadas à sala
        List<SalaPergunta> existentes = new ArrayList<>(sala.getPerguntas());
        Set<Long> idsExistentes = existentes.stream().map(sp -> sp.getPergunta().getId()).collect(Collectors.toSet());

        List<Pergunta> perguntasPartida;
        if (existentes.size() >= 10) {
            perguntasPartida = existentes.stream().map(SalaPergunta::getPergunta).limit(10).collect(Collectors.toList());
        } else {
            List<Pergunta> sorteadas = perguntaService.sortearPerguntasPartida();
            perguntasPartida = new ArrayList<>();
            for (SalaPergunta sp : existentes) {
                perguntasPartida.add(sp.getPergunta());
            }
            for (Pergunta p : sorteadas) {
                if (perguntasPartida.size() >= 10) break;
                if (!idsExistentes.contains(p.getId())) {
                    perguntasPartida.add(p);
                    idsExistentes.add(p.getId());
                }
            }
        }

        if (perguntasPartida.size() < 10) {
            throw new RegraNegocioException("Não foi possível sortear as 10 perguntas da partida. Verifique o banco de perguntas.");
        }

        sala.getPerguntas().clear();
        for (int i = 0; i < perguntasPartida.size(); i++) {
            sala.adicionarPergunta(perguntasPartida.get(i), i + 1);
        }

        sala.setStatus(StatusSala.EM_ANDAMENTO);
        sala.setPerguntaAtualIndex(0);
        sala.setFaseRodada(FaseRodada.PERGUNTA);
        sala.setAbertaEm(LocalDateTime.now());
        sala.setPrazoFinal(LocalDateTime.now().plusSeconds(45));
        sala.incrementarVersao();

        sala = salaRepository.save(sala);
        return montarEstadoApresentador(sala);
    }

    @Transactional(readOnly = true)
    public SalaApresentadorEstadoResponse obterEstadoApresentador(String codigo, Long apresentadorId) {
        Sala sala = obterSalaAtiva(codigo);
        validarDonoSala(sala, apresentadorId);
        return montarEstadoApresentador(sala);
    }

    @Transactional
    public SalaApresentadorEstadoResponse revelarResposta(String codigo, Long apresentadorId) {
        Sala sala = obterSalaAtiva(codigo);
        validarDonoSala(sala, apresentadorId);

        if (sala.getStatus() != StatusSala.EM_ANDAMENTO) {
            throw new RegraNegocioException("A sala não está em andamento.");
        }
        if (sala.getFaseRodada() != FaseRodada.PERGUNTA) {
            return montarEstadoApresentador(sala); // Já revelada
        }

        Pergunta perguntaAtual = obterPerguntaAtual(sala);
        List<Partida> partidas = partidaRepository.findBySala(sala);

        // Processa todos os jogadores ativos da sala
        for (Partida p : partidas) {
            if (p.getStatus() == StatusPartida.EM_ANDAMENTO) {
                Optional<RespostaPartida> optResp = respostaPartidaRepository.findByPartidaAndPergunta(p, perguntaAtual);
                if (optResp.isEmpty()) {
                    // Tempo esgotado / não respondeu: perde tudo e eliminado
                    RespostaPartida respTimeOut = new RespostaPartida(p, perguntaAtual, null, false, true, 45000L);
                    respostaPartidaRepository.save(respTimeOut);

                    p.setStatus(StatusPartida.ELIMINADO);
                    p.setPontuacaoFinal(0L);
                    p.setFinalizadaEm(LocalDateTime.now());
                    partidaRepository.save(p);
                } else {
                    RespostaPartida resp = optResp.get();
                    if (resp.isAcertou()) {
                        int nivel = sala.getPerguntaAtualIndex() + 1;
                        p.setNivelAlcancado(nivel);
                        if (nivel >= 10) {
                            p.setStatus(StatusPartida.VITORIA);
                            p.setPontuacaoFinal(1000000L);
                            p.setFinalizadaEm(LocalDateTime.now());
                        } else {
                            p.setPontuacaoFinal(perguntaAtual.getValorPremio());
                        }
                        partidaRepository.save(p);
                    } else {
                        // Errou: perde tudo e eliminado
                        p.setStatus(StatusPartida.ELIMINADO);
                        p.setPontuacaoFinal(0L);
                        p.setFinalizadaEm(LocalDateTime.now());
                        partidaRepository.save(p);
                    }
                }
            }
        }

        sala.setFaseRodada(FaseRodada.REVELACAO);
        sala.incrementarVersao();
        sala = salaRepository.save(sala);

        return montarEstadoApresentador(sala);
    }

    @Transactional
    public SalaApresentadorEstadoResponse proximaPergunta(String codigo, Long apresentadorId) {
        Sala sala = obterSalaAtiva(codigo);
        validarDonoSala(sala, apresentadorId);

        if (sala.getStatus() != StatusSala.EM_ANDAMENTO) {
            throw new RegraNegocioException("A sala não está em andamento.");
        }

        int proximoIndex = sala.getPerguntaAtualIndex() + 1;
        if (proximoIndex >= 10) {
            // Fim de jogo: 10 perguntas concluídas
            sala.setStatus(StatusSala.FINALIZADA);
            sala.setFaseRodada(FaseRodada.FINAL);
            sala.incrementarVersao();
            sala = salaRepository.save(sala);
            return montarEstadoApresentador(sala);
        }

        sala.setPerguntaAtualIndex(proximoIndex);
        sala.setFaseRodada(FaseRodada.PERGUNTA);
        sala.setAbertaEm(LocalDateTime.now());
        sala.setPrazoFinal(LocalDateTime.now().plusSeconds(45));
        sala.incrementarVersao();

        sala = salaRepository.save(sala);
        return montarEstadoApresentador(sala);
    }

    // ========================================================
    // GAMEPLAY DO JOGADOR
    // ========================================================

    @Transactional(readOnly = true)
    public SalaJogadorEstadoResponse obterEstadoJogador(String codigo, String tokenSessao, Long usuarioId) {
        Sala sala = obterSalaAtiva(codigo);
        Partida partida = localizarPartidaJogador(sala, tokenSessao, usuarioId);

        return montarEstadoJogador(sala, partida);
    }

    @Transactional
    public SalaJogadorEstadoResponse responderPerguntaSimbolo(String codigo, String tokenSessao, Long usuarioId, int simboloNumero) {
        Sala sala = obterSalaAtiva(codigo);
        Partida partida = localizarPartidaJogador(sala, tokenSessao, usuarioId);

        if (sala.getStatus() != StatusSala.EM_ANDAMENTO || sala.getFaseRodada() != FaseRodada.PERGUNTA) {
            throw new RegraNegocioException("Não é permitido responder neste momento da rodada.");
        }

        // Validação estrita do prazo controlado pelo servidor (+1s tolerância de latência)
        if (sala.getPrazoFinal() != null && LocalDateTime.now().isAfter(sala.getPrazoFinal().plusSeconds(1))) {
            throw new RegraNegocioException("Tempo esgotado para esta pergunta! Nos trilhos da CPTM, a pontualidade é essencial.");
        }

        if (partida.getStatus() != StatusPartida.EM_ANDAMENTO) {
            throw new RegraNegocioException("Você foi eliminado desta partida e está no modo espectador.");
        }

        Pergunta perguntaAtual = obterPerguntaAtual(sala);

        if (respostaPartidaRepository.existsByPartidaAndPergunta(partida, perguntaAtual)) {
            throw new RegraNegocioException("Você já enviou sua resposta para esta pergunta.");
        }

        Alternativa alternativaEscolhida = perguntaAtual.getAlternativas().stream()
                .filter(a -> a.getNumero() == simboloNumero)
                .findFirst()
                .orElseThrow(() -> new RegraNegocioException("Símbolo " + simboloNumero + " não encontrado nesta pergunta."));

        long tempoRespostaMs = 0L;
        if (sala.getAbertaEm() != null) {
            tempoRespostaMs = Duration.between(sala.getAbertaEm(), LocalDateTime.now()).toMillis();
            if (tempoRespostaMs < 0) tempoRespostaMs = 0L;
        }

        partida.adicionarTempoRespostaMs(tempoRespostaMs);
        partidaRepository.save(partida);

        RespostaPartida resposta = new RespostaPartida(
                partida,
                perguntaAtual,
                alternativaEscolhida,
                alternativaEscolhida.isCorreta(),
                false,
                tempoRespostaMs
        );
        respostaPartidaRepository.save(resposta);

        sala.incrementarVersao();
        salaRepository.save(sala);

        return montarEstadoJogador(sala, partida);
    }

    // ========================================================
    // MÉTODOS AUXILIARES
    // ========================================================

    private Sala obterSalaAtiva(String codigo) {
        Sala sala = salaRepository.findByCodigo(codigo.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Sala não encontrada com o código: " + codigo));

        if (!sala.isAtiva()) {
            throw new RegraNegocioException("Esta sala foi desativada pelo apresentador.");
        }
        return sala;
    }

    private void validarDonoSala(Sala sala, Long apresentadorId) {
        if (apresentadorId == null || !sala.getApresentador().getId().equals(apresentadorId)) {
            throw new AccessDeniedException("Apenas o apresentador criador da sala pode executar esta ação.");
        }
    }

    private Partida localizarPartidaJogador(Sala sala, String tokenSessao, Long usuarioId) {
        if (tokenSessao != null && !tokenSessao.isBlank()) {
            Optional<Partida> opt = partidaRepository.findByTokenSessao(tokenSessao);
            if (opt.isPresent() && opt.get().getSala().getId().equals(sala.getId())) {
                return opt.get();
            }
        }
        if (usuarioId != null) {
            Optional<Partida> opt = partidaRepository.findBySalaAndUsuarioId(sala, usuarioId);
            if (opt.isPresent()) {
                return opt.get();
            }
        }
        throw new ResourceNotFoundException("Participante não encontrado nesta sala. Faça o embarque pelo código ou QR code.");
    }

    private Pergunta obterPerguntaAtual(Sala sala) {
        int index = sala.getPerguntaAtualIndex();
        if (sala.getPerguntas().isEmpty() || index >= sala.getPerguntas().size()) {
            throw new RegraNegocioException("Pergunta do nível atual não foi encontrada na sala.");
        }
        return sala.getPerguntas().get(index).getPergunta();
    }

    private SalaApresentadorEstadoResponse montarEstadoApresentador(Sala sala) {
        List<Partida> partidas = partidaRepository.findBySala(sala);
        List<String> participantes = partidas.stream()
                .map(Partida::getNomeJogador)
                .collect(Collectors.toList());

        int totalConectados = partidas.size();
        int totalAtivos = (int) partidas.stream().filter(p -> p.getStatus() == StatusPartida.EM_ANDAMENTO).count();
        int totalEliminados = (int) partidas.stream().filter(p -> p.getStatus() == StatusPartida.ELIMINADO).count();

        if (sala.getStatus() == StatusSala.AGUARDANDO) {
            return new SalaApresentadorEstadoResponse(
                    sala.getCodigo(),
                    sala.getNome(),
                    sala.getStatus(),
                    sala.getFaseRodada(),
                    sala.getVersaoEstado(),
                    0,
                    0L,
                    null,
                    LocalDateTime.now(),
                    null,
                    null,
                    null,
                    Collections.emptyList(),
                    null,
                    totalConectados,
                    totalAtivos,
                    totalEliminados,
                    0,
                    Collections.emptyMap(),
                    participantes
            );
        }

        Pergunta perguntaAtual = obterPerguntaAtual(sala);
        List<AlternativaResponse> alternativasDto = perguntaAtual.getAlternativas().stream()
                .sorted(Comparator.comparingInt(Alternativa::getNumero))
                .map(a -> new AlternativaResponse(a.getId(), a.getNumero(), a.getTexto()))
                .collect(Collectors.toList());

        int corretaNumero = perguntaAtual.getAlternativas().stream()
                .filter(Alternativa::isCorreta)
                .map(Alternativa::getNumero)
                .findFirst()
                .orElse(1);

        List<RespostaPartida> respostas = respostaPartidaRepository.findByPerguntaAndPartida_Sala(perguntaAtual, sala);
        int totalRespostas = respostas.size();

        Map<Integer, Long> votos = new HashMap<>();
        for (int i = 1; i <= 4; i++) votos.put(i, 0L);
        for (RespostaPartida r : respostas) {
            if (r.getAlternativaEscolhida() != null) {
                int num = r.getAlternativaEscolhida().getNumero();
                votos.put(num, votos.getOrDefault(num, 0L) + 1);
            }
        }

        return new SalaApresentadorEstadoResponse(
                sala.getCodigo(),
                sala.getNome(),
                sala.getStatus(),
                sala.getFaseRodada(),
                sala.getVersaoEstado(),
                sala.getPerguntaAtualIndex() + 1,
                perguntaAtual.getValorPremio(),
                sala.getPrazoFinal(),
                LocalDateTime.now(),
                perguntaAtual.getId(),
                perguntaAtual.getEnunciado(),
                perguntaAtual.getExplicacao(),
                alternativasDto,
                corretaNumero,
                totalConectados,
                totalAtivos,
                totalEliminados,
                totalRespostas,
                votos,
                participantes
        );
    }

    private SalaJogadorEstadoResponse montarEstadoJogador(Sala sala, Partida partida) {
        boolean eliminado = partida.getStatus() == StatusPartida.ELIMINADO;
        int nivelAtual = sala.getStatus() == StatusSala.AGUARDANDO ? 0 : sala.getPerguntaAtualIndex() + 1;
        long premioAcumulado = partida.getPontuacaoFinal();

        if (sala.getStatus() == StatusSala.AGUARDANDO) {
            return new SalaJogadorEstadoResponse(
                    sala.getCodigo(),
                    sala.getNome(),
                    sala.getStatus(),
                    sala.getFaseRodada(),
                    sala.getVersaoEstado(),
                    0,
                    0L,
                    0L,
                    null,
                    LocalDateTime.now(),
                    4,
                    List.of(1, 2, 3, 4),
                    false,
                    null,
                    false,
                    null,
                    null,
                    null,
                    "Aguardando o apresentador iniciar o show...",
                    partida.getNomeJogador()
            );
        }

        Pergunta perguntaAtual = obterPerguntaAtual(sala);
        Optional<RespostaPartida> optResp = respostaPartidaRepository.findByPartidaAndPergunta(partida, perguntaAtual);

        boolean jaRespondeu = optResp.isPresent();
        Integer escolhido = optResp.map(r -> r.getAlternativaEscolhida() != null ? r.getAlternativaEscolhida().getNumero() : null).orElse(null);

        // Gabarito e feedback de acerto só chegam DEPOIS que o apresentador revela
        Boolean acertouUltima = null;
        Integer corretaNumero = null;
        String explicacao = null;

        if (sala.getFaseRodada() == FaseRodada.REVELACAO || sala.getFaseRodada() == FaseRodada.FINAL) {
            acertouUltima = optResp.map(RespostaPartida::isAcertou).orElse(false);
            corretaNumero = perguntaAtual.getAlternativas().stream()
                    .filter(Alternativa::isCorreta)
                    .map(Alternativa::getNumero)
                    .findFirst()
                    .orElse(1);
            explicacao = perguntaAtual.getExplicacao();
        }

        String mensagemStatus;
        if (eliminado) {
            mensagemStatus = "Você errou ou o tempo esgotou! Perdeu tudo. Acompanhe a viagem pelo telão!";
        } else if (jaRespondeu && sala.getFaseRodada() == FaseRodada.PERGUNTA) {
            mensagemStatus = "Resposta enviada! Olhe para o telão para conferir o resultado.";
        } else if (sala.getFaseRodada() == FaseRodada.FINAL) {
            mensagemStatus = partida.getStatus() == StatusPartida.VITORIA
                    ? "Parabéns! Você conquistou o prêmio máximo de 1 MILHÃO!"
                    : "Partida finalizada! Confira o pódio final no telão.";
        } else {
            mensagemStatus = "Toque no símbolo correspondente à alternativa que você vê no telão.";
        }

        return new SalaJogadorEstadoResponse(
                sala.getCodigo(),
                sala.getNome(),
                sala.getStatus(),
                sala.getFaseRodada(),
                sala.getVersaoEstado(),
                nivelAtual,
                perguntaAtual.getValorPremio(),
                premioAcumulado,
                sala.getPrazoFinal(),
                LocalDateTime.now(),
                4,
                List.of(1, 2, 3, 4),
                jaRespondeu,
                escolhido,
                eliminado,
                acertouUltima,
                corretaNumero,
                explicacao,
                mensagemStatus,
                partida.getNomeJogador()
        );
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

    public List<SalaPergunta> listarPerguntasDaSala(String codigo) {
        Sala sala = obterSalaAtiva(codigo);
        return new ArrayList<>(sala.getPerguntas());
    }

    @Transactional
    public SalaResponse adicionarPerguntaPersonalizada(String codigo, Long apresentadorId, PerguntaRequest request) {
        Sala sala = obterSalaAtiva(codigo);
        validarDonoSala(sala, apresentadorId);

        if (sala.getStatus() != StatusSala.AGUARDANDO) {
            throw new RegraNegocioException("Não é possível adicionar perguntas personalizadas em uma sala com jogo já iniciado ou finalizado.");
        }

        PerguntaAdminResponse adminResp = perguntaService.cadastrarPergunta(request);
        Pergunta novaPergunta = perguntaService.buscarPorId(adminResp.id());

        int proximaOrdem = sala.getPerguntas().size() + 1;
        sala.adicionarPergunta(novaPergunta, proximaOrdem);
        sala.incrementarVersao();
        sala = salaRepository.save(sala);

        return toDto(sala);
    }

    public SalaResponse toDto(Sala sala) {
        String apresentadorNome = (sala.getApresentador() != null && sala.getApresentador().getNome() != null)
                ? sala.getApresentador().getNome()
                : "CPTM";

        return new SalaResponse(
                sala.getId(),
                sala.getCodigo(),
                sala.getNome(),
                apresentadorNome,
                sala.isAtiva(),
                sala.getStatus(),
                sala.getFaseRodada(),
                sala.getPerguntaAtualIndex(),
                sala.getCriadaEm()
        );
    }
}
