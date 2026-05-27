package cm.agroplatform.agronomes.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un ingénieur agronome inscrit sur AgroPlatform.
 */
@Entity
@Table(name = "agronomes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agronome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Identité ---
    @NotBlank
    @Column(nullable = false, length = 100)
    private String nom;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String prenom;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 20)
    private String telephone;

    @Column(length = 500)
    private String bio;

    @Column(name = "photo_url", length = 300)
    private String photoUrl;

    // --- Expertise ---
    @NotBlank
    @Column(nullable = false, length = 150)
    private String specialite;

    @Min(0)
    @Column(name = "annees_experience", nullable = false)
    private Integer anneesExperience;

    // --- Localisation ---
    @NotBlank
    @Column(nullable = false, length = 100)
    private String ville;

    @Column(length = 100)
    private String departement;

    @Column(length = 100)
    private String region;

    /**
     * Latitude GPS — utilisée par HaversineService pour le calcul de distance.
     */
    @NotNull
    @DecimalMin("-90.0") @DecimalMax("90.0")
    @Column(nullable = false)
    private Double latitude;

    /**
     * Longitude GPS — mise à jour en temps réel via Google Maps.
     */
    @NotNull
    @DecimalMin("-180.0") @DecimalMax("180.0")
    @Column(nullable = false)
    private Double longitude;

    /**
     * Dernière mise à jour de la position GPS (temps réel).
     */
    @Column(name = "position_updated_at")
    private LocalDateTime positionUpdatedAt;

    // --- Disponibilité ---
    @Builder.Default
    @Column(nullable = false)
    private Boolean disponible = true;

    // --- Notation ---
    @Builder.Default
    @DecimalMin("0.0") @DecimalMax("5.0")
    @Column(name = "note_moyenne", nullable = false)
    private Double noteMoyenne = 0.0;

    @Builder.Default
    @Column(name = "nombre_evaluations", nullable = false)
    private Integer nombreEvaluations = 0;

    // --- Relations ---
    @OneToMany(mappedBy = "agronome", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DisponibiliteSlot> disponibilites = new ArrayList<>();

    @OneToMany(mappedBy = "agronome", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EvaluationAgronome> evaluations = new ArrayList<>();

    // --- Audit ---
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- Méthode utilitaire pour recalculer la note ---
    public void ajouterEvaluation(double note) {
        double total = this.noteMoyenne * this.nombreEvaluations + note;
        this.nombreEvaluations++;
        this.noteMoyenne = Math.round((total / this.nombreEvaluations) * 10.0) / 10.0;
    }
}
