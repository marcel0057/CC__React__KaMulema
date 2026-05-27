package cm.agroplatform.agronomes.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Relation de suivi entre un agronome et un agriculteur.
 * L'agriculteur fait une demande → l'agronome accepte ou refuse.
 * Un agronome peut suivre au maximum 4 agriculteurs simultanément.
 */
@Entity
@Table(
    name = "suivis_agriculteurs",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"agronome_id", "agriculteur_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuiviAgriculteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agronome_id", nullable = false)
    private Agronome agronome;

    /**
     * ID de l'agriculteur suivi (référence inter-module — Auth de Joumessi).
     */
    @Column(name = "agriculteur_id", nullable = false)
    private Long agriculteurId;

    /**
     * Nom complet de l'agriculteur (dénormalisé pour éviter les appels inter-modules).
     */
    @Column(name = "agriculteur_nom", length = 200)
    private String agriculteurNom;

    /**
     * Cultures principales de l'agriculteur (ex: "Cacao, Café, Maïs").
     */
    @Column(name = "cultures", length = 300)
    private String cultures;

    /**
     * Localisation de l'agriculteur.
     */
    @Column(name = "localisation", length = 200)
    private String localisation;

    /**
     * Dernière évolution / diagnostic notable (mis à jour manuellement par l'agronome).
     */
    @Column(name = "dernier_diagnostic", length = 1000)
    private String dernierDiagnostic;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private StatutSuivi statut = StatutSuivi.EN_ATTENTE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum StatutSuivi {
        EN_ATTENTE,  // L'agriculteur a demandé à être suivi
        ACCEPTE,     // L'agronome a accepté — suivi actif
        REFUSE       // L'agronome a refusé la demande
    }
}
