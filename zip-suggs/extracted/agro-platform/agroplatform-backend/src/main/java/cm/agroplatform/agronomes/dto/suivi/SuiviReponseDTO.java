package cm.agroplatform.agronomes.dto.suivi;

import cm.agroplatform.agronomes.entity.SuiviAgriculteur;
import cm.agroplatform.agronomes.entity.SuiviAgriculteur.StatutSuivi;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SuiviReponseDTO {

    private Long id;
    private Long agronomeId;
    private Long agriculteurId;
    private String agriculteurNom;
    private String cultures;
    private String localisation;
    private String dernierDiagnostic;
    private StatutSuivi statut;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SuiviReponseDTO from(SuiviAgriculteur s) {
        return SuiviReponseDTO.builder()
            .id(s.getId())
            .agronomeId(s.getAgronome().getId())
            .agriculteurId(s.getAgriculteurId())
            .agriculteurNom(s.getAgriculteurNom())
            .cultures(s.getCultures())
            .localisation(s.getLocalisation())
            .dernierDiagnostic(s.getDernierDiagnostic())
            .statut(s.getStatut())
            .createdAt(s.getCreatedAt())
            .updatedAt(s.getUpdatedAt())
            .build();
    }
}
