package cm.agroplatform.agronomes.repository;

import cm.agroplatform.agronomes.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Historique complet d'une conversation, du plus récent au plus ancien.
     */
    @Query("SELECT m FROM Message m WHERE m.agriculteurId = :agriculteurId AND m.agronome.id = :agronomeId ORDER BY m.createdAt ASC")
    List<Message> findConversation(
        @Param("agriculteurId") Long agriculteurId,
        @Param("agronomeId") Long agronomeId
    );

    /**
     * Derniers N messages d'une conversation (pour la pagination).
     */
    @Query("SELECT m FROM Message m WHERE m.agriculteurId = :agriculteurId AND m.agronome.id = :agronomeId ORDER BY m.createdAt DESC")
    List<Message> findDerniersMessages(
        @Param("agriculteurId") Long agriculteurId,
        @Param("agronomeId") Long agronomeId,
        Pageable pageable
    );

    /**
     * Nombre de messages non lus pour un agronome.
     */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.agronome.id = :agronomeId AND m.lu = false AND m.expediteur = 'AGRICULTEUR'")
    long countNonLusAgronome(@Param("agronomeId") Long agronomeId);

    /**
     * Nombre de messages non lus pour un agriculteur.
     */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.agriculteurId = :agriculteurId AND m.lu = false AND m.expediteur = 'AGRONOME'")
    long countNonLusAgriculteur(@Param("agriculteurId") Long agriculteurId);

    /**
     * Marque tous les messages d'une conversation comme lus.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.lu = true WHERE m.agriculteurId = :agriculteurId AND m.agronome.id = :agronomeId AND m.lu = false")
    int marquerTousLus(
        @Param("agriculteurId") Long agriculteurId,
        @Param("agronomeId") Long agronomeId
    );

    /**
     * Liste des agronomes avec qui un agriculteur a des conversations (pour la liste de chats).
     */
    @Query("SELECT DISTINCT m.agronome.id FROM Message m WHERE m.agriculteurId = :agriculteurId")
    List<Long> findAgronomeIdsAvecConversation(@Param("agriculteurId") Long agriculteurId);
}
