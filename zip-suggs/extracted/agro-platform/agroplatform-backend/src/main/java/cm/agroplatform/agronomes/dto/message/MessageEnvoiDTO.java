package cm.agroplatform.agronomes.dto.message;

import cm.agroplatform.agronomes.entity.Message.Expediteur;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;


// =========================================================
// DTOs — Messagerie
// =========================================================

/**
 * Payload envoyé via WebSocket par le client pour envoyer un message.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageEnvoiDTO {

    @NotNull
    private Long agronomeId;

    @NotNull
    private Long agriculteurId;

    @NotNull
    private Expediteur expediteur;

    @NotBlank
    @Size(max = 2000)
    private String contenu;
}
