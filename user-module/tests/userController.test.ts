import request from "supertest";
import { initExpressServer } from "../src/expressServer";
import { generateSecurePassword } from "../src/utils/generatePassword";
import {
  createAzureB2CUser,
  updateAzureUser,
} from "../src/services/manageUser";
import { sendEmail } from "../src/services/emailService";
import {
  createUserSchema,
  updateUserSchema,
} from "../src/lib/joi/schemas/schema";
import configurations from "../src/config/config";
import { constants } from "../src/utils/constant";

const services = configurations.getInstance().getServices();
const userServices = services.userServices;

const { app } = initExpressServer();

type MockRequestBody = {
  [key: string]: any; 
};

const mockResponse = {
  first_name: "Jack",
  last_name: "David",
  profile: "1a94f781-e3ef-41e9-874f-1742c2e86d91",
  active: "Active",
  street: "123 Main St",
  city: 2,
  state: 3,
  zip_code: "12345",
  country: 4,
  role: "2d219324-a763-45e3-83ed-53d5b40b890f",
  status: "Active",
  email_address: "john.doe@example.com",
};

jest.mock("../src/utils/generatePassword", () => ({
  generateSecurePassword: jest.fn(),
}));
jest.mock("../src/services/manageUser", () => ({
  createAzureB2CUser: jest.fn(),
  updateAzureUser: jest.fn(),
}));
jest.mock("../src/services/emailService", () => ({
  sendEmail: jest.fn(),
}));
jest.mock("../src/services/userService", () => {
  return jest.fn().mockImplementation(() => ({
    createUser: jest.fn(),
    updateUser: jest.fn(),
    roles: jest.fn(),
    profiles: jest.fn(),
  }));
});
jest.mock("../src/lib/joi/schemas/schema", () => ({
  createUserSchema: {
    validate: jest.fn(),
  },
  updateUserSchema: {
    validate: jest.fn(),
  },
}));

