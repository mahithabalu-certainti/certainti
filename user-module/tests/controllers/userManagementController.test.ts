import { Request, Response } from "express";
import * as helpers from "../../src/utils/helpers";
import { constants } from "../../src/utils/constant";
import configurations from "../../src/config/config";
import {
  userProfiles,
  userRoles,
  userPermissionById,
  userPermissionFields,
  createProfile,
  updateUserExtendedPermissions,
  getUserExtendedPermissions,
  getProfilePermissions,
  updateProfilePermissions,
  exportUserProfiles,
  editProfilePermissions,
} from "../../src/controllers/userManagementController";

// ✅ Move mock object inside the mock function
jest.mock("../../src/config/config", () => {
  const userServicesMock = {
    permissionById: jest.fn(),
    getPermissionFieldsByIds: jest.fn(),
    roles: jest.fn(),
    profiles: jest.fn(),
    exportUserprofiles: jest.fn(),
    fetchUserExtendedpermission: jest.fn(),
    
  };

  const userManagementServicesMock = {
    createProfile: jest.fn(),
    getAllProfiles: jest.fn(),
    profilesList: jest.fn(),
    getProfilePermissions: jest.fn(),
    updateProfilePermissions: jest.fn(),
    updateUserExtendedPermissions: jest.fn()
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
          userManagementServices: userManagementServicesMock
        }),
        // Expose the mock for test access
        __mockServices__: {
          userServices: userServicesMock,
          userManagementServices: userManagementServicesMock
        },
      }),
    },
  };
});

// ✅ Import config again to access the exposed __mockServices__
const mockConfig = configurations as any;
const userServicesMock = mockConfig.getInstance().__mockServices__.userServices;
const userManagementServicesMock = mockConfig.getInstance().__mockServices__.userManagementServices;

// ✅ Mock helpers
jest.mock("../../src/utils/helpers", () => ({
  handleSuccessResponse: jest.fn(),
  handleErrorResponse: jest.fn(),
  successLog: jest.fn(),
  errorLog: jest.fn(),
  validateRequest: jest.fn().mockResolvedValue(true),
  requestErrorMessages: jest.fn().mockReturnValue([]),
}));

const createMockRequest = (params = {}, body = {}, query = {}) => ({
  params,
  body,
  query,
  headers: {
    'x-user-id': 'test-user-id'
  }
} as unknown as Request);
const createMockRequestUpdate = (params = {}, body = {}, query = {},originalUrl: string) => ({
  params,
  body,
  query,
  originalUrl,
  headers: {
    'x-user-id': 'test-user-id'
  }
} as unknown as Request);

const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
} as unknown as Response);


