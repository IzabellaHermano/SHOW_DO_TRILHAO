package com.cptm.showdotrilhao.model;

import jakarta.persistence.*;

@Entity
@Table(name = "sala_perguntas", uniqueConstraints = {
        @UniqueConstraint(name = "uk_sala_ordem", columnNames = {"sala_id", "ordem"}),
        @UniqueConstraint(name = "uk_sala_pergunta", columnNames = {"sala_id", "pergunta_id"})
})
public class SalaPergunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id", nullable = false)
    private Sala sala;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pergunta_id", nullable = false)
    private Pergunta pergunta;

    @Column(nullable = false)
    private int ordem;

    public SalaPergunta() {
    }

    public SalaPergunta(Sala sala, Pergunta pergunta, int ordem) {
        this.sala = sala;
        this.pergunta = pergunta;
        this.ordem = ordem;
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
}
