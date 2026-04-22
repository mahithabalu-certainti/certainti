import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { errorLog } from "./helpers";

const keyVaultUrl = process.env.KEY_VAULT_URI;

if (!keyVaultUrl) {
  throw new Error("Environment variable 'KEY_VAULT_URI' is not set");
}

const credential = new DefaultAzureCredential();
const client = new SecretClient(keyVaultUrl, credential);

export async function getSecret(secretName: string): Promise<string | null> {
  try {
    const secret = await client.getSecret(secretName);
    return secret.value || null; 
  } catch (error) {
    errorLog(`Error fetching secret "${secretName}":`, (error as Error).message);
    return null;
  }
}