describe("create user", () => {
  const mockRequest = (body: Record<string, any>) => ({
    body,
    requestId: "mockRequestId",
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully create a user", async () => {
    const req = mockRequest({
      ...mockResponse,
    });

    const mockValidation = {
      error: null,
      value: req.body,
    };

    (createUserSchema.validate as jest.Mock).mockReturnValue(mockValidation);

    (generateSecurePassword as jest.Mock).mockResolvedValueOnce(
      "securePassword123"
    );

    await (createAzureB2CUser as jest.Mock).mockResolvedValueOnce({
      id: "azureUserId",
    });

    ((await userServices.createUser) as jest.Mock).mockResolvedValueOnce({
      statusCode: 200,
      message: "Success",
      data: { id: "userId" },
    });

    await (sendEmail as jest.Mock).mockResolvedValueOnce(true);

    const res = await request(app)
      .post("/api/user/create")
      .send({
        ...mockResponse,
      });

    expect(res.status).toBe(constants.SUCCESS);
    expect(res.body.statusCodeValue).toBe(constants.SUCCESS_MESSAGE);
    expect(res.body.statusCode).toBe(constants.SUCCESS);
  });

  it("should return error if validation fails", async () => {
    const req = mockRequest({
      first_name: "",
      last_name: "Doe",
      email_address: "john.doe@example.com",
    });

    const mockValidation = {
      error: { details: [{ message: "first_name is required" }] },
      value: req.body,
    };
    (createUserSchema.validate as jest.Mock).mockReturnValue(mockValidation);

    const res = await request(app)
      .post("/api/user/create")
      .send({
        ...mockResponse,
      });

    const mockErrorResponse = ["first_name is required"];

    expect(res.status).toBe(constants.BAD_REQUEST);
    expect(res.body.statusCode).toBe(constants.BAD_REQUEST);
    expect(res.body.statusCodeValue).toBe(constants.BAD_REQUEST_MESSAGE);
    expect(res.body.statusMessage).toBe(JSON.stringify(mockErrorResponse));
  });

  it("should return error if Azure AD B2C user creation fails", async () => {
    const req = mockRequest({
      first_name: "John",
      last_name: "Doe",
      email_address: "john.doe@example.com",
    });

    const mockValidation = {
      error: null,
      value: req.body,
    };

    (createUserSchema.validate as jest.Mock).mockReturnValue(mockValidation);

    // const generateSecurePasswordRes = generateSecurePassword();
    (generateSecurePassword as jest.Mock).mockResolvedValueOnce(
      "securePassword123"
    );

    await (createAzureB2CUser as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/user/create")
      .send({
        ...mockResponse,
      });

    expect(res.status).toBe(constants.FAILED);
    expect(res.body.statusCode).toBe(500);
    expect(res.body.statusCodeValue).toBe(constants.FAILED_MESSAGE);
    expect(res.body.statusMessage).toBe("Azure AD B2C user creation failed");
  });

  it("should return error if user service fails", async () => {
    const req = mockRequest({
      first_name: "John",
      last_name: "Doe",
      email_address: "john.doe@example.com",
    });

    const mockValidation = {
      error: null,
      value: req.body,
    };

    (createUserSchema.validate as jest.Mock).mockReturnValue(mockValidation);

    // const generateSecurePasswordRes = generateSecurePassword();
    (generateSecurePassword as jest.Mock).mockResolvedValueOnce(
      "securePassword123"
    );

    await (createAzureB2CUser as jest.Mock).mockResolvedValue({
      id: "azureUserId",
    });

    // const createUser = await userServices.createUser;
    (userServices.createUser as jest.Mock).mockResolvedValueOnce({
      statusCode: 400,
      message: "User creation failed",
    });

    const res = await request(app)
      .post("/api/user/create")
      .send({
        ...mockResponse,
      });

    expect(res.status).toBe(constants.BAD_REQUEST);
    expect(res.body.statusCodeValue).toBe(constants.BAD_REQUEST_MESSAGE);
    expect(res.body.statusMessage).toBe("User creation failed");
  });

  it("should handle errors in the catch block and log them", async () => {
    const req = mockRequest({
      first_name: "John",
      last_name: "Doe",
      email_address: "john.doe@example.com",
    });

    const mockValidation = {
      error: null,
      value: req.body,
    };

    (createUserSchema.validate as jest.Mock).mockReturnValue(mockValidation);

    (generateSecurePassword as jest.Mock).mockResolvedValueOnce(
      "securePassword123"
    );

    const error = new Error("Something went wrong during user creation");
    await (createAzureB2CUser as jest.Mock).mockRejectedValueOnce(error);

    const res = await request(app)
      .post("/api/user/create")
      .send({
        ...mockResponse,
      });

    expect(res.status).toBe(constants.FAILED);
    expect(res.body.statusCode).toBe(500);
    expect(res.body.statusCodeValue).toBe(constants.FAILED_MESSAGE);
    expect(res.body.statusMessage).toBe(
      "Something went wrong during user creation"
    );
  });
});

describe("update user", () => {
  const mockRequest = (body: MockRequestBody) => ({
    body,
    requestId: "mockRequestId",
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully update a user", async () => {
    const req = mockRequest({
      first_name: "John",
      last_name: "Doe",
      email_address: "john.doe@example.com",
    });

    const mockValidation = {
      error: null,
      value: req.body,
    };

    (updateUserSchema.validate as jest.Mock).mockReturnValue(mockValidation);

    await (updateAzureUser as jest.Mock).mockResolvedValueOnce({
      id: "azureUserId",
    });

    (userServices.updateUser as jest.Mock).mockResolvedValueOnce({
      statusCode: 200,
      message: "Success",
      data: { id: "userId" },
    });

    const res = await request(app).put("/api/user/update").send(req.body);

    expect(res.status).toBe(constants.SUCCESS);
    expect(res.body.statusCodeValue).toBe(constants.SUCCESS_MESSAGE);
    expect(res.body.statusCode).toBe(constants.SUCCESS);
  });

  it("should return error if validation fails", async () => {
    const req = mockRequest({
      first_name: "",
      last_name: "Doe",
      email_address: "john.doe@example.com",
    });

    const mockValidation = {
      error: { details: [{ message: "first_name is required" }] },
      value: req.body,
    };

    (updateUserSchema.validate as jest.Mock).mockReturnValue(mockValidation);

    const res = await request(app).put("/api/user/update").send(req.body);

    const mockErrorResponse = ["first_name is required"];

    expect(res.status).toBe(constants.BAD_REQUEST);
    expect(res.body.statusCode).toBe(constants.BAD_REQUEST);
    expect(res.body.statusCodeValue).toBe(constants.BAD_REQUEST_MESSAGE);
    expect(res.body.statusMessage).toBe(JSON.stringify(mockErrorResponse));
  });

  it("should return error if Azure AD B2C user update fails", async () => {
    const req = mockRequest({
      first_name: "John",
      last_name: "Doe",
      email_address: "john.doe@example.com",
    });

    const mockValidation = {
      error: null,
      value: req.body,
    };

    (updateUserSchema.validate as jest.Mock).mockReturnValue(mockValidation);

    await (updateAzureUser as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app).put("/api/user/update").send(req.body);

    expect(res.status).toBe(constants.FAILED);
    expect(res.body.statusCode).toBe(500);
    expect(res.body.statusCodeValue).toBe(constants.FAILED_MESSAGE);
    expect(res.body.statusMessage).toBe("Azure AD B2C user update failed");
  });

  it("should return error if user service update fails", async () => {
    const req = mockRequest({
      first_name: "John",
      last_name: "Doe",
      email_address: "john.doe@example.com",
    });

    const mockValidation = {
      error: null,
      value: req.body,
    };

    (updateUserSchema.validate as jest.Mock).mockReturnValue(mockValidation);

    await (updateAzureUser as jest.Mock).mockResolvedValueOnce({
      id: "azureUserId",
    });

    (userServices.updateUser as jest.Mock).mockResolvedValueOnce({
      statusCode: 400,
      message: "User update failed",
    });

    const res = await request(app).put("/api/user/update").send(req.body);

    expect(res.status).toBe(constants.BAD_REQUEST);
    expect(res.body.statusCodeValue).toBe(constants.BAD_REQUEST_MESSAGE);
    expect(res.body.statusMessage).toBe("User update failed");
  });

  it("should handle errors in the catch block and log them", async () => {
    const req = mockRequest({
      first_name: "John",
      last_name: "Doe",
      email_address: "john.doe@example.com",
    });

    const mockValidation = {
      error: null,
      value: req.body,
    };

    (updateUserSchema.validate as jest.Mock).mockReturnValue(mockValidation);

    const error = new Error("Something went wrong during user update");
    await (updateAzureUser as jest.Mock).mockRejectedValueOnce(error);

    const res = await request(app).put("/api/user/update").send(req.body);

    expect(res.status).toBe(constants.FAILED);
    expect(res.body.statusCode).toBe(constants.FAILED);
    expect(res.body.statusCodeValue).toBe(constants.FAILED_MESSAGE);
    expect(res.body.statusMessage).toBe(
      "Something went wrong during user update"
    );
  });
});

describe("user roles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully fetch user roles", async () => {
    const mockRoles = {
      statusCode: 200,
      message: "Success",
      data: [{ role: "admin" }, { role: "user" }],
    };

    (userServices.roles as jest.Mock).mockResolvedValueOnce(mockRoles);

    const res = await request(app).get("/api/user/roles");

    expect(res.status).toBe(constants.SUCCESS);
    expect(res.body.statusCode).toBe(constants.SUCCESS);
    expect(res.body.statusCodeValue).toBe(constants.SUCCESS_MESSAGE);
    expect(res.body.data).toEqual(mockRoles.data);
  });

  it("should return error if user roles retrieval fails", async () => {
    const mockRoles = {
      statusCode: 400,
      message: "Failed to fetch roles",
    };

    (userServices.roles as jest.Mock).mockResolvedValueOnce(mockRoles);

    const res = await request(app).get("/api/user/roles");

    expect(res.status).toBe(constants.BAD_REQUEST);
    expect(res.body.statusCodeValue).toBe(constants.BAD_REQUEST_MESSAGE);
    expect(res.body.statusMessage).toBe(mockRoles.message);
  });

  it("should return error if an exception occurs", async () => {
    (userServices.roles as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const res = await request(app).get("/api/user/roles");

    expect(res.status).toBe(constants.FAILED);
    expect(res.body.statusMessage).toBe("Database error");
    expect(res.body.statusCodeValue).toBe(constants.FAILED_MESSAGE);
  });
});

