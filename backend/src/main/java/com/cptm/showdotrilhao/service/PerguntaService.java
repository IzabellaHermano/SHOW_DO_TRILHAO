package com.cptm.showdotrilhao.service;

import com.cptm.showdotrilhao.dto.request.AlternativaRequest;
import com.cptm.showdotrilhao.dto.request.PerguntaRequest;
import com.cptm.showdotrilhao.dto.response.AlternativaResponse;
import com.cptm.showdotrilhao.dto.response.PerguntaAdminResponse;
import com.cptm.showdotrilhao.dto.response.PerguntaResponse;
import com.cptm.showdotrilhao.exception.RegraNegocioException;
import com.cptm.showdotrilhao.exception.ResourceNotFoundException;
import com.cptm.showdotrilhao.model.Alternativa;
import com.cptm.showdotrilhao.model.Pergunta;
import com.cptm.showdotrilhao.repository.PerguntaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PerguntaService {

    private final PerguntaRepository perguntaRepository;
    private final Random random = new Random();

    public PerguntaService(PerguntaRepository perguntaRepository) {
        this.perguntaRepository = perguntaRepository;
    }

    /**
     * Sorteia exatamente 10 perguntas únicas em ordem crescente de dificuldade (níveis 1 a 10).
     * Nenhuma pergunta pode se repetir na mesma partida.
     */
    public List<Pergunta> sortearPerguntasPartida() {
        List<Pergunta> selecionadas = new ArrayList<>();
        Set<Long> idsUsados = new HashSet<>();

        for (int nivel = 1; nivel <= 10; nivel++) {
            List<Pergunta> candidatas = perguntaRepository.findByNivelDificuldade(nivel);
            
            // Garante que a pergunta sorteada não foi usada anteriormente na mesma partida
            List<Pergunta> disponiveis = candidatas.stream()
                    .filter(p -> !idsUsados.contains(p.getId()))
                    .collect(Collectors.toList());

            if (disponiveis.isEmpty()) {
                throw new RegraNegocioException(String.format(
                        "Não há perguntas suficientes cadastradas para o nível %d da partida. " +
                        "Cadastre ao menos 1 pergunta para cada nível (de 1 a 10) sem repetições.",
                        nivel
                ));
            }

            // Sorteia aleatoriamente entre as disponíveis do nível
            Pergunta sorteada = disponiveis.get(random.nextInt(disponiveis.size()));
            selecionadas.add(sorteada);
            idsUsados.add(sorteada.getId());
        }

        return selecionadas;
    }

    public Pergunta buscarPorId(Long id) {
        return perguntaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pergunta não encontrada com id: " + id));
    }

    public List<PerguntaAdminResponse> listarTodasAdmin() {
        return perguntaRepository.findAll()
                .stream()
                .sorted(Comparator.comparingInt(Pergunta::getNivelDificuldade))
                .map(this::toAdminDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PerguntaAdminResponse cadastrarPergunta(PerguntaRequest request) {
        long certas = request.alternativas().stream().filter(AlternativaRequest::correta).count();
        if (certas != 1) {
            throw new RegraNegocioException("A pergunta deve ter exatamente UMA alternativa correta (encontrado: " + certas + ").");
        }

        Pergunta pergunta = new Pergunta(
                request.enunciado().trim(),
                request.nivelDificuldade(),
                request.valorPremio(),
                request.explicacao() != null ? request.explicacao().trim() : null
        );

        for (AlternativaRequest altDto : request.alternativas()) {
            pergunta.adicionarAlternativa(new Alternativa(altDto.numero(), altDto.texto().trim(), altDto.correta()));
        }

        pergunta = perguntaRepository.save(pergunta);
        return toAdminDto(pergunta);
    }

    @Transactional
    public PerguntaAdminResponse atualizarPergunta(Long id, PerguntaRequest request) {
        Pergunta pergunta = buscarPorId(id);

        long certas = request.alternativas().stream().filter(AlternativaRequest::correta).count();
        if (certas != 1) {
            throw new RegraNegocioException("A pergunta deve ter exatamente UMA alternativa correta (encontrado: " + certas + ").");
        }

        pergunta.setEnunciado(request.enunciado().trim());
        pergunta.setNivelDificuldade(request.nivelDificuldade());
        pergunta.setValorPremio(request.valorPremio());
        pergunta.setExplicacao(request.explicacao() != null ? request.explicacao().trim() : null);

        pergunta.getAlternativas().clear();
        for (AlternativaRequest altDto : request.alternativas()) {
            pergunta.adicionarAlternativa(new Alternativa(altDto.numero(), altDto.texto().trim(), altDto.correta()));
        }

        pergunta = perguntaRepository.save(pergunta);
        return toAdminDto(pergunta);
    }

    @Transactional
    public void excluirPergunta(Long id) {
        Pergunta pergunta = buscarPorId(id);
        perguntaRepository.delete(pergunta);
    }

    public PerguntaResponse toPlayerDto(Pergunta p, int indexAtual) {
        List<AlternativaResponse> alts = p.getAlternativas()
                .stream()
                .map(a -> new AlternativaResponse(a.getId(), a.getNumero(), a.getTexto()))
                .collect(Collectors.toList());

        return new PerguntaResponse(
                p.getId(),
                p.getEnunciado(),
                p.getNivelDificuldade(),
                p.getValorPremio(),
                indexAtual + 1,
                10,
                alts
        );
    }

    public PerguntaAdminResponse toAdminDto(Pergunta p) {
        List<PerguntaAdminResponse.AlternativaAdminResponse> alts = p.getAlternativas()
                .stream()
                .map(a -> new PerguntaAdminResponse.AlternativaAdminResponse(a.getId(), a.getNumero(), a.getTexto(), a.isCorreta()))
                .collect(Collectors.toList());

        return new PerguntaAdminResponse(
                p.getId(),
                p.getEnunciado(),
                p.getNivelDificuldade(),
                p.getValorPremio(),
                p.getExplicacao(),
                alts
        );
    }
}
