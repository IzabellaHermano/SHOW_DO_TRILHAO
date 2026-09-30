package com.cptm.showdotrilhao.repository;

import com.cptm.showdotrilhao.model.Partida;
import com.cptm.showdotrilhao.model.RespostaPartida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RespostaPartidaRepository extends JpaRepository<RespostaPartida, Long> {
    List<RespostaPartida> findByPartidaOrderByRespondidaEmAsc(Partida partida);
}
