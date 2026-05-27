package cm.agroplatform.agronomes.dto.suivi;

import cm.agroplatform.agronomes.entity.SuiviAgriculteur;
import cm.agroplatform.agronomes.entity.SuiviAgriculteur.StatutSuivi;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

// =========================================================
// DTOs — Suivi des agriculteurs
// =========================================================

/**
 * Demande de suivi envoyée par un agriculteur.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SuiviRequeteDTO {

    @NotNull
    private Long agronomeId;

    @NotNull
    private Long agriculteurId;

    private String agriculteurNom;
    private String cultures;
    private String localisation;
}
