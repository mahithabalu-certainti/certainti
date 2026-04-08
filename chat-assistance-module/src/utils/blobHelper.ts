import { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, SASProtocol, StorageSharedKeyCredential } from '@azure/storage-blob';
import { logMessage } from './logger';
import { getSecret } from './azureSecrets';
import { parse } from 'url';

/**
 * Generate a SAS URL for a blob with read-only access
 * Uses connection string from Azure Key Vault (same as other modules)
 * Optionally validates that blob belongs to expected account container
 * Connection string format: DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=xxx;EndpointSuffix=core.windows.net
 */
export async function generateSasUrl(blobUrl: string, expectedAccountContainer?: string, expiryMinutes = 60): Promise<string> {
  try {
    // Retrieve connection string from Key Vault
    const secretName = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!secretName) {
      logMessage('Warning: AZURE_STORAGE_CONNECTION_STRING env var not set, returning URL without SAS token');
      return blobUrl;
    }

    const connectionString = await getSecret(secretName);
    if (!connectionString) {
      logMessage('Warning: Connection string secret not found in Key Vault, returning URL without SAS token');
      return blobUrl;
    }

    // Parse blob URL to extract container and blob name
    const parsedUrl = parse(blobUrl);
    const pathParts = (parsedUrl.pathname || '').replace(/^\/+/, '').split('/');
    
    if (pathParts.length < 2) {
      logMessage(`Invalid blob URL format: ${blobUrl}`);
      return blobUrl;
    }

    const containerName = pathParts[0];
    const blobName = pathParts.slice(1).join('/');

    // Validate this blob belongs to the expected account container
    if (expectedAccountContainer && containerName !== expectedAccountContainer) {
      logMessage(`Warning: Blob container "${containerName}" does not match expected account container "${expectedAccountContainer}"`);
      return blobUrl;
    }

    // Get credentials from connection string
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const credential = (blobServiceClient as any).credential as StorageSharedKeyCredential;

    if (!credential) {
      logMessage('Error: StorageSharedKeyCredential missing from BlobServiceClient');
      return blobUrl;
    }

    // Generate SAS token
    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + expiryMinutes);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'), // read-only
        expiresOn,
        protocol: SASProtocol.Https,
      },
      credential
    ).toString();

    const sasUrl = `${blobUrl}?${sasToken}`;
    logMessage(`Generated SAS URL for blob: ${containerName}/${blobName}`);
    return sasUrl;
  } catch (error: unknown) {
    logMessage(`Error generating SAS URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Return original URL if SAS generation fails
    return blobUrl;
  }
}
