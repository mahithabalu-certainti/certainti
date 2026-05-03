package ai.certainty.model;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;


@Data
@Entity
@Table(name = "account_file_drop_config",schema ="trd365")
public class AccountFileDropConfig {
    
    @Id
    @Column(name = "rid")
    private String rid;
    
    @Column(name = "account_id")
    private String accountId;
    
    @Column(name = "drop_medium")
    private String dropMedium;
    
    @Column(name = "cron_expression")
    private String cronExpression;
    
    @Column(name = "url")
    private String url;
    
    @Column(name = "port")
    private Integer port;
    
    @Column(name = "base_folder_path")
    private String baseFolderPath;
    
    @Column(name = "credential_key_id")
    private String credentialKeyId;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "created_datetime")
    private LocalDateTime createdDatetime;
    
    @Column(name = "created_by")
    private String createdBy;
}