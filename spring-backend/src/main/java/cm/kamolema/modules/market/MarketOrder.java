package cm.kamolema.modules.market;

/**
 * Commande passée par un client sur un produit proposé.
 */
public record MarketOrder(
        String id,
        String productId,
        String productName,
        String farmerName,
        String buyerName,
        String buyerPhone,
        int quantity,
        long total,
        String deliveryMode,
        String message,
        String status) {
}
