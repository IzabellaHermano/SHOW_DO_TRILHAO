package com.cptm.showdotrilhao.model;

import com.cptm.showdotrilhao.model.enums.StatusPartida;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "partidas")
public class Partida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id", nullable = false)
    private Sala sala;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = true)
    private Usuario usuario;

    @Column(name = "nome_visitante", length = 100, nullable = true)
    private String nomeVisitante;

    @Column(name = "pontuacao_final", nullable = false)
    private long pontuacaoFinal = 0;

    @Column(name = "nivel_alcancado", nullable = false)
    private int nivelAlcancado = 0; // 0 a 10

    @Column(name = "pergunta_atual_index", nullable = false)
    private int perguntaAtualIndex = 0; // 0 a 9

    @Column(name = "perguntas_ids", nullable = false, length = 200)
    private String perguntasIds; // Lista com IDs ordenados: ex "1,2,3,4,5,6,7,8,9,10"

    @OneToMany(mappedBy = "partida", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    private List<PartidaPergunta> perguntas = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusPartida status = StatusPartida.EM_ANDAMENTO;

    @Column(name = "iniciada_em", nullable = false)
    private LocalDateTime iniciadaEm;

    @Column(name = "finalizada_em")
    private LocalDateTime finalizadaEm;

    public Partida() {
    }

    public Partida(Sala sala, Usuario usuario, String nomeVisitante, String perguntasIds) {
        this.sala = sala;
        this.usuario = usuario;
        this.nomeVisitante = nomeVisitante;
        this.perguntasIds = perguntasIds;
        this.pontuacaoFinal = 0;
        this.nivelAlcancado = 0;
        this.perguntaAtualIndex = 0;
        this.status = StatusPartida.EM_ANDAMENTO;
        this.iniciadaEm = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.iniciadaEm == null) {
            this.iniciadaEm = LocalDateTime.now();
        }
    }

    public void adicionarPergunta(Pergunta pergunta, int ordem, int nivel) {
        PartidaPergunta pp = new PartidaPergunta(this, pergunta, ordem, nivel);
        this.perguntas.add(pp);
    }

    public String getNomeJogador() {
        if (usuario != null) {
            return usuario.getNome();
        }
        return nomeVisitante != null ? nomeVisitante : "Visitante Anônimo";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Sala getSala() {
        return sala;
    }

    public void setSala(Sala sala) {
        this.sala = sala;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getNomeVisitante() {
        return nomeVisitante;
    }

    public void setNomeVisitante(String nomeVisitante) {
        this.nomeVisitante = nomeVisitante;
    }

    public long getPontuacaoFinal() {
        return pontuacaoFinal;
    }

    public void setPontuacaoFinal(long pontuacaoFinal) {
        this.pontuacaoFinal = pontuacaoFinal;
    }

    public int getNivelAlcancado() {
        return nivelAlcancado;
    }

    public void setNivelAlcancado(int nivelAlcancado) {
        this.nivelAlcancado = nivelAlcancado;
    }

    public int getPerguntaAtualIndex() {
        return perguntaAtualIndex;
    }

    public void setPerguntaAtualIndex(int perguntaAtualIndex) {
        this.perguntaAtualIndex = perguntaAtualIndex;
    }

    public String getPerguntasIds() {
        return perguntasIds;
    }

    public void setPerguntasIds(String perguntasIds) {
        this.perguntasIds = perguntasIds;
    }

    public List<PartidaPergunta> getPerguntas() {
        return perguntas;
    }

    public void setPerguntas(List<PartidaPergunta> perguntas) {
        this.perguntas = perguntas;
    }

    public StatusPartida getStatus() {
        return status;
    }

    public void setStatus(StatusPartida status) {
        this.status = status;
    }

    public LocalDateTime getIniciadaEm() {
        return iniciadaEm;
    }

    public void setIniciadaEm(LocalDateTime iniciadaEm) {
        this.iniciadaEm = iniciadaEm;
    }

    public LocalDateTime getFinalizadaEm() {
        return finalizadaEm;
    }

    public void setFinalizadaEm(LocalDateTime finalizadaEm) {
        this.finalizadaEm = finalizadaEm;
    }
}
