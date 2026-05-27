package cm.agroplatform.agronomes.repository;

import cm.agroplatform.agronomes.entity.Agronome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgronomeRepository extends JpaRepository<Agronome, Long> {

    Optional<Agronome> findByEmail(String email);

    List<Agronome> findByDisponibleTrue();

    List<Agronome> findByDepartementIgnoreCase(String departement);

    List<Agronome> findByRegionIgnoreCase(String region);

    List<Agronome> findBySpecialiteContainingIgnoreCase(String specialite);

    /**
     * Récupère tous les agronomes disponibles triés par note décroissante.
     * Le filtrage par rayon km est fait côté service avec HaversineService.
     */
    @Query("SELECT a FROM Agronome a WHERE a.disponible = true ORDER BY a.noteMoyenne DESC, a.nombreEvaluations DESC")
    List<Agronome> findAllDisponiblesTriesParNote();

    /**
     * Récupère les agronomes d'un département donnée, disponibles, triés par note.
     */
    @Query("SELECT a FROM Agronome a WHERE a.disponible = true AND LOWER(a.departement) = LOWER(:dept) ORDER BY a.noteMoyenne DESC")
    List<Agronome> findByDepartementDisponibles(@Param("dept") String departement);

    boolean existsByEmail(String email);
}
