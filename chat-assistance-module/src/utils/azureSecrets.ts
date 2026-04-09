import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { logMessage } from "./logger";

const keyVaultUrl = process.env.KEY_VAULT_URI;

if (!keyVaultUrl) {
  logMessage("Warning: Environment variable 'KEY_VAULT_URI' is not set");
}

const credential = new DefaultAzureCredential();
const client = keyVaultUrl ? new SecretClient(keyVaultUrl, credential) : null;

export async function getSecret(secretName: string): Promise<string | null> {
  try {
    if (!client) {
      logMessage(`Error: Key Vault client not initialized. Cannot fetch secret "${secretName}"`);
      return null;
    }
    const secret = await client.getSecret(secretName);
    return secret.value || null;
  } catch (error) {
    logMessage(`Error fetching secret "${secretName}": ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
  }
}
