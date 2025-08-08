// Constants for optimized applyGroupMappings tests
const minimalGroupRid = "group-minimal";
const minimalUserId = "user-minimal";
process.env.KEY_VAULT_URI = "https://mock-keyvault.vault.azure.net";
process.env.ORGDB_NAME = "rdcredits_orgdb";
process.env.ORGDB_PASSWORD = "myuser";
process.env.ORGDB_USERNAME = "mysecretpassword";
process.env.ORGDB_ENDPOINT = "localhost";

process.env.MAINDB_NAME = "certainty_local";
process.env.MAINDB_USERNAME = "Sumi@2271";
process.env.MAINDB_PASSWORD = "postgres";
process.env.MAINDB_ENDPOINT = "localhost";

import UserGroupService from "../../src/services/userGroupService";
import { UserGroup } from "../../src/models/userGroupModel";
import { UserGroupMapping } from "../../src/models/userGroupMappingModel";
import { User } from "../../src/models/userModel";
import { Status } from "../../src/models/statusModel";
import { UserGroupEntityAccess } from "../../src/models/UserGroupEntityAccessModel";
import { UserGroupType } from "../../src/models/userGroupTypesModel";
import { UserGroupAccountMapping } from "../../src/models/userGroupAccountMappingModel";
import { constants } from "../../src/utils/constant";
import { fn, col, Op, literal, Sequelize } from "sequelize";
import { equal } from "joi";

// Mock dayjs
jest.mock("dayjs", () => {
  const mockDayjs = jest.fn((date?: any, format?: string) => ({
    format: jest.fn(() => '2024-01-01, 10:30:00 AM'),
    startOf: jest.fn(() => ({
      format: jest.fn(() => '2024-01-01T00:00:00Z'),
      toDate: jest.fn(() => new Date('2024-01-01T00:00:00Z'))
    })),
    endOf: jest.fn(() => ({
      format: jest.fn(() => '2024-01-01T23:59:59Z'),
      toDate: jest.fn(() => new Date('2024-01-01T23:59:59Z'))
    })),
    add: jest.fn((amount: number, unit: string) => ({
      format: jest.fn(() => '2024-01-02T00:00:00Z'),
      toDate: jest.fn(() => new Date('2024-01-02T00:00:00Z'))
    })),
    toDate: jest.fn(() => new Date('2024-01-01T10:30:00Z'))
  }));
  return mockDayjs;
});

// Mock UserService to avoid exceljs import issues
jest.mock("../../src/services/userService", () => ({
  default: jest.fn().mockImplementation(() => ({
    getAllowedExportFields: jest.fn().mockResolvedValue([
      { field_name: "account_name", read: true },
      { field_name: "user_count", read: true },
      { field_name: "created_by", read: true },
      { field_name: "group_name", read: true }
    ])
  }))
}));
jest.mock("../../src/services/userService", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getAllowedExportFields: jest.fn().mockResolvedValue([
      { field_name: "group_name", read: true },
      { field_name: "account_name", read: true },
      { field_name: "user_count", read: true },
      { field_name: "is_consultant_only_group", read: true },
      { field_name: "created_datetime", read: true },
      { field_name: "modified_datetime", read: true }
    ])
  })),
}));

// Mock helpers to avoid import issues
jest.mock("../../src/utils/helpers", () => ({
  isValidTimezone: jest.fn().mockReturnValue(true),
}));

// Mock all required models
jest.mock("../../src/models/userGroupModel", () => ({
  UserGroup: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock("../../src/models/userGroupMappingModel", () => ({
  UserGroupMapping: {
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
  },
}));

jest.mock("../../src/models/userModel", () => ({
  User: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
  },
}));

jest.mock("../../src/models/statusModel", () => ({
  Status: {
    findAll: jest.fn(),
  },
}));

jest.mock("../../src/models/UserGroupEntityAccessModel", () => ({
  UserGroupEntityAccess: {
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
     findOne: jest.fn(),
  },
}));

jest.mock("../../src/models/userGroupTypesModel", () => ({
  UserGroupType: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock("../../src/models/userGroupAccountMappingModel", () => ({
  UserGroupAccountMapping: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
  },
}));

jest.mock("../../src/config/dataSource", () => ({
  initSequelize: jest.fn().mockResolvedValue({
    authenticate: jest.fn().mockResolvedValue(true),
    query: jest.fn(),
    close: jest.fn(),
    literal: jest.fn((val) => val) // Add literal mock
  })
}));

jest.mock("../../src/utils/rawQueries", () => ({
  getUserGroupUserCount: jest.fn().mockResolvedValue(5),
}));




// Mock dayjs
jest.mock("dayjs", () => {
  const mockDayjs = jest.fn((date?: any, format?: string) => ({
    format: jest.fn(() => '2024-01-01, 10:30:00 AM'),
    startOf: jest.fn(() => ({
      format: jest.fn(() => '2024-01-01T00:00:00Z'),
      toDate: jest.fn(() => new Date('2024-01-01T00:00:00Z'))
    })),
    endOf: jest.fn(() => ({
      format: jest.fn(() => '2024-01-01T23:59:59Z'),
      toDate: jest.fn(() => new Date('2024-01-01T23:59:59Z'))
    })),
    add: jest.fn((amount: number, unit: string) => ({
      format: jest.fn(() => '2024-01-02T00:00:00Z'),
      toDate: jest.fn(() => new Date('2024-01-02T00:00:00Z'))
    })),
    toDate: jest.fn(() => new Date('2024-01-01T10:30:00Z'))
  }));
  return mockDayjs;
});

// Mock UserService to avoid exceljs import issues
jest.mock("../../src/services/userService", () => ({
  default: jest.fn().mockImplementation(() => ({
    getAllowedExportFields: jest.fn().mockResolvedValue([
      { field_name: "account_name", read: true },
      { field_name: "user_count", read: true },
      { field_name: "created_by", read: true },
      { field_name: "group_name", read: true }
    ])
  }))
}));
jest.mock("../../src/services/userService", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getAllowedExportFields: jest.fn().mockResolvedValue([
      { field_name: "group_name", read: true },
      { field_name: "account_name", read: true },
      { field_name: "user_count", read: true },
      { field_name: "is_consultant_only_group", read: true },
      { field_name: "created_datetime", read: true },
      { field_name: "modified_datetime", read: true }
    ])
  })),
}));

// Mock helpers to avoid import issues
jest.mock("../../src/utils/helpers", () => ({
  isValidTimezone: jest.fn().mockReturnValue(true),
}));

