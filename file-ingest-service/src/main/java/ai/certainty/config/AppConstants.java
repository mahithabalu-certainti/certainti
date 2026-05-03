package ai.certainty.config;

public class AppConstants {
    // Document Processing Defaults
    public static final String SFTP_UPLOAD = "SFTP Upload";
    public static final String DOCUMENT_STATUS_PROCESSING = "Processing";
    public static final String DOCUMENT_STATUS_FAILED = "Failed";
    public static final String DOCUMENT_SIZE_UNIT = "bytes";

    // Blob Storage Paths
    public static final String VALID_BLOB_PATH_FORMAT = "%s/%s_sftp_%s.%s";
    public static final String INVALID_BLOB_PATH_FORMAT = "%s/error/%s_sftp_%s.%s";
    
    // File Validation Messages
    public static final String INVALID_NAME_AND_TYPE = "Invalid filename and file type";
    public static final String INVALID_NAME = "Invalid filename";
    public static final String INVALID_TYPE = "Invalid file type";
    
    // Timestamp Format
    public static final String TIMESTAMP_FORMAT = "yyyyMMdd'T'HHmmss";

    private AppConstants() {
        // Prevent instantiation
    }
}

