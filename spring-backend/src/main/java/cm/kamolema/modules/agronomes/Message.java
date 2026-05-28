package cm.kamolema.modules.agronomes;

/**
 * Message échangé entre un agriculteur et un agronome.
 */
public record Message(
                String id,
                String agriculteurId, // user name can be used as id for simplification in this mock
                String agronomeId,
                String expediteur, // "AGRICULTEUR" ou "AGRONOME"
                String contenu,
                boolean lu,
                String createdAt) {
}