describe("user profiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully fetch user profiles", async () => {
    const mockProfiles = {
      statusCode: 200,
      message: "Success",
      data: [
        {
          rid: "1a94f781-e3ef-41e9-874f-1742c2e86d91",
          profile_name: "Administrator",
        },
      ],
    };

    (userServices.profiles as jest.Mock).mockResolvedValueOnce(mockProfiles);

    const res = await request(app).get("/api/user/profiles");

    expect(res.status).toBe(constants.SUCCESS);
    expect(res.body.statusCode).toBe(constants.SUCCESS);
    expect(res.body.statusCodeValue).toBe(constants.SUCCESS_MESSAGE);
    expect(res.body.data).toEqual(mockProfiles.data);
  });

  it("should return error if user profiles retrieval fails", async () => {
    const mockProfiles = {
      statusCode: 400,
      message: "Failed to fetch profiles",
    };

    (userServices.profiles as jest.Mock).mockResolvedValueOnce(mockProfiles);

    const res = await request(app).get("/api/user/profiles");

    expect(res.status).toBe(constants.BAD_REQUEST);
    expect(res.body.statusCode).toBe(constants.BAD_REQUEST);
    expect(res.body.statusCodeValue).toBe(constants.BAD_REQUEST_MESSAGE);
    expect(res.body.statusMessage).toBe(mockProfiles.message);
  });

  it("should return error if an exception occurs", async () => {
    (userServices.profiles as jest.Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    const res = await request(app).get("/api/user/profiles");

    expect(res.status).toBe(constants.FAILED);
    expect(res.body.statusMessage).toBe("Database error");
    expect(res.body.statusCodeValue).toBe(constants.FAILED_MESSAGE);
  });
});

// Repeat the same for update user, user roles, and user profiles
// The code remains mostly the same for the other tests
