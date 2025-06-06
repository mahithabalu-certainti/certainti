import { Request, Response } from "express";
import * as helpers from "../../src/utils/helpers";
import { constants } from "../../src/utils/constant";
import configurations from "../../src/config/config";
import {
  userProfiles,
  userRoles,
  userPermissionById,
  userPermissionFields,
} from "../../src/controllers/userManagementController";

// ✅ Move mock object inside the mock function
jest.mock("../../src/config/config", () => {
  const userServicesMock = {
    permissionById: jest.fn(),
    getPermissionFieldsByIds: jest.fn(),
    roles: jest.fn(), 
    profiles: jest.fn(),
  };

  return {
    __esModule: true,
    default: {
      getInstance: () => ({
        getLogger: () => ({
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
        }),
        getServices: () => ({
          userServices: userServicesMock,
        }),
        // Expose the mock for test access
        __mockServices__: {
          userServices: userServicesMock,
        },
      }),
    },
  };
});

// ✅ Import config again to access the exposed __mockServices__
const mockConfig = configurations as any;
const userServicesMock = mockConfig.getInstance().__mockServices__.userServices;

// ✅ Mock helpers
jest.mock("../../src/utils/helpers", () => ({
  handleSuccessResponse: jest.fn(),
  handleErrorResponse: jest.fn(),
  successLog: jest.fn(),
  errorLog: jest.fn(),
}));

const createMockRequest = (params = {}, query = {}) =>
  ({
    params,
    query,
  } as unknown as Request);

const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

describe("userManagementController", () => {
  let mockResponse: Response;

  beforeEach(() => {
    mockResponse = createMockResponse();
    jest.clearAllMocks();
  });

  describe("userPermissionById", () => {
    it("should return user permission by id on success", async () => {
      userServicesMock.permissionById.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: { permission: "test-permission" },
      });

      const req = createMockRequest({ id: "user-azure-id" });
      await userPermissionById(req, mockResponse);

      expect(userServicesMock.permissionById).toHaveBeenCalledWith("user-azure-id");
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(mockResponse, {
        permission: "test-permission",
      });
    });

    it("should handle service failure", async () => {
      userServicesMock.permissionById.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage: "Not found",
      });

      const req = createMockRequest({ id: "user-azure-id" });
      await userPermissionById(req, mockResponse);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Not found"
      );
    });

    it("should handle unexpected errors", async () => {
      userServicesMock.permissionById.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const req = createMockRequest({ id: "user-azure-id" });
      await userPermissionById(req, mockResponse);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        "Unexpected error"
      );
    });

    it("should handle not found user", async () => {
      userServicesMock.permissionById.mockResolvedValue({
        statusCode: constants.NOT_FOUND,
        errorMessage: "User not found"
      });
    
      const req = createMockRequest({ id: "invalid-user" });
      await userPermissionById(req, mockResponse);
    
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "User not found"
      );
    });
  });

  describe("userPermissionFields", () => {
    it("should return permission fields on success", async () => {
      userServicesMock.getPermissionFieldsByIds.mockResolvedValue([
        { field: "test-field" },
      ]);

      const req = createMockRequest({ userId: "user-id" }, { id: "perm1,perm2" });
      await userPermissionFields(req, mockResponse);

      expect(userServicesMock.getPermissionFieldsByIds).toHaveBeenCalledWith("user-id", [
        "perm1",
        "perm2",
      ]);
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(mockResponse, [
        { field: "test-field" },
      ]);
    });

    it("should handle missing userId or permission ids", async () => {
      const req = createMockRequest({}, {});
      await userPermissionFields(req, mockResponse);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "userId and permission ids are required"
      );
    });

    it("should handle unexpected errors", async () => {
      userServicesMock.getPermissionFieldsByIds.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const req = createMockRequest({ userId: "user-id" }, { id: "perm1" });
      await userPermissionFields(req, mockResponse);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        "Unexpected error"
      );
    });
    it("should handle empty permission ids after split", async () => {
      const req = createMockRequest({ userId: "user-123" }, { id: "" });
      await userPermissionFields(req, mockResponse);
    
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "userId and permission ids are required"
      );
    });
  });
  describe("userRoles", () => {
    it("should return user roles successfully", async () => {
      userServicesMock.roles.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: [{ id: "admin", name: "Administrator" }],
      });

      const req = createMockRequest();
      await userRoles(req, mockResponse);

      expect(userServicesMock.roles).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ id: "admin", name: "Administrator" }]
      );
      expect(helpers.successLog).toHaveBeenCalledWith("User roles");
    });

    it("should handle service error for roles", async () => {
      userServicesMock.roles.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage: "Invalid request",
      });

      const req = createMockRequest();
      await userRoles(req, mockResponse);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Invalid request"
      );
    });

    it("should handle unexpected errors in roles", async () => {
      userServicesMock.roles.mockRejectedValue(new Error("DB connection failed"));

      const req = createMockRequest();
      await userRoles(req, mockResponse);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        "DB connection failed"
      );
    });
  });

  // New tests for userProfiles
  describe("userProfiles", () => {
    it("should return user profiles successfully", async () => {
      userServicesMock.profiles.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: [{ id: "profile1", name: "Basic User" }],
      });

      const req = createMockRequest();
      await userProfiles(req, mockResponse);

      expect(userServicesMock.profiles).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ id: "profile1", name: "Basic User" }]
      );
      expect(helpers.successLog).toHaveBeenCalledWith("User profiles");
    });

    it("should handle service error for profiles", async () => {
      userServicesMock.profiles.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage: "Invalid parameter",
      });

      const req = createMockRequest();
      await userProfiles(req, mockResponse);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Invalid parameter"
      );
    });

    it("should handle unexpected errors in profiles", async () => {
      userServicesMock.profiles.mockRejectedValue(new Error("Timeout error"));

      const req = createMockRequest();
      await userProfiles(req, mockResponse);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        "Timeout error"
      );
    });
  });
});