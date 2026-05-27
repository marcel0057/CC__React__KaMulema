package cm.kamolema.modules.market;

import java.util.List;

public record Product(
        String id,
        String name,
        String farmer,
        String region,
        String city,
        int price,
        String unit,
        int quantity,
        int minOrder,
        String deliveryDelay,
        List<String> paymentModes,
        String quality,
        String category,
        boolean certified,
        boolean loyalPriority
) {
}
