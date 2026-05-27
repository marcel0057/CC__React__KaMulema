package cm.kamolema.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Value("${ka-molema.cors.allowed-origins}")
    private String allowedOrigins;

    @SuppressWarnings("null")
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        if (allowedOrigins != null) {
            String[] origins = allowedOrigins.split(",");
            registry.addMapping("/api/**")
                    .allowedOrigins(origins)
                    .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                    .allowedHeaders("*");
        }
    }
}
