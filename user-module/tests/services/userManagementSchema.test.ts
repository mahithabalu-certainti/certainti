process.env.KEY_VAULT_URI = "https://mock-keyvault.vault.azure.net";
process.env.ORGDB_NAME = "rdcredits_orgdb";
process.env.ORGDB_PASSWORD = "myuser";
process.env.ORGDB_USERNAME = "mysecretpassword";
process.env.ORGDB_ENDPOINT = "localhost";

process.env.MAINDB_NAME = "certainty_local";
process.env.MAINDB_USERNAME = "Sumi@2271";
process.env.MAINDB_PASSWORD = "postgres";
process.env.MAINDB_ENDPOINT = "localhost";

import UserService from "../../src/services/userService";
import { User } from "../../src/models/userModel";
import { BusinessTeams } from "../../src/models/businessTeamModel";
import { PermissionField } from "../../src/models/permissionFieldModel";
import { ProfileFieldsAccess } from "../../src/models/profileFieldsAccessModel";
import { UserFieldsAccess } from "../../src/models/userFieldsAccessModel";
import { constants } from "../../src/utils/constant";

jest.mock("../../src/models/userModel", () => ({
  User: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock("../../src/models/businessTeamModel", () => ({
  BusinessTeams: {
    findOne: jest.fn(),
  },
}));

jest.mock("../../src/models/permissionFieldModel", () => ({
  PermissionField: {
    findAll: jest.fn(),
  },
}));

jest.mock("../../src/models/profileFieldsAccessModel", () => ({
  ProfileFieldsAccess: {
    findAll: jest.fn(),
  },
}));

jest.mock("../../src/models/userFieldsAccessModel", () => ({
  UserFieldsAccess: {
    findAll: jest.fn(),
  },
}));

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe("permissionById", () => {
    const mockAzureId = "azure-123";
    const mockProfileId = "profile-123";

    it("should return permissions for valid user", async () => {
      // Mock user with business teams
      (User.findOne as jest.Mock).mockResolvedValue({
        rid: "user-123",
        role_rid: "role-123",
        profile_rid: mockProfileId,
        business_teams: { business_teams: "Admin" },
      });

      // Mock permissions
      const mockPermissions = [{ id: "perm1" }];
      jest.spyOn(userService, 'getAllUserPermission').mockResolvedValue(mockPermissions);

      const result = await userService.permissionById(mockAzureId);

      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data).toEqual({
        rid: "role-123",
        user_role: "Admin",
        user_id: "user-123",
        permissions: mockPermissions
      });
    });

    it("should return not found for missing user", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      const result = await userService.permissionById(mockAzureId);
      expect(result.statusCode).toBe(constants.NOT_FOUND);
    });

    it("should handle missing business teams", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        business_teams: null
      });
      
      const result = await userService.permissionById(mockAzureId);
      expect(result.statusCode).toBe(constants.NOT_FOUND);
    });

    it("should handle database errors", async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error("DB Error"));
      const result = await userService.permissionById(mockAzureId);
      expect(result.statusCode).toBe(constants.FAILED);
    });
  });

  describe("getPermissionFieldsByIds", () => {
    const mockUserId = "user-123";
    const mockPermissionIds = ["perm1", "perm2"];

    it("should return fields with access data", async () => {
      // Mock user profile
      (User.findOne as jest.Mock).mockResolvedValue({
        profile_rid: "profile-123"
      });

      // Mock permission fields
      (PermissionField.findAll as jest.Mock).mockResolvedValue([
        { rid: "field1", module_permission_id: "perm1" }
      ]);

      // Mock access data
      (ProfileFieldsAccess.findAll as jest.Mock).mockResolvedValue([
        { permission_field_id: "field1", read: true, edit: false }
      ]);
      (UserFieldsAccess.findAll as jest.Mock).mockResolvedValue([
        { permission_field_id: "field1", read: false, edit: true }
      ]);

      const result = await userService.getPermissionFieldsByIds(mockUserId, mockPermissionIds);
      expect(result).toEqual({
        perm1: [{
          name: undefined,
          desc: undefined,
          read: true,
          edit: true
        }],
        perm2: []
      });
    });

    it("should handle missing profile", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ profile_rid: null });
      
      const result = await userService.getPermissionFieldsByIds(mockUserId, mockPermissionIds);
      expect(result.statusCode).toBe(constants.NOT_FOUND);
    });

    it("should handle empty permission IDs", async () => {
      const result = await userService.getPermissionFieldsByIds(mockUserId, []);
      expect(result).toEqual({
        statusCode: constants.NOT_FOUND,
        message: "NotFound",
        errorMessage: "No profile found for the given userId",
        data: {}
      });
    });

    it("should handle database errors", async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error("DB Error"));
      const result = await userService.getPermissionFieldsByIds(mockUserId, mockPermissionIds);
      expect(result.statusCode).toBe(constants.FAILED);
    });
  });
});