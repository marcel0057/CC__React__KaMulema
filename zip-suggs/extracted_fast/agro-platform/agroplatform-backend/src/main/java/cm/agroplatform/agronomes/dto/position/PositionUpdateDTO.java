package cm.agroplatform.agronomes.dto.position;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Payload envoyé par l'agronome pour mettre à jour sa position GPS.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PositionUpdateDTO {

    @NotNull
    @DecimalMin("-90.0") @DecimalMax("90.0")
    private Double latitude;

    @NotNull
    @DecimalMin("-180.0") @DecimalMax("180.0")
    private Double longitude;
}
