package ai.certainty.config;

import com.azure.security.keyvault.secrets.SecretClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import javax.sql.DataSource;

@Configuration
@Slf4j
public class DatabaseConfig {

    @Value("${maindb.name}")
    private String mainDbSecretName;

    @Value("${maindb.username}")
    private String mainDbUserSecretName;

    @Value("${maindb.password}")
    private String mainDbPassSecretName;

    @Value("${maindb.endpoint}")
    private String mainDbEndpointSecretName;

    @Value("${maindb.port:5432}")
    private int mainDbPort;

    private final SecretClient secretClient;

    public DatabaseConfig(SecretClient secretClient) {
        this.secretClient = secretClient;
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");

        // Get actual secret values from Key Vault using configured secret names
        String dbName = getSecretValue(mainDbSecretName, "Database name");
        String username = getSecretValue(mainDbUserSecretName, "Username");
        String password = getSecretValue(mainDbPassSecretName, "Password");
        String endpoint = getSecretValue(mainDbEndpointSecretName, "Endpoint");

        String url = String.format("jdbc:postgresql://%s:%d/%s", endpoint, mainDbPort, dbName);
        
        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        
        log.info("Main database connection configured successfully");
        return dataSource;
    }

    private String getSecretValue(String secretName, String description) {
        try {
            String value = secretClient.getSecret(secretName).getValue();
            if (value == null || value.isBlank()) {
                throw new IllegalStateException(description + " secret is empty");
            }
            return value;
        } catch (Exception e) {
            log.error("Failed to retrieve {} secret '{}' from Key Vault: {}", 
                     description, secretName, e.getMessage());
            throw new RuntimeException("Database configuration failed - missing " + description, e);
        }
    }
}