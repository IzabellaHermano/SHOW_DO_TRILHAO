package com.cptm.showdotrilhao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "alternativas")
public class Alternativa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pergunta_id", nullable = false)
    @JsonIgnore
    private Pergunta pergunta;

    @Column(nullable = false)
    private int numero; // 1, 2, 3 ou 4

    @Column(nullable = false, length = 500)
    private String texto;

    @Column(nullable = false)
    private boolean correta;

    public Alternativa() {
    }

    public Alternativa(int numero, String texto, boolean correta) {
        this.numero = numero;
        this.texto = texto;
        this.correta = correta;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Pergunta getPergunta() {
        return pergunta;
    }

    public void setPergunta(Pergunta pergunta) {
        this.pergunta = pergunta;
    }

    public int getNumero() {
        return numero;
    }

    public void setNumero(int numero) {
        this.numero = numero;
    }

    public String getTexto() {
        return texto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public boolean isCorreta() {
        return correta;
    }

    public void setCorreta(boolean correta) {
        this.correta = correta;
    }
}
