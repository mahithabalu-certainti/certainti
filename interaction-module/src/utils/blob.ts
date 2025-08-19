import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol
} from "@azure/storage-blob";
import { parse } from "url";
import dotenv from "dotenv";
import { blobUrlExpiration } from "./constants";
import { getSecret } from "./azureSecrets";
dotenv.config();

// Generate a SAS token for a blob URL
export async function generateSasUrl(blobUrl: string, expiryMinutes = blobUrlExpiration): Promise<string> {
  try {
    const connectionString = await getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING as string);
    // const connectionString = "storage-account-connection-string";
    // const connectionString = await getSecret("storage-account-connection-string");
    // const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING as string

    if (!connectionString) {
      throw new Error("Azure storage connection string is required");
    }

    const parsedUrl = parse(blobUrl);
    const hostnameParts = parsedUrl.hostname?.split(".") || [];
    const accountName = hostnameParts[0];
    const pathParts = parsedUrl.pathname?.replace(/^\/+/, "").split("/") || [];

    if (pathParts.length < 2) {
      throw new Error("Invalid blob URL format");
    }

    const containerName: string = pathParts[0]!;
    let blobName = pathParts.slice(1).join("/");

    // Decode special characters like %20 → space
    blobName = decodeURIComponent(blobName);

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const credential = (blobServiceClient as any).credential as StorageSharedKeyCredential;

    if (!credential) {
      throw new Error("StorageSharedKeyCredential missing from BlobServiceClient");
    }

    // Always use UTC time, avoid local time mismatch
    const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"), // read-only
        expiresOn,
        protocol: SASProtocol.Https
      },
      credential
    ).toString();

    return `${blobUrl}?${sasToken}`;
  } catch (error) {
    console.error("Error generating SAS URL:", error);
    throw new Error(`SAS URL generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
