import { ClientSecretCredential } from "@azure/identity";
import { Client as GraphClient } from "@microsoft/microsoft-graph-client";
import fetch from "cross-fetch";
(global as any).fetch = fetch;

import cron from "node-cron";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { MAIN_SCHEMA_NAME, SCHEMANAME_PREFIX, rawQueries } from "../../utils/constants";
import { initOrgSequelize } from "../../config/orgDataSource";
import { decryptClientSecret, logMessage } from "../../utils/helpers";

const HOURS_BEFORE_EXPIRY = 24;

// -----------------------------
// Graph Client Factory Function
// -----------------------------
function createMicrosoftGraphClient(credential: ClientSecretCredential) {
  return GraphClient.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken(
          "https://graph.microsoft.com/.default"
        );
        return token?.token ?? "";
      },
    },
    defaultVersion: "v1.0",
  });
}

// -----------------------------
// Fetch subscriptions
// -----------------------------
async function getSubscriptions(graphClient: GraphClient) {
  try {
    const res = await graphClient.api("/subscriptions").get();
    return res.value;
  } catch (error) {
    logMessage(`Failed to fetch subscriptions: ${error}`);
    return [];
  }
}

// -----------------------------
// Renew a subscription
// -----------------------------
async function renewSubscription(
  subscription: any,
  graphClient: GraphClient
): Promise<string | null> {
  const newExpiration = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000
  ).toISOString(); // 3 days

  try {
    await graphClient.api(`/subscriptions/${subscription.id}`).update({
      expirationDateTime: newExpiration,
    });
    logMessage(`Renewed subscription ${subscription.id}`);
    return subscription.id;
  } catch (error) {
    logMessage(`Failed to renew subscription ${subscription.id}: ${error}`);
    return null;
  }
}

// -----------------------------
// Main Renewal Logic
// -----------------------------
async function renewExpiringSubscriptions() {
  const accountData = await fetchAccountWithSubscription();

  if (accountData.length !== 0) {
    for (const account of accountData) {
      const {
        r_number,
        rid,
        storage_type,
        subscription_id: currentSubId,
      } = account;

      if (storage_type === "separate_db" && r_number) {
        const schemaName = `${SCHEMANAME_PREFIX}${r_number.replace(/\D/g, "")}`;
        const orgDbSequelize = await initOrgSequelize();

        const [accountDetails]: any = await orgDbSequelize.query(
          rawQueries.getAccountDetailsQuery(schemaName),
          {
            replacements: { accountRid: rid },
            type: "SELECT",
          }
        );

        const {
          client_id,
          tenant_id,
          client_secret,
          support_email,
          subscription_created,
        } = accountDetails || {};

        const credentialsValid =
          client_id &&
          tenant_id &&
          client_secret &&
          support_email &&
          subscription_created;

        if (credentialsValid) {
          logMessage(`Checking subscription for account ${r_number}`);

          const decryptedSecret = await decryptClientSecret(client_secret);
          // Initialize per-account graph client
          const accountCredential = new ClientSecretCredential(
            tenant_id,
            client_id,
            decryptedSecret
          );
          const accountGraphClient =
            createMicrosoftGraphClient(accountCredential);

          const subscriptions = await getSubscriptions(accountGraphClient);
          const now = new Date();

          for (const sub of subscriptions) {
            const expiry = new Date(sub.expirationDateTime);
            const hoursToExpire =
              (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

            // if (
            //   sub.id === currentSubId 
            // ) {
              logMessage(
                `Renewing subscription ${
                  sub.id
                } (expires in ${hoursToExpire.toFixed(1)} hrs)`
              );

              const renewedSubId = await renewSubscription(
                sub,
                accountGraphClient
              );

              if (renewedSubId) {
                const mainDb = await initMainDbSequelize();
                await mainDb.query(
                  `UPDATE ${MAIN_SCHEMA_NAME}.account SET subscription_id = :newSubId WHERE rid = :rid`,
                  {
                    replacements: {
                      newSubId: renewedSubId,
                      rid,
                    },
                  }
                );

               logMessage(
                  `Subscription renewed and updated for account ${r_number}`
                );
              } else {
                logMessage(
                  ` Failed to renew subscription for account ${r_number}`
                );
              }
            // }
          }
        } else {
          logMessage(
            ` Missing or invalid credentials for account ${r_number}`
          );
        }
      }
    }
  }

  // const fetchPlatformCredentials = await fetchPlatformSettings();
  // const defaultGraphClient = createMicrosoftGraphClient(fetchPlatformCredentials);
  // const subscriptions = await getSubscriptions(defaultGraphClient);
  // const now = new Date();

  // for (const sub of subscriptions) {
  //   const expiry = new Date(sub.expirationDateTime);
  //   const hoursToExpire = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  //   if (hoursToExpire < HOURS_BEFORE_EXPIRY) {
  //     console.log(
  //       `Renewing global subscription ${
  //         sub.id
  //       } (expires in ${hoursToExpire.toFixed(1)} hrs)`
  //     );
  //     await renewSubscription(sub, defaultGraphClient);
  //   }
  // }
}

// -----------------------------
// Fetch accounts with active subscription_id
// -----------------------------
async function fetchAccountWithSubscription() {
  const mainDbSequelize = await initMainDbSequelize();
  const [accountRecords]: any = await mainDbSequelize.query(
    rawQueries.getAccountsWithSubscriptionQuery()
  );
  return accountRecords;
}

async function fetchPlatformSettings() {
  const mainDbSequelize = await initMainDbSequelize();

  const platformSettings: any = await mainDbSequelize.query(
    rawQueries.fetchOrganizationSettings(),
    {
      type: "SELECT",
    }
  );

  const tenantId = platformSettings[0]?.tenant_id;
  const clientIdId = platformSettings[0]?.client_id;
  const clientSecret = platformSettings[0]?.client_secret;

  const decryptedSecret = await decryptClientSecret(clientSecret);

  const accountCredential = new ClientSecretCredential(
    tenantId,
    clientIdId,
    decryptedSecret
  );

  return accountCredential;
}

// -----------------------------
// Cron Job (Runs every day at 2AM on even days)
// -----------------------------
cron.schedule("0 10 * * *", async () => {
  const today = new Date();
  const dayOfMonth = today.getDate();

  if (dayOfMonth % 2 === 0) {
    logMessage(
      `[${today.toISOString()}] Running subscription renewal task`
    );
    try {
      await renewExpiringSubscriptions();
    } catch (err) {
      logMessage(`Subscription renewal task failed: ${err}`);
    }
  } else {
    logMessage(`[${today.toISOString()}] ⏭️ Skipping task (odd day of month)`);
  }
});
