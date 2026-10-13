package com.cptm.showdotrilhao;

import com.cptm.showdotrilhao.dto.request.CriarSalaRequest;
import com.cptm.showdotrilhao.dto.request.LoginRequest;
import com.cptm.showdotrilhao.dto.request.RegisterRequest;
import com.cptm.showdotrilhao.dto.request.ResponderPerguntaRequest;
import com.cptm.showdotrilhao.dto.response.PartidaStatusResponse;
import com.cptm.showdotrilhao.dto.response.ResultadoRespostaResponse;
import com.cptm.showdotrilhao.dto.response.SalaResponse;
import com.cptm.showdotrilhao.dto.response.TokenResponse;
import com.cptm.showdotrilhao.exception.RegraNegocioException;
import com.cptm.showdotrilhao.model.Alternativa;
import com.cptm.showdotrilhao.model.Pergunta;
import com.cptm.showdotrilhao.model.enums.Role;
import com.cptm.showdotrilhao.model.enums.StatusPartida;
import com.cptm.showdotrilhao.repository.PerguntaRepository;
import com.cptm.showdotrilhao.service.AuthService;
import com.cptm.showdotrilhao.service.PartidaService;
import com.cptm.showdotrilhao.service.RankingService;
import com.cptm.showdotrilhao.service.SalaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class ShowDoTrilhaoApplicationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private SalaService salaService;

    @Autowired
    private PartidaService partidaService;

    @Autowired
    private RankingService rankingService;

    @Autowired
    private PerguntaRepository perguntaRepository;

    @Test
    @DisplayName("Contexto do Spring inicializa corretamente")
    void contextLoads() {
        assertNotNull(authService);
        assertNotNull(salaService);
        assertNotNull(partidaService);
    }

    @Test
    @DisplayName("Cadastro público impede criação de usuário ADMIN")
    void testCadastroNaoPermiteAdmin() {
        RegisterRequest request = new RegisterRequest("Tentativa Admin", "hacker@teste.com", "senha123", Role.ROLE_ADMIN);
        assertThrows(RegraNegocioException.class, () -> authService.register(request));
    }

    @Test
    @DisplayName("Cadastro e login de Jogador funcionam com hash BCrypt e geração de JWT")
    void testCadastroELoginJogador() {
        String email = "jogador.teste." + System.currentTimeMillis() + "@cptm.sp.gov.br";
        RegisterRequest registerReq = new RegisterRequest("Carlos Maquinista", email, "senhaForte123", Role.ROLE_JOGADOR);
        TokenResponse registerResp = authService.register(registerReq);

        assertNotNull(registerResp);
        assertNotNull(registerResp.token());
        assertEquals("Carlos Maquinista", registerResp.nome());
        assertEquals(Role.ROLE_JOGADOR, registerResp.role());

        // Login
        LoginRequest loginReq = new LoginRequest(email, "senhaForte123");
        TokenResponse loginResp = authService.login(loginReq);

        assertNotNull(loginResp);
        assertNotNull(loginResp.token());
        assertEquals(registerResp.id(), loginResp.id());
    }

    @Test
    @DisplayName("Apresentador cria sala e visitante consegue entrar pelo código")
    void testCriarSalaEEntrarVisitante() {
        // Criar apresentador
        String email = "apresentador." + System.currentTimeMillis() + "@cptm.sp.gov.br";
        TokenResponse apresentador = authService.register(
                new RegisterRequest("Mestre dos Trilhos", email, "segredo123", Role.ROLE_APRESENTADOR)
        );

        // Criar sala
        SalaResponse sala = salaService.criarSala(new CriarSalaRequest("Sala Expresso Aeroporto"), apresentador.id());
        assertNotNull(sala);
        assertNotNull(sala.codigo());
        assertTrue(sala.codigo().startsWith("CPTM-"));
        assertTrue(sala.ativa());

        // Visitante inicia partida
        PartidaStatusResponse partida = partidaService.iniciarPartidaVisitante(sala.codigo(), "Passageiro Luz");
        assertNotNull(partida);
        assertNotNull(partida.id());
        assertEquals("Passageiro Luz", partida.jogadorNome());
        assertEquals(StatusPartida.EM_ANDAMENTO, partida.status());
        assertNotNull(partida.perguntaAtual());
    }

    @Test
    @DisplayName("Garante que as 10 perguntas sorteadas para a partida não se repetem")
    void testPerguntasNaoSeRepetemNaPartida() {
        PartidaStatusResponse partida = partidaService.iniciarPartidaVisitante("CPTM-2026", "Visitante Unicidade");
        assertNotNull(partida);

        com.cptm.showdotrilhao.model.Partida partidaEntidade = partidaService.buscarPorId(partida.id());
        assertEquals(10, partidaEntidade.getPerguntas().size());

        Set<Long> idsPerguntas = new HashSet<>();
        for (var pp : partidaEntidade.getPerguntas()) {
            boolean adicionou = idsPerguntas.add(pp.getPergunta().getId());
            assertTrue(adicionou, "Pergunta repetida encontrada na mesma partida: id " + pp.getPergunta().getId());
        }
        assertEquals(10, idsPerguntas.size());
    }

    @Test
    @DisplayName("Regra de derrota: Errar pergunta elimina o jogador e pontuação final é 0 (perde tudo)")
    void testErrarPerguntaPerdeTudo() {
        PartidaStatusResponse partida = partidaService.iniciarPartidaVisitante("CPTM-2026", "Jogador Erro");
        Long partidaId = partida.id();
        Pergunta p1 = perguntaRepository.findById(partida.perguntaAtual().id()).orElseThrow();

        // Encontra alternativa incorreta
        Alternativa incorreta = p1.getAlternativas().stream()
                .filter(a -> !a.isCorreta())
                .findFirst()
                .orElseThrow();

        ResponderPerguntaRequest req = new ResponderPerguntaRequest(incorreta.getId(), p1.getId(), false);
        ResultadoRespostaResponse resultado = partidaService.responderPergunta(partidaId, req, null);

        assertFalse(resultado.acertou());
        assertEquals(StatusPartida.ELIMINADO, resultado.statusPartida());
        assertEquals(0L, resultado.pontuacaoAtual(), "Regra violada: pontuação ao errar deve ser 0 (perde tudo)");

        PartidaStatusResponse statusFinal = partidaService.buscarStatus(partidaId);
        assertEquals(StatusPartida.ELIMINADO, statusFinal.status());
        assertEquals(0L, statusFinal.pontuacaoFinal(), "Regra violada: pontuação final da partida deve ser 0");
    }

    @Test
    @DisplayName("Regra de abandono: Abandonar a partida finaliza com status ABANDONADA e pontuação 0")
    void testAbandonarPartidaPerdeTudo() {
        PartidaStatusResponse partida = partidaService.iniciarPartidaVisitante("CPTM-2026", "Jogador Desistente");
        PartidaStatusResponse abandonada = partidaService.abandonarPartida(partida.id());

        assertEquals(StatusPartida.ABANDONADA, abandonada.status());
        assertEquals(0L, abandonada.pontuacaoFinal(), "Regra violada: abandono deve zerar pontuação");
    }

    @Test
    @DisplayName("Fluxo completo de vitória: Acertar as 10 perguntas conquista R$ 1.000.000")
    void testVitoriaTotal1Milhao() {
        PartidaStatusResponse partida = partidaService.iniciarPartidaVisitante("CPTM-2026", "Mestre Ferroviário");
        Long partidaId = partida.id();

        for (int etapa = 0; etapa < 10; etapa++) {
            PartidaStatusResponse statusAtual = partidaService.buscarStatus(partidaId);
            Long perguntaId = statusAtual.perguntaAtual().id();
            Pergunta p = perguntaRepository.findById(perguntaId).orElseThrow();

            Alternativa correta = p.getAlternativas().stream()
                    .filter(Alternativa::isCorreta)
                    .findFirst()
                    .orElseThrow();

            ResponderPerguntaRequest req = new ResponderPerguntaRequest(correta.getId(), perguntaId, false);
            ResultadoRespostaResponse resp = partidaService.responderPergunta(partidaId, req, null);

            assertTrue(resp.acertou());
            if (etapa == 9) {
                // Última pergunta
                assertEquals(StatusPartida.VITORIA, resp.statusPartida());
                assertEquals(1000000L, resp.pontuacaoAtual());
            } else {
                assertEquals(StatusPartida.EM_ANDAMENTO, resp.statusPartida());
            }
        }

        PartidaStatusResponse statusFinal = partidaService.buscarStatus(partidaId);
        assertEquals(StatusPartida.VITORIA, statusFinal.status());
        assertEquals(1000000L, statusFinal.pontuacaoFinal());
        assertEquals(10, statusFinal.nivelAlcancado());
    }

    @Test
    @DisplayName("Consulta de Rankings (Geral e Sala) retorna sem erros")
    void testRankings() {
        var rankingGeral = rankingService.obterRankingGeral();
        assertNotNull(rankingGeral);

        var rankingSala = rankingService.obterRankingSala("CPTM-2026");
        assertNotNull(rankingSala);
    }
}
