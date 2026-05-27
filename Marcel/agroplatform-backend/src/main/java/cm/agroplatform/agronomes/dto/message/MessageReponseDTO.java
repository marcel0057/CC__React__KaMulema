package cm.agroplatform.agronomes.dto.message;

import cm.agroplatform.agronomes.entity.Message;
import cm.agroplatform.agronomes.entity.Message.Expediteur;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Message renvoyé au client (via WebSocket ou REST).
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageReponseDTO {

    private Long id;
    private Long agriculteurId;
    private Long agronomeId;
    private String agronomeNomComplet;
    private Expediteur expediteur;
    private String contenu;
    private Boolean lu;
    private LocalDateTime createdAt;

    public static MessageReponseDTO from(Message m) {
        return MessageReponseDTO.builder()
            .id(m.getId())
            .agriculteurId(m.getAgriculteurId())
            .agronomeId(m.getAgronome().getId())
            .agronomeNomComplet(m.getAgronome().getPrenom() + " " + m.getAgronome().getNom())
            .expediteur(m.getExpediteur())
            .contenu(m.getContenu())
            .lu(m.getLu())
            .createdAt(m.getCreatedAt())
            .build();
    }
}
