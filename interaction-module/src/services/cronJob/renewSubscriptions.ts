import { ClientSecretCredential } from "@azure/identity";
import {
  Client as GraphClient,
  AuthenticationProvider,
} from "@microsoft/microsoft-graph-client";
import fetch from 'cross-fetch';
(global as any).fetch = fetch;
import cron from "node-cron";

const HOURS_BEFORE_EXPIRY = 24;

// Environment variables
const tenantId = process.env.TENANT_ID!;
const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

const authProvider: AuthenticationProvider = {
  getAccessToken: async () => {
    const tokenResponse = await credential.getToken(
      "https://graph.microsoft.com/.default"
    );
    return tokenResponse?.token || "";
  },
};

// Graph Client
const graphClient = GraphClient.initWithMiddleware({
  authProvider,
  defaultVersion: "v1.0",
});

// Get all subscriptions created by this app
async function getSubscriptions() {
  try {
    const res = await graphClient.api("/subscriptions").get();
    return res.value;
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return [];
  }
}

// Renew a single subscription
async function renewSubscription(subscription: any) {
  const newExpiration = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000
  ).toISOString(); // 3 days from now

  try {
    await graphClient.api(`/subscriptions/${subscription.id}`).update({
      expirationDateTime: newExpiration,
    });
    console.log(`Renewed subscription ${subscription.id}`);
  } catch (error) {
    console.error(`Failed to renew subscription ${subscription.id}:`, error);
  }
}

// Renew subscriptions expiring within the next 24 hours
async function renewExpiringSubscriptions() {
  const subscriptions = await getSubscriptions();
  const now = new Date();

  for (const sub of subscriptions) {
    const expiry = new Date(sub.expirationDateTime);
    const hoursToExpire = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursToExpire < HOURS_BEFORE_EXPIRY) {
      console.log(
        `Renewing subscription ${sub.id} (expires in ${hoursToExpire.toFixed(
          1
        )} hrs)`
      );
      await renewSubscription(sub);
    }
  }
}

// Run every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  const today = new Date();
  const dayOfMonth = today.getDate();

  if (dayOfMonth % 2 === 0) {
    console.log(
      `[${today.toISOString()}] Running renewal task (even day of month)`
    );
    await renewExpiringSubscriptions();
  } else {
    console.log(
      `[${today.toISOString()}] Skipping today (odd day of month)`
    );
  }
});
