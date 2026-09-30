package com.cptm.showdotrilhao.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "perguntas")
public class Pergunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String enunciado;

    @Column(name = "nivel_dificuldade", nullable = false)
    private int nivelDificuldade; // 1 a 10

    @Column(name = "valor_premio", nullable = false)
    private long valorPremio; // Ex: 1.000 a 1.000.000

    @Column(length = 1000)
    private String explicacao;

    @OneToMany(mappedBy = "pergunta", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("numero ASC")
    private List<Alternativa> alternativas = new ArrayList<>();

    public Pergunta() {
    }

    public Pergunta(String enunciado, int nivelDificuldade, long valorPremio, String explicacao) {
        this.enunciado = enunciado;
        this.nivelDificuldade = nivelDificuldade;
        this.valorPremio = valorPremio;
        this.explicacao = explicacao;
    }

    public void adicionarAlternativa(Alternativa alt) {
        alternativas.add(alt);
        alt.setPergunta(this);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEnunciado() {
        return enunciado;
    }

    public void setEnunciado(String enunciado) {
        this.enunciado = enunciado;
    }

    public int getNivelDificuldade() {
        return nivelDificuldade;
    }

    public void setNivelDificuldade(int nivelDificuldade) {
        this.nivelDificuldade = nivelDificuldade;
    }

    public long getValorPremio() {
        return valorPremio;
    }

    public void setValorPremio(long valorPremio) {
        this.valorPremio = valorPremio;
    }

    public String getExplicacao() {
        return explicacao;
    }

    public void setExplicacao(String explicacao) {
        this.explicacao = explicacao;
    }

    public List<Alternativa> getAlternativas() {
        return alternativas;
    }

    public void setAlternativas(List<Alternativa> alternativas) {
        this.alternativas = alternativas;
    }
}
