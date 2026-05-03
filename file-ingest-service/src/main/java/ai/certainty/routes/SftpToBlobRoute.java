package ai.certainty.routes;

import ai.certainty.model.Account;
import ai.certainty.model.AccountFileDropConfig;
import ai.certainty.service.AccountService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.CamelContext;
import org.apache.camel.builder.RouteBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.apache.camel.Exchange;
import org.apache.camel.component.http.HttpMethods;
import org.apache.camel.component.azure.storage.blob.BlobConstants;
import org.apache.commons.io.FilenameUtils;
import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import com.azure.storage.blob.BlobServiceClient;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.Channel;
import java.util.Vector;

import ai.certainty.config.AppConstants;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class SftpToBlobRoute extends RouteBuilder {

    private final AccountService accountService;
    
    @Autowired
    private CamelContext camelContext;

    @Autowired
    private BlobServiceClient blobServiceClient;    
    // Set to track accounts that already have routes created    
    private Map<String, RouteInfo> accountRoutes = new ConcurrentHashMap<>();
    
    @Data
    @AllArgsConstructor
    private static class RouteInfo {
        private String accountId;
        private String accountName;
        private boolean active;
        private Set<String> routeIds; // Track all route IDs for this account
    }
    @Value("${python.api.url}")
    private String pythonApiUrl;
    
    @Value("${document.default.related_to}")
    private String defaultRelatedTo;
    
    @Value("${import.default.uploaded_by_user_rid}")
    private String defaultUploadedByUserRid;
    
    @Value("${sftp.file.types:csv,xlsx,xls}")
    private String defaultFileTypes;

    private List<String> validFileTypes;
    private String azureAccountName;
    
    @Value("${sftp.folders}")
    private String sftpFolders;
    
    @PostConstruct
    public void init() {
        validFileTypes = Arrays.asList(defaultFileTypes.split(","));
        azureAccountName = blobServiceClient.getAccountName();
        log.info("Initialized Azure Blob Storage account : {}", azureAccountName);
    }
    
    @Override
    public void configure() throws Exception {
        onException(Exception.class)
            .maximumRedeliveries(3)
            .redeliveryDelay(5000)
            .log("FAILURE DETECTED: ${exception.message}")
            .handled(true)
            .useOriginalMessage()
            .to("log:failed-transfers?level=ERROR");
            
        refreshRoutes();
    }
    
    /**
     * Scheduled method to check for new SFTP-enabled accounts daily
     * Runs at midnight every day (0 0 0 * * ?)
     */
    @Scheduled(cron = "#{@getCronExpressionFromKeyVault}")
    public void refreshRoutes() {
        try {
            log.info("Checking for new SFTP-enabled accounts...");
            List<Account> sftpAccounts = accountService.getSftpEnabledAccounts();

            Set<String> currentActiveAccountIds = sftpAccounts.stream()
                .map(Account::getRid)
                .collect(Collectors.toSet());

            accountRoutes.keySet().forEach(accountId -> {
                if (!currentActiveAccountIds.contains(accountId)) {
                    deactivateAccountRoutes(accountId);
                }
            });
            
            if (sftpAccounts.isEmpty()) {
                log.warn("No SFTP-enabled accounts found.");
                return;
            }
            
            for (Account account : sftpAccounts) {
                RouteInfo routeInfo = accountRoutes.get(account.getRid());
                if (routeInfo == null) {
                    log.info("Found new SFTP account: {}", account.getAccountName());
                    Set<String> newRouteIds = createSftpRoute(account);
                    accountRoutes.put(account.getRid(),
                        new RouteInfo(account.getRid(), account.getAccountName(), true, new HashSet<>(newRouteIds)));
                    // Explicitly start each new route
                    for (String routeId : newRouteIds) {
                        try {
                            camelContext.getRouteController().startRoute(routeId);
                            log.info("Started route: {}", routeId);
                        } catch (Exception e) {
                            log.error("Failed to start route {}: {}", routeId, e.getMessage());
                        }
                    }
                } else {
                    Optional<AccountFileDropConfig> configOpt = accountService.getAccountFileDropConfig(account.getFileDropConfigId());
                    if (configOpt.isPresent() && "ACTIVE".equals(configOpt.get().getStatus())) {
                        // Always check for new folders, even if route is active
                        Set<String> newRouteIds = createSftpRoute(account);
                        newRouteIds.removeAll(routeInfo.getRouteIds());
                        if (!newRouteIds.isEmpty()) {
                            routeInfo.getRouteIds().addAll(newRouteIds);
                            log.info("Added new routes for account {}: {}", account.getAccountName(), newRouteIds);
                            // Explicitly start each new route
                            for (String routeId : newRouteIds) {
                                try {
                                    camelContext.getRouteController().startRoute(routeId);
                                    log.info("Started route: {}", routeId);
                                } catch (Exception e) {
                                    log.error("Failed to start route {}: {}", routeId, e.getMessage());
                                }
                            }
                        } else {
                            log.info("Account {} is still active, no new folders found.", account.getAccountName());
                        }
                        if (!routeInfo.isActive()) {
                            routeInfo.setActive(true);
                        }
                    } else {
                        log.info("Deactivating routes for account ELSE:  {}", account.getAccountName());
                        deactivateAccountRoutes(account.getRid());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error refreshing routes: {}", e.getMessage(), e);
        }
    }
    private void deactivateAccountRoutes(String accountId) {
        RouteInfo routeInfo = accountRoutes.get(accountId);
        if (routeInfo != null && routeInfo.isActive()) {
            log.info("Deactivating routes for account FUNCTION: {}", routeInfo.getAccountName());
            
            try {
                // Stop and remove all routes for this account
                routeInfo.getRouteIds().forEach(routeId -> {
                    try {
                        camelContext.getRouteController().stopRoute(routeId);
                        camelContext.removeRoute(routeId);
                        log.info("Successfully removed route: {}", routeId);
                    } catch (Exception e) {
                        log.error("Failed to remove route {}: {}", routeId, e.getMessage());
                    }
                });
                
                // Update the route info
                routeInfo.setActive(false);
                routeInfo.getRouteIds().clear();
                
            } catch (Exception e) {
                log.error("Error deactivating routes for account CATCH {}: {}", accountId, e.getMessage());
            }
        }
    }
    
    private Set<String> createSftpRoute(Account account) {
        Set<String> createdRouteIds = new HashSet<>();
        try {
            Optional<AccountFileDropConfig> configOpt = accountService.getAccountFileDropConfig(account.getFileDropConfigId());
            if (!configOpt.isPresent()) {
                log.error("Missing SFTP config for: {}", account.getAccountName());
                return createdRouteIds;
            }

            AccountFileDropConfig config = configOpt.get();
            if (!"ACTIVE".equals(config.getStatus())) {
                log.info("Skipping inactive config: {}", account.getAccountName());
                return createdRouteIds;
            }

            String credentials = accountService.getCredentials(config.getCredentialKeyId());
            String[] credentialParts = credentials.split(":");
            if (credentialParts.length != 2) {
                log.error("Invalid credentials format: {}", account.getAccountName());
                return createdRouteIds;
            }

            String username = credentialParts[0];
            String password = credentialParts[1];
            // Parse URL to get host
            String host = config.getUrl();
            if (host.startsWith("sftp://")) {
                host = host.substring(7);
            }
            if (host.contains(":")) {
                host = host.substring(0, host.indexOf(":"));
            }
            
            // Get base folder path
            String basePath = config.getBaseFolderPath() != null ? config.getBaseFolderPath() : "";
            // Discover year folders dynamically
            String[] yearFolders = listSftpFolders(username, password, host, config.getPort(), basePath);
             List<String> allFolders = new ArrayList<>();
            for (String year : yearFolders) {
            if (sftpFolders != null && !sftpFolders.trim().isEmpty()) {
                for (String folder : sftpFolders.split(",")) {
                    String cleaned = folder.trim();
                    String fullPath = basePath.endsWith("/") ?
                        basePath+ year +"/" + cleaned :
                        basePath + "/" + year + "/" + cleaned;
                    allFolders.add(fullPath);
                }
            } else {
                allFolders.add(basePath + "/" + year);
            }
        }

        log.info("Setting up SFTP polling for account: {}, folders: {}", account.getAccountName(), allFolders);

        // Remove routes for folders that no longer exist
        RouteInfo routeInfo = accountRoutes.get(account.getRid());
        Set<String> existingRouteIds = routeInfo != null ? new HashSet<>(routeInfo.getRouteIds()) : new HashSet<>();
        Set<String> validRouteIds = new HashSet<>();
        for (String folder : allFolders) {
            String safeFolder = folder.replaceAll("[^a-zA-Z0-9]", "-");
            String routeId = "sftp-" + account.getRid() + "-" + safeFolder;
            validRouteIds.add(routeId);
        }
        for (String routeId : existingRouteIds) {
            if (!validRouteIds.contains(routeId)) {
                try {
                    camelContext.getRouteController().stopRoute(routeId);
                    camelContext.removeRoute(routeId);
                    log.info("Stopped and removed route for deleted folder: {}", routeId);
                    if (routeInfo != null) routeInfo.getRouteIds().remove(routeId);
                } catch (Exception e) {
                    log.error("Failed to remove route {}: {}", routeId, e.getMessage());
                }
            }
        }

        for (String folder : allFolders) {
            String safeFolder = folder.replaceAll("[^a-zA-Z0-9]", "-");
            String routeId = "sftp-" + account.getRid() + "-" + safeFolder;
            if (camelContext.getRoute(routeId) != null) {
                log.info("Route already exists: {}", routeId);
                continue;
            }

            log.info("Creating new route {} for folder {}", routeId, folder);

            String sftpUri = buildSftpUri(username, host, config.getPort() != null ? config.getPort() : 22,
                    folder, password, config.getCronExpression());

            camelContext.addRoutes(new RouteBuilder() {
                @Override
                public void configure() throws Exception {
                    from(sftpUri)
                    .routeId(routeId)
                    .description("SFTP Route for account " + account.getAccountName())
                    .setProperty("folder", constant(folder))
                    .log("Processing ${header.CamelFileName} for " + account.getAccountName())
                    // File validation processor
                    .process(exchange -> {
                        String fileName = exchange.getIn().getHeader(Exchange.FILE_NAME, String.class);
                        String subFolder = exchange.getProperty("folder", String.class);
                        String year = extractYearFromPath(subFolder);
                        exchange.setProperty("fiscalYear", year != null ? year : "other");
                        String ext = FilenameUtils.getExtension(fileName).toLowerCase();
                        boolean valid = validFileTypes.contains(ext) && year != null;
                            exchange.setProperty("isValid", valid);
                            exchange.setProperty("failureReason", valid ? "" :
                                (year == null ? "Year not found in path" : "Invalid file type"));
                        })
                        // rest of processors unchanged
                    .process(exchange -> {
                        String sanitizedContainerName = sanitizeContainerName(account.getRNumber());
                        if (!blobServiceClient.getBlobContainerClient(sanitizedContainerName).exists()) {
                            blobServiceClient.createBlobContainer(sanitizedContainerName);
                        }
                        exchange.setProperty("sanitizedContainerName", sanitizedContainerName);
                    })
                    .setHeader(BlobConstants.BLOB_CONTAINER_NAME, simple("${exchangeProperty.sanitizedContainerName}"))
                    .process(exchange -> {
                        boolean isValid = exchange.getProperty("isValid", Boolean.FALSE, Boolean.class);
                        String fileName = exchange.getIn().getHeader(Exchange.FILE_NAME, String.class);
                        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern(AppConstants.TIMESTAMP_FORMAT));
                        String baseName = FilenameUtils.getBaseName(fileName).toLowerCase().replace(" ", "_");
                        String extension = FilenameUtils.getExtension(fileName).toLowerCase();
                        String folderPath = exchange.getProperty("folder", String.class);
                        String folderName = folderPath.contains("/") 
                                            ? folderPath.substring(folderPath.lastIndexOf("/") + 1) 
                                            : folderPath;
                        String blobPath = String.format(
                            isValid ? AppConstants.VALID_BLOB_PATH_FORMAT : AppConstants.INVALID_BLOB_PATH_FORMAT,
                            folderName,
                            baseName,timestamp, extension
                        );
                        String decodedBlobPath = URLDecoder.decode(blobPath, StandardCharsets.UTF_8);
                        exchange.getIn().setHeader(BlobConstants.BLOB_NAME, decodedBlobPath);
                        })
                    .process(exchange -> {
                        InputStream fileContent = exchange.getIn().getBody(InputStream.class);
                        exchange.getIn().setBody(fileContent);
                    })
                    .log("Uploading to Azure container: ${header.CamelAzureStorageBlobContainerName}, blob: ${header.CamelAzureStorageBlobBlobName}")
                    .toD("azure-storage-blob://" + azureAccountName + "/${header.CamelAzureStorageBlobContainerName}"
                            + "?blobServiceClient=#blobServiceClient&operation=uploadBlockBlob")
                    .log("Upload completed")
                    .process(exchange -> {
                        String fileName = exchange.getIn().getHeader(Exchange.FILE_NAME, String.class);
                        boolean isValid = exchange.getProperty("isValid", Boolean.FALSE, Boolean.class);
                        String failureReason = exchange.getProperty("failureReason", String.class);
                        Long fileSize = exchange.getIn().getHeader(Exchange.FILE_LENGTH, 0L, Long.class);
                        String blobName = exchange.getIn().getHeader(BlobConstants.BLOB_NAME, String.class);
                        String blobUrl = constructBlobUrl(account.getRNumber(), blobName);
                        String fiscalYear = exchange.getProperty("fiscalYear", String.class);
                        Map<String, Object> payload = createApiPayload(account, fileName, 
                                isValid, fileSize, blobName, blobUrl, failureReason,fiscalYear);
                        exchange.getIn().setBody(payload);
                    })
                    .marshal().json()
                    .setHeader(Exchange.HTTP_METHOD, constant(HttpMethods.POST))
                    .setHeader(Exchange.CONTENT_TYPE, constant("application/json"))
                        .to(pythonApiUrl + "?bridgeEndpoint=true")
                        .log("Finished processing ${header.CamelFileName}");
                }
            });
            try {
                camelContext.getRouteController().startRoute(routeId);
                log.info("Started route: {}", routeId);
            } catch (Exception e) {
                log.error("Failed to start route {}: {}", routeId, e.getMessage());
            }

            createdRouteIds.add(routeId);
        }
            log.info("Created routes for: {}", account.getAccountName());
        } catch (Exception e) {
            log.error("Error creating route for {}: {}", account.getAccountName(), e.getMessage(), e);
        }
        return createdRouteIds;
    }

     private String extractYearFromPath(String path) {
    if (path == null) return null;
    
    // Split path and look for valid year numbers
    String[] parts = path.split("/");
    for (String part : parts) {
        if (isValidYear(part)) {
            return part;
        }
    }
    return null;
    }

    private boolean isValidYear(String potentialYear) {
    try {
        // Must be exactly 4 digits
        if (!potentialYear.matches("\\d{4}")) {
            return false;
        }
        
        int year = Integer.parseInt(potentialYear);
        
        // Validate reasonable year range (e.g., 2000-2100)
        return year >= 2000 && year <= 2100;
    } catch (NumberFormatException e) {
        return false;
    }
    }

    private String[] listSftpFolders(String username, String password, String host, Integer port, String basePath) {
        try {
            // Create a temporary SFTP client to list folders
            ChannelSftp channelSftp = createSftpChannel(username, password, host, port);
            
            // Change to the base directory
            channelSftp.cd(basePath);
            
            // List all entries in the directory
            Vector<ChannelSftp.LsEntry> entries = channelSftp.ls(".");
            
            // Filter for directories only
            List<String> folders = new ArrayList<>();
            for (ChannelSftp.LsEntry entry : entries) {
                if (entry.getAttrs().isDir() && !entry.getFilename().equals(".") && !entry.getFilename().equals("..")) {
                    folders.add(entry.getFilename());
                }
            }
            
            channelSftp.disconnect();
            return folders.toArray(new String[0]);
            
        } catch (Exception e) {
            log.error("Error listing SFTP folders: {}", e.getMessage());
            return new String[0];
        }
    }

    private ChannelSftp createSftpChannel(String username, String password, String host, Integer port) throws JSchException {
        JSch jsch = new JSch();
        Session session = jsch.getSession(username, host, port != null ? port : 22);
        session.setPassword(password);
        
        // Configure for non-interactive session
        java.util.Properties config = new java.util.Properties();
        config.put("StrictHostKeyChecking", "no");
        session.setConfig(config);
        
        session.connect();
        Channel channel = session.openChannel("sftp");
        channel.connect();
        
        return (ChannelSftp) channel;
    }

    private Map<String, Object> createApiPayload(Account account, String fileName, 
            boolean isValid, Long fileSize, String blobName, String blobUrl, String failureReason,String fiscalYear) {
        Map<String, Object> document = new HashMap<>();
        // Document metadata
        document.put("account_rid", account.getRid().toString());
        document.put("related_to", defaultRelatedTo);
        document.put("related_to_rid", account.getRid().toString());  // Restored field
        document.put("document_source", AppConstants.SFTP_UPLOAD);
        // Use folder name instead of file basename for document_type
        String folderName = blobName.split("/")[0];
        document.put("document_type", folderName);
        document.put("document_format", getFileExtension(fileName).toUpperCase());
        document.put("document_size", fileSize + AppConstants.DOCUMENT_SIZE_UNIT);
        document.put("document_status", isValid ? AppConstants.DOCUMENT_STATUS_PROCESSING 
                : AppConstants.DOCUMENT_STATUS_FAILED);
        document.put("failure_reason", failureReason);  // Restored field
        document.put("document_url", blobUrl);
        document.put("created_by", defaultUploadedByUserRid);
        document.put("modified_by", defaultUploadedByUserRid);  // Restored field
        document.put("fiscal_year", fiscalYear);

        // Document upload metadata
        Map<String, Object> docUpload = new HashMap<>();
        docUpload.put("upload_status", isValid ? AppConstants.DOCUMENT_STATUS_PROCESSING 
                : AppConstants.DOCUMENT_STATUS_FAILED);
        docUpload.put("upload_failure_reason", failureReason);  // Restored field
        docUpload.put("document_name", fileName);
        // Use folder name instead of file basename for entity_type
        docUpload.put("entity_type", folderName);
        docUpload.put("uploaded_by_user_rid", defaultUploadedByUserRid);
        docUpload.put("related_to", defaultRelatedTo);
        docUpload.put("related_to_rid", account.getRid().toString());
        docUpload.put("account_rid", account.getRid().toString());
        docUpload.put("created_by", defaultUploadedByUserRid);
        docUpload.put("fiscal_year", fiscalYear); 
        Map<String, Object> payload = new HashMap<>();
        payload.put("document", document);
        payload.put("import", docUpload);
        return payload;
    }

    private String sanitizeContainerName(String containerName) {
        if (containerName == null) {
            return "default";
        }
    
        // Remove all non-alphanumeric characters, convert to lowercase, and remove spaces
        String sanitized = containerName.trim().toLowerCase()
            .replaceAll("\\s+", "")           // Remove all spaces
            .replaceAll("[^a-z0-9]", "");     // Remove non-alphanumeric characters
    
        // Ensure it starts with a letter or number (Azure requirement)
        if (!sanitized.isEmpty() && !Character.isLetterOrDigit(sanitized.charAt(0))) {
            sanitized = "c" + sanitized;
        }
    
        // Ensure it's between 3-63 characters (Azure requirement)
        if (sanitized.length() < 3) {
            sanitized = sanitized + "container";
        } else if (sanitized.length() > 63) {
            sanitized = sanitized.substring(0, 63);
        }
    
        return sanitized;
    }
    

    private String getFileExtension(String fileName) {
        return fileName.contains(".") ? 
            fileName.substring(fileName.lastIndexOf(".") + 1) : 
            "UNKNOWN";
    }

    private String buildSftpUri(String username, String host, Integer port, 
            String dir, String password, String cron) {
        return String.format(
            "sftp://%s@%s:%d/%s?password=%s&scheduler=quartz&scheduler.cron=%s"
            + "&stepwise=false&delete=true&moveFailed=error"
            + "&knownHostsFile=/known_hosts&strictHostKeyChecking=no"
            + "&maximumReconnectAttempts=3&binary=false",
            username, host, port, dir, password, cron
        );
    }

    private String constructBlobUrl(String containerName, String blobName) {
        String sanitizedContainerName = sanitizeContainerName(containerName);
        String url = blobServiceClient.getBlobContainerClient(sanitizedContainerName)
                .getBlobClient(blobName)
                .getBlobUrl();
        String decodedUrl = URLDecoder.decode(url, StandardCharsets.UTF_8);
        log.debug("Constructed blob URL: {} for container: {} (sanitized from: {}), blob: {}", 
                decodedUrl, sanitizedContainerName, containerName, blobName);
        return decodedUrl;
    }
}