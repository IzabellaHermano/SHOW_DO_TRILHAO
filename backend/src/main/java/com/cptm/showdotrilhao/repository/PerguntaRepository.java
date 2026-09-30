package com.cptm.showdotrilhao.repository;

import com.cptm.showdotrilhao.model.Pergunta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerguntaRepository extends JpaRepository<Pergunta, Long> {
    List<Pergunta> findByNivelDificuldade(int nivelDificuldade);
}
