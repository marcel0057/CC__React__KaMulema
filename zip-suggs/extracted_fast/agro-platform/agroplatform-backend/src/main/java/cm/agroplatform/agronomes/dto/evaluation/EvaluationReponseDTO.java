package cm.agroplatform.agronomes.dto.evaluation;

import cm.agroplatform.agronomes.entity.EvaluationAgronome;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Réponse renvoyée après soumission ou pour l'affichage public des évaluations.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationReponseDTO {

    private Long id;
    private Long agronomeId;
    private Long agriculteurId;
    private Long slotId;
    private Integer note;
    private String commentaire;
    private LocalDateTime createdAt;

    public static EvaluationReponseDTO from(EvaluationAgronome e) {
        return EvaluationReponseDTO.builder()
            .id(e.getId())
            .agronomeId(e.getAgronome().getId())
            .agriculteurId(e.getAgriculteurId())
            .slotId(e.getSlotId())
            .note(e.getNote())
            .commentaire(e.getCommentaire())
            .createdAt(e.getCreatedAt())
            .build();
    }
}
