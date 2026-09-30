package com.cptm.showdotrilhao.config;

import com.cptm.showdotrilhao.model.Alternativa;
import com.cptm.showdotrilhao.model.Pergunta;
import com.cptm.showdotrilhao.model.Sala;
import com.cptm.showdotrilhao.model.Usuario;
import com.cptm.showdotrilhao.model.enums.Role;
import com.cptm.showdotrilhao.repository.PerguntaRepository;
import com.cptm.showdotrilhao.repository.SalaRepository;
import com.cptm.showdotrilhao.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final SalaRepository salaRepository;
    private final PerguntaRepository perguntaRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository,
                           SalaRepository salaRepository,
                           PerguntaRepository perguntaRepository,
                           PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.salaRepository = salaRepository;
        this.perguntaRepository = perguntaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Seed do Usuário ADMIN (acesso exclusivo por seed inicial)
        Usuario admin = usuarioRepository.findByEmail("admin@cptm.sp.gov.br").orElseGet(() -> {
            Usuario u = new Usuario("Administrador CPTM", "admin@cptm.sp.gov.br", passwordEncoder.encode("Admin@CPTM2026"), Role.ROLE_ADMIN);
            return usuarioRepository.save(u);
        });

        // 2. Seed do Usuário APRESENTADOR oficial
        Usuario apresentador = usuarioRepository.findByEmail("apresentador@cptm.sp.gov.br").orElseGet(() -> {
            Usuario u = new Usuario("Silvio dos Trilhos", "apresentador@cptm.sp.gov.br", passwordEncoder.encode("Mestre@CPTM2026"), Role.ROLE_APRESENTADOR);
            return usuarioRepository.save(u);
        });

        // 3. Seed de Sala Inicial
        if (!salaRepository.existsByCodigo("CPTM-2026")) {
            Sala salaPadrao = new Sala("CPTM-2026", "Sala Oficial CPTM - Estação da Luz", apresentador);
            salaRepository.save(salaPadrao);
        }

        // 4. Seed de Perguntas Oficiais e Complementares
        if (perguntaRepository.count() == 0) {
            seedPerguntas();
        }
    }

    private void seedPerguntas() {
        // ==========================================
        // AS 10 PERGUNTAS OFICIAIS DOS SLIDES
        // ==========================================

        // Nível 1 - R$ 1.000
        criarPergunta(
                "A CPTM está ligada a qual secretaria?",
                1, 1000L,
                "A Companhia Paulista de Trens Metropolitanos é vinculada à Secretaria dos Transportes Metropolitanos do Estado de São Paulo.",
                List.of(
                        new Alternativa(1, "Secretaria de Mobilidade Urbana", false),
                        new Alternativa(2, "Secretaria de Infraestrutura", false),
                        new Alternativa(3, "Secretaria de Transportes Metropolitanos", true),
                        new Alternativa(4, "Secretaria de Logística", false)
                )
        );

        // Nível 2 - R$ 5.000
        criarPergunta(
                "Qual é o nome da Linha 10 da CPTM?",
                2, 5000L,
                "A Linha 10 da CPTM é denominada Turquesa, operando no eixo Sudeste (Brás/Barra Funda até Rio Grande da Serra).",
                List.of(
                        new Alternativa(1, "Turquesa", true),
                        new Alternativa(2, "Jade", false),
                        new Alternativa(3, "Coral", false),
                        new Alternativa(4, "Esmeralda", false)
                )
        );

        // Nível 3 - R$ 10.000
        criarPergunta(
                "Qual é o menor intervalo entre trens na Linha 10 - Turquesa?",
                3, 10000L,
                "O menor intervalo programado no horário de pico no trecho principal da Linha 10-Turquesa é de 6 minutos.",
                List.of(
                        new Alternativa(1, "6 min", true),
                        new Alternativa(2, "15 min", false),
                        new Alternativa(3, "10 min", false),
                        new Alternativa(4, "3 min", false)
                )
        );

        // Nível 4 - R$ 25.000
        criarPergunta(
                "Quantas pessoas a CPTM transporta por dia útil?",
                4, 25000L,
                "A CPTM chega a transportar diariamente mais de 2 milhões de passageiros, população superior à do estado de Sergipe.",
                List.of(
                        new Alternativa(1, "Um estado inteiro como Sergipe (~2,3 M)", true),
                        new Alternativa(2, "Um país como a Noruega (~5 M)", false),
                        new Alternativa(3, "Uma cidade pequena (~100 K)", false),
                        new Alternativa(4, "Uma capital como Porto Alegre (~1,5 M)", false)
                )
        );

        // Nível 5 - R$ 50.000
        criarPergunta(
                "Quantos passageiros por ano a CPTM transporta?",
                5, 5000L,
                "Anualmente, a rede de trens da CPTM atende a uma demanda média de cerca de 480 milhões de embarques.",
                List.of(
                        new Alternativa(1, "1 bilhão", false),
                        new Alternativa(2, "100 milhões", false),
                        new Alternativa(3, "300 milhões", false),
                        new Alternativa(4, "480 milhões", true)
                )
        );

        // Nível 6 - R$ 100.000
        criarPergunta(
                "Se somarmos todas as viagens da CPTM no dia, a que isso equivale?",
                6, 100000L,
                "Os trens da CPTM percorrem cerca de 65 mil km todos os dias úteis, o equivalente a dar mais de uma volta e meia ao redor da Terra!",
                List.of(
                        new Alternativa(1, "Dar a volta na Terra", true),
                        new Alternativa(2, "Ir e voltar da Lua", false),
                        new Alternativa(3, "Ir até a Lua", false),
                        new Alternativa(4, "Dar a volta no Brasil", false)
                )
        );

        // Nível 7 - R$ 200.000
        criarPergunta(
                "O índice de avaliação positiva do serviço da CPTM é de?",
                7, 200000L,
                "Em pesquisas de satisfação realizadas com passageiros, a avaliação positiva dos serviços prestados pela CPTM atinge cerca de 83%.",
                List.of(
                        new Alternativa(1, "95%", false),
                        new Alternativa(2, "63%", false),
                        new Alternativa(3, "70%", false),
                        new Alternativa(4, "83%", true)
                )
        );

        // Nível 8 - R$ 300.000
        criarPergunta(
                "Quem é o personagem mais famoso das redes sociais da CPTM?",
                8, 300000L,
                "O Zecaré é o mascote oficial e fenômeno nas redes sociais da CPTM, inspirado na peça ferroviária de cruzamento de trilhos (jacaré).",
                List.of(
                        new Alternativa(1, "Zecaré", true),
                        new Alternativa(2, "Thor", false),
                        new Alternativa(3, "Maquinista Max", false),
                        new Alternativa(4, "TremZinho", false)
                )
        );

        // Nível 9 - R$ 500.000
        criarPergunta(
                "Qual o tempo de trem entre o Centro e o Aeroporto (Expresso Aeroporto)?",
                9, 500000L,
                "O Expresso Aeroporto realiza o trajeto direto entre o Centro/Barra Funda e o Aeroporto Internacional de Guarulhos em cerca de 35 a 40 minutos.",
                List.of(
                        new Alternativa(1, "1h", false),
                        new Alternativa(2, "20 min", false),
                        new Alternativa(3, "2h", false),
                        new Alternativa(4, "40 min", true)
                )
        );

        // Nível 10 - R$ 1.000.000
        criarPergunta(
                "O Expresso Aeroporto passa por uma estrutura única no Brasil. Qual é ela?",
                10, 1000000L,
                "A Linha 13-Jade conta com uma ponte estaiada ferroviária em curva sobre as rodovias Ayrton Senna e Hélio Smidt, um marco da engenharia nacional.",
                List.of(
                        new Alternativa(1, "Uma ponte estaiada em curva", true),
                        new Alternativa(2, "Um túnel submerso", false),
                        new Alternativa(3, "Um trilho suspenso", false),
                        new Alternativa(4, "Um viaduto de dois andares", false)
                )
        );

        // ==========================================
        // PERGUNTAS TEMÁTICAS ADICIONAIS DA CPTM
        // ==========================================

        // Nível 1
        criarPergunta(
                "Qual o significado exato da sigla CPTM?",
                1, 1000L,
                "A CPTM significa Companhia Paulista de Trens Metropolitanos, operadora pública de transporte sobre trilhos do Estado de São Paulo.",
                List.of(
                        new Alternativa(1, "Companhia Paulista de Trens Metropolitanos", true),
                        new Alternativa(2, "Companhia de Transporte Público Metropolitano", false),
                        new Alternativa(3, "Consórcio Paulista de Trens Modernos", false),
                        new Alternativa(4, "Comissão Paulista de Transporte Municipal", false)
                )
        );

        criarPergunta(
                "Qual é a cor que representa a Linha 7 da CPTM?",
                1, 1000L,
                "A Linha 7 da CPTM é denominada Linha 7-Rubi, ligando a Estação Brás/Barra Funda a Francisco Morato e Jundiaí.",
                List.of(
                        new Alternativa(1, "Esmeralda", false),
                        new Alternativa(2, "Rubi", true),
                        new Alternativa(3, "Safira", false),
                        new Alternativa(4, "Coral", false)
                )
        );

        // Nível 2
        criarPergunta(
                "Qual linha da CPTM atende os municípios de Suzano e Mogi das Cruzes?",
                2, 5000L,
                "A Linha 11-Coral liga a Estação da Luz e Palmeiras-Barra Funda até Poá, Suzano e Mogi das Cruzes (Estudantes).",
                List.of(
                        new Alternativa(1, "Linha 10-Turquesa", false),
                        new Alternativa(2, "Linha 11-Coral", true),
                        new Alternativa(3, "Linha 13-Jade", false),
                        new Alternativa(4, "Linha 7-Rubi", false)
                )
        );

        criarPergunta(
                "Qual linha da CPTM é identificada pela cor Safira?",
                2, 5000L,
                "A Linha 12-Safira atende o extremo leste de São Paulo, ligando as estações Brás e Calmon Viana passando por Itaquaquecetuba.",
                List.of(
                        new Alternativa(1, "Linha 12", true),
                        new Alternativa(2, "Linha 10", false),
                        new Alternativa(3, "Linha 11", false),
                        new Alternativa(4, "Linha 13", false)
                )
        );

        // Nível 3
        criarPergunta(
                "Qual icônica estação da CPTM no centro de São Paulo abriga o Museu da Língua Portuguesa?",
                3, 10000L,
                "A Estação da Luz, monumento histórico tombado, abriga em sua imponente estrutura o Museu da Língua Portuguesa.",
                List.of(
                        new Alternativa(1, "Estação Brás", false),
                        new Alternativa(2, "Estação Júlio Prestes", false),
                        new Alternativa(3, "Estação da Luz", true),
                        new Alternativa(4, "Estação Barra Funda", false)
                )
        );

        criarPergunta(
                "Qual vila ferroviária histórica de estilo inglês no ABC Paulista é destino turístico servido pela ferrovia?",
                3, 10000L,
                "Paranapiacaba é uma histórica vila ferroviária britânica em Santo André, berço dos trens da São Paulo Railway.",
                List.of(
                        new Alternativa(1, "Paranapiacaba", true),
                        new Alternativa(2, "São Roque", false),
                        new Alternativa(3, "Campos do Jordão", false),
                        new Alternativa(4, "Holambra", false)
                )
        );

        // Nível 4
        criarPergunta(
                "Em que ano a CPTM foi oficialmente criada pela Lei Estadual nº 7.861?",
                4, 25000L,
                "A CPTM foi constituída em 28 de maio de 1992, assumindo os serviços de trens urbanos da CBTU e FEPASA.",
                List.of(
                        new Alternativa(1, "1988", false),
                        new Alternativa(2, "1992", true),
                        new Alternativa(3, "2000", false),
                        new Alternativa(4, "1974", false)
                )
        );

        criarPergunta(
                "Qual ferrovia histórica inaugurada em 1867 deu origem ao traçado ferroviário pioneiro de São Paulo?",
                4, 25000L,
                "A São Paulo Railway (SPR) foi inaugurada em 1867, ligando o Porto de Santos até Jundiaí para escoar a produção de café.",
                List.of(
                        new Alternativa(1, "São Paulo Railway (SPR)", true),
                        new Alternativa(2, "Estrada de Ferro Sorocabana", false),
                        new Alternativa(3, "Estrada de Ferro Central do Brasil", false),
                        new Alternativa(4, "Companhia Mogiana de Estradas de Ferro", false)
                )
        );

        // Nível 5
        criarPergunta(
                "Qual serviço especial unificou as Linhas 7-Rubi e 10-Turquesa em uma única viagem direta?",
                5, 50000L,
                "O 'Serviço 710' conectou diretamente Francisco Morato (Linha 7) a Rio Grande da Serra (Linha 10) sem baldeação.",
                List.of(
                        new Alternativa(1, "Serviço 710", true),
                        new Alternativa(2, "Expresso Sudeste", false),
                        new Alternativa(3, "Linha Integrada 2000", false),
                        new Alternativa(4, "Conexão Metropolitana ABC", false)
                )
        );

        criarPergunta(
                "Qual é a tensão elétrica padrão fornecida pela rede aérea (catenária) aos trens da CPTM?",
                5, 50000L,
                "A tração elétrica dos trens metropolitanos da CPTM utiliza rede aérea (catenária) energizada em 3.000 Volts em Corrente Contínua (CC).",
                List.of(
                        new Alternativa(1, "750 V CC", false),
                        new Alternativa(2, "1.500 V CA", false),
                        new Alternativa(3, "3.000 V CC", true),
                        new Alternativa(4, "25.000 V CA", false)
                )
        );

        // Nível 6
        criarPergunta(
                "Qual é a bitola padrão (distância entre as faces internas dos trilhos) predominante na CPTM?",
                6, 100000L,
                "As vias principais da CPTM utilizam a bitola larga brasileira de 1,60 metro (1.600 mm).",
                List.of(
                        new Alternativa(1, "Bitola Métrica (1,00 m)", false),
                        new Alternativa(2, "Bitola Padrão Internacional (1,435 m)", false),
                        new Alternativa(3, "Bitola Larga (1,60 m)", true),
                        new Alternativa(4, "Bitola Estreita (0,76 m)", false)
                )
        );

        criarPergunta(
                "Qual é o nome do trem temático que realiza passeios de fim de semana com locomotiva para Paranapiacaba e Jundiaí?",
                6, 100000L,
                "O Expresso Turístico da CPTM utiliza carros de aço inox fabricados nos anos 1960 tracionados por locomotiva a diesel histórica.",
                List.of(
                        new Alternativa(1, "Expresso Turístico", true),
                        new Alternativa(2, "Maria Fumaça Paulistana", false),
                        new Alternativa(3, "Trem da Mantiqueira", false),
                        new Alternativa(4, "Vagão da História", false)
                )
        );

        // Nível 7
        criarPergunta(
                "Qual linha de trem metropolitano foi a primeira a ser totalmente planejada e construída pela CPTM desde a sua fundação?",
                7, 200000L,
                "A Linha 13-Jade (Engenheiro Goulart - Aeroporto-Guarulhos) foi a primeira linha ferroviária projetada e construída 100% pela CPTM.",
                List.of(
                        new Alternativa(1, "Linha 10-Turquesa", false),
                        new Alternativa(2, "Linha 13-Jade", true),
                        new Alternativa(3, "Linha 12-Safira", false),
                        new Alternativa(4, "Linha 11-Coral", false)
                )
        );

        criarPergunta(
                "Em qual grande terminal intermodal do centro expandido convergem as Linhas 7, 8 (ViaMobilidade) e Linha 3 do Metrô?",
                7, 200000L,
                "A Estação Palmeiras-Barra Funda é um dos maiores centros de integração intermodal da capital paulista.",
                List.of(
                        new Alternativa(1, "Palmeiras-Barra Funda", true),
                        new Alternativa(2, "Tatuapé", false),
                        new Alternativa(3, "Pinheiros", false),
                        new Alternativa(4, "Tamanduateí", false)
                )
        );

        // Nível 8
        criarPergunta(
                "Em que ano foi inaugurada a terceira e definitiva edificação da Estação da Luz com sua famosa torre do relógio?",
                8, 300000L,
                "A imponente Estação da Luz foi aberta ao público em 1º de março de 1901, com materiais importados da Inglaterra.",
                List.of(
                        new Alternativa(1, "1867", false),
                        new Alternativa(2, "1901", true),
                        new Alternativa(3, "1922", false),
                        new Alternativa(4, "1954", false)
                )
        );

        criarPergunta(
                "Qual tecnologia de sinalização e controle contínuo de velocidade é usada para garantir a segurança dos trens na CPTM?",
                8, 300000L,
                "A tecnologia ATC (Automatic Train Control) e CBTC monitoram a velocidade e distanciamento entre as composições ferroviárias.",
                List.of(
                        new Alternativa(1, "ATC / CBTC", true),
                        new Alternativa(2, "GPS Comercial", false),
                        new Alternativa(3, "Semáforo Mecânico Manual", false),
                        new Alternativa(4, "Radar Sonar", false)
                )
        );

        // Nível 9
        criarPergunta(
                "Onde está localizado o CCO (Centro de Controle Operacional), cérebro que monitora a circulação de trens da CPTM?",
                9, 500000L,
                "O CCO da CPTM está centralizado no complexo do Brás, coordenando sinalização, telecomunicações e energia da rede.",
                List.of(
                        new Alternativa(1, "Estação da Luz", false),
                        new Alternativa(2, "Complexo do Brás", true),
                        new Alternativa(3, "Pátio da Lapa", false),
                        new Alternativa(4, "Estação Tatuapé", false)
                )
        );

        criarPergunta(
                "Qual ferrovia pioneira do interior paulista foi a primeira a adotar tração elétrica em larga escala no Brasil?",
                9, 500000L,
                "A Companhia Paulista de Estradas de Ferro inaugurou a tração elétrica no início da década de 1920, pioneira na modernização dos trilhos.",
                List.of(
                        new Alternativa(1, "Estrada de Ferro Central do Brasil", false),
                        new Alternativa(2, "Companhia Paulista de Estradas de Ferro", true),
                        new Alternativa(3, "Estrada de Ferro Sorocabana", false),
                        new Alternativa(4, "Estrada de Ferro Santos-Jundiaí", false)
                )
        );

        // Nível 10
        criarPergunta(
                "Qual fabricante histórico inglês forneceu as réplicas do 'Big Ben' instaladas nas torres ferroviárias da Luz e Paranapiacaba?",
                10, 1000000L,
                "A renomada fábrica britânica John Walker & Sons produziu os mecanismos de relógio de precisão instalados nas estações da São Paulo Railway.",
                List.of(
                        new Alternativa(1, "John Walker & Sons", true),
                        new Alternativa(2, "Breguet London", false),
                        new Alternativa(3, "English Clockwork Co.", false),
                        new Alternativa(4, "Vacheron & Brit", false)
                )
        );

        criarPergunta(
                "Em que ano o Expresso Turístico da CPTM realizou sua viagem inaugural com a locomotiva Alco RS-3 rumo a Paranapiacaba?",
                10, 1000000L,
                "O Expresso Turístico da CPTM foi inaugurado em 2009, resgatando a rica memória ferroviária paulista.",
                List.of(
                        new Alternativa(1, "2000", false),
                        new Alternativa(2, "2009", true),
                        new Alternativa(3, "2015", false),
                        new Alternativa(4, "1998", false)
                )
        );
    }

    private void criarPergunta(String enunciado, int nivel, long premio, String explicacao, List<Alternativa> alts) {
        Pergunta p = new Pergunta(enunciado, nivel, premio, explicacao);
        for (Alternativa a : alts) {
            p.adicionarAlternativa(a);
        }
        perguntaRepository.save(p);
    }
}
