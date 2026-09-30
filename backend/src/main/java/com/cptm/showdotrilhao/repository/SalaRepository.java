package com.cptm.showdotrilhao.repository;

import com.cptm.showdotrilhao.model.Sala;
import com.cptm.showdotrilhao.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaRepository extends JpaRepository<Sala, Long> {
    Optional<Sala> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
    List<Sala> findByApresentadorOrderByCriadaEmDesc(Usuario apresentador);
    List<Sala> findByAtivaTrueOrderByCriadaEmDesc();
}
