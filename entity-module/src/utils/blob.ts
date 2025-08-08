import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol
} from "@azure/storage-blob";
import { parse } from "url";
import { getSecret } from "./azureSecrets";
import dotenv from "dotenv";
dotenv.config();

// Generate a SAS token for a blob URL
export async function generateSasUrl(blobUrl: string, expiryMinutes = 15): Promise<string> {
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

    const containerName = pathParts[0];
    const blobName = pathParts.slice(1).join("/");

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const credential = (blobServiceClient as any).credential as StorageSharedKeyCredential;

    if (!credential) {
      throw new Error("StorageSharedKeyCredential missing from BlobServiceClient");
    }

    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + expiryMinutes);

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
    console.error("Error generating SAS URL:", error);
    throw new Error(`SAS URL generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

