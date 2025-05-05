import {
  AuthProviderCallback,
  Client,
} from "@microsoft/microsoft-graph-client";
import {
  createAzureB2CUser,
  updateAzureUser,
} from "../src/services/manageUser";
import { getAzureB2CToken } from "../src/middlewares/azureMiddleware";

jest.mock("@microsoft/microsoft-graph-client", () => ({
  Client: {
    init: jest.fn().mockReturnValue({
      api: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      post: jest.fn(),
      get: jest.fn(),
      patch: jest.fn(),
    }),
  },
}));

jest.mock("../src/middlewares/auzureMiddleware", () => ({
  getAzureB2CToken: jest.fn(),
  updateAzureUser: jest.fn(),
}));

describe("createAzureB2CUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if required user information is missing", async () => {
    const incompleteUser = {
      email: "",
      last_name: "",
      first_name: "",
    };
    await expect(
      createAzureB2CUser(incompleteUser, "password123")
    ).rejects.toThrow("Missing required user information");
  });

  it("should throw an error if Azure B2C access token is not retrieved", async () => {
    (getAzureB2CToken as jest.Mock).mockResolvedValueOnce(null);

    const users = {
      email: "john.doe@example.com",
      first_name: "John",
      last_name: "Doe",
    };

    await expect(createAzureB2CUser(users, "password123")).rejects.toThrow(
      "Failed to get Azure B2C access token"
    );
  });

  it("should throw an error if user already exists in Azure B2C", async () => {
    const mockAccessToken = "mockAccessToken";
    (getAzureB2CToken as jest.Mock).mockResolvedValueOnce(mockAccessToken);

    const users = {
      email: "john.doe@example.com",
      first_name: "John",
      last_name: "Doe",
    };

    const options = {
      authProvider: (done: AuthProviderCallback) => {
        done(null, mockAccessToken);
      },
    };

    const mockClient = Client.init(options);

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      filter: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValueOnce({
        value: [{ id: "existing-user-id" }],
      }),
    });

    await expect(createAzureB2CUser(users, "password123")).rejects.toThrow(
      "User already exists"
    );
  });

  it("should throw an error if creating the user fails", async () => {
    const mockAccessToken = "mockAccessToken";
    (getAzureB2CToken as jest.Mock).mockResolvedValueOnce(mockAccessToken);

    const users = {
      email: "john.doe@example.com",
      first_name: "John",
      last_name: "Doe",
    };

    const options = {
      authProvider: (done: AuthProviderCallback) => {
        done(null, mockAccessToken);
      },
    };

    const mockClient = Client.init(options);

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      filter: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValueOnce({
        value: [],
      }),
    });

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      post: jest
        .fn()
        .mockRejectedValueOnce(new Error("Azure AD B2C user creation failed")),
    });

    await expect(createAzureB2CUser(users, "password123")).rejects.toThrow(
      "Failed to create Azure B2C user: Azure AD B2C user creation failed"
    );
  });

  it("should successfully create a user when valid information is provided", async () => {
    const mockAccessToken = "mockAccessToken";
    (getAzureB2CToken as jest.Mock).mockResolvedValueOnce(mockAccessToken);

    const users = {
      email: "john.doe@example.com",
      first_name: "John",
      last_name: "Doe",
    };

    const options = {
      authProvider: (done: AuthProviderCallback) => {
        done(null, mockAccessToken);
      },
    };

    const mockClient = Client.init(options);

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      filter: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValueOnce({
        value: [],
      }),
    });

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      post: jest.fn().mockResolvedValueOnce({ id: "new-user-id" }),
    });

    const result = await createAzureB2CUser(users, "password123");
    expect(result.id).toBe("new-user-id");
  });
});

describe("updateAzureUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if required user information is missing", async () => {
    const users = {
      azure_id: "",
      first_name: "",
      last_name: "",
    };

    await expect(updateAzureUser(users)).rejects.toThrow(
      "Missing required user information"
    );
  });

  it("should throw an error if Azure B2C access token is not retrieved", async () => {
    (getAzureB2CToken as jest.Mock).mockResolvedValueOnce(null);

    const users = {
      azure_id: "user-id",
      first_name: "John",
      last_name: "Doe",
    };

    await expect(updateAzureUser(users)).rejects.toThrow(
      "Failed to get Azure B2C access token"
    );
  });

  it("should throw an error if the user does not exist in Azure B2C", async () => {
    const mockAccessToken = "mockAccessToken";
    (getAzureB2CToken as jest.Mock).mockResolvedValueOnce(mockAccessToken);

    const users = {
      azure_id: "non-existing-user-id",
      first_name: "John",
      last_name: "Doe",
    };

    const options = {
      authProvider: (done: AuthProviderCallback) => {
        done(null, mockAccessToken);
      },
    };

    const mockClient = Client.init(options);

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({}),
    });

    await expect(updateAzureUser(users)).rejects.toThrow("User does not exist");
  });

  it("should throw an error if updating the user fails", async () => {
    const mockAccessToken = "mockAccessToken";
    (getAzureB2CToken as jest.Mock).mockResolvedValueOnce(mockAccessToken);

    const users = {
      azure_id: "user-id",
      first_name: "John",
      last_name: "Doe",
    };

    const options = {
      authProvider: (done: AuthProviderCallback) => {
        done(null, mockAccessToken);
      },
    };

    const mockClient = Client.init(options);

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({
        id: "user-id",
      }),
    });

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      patch: jest
        .fn()
        .mockRejectedValueOnce(new Error("Azure AD B2C user update failed")),
    });

    await expect(updateAzureUser(users)).rejects.toThrow(
      "Failed to update Azure B2C user: Azure AD B2C user update failed"
    );
  });

  it("should successfully update a user when valid information is provided", async () => {
    const mockAccessToken = "mockAccessToken";
    (getAzureB2CToken as jest.Mock).mockResolvedValueOnce(mockAccessToken);

    const users = {
      azure_id: "user-id",
      first_name: "John",
      last_name: "Doe",
    };

    const options = {
      authProvider: (done: AuthProviderCallback) => {
        done(null, mockAccessToken);
      },
    };

    const mockClient = Client.init(options);

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({
        id: "user-id",
      }),
    });

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      patch: jest.fn().mockResolvedValueOnce({
        id: "user-id",
        displayName: "John Doe",
        givenName: "John",
        surname: "Doe",
      }),
    });

    (mockClient.api as jest.Mock).mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({
        id: "user-id",
        displayName: "John Doe",
        givenName: "John",
        surname: "Doe",
      }),
    });

    const result = await updateAzureUser(users);

    expect(result.id).toBe("user-id");
    expect(result.displayName).toBe("John Doe");
    expect(result.givenName).toBe("John");
    expect(result.surname).toBe("Doe");
  });
});
