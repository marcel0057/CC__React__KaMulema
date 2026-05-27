package cm.agroplatform.agronomes.dto.slot;

import cm.agroplatform.agronomes.entity.DisponibiliteSlot;
import cm.agroplatform.agronomes.entity.DisponibiliteSlot.StatutSlot;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

// ===== Réservation d'un créneau par l'agriculteur =====
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class ReservationDTO {

    @NotNull
    private Long slotId;

    @NotNull
    private Long agriculteurId;

    private String notesAgriculteur;
}

// ===== Confirmation ou refus par l'agronome =====
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class ReponseAgronomeDTO {

    @NotNull
    private Long slotId;

    @NotNull
    private StatutSlot statut;  // CONFIRME ou REFUSE

    private String notesAgronome;
}

// ===== DTO de réponse renvoyé au client =====
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SlotReponseDTO {

    private Long id;
    private Long agronomeId;
    private String agronomeNomComplet;
    private Long agriculteurId;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private StatutSlot statut;
    private String notesAgriculteur;
    private String notesAgronome;
    private LocalDateTime createdAt;

    public static SlotReponseDTO from(DisponibiliteSlot s) {
        return SlotReponseDTO.builder()
            .id(s.getId())
            .agronomeId(s.getAgronome().getId())
            .agronomeNomComplet(s.getAgronome().getPrenom() + " " + s.getAgronome().getNom())
            .agriculteurId(s.getAgriculteurId())
            .dateDebut(s.getDateDebut())
            .dateFin(s.getDateFin())
            .statut(s.getStatut())
            .notesAgriculteur(s.getNotesAgriculteur())
            .notesAgronome(s.getNotesAgronome())
            .createdAt(s.getCreatedAt())
            .build();
    }
}
