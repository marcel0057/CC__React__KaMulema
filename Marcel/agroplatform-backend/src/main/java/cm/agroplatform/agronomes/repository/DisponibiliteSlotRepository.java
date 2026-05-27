package cm.agroplatform.agronomes.repository;

import cm.agroplatform.agronomes.entity.DisponibiliteSlot;
import cm.agroplatform.agronomes.entity.DisponibiliteSlot.StatutSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DisponibiliteSlotRepository extends JpaRepository<DisponibiliteSlot, Long> {

    List<DisponibiliteSlot> findByAgronomeIdAndStatut(Long agronomeId, StatutSlot statut);

    List<DisponibiliteSlot> findByAgronomeId(Long agronomeId);

    List<DisponibiliteSlot> findByAgriculteurId(Long agriculteurId);

    /**
     * Créneaux libres d'un agronome à partir de maintenant.
     */
    @Query("SELECT s FROM DisponibiliteSlot s WHERE s.agronome.id = :agronomeId " +
           "AND s.statut = 'LIBRE' AND s.dateDebut > :maintenant ORDER BY s.dateDebut ASC")
    List<DisponibiliteSlot> findCreneauxLibresFuturs(
        @Param("agronomeId") Long agronomeId,
        @Param("maintenant") LocalDateTime maintenant
    );

    /**
     * Réservations d'un agriculteur (tous statuts sauf LIBRE).
     */
    @Query("SELECT s FROM DisponibiliteSlot s WHERE s.agriculteurId = :agriculteurId " +
           "AND s.statut != 'LIBRE' ORDER BY s.dateDebut DESC")
    List<DisponibiliteSlot> findReservationsAgriculteur(@Param("agriculteurId") Long agriculteurId);

    /**
     * Vérifie si un agriculteur a eu au moins un RDV confirmé avec cet agronome
     * (nécessaire pour autoriser l'évaluation).
     */
    @Query("SELECT COUNT(s) > 0 FROM DisponibiliteSlot s WHERE s.agronome.id = :agronomeId " +
           "AND s.agriculteurId = :agriculteurId AND s.statut = 'CONFIRME'")
    boolean agriculteurAEuRdvConfirme(
        @Param("agronomeId") Long agronomeId,
        @Param("agriculteurId") Long agriculteurId
    );
}
