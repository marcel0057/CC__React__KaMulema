package cm.kamolema.modules.market;

import java.util.List;

/**
 * Offre de produit proposée par un agriculteur.
 */
public record ProductProposal(
        String id,
        String farmerName,
        String farmerPhone,
        String name,
        String category,
        String unit,
        int quantity,
        int minOrder,
        int price,
        String quality,
        String deliveryDelay,
        List<String> paymentModes,
        String region,
        String city) {
}
