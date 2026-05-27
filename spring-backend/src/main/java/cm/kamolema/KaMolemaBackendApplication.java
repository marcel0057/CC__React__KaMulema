package cm.kamolema;

import cm.kamolema.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class KaMolemaBackendApplication {
    public static void main(String[] args) {
        DotenvLoader.load();
        SpringApplication.run(KaMolemaBackendApplication.class, args);
    }
}