describe("userManagementController", () => {
  describe("userProfiles", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return all profiles if no query params are provided", async () => {
      userManagementServicesMock.getAllProfiles.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: [{ profile_id: "p1" }, { profile_id: "p2" }],
      });
      const req = createMockRequest();
      await userProfiles(req, mockResponse);
      expect(userManagementServicesMock.getAllProfiles).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ profile_id: "p1" }, { profile_id: "p2" }]
      );
    });

    it("should handle error when getAllProfiles fails", async () => {
      userManagementServicesMock.getAllProfiles.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage: "Failed to fetch profiles"
      });
      const req = createMockRequest();
      await userProfiles(req, mockResponse);
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Failed to fetch profiles"
      );
    });

    it("should return paginated profiles if query params are provided", async () => {
      userManagementServicesMock.profilesList.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: { profiles: [{ profile_id: "p1" }], total: 1 }
      });
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        page: "1",
        limit: "10",
        filters: JSON.stringify({}),
        sortBy: "profile_name",
        sortOrder: "ASC"
      });
      const req = createMockRequest({}, {}, { page: "1", limit: "10", sortBy: "profile_name", sortOrder: "ASC" });
      await userProfiles(req, mockResponse);
      expect(userManagementServicesMock.profilesList).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        { profiles: [{ profile_id: "p1" }], total: 1 }
      );
    });

    it("should handle error when profilesList fails", async () => {
      userManagementServicesMock.profilesList.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage: "Invalid filters"
      });
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        page: "1",
        limit: "10",
        filters: JSON.stringify({}),
        sortBy: "profile_name",
        sortOrder: "ASC"
      });
      const req = createMockRequest({}, {}, { page: "1", limit: "10", sortBy: "profile_name", sortOrder: "ASC" });
      await userProfiles(req, mockResponse);
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Invalid filters"
      );
    });

    it("should handle unexpected errors in userProfiles", async () => {
      userManagementServicesMock.getAllProfiles.mockRejectedValue(new Error("Unexpected error"));
      const req = createMockRequest();
      await userProfiles(req, mockResponse);
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        "Unexpected error"
      );
    });
  });

  describe("exportUserProfiles", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should export user profiles successfully", async () => {
      userServicesMock.exportUserprofiles.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: { exportProfiles: [{ profile_id: "p1" }] }
      });
      const req = createMockRequest({ profileId: "profile-123" });
      await exportUserProfiles(req, mockResponse);
      expect(userServicesMock.exportUserprofiles).toHaveBeenCalledWith("profile-123", "test-user-id");
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ profile_id: "p1" }]
      );
    });

    it("should handle error when exportUserprofiles fails", async () => {
      userServicesMock.exportUserprofiles.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage: "Export failed"
      });
      const req = createMockRequest({ profileId: "profile-123" });
      await exportUserProfiles(req, mockResponse);
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Export failed"
      );
    });

    it("should handle unexpected errors in exportUserProfiles", async () => {
      userServicesMock.exportUserprofiles.mockRejectedValue(new Error("Export error"));
      const req = createMockRequest({ profileId: "profile-123" });
      await exportUserProfiles(req, mockResponse);
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        "Export error"
      );
    });
  });
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
    it("should handle missing userId or permissionIds", async () => {
      const req = createMockRequest({}, {}, {});
      await userPermissionFields(req, mockResponse);
    
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "userId and permission ids are required"
      );
    });
    it("should return permission fields on success", async () => {
      userServicesMock.getPermissionFieldsByIds.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: [{ field: "test-field" }]
      });

      const req = createMockRequest(
        { userId: "user-id" }, 
        {}, 
        { id: "perm1,perm2" }
      );
      
      await userPermissionFields(req, mockResponse);

      expect(userServicesMock.getPermissionFieldsByIds).toHaveBeenCalledWith(
        "user-id",
        ["perm1", "perm2"]
      );
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        { data: [{ field: "test-field" }], statusCode: constants.SUCCESS }
      );
    });
  });

  describe("createProfile", () => {
    const validProfileData = {
      source_profile_id: "default",
      profile_name: "Test Profile",
      profile_description: "Test Description",
      profile_type: "CUSTOM"
    };

    beforeEach(() => {
      (helpers.validateRequest as jest.Mock).mockReturnValue(validProfileData);
    });

    it("should create profile successfully", async () => {
      userManagementServicesMock.createProfile.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: { 
          rid: "profile-123",
          ...validProfileData,
          privileges: []
        }
      });

      const req = createMockRequest({}, validProfileData);
      await createProfile(req, mockResponse);

      expect(userManagementServicesMock.createProfile).toHaveBeenCalledWith(
        expect.objectContaining(validProfileData),
        "test-user-id"
      );
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({ rid: "profile-123" })
      );
    });

    it("should handle service errors", async () => {
      userManagementServicesMock.createProfile.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage: "Profile exists"
      });

      const req = createMockRequest({}, validProfileData);
      await createProfile(req, mockResponse);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Profile exists"
      );
    });
  });
  describe("getProfilePermissions", () => {
    const profileId = "profile-123";
    const mockPermissions = {
      profile_id: profileId,
      privileges: [
        { type: "menu", id: "menu-1", name: "Main Menu" },
        { type: "module", id: "module-1", name: "Reporting" }
      ]
    };
  
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Default validation mock
      (helpers.validateRequest as jest.Mock).mockImplementation((req, schema) => {
        return Promise.resolve({
          type: req.query.type,
          id: req.query.id
        });
      });
    });

    it("should return permissions with valid type and id filters", async () => {
      userManagementServicesMock.getProfilePermissions.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: mockPermissions
      });

      const req = createMockRequest(
        { profileId },
        {},
        { type: "menu", id: "menu-1" }
      );
      
      await getProfilePermissions(req, mockResponse);

      expect(userManagementServicesMock.getProfilePermissions).toHaveBeenCalledWith({
        profileId,
        type: "menu",
        id: "menu-1"
      });

      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        mockPermissions
      );
    });

    it("should return all permissions when no filters provided", async () => {
      userManagementServicesMock.getProfilePermissions.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: mockPermissions
      });
  
      const req = createMockRequest({ profileId });
      await getProfilePermissions(req, mockResponse);
  
      expect(userManagementServicesMock.getProfilePermissions).toHaveBeenCalledWith({
        profileId,
        type: undefined,
        id: undefined
      });
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        mockPermissions
      );
    });

    it("should handle invalid profile ID", async () => {
      const errorMessage = "Profile not found";
      userManagementServicesMock.getProfilePermissions.mockResolvedValue({
        statusCode: constants.NOT_FOUND,
        errorMessage
      });
  
      const req = createMockRequest({ profileId: "invalid-profile" });
      await getProfilePermissions(req, mockResponse);
  
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle service errors", async () => {
      const errorMessage = "Invalid filter parameters";
      userManagementServicesMock.getProfilePermissions.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage
      });
  
      const req = createMockRequest(
        { profileId },
        {},
        { type: "invalid-type", id: "123" }
      );
      
      await getProfilePermissions(req, mockResponse);
  
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle unexpected errors", async () => {
      const errorMessage = "Database connection failed";
      userManagementServicesMock.getProfilePermissions.mockRejectedValue(
        new Error(errorMessage)
      );
  
      const req = createMockRequest({ profileId });
      await getProfilePermissions(req, mockResponse);
  
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle empty permission list", async () => {
      userManagementServicesMock.getProfilePermissions.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: { profile_id: profileId, privileges: [] }
      });
  
      const req = createMockRequest({ profileId });
      await getProfilePermissions(req, mockResponse);
  
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({ privileges: [] })
      );
    });
  });
  describe("updateProfilePermissions", () => {
    const validRequestBody = {
      profile_id: "profile-123",
      profile_name: "Updated Profile",
      privileges: [
        { rid: "perm-1", type: "menu", is_modified: true, is_enabled: true }
      ]
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (helpers.validateRequest as jest.Mock).mockReset();
      (helpers.handleErrorResponse as jest.Mock).mockReset();
    });
 
    it("should handle validation errors", async () => {
      // Mock validation to simulate failure
      (helpers.validateRequest as jest.Mock).mockImplementation(async (req, schema, org, res) => {
        // Directly call error handler to simulate validation failure behavior
        helpers.handleErrorResponse(
          res,
          constants.BAD_REQUEST,
          constants.BAD_REQUEST_MESSAGE,
          "Invalid request data"
        );
        return null;
      });
    
      // Create invalid request
      const req = {
        headers: { "x-user-id": "user-123" },
        body: {
          profile_id: "invalid$profile", // Invalid format
          privileges: [{}] // Invalid structure
        }
      } as unknown as Request;
    
      // Create response mock with proper chaining
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as unknown as Response;
    
      await updateProfilePermissions(req, mockResponse);
    
      // Verify service wasn't called
      expect(userManagementServicesMock.updateProfilePermissions).not.toHaveBeenCalled();
    
      // Verify error handling
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Invalid request data"
      );
    });

    it("should successfully update profile permissions", async () => {
      const mockServiceResponse = {
        statusCode: constants.SUCCESS,
        data: { updated_permission_count: 3 }
      };

      (helpers.validateRequest as jest.Mock).mockResolvedValue(validRequestBody);
      userManagementServicesMock.updateProfilePermissions.mockResolvedValue(mockServiceResponse);

      const req = createMockRequestUpdate(
        {},
        validRequestBody,
        {},
         "/api/profiles/update"
      );

      await updateProfilePermissions(req, mockResponse);

      expect(userManagementServicesMock.updateProfilePermissions).toHaveBeenCalledWith(
        validRequestBody.profile_id,
        "Updated Profile",
        validRequestBody.privileges,
        "test-user-id",
        "/api/profiles/update"
      );

      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        mockServiceResponse.data
      );
    });
  
    it("should handle service-level errors", async () => {
      // Arrange
      const errorMessage = "Profile not found";
      (helpers.validateRequest as jest.Mock).mockResolvedValue(validRequestBody);
      (userManagementServicesMock.updateProfilePermissions as jest.Mock).mockResolvedValue({
        statusCode: constants.NOT_FOUND,
        errorMessage
      });
  
      const req = createMockRequest({}, validRequestBody);
      const res = createMockResponse();
      // Act
      await updateProfilePermissions(req, res);
  
      // Assert
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle unexpected errors", async () => {
      // Arrange
      const errorMessage = "Database connection failed";
      (helpers.validateRequest as jest.Mock).mockResolvedValue(validRequestBody);
      (userManagementServicesMock.updateProfilePermissions as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );
  
      const req = createMockRequest({}, validRequestBody);
      const res = createMockResponse();
  
      // Act
      await updateProfilePermissions(req, res);
  
      // Assert
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        res,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle empty privileges list", async () => {
      // Arrange
      const emptyRequest = {
        ...createMockRequest(),
        body: {
          ...validRequestBody,
          privileges: []
        }
      };
  
      const mockServiceResponse = {
        statusCode: constants.SUCCESS,
        data: { updated_permission_count: 0 }
      };
  
      (helpers.validateRequest as jest.Mock).mockResolvedValue(emptyRequest.body);
      (userManagementServicesMock.updateProfilePermissions as jest.Mock).mockResolvedValue(mockServiceResponse);
  
      const req = emptyRequest as Request;
      const res = createMockResponse();
  
      // Act
      await updateProfilePermissions(req, res);
  
      // Assert
      expect(userManagementServicesMock.updateProfilePermissions).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        res,
        mockServiceResponse.data
      );
    });
  });

  describe("editProfilePermissions", () => {
    const validRequestBody = {
      profile_id: "profile-123",
      profile_name: "Updated Profile",
      privileges: [
        { rid: "perm-1", type: "menu", is_modified: true, is_enabled: true }
      ]
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (helpers.validateRequest as jest.Mock).mockReset();
      (helpers.handleErrorResponse as jest.Mock).mockReset();
    });
    it("should pass 'edit' event when URL is for editing", async () => {
      const mockServiceResponse = {
        statusCode: constants.SUCCESS,
        data: { updated_permission_count: 3 }
      };
    
      (helpers.validateRequest as jest.Mock).mockResolvedValue(validRequestBody);
      userManagementServicesMock.updateProfilePermissions.mockResolvedValue(mockServiceResponse);
    
      // Use the actual endpoint URL from the controller
      const req = createMockRequestUpdate(
        {},
        validRequestBody,
        {},
        "/api/profiles/edit" // Matches the real URL used in the controller
      );
    
      await editProfilePermissions(req, mockResponse);
    
      // Assert the full URL path is passed as the last argument
      expect(userManagementServicesMock.updateProfilePermissions).toHaveBeenCalledWith(
        validRequestBody.profile_id,
        validRequestBody.profile_name,
        validRequestBody.privileges,
        "test-user-id",
        "/api/profiles/edit" // Correct expected value
      );
    });
   
    it("should handle validation errors", async () => {
      // Mock validation to simulate failure
      (helpers.validateRequest as jest.Mock).mockImplementation(async (req, schema, org, res) => {
        // Directly call error handler to simulate validation failure behavior
        helpers.handleErrorResponse(
          res,
          constants.BAD_REQUEST,
          constants.BAD_REQUEST_MESSAGE,
          "Invalid request data"
        );
        return null;
      });
    
      // Create invalid request
      const req = {
        headers: { "x-user-id": "user-123" },
        body: {
          profile_id: "invalid$profile", // Invalid format
          privileges: [{}] // Invalid structure
        }
      } as unknown as Request;
    
      // Create response mock with proper chaining
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as unknown as Response;
    
      await editProfilePermissions(req, mockResponse);
    
      // Verify service wasn't called
      expect(userManagementServicesMock.updateProfilePermissions).not.toHaveBeenCalled();
    
      // Verify error handling
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Invalid request data"
      );
    });

    it("should successfully update profile permissions", async () => {
      const mockServiceResponse = {
        statusCode: constants.SUCCESS,
        data: { updated_permission_count: 3 }
      };

      (helpers.validateRequest as jest.Mock).mockResolvedValue(validRequestBody);
      userManagementServicesMock.updateProfilePermissions.mockResolvedValue(mockServiceResponse);

      const req = createMockRequestUpdate(
        {},
        validRequestBody,
        {},
         "/api/profiles/edit"
      );

      await updateProfilePermissions(req, mockResponse);

      expect(userManagementServicesMock.updateProfilePermissions).toHaveBeenCalledWith(
        validRequestBody.profile_id,
        "Updated Profile",
        validRequestBody.privileges,
        "test-user-id",
        "/api/profiles/edit"
      );

      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        mockServiceResponse.data
      );
    });
  
    it("should handle service-level errors", async () => {
      // Arrange
      const errorMessage = "Profile not found";
      (helpers.validateRequest as jest.Mock).mockResolvedValue(validRequestBody);
      (userManagementServicesMock.updateProfilePermissions as jest.Mock).mockResolvedValue({
        statusCode: constants.NOT_FOUND,
        errorMessage
      });
  
      const req = createMockRequest({}, validRequestBody);
      const res = createMockResponse();
      // Act
      await updateProfilePermissions(req, res);
  
      // Assert
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle unexpected errors", async () => {
      // Arrange
      const errorMessage = "Database connection failed";
      (helpers.validateRequest as jest.Mock).mockResolvedValue(validRequestBody);
      (userManagementServicesMock.updateProfilePermissions as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );
  
      const req = createMockRequest({}, validRequestBody);
      const res = createMockResponse();
  
      // Act
      await updateProfilePermissions(req, res);
  
      // Assert
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        res,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle empty privileges list", async () => {
      // Arrange
      const emptyRequest = {
        ...createMockRequest(),
        body: {
          ...validRequestBody,
          privileges: []
        }
      };
  
      const mockServiceResponse = {
        statusCode: constants.SUCCESS,
        data: { updated_permission_count: 0 }
      };
  
      (helpers.validateRequest as jest.Mock).mockResolvedValue(emptyRequest.body);
      (userManagementServicesMock.updateProfilePermissions as jest.Mock).mockResolvedValue(mockServiceResponse);
  
      const req = emptyRequest as Request;
      const res = createMockResponse();
  
      // Act
      await updateProfilePermissions(req, res);
  
      // Assert
      expect(userManagementServicesMock.updateProfilePermissions).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        res,
        mockServiceResponse.data
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
  describe("updateUserExtendedPermissions", () => {
    it("should handle successful permission updates", async () => {
      userManagementServicesMock.updateUserExtendedPermissions.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: { 
          profile_id: "profile-123",
          updated_permission_count: 2 
        }
      });

      const req = createMockRequest(
        {},
        {
          user_id: "user-123",
          profile_id: "profile-123",
          profile_name: "Test Profile",
          privileges: []
        }
      );
      
      await updateUserExtendedPermissions(req, mockResponse);
      
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({ 
          updated_permission_count: 2 
        })
      );
    });
    it("should handle invalid user ID", async () => {
      userManagementServicesMock.updateUserExtendedPermissions.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage: "Invalid user"
      });
    
      const req = createMockRequest({}, { user_id: "invalid" });
      await updateUserExtendedPermissions(req, mockResponse);
    
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Invalid user"
      );
    });
  });
  describe("getUserExtendedPermissions", () => {
    const userId = "user-123";
    const mockPermissions = {
      profile_id: "profile-123",
      privileges: [{ permission: "read" }, { permission: "write" }]
    };
    it("should handle empty extended permissions response", async () => {
      userServicesMock.fetchUserExtendedpermission.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: { privileges: [] }
      });
    
      const req = createMockRequest({ userId: "user-123" });
      await getUserExtendedPermissions(req, mockResponse);
    
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({ privileges: [] })
      );
    });
    it("should return user extended permissions on success", async () => {
      // Mock successful service response
      userServicesMock.fetchUserExtendedpermission.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: mockPermissions
      });
  
      const req = createMockRequest({ userId });
      await getUserExtendedPermissions(req, mockResponse);
  
      expect(userServicesMock.fetchUserExtendedpermission).toHaveBeenCalledWith(userId);
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        mockPermissions
      );
      expect(helpers.successLog).toHaveBeenCalledWith("Get User extended permission");
    });
  
    it("should handle service errors", async () => {
      // Mock service error response
      const errorMessage = "User not found";
      userServicesMock.fetchUserExtendedpermission.mockResolvedValue({
        statusCode: constants.NOT_FOUND,
        errorMessage
      });
  
      const req = createMockRequest({ userId });
      await getUserExtendedPermissions(req, mockResponse);
  
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle unexpected errors", async () => {
      // Mock service throwing unexpected error
      const errorMessage = "Database connection failed";
      userServicesMock.fetchUserExtendedpermission.mockRejectedValue(new Error(errorMessage));
  
      const req = createMockRequest({ userId });
      await getUserExtendedPermissions(req, mockResponse);
  
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle invalid user ID format", async () => {
      const invalidUserId = "invalid-user-id-123";
      const errorMessage = "Invalid user ID format";
      
      // Mock service validation error
      userServicesMock.fetchUserExtendedpermission.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage
      });
  
      const req = createMockRequest({ userId: invalidUserId });
      await getUserExtendedPermissions(req, mockResponse);
  
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle empty permissions response", async () => {
      // Mock successful but empty response
      userServicesMock.fetchUserExtendedpermission.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: { privileges: [] }
      });
  
      const req = createMockRequest({ userId });
      await getUserExtendedPermissions(req, mockResponse);
  
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({ privileges: [] })
      );
    });
  });
  describe("exportUserProfiles", () => {
    it("should export user profiles successfully", async () => {
      const mockData = "base64EncodedString"; // Mock base64 encoded buffer
      userServicesMock.exportUserprofiles.mockResolvedValue({
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          exportProfiles: mockData
        }
      });
      const req = createMockRequest({ profileId: "test-profile-id" });
      await exportUserProfiles(req, mockResponse);
      expect(userServicesMock.exportUserprofiles).toHaveBeenCalledWith("test-profile-id", "test-user-id");
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        "base64EncodedString"
      );
    });
    it("should handle invalid profile ID during export", async () => {
      userServicesMock.exportUserprofiles.mockResolvedValue({
        statusCode: constants.NOT_FOUND,
        errorMessage: "Profile not found"
      });
    
      const req = createMockRequest({ profileId: "invalid" });
      await exportUserProfiles(req, mockResponse);
    
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Profile not found"
      );
    });
    it("should handle service errors", async () => {
      const errorMessage = "Export failed";
      userServicesMock.exportUserprofiles.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage,
      });
  
      const req = createMockRequest();
      await exportUserProfiles(req, mockResponse);
  
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessage
      );
    });
  
    it("should handle unexpected errors", async () => {
      const errorMessage = "Unexpected error";
      userServicesMock.exportUserprofiles.mockRejectedValue(new Error(errorMessage));
  
      const req = createMockRequest();
      await exportUserProfiles(req, mockResponse);
  
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        errorMessage
      );
    });
  });
  describe("userProfiles", () => {
    beforeEach(() => {
      // Mock validateRequest to return query parameters for this suite
      (helpers.validateRequest as jest.Mock).mockImplementation(async (req) => ({
        page: req.query.page,
        limit: req.query.limit,
        filters: req.query.filters,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      }));
    });
    it("should handle profiles with pagination and filters", async () => {
      userManagementServicesMock.profilesList.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: [{ id: "profile1" }]
      });
  
      const req = createMockRequest(
        {}, 
        {}, 
        { 
          page: "2", 
          limit: "10", 
          filters: '{"type":"admin"}' 
        }
      );
      
      await userProfiles(req, mockResponse);
  
      // Service should receive parsed filters
      expect(userManagementServicesMock.profilesList).toHaveBeenCalledWith(
        2,
        10,
        { type: "admin" }, // Now correctly parsed
        undefined,
        undefined
      );
    });
    it("should handle non-integer page/limit parameters", async () => {
      const req = createMockRequest(
        {}, 
        {}, 
        { page: "invalid", limit: "NaN" }
      );
      
      await userProfiles(req, mockResponse);
    
      // Verify defaults are used
      expect(userManagementServicesMock.profilesList).toHaveBeenCalledWith(
        1, // Default page
        10, // Default limit
        {},
        undefined,
        undefined
      );
    });
    it("should handle service error when fetching filtered profiles", async () => {
      userManagementServicesMock.profilesList.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage: "Invalid sort parameter"
      });
    
      const req = createMockRequest(
        {}, 
        {}, 
        { page: "1", limit: "10", sortBy: "invalid_column" }
      );
      
      await userProfiles(req, mockResponse);
    
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "Invalid sort parameter"
      );
    });
    it("should handle invalid filters", async () => {
      const req = createMockRequest({}, {}, { filters: "invalid" });
      await userProfiles(req, mockResponse);
    
      expect(helpers.errorLog).toHaveBeenCalledWith("User profiles", "Invalid filters format. Must be a valid JSON object.");
    });
    it("should return user profiles successfully", async () => {
      userManagementServicesMock.getAllProfiles.mockResolvedValue({
        statusCode: constants.SUCCESS,
        data: [{ id: "profile1", name: "Basic User" }]
      });

      const req = createMockRequest();
      await userProfiles(req, mockResponse);

      expect(userManagementServicesMock.getAllProfiles).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ id: "profile1", name: "Basic User" }]
      );
    });

    it("should handle service error for profiles", async () => {
      userManagementServicesMock.getAllProfiles.mockResolvedValue({
        statusCode: constants.BAD_REQUEST,
        errorMessage: "Invalid parameter"
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
      userManagementServicesMock.getAllProfiles.mockRejectedValue(
        new Error("Timeout error")
      );

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