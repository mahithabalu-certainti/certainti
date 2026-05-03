package ai.certainty.config;
import com.azure.identity.DefaultAzureCredential;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.SecretClientBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class AzureKeyVaultConfig {
    
    @Value("${azure.keyvault.uri}")
    private String keyVaultUri;
    
    @Bean
    public SecretClient secretClient() {
        try {
            DefaultAzureCredential credential = new DefaultAzureCredentialBuilder().build();
            log.info("Authenticated to Azure using DefaultAzureCredential");
            
            return new SecretClientBuilder()
                    .vaultUrl(keyVaultUri)
                    .credential(credential)
                    .buildClient();
        } catch (Exception e) {
            log.error("Failed to authenticate to Azure Key Vault : {}", e.getMessage(), e);
            throw e;
        }
    }
}