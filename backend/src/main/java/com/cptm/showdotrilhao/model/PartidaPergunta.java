package com.cptm.showdotrilhao.model;

import jakarta.persistence.*;

@Entity
@Table(name = "partidas_perguntas", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"partida_id", "pergunta_id"}),
        @UniqueConstraint(columnNames = {"partida_id", "ordem"})
})
public class PartidaPergunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partida_id", nullable = false)
    private Partida partida;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pergunta_id", nullable = false)
    private Pergunta pergunta;

    @Column(nullable = false)
    private int ordem; // 1 a 10

    @Column(name = "nivel_dificuldade", nullable = false)
    private int nivelDificuldade;

    public PartidaPergunta() {
    }

    public PartidaPergunta(Partida partida, Pergunta pergunta, int ordem, int nivelDificuldade) {
        this.partida = partida;
        this.pergunta = pergunta;
        this.ordem = ordem;
        this.nivelDificuldade = nivelDificuldade;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Partida getPartida() {
        return partida;
    }

    public void setPartida(Partida partida) {
        this.partida = partida;
    }

    public Pergunta getPergunta() {
        return pergunta;
    }

    public void setPergunta(Pergunta pergunta) {
        this.pergunta = pergunta;
    }

    public int getOrdem() {
        return ordem;
    }

    public void setOrdem(int ordem) {
        this.ordem = ordem;
    }

    public int getNivelDificuldade() {
        return nivelDificuldade;
    }

    public void setNivelDificuldade(int nivelDificuldade) {
        this.nivelDificuldade = nivelDificuldade;
    }
}
