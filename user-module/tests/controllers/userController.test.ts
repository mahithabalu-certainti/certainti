// userController.test.ts

// Configure service mocks
const mockUserServices = {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    listUsers: jest.fn(),
    listUserById: jest.fn(),
    exportUsers: jest.fn(),
  };
jest.mock("../../src/config/config", () => ({
    __esModule: true,
    default: {
      getInstance: jest.fn(() => ({
        getLogger: () => ({
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
        }),
        getServices: () => ({
          userServices: mockUserServices,
        }),
      })),
    },
  }));
process.env.KEY_VAULT_URI = "https://mock-keyvault.vault.azure.net";
process.env.ORGDB_NAME = "rdcredits_orgdb";
process.env.ORGDB_PASSWORD = "myuser";
process.env.ORGDB_USERNAME = "mysecretpassword";
process.env.ORGDB_ENDPOINT = "localhost";

process.env.MAINDB_NAME = "certainty_local";
process.env.MAINDB_USERNAME = "Sumi@2271";
process.env.MAINDB_PASSWORD = "postgres";
process.env.MAINDB_ENDPOINT = "localhost";


import { Request, Response } from "express";
import * as helpers from "../../src/utils/helpers";
import { constants } from "../../src/utils/constant";
import configurations from "../../src/config/config";
import {
  createUser,
  updateUser,
  listUsers,
  listUserById,
  exportUsers,
} from "../../src/controllers/userController";
import { createAzureB2CUser, updateAzureUser } from "../../src/services/manageUser";
import { generateSecurePassword } from "../../src/utils/generatePassword";
import { sendEmail } from "../../src/services/emailService";
import { generateExcelBase64 } from "../../src/utils/helpers";

// Mock all external dependencies

jest.mock("../../src/services/manageUser");
jest.mock("../../src/utils/generatePassword");
jest.mock("../../src/services/emailService");
jest.mock("../../src/utils/helpers");

const mockCreateAzureB2CUser = createAzureB2CUser as jest.MockedFunction<typeof createAzureB2CUser>;
const mockUpdateAzureUser = updateAzureUser as jest.MockedFunction<typeof updateAzureUser>;
const mockGenerateSecurePassword = generateSecurePassword as jest.MockedFunction<typeof generateSecurePassword>;
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
const mockGenerateExcelBase64 = generateExcelBase64 as jest.MockedFunction<typeof generateExcelBase64>;

const mockRequest = (body: any = {}, params: any = {}, query: any = {}, headers: any = {}) => ({
  body,
  params,
  query,
  headers,
}) as unknown as Request;

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

