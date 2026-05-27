package cm.agroplatform.agronomes.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Évaluation laissée par un agriculteur après une interaction avec un agronome.
 * Seuls les agriculteurs ayant eu un rendez-vous CONFIRME peuvent évaluer.
 */
@Entity
@Table(
    name = "evaluations_agronomes",
    uniqueConstraints = {
        // Un agriculteur ne peut évaluer un agronome qu'une seule fois par slot
        @UniqueConstraint(columnNames = {"agronome_id", "agriculteur_id", "slot_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationAgronome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agronome_id", nullable = false)
    private Agronome agronome;

    /**
     * ID de l'agriculteur évaluateur (référence inter-module).
     */
    @NotNull
    @Column(name = "agriculteur_id", nullable = false)
    private Long agriculteurId;

    /**
     * Le slot de rendez-vous qui justifie cette évaluation.
     */
    @NotNull
    @Column(name = "slot_id", nullable = false)
    private Long slotId;

    @NotNull
    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer note;  // Note de 1 à 5 étoiles

    @Column(length = 1000)
    private String commentaire;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
