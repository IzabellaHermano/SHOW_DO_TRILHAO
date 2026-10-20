package com.cptm.showdotrilhao.model;

import com.cptm.showdotrilhao.model.enums.FaseRodada;
import com.cptm.showdotrilhao.model.enums.StatusSala;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "salas")
public class Sala {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nome;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apresentador_id", nullable = false)
    private Usuario apresentador;

    @Column(nullable = false)
    private boolean ativa = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusSala status = StatusSala.AGUARDANDO;

    @Enumerated(EnumType.STRING)
    @Column(name = "fase_rodada", nullable = false, length = 30)
    private FaseRodada faseRodada = FaseRodada.LOBBY;

    @Column(name = "pergunta_atual_index", nullable = false)
    private int perguntaAtualIndex = 0;

    @Column(name = "prazo_final")
    private LocalDateTime prazoFinal;

    @Column(name = "aberta_em")
    private LocalDateTime abertaEm;

    @Column(name = "versao_estado", nullable = false)
    private long versaoEstado = 0;

    @JsonIgnore
    @OneToMany(mappedBy = "sala", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    private List<SalaPergunta> perguntas = new ArrayList<>();

    @Column(name = "criada_em", nullable = false)
    private LocalDateTime criadaEm;

    public Sala() {
    }

    public Sala(String codigo, String nome, Usuario apresentador) {
        this.codigo = codigo;
        this.nome = nome;
        this.apresentador = apresentador;
        this.ativa = true;
        this.status = StatusSala.AGUARDANDO;
        this.faseRodada = FaseRodada.LOBBY;
        this.perguntaAtualIndex = 0;
        this.versaoEstado = 0;
        this.criadaEm = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.criadaEm == null) {
            this.criadaEm = LocalDateTime.now();
        }
    }

    public void adicionarPergunta(Pergunta pergunta, int ordem) {
        SalaPergunta sp = new SalaPergunta(this, pergunta, ordem);
        this.perguntas.add(sp);
    }

    public void incrementarVersao() {
        this.versaoEstado++;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Usuario getApresentador() {
        return apresentador;
    }

    public void setApresentador(Usuario apresentador) {
        this.apresentador = apresentador;
    }

    public boolean isAtiva() {
        return ativa;
    }

    public void setAtiva(boolean ativa) {
        this.ativa = ativa;
    }

    public StatusSala getStatus() {
        return status;
    }

    public void setStatus(StatusSala status) {
        this.status = status;
    }

    public FaseRodada getFaseRodada() {
        return faseRodada;
    }

    public void setFaseRodada(FaseRodada faseRodada) {
        this.faseRodada = faseRodada;
    }

    public int getPerguntaAtualIndex() {
        return perguntaAtualIndex;
    }

    public void setPerguntaAtualIndex(int perguntaAtualIndex) {
        this.perguntaAtualIndex = perguntaAtualIndex;
    }

    public LocalDateTime getPrazoFinal() {
        return prazoFinal;
    }

    public void setPrazoFinal(LocalDateTime prazoFinal) {
        this.prazoFinal = prazoFinal;
    }

    public LocalDateTime getAbertaEm() {
        return abertaEm;
    }

    public void setAbertaEm(LocalDateTime abertaEm) {
        this.abertaEm = abertaEm;
    }

    public long getVersaoEstado() {
        return versaoEstado;
    }

    public void setVersaoEstado(long versaoEstado) {
        this.versaoEstado = versaoEstado;
    }

    public List<SalaPergunta> getPerguntas() {
        return perguntas;
    }

    public void setPerguntas(List<SalaPergunta> perguntas) {
        this.perguntas = perguntas;
    }

    public LocalDateTime getCriadaEm() {
        return criadaEm;
    }

    public void setCriadaEm(LocalDateTime criadaEm) {
        this.criadaEm = criadaEm;
    }
}