describe("userController", () => {
  let res: Response;

  beforeEach(() => {
    res = mockResponse();
    jest.clearAllMocks();
    
    // Default mock implementations
    (helpers.validateRequest as jest.Mock).mockImplementation((_, __, ___, ____, method) => {
      return method === "GET" ? { filters: "{}" } : { organization: "testOrg" };
    });
    (helpers.requestErrorMessages as jest.Mock).mockReturnValue("Validation error");
    mockGenerateSecurePassword.mockResolvedValue("SecurePassword123!");
  });

  describe("createUser", () => {
    it("should create user successfully", async () => {
        (helpers.validateRequest as jest.Mock).mockReturnValue({ organization: "PF2.0", email: "test@example.com" });
        const req = mockRequest({ organization: "PF2.0", email: "test@example.com" }, {}, {}, { 'x-user-id': 'admin123' });
        mockUserServices.getUserByEmail.mockResolvedValue(null);
        mockCreateAzureB2CUser.mockResolvedValue({ id: "azure123" });
        mockUserServices.createUser.mockResolvedValue({ statusCode: constants.SUCCESS });
  
        await createUser(req, res);
  
        expect(mockCreateAzureB2CUser).toHaveBeenCalled();
        expect(mockSendEmail).toHaveBeenCalled();
        expect(helpers.handleSuccessResponse).toHaveBeenCalled();
      });

      it("should handle existing email", async () => {
        (helpers.validateRequest as jest.Mock).mockReturnValue({ organization: "PF2.0", email: "exists@test.com" });
        const req = mockRequest({ organization: "PF2.0", email: "exists@test.com" }, {}, {}, { 'x-user-id': 'admin123' });
        mockUserServices.getUserByEmail.mockResolvedValue({ email: "exists@test.com" });
  
        await createUser(req, res);
  
        expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
          expect.anything(),
          constants.BAD_REQUEST,
          constants.BAD_REQUEST_MESSAGE,
          "Email already exists in the system"
        );
      });
  
      it("should handle Azure creation failure", async () => {
        (helpers.validateRequest as jest.Mock).mockReturnValue({ organization: "PF2.0", email: "test@example.com" });
        const req = mockRequest({ organization: "PF2.0", email: "test@example.com" }, {}, {}, { 'x-user-id': 'admin123' });
        mockUserServices.getUserByEmail.mockResolvedValue(null);
        mockCreateAzureB2CUser.mockResolvedValue(null);
  
        await createUser(req, res);
  
        expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
          expect.anything(),
          constants.FAILED,
          constants.FAILED_MESSAGE,
          "Azure AD B2C user creation failed"
        );
      });
  
      it("should handle validation errors", async () => {
        (helpers.validateRequest as jest.Mock).mockReturnValue(null);
        const req = mockRequest({ organization: "invalid" });
  
        await createUser(req, res);
  
        expect(helpers.handleErrorResponse).toHaveBeenCalled();
      });
    });

    describe("updateUser", () => {
        it("should update user successfully", async () => {
          (helpers.validateRequest as jest.Mock).mockReturnValue({ organization: "PF2.0", rid: "user123" });
          const req = mockRequest({ organization: "PF2.0", rid: "user123" }, {}, {}, { 'x-user-id': 'admin123' });
          mockUpdateAzureUser.mockResolvedValue({ id: "azure123" });
          mockUserServices.updateUser.mockResolvedValue({ statusCode: constants.SUCCESS, data: {} });
    
          await updateUser(req, res);
    
          expect(mockUpdateAzureUser).toHaveBeenCalled();
          expect(helpers.handleSuccessResponse).toHaveBeenCalled();
        });
    
        it("should handle Azure update failure", async () => {
            (helpers.validateRequest as jest.Mock).mockReturnValue({ organization: "PF2.0", rid: "user123" });
            // Add the x-user-id header to the request
            const req = mockRequest({ organization: "PF2.0", rid: "user123" }, {}, {}, { 'x-user-id': 'admin123' });
            mockUpdateAzureUser.mockResolvedValue(null);
          
            await updateUser(req, res);
          
            expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
              expect.anything(),
              constants.FAILED,
              constants.FAILED_MESSAGE,
              "Azure AD B2C user update failed"
            );
          });
    
        it("should handle missing user ID", async () => {
          (helpers.validateRequest as jest.Mock).mockReturnValue({ organization: "PF2.0" });
          const req = mockRequest({ organization: "PF2.0" }, {}, {}, {});
          await updateUser(req, res);
    
          expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
            expect.anything(),
            constants.BAD_REQUEST,
            constants.BAD_REQUEST_MESSAGE,
            "User ID is required"
          );
        });
      });

      describe("listUsers", () => {
        it("should return user list successfully", async () => {
          (helpers.validateRequest as jest.Mock).mockReturnValue({ filters: "{}" });
          const mockData = { items: [], total: 0 };
          mockUserServices.listUsers.mockResolvedValue({ statusCode: constants.SUCCESS, data: mockData });
      
          await listUsers(mockRequest({}, {}, {}, { 'x-user-id': 'admin123' }), res);
      
          expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(res, mockData);
        });
      
        it("should handle invalid filters", async () => {
          (helpers.validateRequest as jest.Mock).mockReturnValue({ filters: "invalid" });
      
          await listUsers(mockRequest({}, {}, {}, { 'x-user-id': 'admin123' }), res);
      
          expect(helpers.errorLog).toHaveBeenCalledWith("List user", "Invalid filters format. Must be a valid JSON object.");
        });
      
        it("should handle service errors", async () => {
          (helpers.validateRequest as jest.Mock).mockReturnValue({ filters: "{}" });
          mockUserServices.listUsers.mockResolvedValue({ statusCode: constants.BAD_REQUEST, errorMessage: "Invalid query" });
      
          await listUsers(mockRequest({}, {}, {}, { 'x-user-id': 'admin123' }), res);
      
          expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
            expect.anything(),
            constants.BAD_REQUEST,
            constants.BAD_REQUEST_MESSAGE,
            "Invalid query"
          );
        });
      });
      
      describe("listUserById", () => {
        it("should return user by ID successfully", async () => {
          (helpers.validateRequest as jest.Mock).mockReturnValue({ organization: "PF2.0" });
          const mockUser = { id: "user123" };
          mockUserServices.listUserById.mockResolvedValue({ statusCode: constants.SUCCESS, data: mockUser });
      
          await listUserById(mockRequest({}, { id: "user123" }, { organization: "PF2.0" }), res);
      
          expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(res, mockUser);
        });
      
        it("should handle invalid ID", async () => {
          (helpers.validateRequest as jest.Mock).mockReturnValue({ organization: "PF2.0" });
          mockUserServices.listUserById.mockResolvedValue({ statusCode: constants.NOT_FOUND, errorMessage: "User not found" });
      
          await listUserById(mockRequest({}, { id: "invalid" }, { organization: "PF2.0" }), res);
      
          expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
            expect.anything(),
            constants.BAD_REQUEST,
            constants.BAD_REQUEST_MESSAGE,
            "User not found"
          );
        });
      
        it("should handle validation errors", async () => {
          (helpers.validateRequest as jest.Mock).mockReturnValue(null);
          (helpers.requestErrorMessages as jest.Mock).mockReturnValue("Invalid organization");
          const req = mockRequest({}, { id: "user123" }, { organization: "invalid" });
      
          await listUserById(req, res);
      
          expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
            expect.anything(),
            constants.BAD_REQUEST,
            constants.BAD_REQUEST_MESSAGE,
            "Invalid organization"
          );
        });
      });
      
      describe("exportUsers", () => {
        it("should export users successfully", async () => {
          (helpers.validateRequest as jest.Mock).mockReturnValue({ filters: "{}" });
          const mockData = { users: [] };
          mockUserServices.exportUsers.mockResolvedValue({ statusCode: constants.SUCCESS, data: mockData });
          mockGenerateExcelBase64.mockResolvedValue("base64encodedExcel");
      
          await exportUsers(mockRequest({}, {}, {}, { 'x-user-id': 'admin123' }), res);
      
          expect(mockGenerateExcelBase64).toHaveBeenCalled();
          expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(res, "base64encodedExcel");
        });
      
        it("should handle export users service failure", async () => {
            (helpers.validateRequest as jest.Mock).mockReturnValue({ filters: "{}" });
            mockUserServices.exportUsers.mockResolvedValue({ statusCode: constants.FAILED, errorMessage: "Export failed" });
          
            await exportUsers(mockRequest({}, {}, {}, { 'x-user-id': 'admin123' }), res);
          
            expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
              expect.anything(),
              constants.BAD_REQUEST,
              constants.BAD_REQUEST_MESSAGE,
              "Export failed"
            );
          });
      
        it("should handle filter parsing errors", async () => {
          (helpers.validateRequest as jest.Mock).mockReturnValue({ filters: "invalid" });
      
          await exportUsers(mockRequest({}, {}, {}, { 'x-user-id': 'admin123' }), res);
      
          expect(helpers.errorLog).toHaveBeenCalledWith("Export user", "Invalid filters format. Must be a valid JSON object.");
        });
      });
});