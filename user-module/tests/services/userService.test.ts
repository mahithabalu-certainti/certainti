process.env.KEY_VAULT_URI = "https://mock-keyvault.vault.azure.net";
process.env.ORGDB_NAME = "rdcredits_orgdb";
process.env.ORGDB_PASSWORD = "myuser";
process.env.ORGDB_USERNAME = "mysecretpassword";
process.env.ORGDB_ENDPOINT = "localhost";

process.env.MAINDB_NAME = "certainty_local";
process.env.MAINDB_USERNAME = "Sumi@2271";
process.env.MAINDB_PASSWORD = "postgres";
process.env.MAINDB_ENDPOINT = "localhost";

// userService.test.ts

import UserService from "../../src/services/userService";
import { BusinessTeams } from "../../src/models/businessTeamModel";
import { Profile } from "../../src/models/profileModel";
import { User } from "../../src/models/userModel";
import { PermissionField } from "../../src/models/permissionFieldModel";
import { ProfileFieldsAccess } from "../../src/models/profileFieldsAccessModel";
import { UserFieldsAccess } from "../../src/models/userFieldsAccessModel";
import { UserDetails } from "../../src/models/userDetailsModel";


import { constants } from "../../src/utils/constant";
import { Op } from "sequelize";

// Mock all required models
jest.mock("../../src/models/userModel", () => ({
  User: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAndCountAll: jest.fn(),
  },
}));

jest.mock("../../src/models/profileModel", () => ({
  Profile: {
    findAll: jest.fn(),
  },
}));

