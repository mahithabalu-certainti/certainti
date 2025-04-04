import { Client } from "@microsoft/microsoft-graph-client";
import { getAzureB2CToken } from "../middlewares/auzureMiddleware";
import configurations from "../config/config";
import { Logger } from "winston";

const logger: Logger = configurations.getInstance().getLogger();

interface User {
  first_name: string;
  last_name: string;
  email: string;
  azure_id?: string;
}

interface UpdateUser {
  first_name: string;
  last_name: string;
  azure_id?: string;
}

const createAzureB2CUser = async (users: User, password: string) => {
  try {
    if (!users || !users.email || !password) {
      throw new Error("Missing required user information");
    }

    const accessToken = await getAzureB2CToken();
    if (!accessToken) {
      throw new Error("Failed to get Azure B2C access token");
    }

    const client = Client.init({
      authProvider: async (done) => {
        done(null, accessToken);
      },
    });

    const existingUser = await client
      .api("/users")
      .filter(`mail eq '${users.email}'`)
      .get();

    if (existingUser.value.length > 0) {
      throw new Error(`User already exists`);
    }

    const userPayload = {
      accountEnabled: true,
      displayName: `${users.first_name} ${users.last_name}`,
      givenName: users.first_name,
      surname: users.last_name,
      mail: users.email,
      identities: [
        {
          signInType: "emailAddress",
          issuer: process.env.AZURE_B2C_TENANT,
          issuerAssignedId: users.email,
        },
      ],
      passwordProfile: {
        password: password,
        forceChangePasswordNextSignIn: true,
      },
    };

    const user = await client.api("/users").post(userPayload);
    if (!user) {
      logger.error("Failed log: ", {
        timestamp: new Date().toString(),
        method: "create user",
        message: "Azure AD B2C user creation failed",
      });
    }

    return user;
  } catch (error: any) {
    throw new Error(`Failed to create Azure B2C user: ${error.message}`);
  }
};

const updateAzureUser = async (users: UpdateUser) => {
  try {
    if (!users || !users.azure_id) {
      throw new Error("Missing required user information");
    }

    const accessToken = await getAzureB2CToken();
    if (!accessToken) {
      throw new Error("Failed to get Azure B2C access token");
    }

    const client = Client.init({
      authProvider: async (done) => {
        done(null, accessToken);
      },
    });

    const existingUser = await client.api(`/users/${users.azure_id}`).get();

    if (!existingUser.id) {
      throw new Error(`User does not exist`);
    }

    const userPayload = {
      displayName: `${users.first_name} ${users.last_name}`,
      givenName: users.first_name,
      surname: users.last_name,
    };

    await client.api(`/users/${users.azure_id}`).patch(userPayload);

    const userAfterUpdate = await client.api(`/users/${users.azure_id}`).get();

    return userAfterUpdate;
  } catch (error: any) {
    throw new Error(`Failed to update Azure B2C user: ${error.message}`);
  }
};

export { createAzureB2CUser, updateAzureUser };
