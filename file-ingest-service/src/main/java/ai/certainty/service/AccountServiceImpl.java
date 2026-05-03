package ai.certainty.service;

import com.azure.security.keyvault.secrets.SecretClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ai.certainty.model.Account;
import ai.certainty.model.AccountFileDropConfig;
import ai.certainty.repository.AccountFileDropConfigRepository;
import ai.certainty.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountServiceImpl implements AccountService {
    
    private final AccountRepository accountRepository;
    private final AccountFileDropConfigRepository configRepository;
    private final SecretClient secretClient;
    private final ObjectMapper objectMapper;
    
    @Override
    public List<Account> getSftpEnabledAccounts() {
        return accountRepository.findSftpEnabledAccounts();
    }
    
    @Override
    public Optional<AccountFileDropConfig> getAccountFileDropConfig(String configId) {
        return configRepository.findByRid(configId);
    }
    
    @Override
    public String getCredentials(String credentialKeyId) {
        try {
            // Retrieve the secret from Azure Key Vault
            String secretValue = secretClient.getSecret(credentialKeyId).getValue();
            log.info("Retrieved secret value: {}", secretValue);
            
            // Check if the secret value is a JSON string that needs to be unescaped
            if (secretValue.startsWith("\"") && secretValue.endsWith("\"")) {
                // Remove the outer quotes and unescape the inner content
                secretValue = secretValue.substring(1, secretValue.length() - 1);
                // Further unescape the JSON string if needed
                secretValue = secretValue.replace("\\\"", "\"");
                log.debug("Unescaped secret value for parsing: {}", secretValue);
            }
            
            // Log the secret value structure (without exposing actual credentials)
            log.debug("Retrieved secret for key: {}, JSON structure valid: {}", 
                    credentialKeyId, 
                    secretValue != null && secretValue.contains("{"));
            
            // Parse the JSON string to extract username and password
            JsonNode credentialsJson = objectMapper.readTree(secretValue);
            
            // Check if the expected fields exist
            if (credentialsJson.has("Username") && credentialsJson.has("Password")) {
                String username = credentialsJson.get("Username").asText();
                String password = credentialsJson.get("Password").asText();
                return username + ":" + password;
            } else {
                // Log available fields to help diagnose the issue
                StringBuilder availableFields = new StringBuilder();
                credentialsJson.fieldNames().forEachRemaining(field -> 
                    availableFields.append(field).append(", "));
                
                log.error("Credential JSON missing required fields. Available fields: {}", 
                        availableFields.toString());
                throw new RuntimeException("Credential JSON missing required username/password fields");
            }
        } catch (Exception e) {
            log.error("Error retrieving credentials from Azure Key Vault: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve SFTP credentials", e);
        }
    }
}