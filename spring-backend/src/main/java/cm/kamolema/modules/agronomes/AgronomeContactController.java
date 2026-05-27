package cm.kamolema.modules.agronomes;

import cm.kamolema.common.ApiResponse;
import cm.kamolema.modules.mail.MailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agronomes")
public class AgronomeContactController {
    private final MailService mailService;

    public AgronomeContactController(MailService mailService) {
        this.mailService = mailService;
    }

    @PostMapping("/contact")
    public ResponseEntity<ApiResponse> contact(@RequestBody AgronomeContactRequest request) {
        mailService.sendAgronomeContact(request);
        return ResponseEntity.ok(new ApiResponse("Email envoye avec succes a l'agronome."));
    }
}
