import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol } from "@azure/storage-blob";
import { logMessage } from "../utils/helpers";
import path from 'path';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_CONTAINER_NAME!;

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

/**
 * Uploads a file to Azure Blob Storage under a user-specific path.
 * @param file 
 * @param user_id 
 * @returns 
 */
export const uploadToAzure = async (file: Express.Multer.File, user_id: string): Promise<string> => {
    const blobName = path.posix.join('user', user_id, 'profile', file.originalname);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await containerClient.setAccessPolicy(undefined);

    await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    return blockBlobClient.url;
};

/**
 * Generates a SAS URL for the given blob URL with read permissions.
 * @param blobUrl 
 * @param expiryTimeInMinutes 
 * @returns 
 */
export const generateSasUrl = async (blobUrl: string, expiryTimeInMinutes = 15): Promise<string> => {
    try {
        const parsedUrl = new URL(blobUrl);
        const hostnameParts = parsedUrl.hostname?.split(".") || [];
        const accountName = hostnameParts[0];
        const pathParts = parsedUrl.pathname?.replace(/^\/+/, "").split("/") || [];

        if (pathParts.length < 2) {
            throw new Error("Invalid blob URL format");
        }

        const containerName: any = pathParts[0];
        const blobName = pathParts.slice(1).join("/");

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const credential = (blobServiceClient as any).credential as StorageSharedKeyCredential;

        if (!credential) {
            throw new Error("StorageSharedKeyCredential missing from BlobServiceClient");
        }

        const expiresOn = new Date();
        expiresOn.setMinutes(expiresOn.getMinutes() + expiryTimeInMinutes);

        const sasToken = generateBlobSASQueryParameters(
            {
                containerName,
                blobName,
                permissions: BlobSASPermissions.parse("r"),
                expiresOn,
                protocol: SASProtocol.Https
            },
            credential
        ).toString();
        const sasUrl = `${blobUrl}?${sasToken}`;
        return sasUrl;
    } catch (error) {
        logMessage(`Error generating SAS URL: ${error}`);
        throw new Error(`SAS URL generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
