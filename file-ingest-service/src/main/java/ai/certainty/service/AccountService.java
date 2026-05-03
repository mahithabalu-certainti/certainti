package ai.certainty.service;

import ai.certainty.model.Account;
import ai.certainty.model.AccountFileDropConfig;

import java.util.List;
import java.util.Optional;


public interface AccountService {
    
    List<Account> getSftpEnabledAccounts();
    
    Optional<AccountFileDropConfig> getAccountFileDropConfig(String configId);
    
    String getCredentials(String credentialKeyId);
}