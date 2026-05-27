package cm.kamolema.modules.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {
    @Value("${plant.id.api-key:}")
    private String plantIdApiKey;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "ok", true,
                "plantIdConfigured", !plantIdApiKey.isBlank(),
                "mailConfigured", !mailUsername.isBlank()
        );
    }
}