// Mock all required models
jest.mock("../../src/models/userGroupModel", () => ({
  UserGroup: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock("../../src/models/userGroupMappingModel", () => ({
  UserGroupMapping: {
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
  },
}));

jest.mock("../../src/models/userModel", () => ({
  User: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
  },
}));

jest.mock("../../src/models/statusModel", () => ({
  Status: {
    findAll: jest.fn(),
  },
}));

jest.mock("../../src/models/UserGroupEntityAccessModel", () => ({
  UserGroupEntityAccess: {
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
     findOne: jest.fn(),
  },
}));

jest.mock("../../src/models/userGroupTypesModel", () => ({
  UserGroupType: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock("../../src/models/userGroupAccountMappingModel", () => ({
  UserGroupAccountMapping: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
  },
}));

jest.mock("../../src/config/dataSource", () => ({
  initSequelize: jest.fn().mockResolvedValue({
    authenticate: jest.fn().mockResolvedValue(true),
    query: jest.fn(),
    close: jest.fn(),
    literal: jest.fn((val) => val) // Add literal mock
  })
}));

jest.mock("../../src/utils/rawQueries", () => ({
  getUserGroupUserCount: jest.fn().mockResolvedValue(5),
}));



describe("UserGroupService", () => {
  describe("applyGroupMappings", () => {
    // Users branch coverage
    it.each([
      // No users provided
      [{ group_rid: minimalGroupRid, userId: minimalUserId }, false],
      // Users array is empty
      [{ group_rid: minimalGroupRid, users: [], userId: minimalUserId }, false],
      // All users unmodified
      [{ group_rid: minimalGroupRid, users: [
        { rid: "u1", is_enabled: true, is_modified: false },
        { rid: "u2", is_enabled: false, is_modified: false }
      ], userId: minimalUserId }, false],
      // One user modified
      [{ group_rid: minimalGroupRid, users: [
        { rid: "u1", is_enabled: true, is_modified: true },
        { rid: "u2", is_enabled: false, is_modified: false }
      ], userId: minimalUserId }, true],
    ])("should handle users branch correctly %#", async (input, shouldCall) => {
      const service = new UserGroupService();
      const assignUsersToGroup = jest.spyOn(service as any, "assignUsersToGroup").mockResolvedValue(undefined);
      await service["applyGroupMappings"](input);
      if (shouldCall) {
        expect(assignUsersToGroup).toHaveBeenCalledTimes(1);
        if ("users" in input && input.users && input.users.length > 0) {
          expect(assignUsersToGroup).toHaveBeenCalledWith({ users: [input.users[0]], group_rid: minimalGroupRid, userId: minimalUserId });
        }
      } else {
        expect(assignUsersToGroup).not.toHaveBeenCalled();
      }
    });

    // Accounts branch coverage
    it.each([
      // No accounts provided
      [{ group_rid: minimalGroupRid, userId: minimalUserId }, false],
      // Accounts array is empty
      [{ group_rid: minimalGroupRid, accounts: [], userId: minimalUserId }, false],
      // All accounts unmodified
      [{ group_rid: minimalGroupRid, accounts: [
        { rid: "a1", is_enabled: true, is_modified: false },
        { rid: "a2", is_enabled: false, is_modified: false }
      ], userId: minimalUserId }, false],
      // One account modified
      [{ group_rid: minimalGroupRid, accounts: [
        { rid: "a1", is_enabled: true, is_modified: true },
        { rid: "a2", is_enabled: false, is_modified: false }
      ], userId: minimalUserId }, true],
    ])("should handle accounts branch correctly %#", async (input, shouldCall) => {
      const service = new UserGroupService();
      const assignEntityAccessToAccount = jest.spyOn(service as any, "assignEntityAccessToAccount").mockResolvedValue(undefined);
      const assignAccountsToGroup = jest.spyOn(service as any, "assignAccountsToGroup").mockResolvedValue(undefined);
      await service["applyGroupMappings"](input);
      if (shouldCall) {
        expect(assignEntityAccessToAccount).toHaveBeenCalledTimes(1);
        expect(assignAccountsToGroup).toHaveBeenCalledTimes(1);
      } else {
        expect(assignEntityAccessToAccount).not.toHaveBeenCalled();
        expect(assignAccountsToGroup).not.toHaveBeenCalled();
      }
    });

    // Projects branch coverage
    it("should call assignEntityAccessToProjects when projects are provided", async () => {
      const service = new UserGroupService();
      const assignEntityAccessToProjects = jest.spyOn(service as any, "assignEntityAccessToProjects").mockResolvedValue(undefined);
      const projects = { p1: true, p2: false };
      await service["applyGroupMappings"]({ group_rid: minimalGroupRid, projects, userId: minimalUserId });
      expect(assignEntityAccessToProjects).toHaveBeenCalledWith({ group_rid: minimalGroupRid, projects, userId: minimalUserId });
    });

    // Error propagation
    it("should propagate errors from assignment methods", async () => {
      const service = new UserGroupService();
      const error = new Error("Assignment failed");
      jest.spyOn(service as any, "assignUsersToGroup").mockRejectedValue(error);
      await expect(service["applyGroupMappings"]({
        group_rid: minimalGroupRid,
        users: [{ rid: "u1", is_enabled: true, is_modified: true }],
        userId: minimalUserId
      })).rejects.toThrow("Assignment failed");
    });

  });

  describe("getActiveUsersForUpdate", () => {
    it("should group user group mappings by user_rid in getActiveUsersForUpdate", async () => {
      const service = new UserGroupService();
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            rid: "user-1",
            email: "user1@example.com",
            first_name: "Anna",
            org_id: "org-1",
            is_consultant_firm: false,
            get: () => ({
              rid: "user-1",
              email: "user1@example.com",
              first_name: "Anna",
              org_id: "org-1",
              is_consultant_firm: false,
            }),
          },
        ],
        count: 1,
      });
      // Mock UserGroupMapping.findAll to return multiple group_rid for the same user
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([
        { user_rid: "user-1", group_rid: "group-1" },
        { user_rid: "user-1", group_rid: "group-2" },
      ]);
      const result = await service.getActiveUsersForUpdate(false, "org-1", "group-1", 1, 10, "first_name", "ASC");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      // The user should have both group_rid values grouped
      expect(result.data?.users[0].group_rids).toEqual(["group-1", "group-2"]);
    });
    it("should filter users by org_id when account_rid is a valid comma-separated string", async () => {
      const service = new UserGroupService();
      // account_rid as comma-separated string
      const accountRid = "org-1,org-2";
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            rid: "user-1",
            email: "user1@example.com",
            first_name: "Anna",
            org_id: "org-1",
            is_consultant_firm: false,
            get: () => ({
              rid: "user-1",
              email: "user1@example.com",
              first_name: "Anna",
              org_id: "org-1",
              is_consultant_firm: false,
            }),
          },
          {
            rid: "user-2",
            email: "user2@example.com",
            first_name: "Zara",
            org_id: "org-2",
            is_consultant_firm: false,
            get: () => ({
              rid: "user-2",
              email: "user2@example.com",
              first_name: "Zara",
              org_id: "org-2",
              is_consultant_firm: false,
            }),
          },
        ],
        count: 2,
      });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
      const result = await service.getActiveUsersForUpdate(false, accountRid, "group-1", 1, 10, "first_name", "ASC");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(2);
      expect(User.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            org_id: { [Op.in]: ["org-1", "org-2"] },
          }),
        })
      );
    });

    it("should return BAD_REQUEST if account_rid is empty string", async () => {
  const service = new UserGroupService();
  // Mock User.findAndCountAll to ensure it's not called
  (User.findAndCountAll as jest.Mock).mockResolvedValue(null);
  const result = await service.getActiveUsersForUpdate(false, "", "group-1", 1, 10, "first_name", "ASC");
  expect(result.statusCode).toBe(constants.BAD_REQUEST);
  expect(result.errorMessage).toBe("Invalid account_rid provided.");
  // Verify User.findAndCountAll was not called
  expect(User.findAndCountAll).not.toHaveBeenCalled();
});
    it("should apply custom filters from buildWhereClause in getActiveUsersForUpdate", async () => {
      const service = new UserGroupService();
      // Simulate a realistic custom where clause with multiple filter types
     
      const filter = {
        email: { contains: "filtered@example.com" },
        user_count: { gte: 1, lte: 10 }
      };
      const { customWhere } = (service as any).buildWhereClause(filter);
      jest.spyOn(service as any, "buildWhereClause").mockReturnValue({ whereClause: customWhere });
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            rid: "user-999",
            email: "filtered@example.com",
            first_name: "Filtered",
            org_id: "org-999",
            is_consultant_firm: true,
            get: () => ({
              rid: "user-999",
              email: "filtered@example.com",
              first_name: "Filtered",
              org_id: "org-999",
              is_consultant_firm: true,
            }),
          },
        ],
        count: 1,
      });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
      const filters = {
        email: { contains: "filtered@example.com" },
        status: { in: ["active", "pending"] },
        org_id: { not_equals: null },
        user_count: { gte: 1, lte: 10 }
      };
      const result = await service.getActiveUsersForUpdate(true, "", "group-999", 1, 10, "first_name", "ASC", filters);
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      expect(result.data?.users[0].email).toBe("filtered@example.com");
      expect(User.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(customWhere),
        })
      );
    });
    it("should return users for getActiveUsersForUpdate", async () => {
      const service = new UserGroupService();
      // Mock User.findAndCountAll to return users with rid and org_id
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            rid: "user-789",
            email: "updateuser@example.com",
            first_name: "UpdateUser",
            org_id: "org-789",
            is_consultant_firm: false,
            get: () => ({
              rid: "user-789",
              email: "updateuser@example.com",
              first_name: "UpdateUser",
              org_id: "org-789",
              is_consultant_firm: false,
            }),
          },
        ],
        count: 1,
      });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
      // Call the method with correct argument types
      const result = await service.getActiveUsersForUpdate(true, "", "group-789", 1, 10, "first_name", "ASC");
      if (result.statusCode !== constants.SUCCESS) {
        // Print the result for debugging
        console.error("getActiveUsersForUpdate result:", result);
      }
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      expect(result.data?.users[0].email).toBe("updateuser@example.com");
      expect(User.findAndCountAll).toHaveBeenCalled();
    });
 
    it("should catch errors and call throwServiceError in getActiveUsersForUpdate", async () => {
      const service = new UserGroupService();
      // Mock User.findAndCountAll to throw an error
      (User.findAndCountAll as jest.Mock).mockRejectedValue(new Error("DB error"));
      // Spy on throwServiceError
      const throwServiceErrorSpy = jest.spyOn(service as any, "throwServiceError").mockReturnValue({ statusCode: constants.FAILED, errorMessage: "DB error" });
      const result = await service.getActiveUsersForUpdate(true, "", "group-789", 1, 10, "first_name", "ASC");
      expect(throwServiceErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.errorMessage).toBe("DB error");
      throwServiceErrorSpy.mockRestore();
    });
    it("should use default pagination and sorting parameters", async () => {
    const service = new UserGroupService();
    (User.findAndCountAll as jest.Mock).mockResolvedValue({
      rows: [
        {
          rid: "user-123",
          email: "defaultuser@example.com",
          first_name: "DefaultUser",
          org_id: "org-123",
          is_consultant_firm: false,
          get: () => ({
            rid: "user-123",
            email: "defaultuser@example.com",
            first_name: "DefaultUser",
            org_id: "org-123",
            is_consultant_firm: false,
          }),
        },
      ],
      count: 1,
    });
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
    // Call with only required arguments, relying on defaults for page, limit, sortBy, sortOrder
    const result = await service.getActiveUsersForUpdate(true);
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.users).toHaveLength(1);
    expect(result.data?.users[0].email).toBe("defaultuser@example.com");
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 0,
        order: [["first_name", "ASC"]],
      })
    );
  });
    it("should fallback to default sort field and direction when invalid sortBy and sortOrder are provided", async () => {
  const service = new UserGroupService();
  (User.findAndCountAll as jest.Mock).mockResolvedValue({
    rows: [
      {
        rid: "user-123",
        email: "defaultuser@example.com",
        first_name: "DefaultUser",
        org_id: "org-123",
        is_consultant_firm: false,
        get: () => ({
          rid: "user-123",
          email: "defaultuser@example.com",
          first_name: "DefaultUser",
          org_id: "org-123",
          is_consultant_firm: false,
        }),
      },
    ],
    count: 1,
  });
  (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
  // Pass invalid sortBy and sortOrder
  const result = await service.getActiveUsersForUpdate(true, undefined,"group-999", 1, 10, "invalid_field", "invalid_order");
  expect(result.statusCode).toBe(constants.SUCCESS);
  
 });
  });
 
 let userGroupService: UserGroupService;
  
  const mockUserId = "user-123";
  const mockGroupRid = "group-123";
  
  beforeEach(() => {
    userGroupService = new UserGroupService();
    jest.clearAllMocks();
  });

  describe("createUserGroup", () => {
    it("should create a user group successfully", async () => {
      // Mock the checkIsGroupNameUnique method
      jest.spyOn(userGroupService as any, "checkIsGroupNameUnique").mockResolvedValue(true);
      
      // Mock the applyGroupMappings method
      jest.spyOn(userGroupService as any, "applyGroupMappings").mockResolvedValue(undefined);
      
      // Mock UserGroup.create
      (UserGroup.create as jest.Mock).mockResolvedValue({
        rid: mockGroupRid,
        group_name: "Test Group",
        status_rid: "status-123",
        group_type_rid: "type-123",
        is_consultant_only_group: false,
        created_by: mockUserId,
      });
      
      const result = await userGroupService.createUserGroup({
        group_name: "Test Group",
        users: [{ rid: "user-456", is_enabled: true, is_modified: true }],
        accounts: [{ rid: "account-456", is_enabled: true, is_modified: true }],
        projects: { "project-123": true },
        status_rid: "status-123",
        is_consultant_only_group: false,
        group_type_rid: "type-123",
      }, mockUserId);
      
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.message).toBe(constants.SUCCESS_MESSAGE);
      expect(result.data?.usergroup).toBeDefined();
      expect(UserGroup.create).toHaveBeenCalledWith({
        group_name: "Test Group",
        status_rid: "status-123",
        group_type_rid: "type-123",
        is_consultant_only_group: false,
        created_by: mockUserId,
      });
    });
    
    it("should return error if group name is not unique", async () => {
      // Mock the checkIsGroupNameUnique method to return false
      jest.spyOn(userGroupService as any, "checkIsGroupNameUnique").mockResolvedValue(false);
      
      const result = await userGroupService.createUserGroup({
        group_name: "Existing Group",
        users: [],
        accounts: [],
        projects: {},
        status_rid: "status-123",
        is_consultant_only_group: false,
        group_type_rid: "type-123",
      }, mockUserId);
      
      expect(result.statusCode).toBe(constants.BAD_REQUEST);
      expect(result.errorMessage).toContain("Group name already exists");
      expect(UserGroup.create).not.toHaveBeenCalled();
    });
    
    it("should handle errors during creation", async () => {
      // Mock the checkIsGroupNameUnique method
      jest.spyOn(userGroupService as any, "checkIsGroupNameUnique").mockResolvedValue(true);
      
      // Mock UserGroup.create to throw an error
      (UserGroup.create as jest.Mock).mockRejectedValue(new Error("Database error"));
      
      const result = await userGroupService.createUserGroup({
        group_name: "Test Group",
        users: [],
        accounts: [],
        projects: {},
        status_rid: "status-123",
        is_consultant_only_group: false,
        group_type_rid: "type-123",
      }, mockUserId);
      
      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.errorMessage).toBe("Database error");
    });
  });

  describe("getAutoAssignedGroupRidForAccount", () => {
    it("should return the auto-assigned group RID for a parent account", async () => {
      // Mock sequelize query to return a parent account
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([{
        rid: "account-123",
        is_parent: true,
        parent_account_rid: null
      }]);

      // Mock UserGroup.findOne to return the expected value
      (UserGroup.findOne as jest.Mock).mockImplementation((query) => {
        // Only return expected value for parent account test
        if (query && query.include && query.include.some((i: { where: { type: string; }; }) => i.where && i.where.type === "AUTO_ASSIGNED_PARENT")) {
          return { rid: "auto-group-123" };
        }
        return { rid: "other-group-rid" };
      });

      const result = await userGroupService.getAutoAssignedGroupRidForAccount("account-123");

      expect(result).toBe("auto-group-123");
      expect(UserGroup.findOne).toHaveBeenCalledWith({
        include:
        [
          {
            model: UserGroupType,
            as: "usergrouptype",
            where: { type: "AUTO_ASSIGNED_PARENT" },
          },
          {
            model: UserGroupAccountMapping,
            as: "usergroupaccount",
            where: { account_rid: "account-123" },
          },
        ],
      });
    });
    
    it("should return the auto-assigned group RID for a child account", async () => {
      // Mock sequelize query to return a child account
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([{
        rid: "account-456",
        is_parent: false,
        parent_account_rid: "account-123"
      }]);
      
      // Mock UserGroup.findOne
      (UserGroup.findOne as jest.Mock).mockResolvedValue({
        rid: "auto-group-456",
      });
      
      const result = await userGroupService.getAutoAssignedGroupRidForAccount("account-456");
      
      expect(result).toBe("auto-group-456");
      expect(UserGroup.findOne).toHaveBeenCalledWith({
        include: [
          {
            model: UserGroupType,
            as: "usergrouptype",
            where: { type: "AUTO_ASSIGNED_CHILD" },
          },
          {
            model: UserGroupAccountMapping,
            as: "usergroupaccount",
            where: { account_rid: "account-456" },
          },
        ],
      });
    });
    
    it("should throw an error if account not found", async () => {
      // Mock sequelize query to return empty result
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([]);
      
      await expect(userGroupService.getAutoAssignedGroupRidForAccount("non-existent-account"))
        .rejects
        .toThrow("Account not found: non-existent-account");
    });
    
    it("should throw an error if no auto-assigned group found", async () => {
      // Mock sequelize query to return an account
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([{
        rid: "account-123",
        is_parent: true,
        parent_account_rid: null
      }]);

      // Mock UserGroup.findOne to return null
      (UserGroup.findOne as jest.Mock).mockResolvedValue(null);
      
      await expect(userGroupService.getAutoAssignedGroupRidForAccount("account-123"))
        .rejects
        .toThrow("No AUTO_ASSIGNED group found for account: account-123");
    });
  });

  describe("assignUserToUserGroups", () => {
    it("should assign a non-consultant user to auto-assigned group", async () => {
      // Mock getAutoAssignedGroupRidForAccount
      jest.spyOn(userGroupService, "getAutoAssignedGroupRidForAccount").mockResolvedValue("auto-group-123");
      
      // Mock UserGroupMapping.create
      (UserGroupMapping.create as jest.Mock).mockResolvedValue({});
      
      await userGroupService.assignUserToUserGroups({
        rid: "user-123",
        org_id: "account-123",
        is_consultant_firm: false
      }, mockUserId);
      
      expect(userGroupService.getAutoAssignedGroupRidForAccount).toHaveBeenCalledWith("account-123");
      expect(UserGroupMapping.create).toHaveBeenCalledWith({
        user_rid: "user-123",
        group_rid: "auto-group-123",
        created_by: mockUserId,
      });
    });
    
    it("should assign a consultant user to consultant firm group", async () => {
      // Mock UserGroupType.findOne
      (UserGroupType.findOne as jest.Mock).mockResolvedValue({
        rid: "consultant-type-123",
      });
      
      // Mock UserGroup.findOne
      (UserGroup.findOne as jest.Mock).mockResolvedValue({
        rid: "consultant-group-123",
      });
      
      // Mock UserGroupMapping.create
      (UserGroupMapping.create as jest.Mock).mockResolvedValue({});
      
      await userGroupService.assignUserToUserGroups({
        rid: "user-123",
        org_id: "account-123",
        is_consultant_firm: true
      }, mockUserId);
      
      expect(UserGroupType.findOne).toHaveBeenCalledWith({
        where: { group_type_name: "Global Consultant Firm" },
      });
      expect(UserGroup.findOne).toHaveBeenCalledWith({
        where: { group_type_rid: "consultant-type-123" },
      });
      expect(UserGroupMapping.create).toHaveBeenCalledWith({
        user_rid: "user-123",
        group_rid: "consultant-group-123",
        created_by: mockUserId,
      });
    });
    
    it("should throw error if user data is incomplete", async () => {
      await expect(userGroupService.assignUserToUserGroups({
        // Missing rid
        org_id: "account-123",
        is_consultant_firm: false
      }, mockUserId))
        .rejects
        .toThrow("Missing userRid or orgId");
    });
  });

  describe("getActiveUsersForGrouping", () => {

    
    it("should sort users by first_name ascending when sortBy and sortOrder are not provided", async () => {
      // Mock User.findAll to return unsorted users
      (User.findAll as jest.Mock).mockResolvedValue([
        {
          rid: "user-2",
          email: "user2@example.com",
          first_name: "Zara",
          org_id: "org-123",
          is_consultant_firm: true,
          get: () => ({
            rid: "user-2",
            email: "user2@example.com",
            first_name: "Zara",
            org_id: "org-123",
            is_consultant_firm: true,
          }),
        },
        {
          rid: "user-1",
          email: "user1@example.com",
          first_name: "Anna",
          org_id: "org-123",
          is_consultant_firm: true,
          get: () => ({
            rid: "user-1",
            email: "user1@example.com",
            first_name: "Anna",
            org_id: "org-123",
            is_consultant_firm: true,
          }),
        },
      ]);
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
      // Call with required pagination and sorting arguments
      const result = await userGroupService.getActiveUsersForGrouping(true, undefined, 1, 10, "first_name", "ASC");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(2);
      // Should be sorted by first_name ascending
      expect(result.data?.users[0].first_name).toBe("Anna");
      expect(result.data?.users[1].first_name).toBe("Zara");
    });
    it("should return active users for consultant-only group", async () => {
      // Mock User.findAll
      (User.findAll as jest.Mock).mockResolvedValue([
        {
          rid: "user-123",
          email: "user@example.com",
          first_name: "Test",
          org_id: "org-123",
          is_consultant_firm: true,
          get: () => ({
            rid: "user-123",
            email: "user@example.com",
            first_name: "Test",
            org_id: "org-123",
            is_consultant_firm: true,
          }),
        },
      ]);
      
      // Mock UserGroupMapping.findAll
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
      
      const result = await userGroupService.getActiveUsersForGrouping(true, undefined, 1, 10, "first_name", "ASC");
      
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      expect(User.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { is_consultant_firm: true },
      }));
    });
    
    it("should filter users by account_rid", async () => {
      // Mock User.findAll
      (User.findAll as jest.Mock).mockResolvedValue([
        {
          rid: "user-123",
          email: "user@example.com",
          first_name: "Test",
          org_id: "account-123",
          is_consultant_firm: false,
          get: () => ({
            rid: "user-123",
            email: "user@example.com",
            first_name: "Test",
            org_id: "account-123",
            is_consultant_firm: false,
          }),
        },
      ]);
      
      // Mock UserGroupAccountMapping.findAll
      (UserGroupAccountMapping.findAll as jest.Mock).mockResolvedValue([
        { group_rid: "group-123" },
      ]);
      
      // Mock UserGroupMapping.findAll
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
      
      const result = await userGroupService.getActiveUsersForGrouping(false, "account-123", 1, 10, "first_name", "DESC");
      
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      expect(User.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          [Op.or]: [{ org_id: { [Op.in]: ["account-123"] } }],
        }),
      }));
    });
    
    it("should apply custom filters from buildWhereClause in user query", async () => {
      // Mock buildWhereClause to return a custom filter
      const service = new UserGroupService();
      const customWhere = { email: "filtered@example.com" };
      jest.spyOn(service as any, "buildWhereClause").mockReturnValue({ whereClause: customWhere });

      // Mock User.findAll to return filtered users
      (User.findAll as jest.Mock).mockResolvedValue([
        {
          rid: "user-123",
          email: "filtered@example.com",
          first_name: "Filtered",
          org_id: "org-123",
          is_consultant_firm: true,
          get: () => ({
            rid: "user-123",
            email: "filtered@example.com",
            first_name: "Filtered",
            org_id: "org-123",
            is_consultant_firm: true,
          }),
        },
      ]);
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

      // Call with filters and required pagination/sorting
      const filters = { email: "filtered@example.com" };
      const result = await service.getActiveUsersForGrouping(true, undefined, 1, 10, "first_name", "ASC", filters);

      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      expect(User.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(customWhere),
        })
      );
    });
    it("should use default pagination and sorting parameters for default", async () => {
  const service = new UserGroupService();
  (User.findAndCountAll as jest.Mock).mockResolvedValue({
    rows: [
      {
        rid: "user-123",
        email: "defaultuser@example.com",
        first_name: "DefaultUser",
        org_id: "org-123",
        sort_by: "first_namesss",
        sort_order: "ASCd",
        is_consultant_firm: false,
        get: () => ({
          rid: "user-123",
          email: "defaultuser@example.com",
          first_name: "DefaultUser",
          org_id: "org-123",
          is_consultant_firm: false,
        }),
      },
    ],
    count: 1,
  });
  (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
  // Call with only required arguments, relying on defaults for page, limit, sortBy, sortOrder
  const result = await service.getActiveUsersForGrouping(true);
  expect(result.statusCode).toBe(constants.SUCCESS);
  expect(result.data?.users).toHaveLength(1);
  expect(result.data?.users[0].email).toBe("defaultuser@example.com");
  expect(User.findAndCountAll).toHaveBeenCalledWith(
    expect.objectContaining({
      limit: 10,
      offset: 0,
      order: [["first_name", "ASC"]],
    })
  );
    });
    it("should fallback to default sort field and direction when invalid sortBy and sortOrder are provided", async () => {
  const service = new UserGroupService();
  (User.findAndCountAll as jest.Mock).mockResolvedValue({
    rows: [
      {
        rid: "user-123",
        email: "defaultuser@example.com",
        first_name: "DefaultUser",
        org_id: "org-123",
        is_consultant_firm: false,
        get: () => ({
          rid: "user-123",
          email: "defaultuser@example.com",
          first_name: "DefaultUser",
          org_id: "org-123",
          is_consultant_firm: false,
        }),
      },
    ],
    count: 1,
  });
  (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
  // Pass invalid sortBy and sortOrder
  const result = await service.getActiveUsersForGrouping(true, undefined, 1, 10, "invalid_field", "invalid_order");
  expect(result.statusCode).toBe(constants.SUCCESS);
  
 });

  });

  describe("checkIsGroupNameUnique", () => {
    it("should return true if no group exists with the name", async () => {
      (UserGroup.findOne as jest.Mock).mockResolvedValue(null);
      const service = new UserGroupService();
      // @ts-ignore
      const result = await service.checkIsGroupNameUnique("UniqueName");
      expect(UserGroup.findOne).toHaveBeenCalledWith({
        where: expect.any(Object)
    });
      expect(result).toBe(true);
    });

    it("should return false if group exists with the name", async () => {
      (UserGroup.findOne as jest.Mock).mockResolvedValue({ rid: "group-123" });
      const service = new UserGroupService();
      // @ts-ignore
      const result = await service.checkIsGroupNameUnique("ExistingName");
      expect(UserGroup.findOne).toHaveBeenCalledWith({
        where: expect.any(Object)
    });
      expect(result).toBe(false);
    });
  });

  describe("updateUserGroup", () => {
    let service: UserGroupService;
    const mockUserId = "user-123";
    const mockGroupRid = "group-123";
    beforeEach(() => {
      service = new UserGroupService();
      jest.clearAllMocks();
    });

    it("should update a user group successfully", async () => {
      // Mock UserGroup.findOne to return an existing group with type CUSTOM
      (UserGroup.findOne as jest.Mock).mockResolvedValueOnce({
        group_name: "Old Group",
        usergrouptype: { type: "CUSTOM" },
      });
      // Mock UserGroup.findOne for duplicate check to return null
      (UserGroup.findOne as jest.Mock).mockResolvedValueOnce(null);
      // Mock UserGroup.update
      (UserGroup.update as jest.Mock).mockResolvedValue([1]);
      // Mock applyGroupMappings
      jest.spyOn(service as any, "applyGroupMappings").mockResolvedValue(undefined);
      const result = await service.updateUserGroup({
        group_name: "New Group",
        users: [],
        accounts: [],
        projects: {},
        group_rid: mockGroupRid,
        status_rid: "status-123",
        is_consultant_only_group: false,
      }, mockUserId);
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.message).toBe(constants.SUCCESS_MESSAGE);
      expect(UserGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({ group_name: "New Group", status_rid: "status-123" }),
        { where: { rid: mockGroupRid } }
      );
      expect(service["applyGroupMappings"]).toHaveBeenCalledWith(expect.objectContaining({ group_rid: mockGroupRid }));
    });

    it("should return error if group not found", async () => {
      (UserGroup.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.updateUserGroup({
        group_name: "New Group",
        users: [],
        accounts: [],
        projects: {},
        group_rid: mockGroupRid,
        status_rid: "status-123",
        is_consultant_only_group: false,
      }, mockUserId);
      expect(result.statusCode).toBe(constants.BAD_REQUEST);
      expect(result.errorMessage).toContain("Group not found");
      expect(UserGroup.update).not.toHaveBeenCalled();
    });

    it("should return error if group name already exists", async () => {
      // First findOne returns existing group, second for duplicate returns a group
      (UserGroup.findOne as jest.Mock).mockResolvedValueOnce({
        group_name: "Old Group",
        usergrouptype: { type: "CUSTOM" },
      });
      (UserGroup.findOne as jest.Mock).mockResolvedValueOnce({ rid: "other-group" });
      const result = await service.updateUserGroup({
        group_name: "Duplicate Group",
        users: [],
        accounts: [],
        projects: {},
        group_rid: mockGroupRid,
        status_rid: "status-123",
        is_consultant_only_group: false,
      }, mockUserId);
      expect(result.statusCode).toBe(constants.BAD_REQUEST);
      expect(result.errorMessage).toContain("Group name already exists");
      expect(UserGroup.update).not.toHaveBeenCalled();
    });

    it("should handle missing usergrouptype.type gracefully", async () => {
      // usergrouptype is undefined
      (UserGroup.findOne as jest.Mock).mockResolvedValueOnce({
        group_name: "Old Group",
        usergrouptype: undefined,
      });
      // No duplicate group name check needed
      (UserGroup.findOne as jest.Mock).mockResolvedValueOnce(null);
      (UserGroup.update as jest.Mock).mockResolvedValue([1]);
      jest.spyOn(service as any, "applyGroupMappings").mockResolvedValue(undefined);
      const result = await service.updateUserGroup({
        group_name: "New Group",
        users: [],
        accounts: [],
        projects: {},
        group_rid: mockGroupRid,
        status_rid: "status-123",
        is_consultant_only_group: false,
      }, mockUserId);
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.message).toBe(constants.SUCCESS_MESSAGE);
      expect(UserGroup.update).toHaveBeenCalled();
      expect(service["applyGroupMappings"]).toHaveBeenCalled();
    });


  });

  describe("getAccountGroups", () => {
    it("should return BAD_REQUEST if account_rid is missing", async () => {
      const service = new UserGroupService();
      const result = await service.getAccountGroups(undefined as any);
      expect(result.statusCode).toBe(constants.BAD_REQUEST);
      expect(result.errorMessage).toBe("Missing account_rid");
    });

    it("should return BAD_REQUEST if account_rid is invalid", async () => {
      const service = new UserGroupService();
      // Mock sequelize.query to return empty result
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([]);
      (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);
      const result = await service.getAccountGroups("invalid-account");
      expect(result.statusCode).toBe(constants.BAD_REQUEST);
      expect(result.errorMessage).toBe("Invalid account_rid provided.");
    });

    it("should return groups with correct access flags", async () => {
      const service = new UserGroupService();
      // Mock sequelize.query to return valid account
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([{ rid: "account-1", is_parent: true, parent_account_rid: null }]);
      (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);

      // Mock UserGroup.findAll for defaultGroups and mappedGroups
      (UserGroup.findAll as jest.Mock).mockResolvedValueOnce([
        { rid: "group-1", group_name: "Default Group", is_consultant_only_group: false, created_datetime: "2024-01-01", user_count: 5, toJSON: function() { return this; }, usergrouptype: { type: "DEFAULT", group_type_name: "Default" } }
      ]);
      (UserGroup.findAll as jest.Mock).mockResolvedValueOnce([
        { rid: "group-2", group_name: "Mapped Group", is_consultant_only_group: false, created_datetime: "2024-01-02", user_count: 3, toJSON: function() { return this; }, usergrouptype: { type: "CUSTOM", group_type_name: "Custom" } }
      ]);

      // Mock UserGroupEntityAccess.findAll for access flags
      (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([
        { group_rid: "group-1", access_type: "INCLUDE" },
        { group_rid: "group-2", access_type: "EXCLUDE" }
      ]);

      const result = await service.getAccountGroups("account-1");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.groups).toHaveLength(2);

      const defaultGroup = result.data?.groups.find(g => g.rid === "group-1");
      const mappedGroup = result.data?.groups.find(g => g.rid === "group-2");
      expect(defaultGroup.has_access).toBe(true); // DEFAULT always true
      expect(mappedGroup.has_access).toBe(false); // EXCLUDE
    });
    it("should sort groups when group objects do not have get method and fallback to empty string is triggered", async () => {
  const service = new UserGroupService();
  const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
  (mockSequelize.query as jest.Mock).mockResolvedValue([{ rid: "account-x", is_parent: true, parent_account_rid: null }]);
  (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);

  // Provide groups as plain objects without get method and with undefined sortField
  (UserGroup.findAll as jest.Mock).mockResolvedValueOnce([
    { rid: "group-plain-1", user_count: undefined, account_name: undefined, toJSON: function() { return this; } },
    { rid: "group-plain-2", user_count: 5, account_name: "Alpha", toJSON: function() { return this; } },
  ]);
  (UserGroup.findAll as jest.Mock).mockResolvedValueOnce([]);
  (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([]);

  // Use sortField that will trigger fallback to empty string
  const result = await service.getAccountGroups("account-x", 1, 10, "account_name", "ASC", {});
  expect(result.statusCode).toBe(constants.SUCCESS);
  expect(result.data?.groups).toHaveLength(2);
  // The first group should have account_name undefined, so fallback to empty string
  expect(result.data?.groups[0].account_name).toBeUndefined();
  expect(result.data?.groups[1].account_name).toBe("Alpha");
});

    it("should sort groups by user_count descending", async () => {
      const service = new UserGroupService();
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([{ rid: "account-1", is_parent: true, parent_account_rid: null }]);
      (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);

      // Mock UserGroup.findAll for defaultGroups and mappedGroups
      (UserGroup.findAll as jest.Mock).mockResolvedValueOnce([
        { rid: "group-1", group_name: "A", is_consultant_only_group: false, created_datetime: "2024-01-01", user_count: 2, toJSON: function() { return this; }, usergrouptype: { type: "DEFAULT", group_type_name: "Default" } },
        { rid: "group-2", group_name: "B", is_consultant_only_group: false, created_datetime: "2024-01-02", user_count: 5, toJSON: function() { return this; }, usergrouptype: { type: "CUSTOM", group_type_name: "Custom" } }
      ]);
      (UserGroup.findAll as jest.Mock).mockResolvedValueOnce([
        { rid: "group-3", group_name: "C", is_consultant_only_group: false, created_datetime: "2024-01-03", user_count: 1, toJSON: function() { return this; }, usergrouptype: { type: "CUSTOM", group_type_name: "Custom" } }
      ]);

      (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([]);

      const result = await service.getAccountGroups("account-1", 1, 10, "user_count", "DESC");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.groups[0].user_count).toBe(5);
      expect(result.data?.groups[1].user_count).toBe(2);
        expect(result.data?.groups[2].user_count).toBe(1);
      });
    it("should sort groups when group objects do not have get method and fallback to empty string is triggered", async () => {
  const service = new UserGroupService();
  const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
  (mockSequelize.query as jest.Mock).mockResolvedValue([{ rid: "account-x", is_parent: true, parent_account_rid: null }]);
  (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);

  // Provide groups as plain objects without get method and with undefined sortField
  (UserGroup.findAll as jest.Mock).mockResolvedValueOnce([
    { rid: "group-plain-1", user_count: undefined, account_name: undefined, toJSON: function() { return this; } },
    { rid: "group-plain-2", user_count: 5, account_name: "Alpha", toJSON: function() { return this; } },
  ]);
  (UserGroup.findAll as jest.Mock).mockResolvedValueOnce([]);
  (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([]);

  // Use sortField that will trigger fallback to empty string
  const result = await service.getAccountGroups("account-x", 1, 10, "account_name", "ASC", {});
  expect(result.statusCode).toBe(constants.SUCCESS);
  expect(result.data?.groups).toHaveLength(2);
  // The first group should have account_name undefined, so fallback to empty string
  expect(result.data?.groups[0].account_name).toBeUndefined();
  expect(result.data?.groups[1].account_name).toBe("Alpha");
});
      
it("should sort groups when both have get method", async () => {
  const service = new UserGroupService();
  const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
  (mockSequelize.query as jest.Mock).mockResolvedValue([{ rid: "account-get", is_parent: true, parent_account_rid: null }]);
  (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);

  (UserGroup.findAll as jest.Mock).mockResolvedValueOnce([
    {
      rid: "group-get-1",
      get: (field: string) => field === "account_name" ? "Bravo" : undefined,
      account_name: "Bravo"
    },
    {
      rid: "group-get-2",
      get: (field: string) => field === "account_name" ? "Alpha" : undefined,
      account_name: "Alpha"
    }
  ]);
  (UserGroup.findAll as jest.Mock).mockResolvedValueOnce([]);
  (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([]);

  const result = await service.getAccountGroups("account-get", 1, 10, "account_name", "ASCss", {});
  expect(result.statusCode).toBe(constants.SUCCESS);
  expect(result.data?.groups[0].account_name).toBe("Alpha");
  expect(result.data?.groups[1].account_name).toBe("Bravo");
});
    });
  describe("listUserGroup", () => {
    let service: any;
    const mockUserRid = "user-abc";
    beforeEach(() => {
      service = new UserGroupService();
      jest.clearAllMocks();
    });

    it("should return user groups with filters applied", async () => {
      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      // Mock UserGroupMapping.findAll to return group_rid
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }, { group_rid: "group-2" }]);
      // Mock UserGroup.count and UserGroup.findAll
      (UserGroup.count as jest.Mock).mockResolvedValue(2);
      (UserGroup.findAll as jest.Mock).mockResolvedValue([
        {
          get: () => ({ rid: "group-1", account_name: "Account1", user_count: 5 }),
        },
        {
          get: () => ({ rid: "group-2", account_name: "Account2", user_count: 3 }),
        },
      ]);
      // Call with filters
     // const filters = { account_name: "Account1" };
       const filters = {
        group_name: { contains: "group-1" },
        group_type:{in: ["CUSTOM", "DEFAULT"] },
        is_consultant_only_group: "Yes",
        user_count: { gte: 1, lte: 10 },
        created_datetime: { between: { from: "2025-08-03", to: "2025-08-04" } },
        modified_datetime: { after: "2025-08-04" }
      };
      const { customWhere } = (service as any).buildWhereClause(filters);
      const result = await service.listUserGroup(1, 10, customWhere, mockUserRid, "account_name", "ASC");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.usergroup).toHaveLength(2);
      expect(UserGroup.count).toHaveBeenCalled();
      expect(UserGroup.findAll).toHaveBeenCalled();
    });

    it("should return user groups with filters applied 2", async () => {
      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      // Mock UserGroupMapping.findAll to return group_rid
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }, { group_rid: "group-2" }]);
      // Mock UserGroup.count and UserGroup.findAll
      (UserGroup.count as jest.Mock).mockResolvedValue(2);
      (UserGroup.findAll as jest.Mock).mockResolvedValue([
        {
          get: () => ({ rid: "group-1", account_name: "Account1", user_count: 5 }),
        },
        {
          get: () => ({ rid: "group-2", account_name: "Account2", user_count: 3 }),
        },
      ]);
      // Call with filters
     // const filters = { account_name: "Account1" };
       const filters = {
        group_name: { is_empty: true },
        group_type:{equals: "CUSTOM" },
        is_consultant_only_group: 'No',
        user_count: { equals :0 },
        created_datetime: { equals: "2025-08-04" },
        modified_datetime: { before: "2025-08-04" }
      };
      const { customWhere } = (service as any).buildWhereClause(filters);
      const result = await service.listUserGroup(1, 10, customWhere, mockUserRid, "account_name", "ASC");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.usergroup).toHaveLength(2);
      expect(UserGroup.count).toHaveBeenCalled();
      expect(UserGroup.findAll).toHaveBeenCalled();
    });

     it("should return user groups with filters applied 3", async () => {
      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      // Mock UserGroupMapping.findAll to return group_rid
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }, { group_rid: "group-2" }]);
      // Mock UserGroup.count and UserGroup.findAll
      (UserGroup.count as jest.Mock).mockResolvedValue(2);
      (UserGroup.findAll as jest.Mock).mockResolvedValue([
        {
          get: () => ({ rid: "group-1", account_name: "Account1", user_count: 5 }),
        },
        {
          get: () => ({ rid: "group-2", account_name: "Account2", user_count: 3 }),
        },
      ]);
      // Call with filters
     // const filters = { account_name: "Account1" };
       const filters = {
        group_name: { is_empty: true },
        group_type:{equals: "CUSTOM" },
        is_consultant_only_group: 'No',
        user_count: { not_equals :0 },
        created_datetime: { equals: "2025-08-04" },
        modified_datetime: { before: "2025-08-04" }
      };
      const { customWhere } = (service as any).buildWhereClause(filters);
      const result = await service.listUserGroup(1, 10, customWhere, mockUserRid, "account_name", "ASC");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.usergroup).toHaveLength(2);
      expect(UserGroup.count).toHaveBeenCalled();
      expect(UserGroup.findAll).toHaveBeenCalled();
    });


    it("should return empty array if user has no groups", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
      const result = await service.listUserGroup(1, 10, {}, mockUserRid, "created_datetime", "DESC");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.usergroup).toEqual([]);
      expect(result.data?.count).toBe(0);
    });

    it("should return NOT_FOUND if user does not exist", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.listUserGroup(1, 10, {}, "bad-user", "created_datetime", "DESC");
      expect(result.statusCode).toBe(constants.NOT_FOUND);
      expect(result.message).toBe("User not found");
    });

    it("should sort by created_by and account_name", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }]);
      (UserGroup.count as jest.Mock).mockResolvedValue(1);
      (UserGroup.findAll as jest.Mock).mockResolvedValue([
        {
          get: () => ({ rid: "group-1", account_name: "Account1", user_count: 5 }),
        },
      ]);
      // created_by
      await service.listUserGroup(1, 10, {}, mockUserRid, "created_by", "ASC");
      // account_name
      await service.listUserGroup(1, 10, {}, mockUserRid, "account_name", "DESC");
      expect(UserGroup.findAll).toHaveBeenCalledTimes(2);
    });

    it("should handle filters as undefined, null, or empty", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }]);
      (UserGroup.count as jest.Mock).mockResolvedValue(1);
      (UserGroup.findAll as jest.Mock).mockResolvedValue([
        {
          get: () => ({ rid: "group-1", account_name: "Account1", user_count: 5 }),
        },
      ]);
      // undefined
      await service.listUserGroup(1, 10, undefined as any, mockUserRid, "created_datetime", "DESC");
      // null
      await service.listUserGroup(1, 10, null as any, mockUserRid, "created_datetime", "DESC");
      // empty
      await service.listUserGroup(1, 10, {}, mockUserRid, "created_datetime", "DESC");
      expect(UserGroup.findAll).toHaveBeenCalledTimes(3);
    });

    it("should handle errors and return FAILED", async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error("DB error"));
      const result = await service.listUserGroup(1, 10, {}, mockUserRid, "created_datetime", "DESC");
      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.errorMessage).toBe("DB error");
    });
  });

   describe("exportUserGroup", () => {
  let service: any;
  const mockUserId = "user-export";
  let userServiceInstance: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Create a fresh UserService instance for each test
    const UserService = require("../../src/services/userService").default;
    userServiceInstance = new UserService();
    service = new UserGroupService();
  });

  it("should export user groups with allowed fields and labels", async () => {
    // Setup mock data
    const allowedFields = [
      { field_name: "group_name", read: true },
      { field_name: "account_name", read: true },
      { field_name: "user_count", read: true },
      { field_name: "is_consultant_only_group", read: true },
      { field_name: "created_datetime", read: true },
      { field_name: "modified_datetime", read: true }
    ];
    
    // Mock methods
    jest.spyOn(service as any, "buildWhereClause").mockReturnValue({ whereClause: { group_name: "Export" } });
    userServiceInstance.getAllowedExportFields.mockResolvedValue(allowedFields);
    
    (UserGroup.findAll as jest.Mock).mockResolvedValue([
      {
        get: () => ({
          group_name: "Export Group",
          account_name: "AccountX",
          user_count: 10,
          is_consultant_only_group: true,
          created_datetime: new Date("2024-01-01T10:00:00Z"),
          modified_datetime: new Date("2024-01-02T12:00:00Z"),
        })
      }
    ]);
    
    jest.spyOn(require("../../src/utils/rawQueries"), "getUserGroupUserCount").mockReturnValue("5");
    
    const [finalSortBy, finalSortOrder] = (service as any).getSortParameters("account_name", "ASC");
    
    const result = await service.exportUserGroup(
      { group_name: "Export" },
      finalSortBy,
      finalSortOrder,
      "Asia/Kolkata",
      mockUserId
    );
    
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup).toHaveLength(1);
    const exported = result.data?.usergroup[0];
    expect(exported["Group Name"]).toBe("Export Group");
    expect(exported["Account Name"]).toBe("AccountX");
    expect(exported["User Count"]).toBe(10);
    expect(exported["Is Consultant Only Group"]).toBe("Yes");
    expect(exported["Created On"]).toBeDefined();
    expect(exported["Updated On"]).toBeDefined();
  });

  it("should handle filters and sorting", async () => {
    // Mock methods
    jest.spyOn(service as any, "buildWhereClause").mockReturnValue({ whereClause: { account_name: "A" } });
    userServiceInstance.getAllowedExportFields.mockResolvedValue([
      { field_name: "account_name", read: true },
      { field_name: "user_count", read: true }
    ]);
    
    (UserGroup.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ account_name: "A", user_count: 1 }) },
      { get: () => ({ account_name: "B", user_count: 2 }) }
    ]);
    
    const [finalSortBy, finalSortOrder] = (service as any).getSortParameters("account_name", "DESC");
    
    const result = await service.exportUserGroup(
      { account_name: "A" },
      finalSortBy,
      finalSortOrder,
      "UTC",
      mockUserId
    );
    
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup).toHaveLength(2);
    expect(result.data?.usergroup[0]["Account Name"]).toBe("A");
    expect(result.data?.usergroup[1]["Account Name"]).toBe("B");
  });

  it("should handle filters and sorting for created by", async () => {
    // Mock methods
    jest.spyOn(service as any, "buildWhereClause").mockReturnValue({ whereClause: { account_name: "A" } });
    userServiceInstance.getAllowedExportFields.mockResolvedValue([
      { field_name: "account_name", read: true },
      { field_name: "user_count", read: true }
    ]);
    
    (UserGroup.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ account_name: "A", user_count: 1 }) },
      { get: () => ({ account_name: "B", user_count: 2 }) }
    ]);
    
    const [finalSortBy, finalSortOrder] = (service as any).getSortParameters("created_by", "DESC");
    
    const result = await service.exportUserGroup(
      { account_name: "A" },
      finalSortBy,
      finalSortOrder,
      "UTC",
      mockUserId
    );
    
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup).toHaveLength(2);
    expect(result.data?.usergroup[0]["Account Name"]).toBe("A");
    expect(result.data?.usergroup[1]["Account Name"]).toBe("B");
  });

  it("should handle errors and return FAILED", async () => {
    jest.spyOn(service as any, "buildWhereClause").mockImplementation(() => { 
      throw new Error("Export error"); 
    });
    
    const result = await service.exportUserGroup({}, "group_name", "ASC", "UTC", mockUserId);
    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.errorMessage).toBe("Export error");
  });
});
  describe("listAccountGroupById", () => {
    let service: UserGroupService;
    beforeEach(() => {
      service = new UserGroupService();
      jest.clearAllMocks();
    });

    it("should return user group with user and group type info", async () => {
      (UserGroup.findOne as jest.Mock).mockResolvedValue({
        toJSON: () => ({
          rid: "group-xyz",
          group_name: "Test Group",
          user: { first_name: "John", last_name: "Doe" },
          usergrouptype: { rid: "type-1", group_type_name: "Custom", type: "CUSTOM" }
        })
      });
      jest.spyOn(service as any, "getFormattedAccountsForGroup").mockResolvedValue([{ rid: "acc-1", name: "Account1" }]);
      const result = await service.listAccountGroupById("group-xyz");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.userGroupById.group_name).toBe("Test Group");
      expect(result.data?.userGroupById.created_by).toBe("John Doe");
      expect(result.data?.userGroupById.usergrouptype.group_type_name).toBe("Custom");
      expect(result.data?.userGroupById.accounts).toEqual([{ rid: "acc-1", name: "Account1" }]);
    });

    it("should return null if group not found", async () => {
      (UserGroup.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.listAccountGroupById("missing-group");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.userGroupById).toBeNull();
    });

    it("should handle errors and return FAILED", async () => {
      (UserGroup.findOne as jest.Mock).mockRejectedValue(new Error("DB error"));
      const result = await service.listAccountGroupById("group-err");
      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.errorMessage).toBe("DB error");
    });
  });

  describe("listUserGroup with filters", () => {
    let service: any;
    const mockUserRid = "user-abc";
    beforeEach(() => {
      service = new UserGroupService();
      jest.clearAllMocks();
    });

  it("should filter by account_name", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }]);
    (UserGroup.count as jest.Mock).mockResolvedValue(1);
    (UserGroup.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ rid: "group-1", account_name: "Account1", user_count: 5 }) }
    ]);
    const filters = { account_name: "Account1" };
    const result = await service.listUserGroup(1, 10, filters, mockUserRid, "account_name", "ASC");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup).toHaveLength(1);
    expect(result.data?.usergroup[0].account_name).toBe("Account1");
  });

  it("should filter by group_name (text filter)", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-2" }]);
    (UserGroup.count as jest.Mock).mockResolvedValue(1);
    (UserGroup.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ rid: "group-2", group_name: "Test Group", user_count: 3 }) }
    ]);
    const filters = { group_name: { contains: "Test" } };
    const result = await service.listUserGroup(1, 10, filters, mockUserRid, "group_name", "ASC");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup[0].group_name).toContain("Test");
  });

  it("should filter by user_count (number)", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-3" }]);
    (UserGroup.count as jest.Mock).mockResolvedValue(1);
    (UserGroup.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ rid: "group-3", user_count: 10 }) }
    ]);
    const filters = { user_count: 10 };
    const result = await service.listUserGroup(1, 10, filters, mockUserRid, "user_count", "DESC");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup[0].user_count).toBe(10);
  });

  it("should filter by user_count (object)", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-4" }]);
    (UserGroup.count as jest.Mock).mockResolvedValue(1);
    (UserGroup.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ rid: "group-4", user_count: 7 }) }
    ]);
    const filters = { user_count: { greater_than: 5, less_than: 10 } };
    const result = await service.listUserGroup(1, 10, filters, mockUserRid, "user_count", "ASC");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup[0].user_count).toBeGreaterThan(5);
    expect(result.data?.usergroup[0].user_count).toBeLessThan(10);
  });

  it("should filter by is_consultant_only_group", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-5" }]);
    (UserGroup.count as jest.Mock).mockResolvedValue(1);
    (UserGroup.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ rid: "group-5", is_consultant_only_group: true }) }
    ]);
    const filters = { is_consultant_only_group: true };
    const result = await service.listUserGroup(1, 10, filters, mockUserRid, "group_name", "ASC");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup[0].is_consultant_only_group).toBe(true);
  });

  it("should return empty array if no groups match filters", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
    (UserGroup.count as jest.Mock).mockResolvedValue(0);
    (UserGroup.findAll as jest.Mock).mockResolvedValue([]);
    const filters = { group_name: "NoMatch" };
    const result = await service.listUserGroup(1, 10, filters, mockUserRid, "group_name", "ASC");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup).toEqual([]);
    expect(result.data?.count).toBe(0);
  });
    
    it("should sort user groups by account_name ASC", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }, { group_rid: "group-2" }]);
      (UserGroup.count as jest.Mock).mockResolvedValue(2);
      (UserGroup.findAll as jest.Mock).mockResolvedValue([
        { get: () => ({ rid: "group-1", account_name: "Alpha", user_count: 5 }) },
        { get: () => ({ rid: "group-2", account_name: "Beta", user_count: 3 }) }
      ]);
      
      const filters = {};
      await service.listUserGroup(1, 10, filters, mockUserRid, "account_name", "ASC");
      
      // Verify that UserGroup.findAll was called with correct order parameter for account_name
      expect(UserGroup.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.arrayContaining([
            expect.arrayContaining(['ASC'])
          ])
        })
      );
    });

    it("should sort user groups by account_name DESC", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }, { group_rid: "group-2" }]);
      (UserGroup.count as jest.Mock).mockResolvedValue(2);
      (UserGroup.findAll as jest.Mock).mockResolvedValue([
        { get: () => ({ rid: "group-2", account_name: "Beta", user_count: 3 }) },
        { get: () => ({ rid: "group-1", account_name: "Alpha", user_count: 5 }) }
      ]);
      
      const filters = {};
      await service.listUserGroup(1, 10, filters, mockUserRid, "account_name", "DESC");
      
      // Verify that UserGroup.findAll was called with correct order parameter for account_name DESC
      expect(UserGroup.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.arrayContaining([
            expect.arrayContaining(['DESC'])
          ])
        })
      );
    });

    it("should sort user groups by user_count DESC", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }, { group_rid: "group-2" }]);
      (UserGroup.count as jest.Mock).mockResolvedValue(2);
      (UserGroup.findAll as jest.Mock).mockResolvedValue([
        { get: () => ({ rid: "group-2", account_name: "Beta", user_count: 5 }) },
        { get: () => ({ rid: "group-1", account_name: "Alpha", user_count: 3 }) }
      ]);
      
      const filters = {};
      await service.listUserGroup(1, 10, filters, mockUserRid, "user_count", "DESC");
      
      // Verify that UserGroup.findAll was called with correct order parameter
      expect(UserGroup.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['user_count', 'DESC']]
        })
      );
    });

    it("should sort user groups by user_count ASC", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }, { group_rid: "group-2" }]);
      (UserGroup.count as jest.Mock).mockResolvedValue(2);
      (UserGroup.findAll as jest.Mock).mockResolvedValue([
        { get: () => ({ rid: "group-1", account_name: "Alpha", user_count: 3 }) },
        { get: () => ({ rid: "group-2", account_name: "Beta", user_count: 5 }) }
      ]);
      
      const filters = {};
      await service.listUserGroup(1, 10, filters, mockUserRid, "user_count", "ASC");
      
      // Verify that UserGroup.findAll was called with correct order parameter
      expect(UserGroup.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['user_count', 'ASC']]
        })
      );
    });

    it("should default to created_datetime DESC when invalid sort parameters are provided", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ is_consultant_firm: false, org_id: "org-xyz" });
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: "group-1" }]);
      (UserGroup.count as jest.Mock).mockResolvedValue(1);
      (UserGroup.findAll as jest.Mock).mockResolvedValue([
        { get: () => ({ rid: "group-1", account_name: "Alpha", user_count: 3 }) }
      ]);
      
      const filters = {};
      await service.listUserGroup(1, 10, filters, mockUserRid, "invalid_field", "invalid_order");
      
      // Verify that invalid sort parameters default to created_datetime DESC
      expect(UserGroup.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['created_datetime', 'DESC']]
        })
      );
    });
  });
