package cm.kamolema.modules.agronomes;

/**
 * Créneau de disponibilité d'un agronome.
 */
public record DisponibiliteSlot(
                String id,
                String agronomeId,
                String dateDebut,
                String dateFin,
                String statut, // "LIBRE", "RESERVE"
                String notesAgriculteur) {
}
