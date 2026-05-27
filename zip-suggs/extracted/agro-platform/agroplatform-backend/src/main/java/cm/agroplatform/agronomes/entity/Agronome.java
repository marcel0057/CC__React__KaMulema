package cm.agroplatform.agronomes.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @NotBlank
    @Column(nullable = false, length = 150)
    private String specialite;

    @Min(0)
    @Column(name = "annees_experience", nullable = false)
    private Integer anneesExperience;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String ville;

    @Column(length = 100)
    private String departement;

    @Column(length = 100)
    private String region;

    @NotNull
    @DecimalMin("-90.0") @DecimalMax("90.0")
    @Column(nullable = false)
    private Double latitude;

    @NotNull
    @DecimalMin("-180.0") @DecimalMax("180.0")
    @Column(nullable = false)
    private Double longitude;

    @Column(name = "position_updated_at")
    private LocalDateTime positionUpdatedAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean disponible = true;

    @Builder.Default
    @DecimalMin("0.0") @DecimalMax("5.0")
    @Column(name = "note_moyenne", nullable = false)
    private Double noteMoyenne = 0.0;

    @Builder.Default
    @Column(name = "nombre_evaluations", nullable = false)
    private Integer nombreEvaluations = 0;

    @JsonIgnore
    @OneToMany(mappedBy = "agronome", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DisponibiliteSlot> disponibilites = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "agronome", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EvaluationAgronome> evaluations = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void ajouterEvaluation(double note) {
        double total = this.noteMoyenne * this.nombreEvaluations + note;
        this.nombreEvaluations++;
        this.noteMoyenne = Math.round((total / this.nombreEvaluations) * 10.0) / 10.0;
    }
}