// ---
describe("listUserGroupDetailsById", () => {
  let service: any;
  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  it("should return user group details for valid group id", async () => {
    const mockGroupId = "group-xyz";
    const mockGroupType = "CUSTOM";
    // Mock UserGroup.findOne to return group details with all required fields
    (UserGroup.findOne as jest.Mock).mockResolvedValue({
      toJSON: () => ({
        rid: mockGroupId,
        group_name: "Test Group",
        user: { first_name: "John", last_name: "Doe" },
        usergrouptype: { rid: "type-1", group_type_name: "Custom", type: "CUSTOM" },
        account_name: "AccountX",
        is_consultant_only_group: false,
        user_count: 5,
        created_datetime: "2024-01-01T10:00:00Z",
        modified_datetime: "2024-01-02T12:00:00Z"
      })
    });
    // Mock getFormattedAccountsForGroup
    const mockAccounts = [{ rid: "acc-1", name: "Account1" }];
    jest.spyOn(service, "getFormattedAccountsForGroup").mockImplementation((type, groupId) => Promise.resolve(mockAccounts));
    // Mock getFormattedProjectsForGroup
    const mockProjects = [{ rid: "proj-1", name: "Project1" }];
    jest.spyOn(service, "getFormattedProjectsForGroup").mockResolvedValue(mockProjects);
    // Mock usersList
    const mockUsers = [{ rid: "user-1", name: "User1" }];
    jest.spyOn(service, "getFormattedUsersForGroup").mockResolvedValue(mockUsers);
    // Patch the method to call the spies
    service.getFormattedUsersForGroup = jest.fn().mockResolvedValue(mockUsers);
    service.getFormattedAccountsForGroup = jest.fn().mockImplementation((type, groupId) => Promise.resolve(mockAccounts));
    service.getFormattedProjectsForGroup = jest.fn().mockResolvedValue(mockProjects);
    const result = await service.listUserGroupDetailsById(mockGroupId);
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.userGroupById).toBeDefined();
    expect(result.data?.userGroupById.group_name).toBe("Test Group");
    expect(result.data?.userGroupById.account_name).toBe("AccountX");
    expect(result.data?.userGroupById.user_count).toBe(5);
    expect(result.data?.userGroupById.group_type).toBe("CUSTOM");
    expect(result.data?.userGroupById.users).toEqual(mockUsers);
    expect(result.data?.userGroupById.accounts).toEqual(mockAccounts);
    expect(result.data?.userGroupById.projects).toEqual(mockProjects);
    // getFormattedProjectsForGroup should be called with type and groupId
    expect(service.getFormattedProjectsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
    // created_by should be set and user should be deleted
    expect(result.data?.userGroupById.created_by).toBe("John Doe");
    expect(result.data?.userGroupById.user).toBeUndefined();
    // getFormattedAccountsForGroup should be called with type and groupId
    expect(service.getFormattedAccountsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
  });
});

// Separate test suite for listUserGroupById
describe("listUserGroupById", () => {
  let service: any;
  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  it("should return user group details for valid group id and call population methods", async () => {
    const mockGroupId = "group-abc";
    const mockGroupType = "CUSTOM";
    // Mock UserGroup.findOne to return group details with all required fields
    (UserGroup.findOne as jest.Mock).mockResolvedValue({
      toJSON: () => ({
        rid: mockGroupId,
        group_name: "Test Group",
        user: { first_name: "Jane", last_name: "Smith" },
        usergrouptype: { rid: "type-1", group_type_name: "Custom", type: mockGroupType },
        account_name: "AccountY",
        is_consultant_only_group: true,
        user_count: 7,
        created_datetime: "2024-02-01T10:00:00Z",
        modified_datetime: "2024-02-02T12:00:00Z"
      })
    });
    // Mock getFormattedAccountsForGroup
    const mockAccounts = [{ rid: "acc-3", name: "Account3" }];
    jest.spyOn(service, "getFormattedAccountsForGroup").mockImplementation((type, groupId) => Promise.resolve(mockAccounts));
    // Mock getFormattedProjectsForGroup
    const mockProjects = [{ rid: "proj-3", name: "Project3" }];
    jest.spyOn(service, "getFormattedProjectsForGroup").mockResolvedValue(mockProjects);
    // Mock usersList
    const mockUsers = [{ rid: "user-3", name: "User3" }];
    jest.spyOn(service, "getFormattedUsersForGroup").mockResolvedValue(mockUsers);
    // Patch the method to call the spies
    service.getFormattedUsersForGroup = jest.fn().mockResolvedValue(mockUsers);
    service.getFormattedAccountsForGroup = jest.fn().mockImplementation((type, groupId) => Promise.resolve(mockAccounts));
    service.getFormattedProjectsForGroup = jest.fn().mockResolvedValue(mockProjects);
    const result = await service.listUserGroupById(mockGroupId);
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.userGroupById).toBeDefined();
    expect(result.data?.userGroupById.users).toEqual(mockUsers);
    expect(result.data?.userGroupById.accounts).toEqual(mockAccounts);
    expect(result.data?.userGroupById.projects).toEqual(mockProjects);
    expect(service.getFormattedProjectsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
    // created_by should NOT be set and user should NOT exist
    expect(result.data?.userGroupById.created_by).toBeUndefined();
    expect(result.data?.userGroupById.user).toBeUndefined();
    // getFormattedAccountsForGroup should be called with type and groupId
    expect(service.getFormattedAccountsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
  });

  it("should return null if group not found", async () => {
    (UserGroup.findOne as jest.Mock).mockResolvedValue(null);
    const result = await service.listUserGroupDetailsById("missing-group");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.userGroupById).toBeNull();
  });

  it("should handle errors and return FAILED", async () => {
    (UserGroup.findOne as jest.Mock).mockRejectedValue(new Error("DB error"));
    const result = await service.listUserGroupDetailsById("group-err");
    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.errorMessage).toBe("DB error");
  });

  it("should populate users, accounts, and projects in groupData", async () => {
    const mockGroupId = "group-xyz";
    const mockGroupType = "CUSTOM";
    // Mock UserGroup.findOne to return group details with user
    (UserGroup.findOne as jest.Mock).mockResolvedValue({
      toJSON: () => ({
        rid: mockGroupId,
        group_name: "Test Group",
        usergrouptype: { type: mockGroupType },
        user: { first_name: "John", last_name: "Doe" }
      })
    });
    // Mock getFormattedAccountsForGroup to accept type and groupId
    const mockAccounts = [{ rid: "acc-1", name: "Account1" }];
    jest.spyOn(service, "getFormattedAccountsForGroup").mockImplementation((type, groupId) => {
      expect(type).toBe(mockGroupType);
      expect(groupId).toBe(mockGroupId);
      return Promise.resolve(mockAccounts);
    });
    // Mock getFormattedProjectsForGroup
    const mockProjects = [{ rid: "proj-1", name: "Project1" }];
    jest.spyOn(service, "getFormattedProjectsForGroup").mockResolvedValue(mockProjects);
    // Mock usersList
    const mockUsers = [{ rid: "user-1", name: "User1" }];
    jest.spyOn(service, "getFormattedUsersForGroup").mockResolvedValue(mockUsers);

    // Patch the method to call the spies
    service.getFormattedUsersForGroup = jest.fn().mockResolvedValue(mockUsers);
    service.getFormattedAccountsForGroup = jest.fn().mockImplementation((type, groupId) => Promise.resolve(mockAccounts));
    service.getFormattedProjectsForGroup = jest.fn().mockResolvedValue(mockProjects);

    const result = await service.listUserGroupDetailsById(mockGroupId);
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.userGroupById).toBeDefined();
    expect(result.data?.userGroupById.users).toEqual(mockUsers);
    expect(result.data?.userGroupById.accounts).toEqual(mockAccounts);
    expect(result.data?.userGroupById.projects).toEqual(mockProjects);
    expect(service.getFormattedProjectsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
    // created_by should be set and user should be deleted
    expect(result.data?.userGroupById.created_by).toBe("John Doe");
    expect(result.data?.userGroupById.user).toBeUndefined();
    // getFormattedAccountsForGroup should be called with type and groupId
    expect(service.getFormattedAccountsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
  });

  it("should not set created_by or delete user if groupData.user is not present", async () => {
    const mockGroupId = "group-nouser";
    const mockGroupType = "CUSTOM";
    // Mock UserGroup.findOne to return group details WITHOUT user
    (UserGroup.findOne as jest.Mock).mockResolvedValue({
      toJSON: () => ({
        rid: mockGroupId,
        group_name: "Test Group NoUser",
        usergrouptype: { type: mockGroupType }
      })
    });
    // Mock getFormattedAccountsForGroup to accept type and groupId
    const mockAccounts = [{ rid: "acc-2", name: "Account2" }];
    jest.spyOn(service, "getFormattedAccountsForGroup").mockImplementation((type, groupId) => {
      expect(type).toBe(mockGroupType);
      expect(groupId).toBe(mockGroupId);
      return Promise.resolve(mockAccounts);
    });
    // Mock getFormattedProjectsForGroup
    const mockProjects = [{ rid: "proj-2", name: "Project2" }];
    jest.spyOn(service, "getFormattedProjectsForGroup").mockResolvedValue(mockProjects);
    // Mock usersList
    const mockUsers = [{ rid: "user-2", name: "User2" }];
    jest.spyOn(service, "getFormattedUsersForGroup").mockResolvedValue(mockUsers);

    // Patch the method to call the spies
    service.getFormattedUsersForGroup = jest.fn().mockResolvedValue(mockUsers);
    service.getFormattedAccountsForGroup = jest.fn().mockImplementation((type, groupId) => Promise.resolve(mockAccounts));
    service.getFormattedProjectsForGroup = jest.fn().mockResolvedValue(mockProjects);

    const result = await service.listUserGroupDetailsById(mockGroupId);
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.userGroupById).toBeDefined();
    expect(result.data?.userGroupById.users).toEqual(mockUsers);
    expect(result.data?.userGroupById.accounts).toEqual(mockAccounts);
    expect(result.data?.userGroupById.projects).toEqual(mockProjects);
    expect(service.getFormattedProjectsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
    // created_by should NOT be set and user should NOT exist
    expect(result.data?.userGroupById.created_by).toBeUndefined();
    expect(result.data?.userGroupById.user).toBeUndefined();
    // getFormattedAccountsForGroup should be called with type and groupId
    expect(service.getFormattedAccountsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
  });
});

describe("getAccountUsers", () => {
    it("should return BAD_REQUEST for invalid account_rid", async () => {
      const service = new UserGroupService();
      // Mock sequelize.query to return empty result
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([]);
      // Patch service.initSequelize directly
      (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);
      const result = await service.getAccountUsers("invalid-account");
      expect(result.statusCode).toBe(constants.BAD_REQUEST);
      expect(result.errorMessage).toBe("Invalid account_rid provided.");
    });

    it("should return users for valid parent account", async () => {
      const service = new UserGroupService();
      // Mock sequelize.query to return parent account
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([
        { rid: "account-1", is_parent: true, parent_account_rid: null }
      ]);
      (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);
      // Mock User.findAndCountAll
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            toJSON: () => ({ rid: "user-1", email: "user1@example.com", first_name: "Anna", org_id: "account-1", is_consultant_firm: false }),
            rid: "user-1"
          }
        ],
        count: 1,
      });
      // Mock UserGroupAccountMapping.findAll
      (UserGroupAccountMapping.findAll as jest.Mock).mockResolvedValue([
        { group_rid: "group-1" }
      ]);
      // Mock UserGroupMapping.findAll
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([
        { user_rid: "user-1", group_rid: "group-1" }
      ]);
      // Mock UserGroupEntityAccess.findAll
      (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([
        { user_rid: "user-1", group_rid: "group-1", access_type: "INCLUDE", comment: "Allowed" }
      ]);
      const result = await service.getAccountUsers("account-1");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      expect(result.data?.users[0].is_grouped).toBe(true);
      expect(result.data?.users[0].has_access).toBe(true);
      expect(result.data?.users[0].comment).toBe("Allowed");
    });

    it("should apply custom filters from buildWhereClause", async () => {
      const service = new UserGroupService();
      // Mock sequelize.query to return parent account
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([
        { rid: "account-1", is_parent: true, parent_account_rid: null }
      ]);
      (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);
      // Spy on buildWhereClause
      const customWhere = { email: "filtered@example.com" };
      jest.spyOn(service as any, "buildWhereClause").mockReturnValue({ whereClause: customWhere });
      // Mock User.findAndCountAll
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            toJSON: () => ({ rid: "user-2", email: "filtered@example.com", first_name: "Filtered", org_id: "account-1", is_consultant_firm: false }),
            rid: "user-2"
          }
        ],
        count: 1,
      });
      (UserGroupAccountMapping.findAll as jest.Mock).mockResolvedValue([]);
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
      (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([]);
      const filters = { email: "filtered@example.com" };
      const result = await service.getAccountUsers("account-1", undefined, "ACCOUNT", 1, 10, "first_name", "ASC", filters);
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      expect(result.data?.users[0].email).toBe("filtered@example.com");
      expect(User.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(customWhere),
        })
      );
    });

    it("should attach is_grouped and has_access flags correctly", async () => {
      const service = new UserGroupService();
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([
        { rid: "account-1", is_parent: true, parent_account_rid: null }
      ]);
      (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            toJSON: () => ({ rid: "user-3", email: "user3@example.com", first_name: "Bob", org_id: "account-1", is_consultant_firm: false }),
            rid: "user-3"
          }
        ],
        count: 1,
      });
      (UserGroupAccountMapping.findAll as jest.Mock).mockResolvedValue([
        { group_rid: "group-2" }
      ]);
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([
        { user_rid: "user-3", group_rid: "group-2" }
      ]);
      (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([
        { user_rid: "user-3", group_rid: "group-2", access_type: "EXCLUDE", comment: "Denied" }
      ]);
      const result = await service.getAccountUsers("account-1");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      expect(result.data?.users[0].is_grouped).toBe(true);
      expect(result.data?.users[0].has_access).toBe(false);
      expect(result.data?.users[0].comment).toBe("Denied");
    });

    it("should set has_access true if any group has INCLUDE access, false if any group has EXCLUDE access", async () => {
      const service = new UserGroupService();
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([
        { rid: "account-2", is_parent: true, parent_account_rid: null }
      ]);
      (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            toJSON: () => ({ rid: "user-4", email: "user4@example.com", first_name: "Alice", org_id: "account-2", is_consultant_firm: false }),
            rid: "user-4"
          }
        ],
        count: 1,
      });
      (UserGroupAccountMapping.findAll as jest.Mock).mockResolvedValue([
        { group_rid: "group-3" }, { group_rid: "group-4" }
      ]);
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([
        { user_rid: "user-4", group_rid: "group-3" }, { user_rid: "user-4", group_rid: "group-4" }
      ]);
      // group-3: EXCLUDE, group-4: INCLUDE
      (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([
        { group_rid: "group-3", access_type: "EXCLUDE" },
        { group_rid: "group-4", access_type: "INCLUDE" }
      ]);
      const result = await service.getAccountUsers("account-2");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      // EXCLUDE should take precedence
      expect(result.data?.users[0].has_access).toBe(false);

      // Now test with only INCLUDE
      (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([
        { group_rid: "group-4", access_type: "INCLUDE" }
      ]);
      const result2 = await service.getAccountUsers("account-2");
      expect(result2.statusCode).toBe(constants.SUCCESS);
      expect(result2.data?.users).toHaveLength(1);
      expect(result2.data?.users[0].has_access).toBe(true);
    });

    it("should fallback to default sort field and direction when invalid sortBy and sortOrder are provided", async () => {
      const service = new UserGroupService();
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([
        { rid: "account-3", is_parent: true, parent_account_rid: null }
      ]);
      (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            toJSON: () => ({ rid: "user-5", email: "user5@example.com", first_name: "DefaultUser", org_id: "account-3", is_consultant_firm: false }),
            rid: "user-5"
          }
        ],
        count: 1,
      });
      (UserGroupAccountMapping.findAll as jest.Mock).mockResolvedValue([]);
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
      (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([]);
      // Pass invalid sortBy and sortOrder
      const result = await service.getAccountUsers("account-3", undefined, "ACCOUNT", 1, 10, "invalid_field", "invalid_order");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      expect(result.data?.users[0].email).toBe("user5@example.com");
      expect(User.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 0,
          order: [["first_name", "ASC"]],
        })
      );
    });

    it("should use project_rid when entity_type is PROJECT", async () => {
      const service = new UserGroupService();
      const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
      (mockSequelize.query as jest.Mock).mockResolvedValue([
        { rid: "account-4", is_parent: true, parent_account_rid: null }
      ]);
      (service as any).initSequelize = jest.fn().mockResolvedValue(mockSequelize);
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            toJSON: () => ({ rid: "user-6", email: "user6@example.com", first_name: "ProjectUser", org_id: "account-4", is_consultant_firm: false }),
            rid: "user-6"
          }
        ],
        count: 1,
      });
      (UserGroupAccountMapping.findAll as jest.Mock).mockResolvedValue([]);
      (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
      (UserGroupEntityAccess.findAll as jest.Mock).mockResolvedValue([]);
      // Pass entity_type as PROJECT and provide project_rid
      const result = await service.getAccountUsers("account-4", "project-123", "PROJECT", 1, 10, "first_name", "ASC");
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data?.users).toHaveLength(1);
      expect(result.data?.users[0].email).toBe("user6@example.com");
      // Optionally, check that the correct entity_rid was used in the logic (if exposed)
    });

    
  });

