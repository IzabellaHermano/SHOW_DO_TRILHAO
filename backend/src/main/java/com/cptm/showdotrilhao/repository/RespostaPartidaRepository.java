package com.cptm.showdotrilhao.repository;

import com.cptm.showdotrilhao.model.Partida;
import com.cptm.showdotrilhao.model.Pergunta;
import com.cptm.showdotrilhao.model.RespostaPartida;
import com.cptm.showdotrilhao.model.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RespostaPartidaRepository extends JpaRepository<RespostaPartida, Long> {
    List<RespostaPartida> findByPartidaOrderByRespondidaEmAsc(Partida partida);
    boolean existsByPartidaAndPergunta(Partida partida, Pergunta pergunta);
    Optional<RespostaPartida> findByPartidaAndPergunta(Partida partida, Pergunta pergunta);
    List<RespostaPartida> findByPerguntaAndPartida_Sala(Pergunta pergunta, Sala sala);
    long countByPerguntaAndPartida_Sala(Pergunta pergunta, Sala sala);
}
