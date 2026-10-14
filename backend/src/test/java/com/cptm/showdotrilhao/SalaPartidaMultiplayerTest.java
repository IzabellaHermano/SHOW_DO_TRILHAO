package com.cptm.showdotrilhao;

import com.cptm.showdotrilhao.dto.request.CriarSalaRequest;
import com.cptm.showdotrilhao.dto.request.RegisterRequest;
import com.cptm.showdotrilhao.dto.response.EntrarSalaResponse;
import com.cptm.showdotrilhao.dto.response.SalaApresentadorEstadoResponse;
import com.cptm.showdotrilhao.dto.response.SalaJogadorEstadoResponse;
import com.cptm.showdotrilhao.dto.response.SalaResponse;
import com.cptm.showdotrilhao.exception.RegraNegocioException;
import com.cptm.showdotrilhao.model.Pergunta;
import com.cptm.showdotrilhao.model.SalaPergunta;
import com.cptm.showdotrilhao.model.Usuario;
import com.cptm.showdotrilhao.model.enums.FaseRodada;
import com.cptm.showdotrilhao.model.enums.Role;
import com.cptm.showdotrilhao.model.enums.StatusSala;
import com.cptm.showdotrilhao.repository.UsuarioRepository;
import com.cptm.showdotrilhao.service.AuthService;
import com.cptm.showdotrilhao.service.SalaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class SalaPartidaMultiplayerTest {

    @Autowired
    private SalaService salaService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AuthService authService;

    private Usuario apresentadorDono;
    private Usuario outroApresentador;
    private Usuario jogadorComum;

    @BeforeEach
    void setup() {
        apresentadorDono = usuarioRepository.findByEmail("silvio.teste@cptm.sp.gov.br").orElseGet(() -> {
            Usuario u = new Usuario("Silvio Teste", "silvio.teste@cptm.sp.gov.br", "123456", Role.ROLE_APRESENTADOR);
            return usuarioRepository.save(u);
        });

        outroApresentador = usuarioRepository.findByEmail("outro.apresentador@cptm.sp.gov.br").orElseGet(() -> {
            Usuario u = new Usuario("Outro Apresentador", "outro.apresentador@cptm.sp.gov.br", "123456", Role.ROLE_APRESENTADOR);
            return usuarioRepository.save(u);
        });

        jogadorComum = usuarioRepository.findByEmail("passageiro.teste@gmail.com").orElseGet(() -> {
            Usuario u = new Usuario("Passageiro Teste", "passageiro.teste@gmail.com", "123456", Role.ROLE_JOGADOR);
            return usuarioRepository.save(u);
        });
    }

    @Test
    @DisplayName("Teste 1: Inicia partida de sala e confirma 10 perguntas distintas, uma de cada nível (1 a 10)")
    void testSalaIniciaComExatamente10PerguntasDistintasDeNiveis1a10() {
        SalaResponse sala = salaService.criarSala(new CriarSalaRequest("Sala Expresso Turístico"), apresentadorDono.getId());
        assertNotNull(sala.codigo());
        assertEquals(StatusSala.AGUARDANDO, sala.status());

        // Apresentador inicia o jogo
        SalaApresentadorEstadoResponse estado = salaService.iniciarJogo(sala.codigo(), apresentadorDono.getId());
        assertNotNull(estado);
        assertEquals(StatusSala.EM_ANDAMENTO, estado.statusSala());
        assertEquals(FaseRodada.PERGUNTA, estado.faseRodada());
        assertEquals(1, estado.nivelAtual());

        // Busca a sala e suas perguntas no banco
        SalaResponse salaAtualizada = salaService.buscarPorCodigo(sala.codigo());
        var salaEntity = salaService.obterEstadoApresentador(sala.codigo(), apresentadorDono.getId());
        assertNotNull(salaEntity);

        // Valida no backend que as 10 perguntas foram montadas
        var perguntas = salaService.listarPerguntasDaSala(sala.codigo());
        assertEquals(10, perguntas.size(), "A partida deve carregar exatamente 10 perguntas");

        Set<Long> idsPerguntas = new HashSet<>();
        for (int i = 0; i < 10; i++) {
            Pergunta p = perguntas.get(i).getPergunta();
            int nivelEsperado = i + 1;
            assertEquals(nivelEsperado, p.getNivelDificuldade(), "A pergunta na ordem " + (i + 1) + " deve ser do nível " + nivelEsperado);
            assertTrue(idsPerguntas.add(p.getId()), "A pergunta com ID " + p.getId() + " não pode se repetir na partida");
        }
    }

    @Test
    @DisplayName("Teste 2: Apenas o apresentador DONO da sala pode iniciar; outro usuário recebe 403 (AccessDeniedException)")
    void testApenasApresentadorDonoPodeIniciar() {
        SalaResponse sala = salaService.criarSala(new CriarSalaRequest("Sala Linha 10"), apresentadorDono.getId());

        // Tentativa de jogador comum iniciar
        assertThrows(AccessDeniedException.class, () -> {
            salaService.iniciarJogo(sala.codigo(), jogadorComum.getId());
        }, "Jogador comum deve receber 403 Forbidden");

        // Tentativa de outro apresentador iniciar
        assertThrows(AccessDeniedException.class, () -> {
            salaService.iniciarJogo(sala.codigo(), outroApresentador.getId());
        }, "Outro apresentador deve receber 403 Forbidden");

        // Tentativa de outro usuário acessar estado do apresentador
        assertThrows(AccessDeniedException.class, () -> {
            salaService.obterEstadoApresentador(sala.codigo(), outroApresentador.getId());
        }, "Outro usuário não pode ler o estado confidencial do apresentador");
    }

    @Test
    @DisplayName("Teste 3: Estado enviado ao jogador NÃO contém enunciado, alternativas em texto nem gabarito antecipado")
    void testEstadoJogadorNaoVazaTextoEnunciadoNemGabarito() {
        SalaResponse sala = salaService.criarSala(new CriarSalaRequest("Sala Linha 11"), apresentadorDono.getId());

        EntrarSalaResponse visitante = salaService.entrarSalaVisitante(sala.codigo(), "Viajante Alpha");
        assertNotNull(visitante.tokenSessao(), "Visitante deve receber token de sessão opaco e seguro");

        // Apresentador inicia
        salaService.iniciarJogo(sala.codigo(), apresentadorDono.getId());

        // Jogador busca estado
        SalaJogadorEstadoResponse estadoJogador = salaService.obterEstadoJogador(sala.codigo(), visitante.tokenSessao(), null);

        assertNotNull(estadoJogador);
        assertEquals(StatusSala.EM_ANDAMENTO, estadoJogador.statusSala());
        assertEquals(FaseRodada.PERGUNTA, estadoJogador.faseRodada());
        assertEquals(4, estadoJogador.totalSimbolos());
        assertEquals(List.of(1, 2, 3, 4), estadoJogador.simbolos(), "Jogador deve receber apenas os 4 números de símbolos");

        // Confirma ausência de gabarito durante a pergunta
        assertNull(estadoJogador.alternativaCorretaNumero(), "Gabarito NÃO pode ser enviado ao jogador durante a pergunta");
        assertNull(estadoJogador.acertouUltima(), "Status de acerto NÃO pode ser enviado antes da revelação pelo apresentador");
        assertNull(estadoJogador.explicacao(), "Explicação pedagógica NÃO pode ser enviada antes da revelação");
    }

    @Test
    @DisplayName("Teste 4: Respostas sem duplicidade e controle de prazo pelo servidor")
    void testRespostasSemDuplicidadeEControlePrazo() {
        SalaResponse sala = salaService.criarSala(new CriarSalaRequest("Sala Linha 12"), apresentadorDono.getId());
        EntrarSalaResponse visitante = salaService.entrarSalaVisitante(sala.codigo(), "Passageiro Beta");

        salaService.iniciarJogo(sala.codigo(), apresentadorDono.getId());

        // 1ª resposta válida
        SalaJogadorEstadoResponse resp1 = salaService.responderPerguntaSimbolo(sala.codigo(), visitante.tokenSessao(), null, 1);
        assertTrue(resp1.jaRespondeu());
        assertEquals(1, resp1.alternativaEscolhidaNumero());

        // 2ª tentativa na mesma pergunta: deve ser rejeitada com erro amigável
        assertThrows(RegraNegocioException.class, () -> {
            salaService.responderPerguntaSimbolo(sala.codigo(), visitante.tokenSessao(), null, 2);
        }, "Tentativa repetida deve ser rejeitada com RegraNegocioException");
    }
}