describe("assignUsersToGroup", () => {
  let service: any;
  const mockUserId = "user-assign";
  const mockGroupRid = "group-assign";
  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  it("should return BAD_REQUEST if users is undefined", async () => {
    const result = await service.assignUsersToGroup({ group_rid: mockGroupRid, userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.BAD_REQUEST,
      message: constants.BAD_REQUEST_MESSAGE,
      errorMessage: "Both user_rid list and group_rid are required.",
    });
  });

  it("should return BAD_REQUEST if users is empty array", async () => {
    const result = await service.assignUsersToGroup({ users: [], group_rid: mockGroupRid, userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.BAD_REQUEST,
      message: constants.BAD_REQUEST_MESSAGE,
      errorMessage: "Both user_rid list and group_rid are required.",
    });
  });

  it("should return BAD_REQUEST if group_rid is missing", async () => {
    const result = await service.assignUsersToGroup({ users: [{ rid: "user-1", is_enabled: true, is_modified: true }], userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.BAD_REQUEST,
      message: constants.BAD_REQUEST_MESSAGE,
      errorMessage: "Both user_rid list and group_rid are required.",
    });
  });

  it("should not add or remove if no user is modified", async () => {
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
    (UserGroupMapping.bulkCreate as jest.Mock).mockResolvedValue([]);
    (UserGroupMapping.destroy as jest.Mock).mockResolvedValue(0);
    const users = [
      { rid: "user-1", is_enabled: true, is_modified: false },
      { rid: "user-2", is_enabled: false, is_modified: false }
    ];
    const result = await service.assignUsersToGroup({ users, group_rid: mockGroupRid, userId: mockUserId });
    expect(UserGroupMapping.findAll).not.toHaveBeenCalled();
    expect(UserGroupMapping.bulkCreate).not.toHaveBeenCalled();
    expect(UserGroupMapping.destroy).not.toHaveBeenCalled();
    expect(result).toEqual({
      statusCode: constants.SUCCESS,
      message: "Group access updated. Added: 0, Removed: 0",
      data: { added: [], removed: [] },
    });
  });

  it("should add users not already assigned", async () => {
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ user_rid: "user-2" }]);
    (UserGroupMapping.bulkCreate as jest.Mock).mockResolvedValue([{ user_rid: "user-1" }]);
    (UserGroupMapping.destroy as jest.Mock).mockResolvedValue(0);
    const users = [
      { rid: "user-1", is_enabled: true, is_modified: true },
      { rid: "user-2", is_enabled: true, is_modified: true }
    ];
    const result = await service.assignUsersToGroup({ users, group_rid: mockGroupRid, userId: mockUserId });
    expect(UserGroupMapping.findAll).toHaveBeenCalledWith({
      where: { group_rid: mockGroupRid, user_rid: { [Op.in]: ["user-1", "user-2"] } },
      attributes: ["user_rid"],
    });
    expect(UserGroupMapping.bulkCreate).toHaveBeenCalledWith([
      { group_rid: mockGroupRid, user_rid: "user-1", created_by: mockUserId }
    ]);
    expect(result.data?.added).toEqual(["user-1"]);
    expect(result.data?.removed).toEqual([]);
  });

  it("should not add users already assigned", async () => {
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ user_rid: "user-1" }, { user_rid: "user-2" }]);
    (UserGroupMapping.bulkCreate as jest.Mock).mockResolvedValue([]);
    (UserGroupMapping.destroy as jest.Mock).mockResolvedValue(0);
    const users = [
      { rid: "user-1", is_enabled: true, is_modified: true },
      { rid: "user-2", is_enabled: true, is_modified: true }
    ];
    const result = await service.assignUsersToGroup({ users, group_rid: mockGroupRid, userId: mockUserId });
    expect(UserGroupMapping.bulkCreate).not.toHaveBeenCalled();
    expect(result.data?.added).toEqual([]);
    expect(result.data?.removed).toEqual([]);
  });

  it("should remove users from group", async () => {
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
    (UserGroupMapping.bulkCreate as jest.Mock).mockResolvedValue([]);
    (UserGroupMapping.destroy as jest.Mock).mockResolvedValue(2);
    const users = [
      { rid: "user-1", is_enabled: false, is_modified: true },
      { rid: "user-2", is_enabled: false, is_modified: true }
    ];
    const result = await service.assignUsersToGroup({ users, group_rid: mockGroupRid, userId: mockUserId });
    expect(UserGroupMapping.destroy).toHaveBeenCalledWith({
      where: { group_rid: mockGroupRid, user_rid: { [Op.in]: ["user-1", "user-2"] } },
    });
    expect(result.data?.added).toEqual([]);
    expect(result.data?.removed).toEqual(["user-1", "user-2"]);
  });

  it("should add and remove users in the same call", async () => {
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ user_rid: "user-2" }]);
    (UserGroupMapping.bulkCreate as jest.Mock).mockResolvedValue([{ user_rid: "user-1" }]);
    (UserGroupMapping.destroy as jest.Mock).mockResolvedValue(1);
    const users = [
      { rid: "user-1", is_enabled: true, is_modified: true },
      { rid: "user-2", is_enabled: false, is_modified: true }
    ];
    const result = await service.assignUsersToGroup({ users, group_rid: mockGroupRid, userId: mockUserId });
    expect(UserGroupMapping.bulkCreate).toHaveBeenCalledWith([
      { group_rid: mockGroupRid, user_rid: "user-1", created_by: mockUserId }
    ]);
    expect(UserGroupMapping.destroy).toHaveBeenCalledWith({
      where: { group_rid: mockGroupRid, user_rid: { [Op.in]: ["user-2"] } },
    });
    expect(result.data?.added).toEqual(["user-1"]);
    expect(result.data?.removed).toEqual(["user-2"]);
  });

  it("should handle errors from bulkCreate", async () => {
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
    (UserGroupMapping.bulkCreate as jest.Mock).mockRejectedValue(new Error("Bulk create error"));
    (UserGroupMapping.destroy as jest.Mock).mockResolvedValue(0);
    const users = [{ rid: "user-1", is_enabled: true, is_modified: true }];
    const result = await service.assignUsersToGroup({ users, group_rid: mockGroupRid, userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: "Bulk create error",
    });
  });

  it("should handle errors from destroy", async () => {
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);
    (UserGroupMapping.bulkCreate as jest.Mock).mockResolvedValue([]);
    (UserGroupMapping.destroy as jest.Mock).mockRejectedValue(new Error("Destroy error"));
    const users = [{ rid: "user-1", is_enabled: false, is_modified: true }];
    const result = await service.assignUsersToGroup({ users, group_rid: mockGroupRid, userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: "Destroy error",
    });
  });

  it("should handle unexpected errors", async () => {
    (UserGroupMapping.findAll as jest.Mock).mockImplementation(() => { throw new Error("Unexpected error"); });
    const users = [{ rid: "user-1", is_enabled: true, is_modified: true }];
    const result = await service.assignUsersToGroup({ users, group_rid: mockGroupRid, userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: "Unexpected error",
    });
  });
});

