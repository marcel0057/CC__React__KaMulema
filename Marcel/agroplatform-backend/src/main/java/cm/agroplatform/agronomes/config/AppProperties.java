package cm.agroplatform.agronomes.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();
    private final Websocket websocket = new Websocket();
    private final Google google = new Google();
    private final Suivi suivi = new Suivi();

    public Jwt getJwt() { return jwt; }
    public Cors getCors() { return cors; }
    public Websocket getWebsocket() { return websocket; }
    public Google getGoogle() { return google; }
    public Suivi getSuivi() { return suivi; }

    public static class Jwt {
        private String secret;
        private long expirationMs;
        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getExpirationMs() { return expirationMs; }
        public void setExpirationMs(long expirationMs) { this.expirationMs = expirationMs; }
    }

    public static class Cors {
        private String allowedOrigins;
        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }

    public static class Websocket {
        private String allowedOrigins;
        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }

    public static class Google {
        private Maps maps = new Maps();
        public Maps getMaps() { return maps; }

        public static class Maps {
            private String apiKey;
            public String getApiKey() { return apiKey; }
            public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        }
    }

    public static class Suivi {
        private int maxAgriculteurs = 4;
        public int getMaxAgriculteurs() { return maxAgriculteurs; }
        public void setMaxAgriculteurs(int maxAgriculteurs) { this.maxAgriculteurs = maxAgriculteurs; }
    }
}
