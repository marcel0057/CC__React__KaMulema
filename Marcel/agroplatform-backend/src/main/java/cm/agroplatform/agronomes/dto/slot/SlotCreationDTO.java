package cm.agroplatform.agronomes.dto.slot;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

// =========================================================
// DTOs — Disponibilités & Rendez-vous
// =========================================================

/**
 * Création d'un créneau par l'agronome.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SlotCreationDTO {

    @NotNull
    private Long agronomeId;

    @NotNull
    @Future(message = "La date de début doit être dans le futur")
    private LocalDateTime dateDebut;

    @NotNull
    private LocalDateTime dateFin;
}