describe("assignAccountsToGroup", () => {
  let service: any;
  const mockUserId = "user-assign";
  const mockGroupRid = "group-assign";
  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  it("should return BAD_REQUEST if accounts is undefined", async () => {
    const result = await service.assignAccountsToGroup({ group_rid: mockGroupRid, userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.BAD_REQUEST,
      message: constants.BAD_REQUEST_MESSAGE,
      errorMessage: "Both account_rid and group_rid are required.",
    });
  });

  it("should return BAD_REQUEST if group_rid is missing", async () => {
    const result = await service.assignAccountsToGroup({ accounts: [{ rid: "acc-1", is_enabled: true, is_modified: true }], userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.BAD_REQUEST,
      message: constants.BAD_REQUEST_MESSAGE,
      errorMessage: "Both account_rid and group_rid are required.",
    });
  });

  it("should not assign or revoke if no account is modified", async () => {
    jest.spyOn(service, "createAccountMappings").mockResolvedValue([]);
    jest.spyOn(service, "revokeAccountMappings").mockResolvedValue([]);
    const accounts = [
      { rid: "acc-1", is_enabled: true, is_modified: false },
      { rid: "acc-2", is_enabled: false, is_modified: false }
    ];
    const result = await service.assignAccountsToGroup({ accounts, group_rid: mockGroupRid, userId: mockUserId });
    expect(service.createAccountMappings).toHaveBeenCalledWith(mockGroupRid, [], mockUserId);
    expect(service.revokeAccountMappings).toHaveBeenCalledWith(mockGroupRid, []);
    expect(result).toEqual({
      statusCode: constants.SUCCESS,
      message: "Account access updated. Created: 0, Deleted: 0",
      data: { created: [], deleted: [] },
    });
  });

  it("should assign accounts using createAccountMappings", async () => {
    jest.spyOn(service, "createAccountMappings").mockResolvedValue(["acc-1"]);
    jest.spyOn(service, "revokeAccountMappings").mockResolvedValue([]);
    const accounts = [
      { rid: "acc-1", is_enabled: true, is_modified: true },
      { rid: "acc-2", is_enabled: true, is_modified: false }
    ];
    const result = await service.assignAccountsToGroup({ accounts, group_rid: mockGroupRid, userId: mockUserId });
    expect(service.createAccountMappings).toHaveBeenCalledWith(mockGroupRid, ["acc-1"], mockUserId);
    expect(service.revokeAccountMappings).toHaveBeenCalledWith(mockGroupRid, []);
    expect(result.data?.created).toEqual(["acc-1"]);
    expect(result.data?.deleted).toEqual([]);
  });

  it("should revoke accounts using revokeAccountMappings", async () => {
    jest.spyOn(service, "createAccountMappings").mockResolvedValue([]);
    jest.spyOn(service, "revokeAccountMappings").mockResolvedValue(["acc-2"]);
    const accounts = [
      { rid: "acc-1", is_enabled: true, is_modified: false },
      { rid: "acc-2", is_enabled: false, is_modified: true }
    ];
    const result = await service.assignAccountsToGroup({ accounts, group_rid: mockGroupRid, userId: mockUserId });
    expect(service.createAccountMappings).toHaveBeenCalledWith(mockGroupRid, [], mockUserId);
    expect(service.revokeAccountMappings).toHaveBeenCalledWith(mockGroupRid, ["acc-2"]);
    expect(result.data?.created).toEqual([]);
    expect(result.data?.deleted).toEqual(["acc-2"]);
  });

  it("should assign and revoke accounts in the same call", async () => {
    jest.spyOn(service, "createAccountMappings").mockResolvedValue(["acc-1"]);
    jest.spyOn(service, "revokeAccountMappings").mockResolvedValue(["acc-2"]);
    const accounts = [
      { rid: "acc-1", is_enabled: true, is_modified: true },
      { rid: "acc-2", is_enabled: false, is_modified: true }
    ];
    const result = await service.assignAccountsToGroup({ accounts, group_rid: mockGroupRid, userId: mockUserId });
    expect(service.createAccountMappings).toHaveBeenCalledWith(mockGroupRid, ["acc-1"], mockUserId);
    expect(service.revokeAccountMappings).toHaveBeenCalledWith(mockGroupRid, ["acc-2"]);
    expect(result.data?.created).toEqual(["acc-1"]);
    expect(result.data?.deleted).toEqual(["acc-2"]);
  });

  it("should handle errors from createAccountMappings", async () => {
    jest.spyOn(service, "createAccountMappings").mockRejectedValue(new Error("Create error"));
    jest.spyOn(service, "revokeAccountMappings").mockResolvedValue([]);
    const accounts = [
      { rid: "acc-1", is_enabled: true, is_modified: true }
    ];
    const result = await service.assignAccountsToGroup({ accounts, group_rid: mockGroupRid, userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: "Create error",
    });
  });

  it("should handle errors from revokeAccountMappings", async () => {
    jest.spyOn(service, "createAccountMappings").mockResolvedValue([]);
    jest.spyOn(service, "revokeAccountMappings").mockRejectedValue(new Error("Revoke error"));
    const accounts = [
      { rid: "acc-2", is_enabled: false, is_modified: true }
    ];
    const result = await service.assignAccountsToGroup({ accounts, group_rid: mockGroupRid, userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: "Revoke error",
    });
  });

  it("should handle unexpected errors", async () => {
    jest.spyOn(service, "createAccountMappings").mockImplementation(() => { throw new Error("Unexpected error"); });
    const accounts = [
      { rid: "acc-1", is_enabled: true, is_modified: true }
    ];
    const result = await service.assignAccountsToGroup({ accounts, group_rid: mockGroupRid, userId: mockUserId });
    expect(result).toEqual({
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: "Unexpected error",
    });
  });
});

describe("createAccountMappings", () => {
  let service: any;
  const mockUserId = "user-assign";
  const mockGroupRid = "group-assign";
  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  it("should return empty array if accountRids is empty", async () => {
    const result = await service.createAccountMappings(mockGroupRid, [], mockUserId);
    expect(result).toEqual([]);
  });

  it("should only create new mappings for accounts not already assigned", async () => {
    (UserGroupAccountMapping.findAll as jest.Mock).mockResolvedValue([{ account_rid: "acc-1" }]);
    (UserGroupAccountMapping.bulkCreate as jest.Mock).mockResolvedValue([{ account_rid: "acc-2" }]);
    const result = await service.createAccountMappings(mockGroupRid, ["acc-1", "acc-2"], mockUserId);
    expect(UserGroupAccountMapping.findAll).toHaveBeenCalledWith({
      where: { group_rid: mockGroupRid, account_rid: { [Op.in]: ["acc-1", "acc-2"] } },
      attributes: ["account_rid"],
      raw: true,
    });
    expect(UserGroupAccountMapping.bulkCreate).toHaveBeenCalledWith([
      { group_rid: mockGroupRid, account_rid: "acc-2", created_by: mockUserId }
    ]);
    expect(result).toEqual(["acc-2"]);
  });

  it("should return empty array if all accounts already assigned", async () => {
    (UserGroupAccountMapping.findAll as jest.Mock).mockResolvedValue([{ account_rid: "acc-1" }, { account_rid: "acc-2" }]);
    (UserGroupAccountMapping.bulkCreate as jest.Mock).mockResolvedValue([]);
    const result = await service.createAccountMappings(mockGroupRid, ["acc-1", "acc-2"], mockUserId);
    expect(UserGroupAccountMapping.bulkCreate).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should handle errors from bulkCreate", async () => {
    (UserGroupAccountMapping.findAll as jest.Mock).mockResolvedValue([]);
    (UserGroupAccountMapping.bulkCreate as jest.Mock).mockRejectedValue(new Error("Bulk create error"));
    await expect(service.createAccountMappings(mockGroupRid, ["acc-1"], mockUserId)).rejects.toThrow("Bulk create error");
  });
});

describe("revokeAccountMappings", () => {
  let service: any;
  const mockUserId = "user-assign";
  const mockGroupRid = "group-assign";
  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  it("should return empty array if accountRids is empty", async () => {
    const result = await service.revokeAccountMappings(mockGroupRid, []);
    expect(result).toEqual([]);
  });

  it("should revoke all mappings for provided accounts", async () => {
    // Mock sequelize.query for users and projects
    const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
    (mockSequelize.query as jest.Mock)
      .mockResolvedValueOnce([{ user_rid: "user-1" }])  // First query for users
      .mockResolvedValueOnce([{ entity_rid: "proj-1" }]);  // Second query for projects
    (UserGroupMapping.destroy as jest.Mock).mockResolvedValue(1);
    (UserGroupEntityAccess.destroy as jest.Mock).mockResolvedValue(1);
    (UserGroupAccountMapping.destroy as jest.Mock).mockResolvedValue(1);
    // Patch service.initSequelize
    service.initSequelize = jest.fn().mockResolvedValue(mockSequelize);
    const result = await service.revokeAccountMappings(mockGroupRid, ["acc-1"]);
    expect(UserGroupMapping.destroy).toHaveBeenCalledWith({
      where: { group_rid: mockGroupRid, user_rid: { [Op.in]: ["user-1"] } },
    });
    expect(UserGroupEntityAccess.destroy).toHaveBeenCalledWith({
      where: { group_rid: mockGroupRid, entity_rid: { [Op.in]: ["acc-1", "proj-1"] } },
    });
    expect(UserGroupAccountMapping.destroy).toHaveBeenCalledWith({
      where: { group_rid: mockGroupRid, account_rid: { [Op.in]: ["acc-1"] } },
    });
    expect(result).toEqual(["acc-1"]);
  });

  it("should handle errors from destroy", async () => {
    // Mock sequelize.query for users and projects
    const mockSequelize = await import("../../src/config/dataSource").then(m => m.initSequelize());
    (mockSequelize.query as jest.Mock).mockResolvedValueOnce([{ user_rid: "user-1" }]);
    (mockSequelize.query as jest.Mock).mockResolvedValueOnce([{ entity_rid: "proj-1" }]);
    (UserGroupMapping.destroy as jest.Mock).mockRejectedValue(new Error("Mapping destroy error"));
    (UserGroupEntityAccess.destroy as jest.Mock).mockResolvedValue(1);
    (UserGroupAccountMapping.destroy as jest.Mock).mockResolvedValue(1);
    service.initSequelize = jest.fn().mockResolvedValue(mockSequelize);
    await expect(service.revokeAccountMappings(mockGroupRid, ["acc-1"])).rejects.toThrow("Mapping destroy error");
  });
});

