package ai.certainty.repository;

import ai.certainty.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    
    @Query("SELECT a FROM Account a WHERE a.isFileDropEnabled = true AND a.fileDropMedium = 'SFTP'")
    List<Account> findSftpEnabledAccounts();
}
