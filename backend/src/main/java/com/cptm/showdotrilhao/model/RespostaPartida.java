package com.cptm.showdotrilhao.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "respostas_partida")
public class RespostaPartida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partida_id", nullable = false)
    private Partida partida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pergunta_id", nullable = false)
    private Pergunta pergunta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alternativa_escolhida_id", nullable = true)
    private Alternativa alternativaEscolhida;

    @Column(nullable = false)
    private boolean acertou;

    @Column(name = "tempo_esgotado", nullable = false)
    private boolean tempoEsgotado = false;

    @Column(name = "respondida_em", nullable = false)
    private LocalDateTime respondidaEm;

    public RespostaPartida() {
    }

    public RespostaPartida(Partida partida, Pergunta pergunta, Alternativa alternativaEscolhida, boolean acertou, boolean tempoEsgotado) {
        this.partida = partida;
        this.pergunta = pergunta;
        this.alternativaEscolhida = alternativaEscolhida;
        this.acertou = acertou;
        this.tempoEsgotado = tempoEsgotado;
        this.respondidaEm = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.respondidaEm == null) {
            this.respondidaEm = LocalDateTime.now();
        }
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

    public Alternativa getAlternativaEscolhida() {
        return alternativaEscolhida;
    }

    public void setAlternativaEscolhida(Alternativa alternativaEscolhida) {
        this.alternativaEscolhida = alternativaEscolhida;
    }

    public boolean isAcertou() {
        return acertou;
    }

    public void setAcertou(boolean acertou) {
        this.acertou = acertou;
    }

    public boolean isTempoEsgotado() {
        return tempoEsgotado;
    }

    public void setTempoEsgotado(boolean tempoEsgotado) {
        this.tempoEsgotado = tempoEsgotado;
    }

    public LocalDateTime getRespondidaEm() {
        return respondidaEm;
    }

    public void setRespondidaEm(LocalDateTime respondidaEm) {
        this.respondidaEm = respondidaEm;
    }
}
