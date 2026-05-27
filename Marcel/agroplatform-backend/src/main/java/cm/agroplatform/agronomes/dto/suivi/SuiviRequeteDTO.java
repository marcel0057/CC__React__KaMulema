package cm.agroplatform.agronomes.dto.suivi;

import jakarta.validation.constraints.NotNull;
import lombok.*;

// =========================================================
// DTOs — Suivi des agriculteurs
// =========================================================

/**
 * Demande de suivi envoyée par un agriculteur.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuiviRequeteDTO {

    @NotNull
    private Long agronomeId;

    @NotNull
    private Long agriculteurId;

    private String agriculteurNom;
    private String cultures;
    private String localisation;
}
