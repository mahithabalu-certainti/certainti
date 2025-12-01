import { Client } from "@microsoft/microsoft-graph-client";
import { getAzureB2CToken } from "../middlewares/azureMiddleware";
import configurations from "../config/config";
import { Logger } from "winston";
import { Status } from "../models/statusModel";

function getLogger() {
  return configurations.getInstance().getLogger();
}

interface User {
  first_name: string;
  last_name: string;
  email: string;
  azure_id?: string;
}

interface UpdateUser {
  status_rid: string;
  first_name: string;
  last_name: string;
  azure_id?: string;
}

/**
 * Creates a new user in Azure B2C.
 *
 * This function checks if the user already exists in Azure B2C by their email. If the user does not exist,
 * it creates a new user with the provided user information and password. It also assigns the user to a given
 * Azure B2C tenant and forces the user to change their password at the next sign-in.
 *
 * @param {User} users - The user object containing the necessary information to create the user in Azure B2C.
 * @param {string} password - The password for the new user.
 *
 * @returns {Promise<any>} - A promise that resolves to the newly created user object if the user is successfully created.
 *
 * @throws {Error} - If the user already exists, or if any of the required parameters are missing, or if there
 * is any failure in communication with Azure B2C.
 */
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
      getLogger().error("Failed log: ", {
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

/**
 * Updates an existing user in Azure B2C.
 *
 * This function updates the user's display name, given name, and surname in Azure B2C using their Azure ID.
 * The function first checks if the user exists in Azure B2C. If the user exists, it performs the update.
 *
 * @param {UpdateUser} users - The user object containing the information to update for the existing user in Azure B2C.
 *
 * @returns {Promise<any>} - A promise that resolves to the updated user object if the update is successful.
 *
 * @throws {Error} - If the user does not exist, or if any of the required parameters are missing, or if there
 * is any failure in communication with Azure B2C.
 */
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

    // Only check status if status_rid is provided
    let statusRecord = null;
    if (users.status_rid) {
      statusRecord = await Status.findOne({
        where: { rid: users.status_rid },
      });
    }
    // Build userPayload dynamically based on provided fields
    const userPayload: any = {};
    if (users.first_name !== undefined)
      userPayload.givenName = users.first_name;
    if (users.last_name !== undefined) userPayload.surname = users.last_name;
    if (users.first_name !== undefined || users.last_name !== undefined) {
      userPayload.displayName = `${
        users.first_name ?? existingUser.givenName
      } ${users.last_name ?? existingUser.surname}`;
    }
    if (users.status_rid && statusRecord?.status_description === "inactive") {
      userPayload.accountEnabled = false;
    } else if (users.status_rid) {
      userPayload.accountEnabled = true;
    }
    await client.api(`/users/${users.azure_id}`).patch(userPayload);

    const userAfterUpdate = await client.api(`/users/${users.azure_id}`).get();

    return userAfterUpdate;
  } catch (error: any) {
    throw new Error(`Failed to update Azure B2C user: ${error.message}`);
  }
};

/**
 * Deletes a user from Azure B2C based on the user's email.
 *
 * This function first retrieves an access token for Azure B2C, then searches for the user by their email address.
 * If the user exists, it deletes the user from Azure B2C.
 *
 * @param {User} users - The user object containing at least the email address of the user to be deleted.
 *
 * @returns {Promise<{ success: boolean; message: string }>} - A promise that resolves with a success message if the deletion is successful.
 *
 * @throws {Error} - Throws an error if the email is missing, if the access token cannot be retrieved,
 * if the user is not found in Azure B2C, or if the deletion operation fails.
 */
const deleteAzureB2CUser = async (users: User) => {
  try {
    if (!users.email) {
      throw new Error("Email is required to delete a user");
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

    // First, find the user by email
    const existingUser = await client
      .api("/users")
      .filter(`mail eq '${users.email}'`)
      .get();

    if (existingUser.value.length === 0) {
      throw new Error(`User with email ${users.email} not found`);
    }

    const userId = existingUser.value[0].id;

    // Delete the user
    await client.api(`/users/${userId}`).delete();

    return {
      success: true,
      message: `User ${users.email} deleted successfully`,
    };
  } catch (error: any) {
    throw new Error(`Failed to delete Azure B2C user: ${error.message}`);
  }
};

export { createAzureB2CUser, updateAzureUser, deleteAzureB2CUser };
