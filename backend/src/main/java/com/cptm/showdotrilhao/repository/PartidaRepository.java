package com.cptm.showdotrilhao.repository;

import com.cptm.showdotrilhao.model.Partida;
import com.cptm.showdotrilhao.model.Sala;
import com.cptm.showdotrilhao.model.enums.StatusPartida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartidaRepository extends JpaRepository<Partida, Long> {

    @Query("SELECT p FROM Partida p WHERE p.sala = :sala AND p.status != :statusExcluido ORDER BY p.pontuacaoFinal DESC, p.nivelAlcancado DESC, p.iniciadaEm DESC")
    List<Partida> findRankingSala(@Param("sala") Sala sala, @Param("statusExcluido") StatusPartida statusExcluido);

    @Query("SELECT p FROM Partida p WHERE p.usuario IS NOT NULL AND p.status != :statusExcluido ORDER BY p.pontuacaoFinal DESC, p.nivelAlcancado DESC, p.iniciadaEm DESC")
    List<Partida> findRankingGeral(@Param("statusExcluido") StatusPartida statusExcluido);

    List<Partida> findByUsuarioIdOrderByIniciadaEmDesc(Long usuarioId);
}
