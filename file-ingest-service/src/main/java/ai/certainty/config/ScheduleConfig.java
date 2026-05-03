package ai.certainty.config;

import com.azure.security.keyvault.secrets.SecretClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class ScheduleConfig {

    private final SecretClient secretClient;
    
    @Value("${schedule.cron.secret-name}")
    private String cronSecretName;

    public ScheduleConfig(SecretClient secretClient) {
        this.secretClient = secretClient;
    }
    
    /**
     * Retrieves the cron expression from Azure Key Vault
     * @return The cron expression as a String
     */
    @Bean
    public String getCronExpressionFromKeyVault() {
        try {
            // Retrieve the secret from Azure Key Vault using configured name
            String cronExpression = secretClient.getSecret(cronSecretName).getValue();
            log.info("Retrieved cron expression '{}' from Azure Key Vault", cronSecretName);
            return cronExpression;
        } catch (Exception e) {
            log.error("Error retrieving cron expression '{}' from Azure Key Vault: {}", 
                     cronSecretName, e.getMessage(), e);
            // Default cron expression if retrieval fails (midnight every day)
            return "0 0 0 * * ?";
        }
    }
}