jest.mock("../../src/models/businessTeamModel", () => ({
  BusinessTeams: {
    findAll: jest.fn(),
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

jest.mock("../../src/models/userDetailsModel", () => ({
  UserDetails: {
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock("../../src/config/dataSource", () => ({
  initializeDataSource: jest.fn().mockResolvedValue({
    authenticate: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([{
      country_name: "USA",
      state_name: "California",
      city_name: "Los Angeles"
    }]),
    close: jest.fn()
  })
}));

describe("UserService", () => {
  let userService: UserService;
  
  const mockUser = {
    rid: "user-123",
    email: "test@example.com",
    first_name: "Test",
    full_name: "Test User",
    status: "active",
    profile_rid: "profile-123",
    profile: { 
      profile_name: "Test Profile",
      get: jest.fn().mockReturnValue({ profile_name: "Test Profile" })
    },
    business_teams: { 
      business_teams: "Admin",
      get: jest.fn().mockReturnValue({ business_teams: "Admin" })
    },
    created_by: "admin-123",
    modified_by: "admin-123",
    get: jest.fn().mockImplementation(function(this: any) {
      return {
        ...this,
        toJSON: () => this
      };
    })
  };

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe("Core User Operations", () => {
    describe("getUserByEmail", () => {
      it("should return user for valid email", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        const result = await userService.getUserByEmail("test@example.com");
        expect(result).toEqual(mockUser);
      });

      it("should return null for non-existent email", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        const result = await userService.getUserByEmail("invalid@example.com");
        expect(result).toBeNull();
      });
    });

    describe("createUser", () => {
      const userData = {
        email: "new@example.com",
        first_name: "John",
        last_name: "Doe",
        profile_id: "profile-123",
        organization: constants.PLATFORM_ONE,
        status: "active",
        street: "123 Main St",
        city: "Metropolis",
        state: "CA",
        country: "USA",
        zip_code: "12345",
        phone: "1234567890",
        role: "User",
        created_by: "admin-123"
      };

      it("should create user successfully", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ rid: "new-user" });
        (UserDetails.create as jest.Mock).mockResolvedValue({});

        const result = await userService.createUser(userData, "azure-123", "admin-123");
        expect(result.statusCode).toBe(constants.SUCCESS);
      });
    });

    describe("updateUser", () => {
      const updateData = {
        first_name: "Updated",
        last_name: "User",
        profile_id: "profile-456",
        organization: constants.PLATFORM_ONE,
        status: "active",
        street: "456 Main St",
        city: "Metropolis",
        state: "CA",
        country: "USA",
        zip_code: "54321",
        phone: "0987654321",
        role: "User",  
        created_by: "admin-123",
        modified_by: "admin-123"
      };

      it("should update user successfully", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (User.update as jest.Mock).mockResolvedValue([1]);
        const result = await userService.updateUser(updateData, "user-123", "admin-123");
        expect(result.statusCode).toBe(constants.SUCCESS);
      });

      it("should handle user not found", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        const result = await userService.updateUser(updateData, "invalid-id", "admin-123");
        expect(result.statusCode).toBe(constants.NOT_FOUND);
      });
    });
  });

  describe("User Listing Operations", () => {
    describe("listUsers", () => {
      it("should return paginated users", async () => {
        (User.findAndCountAll as jest.Mock).mockResolvedValue({
          rows: [mockUser],
          count: 1
        });

        const result = await userService.listUsers(1, 10, "search", {}, "email", "ASC", constants.PLATFORM_TWO);
        expect(result.data?.count).toBe(1);
      });

      it("should handle empty results", async () => {
        (User.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });
        const result = await userService.listUsers(1, 10, "", {}, "email", "ASC", constants.PLATFORM_TWO);
        expect(result.data?.count).toBe(0);
      });
    });

    describe("listUserById", () => {
      it("should return user details for PLATFORM_ONE", async () => {
        (UserDetails.findAll as jest.Mock).mockResolvedValue([{ user_id: "user-123" }]);
        const result = await userService.listUserById("user-123", constants.PLATFORM_ONE);
        expect(result.statusCode).toBe(constants.SUCCESS);
      });
    });
    describe("exportUsers", () => {
    it("should export user data", async () => {
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [{
          ...mockUser,
          toJSON: () => ({
            ...mockUser,
            profile: { profile_name: "Test Profile" },
            business_teams: { business_teams: "Admin" }
          })
        }],
        count: 1
      });
    
      const result = await userService.exportUsers("search", {}, "email", "ASC", constants.PLATFORM_TWO);
      expect(result.data?.users).toEqual([{
        "Username": "Test",
        "Full name": "Test User",
        "Email": "test@example.com",
        "Profile": "Test Profile",
        "Status": "active"
      }]);
    });
  });

  describe("Permission Operations", () => {
    describe("permissionById", () => {
      it("should return user permissions", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        jest.spyOn(userService, 'getAllUserPermission').mockResolvedValue([{
          type: "menu",
          name: "Dashboard",
          is_enabled: true
        }]);

        const result = await userService.permissionById("azure-123");
        expect(result.data?.permissions.length).toBe(1);
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

  describe("Metadata Operations", () => {
    describe("roles", () => {
      it("should return all roles", async () => {
        (BusinessTeams.findAll as jest.Mock).mockResolvedValue([{ rid: "role-123" }]);
        const result = await userService.roles();
        expect(result.data?.roles.length).toBe(1);
      });
    });

    describe("profiles", () => {
      it("should return all profiles", async () => {
        (Profile.findAll as jest.Mock).mockResolvedValue([{ rid: "profile-123" }]);
        const result = await userService.profiles();
        expect(result.data?.profiles.length).toBe(1);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors in createUser", async () => {
      (User.create as jest.Mock).mockRejectedValue(new Error("DB Failure"));
      const result = await userService.createUser(
        { email: "test@example.com" } as any,
        "azure-123",
        "admin-123"
      );
      expect(result.statusCode).toBe(constants.FAILED);
    });

    it("should handle database errors in listUsers", async () => {
      (User.findAndCountAll as jest.Mock).mockRejectedValue(new Error("DB Failure"));
      const result = await userService.listUsers(1, 10, "", {}, "email", "ASC", constants.PLATFORM_TWO);
      expect(result.statusCode).toBe(constants.FAILED);
    });
  });
});
});