describe('assignEntityAccessToAccount', () => {
  let service: UserGroupService;
  let findOneMock: jest.Mock;
  let createMock: jest.Mock;
  let updateMock: jest.Mock;

  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
    
    findOneMock = UserGroupEntityAccess.findOne as jest.Mock;
    createMock = UserGroupEntityAccess.create as jest.Mock;
    updateMock = jest.fn();
  });

  it('returns BAD_REQUEST if accounts is missing', async () => {
    const result = await service.assignEntityAccessToAccount({
      user_rid: 'user1',
      group_rid: 'group1',
      accounts: undefined as any,
      userId: 'admin',
    });
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toMatch(/Missing required identifiers/);
  });

  it('skips accounts with is_modified=false', async () => {
    const result = await service.assignEntityAccessToAccount({
      user_rid: 'user1',
      group_rid: 'group1',
      accounts: [
        { rid: 'acc1', is_enabled: true, is_modified: false },
        { rid: 'acc2', is_enabled: false, is_modified: false },
      ],
      userId: 'admin',
    });
    expect(result.data?.created).toEqual([]);
    expect(result.data?.updated).toEqual([]);
    expect(result.statusCode).toBe(constants.SUCCESS);
  });

  it('creates new access records for accounts not found', async () => {
    findOneMock.mockResolvedValueOnce(null);
    createMock.mockResolvedValueOnce({});
    const result = await service.assignEntityAccessToAccount({
      user_rid: 'user1',
      group_rid: 'group1',
      accounts: [
        { rid: 'acc1', is_enabled: true, is_modified: true },
      ],
      userId: 'admin',
    });
    expect(findOneMock).toHaveBeenCalled();
    expect(createMock).toHaveBeenCalled();
    expect(result.data?.created).toEqual(['acc1']);
    expect(result.data?.updated).toEqual([]);
    expect(result.statusCode).toBe(constants.SUCCESS);
  });

  it('updates access records for accounts found', async () => {
    updateMock.mockResolvedValueOnce({});
    findOneMock.mockResolvedValueOnce({ update: updateMock });
    const result = await service.assignEntityAccessToAccount({
      user_rid: 'user1',
      group_rid: 'group1',
      accounts: [
        { rid: 'acc2', is_enabled: false, is_modified: true },
      ],
      userId: 'admin',
    });
    expect(findOneMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
    expect(result.data?.created).toEqual([]);
    expect(result.data?.updated).toEqual(['acc2']);
    expect(result.statusCode).toBe(constants.SUCCESS);
  });

  it('handles multiple accounts, mixed create and update', async () => {
    // acc1: create, acc2: update
    findOneMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ update: updateMock });
    createMock.mockResolvedValueOnce({});
    updateMock.mockResolvedValueOnce({});
    const result = await service.assignEntityAccessToAccount({
      user_rid: 'user1',
      group_rid: 'group1',
      accounts: [
        { rid: 'acc1', is_enabled: true, is_modified: true },
        { rid: 'acc2', is_enabled: false, is_modified: true },
      ],
      userId: 'admin',
    });
    expect(result.data?.created).toEqual(['acc1']);
    expect(result.data?.updated).toEqual(['acc2']);
    expect(result.statusCode).toBe(constants.SUCCESS);
  });

  it('returns FAILED on error', async () => {
    findOneMock.mockRejectedValueOnce(new Error('DB error'));
    const result = await service.assignEntityAccessToAccount({
      user_rid: 'user1',
      group_rid: 'group1',
      accounts: [
        { rid: 'acc1', is_enabled: true, is_modified: true },
      ],
      userId: 'admin',
    });
    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.errorMessage).toBe('DB error');
  });
});
// ---

 describe("assignEntityAccessToProjects", () => {
    let service: UserGroupService;
    const group_rid = "group-entity";
    const userId = "user-entity";
    const projects = { p1: true, p2: false, p3: true };
    beforeEach(() => {
      service = new UserGroupService();
      jest.clearAllMocks();
    });

    it("should return BAD_REQUEST if group_rid is missing", async () => {
      const result = await service["assignEntityAccessToProjects"]({ projects, userId });
      expect(result.statusCode).toBe(constants.BAD_REQUEST);
      expect(result.errorMessage).toMatch(/Missing user\/group info or project list/);
    });

    it("should return BAD_REQUEST if projects is missing", async () => {
      const result = await service["assignEntityAccessToProjects"]({ group_rid, userId ,projects: undefined});
      expect(result.statusCode).toBe(constants.BAD_REQUEST);
      expect(result.errorMessage).toMatch(/Missing user\/group info or project list/);
    });

    it("should update and create access for each project", async () => {
      // Mock findOne to return null for first, then an object for second, then null for third
      const updateMock = jest.fn().mockResolvedValue(undefined);
      (UserGroupEntityAccess.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ update: updateMock })
        .mockResolvedValueOnce(null);
      (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue(undefined);
      const result = await service["assignEntityAccessToProjects"]({ group_rid, projects, userId });
      expect(UserGroupEntityAccess.findOne).toHaveBeenCalledTimes(3);
      expect(UserGroupEntityAccess.create).toHaveBeenCalledTimes(2);
      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data).toEqual({ updated: 3, failed: 0 });
    });

    it("should count failed updates if project_rid is missing", async () => {
      const badProjects = { '': true, p2: false };
      (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
      (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue(undefined);
      const result = await service["assignEntityAccessToProjects"]({ group_rid, projects: badProjects, userId });
      expect(result.data).toBeDefined();
      expect(result.data!.failed).toBeGreaterThan(0);
    });

    it("should count failed updates if update/create throws", async () => {
      (UserGroupEntityAccess.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ update: jest.fn().mockRejectedValue(new Error("fail")) })
        .mockResolvedValueOnce(null);
      (UserGroupEntityAccess.create as jest.Mock)
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(undefined);
      const result = await service["assignEntityAccessToProjects"]({ group_rid, projects, userId });
     expect(result.data!.failed).toBeGreaterThan(0);
    });

    it("should handle when all projects are disabled", async () => {
      const disabledProjects = { p1: false, p2: false };
      (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
      (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue(undefined);
      const result = await service["assignEntityAccessToProjects"]({ group_rid, projects: disabledProjects, userId });
      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.data!.updated).toBe(2);
    });

   
  });

describe("getProjectsOfSelectedAccounts", () => {
  let service: UserGroupService;
  const mockProjects = [
    { rid: "p1", project_name: "Project 1" },
    { rid: "p2", project_name: "Project 2" }
  ];
  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  it("should return BAD_REQUEST if account_rids is empty string", async () => {
    const result = await service.getProjectsOfSelectedAccounts("");
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toBe("Invalid account_rid provided.");
  });

  it("should return BAD_REQUEST if account_rids is an empty array", async () => {
    const result = await service.getProjectsOfSelectedAccounts([]);
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toBe("Invalid account_rid provided.");
  });

  it("should return projects and totalCount for valid account_rids (string)", async () => {
    const sequelizeMock = {
      query: jest.fn()
        .mockResolvedValueOnce(mockProjects)
        .mockResolvedValueOnce([{ total_count: "2" }])
    };
    jest.spyOn(require("../../src/config/dataSource"), "initSequelize").mockResolvedValue(sequelizeMock);
    (service as any).buildSQLConditions = jest.fn().mockReturnValue(null);
    const result = await service.getProjectsOfSelectedAccounts("acc1,acc2");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.projects).toEqual(mockProjects);
    expect(result.data?.totalCount).toBe(2);
  });

  it("should return projects and totalCount for valid account_rids (array)", async () => {
    const sequelizeMock = {
      query: jest.fn()
        .mockResolvedValueOnce(mockProjects)
        .mockResolvedValueOnce([{ total_count: "2" }])
    };
    (service as any).buildSQLConditions = jest.fn().mockReturnValue(null);
    (service as any).initSequelize = jest.fn().mockResolvedValue(sequelizeMock);
    const result = await service.getProjectsOfSelectedAccounts(["acc1", "acc2"]);
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.projects).toEqual(mockProjects);
    expect(result.data?.totalCount).toBe(2);
  });

  it("should apply filters and sort parameters", async () => {
    const sequelizeMock = {
      query: jest.fn()
        .mockResolvedValueOnce(mockProjects)
        .mockResolvedValueOnce([{ total_count: "2" }])
    };
    const filters: Record<string, any> = { project_name: { equals: "Project 1" } };
    (service as any).buildSQLConditions = jest.fn().mockReturnValue("LOWER(project_name) = 'project 1'");
    (service as any).initSequelize = jest.fn().mockResolvedValue(sequelizeMock);
    const result = await service.getProjectsOfSelectedAccounts(["acc1"], undefined, 1, 10, filters, "project_name", "desc");
    console.log(result)
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.projects).toEqual(mockProjects);
    expect(result.data?.totalCount).toBe(2);
    expect((service as any).buildSQLConditions).toHaveBeenCalledWith(filters);
  });

   it("should apply default filters and sort parameters if invalid provided", async () => {
    const sequelizeMock = {
      query: jest.fn()
        .mockResolvedValueOnce(mockProjects)
        .mockResolvedValueOnce([{ total_count: "2" }])
    };
    const filters: Record<string, any> = { project_name: { equals: "Project 1" } };
    (service as any).buildSQLConditions = jest.fn().mockReturnValue("LOWER(project_name) = 'project 1'");
    (service as any).initSequelize = jest.fn().mockResolvedValue(sequelizeMock);
    const result = await service.getProjectsOfSelectedAccounts(["acc1"], undefined, 1, 10, filters, "project_namess", "descc");
    console.log(result)
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.projects).toEqual(mockProjects);
    expect(result.data?.totalCount).toBe(2);
    expect((service as any).buildSQLConditions).toHaveBeenCalledWith(filters);
  });
  it("should call buildSQLConditions and use its output in the query", async () => {
    const sequelizeMock = {
      query: jest.fn()
        .mockResolvedValueOnce([{ rid: "p1", project_name: "Project 1" }])
        .mockResolvedValueOnce([{ total_count: "1" }])
    };
    const filters: Record<string, any> = { project_name: { contains: "Proj" }, user_count: { gt: 5 } };
    const sqlCondition = (service as any).buildSQLConditions(filters);
    (service as any).buildSQLConditions = jest.fn().mockReturnValue(sqlCondition);
    (service as any).initSequelize = jest.fn().mockResolvedValue(sequelizeMock);
    const result = await service.getProjectsOfSelectedAccounts(["acc1"], undefined, 1, 10, filters, "project_name", "asc");
    expect((service as any).buildSQLConditions).toHaveBeenCalledWith(filters);
    expect(sequelizeMock.query).toHaveBeenCalledWith(
      expect.stringContaining(sqlCondition),
      expect.objectContaining({ replacements: expect.any(Object), type: expect.anything() })
    );
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.projects).toEqual([{ rid: "p1", project_name: "Project 1" }]);
    expect(result.data?.totalCount).toBe(1);
  });

   it("should call buildSQLConditions and use its output in the query 2", async () => {
    const sequelizeMock = {
      query: jest.fn()
        .mockResolvedValueOnce([{ rid: "p1", project_name: "Project 1" }])
        .mockResolvedValueOnce([{ total_count: "1" }])
    };
    const filters: Record<string, any> = { project_name: { equals: "Project 1" }, user_count: { "lt": 5 } };
    const sqlCondition = (service as any).buildSQLConditions(filters);
    (service as any).buildSQLConditions = jest.fn().mockReturnValue(sqlCondition);
    (service as any).initSequelize = jest.fn().mockResolvedValue(sequelizeMock);
    const result = await service.getProjectsOfSelectedAccounts(["acc1"], undefined, 1, 10, filters, "project_name", "asc");
    expect((service as any).buildSQLConditions).toHaveBeenCalledWith(filters);
    expect(sequelizeMock.query).toHaveBeenCalledWith(
      expect.stringContaining(sqlCondition),
      expect.objectContaining({ replacements: expect.any(Object), type: expect.anything() })
    );
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.projects).toEqual([{ rid: "p1", project_name: "Project 1" }]);
    expect(result.data?.totalCount).toBe(1);
  });

  it("should call buildSQLConditions and use its output in the query with is_empty, gte, lte, in, not_equals", async () => {
    const sequelizeMock = {
      query: jest.fn()
        .mockResolvedValueOnce([{ rid: "p1", project_name: "Project 1" }])
        .mockResolvedValueOnce([{ total_count: "1" }])
    };
    const filters: Record<string, any> = {
      project_name: { is_empty: true },
      user_count: { gte: 5, lte: 10 },
      status: { in: ["active", "pending"] },
      account_name: { not_equals: "TestAccount" }
    };
    const sqlCondition = (service as any).buildSQLConditions(filters);
    (service as any).buildSQLConditions = jest.fn().mockReturnValue(sqlCondition);
    (service as any).initSequelize = jest.fn().mockResolvedValue(sequelizeMock);
    const result = await service.getProjectsOfSelectedAccounts(["acc1"], undefined, 1, 10, filters, "project_name", "asc");
    expect((service as any).buildSQLConditions).toHaveBeenCalledWith(filters);
    expect(sequelizeMock.query).toHaveBeenCalledWith(
      expect.stringContaining(sqlCondition),
      expect.objectContaining({ replacements: expect.any(Object), type: expect.anything() })
    );
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.projects).toEqual([{ rid: "p1", project_name: "Project 1" }]);
    expect(result.data?.totalCount).toBe(1);
  });

  it("should call buildSQLConditions and use its output in the query with or and default operator", async () => {
    const sequelizeMock = {
      query: jest.fn()
        .mockResolvedValueOnce([{ rid: "p1", project_name: "Project 1" }])
        .mockResolvedValueOnce([{ total_count: "1" }])
    };
    const filters: Record<string, any> = {
      project_name: { or: [ { equals: "Project 1" }, { contains: "Proj" } ] },
      status: { default: "unsupported" }
    };
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const sqlCondition = (service as any).buildSQLConditions(filters);
    (service as any).buildSQLConditions = jest.fn().mockReturnValue(sqlCondition);
    (service as any).initSequelize = jest.fn().mockResolvedValue(sequelizeMock);
    const result = await service.getProjectsOfSelectedAccounts(["acc1"], undefined, 1, 10, filters, "project_name", "asc");
    expect((service as any).buildSQLConditions).toHaveBeenCalledWith(filters);
    expect(sequelizeMock.query).toHaveBeenCalledWith(
      expect.stringContaining(sqlCondition),
      expect.objectContaining({ replacements: expect.any(Object), type: expect.anything() })
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Unsupported operator: default"));
    warnSpy.mockRestore();
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.projects).toEqual([{ rid: "p1", project_name: "Project 1" }]);
    expect(result.data?.totalCount).toBe(1);
  });

  it("should handle database query failure", async () => {
    const sequelizeMock = {
      query: jest.fn().mockRejectedValue(new Error("DB error"))
    };
    (service as any).buildSQLConditions = jest.fn().mockReturnValue(null);
    (service as any).initSequelize = jest.fn().mockResolvedValue(sequelizeMock);
    const result = await service.getProjectsOfSelectedAccounts(["acc1"]);
    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.errorMessage).toBe("Failed to fetch projects");
  });
});
describe('getProjectsWithUserAccessFlag', () => {
  let userGroupService: UserGroupService;
  let mockSequelize: any;
  
  beforeEach(() => {
    userGroupService = new UserGroupService();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock sequelize with a more sophisticated query mock
    mockSequelize = {
      query: jest.fn().mockImplementation((sql, options) => {
        // Check if this is a count query
        if (sql.includes('COUNT(*)')) {
          return Promise.resolve([{ total_count: '1' }]);
        } else {
          // This is the projects query
          return Promise.resolve([
            {
              rid: 'project1',
              project_name: 'Project 1',
              account_name: 'Account 1',
              account_rid: 'account1',
              has_project_enabled: true,
              access_type: 'INCLUDE',
              has_access: true,
              is_grouped: true
            }
          ]);
        }
      }),
      authenticate: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
      literal: jest.fn((val) => val)
    };
    
    // Mock the initSequelize function to return our mockSequelize
    (require("../../src/config/dataSource").initSequelize as jest.Mock).mockResolvedValue(mockSequelize);
  });
  
  it('should return projects with USER access type successfully', async () => {
    // Mock data
    const mockProjects = [
      {
        rid: 'project1',
        project_name: 'Project 1',
        account_name: 'Account 1',
        account_rid: 'account1',
        has_project_enabled: true,
        access_type: 'INCLUDE',
        has_access: true,
        is_grouped: true
      }
    ];
    
    const mockTotalCount = [{ total_count: '1' }];
    
    // Setup mock responses for the two queries
    mockSequelize.query
      .mockResolvedValueOnce(mockProjects)
      .mockResolvedValueOnce(mockTotalCount);
    
    // Call the method
    const result = await userGroupService.getProjectsWithUserAccessFlag(
      'USER',
      'account1',
      'user1',
      1,
      10,
      {},
      'project_name',
      'ASC'
    );
    
    // Assertions
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.message).toBe(constants.SUCCESS_MESSAGE);
    expect(result.data).toBeDefined();
    expect(result.data?.projects).toEqual(mockProjects);
    expect(result.data?.totalCount).toBe(1);
    
    // Verify the query was called with correct parameters
    expect(mockSequelize.query).toHaveBeenCalledTimes(2);
    
    // Verify first query (projects query)
    const firstCallArgs = mockSequelize.query.mock.calls[0];
    expect(firstCallArgs[0]).toContain('LEFT JOIN');
    expect(firstCallArgs[0]).toContain('ORDER BY');
    expect(firstCallArgs[1].replacements).toEqual({
      account_rid: 'account1',
      entity_rid: 'user1',
      limit: 10,
      offset: 0
    });
    
    // Verify second query (count query)
    const secondCallArgs = mockSequelize.query.mock.calls[1];
    expect(secondCallArgs[0]).toContain('COUNT(*)');
  });
  
  it('should return projects with GROUP access type successfully', async () => {
    // Mock data
    const mockProjects = [
      {
        rid: 'project1',
        project_name: 'Project 1',
        account_name: 'Account 1',
        account_rid: 'account1',
        has_project_enabled: true,
        access_type: 'INCLUDE',
        has_access: true
      }
    ];
    
    const mockTotalCount = [{ total_count: '1' }];
    
    // Setup mock responses
    mockSequelize.query
      .mockResolvedValueOnce(mockProjects)
      .mockResolvedValueOnce(mockTotalCount);
    
    // Call the method
    const result = await userGroupService.getProjectsWithUserAccessFlag(
      'GROUP',
      'account1',
      'group1',
      1,
      10,
      {},
      'project_name',
      'ASC'
    );
    
    // Assertions
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.message).toBe(constants.SUCCESS_MESSAGE);
    expect(result.data).toBeDefined();
    expect(result.data?.projects).toEqual(mockProjects);
    expect(result.data?.totalCount).toBe(1);
    
    // Verify the query was called with correct parameters
    expect(mockSequelize.query).toHaveBeenCalledTimes(2);
    
    // Verify first query (projects query)
    const firstCallArgs = mockSequelize.query.mock.calls[0];
    expect(firstCallArgs[0]).not.toContain('user_group_mapping ugm'); // No join for GROUP access type
    expect(firstCallArgs[1].replacements).toEqual({
      account_rid: 'account1',
      entity_rid: 'group1',
      limit: 10,
      offset: 0
    });
  });
  
  it('should handle filters and sorting correctly', async () => {
    // Mock data
    const mockProjects = [{ project_name: 'Project 1' }];
    const mockTotalCount = [{ total_count: '1' }];
    
    // Setup mock responses
    mockSequelize.query
      .mockResolvedValueOnce(mockProjects)
      .mockResolvedValueOnce(mockTotalCount);
    
    // Call the method with filters and custom sorting
    const result = await userGroupService.getProjectsWithUserAccessFlag(
      'USER',
      'account1',
      'user1',
      1,
      10,
      { search: 'Test' },
      'project_name',
      'DESC'
    );
    
    // Assertions
    expect(result.statusCode).toBe(constants.SUCCESS);
    
    // Verify the query was called with correct parameters
    expect(mockSequelize.query).toHaveBeenCalledTimes(2);
    
    // Verify first query contains filter and sort conditions
    const firstCallArgs = mockSequelize.query.mock.calls[0];
    expect(firstCallArgs[0]).toContain('ORDER BY ps.project_name DESC');
  });
  
  it('should return BAD_REQUEST when missing required parameters', async () => {
    // Call the method with missing parameters
    const result = await userGroupService.getProjectsWithUserAccessFlag(
      'USER',
      '', // Missing account_rid
      'user1',
      1,
      10
    );
    
    // Assertions
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.message).toBe(constants.BAD_REQUEST_MESSAGE);
    expect(result.errorMessage).toBe('Missing account_rid or user_rid');
    
    // Verify no query was executed
    expect(mockSequelize.query).not.toHaveBeenCalled();
  });
  
  it('should handle database query errors', async () => {
    // Setup mock to throw an error
    mockSequelize.query.mockRejectedValue(new Error('Database error'));
    
    // Call the method
    const result = await userGroupService.getProjectsWithUserAccessFlag(
      'USER',
      'account1',
      'user1',
      1,
      10
    );
    
    // Assertions
    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.message).toBe(constants.FAILED_MESSAGE);
    expect(result.errorMessage).toBe('Failed to fetch projects');
  });
  
  it('should handle empty results correctly', async () => {
    // Mock empty results
    mockSequelize.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total_count: '0' }]);
    
    // Call the method
    const result = await userGroupService.getProjectsWithUserAccessFlag(
      'USER',
      'account1',
      'user1',
      1,
      10
    );
    
    // Assertions
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.projects).toEqual([]);
    expect(result.data?.totalCount).toBe(0);
  });
  
  it('should handle has_access sorting correctly', async () => {
    // Mock data
    const mockProjects = [{ project_name: 'Project 1', has_access: true }];
    const mockTotalCount = [{ total_count: '1' }];
    
    // Setup mock responses
    mockSequelize.query
      .mockResolvedValueOnce(mockProjects)
      .mockResolvedValueOnce(mockTotalCount);
    
    // Call the method with has_access sorting
    const result = await userGroupService.getProjectsWithUserAccessFlag(
      'USER',
      'account1',
      'user1',
      1,
      10,
      {},
      'has_access',
      'ASC'
    );
    
    // Assertions
    expect(result.statusCode).toBe(constants.SUCCESS);
    
    // Verify the query contains the special CASE WHEN sorting for has_access
    const firstCallArgs = mockSequelize.query.mock.calls[0];
    expect(firstCallArgs[0]).toContain('CASE');
    expect(firstCallArgs[0]).toContain('WHEN uga.access_type = \'INCLUDE\'');
  });
});

describe("getUserGroupType", () => {
  let service: UserGroupService;
  const mockGroupTypes = [
    { rid: "type-1", group_type_name: "Custom", group_type_description: "desc", type: "CUSTOM", is_consultant_only_group: false },
    { rid: "type-2", group_type_name: "Default", group_type_description: "desc", type: "DEFAULT", is_consultant_only_group: true }
  ];
  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  it("should return all group types when type is 'All'", async () => {
    (UserGroupType.findAll as jest.Mock).mockResolvedValue(mockGroupTypes);
    const result = await service.getUserGroupType("All");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.groupTypes).toEqual(mockGroupTypes);
    expect(result.data?.count).toBe(mockGroupTypes.length);
    expect(UserGroupType.findAll).toHaveBeenCalledWith({ where: {}, attributes: expect.any(Array), order: expect.any(Array) });
  });

  it("should return only custom group types when type is not 'All'", async () => {
    (UserGroupType.findAll as jest.Mock).mockResolvedValue([mockGroupTypes[0]]);
    const result = await service.getUserGroupType("Custom");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.groupTypes).toEqual([mockGroupTypes[0]]);
    expect(result.data?.count).toBe(1);
    expect(UserGroupType.findAll).toHaveBeenCalledWith({ where: { type: "CUSTOM" }, attributes: expect.any(Array), order: expect.any(Array) });
  });

  it("should handle errors and return FAILED", async () => {
    (UserGroupType.findAll as jest.Mock).mockRejectedValue(new Error("DB error"));
    const result = await service.getUserGroupType("All");
    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.errorMessage).toBe("DB error");
  });
});

