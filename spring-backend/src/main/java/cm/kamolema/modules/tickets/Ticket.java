package cm.kamolema.modules.tickets;

public record Ticket(
        String id,
        String product,
        String beneficiary,
        String status,
        String qrValue,
        int rating
) {
}
