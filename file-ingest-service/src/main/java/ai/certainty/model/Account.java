package ai.certainty.model;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "account",schema ="trd365")
public class Account {
    
    @Id
    @Column(name = "rid")
    private String rid;
    
    @Column(name = "r_number")
    private String rNumber;
    
    @Column(name = "account_name")
    private String accountName;
    
    @Column(name = "comments")
    private String comments;
    
    @Column(name = "eid")
    private String eid;
    
    @Column(name = "status_rid")
    private String status;
    
    @Column(name = "is_parent")
    private Boolean isParent;
    
    @Column(name = "annual_revenue")
    private String annualRevenue;
    
    @Column(name = "region_rid")
    private String region;
    
    @Column(name = "storage_type")
    private String storageType;
    
    @Column(name = "parent_account_rid")
    private String parentAccountRid;
    
    @Column(name = "database_connection_rid")
    private String databaseConnectionRid;
    
    @Column(name = "country_rid")
    private String countryRid;
    
    @Column(name = "currency_rid")
    private String currencyRid;
    
    @Column(name = "industry_rid")
    private String industryRid;
    
    @Column(name = "industry_name_other")
    private String industryNameOther;
    
    @Column(name = "is_file_drop_enabled")
    private Boolean isFileDropEnabled;
    
    @Column(name = "file_drop_medium")
    private String fileDropMedium;
    
    @Column(name = "file_drop_config_id")
    private String fileDropConfigId;
    
    @Column(name = "created_datetime")
    private LocalDateTime createdDatetime;
    
    @Column(name = "modified_datetime")
    private LocalDateTime modifiedDatetime;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(name = "modified_by")
    private String modifiedBy;
}