package cm.kamolema.modules.agronomes;

public record AgronomeContactRequest(
        String agronomeName,
        String agronomeEmail,
        String type,
        String senderName,
        String senderEmail,
        String message,
        String date,
        String time,
        String meetingMode
) {
}
