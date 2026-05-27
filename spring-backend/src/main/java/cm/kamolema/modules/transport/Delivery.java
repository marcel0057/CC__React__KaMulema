package cm.kamolema.modules.transport;

public record Delivery(
        String id,
        String product,
        String transporter,
        String from,
        String to,
        String status,
        int progress,
        String eta,
        int cost,
        int distance
) {
}
