package ai.certainty.repository;
import ai.certainty.model.AccountFileDropConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface AccountFileDropConfigRepository extends JpaRepository<AccountFileDropConfig, String> {
    
    Optional<AccountFileDropConfig> findByRid(String rid);
}