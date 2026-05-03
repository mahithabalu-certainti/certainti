package ai.certainty.config;

import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
@Slf4j
public class AzureConfig {

    @Value("${azure.blob.connection-string}")
    private String connectionStringSecretName;
    
    @Autowired
    private SecretClient secretClient;

    @Bean(name = "blobServiceClient")
    public BlobServiceClient blobServiceClient() {
        if (!StringUtils.hasText(connectionStringSecretName)) {
            throw new IllegalArgumentException("Azure Blob connection string secret name must be configured");
        }

        try {
            String connectionString = secretClient.getSecret(connectionStringSecretName).getValue();
            
            if (!StringUtils.hasText(connectionString)) {
                throw new IllegalStateException("Empty Azure Blob connection string retrieved from Key Vault");
            }
            
            log.info("Successfully retrieved Azure Blob connection string from Key Vault");
            return new BlobServiceClientBuilder()
                    .connectionString(connectionString)
                    .buildClient();
            
        } catch (Exception e) {
            log.error("Failed to retrieve Azure Blob connection string from Key Vault using secret name '{}'", 
                     connectionStringSecretName, e);
            throw new RuntimeException("Failed to initialize Azure Blob Service Client", e);
        }
    }
}