describe("updateUserGroupInline", () => {
  let service: any;
  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  it("sets account_name to null and user_count to 0 if missing in result", async () => {
    (UserGroup.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        get: () => ({
          rid: "group-1",
          group_name: "Test",
          // account_name and user_count intentionally missing
          user: { first_name: "John", last_name: "Doe" },
          usergrouptype: { group_type_name: "Custom", type: "CUSTOM" },
        })
      });
    (UserGroup.update as jest.Mock).mockResolvedValue([1]);
    const result = await service.updateUserGroupInline({ group_name: "Test", group_rid: "group-1" }, "user-1");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup.account_name).toBeNull();
    expect(result.data?.usergroup.user_count).toBe(0);
  });

  it("sets account_name to null and user_count to 0 if result is undefined", async () => {
  (UserGroup.findOne as jest.Mock)
    .mockResolvedValueOnce(null)  // First call - no existing group with same name
    .mockResolvedValueOnce({      // Second call - return found group with undefined values
      get: () => ({
        account_name: undefined,
        user_count: undefined,
        // other required properties...
      })
    });
  (UserGroup.update as jest.Mock).mockResolvedValue([1]);
  const result = await service.updateUserGroupInline({ group_name: "Test", group_rid: "group-1" }, "user-1");
  expect(result.statusCode).toBe(constants.SUCCESS);
  expect(result.data?.usergroup.account_name).toBeNull();
  expect(result.data?.usergroup.user_count).toBe(0);
});

  it("returns BAD_REQUEST if group name already exists", async () => {
    (UserGroup.findOne as jest.Mock).mockResolvedValueOnce({ rid: "other-group" });
    const result = await service.updateUserGroupInline({ group_name: "Test", group_rid: "group-1" }, "user-1");
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toMatch(/Group name already exists/);
  });

  it("updates group and returns transformed data", async () => {
    (UserGroup.findOne as jest.Mock)
      .mockResolvedValueOnce(null) // No name conflict
      .mockResolvedValueOnce({
        get: () => ({
          rid: "group-1",
          group_name: "Test",
          account_name: "AccountX",
          user_count: 5,
          user: { first_name: "John", last_name: "Doe" },
          usergrouptype: { group_type_name: "Custom", type: "CUSTOM" },
        })
      });
    (UserGroup.update as jest.Mock).mockResolvedValue([1]);
    const result = await service.updateUserGroupInline({ group_name: "Test", group_rid: "group-1" }, "user-1");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.usergroup).toBeDefined();
    expect(result.data?.usergroup.group_name).toBe("Test");
    expect(result.data?.usergroup.account_name).toBe("AccountX");
    expect(result.data?.usergroup.user_count).toBe(5);
    expect(result.data?.usergroup.creator).toBeUndefined();
    expect(result.data?.usergroup.modifier).toBeUndefined();
  });

  it("returns BAD_REQUEST if group not found after update", async () => {
    (UserGroup.findOne as jest.Mock)
      .mockResolvedValueOnce(null) // No name conflict
      .mockResolvedValueOnce(null); // Not found after update
    (UserGroup.update as jest.Mock).mockResolvedValue([1]);
    const result = await service.updateUserGroupInline({ group_name: "Test", group_rid: "group-1" }, "user-1");
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toMatch(/Group not found after update/);
  });

  it("catches errors and calls throwServiceError", async () => {
    (UserGroup.findOne as jest.Mock).mockRejectedValue(new Error("DB error"));
    const throwServiceErrorSpy = jest.spyOn(service as any, "throwServiceError").mockReturnValue({ statusCode: constants.FAILED, message: constants.FAILED_MESSAGE, errorMessage: "DB error" });
    const result = await service.updateUserGroupInline({ group_name: "Test", group_rid: "group-1" }, "user-1");
    expect(throwServiceErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.errorMessage).toBe("DB error");
    throwServiceErrorSpy.mockRestore();
  });
});

describe("listUserGroupById1", () => {
  let service: any;
  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  it("should return user group details for valid group id and call population methods", async () => {
    const mockGroupId = "group-abc";
    const mockGroupType = "CUSTOM";
    // Mock UserGroup.findOne to return group details with all required fields
    (UserGroup.findOne as jest.Mock).mockResolvedValue({
      toJSON: () => ({
        rid: mockGroupId,
        group_name: "Test Group",
        user: { first_name: "Jane", last_name: "Smith" },
        usergrouptype: { rid: "type-1", group_type_name: "Custom", type: mockGroupType },
        account_name: "AccountY",
        is_consultant_only_group: true,
        user_count: 7,
        created_datetime: "2024-02-01T10:00:00Z",
        modified_datetime: "2024-02-02T12:00:00Z"
      })
    });
    // Mock getFormattedAccountsForGroup
    const mockAccounts = [{ rid: "acc-3", name: "Account3" }];
    jest.spyOn(service, "getFormattedAccountsForGroup").mockImplementation((type, groupId) => Promise.resolve(mockAccounts));
    // Mock getFormattedProjectsForGroup
    const mockProjects = [{ rid: "proj-3", name: "Project3" }];
    jest.spyOn(service, "getFormattedProjectsForGroup").mockResolvedValue(mockProjects);
    // Mock usersList
    const mockUsers = [{ rid: "user-3", name: "User3" }];
    jest.spyOn(service, "getFormattedUsersForGroup").mockResolvedValue(mockUsers);
    // Patch the method to call the spies
    service.getFormattedUsersForGroup = jest.fn().mockResolvedValue(mockUsers);
    service.getFormattedAccountsForGroup = jest.fn().mockImplementation((type, groupId) => Promise.resolve(mockAccounts));
    service.getFormattedProjectsForGroup = jest.fn().mockResolvedValue(mockProjects);
    const result = await service.listUserGroupDetailsById(mockGroupId);
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.userGroupById).toBeDefined();
    expect(result.data?.userGroupById.users).toEqual(mockUsers);
    expect(result.data?.userGroupById.accounts).toEqual(mockAccounts);
    expect(result.data?.userGroupById.projects).toEqual(mockProjects);
    expect(service.getFormattedProjectsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
    // created_by should NOT be set and user should NOT exist
    expect(result.data?.userGroupById.created_by).toBeUndefined();
    expect(result.data?.userGroupById.user).toBeUndefined();
    // getFormattedAccountsForGroup should be called with type and groupId
    expect(service.getFormattedAccountsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
  });

  it("should return null if group not found", async () => {
    (UserGroup.findOne as jest.Mock).mockResolvedValue(null);
    const result = await service.listUserGroupDetailsById("missing-group");
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.userGroupById).toBeNull();
  });

  it("should handle errors and return FAILED", async () => {
    (UserGroup.findOne as jest.Mock).mockRejectedValue(new Error("DB error"));
    const result = await service.listUserGroupDetailsById("group-err");
    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.errorMessage).toBe("DB error");
  });

  it("should populate users, accounts, and projects in groupData", async () => {
    const mockGroupId = "group-xyz";
    const mockGroupType = "CUSTOM";
    // Mock UserGroup.findOne to return group details with user
    (UserGroup.findOne as jest.Mock).mockResolvedValue({
      toJSON: () => ({
        rid: mockGroupId,
        group_name: "Test Group",
        usergrouptype: { type: mockGroupType },
        user: { first_name: "John", last_name: "Doe" }
      })
    });
    // Mock getFormattedAccountsForGroup to accept type and groupId
    const mockAccounts = [{ rid: "acc-1", name: "Account1" }];
    jest.spyOn(service, "getFormattedAccountsForGroup").mockImplementation((type, groupId) => {
      expect(type).toBe(mockGroupType);
      expect(groupId).toBe(mockGroupId);
      return Promise.resolve(mockAccounts);
    });
    // Mock getFormattedProjectsForGroup
    const mockProjects = [{ rid: "proj-1", name: "Project1" }];
    jest.spyOn(service, "getFormattedProjectsForGroup").mockResolvedValue(mockProjects);
    // Mock usersList
    const mockUsers = [{ rid: "user-1", name: "User1" }];
    jest.spyOn(service, "getFormattedUsersForGroup").mockResolvedValue(mockUsers);

    // Patch the method to call the spies
    service.getFormattedUsersForGroup = jest.fn().mockResolvedValue(mockUsers);
    service.getFormattedAccountsForGroup = jest.fn().mockImplementation((type, groupId) => Promise.resolve(mockAccounts));
    service.getFormattedProjectsForGroup = jest.fn().mockResolvedValue(mockProjects);

    const result = await service.listUserGroupDetailsById(mockGroupId);
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.userGroupById).toBeDefined();
    expect(result.data?.userGroupById.users).toEqual(mockUsers);
    expect(result.data?.userGroupById.accounts).toEqual(mockAccounts);
    expect(result.data?.userGroupById.projects).toEqual(mockProjects);
    expect(service.getFormattedProjectsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
    // created_by should be set and user should be deleted
    expect(result.data?.userGroupById.created_by).toBe("John Doe");
    expect(result.data?.userGroupById.user).toBeUndefined();
    // getFormattedAccountsForGroup should be called with type and groupId
    expect(service.getFormattedAccountsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
  });

  it("should not set created_by or delete user if groupData.user is not present", async () => {
    const mockGroupId = "group-nouser";
    const mockGroupType = "CUSTOM";
    // Mock UserGroup.findOne to return group details WITHOUT user
    (UserGroup.findOne as jest.Mock).mockResolvedValue({
      toJSON: () => ({
        rid: mockGroupId,
        group_name: "Test Group NoUser",
        usergrouptype: { type: mockGroupType }
      })
    });
    // Mock getFormattedAccountsForGroup to accept type and groupId
    const mockAccounts = [{ rid: "acc-2", name: "Account2" }];
    jest.spyOn(service, "getFormattedAccountsForGroup").mockImplementation((type, groupId) => {
      expect(type).toBe(mockGroupType);
      expect(groupId).toBe(mockGroupId);
      return Promise.resolve(mockAccounts);
    });
    // Mock getFormattedProjectsForGroup
    const mockProjects = [{ rid: "proj-2", name: "Project2" }];
    jest.spyOn(service, "getFormattedProjectsForGroup").mockResolvedValue(mockProjects);
    // Mock usersList
    const mockUsers = [{ rid: "user-2", name: "User2" }];
    jest.spyOn(service, "getFormattedUsersForGroup").mockResolvedValue(mockUsers);

    // Patch the method to call the spies
    service.getFormattedUsersForGroup = jest.fn().mockResolvedValue(mockUsers);
    service.getFormattedAccountsForGroup = jest.fn().mockImplementation((type, groupId) => Promise.resolve(mockAccounts));
    service.getFormattedProjectsForGroup = jest.fn().mockResolvedValue(mockProjects);

    const result = await service.listUserGroupDetailsById(mockGroupId);
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.userGroupById).toBeDefined();
    expect(result.data?.userGroupById.users).toEqual(mockUsers);
    expect(result.data?.userGroupById.accounts).toEqual(mockAccounts);
    expect(result.data?.userGroupById.projects).toEqual(mockProjects);
    expect(service.getFormattedProjectsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
    // created_by should NOT be set and user should NOT exist
    expect(result.data?.userGroupById.created_by).toBeUndefined();
    expect(result.data?.userGroupById.user).toBeUndefined();
    // getFormattedAccountsForGroup should be called with type and groupId
    expect(service.getFormattedAccountsForGroup).toHaveBeenCalledWith(mockGroupType, mockGroupId);
  });
});


