package com.cptm.showdotrilhao.service;

import com.cptm.showdotrilhao.dto.request.ResponderPerguntaRequest;
import com.cptm.showdotrilhao.dto.response.PartidaStatusResponse;
import com.cptm.showdotrilhao.dto.response.PerguntaResponse;
import com.cptm.showdotrilhao.dto.response.ResultadoRespostaResponse;
import com.cptm.showdotrilhao.exception.RegraNegocioException;
import com.cptm.showdotrilhao.exception.ResourceNotFoundException;
import com.cptm.showdotrilhao.model.*;
import com.cptm.showdotrilhao.model.enums.StatusPartida;
import com.cptm.showdotrilhao.repository.PartidaRepository;
import com.cptm.showdotrilhao.repository.PerguntaRepository;
import com.cptm.showdotrilhao.repository.RespostaPartidaRepository;
import com.cptm.showdotrilhao.repository.SalaRepository;
import com.cptm.showdotrilhao.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PartidaService {

    private final PartidaRepository partidaRepository;
    private final SalaRepository salaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PerguntaRepository perguntaRepository;
    private final RespostaPartidaRepository respostaPartidaRepository;
    private final PerguntaService perguntaService;

    public PartidaService(PartidaRepository partidaRepository,
                          SalaRepository salaRepository,
                          UsuarioRepository usuarioRepository,
                          PerguntaRepository perguntaRepository,
                          RespostaPartidaRepository respostaPartidaRepository,
                          PerguntaService perguntaService) {
        this.partidaRepository = partidaRepository;
        this.salaRepository = salaRepository;
        this.usuarioRepository = usuarioRepository;
        this.perguntaRepository = perguntaRepository;
        this.respostaPartidaRepository = respostaPartidaRepository;
        this.perguntaService = perguntaService;
    }

    @Transactional
    public PartidaStatusResponse iniciarPartidaJogador(String codigoSala, Long usuarioId) {
        Sala sala = validarSala(codigoSala);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        return criarPartidaInterna(sala, usuario, null);
    }

    @Transactional
    public PartidaStatusResponse iniciarPartidaVisitante(String codigoSala, String nomeVisitante) {
        Sala sala = validarSala(codigoSala);
        if (nomeVisitante == null || nomeVisitante.trim().length() < 2) {
            throw new RegraNegocioException("Por favor, informe seu nome ou apelido para jogar.");
        }

        return criarPartidaInterna(sala, null, nomeVisitante.trim());
    }

    private PartidaStatusResponse criarPartidaInterna(Sala sala, Usuario usuario, String nomeVisitante) {
        // Sorteia exatamente 10 perguntas sem repetição, em dificuldade crescente (1 a 10)
        List<Pergunta> perguntas = perguntaService.sortearPerguntasPartida();
        String perguntasIds = perguntas.stream()
                .map(p -> String.valueOf(p.getId()))
                .collect(Collectors.joining(","));

        Partida partida = new Partida(sala, usuario, nomeVisitante, perguntasIds);
        for (int i = 0; i < perguntas.size(); i++) {
            Pergunta p = perguntas.get(i);
            partida.adicionarPergunta(p, i + 1, p.getNivelDificuldade());
        }

        partida = partidaRepository.save(partida);

        Pergunta primeiraPergunta = perguntas.get(0);
        PerguntaResponse perguntaDto = perguntaService.toPlayerDto(primeiraPergunta, 0);

        return toStatusDto(partida, perguntaDto);
    }

    public PartidaStatusResponse buscarStatus(Long partidaId) {
        Partida partida = buscarPorId(partidaId);
        PerguntaResponse perguntaDto = null;

        if (partida.getStatus() == StatusPartida.EM_ANDAMENTO) {
            Pergunta perguntaAtual = obterPerguntaNaOrdem(partida, partida.getPerguntaAtualIndex());
            if (perguntaAtual != null) {
                perguntaDto = perguntaService.toPlayerDto(perguntaAtual, partida.getPerguntaAtualIndex());
            }
        }

        return toStatusDto(partida, perguntaDto);
    }

    @Transactional
    public ResultadoRespostaResponse responderPergunta(Long partidaId, ResponderPerguntaRequest request, Long usuarioIdAutenticado) {
        Partida partida = buscarPorId(partidaId);

        // 1. Validação de partida ativa
        if (partida.getStatus() != StatusPartida.EM_ANDAMENTO) {
            throw new RegraNegocioException("Esta partida já foi encerrada com o status: " + partida.getStatus() + ". Não é permitido responder novamente.");
        }

        // 2. Validação de propriedade do jogador logado (se houver)
        if (partida.getUsuario() != null && usuarioIdAutenticado != null) {
            if (!partida.getUsuario().getId().equals(usuarioIdAutenticado)) {
                throw new RegraNegocioException("Esta partida não pertence ao jogador autenticado.");
            }
        }

        int indexAtual = partida.getPerguntaAtualIndex();
        Pergunta pergunta = obterPerguntaNaOrdem(partida, indexAtual);
        if (pergunta == null) {
            throw new ResourceNotFoundException("Pergunta atual não encontrada para a partida.");
        }

        // 3. Validação da pergunta enviada vs pergunta atual esperada pelo backend
        if (request.perguntaId() != null && !request.perguntaId().equals(pergunta.getId())) {
            throw new RegraNegocioException("A pergunta respondida não corresponde à pergunta atual da partida.");
        }

        Alternativa altCorreta = pergunta.getAlternativas().stream()
                .filter(Alternativa::isCorreta)
                .findFirst()
                .orElseThrow(() -> new RegraNegocioException("Gabarito da pergunta não encontrado."));

        // CASO A: Tempo esgotado ou nenhuma alternativa selecionada
        if (request.tempoEsgotado() || request.alternativaId() == null) {
            respostaPartidaRepository.save(new RespostaPartida(partida, pergunta, null, false, true));
            
            partida.setStatus(StatusPartida.ELIMINADO);
            partida.setFinalizadaEm(LocalDateTime.now());
            int acertos = indexAtual; // Quantas perguntas foram acertadas antes desta
            long premioAcumulado = obterPremioAcumuladoAte(partida, acertos);
            partida.setNivelAlcancado(acertos);
            partida.setPontuacaoFinal(premioAcumulado);
            partidaRepository.save(partida);

            return new ResultadoRespostaResponse(
                    false,
                    altCorreta.getNumero(),
                    altCorreta.getTexto(),
                    pergunta.getExplicacao(),
                    StatusPartida.ELIMINADO,
                    acertos,
                    premioAcumulado,
                    null,
                    "Não foi dessa vez, você errou"
            );
        }

        // CASO B: Alternativa selecionada pelo jogador
        Alternativa altEscolhida = pergunta.getAlternativas().stream()
                .filter(a -> a.getId().equals(request.alternativaId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Alternativa escolhida não pertence a esta pergunta."));

        boolean acertou = altEscolhida.isCorreta();
        respostaPartidaRepository.save(new RespostaPartida(partida, pergunta, altEscolhida, acertou, false));

        // CASO C: Resposta INCORRETA (Fim de jogo imediato por derrota)
        if (!acertou) {
            partida.setStatus(StatusPartida.ELIMINADO);
            partida.setFinalizadaEm(LocalDateTime.now());
            int acertos = indexAtual; // Quantas perguntas acertou antes de errar
            long premioAcumulado = obterPremioAcumuladoAte(partida, acertos);
            partida.setNivelAlcancado(acertos);
            partida.setPontuacaoFinal(premioAcumulado);
            partidaRepository.save(partida);

            return new ResultadoRespostaResponse(
                    false,
                    altCorreta.getNumero(),
                    altCorreta.getTexto(),
                    pergunta.getExplicacao(),
                    StatusPartida.ELIMINADO,
                    acertos,
                    premioAcumulado,
                    null,
                    "Não foi dessa vez, você errou"
            );
        }

        // CASO D: Resposta CORRETA!
        int proximoIndex = indexAtual + 1;
        partida.setNivelAlcancado(proximoIndex);

        if (proximoIndex >= 10) {
            // Acertou as 10 perguntas: VITÓRIA TOTAL! R$ 1.000.000
            partida.setStatus(StatusPartida.VITORIA);
            partida.setPontuacaoFinal(1000000L);
            partida.setFinalizadaEm(LocalDateTime.now());
            partidaRepository.save(partida);

            return new ResultadoRespostaResponse(
                    true,
                    altCorreta.getNumero(),
                    altCorreta.getTexto(),
                    pergunta.getExplicacao(),
                    StatusPartida.VITORIA,
                    10,
                    1000000L,
                    null,
                    "Vocês ganharam 1 Milhão de oportunidades para conhecer e explorar a ferrovia"
            );
        }

        // Continua para o próximo nível
        partida.setPerguntaAtualIndex(proximoIndex);
        partida.setPontuacaoFinal(pergunta.getValorPremio());
        partidaRepository.save(partida);

        Pergunta proximaPergunta = obterPerguntaNaOrdem(partida, proximoIndex);
        PerguntaResponse proximaDto = perguntaService.toPlayerDto(proximaPergunta, proximoIndex);

        return new ResultadoRespostaResponse(
                true,
                altCorreta.getNumero(),
                altCorreta.getTexto(),
                pergunta.getExplicacao(),
                StatusPartida.EM_ANDAMENTO,
                proximoIndex,
                pergunta.getValorPremio(),
                proximaDto,
                "Certa resposta! Rumo ao 1 milhão na CPTM!"
        );
    }

    @Transactional
    public PartidaStatusResponse abandonarPartida(Long partidaId) {
        Partida partida = buscarPorId(partidaId);

        if (partida.getStatus() != StatusPartida.EM_ANDAMENTO) {
            throw new RegraNegocioException("Esta partida já está finalizada.");
        }

        partida.setStatus(StatusPartida.ABANDONADA);
        partida.setPontuacaoFinal(0);
        partida.setFinalizadaEm(LocalDateTime.now());
        partida = partidaRepository.save(partida);

        return toStatusDto(partida, null);
    }

    public Partida buscarPorId(Long id) {
        return partidaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partida não encontrada com id: " + id));
    }

    private Pergunta obterPerguntaNaOrdem(Partida partida, int indexOrdem) {
        if (partida.getPerguntas() != null && !partida.getPerguntas().isEmpty()) {
            if (indexOrdem < partida.getPerguntas().size()) {
                return partida.getPerguntas().get(indexOrdem).getPergunta();
            }
        }

        // Fallback por IDs string para compatibilidade
        List<Long> ids = parseIds(partida.getPerguntasIds());
        if (indexOrdem < ids.size()) {
            Long perguntaId = ids.get(indexOrdem);
            return perguntaService.buscarPorId(perguntaId);
        }

        return null;
    }

    private long obterPremioAcumuladoAte(Partida partida, int acertos) {
        if (acertos <= 0) {
            return 0L;
        }
        Pergunta p = obterPerguntaNaOrdem(partida, acertos - 1);
        return p != null ? p.getValorPremio() : 0L;
    }

    private Sala validarSala(String codigoSala) {
        Sala sala = salaRepository.findByCodigo(codigoSala.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Sala não encontrada com o código: " + codigoSala));

        if (!sala.isAtiva()) {
            throw new RegraNegocioException("Esta sala está inativa no momento. Consulte o apresentador.");
        }
        return sala;
    }

    private List<Long> parseIds(String idsStr) {
        return Arrays.stream(idsStr.split(","))
                .map(String::trim)
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }

    private PartidaStatusResponse toStatusDto(Partida p, PerguntaResponse perguntaAtual) {
        return new PartidaStatusResponse(
                p.getId(),
                p.getSala().getCodigo(),
                p.getSala().getNome(),
                p.getNomeJogador(),
                p.getStatus(),
                p.getNivelAlcancado(),
                p.getPontuacaoFinal(),
                p.getPerguntaAtualIndex(),
                p.getIniciadaEm(),
                p.getFinalizadaEm(),
                perguntaAtual
        );
    }
}
