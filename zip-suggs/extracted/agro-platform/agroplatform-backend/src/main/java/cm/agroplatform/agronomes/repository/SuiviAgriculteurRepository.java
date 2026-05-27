package cm.agroplatform.agronomes.repository;

import cm.agroplatform.agronomes.entity.SuiviAgriculteur;
import cm.agroplatform.agronomes.entity.SuiviAgriculteur.StatutSuivi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SuiviAgriculteurRepository extends JpaRepository<SuiviAgriculteur, Long> {

    /** Tous les suivis d'un agronome (toutes demandes confondues) */
    List<SuiviAgriculteur> findByAgronomeIdOrderByCreatedAtDesc(Long agronomeId);

    /** Agriculteurs activement suivis par un agronome (statut ACCEPTE) */
    List<SuiviAgriculteur> findByAgronomeIdAndStatut(Long agronomeId, StatutSuivi statut);

    /** Demandes en attente pour un agronome */
    @Query("SELECT s FROM SuiviAgriculteur s WHERE s.agronome.id = :agronomeId AND s.statut = 'EN_ATTENTE' ORDER BY s.createdAt ASC")
    List<SuiviAgriculteur> findDemandesEnAttente(@Param("agronomeId") Long agronomeId);

    /** Nombre d'agriculteurs activement suivis */
    @Query("SELECT COUNT(s) FROM SuiviAgriculteur s WHERE s.agronome.id = :agronomeId AND s.statut = 'ACCEPTE'")
    long countSuivisActifs(@Param("agronomeId") Long agronomeId);

    /** Vérifier si un suivi existe déjà entre agronome et agriculteur */
    Optional<SuiviAgriculteur> findByAgronomeIdAndAgriculteurId(Long agronomeId, Long agriculteurId);

    /** Suivis d'un agriculteur (pour savoir quels agronomes le suivent) */
    List<SuiviAgriculteur> findByAgriculteurIdAndStatut(Long agriculteurId, StatutSuivi statut);
}
