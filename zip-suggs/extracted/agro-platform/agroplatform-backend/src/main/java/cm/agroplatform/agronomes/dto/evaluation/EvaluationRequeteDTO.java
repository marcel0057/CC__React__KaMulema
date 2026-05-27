package cm.agroplatform.agronomes.dto.evaluation;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Requête envoyée par l'agriculteur pour soumettre une évaluation.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationRequeteDTO {

    @NotNull(message = "L'ID de l'agronome est obligatoire")
    private Long agronomeId;

    @NotNull(message = "L'ID de l'agriculteur est obligatoire")
    private Long agriculteurId;

    @NotNull(message = "L'ID du slot est obligatoire")
    private Long slotId;

    @NotNull(message = "La note est obligatoire")
    @Min(value = 1, message = "La note minimale est 1")
    @Max(value = 5, message = "La note maximale est 5")
    private Integer note;

    @Size(max = 1000, message = "Le commentaire ne peut pas dépasser 1000 caractères")
    private String commentaire;
}
