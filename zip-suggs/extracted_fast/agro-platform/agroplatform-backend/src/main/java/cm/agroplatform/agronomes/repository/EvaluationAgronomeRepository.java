package cm.agroplatform.agronomes.repository;

import cm.agroplatform.agronomes.entity.EvaluationAgronome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationAgronomeRepository extends JpaRepository<EvaluationAgronome, Long> {

    List<EvaluationAgronome> findByAgronomeIdOrderByCreatedAtDesc(Long agronomeId);

    boolean existsByAgronomeIdAndAgriculteurIdAndSlotId(Long agronomeId, Long agriculteurId, Long slotId);

    @Query("SELECT AVG(e.note) FROM EvaluationAgronome e WHERE e.agronome.id = :agronomeId")
    Double calculerNoteMoyenne(@Param("agronomeId") Long agronomeId);
}
