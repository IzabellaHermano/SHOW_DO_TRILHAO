package com.cptm.showdotrilhao.repository;

import com.cptm.showdotrilhao.model.Sala;
import com.cptm.showdotrilhao.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaRepository extends JpaRepository<Sala, Long> {

    @Query("SELECT s FROM Sala s LEFT JOIN FETCH s.apresentador WHERE s.codigo = :codigo")
    Optional<Sala> findByCodigo(@Param("codigo") String codigo);

    boolean existsByCodigo(String codigo);

    @Query("SELECT s FROM Sala s LEFT JOIN FETCH s.apresentador WHERE s.apresentador = :apresentador ORDER BY s.criadaEm DESC")
    List<Sala> findByApresentadorOrderByCriadaEmDesc(@Param("apresentador") Usuario apresentador);

    @Query("SELECT s FROM Sala s LEFT JOIN FETCH s.apresentador WHERE s.ativa = true ORDER BY s.criadaEm DESC")
    List<Sala> findByAtivaTrueOrderByCriadaEmDesc();

    @Query("SELECT s FROM Sala s LEFT JOIN FETCH s.apresentador ORDER BY s.criadaEm DESC")
    List<Sala> findAllWithApresentador();
}
