package com.cptm.showdotrilhao.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apresentador_id", nullable = false)
    private Usuario apresentador;

    @Column(nullable = false)
    private boolean ativa = true;

    @Column(name = "criada_em", nullable = false)
    private LocalDateTime criadaEm;

    public Sala() {
    }

    public Sala(String codigo, String nome, Usuario apresentador) {
        this.codigo = codigo;
        this.nome = nome;
        this.apresentador = apresentador;
        this.ativa = true;
        this.criadaEm = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.criadaEm == null) {
            this.criadaEm = LocalDateTime.now();
        }
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

    public LocalDateTime getCriadaEm() {
        return criadaEm;
    }

    public void setCriadaEm(LocalDateTime criadaEm) {
        this.criadaEm = criadaEm;
    }
}
