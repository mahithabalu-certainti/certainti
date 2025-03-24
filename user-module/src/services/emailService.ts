import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { IEmailMessage } from "../utils/types";
import configurations from "../config/config";

const logger = configurations.getInstance().getLogger();

export async function sendEmail(emailMessage: {
  message: IEmailMessage;
}): Promise<any> {
  const credential = new ClientSecretCredential(
    process.env.MAIL_TENANT_ID!,
    process.env.MAIL_CLIENT_ID!,
    process.env.MAIL_CLIENT_SECRET!
  );

  const graphClient = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async (): Promise<string> => {
        const tokenResponse = await credential.getToken(
          "https://graph.microsoft.com/.default"
        );
        return tokenResponse.token;
      },
    },
  });

  try {
    const response = await graphClient
      .api(`/users/${process.env.EMAIL_FROM}/sendMail`)
      .post(emailMessage);

    logger.info("Success log: ", {
      timestamp: new Date().toISOString(),
      method: "send mail",
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