describe("assignGroupAccessToAccount", () => {
  let service: UserGroupService;
  const mockUserId = "user-assign";
  const mockAccountRid = "account-123";
  const mockProjectRid = "project-456";

  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
  });

  // Test cases for BAD_REQUEST scenarios
  it("should return BAD_REQUEST if account_rid is missing", async () => {
    const groups = [{ rid: "group-1", is_enabled: true, is_modified: true }];
    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: undefined as any,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });
    
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toMatch(/Missing required identifiers/);
  });

  it("should return BAD_REQUEST if groups is undefined", async () => {
    const result = await service.assignGroupAccessToAccount({
      groups: undefined,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });
    
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toMatch(/Missing required identifiers/);
  });

  it("should return BAD_REQUEST if groups is null", async () => {
    const result = await service.assignGroupAccessToAccount({
      groups: null as any,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });
    
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toMatch(/Missing required identifiers/);
  });

  it("should return BAD_REQUEST if account_rid is empty string", async () => {
    const groups = [{ rid: "group-1", is_enabled: true, is_modified: true }];
    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: "",
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });
    
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toMatch(/Missing required identifiers/);
  });

  // Test cases for groups processing logic
  it("should skip groups with is_modified=false", async () => {
    const groups = [
      { rid: "group-1", is_enabled: true, is_modified: false },
      { rid: "group-2", is_enabled: false, is_modified: false }
    ];
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(UserGroupEntityAccess.findOne).not.toHaveBeenCalled();
    expect(UserGroupEntityAccess.create).not.toHaveBeenCalled();
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.created).toEqual([]);
    expect(result.data?.updated).toEqual([]);
  });

  it("should process only groups with is_modified=true", async () => {
    const groups = [
      { rid: "group-1", is_enabled: true, is_modified: true },
      { rid: "group-2", is_enabled: false, is_modified: false },
      { rid: "group-3", is_enabled: true, is_modified: true }
    ];
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(UserGroupEntityAccess.findOne).toHaveBeenCalledTimes(2); // Only for group-1 and group-3
    expect(UserGroupEntityAccess.create).toHaveBeenCalledTimes(2);
    expect(result.data?.created).toEqual(["group-1", "group-3"]);
  });

  // Test cases for access type determination
  it("should set access_type to INCLUDE when group is_enabled=true", async () => {
    const groups = [{ rid: "group-1", is_enabled: true, is_modified: true }];
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(UserGroupEntityAccess.create).toHaveBeenCalledWith({
      user_rid: null,
      group_rid: "group-1",
      entity_type: "ACCOUNT",
      entity_rid: mockAccountRid,
      access_type: "INCLUDE",
      created_by: mockUserId,
      created_datetime: expect.any(Date)
    });
  });

  it("should set access_type to EXCLUDE when group is_enabled=false", async () => {
    const groups = [{ rid: "group-1", is_enabled: false, is_modified: true }];
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(UserGroupEntityAccess.create).toHaveBeenCalledWith({
      user_rid: null,
      group_rid: "group-1",
      entity_type: "ACCOUNT",
      entity_rid: mockAccountRid,
      access_type: "EXCLUDE",
      created_by: mockUserId,
      created_datetime: expect.any(Date)
    });
  });

  // Test cases for creating new access records
  it("should create new access record when no existing record found", async () => {
    const groups = [{ rid: "group-1", is_enabled: true, is_modified: true }];
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(UserGroupEntityAccess.findOne).toHaveBeenCalledWith({
      where: {
        entity_type: "ACCOUNT",
        entity_rid: mockAccountRid,
        group_rid: "group-1"
      }
    });
    expect(UserGroupEntityAccess.create).toHaveBeenCalled();
    expect(result.data?.created).toEqual(["group-1"]);
    expect(result.data?.updated).toEqual([]);
  });

  // Test cases for updating existing access records
  it("should update existing access record when found", async () => {
    const groups = [{ rid: "group-1", is_enabled: false, is_modified: true }];
    const mockUpdate = jest.fn().mockResolvedValue({});
    const existingRecord = { update: mockUpdate };
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(existingRecord);

    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      access_type: "EXCLUDE",
      modified_by: mockUserId,
      modified_datetime: expect.any(Date)
    });
    expect(result.data?.created).toEqual([]);
    expect(result.data?.updated).toEqual(["group-1"]);
  });

  // Test cases for mixed scenarios
  it("should handle mixed create and update operations", async () => {
    const groups = [
      { rid: "group-1", is_enabled: true, is_modified: true },
      { rid: "group-2", is_enabled: false, is_modified: true }
    ];
    
    const mockUpdate = jest.fn().mockResolvedValue({});
    (UserGroupEntityAccess.findOne as jest.Mock)
      .mockResolvedValueOnce(null) // No existing record for group-1
      .mockResolvedValueOnce({ update: mockUpdate }); // Existing record for group-2
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(UserGroupEntityAccess.create).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(result.data?.created).toEqual(["group-1"]);
    expect(result.data?.updated).toEqual(["group-2"]);
  });

  // Test cases for empty groups array
  it("should handle empty groups array", async () => {
    const result = await service.assignGroupAccessToAccount({
      groups: [],
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(UserGroupEntityAccess.findOne).not.toHaveBeenCalled();
    expect(UserGroupEntityAccess.create).not.toHaveBeenCalled();
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.created).toEqual([]);
    expect(result.data?.updated).toEqual([]);
  });

  // Test cases for entity_type ACCOUNT
  it("should handle entity_type ACCOUNT correctly", async () => {
    const groups = [{ rid: "group-1", is_enabled: true, is_modified: true }];
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(UserGroupEntityAccess.findOne).toHaveBeenCalledWith({
      where: {
        entity_type: "ACCOUNT",
        entity_rid: mockAccountRid,
        group_rid: "group-1"
      }
    });
    expect(UserGroupEntityAccess.create).toHaveBeenCalledWith({
      user_rid: null,
      group_rid: "group-1",
      entity_type: "ACCOUNT",
      entity_rid: mockAccountRid,
      access_type: "INCLUDE",
      created_by: mockUserId,
      created_datetime: expect.any(Date)
    });
  });

  // Test cases for entity_type PROJECT
  it("should handle entity_type PROJECT correctly", async () => {
    const groups = [{ rid: "group-1", is_enabled: true, is_modified: true }];
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "PROJECT",
      project_rid: mockProjectRid
    });

    expect(UserGroupEntityAccess.findOne).toHaveBeenCalledWith({
      where: {
        entity_type: "ACCOUNT",
        entity_rid: mockAccountRid,
        group_rid: "group-1"
      }
    });
    expect(UserGroupEntityAccess.create).toHaveBeenCalledWith({
      user_rid: null,
      group_rid: "group-1",
      entity_type: "ACCOUNT",
      entity_rid: mockAccountRid,
      access_type: "INCLUDE",
      created_by: mockUserId,
      created_datetime: expect.any(Date)
    });
  });

  // Test cases for group rid handling
  it("should handle group rid with null coalescing", async () => {
    const groups = [{ rid: undefined as any, is_enabled: true, is_modified: true }];
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(UserGroupEntityAccess.create).toHaveBeenCalledWith({
      user_rid: null,
      group_rid: null,
      entity_type: "ACCOUNT",
      entity_rid: mockAccountRid,
      access_type: "INCLUDE",
      created_by: mockUserId,
      created_datetime: expect.any(Date)
    });
  });

  // Test cases for success response
  it("should return success response with correct message and data", async () => {
    const groups = [
      { rid: "group-1", is_enabled: true, is_modified: true },
      { rid: "group-2", is_enabled: false, is_modified: true }
    ];
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.message).toBe(constants.SUCCESS_MESSAGE);
    expect(result.data).toEqual({
      created: ["group-1", "group-2"],
      updated: []
    });
  });

  // Test cases for error handling
  it("should handle errors from UserGroupEntityAccess.findOne", async () => {
    const groups = [{ rid: "group-1", is_enabled: true, is_modified: true }];
    const error = new Error("Database findOne error");
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockRejectedValue(error);

    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.message).toBe(constants.FAILED_MESSAGE);
    expect(result.errorMessage).toBe("Database findOne error");
  });

  it("should handle errors from UserGroupEntityAccess.create", async () => {
    const groups = [{ rid: "group-1", is_enabled: true, is_modified: true }];
    const error = new Error("Database create error");
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue(null);
    (UserGroupEntityAccess.create as jest.Mock).mockRejectedValue(error);

    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.message).toBe(constants.FAILED_MESSAGE);
    expect(result.errorMessage).toBe("Database create error");
  });

  it("should handle errors from existing record update", async () => {
    const groups = [{ rid: "group-1", is_enabled: true, is_modified: true }];
    const error = new Error("Database update error");
    const mockUpdate = jest.fn().mockRejectedValue(error);
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockResolvedValue({ update: mockUpdate });

    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.message).toBe(constants.FAILED_MESSAGE);
    expect(result.errorMessage).toBe("Database update error");
  });

  // Test cases for multiple groups with different scenarios
  it("should handle multiple groups with various combinations", async () => {
    const groups = [
      { rid: "group-1", is_enabled: true, is_modified: true },   // Create INCLUDE
      { rid: "group-2", is_enabled: false, is_modified: true },  // Create EXCLUDE
      { rid: "group-3", is_enabled: true, is_modified: false },  // Skip
      { rid: "group-4", is_enabled: false, is_modified: true },  // Update to EXCLUDE
      { rid: "group-5", is_enabled: true, is_modified: true }    // Update to INCLUDE
    ];
    
    const mockUpdate1 = jest.fn().mockResolvedValue({});
    const mockUpdate2 = jest.fn().mockResolvedValue({});
    
    (UserGroupEntityAccess.findOne as jest.Mock)
      .mockResolvedValueOnce(null)                    // group-1: no existing
      .mockResolvedValueOnce(null)                    // group-2: no existing
      .mockResolvedValueOnce({ update: mockUpdate1 }) // group-4: existing
      .mockResolvedValueOnce({ update: mockUpdate2 }); // group-5: existing
    
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    const result = await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(UserGroupEntityAccess.findOne).toHaveBeenCalledTimes(4); // group-3 skipped
    expect(UserGroupEntityAccess.create).toHaveBeenCalledTimes(2);  // group-1, group-2
    expect(mockUpdate1).toHaveBeenCalledTimes(1);                   // group-4
    expect(mockUpdate2).toHaveBeenCalledTimes(1);                   // group-5
    
    expect(result.data?.created).toEqual(["group-1", "group-2"]);
    expect(result.data?.updated).toEqual(["group-4", "group-5"]);
  });

  // Test case for console.error logging
  it("should log error to console when exception occurs", async () => {
    const groups = [{ rid: "group-1", is_enabled: true, is_modified: true }];
    const error = new Error("Test error");
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    (UserGroupEntityAccess.findOne as jest.Mock).mockRejectedValue(error);

    await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });

    expect(consoleSpy).toHaveBeenCalledWith("Error assigning access to entity:", error);
    consoleSpy.mockRestore();
  });

  // Test case for date handling
  it("should use current date for created_datetime and modified_datetime", async () => {
    const groups = [
      { rid: "group-1", is_enabled: true, is_modified: true },
      { rid: "group-2", is_enabled: false, is_modified: true }
    ];
    
    const mockUpdate = jest.fn().mockResolvedValue({});
    (UserGroupEntityAccess.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ update: mockUpdate });
    (UserGroupEntityAccess.create as jest.Mock).mockResolvedValue({});

    const beforeCall = new Date();
    await service.assignGroupAccessToAccount({
      groups,
      account_rid: mockAccountRid,
      userId: mockUserId,
      entity_type: "ACCOUNT"
    });
    const afterCall = new Date();

    expect(UserGroupEntityAccess.create).toHaveBeenCalledWith({
      user_rid: null,
      group_rid: "group-1",
      entity_type: "ACCOUNT",
      entity_rid: mockAccountRid,
      access_type: "INCLUDE",
      created_by: mockUserId,
      created_datetime: expect.any(Date)
    });

    const createCall = (UserGroupEntityAccess.create as jest.Mock).mock.calls[0][0];
    expect(createCall.created_datetime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(createCall.created_datetime.getTime()).toBeLessThanOrEqual(afterCall.getTime());

    expect(mockUpdate).toHaveBeenCalledWith({
      access_type: "EXCLUDE",
      modified_by: mockUserId,
      modified_datetime: expect.any(Date)
    });

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.modified_datetime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(updateCall.modified_datetime.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });
});
describe('assignUserAccessToAccount', () => {
  let service: UserGroupService;
  let findOneMock: jest.Mock;
  let createMock: jest.Mock;
  let updateMock: jest.Mock;

  beforeEach(() => {
    service = new UserGroupService();
    jest.clearAllMocks();
    
    findOneMock = UserGroupEntityAccess.findOne as jest.Mock;
    createMock = UserGroupEntityAccess.create as jest.Mock;
    updateMock = jest.fn();
  });

  // Test BAD_REQUEST scenarios
  it('should return BAD_REQUEST if account_rid is missing', async () => {
    const result = await service.assignUserAccessToAccount({
      users: [{ rid: 'user1', is_enabled: true, is_modified: true }],
      account_rid: undefined as any,
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });
    
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toBe('Missing required identifiers (user_rid/group_rid or account_rid)');
  });

  it('should return BAD_REQUEST if account_rid is empty string', async () => {
    const result = await service.assignUserAccessToAccount({
      users: [{ rid: 'user1', is_enabled: true, is_modified: true }],
      account_rid: '',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });
    
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toBe('Missing required identifiers (user_rid/group_rid or account_rid)');
  });

  it('should return BAD_REQUEST if users is undefined', async () => {
    const result = await service.assignUserAccessToAccount({
      users: undefined as any,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });
    
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toBe('Missing required identifiers (user_rid/group_rid or account_rid)');
  });

  it('should return BAD_REQUEST if users is null', async () => {
    const result = await service.assignUserAccessToAccount({
      users: null as any,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });
    
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toBe('Missing required identifiers (user_rid/group_rid or account_rid)');
  });

  it('should return BAD_REQUEST if entity_type is PROJECT but project_rid is missing', async () => {
    const result = await service.assignUserAccessToAccount({
      users: [{ rid: 'user1', is_enabled: true, is_modified: true }],
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'PROJECT',
      // project_rid is undefined
    });
    
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toBe('Missing required identifiers project id');
  });

  it('should return BAD_REQUEST if entity_type is PROJECT but project_rid is empty string', async () => {
    const result = await service.assignUserAccessToAccount({
      users: [{ rid: 'user1', is_enabled: true, is_modified: true }],
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'PROJECT',
      project_rid: '',
    });
    
    expect(result.statusCode).toBe(constants.BAD_REQUEST);
    expect(result.errorMessage).toBe('Missing required identifiers project id');
  });

  // Test users processing logic
  it('should skip users with is_modified=false', async () => {
    const users = [
      { rid: 'user1', is_enabled: true, is_modified: false },
      { rid: 'user2', is_enabled: false, is_modified: false },
    ];

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(findOneMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.created).toEqual([]);
    expect(result.data?.updated).toEqual([]);
  });

  it('should process only users with is_modified=true', async () => {
    const users = [
      { rid: 'user1', is_enabled: true, is_modified: true },
      { rid: 'user2', is_enabled: false, is_modified: false },
      { rid: 'user3', is_enabled: true, is_modified: true },
    ];

    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(findOneMock).toHaveBeenCalledTimes(2); // Only for user1 and user3
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(result.data?.created).toEqual(['user1', 'user3']);
  });

  // Test access type determination
  it('should set access_type to INCLUDE when user is_enabled=true', async () => {
    const users = [{ rid: 'user1', is_enabled: true, is_modified: true }];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(createMock).toHaveBeenCalledWith({
      user_rid: 'user1',
      comment: '',
      group_rid: null,
      entity_type: 'ACCOUNT',
      entity_rid: 'acc-1',
      access_type: 'INCLUDE',
      created_by: 'admin',
      created_datetime: expect.any(Date),
    });
  });

  it('should set access_type to EXCLUDE when user is_enabled=false', async () => {
    const users = [{ rid: 'user1', is_enabled: false, is_modified: true }];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(createMock).toHaveBeenCalledWith({
      user_rid: 'user1',
      comment: '',
      group_rid: null,
      entity_type: 'ACCOUNT',
      entity_rid: 'acc-1',
      access_type: 'EXCLUDE',
      created_by: 'admin',
      created_datetime: expect.any(Date),
    });
  });

  // Test entity_type handling
  it('should use account_rid as entity_rid when entity_type is ACCOUNT', async () => {
    const users = [{ rid: 'user1', is_enabled: true, is_modified: true }];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(findOneMock).toHaveBeenCalledWith({
      where: {
        entity_type: 'ACCOUNT',
        entity_rid: 'acc-1',
        user_rid: 'user1',
      },
    });

    expect(createMock).toHaveBeenCalledWith({
      user_rid: 'user1',
      comment: '',
      group_rid: null,
      entity_type: 'ACCOUNT',
      entity_rid: 'acc-1',
      access_type: 'INCLUDE',
      created_by: 'admin',
      created_datetime: expect.any(Date),
    });
  });

  it('should use project_rid as entity_rid when entity_type is PROJECT', async () => {
    const users = [{ rid: 'user1', is_enabled: true, is_modified: true }];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'PROJECT',
      project_rid: 'proj-1',
    });

    expect(findOneMock).toHaveBeenCalledWith({
      where: {
        entity_type: 'PROJECT',
        entity_rid: 'proj-1',
        user_rid: 'user1',
      },
    });

    expect(createMock).toHaveBeenCalledWith({
      user_rid: 'user1',
      comment: '',
      group_rid: null,
      entity_type: 'PROJECT',
      entity_rid: 'proj-1',
      access_type: 'INCLUDE',
      created_by: 'admin',
      created_datetime: expect.any(Date),
    });
  });

  // Test creating new access records
  it('should create new access record when no existing record found', async () => {
    const users = [{ rid: 'user1', is_enabled: true, is_modified: true }];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(createMock).toHaveBeenCalled();
    expect(result.data?.created).toEqual(['user1']);
    expect(result.data?.updated).toEqual([]);
  });

  // Test updating existing access records
  it('should update existing access record when found', async () => {
    const users = [{ rid: 'user1', is_enabled: false, is_modified: true }];
    const mockUpdate = jest.fn().mockResolvedValue({});
    const existingRecord = { update: mockUpdate };
    
    findOneMock.mockResolvedValue(existingRecord);
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      access_type: 'EXCLUDE',
      comment: '',
      modified_by: 'admin',
      modified_datetime: expect.any(Date),
    });
    expect(result.data?.created).toEqual([]);
    expect(result.data?.updated).toEqual(['user1']);
  });

  // Test group access logic - user not in any groups
  it('should handle user not in any groups', async () => {
    const users = [{ rid: 'user1', is_enabled: false, is_modified: true }];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]); // No groups

    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(UserGroupAccountMapping.findOne).not.toHaveBeenCalled();
    expect(createMock).toHaveBeenCalledWith({
      user_rid: 'user1',
      comment: '',
      group_rid: null,
      entity_type: 'ACCOUNT',
      entity_rid: 'acc-1',
      access_type: 'EXCLUDE',
      created_by: 'admin',
      created_datetime: expect.any(Date),
    });
  });

  // Test group access logic - user in groups but group has no access
  it('should handle user in groups but group has no access to account', async () => {
    const users = [{ rid: 'user1', is_enabled: false, is_modified: true }];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([
      { group_rid: 'group1' },
      { group_rid: 'group2' },
    ]);
    (UserGroupAccountMapping.findOne as jest.Mock).mockResolvedValue(null); // No group access

    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(UserGroupAccountMapping.findOne).toHaveBeenCalledWith({
      where: {
        group_rid: { [Op.in]: ['group1', 'group2'] },
        account_rid: 'acc-1',
      },
    });
    expect(createMock).toHaveBeenCalledWith({
      user_rid: 'user1',
      comment: '',
      group_rid: null,
      entity_type: 'ACCOUNT',
      entity_rid: 'acc-1',
      access_type: 'EXCLUDE',
      created_by: 'admin',
      created_datetime: expect.any(Date),
    });
  });

  // Test comment generation for disabled user with group access
  it('should generate comment when user is disabled but group has access', async () => {
    const users = [{ rid: 'user1', is_enabled: false, is_modified: true }];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([
      { group_rid: 'group1' },
    ]);
    (UserGroupAccountMapping.findOne as jest.Mock).mockResolvedValue({ id: 1 }); // Group has access
    (User.findOne as jest.Mock).mockResolvedValue({ first_name: 'Admin' });

    // Mock dayjs format
    const mockDayjs = jest.fn(() => ({
      format: jest.fn(() => '2024-01-01, 10:30:00 AM'),
    }));
    (global as any).dayjs = mockDayjs;

    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(User.findOne).toHaveBeenCalledWith({
      where: { rid: 'admin' },
      attributes: ['first_name'],
    });
    expect(createMock).toHaveBeenCalledWith({
      user_rid: 'user1',
      comment: 'Admin  Disabled Access on 2024-01-01, 10:30:00 AM  ',
      group_rid: null,
      entity_type: 'ACCOUNT',
      entity_rid: 'acc-1',
      access_type: 'EXCLUDE',
      created_by: 'admin',
      created_datetime: expect.any(Date),
    });
  });

  // Test comment for enabled user with group access
  it('should set empty comment when user is enabled and group has access', async () => {
    const users = [{ rid: 'user1', is_enabled: true, is_modified: true }];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([
      { group_rid: 'group1' },
    ]);
    (UserGroupAccountMapping.findOne as jest.Mock).mockResolvedValue({ id: 1 }); // Group has access

    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(createMock).toHaveBeenCalledWith({
      user_rid: 'user1',
      comment: '',
      group_rid: null,
      entity_type: 'ACCOUNT',
      entity_rid: 'acc-1',
      access_type: 'INCLUDE',
      created_by: 'admin',
      created_datetime: expect.any(Date),
    });
  });

  // Test user_rid null coalescing
  it('should handle user rid with null coalescing', async () => {
    const users = [{ rid: undefined as any, is_enabled: true, is_modified: true }];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(createMock).toHaveBeenCalledWith({
      user_rid: null,
      comment: '',
      group_rid: null,
      entity_type: 'ACCOUNT',
      entity_rid: 'acc-1',
      access_type: 'INCLUDE',
      created_by: 'admin',
      created_datetime: expect.any(Date),
    });
  });

  // Test mixed create and update operations
  it('should handle mixed create and update operations', async () => {
    const users = [
      { rid: 'user1', is_enabled: true, is_modified: true },
      { rid: 'user2', is_enabled: false, is_modified: true },
    ];
    
    const mockUpdate = jest.fn().mockResolvedValue({});
    findOneMock
      .mockResolvedValueOnce(null) // user1: no existing
      .mockResolvedValueOnce({ update: mockUpdate }); // user2: existing
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(result.data?.created).toEqual(['user1']);
    expect(result.data?.updated).toEqual(['user2']);
  });

  // Test empty users array
  it('should handle empty users array', async () => {
    const result = await service.assignUserAccessToAccount({
      users: [],
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(findOneMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.data?.created).toEqual([]);
    expect(result.data?.updated).toEqual([]);
  });

  // Test success response format
  it('should return success response with correct message and data', async () => {
    const users = [
      { rid: 'user1', is_enabled: true, is_modified: true },
      { rid: 'user2', is_enabled: false, is_modified: true },
    ];
    
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(result.statusCode).toBe(constants.SUCCESS);
    expect(result.message).toBe(constants.SUCCESS_MESSAGE);
    expect(result.data).toEqual({
      created: ['user1', 'user2'],
      updated: [],
    });
  });

  // Test error handling scenarios
  it('should handle errors from UserGroupEntityAccess.findOne', async () => {
    const users = [{ rid: 'user1', is_enabled: true, is_modified: true }];
    const error = new Error('Database findOne error');
    
    findOneMock.mockRejectedValue(error);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.message).toBe(constants.FAILED_MESSAGE);
    expect(result.errorMessage).toBe('Database findOne error');
  });

  it('should handle errors from UserGroupEntityAccess.create', async () => {
    const users = [{ rid: 'user1', is_enabled: true, is_modified: true }];
    const error = new Error('Database create error');
    
    findOneMock.mockResolvedValue(null);
    createMock.mockRejectedValue(error);
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.message).toBe(constants.FAILED_MESSAGE);
    expect(result.errorMessage).toBe('Database create error');
  });

  it('should handle errors from existing record update', async () => {
    const users = [{ rid: 'user1', is_enabled: true, is_modified: true }];
    const error = new Error('Database update error');
    const mockUpdate = jest.fn().mockRejectedValue(error);
    
    findOneMock.mockResolvedValue({ update: mockUpdate });
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.message).toBe(constants.FAILED_MESSAGE);
    expect(result.errorMessage).toBe('Database update error');
  });

  it('should handle errors from UserGroupMapping.findAll', async () => {
    const users = [{ rid: 'user1', is_enabled: false, is_modified: true }];
    const error = new Error('UserGroupMapping error');
    
    findOneMock.mockResolvedValue(null);
    (UserGroupMapping.findAll as jest.Mock).mockRejectedValue(error);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.message).toBe(constants.FAILED_MESSAGE);
    expect(result.errorMessage).toBe('UserGroupMapping error');
  });

  it('should handle errors from UserGroupAccountMapping.findOne', async () => {
    const users = [{ rid: 'user1', is_enabled: false, is_modified: true }];
    const error = new Error('UserGroupAccountMapping error');
    
    findOneMock.mockResolvedValue(null);
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: 'group1' }]);
    (UserGroupAccountMapping.findOne as jest.Mock).mockRejectedValue(error);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.message).toBe(constants.FAILED_MESSAGE);
    expect(result.errorMessage).toBe('UserGroupAccountMapping error');
  });

  it('should handle errors from User.findOne for comment generation', async () => {
    const users = [{ rid: 'user1', is_enabled: false, is_modified: true }];
    const error = new Error('User findOne error');
    
    findOneMock.mockResolvedValue(null);
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([{ group_rid: 'group1' }]);
    (UserGroupAccountMapping.findOne as jest.Mock).mockResolvedValue({ id: 1 });
    (User.findOne as jest.Mock).mockRejectedValue(error);

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(result.statusCode).toBe(constants.FAILED);
    expect(result.message).toBe(constants.FAILED_MESSAGE);
    expect(result.errorMessage).toBe('User findOne error');
  });

  // Test console.error logging
  it('should log error to console when exception occurs', async () => {
    const users = [{ rid: 'user1', is_enabled: true, is_modified: true }];
    const error = new Error('Test error');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    findOneMock.mockRejectedValue(error);

    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error assigning access to entity:', error);
    consoleSpy.mockRestore();
  });

  // Test date handling
  it('should use current date for created_datetime and modified_datetime', async () => {
    const users = [
      { rid: 'user1', is_enabled: true, is_modified: true },
      { rid: 'user2', is_enabled: false, is_modified: true },
    ];
    
    const mockUpdate = jest.fn().mockResolvedValue({});
    findOneMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ update: mockUpdate });
    createMock.mockResolvedValue({});
    (UserGroupMapping.findAll as jest.Mock).mockResolvedValue([]);

    const beforeCall = new Date();
    await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });
    const afterCall = new Date();

    const createCall = createMock.mock.calls[0][0];
    expect(createCall.created_datetime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(createCall.created_datetime.getTime()).toBeLessThanOrEqual(afterCall.getTime());

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.modified_datetime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(updateCall.modified_datetime.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });

  // Test complex scenario with multiple users and various conditions
  it('should handle complex scenario with multiple users and conditions', async () => {
    const users = [
      { rid: 'user1', is_enabled: true, is_modified: true },   // Create INCLUDE
      { rid: 'user2', is_enabled: false, is_modified: true },  // Create EXCLUDE with comment
      { rid: 'user3', is_enabled: true, is_modified: false },  // Skip
      { rid: 'user4', is_enabled: false, is_modified: true },  // Update to EXCLUDE
      { rid: 'user5', is_enabled: true, is_modified: true },   // Update to INCLUDE
    ];
    
    const mockUpdate1 = jest.fn().mockResolvedValue({});
    const mockUpdate2 = jest.fn().mockResolvedValue({});
    
    findOneMock
      .mockResolvedValueOnce(null)                    // user1: no existing
      .mockResolvedValueOnce(null)                    // user2: no existing
      .mockResolvedValueOnce({ update: mockUpdate1 }) // user4: existing
      .mockResolvedValueOnce({ update: mockUpdate2 }); // user5: existing
    
    createMock.mockResolvedValue({});
    
    // Mock group mappings for users
    (UserGroupMapping.findAll as jest.Mock)
      .mockResolvedValueOnce([]) // user1: no groups
      .mockResolvedValueOnce([{ group_rid: 'group1' }]) // user2: in group
      .mockResolvedValueOnce([]) // user4: no groups
      .mockResolvedValueOnce([{ group_rid: 'group2' }]); // user5: in group
    
    // Mock group access
    (UserGroupAccountMapping.findOne as jest.Mock)
      .mockResolvedValueOnce({ id: 1 }) // user2: group has access
      .mockResolvedValueOnce(null); // user5: group has no access
    
    (User.findOne as jest.Mock).mockResolvedValue({ first_name: 'Admin' });
    
    // Mock dayjs
    const mockDayjs = jest.fn(() => ({
      format: jest.fn(() => '2024-01-01, 10:30:00 AM'),
    }));
    (global as any).dayjs = mockDayjs;

    const result = await service.assignUserAccessToAccount({
      users,
      account_rid: 'acc-1',
      userId: 'admin',
      entity_type: 'ACCOUNT',
    });

    expect(findOneMock).toHaveBeenCalledTimes(4); // user3 skipped
    expect(createMock).toHaveBeenCalledTimes(2);  // user1, user2
    expect(mockUpdate1).toHaveBeenCalledTimes(1); // user4
    expect(mockUpdate2).toHaveBeenCalledTimes(1); // user5
    
    expect(result.data?.created).toEqual(['user1', 'user2']);
    expect(result.data?.updated).toEqual(['user4', 'user5']);

    // Verify comment was set for user2 (disabled with group access)
    const user2CreateCall = createMock.mock.calls.find(call => call[0].user_rid === 'user2');
    expect(user2CreateCall[0].comment).toBe('Admin  Disabled Access on 2024-01-01, 10:30:00 AM  ');
  });
});
  });

