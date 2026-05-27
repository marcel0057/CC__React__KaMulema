package cm.agroplatform.agronomes.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Créneau de disponibilité d'un agronome.
 * Un slot peut être LIBRE, RESERVE (en attente de confirmation) ou CONFIRME.
 */
@Entity
@Table(name = "disponibilite_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisponibiliteSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agronome_id", nullable = false)
    private Agronome agronome;

    /**
     * ID de l'agriculteur qui a réservé ce slot (null si LIBRE).
     * Référence vers le module Auth géré par Joumessi.
     */
    @Column(name = "agriculteur_id")
    private Long agriculteurId;

    @NotNull
    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @NotNull
    @Column(name = "date_fin", nullable = false)
    private LocalDateTime dateFin;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private StatutSlot statut = StatutSlot.LIBRE;

    @Column(name = "notes_agriculteur", length = 500)
    private String notesAgriculteur;  // Message de l'agriculteur lors de la réservation

    @Column(name = "notes_agronome", length = 500)
    private String notesAgronome;     // Réponse / raison du refus de l'agronome

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum StatutSlot {
        LIBRE,      // Créneau disponible, personne n'a réservé
        RESERVE,    // Réservé par un agriculteur, en attente de confirmation de l'agronome
        CONFIRME,   // Confirmé par l'agronome — rendez-vous fixé
        REFUSE,     // Refusé par l'agronome
        TERMINE     // Rendez-vous passé
    }
}
