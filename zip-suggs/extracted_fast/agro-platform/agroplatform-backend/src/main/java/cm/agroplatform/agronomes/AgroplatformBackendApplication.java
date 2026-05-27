package cm.agroplatform.agronomes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import cm.agroplatform.agronomes.config.AppProperties;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties(AppProperties.class)
public class AgroplatformBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AgroplatformBackendApplication.class, args);
    }
}
