package cm.kamolema.modules.mail;

import cm.kamolema.modules.agronomes.AgronomeContactRequest;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class MailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${ka-molema.mail.from:}")
    private String mailFrom;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendAgronomeContact(AgronomeContactRequest request) {
        if (!StringUtils.hasText(mailUsername) || !StringUtils.hasText(mailFrom)) {
            throw new IllegalStateException("Configuration mail absente.");
        }
        try {
            boolean appointment = "appointment".equalsIgnoreCase(request.type());
            String subject = appointment
                    ? "KA MOLEMA - Demande de rendez-vous avec " + value(request.senderName())
                    : "KA MOLEMA - Nouveau message de " + value(request.senderName());

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom("KA MOLEMA <" + mailFrom + ">");
            helper.setTo(request.agronomeEmail());
            helper.setReplyTo(request.senderEmail());
            helper.setSubject(subject);
            helper.setText(buildText(request, appointment), buildHtml(request, appointment));
            mailSender.send(message);
        } catch (Exception exception) {
            throw new IllegalStateException("Impossible d'envoyer le mail pour le moment.", exception);
        }
    }

    private String buildText(AgronomeContactRequest request, boolean appointment) {
        return """
                Bonjour %s,

                %s

                %s
                Nom : %s
                Email : %s

                Message envoye depuis KA MOLEMA.
                """.formatted(
                value(request.agronomeName()),
                value(request.message(), "Un utilisateur souhaite echanger avec vous via KA MOLEMA."),
                appointment ? "Date souhaitee : " + value(request.date(), "A preciser") + "\nMoment : " + value(request.time(), "A preciser") + "\nType : " + value(request.meetingMode(), "A preciser") + "\n" : "",
                value(request.senderName()),
                value(request.senderEmail())
        );
    }

    private String buildHtml(AgronomeContactRequest request, boolean appointment) {
        String appointmentRows = appointment ? """
                <tr><td style="padding:10px 0;color:#745f47;font-weight:700;">Date souhaitee</td><td style="padding:10px 0;color:#3e2c1b;text-align:right;">%s</td></tr>
                <tr><td style="padding:10px 0;color:#745f47;font-weight:700;">Moment</td><td style="padding:10px 0;color:#3e2c1b;text-align:right;">%s</td></tr>
                <tr><td style="padding:10px 0;color:#745f47;font-weight:700;">Type</td><td style="padding:10px 0;color:#3e2c1b;text-align:right;">%s</td></tr>
                """.formatted(escape(value(request.date(), "A preciser")), escape(value(request.time(), "A preciser")), escape(value(request.meetingMode(), "A preciser"))) : "";

        return """
                <!doctype html><html lang="fr"><body style="margin:0;background:#f4efe3;font-family:Arial,Helvetica,sans-serif;color:#3e2c1b;">
                <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
                <div style="height:7px;background:linear-gradient(90deg,#1f6b3a 0 33%%,#c7362f 33%% 66%%,#f2bd2f 66%% 100%%);border-radius:8px 8px 0 0;"></div>
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#fffaf2;border:1px solid #e1caa7;border-top:0;border-radius:0 0 8px 8px;box-shadow:0 18px 45px rgba(62,44,27,.14);overflow:hidden;">
                <tr><td style="padding:26px 28px;background:#174d2d;color:white;">
                <div style="font-size:13px;font-weight:800;color:#f2bd2f;text-transform:uppercase;">KA MOLEMA</div>
                <h1 style="margin:6px 0 0;font-size:26px;line-height:1.15;color:white;">%s</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,.82);">Plateforme agricole intelligente du Cameroun</p>
                </td></tr>
                <tr><td style="padding:28px;">
                <span style="display:inline-block;background:#e8f3df;color:#174d2d;border:1px solid #b7d5a6;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:900;">%s</span>
                <h2 style="margin:18px 0 8px;font-size:20px;color:#174d2d;">Bonjour %s,</h2>
                <p style="margin:0 0 18px;color:#745f47;line-height:1.65;">Vous avez reçu une demande depuis KA MOLEMA.</p>
                <div style="background:#fffdf7;border:1px solid #e1caa7;border-radius:8px;padding:16px;margin:18px 0;">
                <p style="margin:0;color:#3e2c1b;line-height:1.7;">%s</p>
                </div>
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #e1caa7;border-bottom:1px solid #e1caa7;margin:18px 0;">
                %s
                <tr><td style="padding:10px 0;color:#745f47;font-weight:700;">Demandeur</td><td style="padding:10px 0;color:#3e2c1b;text-align:right;">%s</td></tr>
                <tr><td style="padding:10px 0;color:#745f47;font-weight:700;">Email de réponse</td><td style="padding:10px 0;text-align:right;"><a href="mailto:%s" style="color:#1f6b3a;font-weight:800;">%s</a></td></tr>
                </table>
                <p style="margin:18px 0 0;color:#745f47;line-height:1.6;">Vous pouvez répondre directement à cet email.</p>
                </td></tr>
                <tr><td style="padding:16px 28px;background:#f7ead4;color:#745f47;font-size:12px;">Message automatique envoyé par KA MOLEMA.</td></tr>
                </table></div></body></html>
                """.formatted(
                appointment ? "Rendez-vous agronomique" : "Contact agronome",
                appointment ? "Demande de rendez-vous" : "Nouveau message",
                escape(value(request.agronomeName())),
                escape(value(request.message(), "Un utilisateur souhaite echanger avec vous via KA MOLEMA.")).replace("\n", "<br>"),
                appointmentRows,
                escape(value(request.senderName())),
                escape(value(request.senderEmail())),
                escape(value(request.senderEmail()))
        );
    }

    private String value(String value) {
        return value(value, "");
    }

    private String value(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#039;");
    }
}
