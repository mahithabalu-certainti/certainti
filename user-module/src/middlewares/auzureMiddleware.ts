import { ClientSecretCredential } from "@azure/identity";

/**
 * Retrieves an access token for Azure AD B2C using client credentials.
 *
 * @returns {Promise<string>} - Returns the access token as a string.
 * @throws {Error} - Throws an error if token retrieval fails.
 */
const getAzureB2CToken = async (): Promise<string> => {
  const tenantId = process.env.AZURE_B2C_TENANT_ID;
  const clientId = process.env.AZURE_B2C_CLIENT_ID;
  const clientSecret = process.env.AZURE_B2C_CLIENT_SECRET;
  const scope = process.env.AZURE_SCOPE;

  if (!tenantId || !clientId || !clientSecret || !scope) {
    throw new Error("Missing required environment variables");
  }

  try {
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );
    const tokenResponse = await credential.getToken(scope);
    return tokenResponse.token;
  } catch (error: any) {
    throw new Error("Failed to retrieve Azure B2C token: " + error.message);
  }
};

export { getAzureB2CToken };
