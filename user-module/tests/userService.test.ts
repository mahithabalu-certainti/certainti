import UserService from "../src/services/userService";
import { constants } from "../src/utils/constant";
import { User, BusinessTeams, Profile } from "../src/models";
import { UserDetails } from "../src/models/userDetailsModel";
import { Op } from "sequelize";

interface WhereClause {
  [Op.and]?: any[];
  [Op.or]?: any[];
  [key: string]: any;
}

jest.mock("../src/models/userModel", () => ({
  User: {
    belongsTo: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock("../src/models/userDetailsModel", () => ({
  UserDetails: {
    belongsTo: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("../src/models/businessTeamModel", () => ({
  BusinessTeams: {
    findAll: jest.fn(),
  },
}));

jest.mock("../src/models/profileModel", () => ({
  Profile: {
    findAll: jest.fn(),
  },
}));

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe("getAccountRepository", () => {
    it("should return the User model", () => {
      const repository = userService.getAccountRepository();
      expect(repository).toBe(User);
    });

    it("should return the same instance if already initialized", () => {
      const firstCall = userService.getAccountRepository();
      const secondCall = userService.getAccountRepository();
      expect(firstCall).toBe(secondCall);
    });
  });

  describe("createUser", () => {
    it("should successfully create a user", async () => {
      const mockUserData = {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        street: "123 Main St",
        city: "ABC city",
        state: "3",
        zip_code: "10001",
        country: 4,
        role: "1",
        profile_id: "2",
        status: "active",
        organization: "PF2.0",
        updated_by: "Admin",
        user_name: "john",
        created_by: "ADMIN",
      };

      const mockAzureId = "azure-123";

      (User.create as jest.Mock).mockResolvedValueOnce(mockUserData);

      const result = await userService.createUser(mockUserData, mockAzureId);

      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.message).toBe(constants.SUCCESS_MESSAGE);
      expect(result.data?.user).toEqual(mockUserData);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          azure_id: mockAzureId,
          first_name: mockUserData.first_name,
          last_name: mockUserData.last_name,
          full_name: mockUserData.first_name + " " + mockUserData.last_name,
          email: mockUserData.email,
          profile_rid: mockUserData.profile_id,
          status: mockUserData.status,
          street: mockUserData.street,
          city: mockUserData.city,
          state: mockUserData.state,
          zip_code: mockUserData.zip_code,
          country: mockUserData.country,
          role_rid: mockUserData.role,
          middle_name: undefined,
          created_by: "ADMIN",
        })
      );
    });

    it("should return an error if user creation fails", async () => {
      const mockUserData = {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        profile: "1",
        street: "123 Main St",
        city: "ABC city",
        state: "2",
        zip_code: "10001",
        country: 4,
        role: "1",
        profile_id: "2",
        status: "active",
        organization: "PF2.0",
        updated_by: "Admin",
        created_by: "ADMIN",
      };
      const mockAzureId = "azure-123";

      (User.create as jest.Mock).mockRejectedValueOnce(
        new Error("User creation failed")
      );

      const result = await userService.createUser(mockUserData, mockAzureId);

      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.message).toBe(constants.FAILED_MESSAGE);
    });
  });

  describe("updateUser", () => {
    it("should successfully update a user", async () => {
      const mockUserData = {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        profile: "1",
        street: "123 Main St",
        city: "ABC city",
        state: "2",
        zip_code: "10001",
        country: 4,
        role: "1",
        profile_id: "2",
        status: "active",
        organization: "PF2.0",
        updated_by: "Admin",
        created_by: "ADMIN",
      };
      const mockUserId = "1";
      const mockExistingUser = { rid: mockUserId };

      (User.findOne as jest.Mock).mockResolvedValueOnce(mockExistingUser);
      (User.update as jest.Mock).mockResolvedValueOnce([1]);

      const result = await userService.updateUser(mockUserData, mockUserId);

      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.message).toBe(constants.SUCCESS_MESSAGE);
      expect(result.data?.user).toEqual([1]);
    });

    it("should return an error if user is not found", async () => {
      const mockUserData = {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        active: "Active",
        street: "123 Main St",
        city: "ABC city",
        state: "2",
        zip_code: "10001",
        country: 4,
        role: "1",
        profile_id: "2",
        status: "active",
        organization: "PF2.0",
        updated_by: "Admin",
        created_by: "ADMIN",
      };
      const mockUserId = "1";

      (User.findOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await userService.updateUser(mockUserData, mockUserId);

      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.message).toBe("User not found");
    });

    it("should return an error if user update fails", async () => {
      const mockUserData = {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        profile: "1",
        street: "123 Main St",
        city: "ABC city",
        state: "2",
        zip_code: "10001",
        country: 4,
        role: "1",
        profile_id: "2",
        status: "active",
        organization: "PF2.0",
        updated_by: "Admin",
        created_by: "ADMIN",
      };
      const mockUserId = "1";

      (User.findOne as jest.Mock).mockResolvedValueOnce({ rid: mockUserId });
      (User.update as jest.Mock).mockRejectedValueOnce(
        new Error("User update failed")
      );

      const result = await userService.updateUser(mockUserData, mockUserId);

      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.message).toBe(constants.FAILED_MESSAGE);
    });
  });

  describe("listUsers", () => {
    it("should successfully retrieve a list of users", async () => {
      const mockUsers = [
        { id: "1", first_name: "John", last_name: "Doe" },
        { id: "2", first_name: "Jane", last_name: "Smith" },
      ];
      const mockFilters = { status: "active" };
      const mockPage = 1;
      const mockLimit = 10;
      const mockSearch = "John";
      const mockSortBy = "first_name";
      const mockSortOrder = "asc";
      const mockOrganization = constants.PLATFORM_TWO;

      (User.findAll as jest.Mock).mockResolvedValueOnce(mockUsers);

      const result = await userService.listUsers(
        mockPage,
        mockLimit,
        mockSearch,
        mockFilters,
        mockSortBy,
        mockSortOrder,
        mockOrganization
      );

      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.message).toBe(constants.SUCCESS_MESSAGE);
      expect(result.data?.users).toEqual(mockUsers);
    });

    it("should return an error if list users retrieval fails", async () => {
      const mockPage = 1;
      const mockLimit = 10;
      const mockSearch = "John";
      const mockFilters = {};
      const mockSortBy = "first_name";
      const mockSortOrder = "asc";
      const mockOrganization = constants.PLATFORM_TWO;

      (User.findAll as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to fetch users")
      );

      const result = await userService.listUsers(
        mockPage,
        mockLimit,
        mockSearch,
        mockFilters,
        mockSortBy,
        mockSortOrder,
        mockOrganization
      );

      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.message).toBe(constants.FAILED_MESSAGE);
    });
  });

  describe("listUserById", () => {
    it("should successfully retrieve a user by ID", async () => {
      const mockUserId = "user-123";
      const mockOrganization = constants.PLATFORM_TWO;
      const mockUser = {
        rid: "user-123",
        first_name: "John",
        last_name: "Doe",
      };

      (User.findAll as jest.Mock).mockResolvedValueOnce([mockUser]);

      const result = await userService.listUserById(
        mockUserId,
        mockOrganization
      );

      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.message).toBe(constants.SUCCESS_MESSAGE);
      expect(result.data?.users).toEqual([mockUser]);
    });

    it("should return an error if user by ID retrieval fails", async () => {
      const mockUserId = "user-123";
      const mockOrganization = constants.PLATFORM_TWO;

      (User.findAll as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to fetch user by ID")
      );

      const result = await userService.listUserById(
        mockUserId,
        mockOrganization
      );

      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.message).toBe(constants.FAILED_MESSAGE);
    });
  });

  describe("updateUserDetails", () => {
    it("should successfully update user details", async () => {
      const mockUserDetails = {
        first_name: "John",
        middle_name: "A.",
        last_name: "Doe",
        profile_id: "1", // You can adjust this based on your specific needs.
        status: "active",
        street: "123 Main St",
        city: "ABC City",
        state: "3", // Use valid state ID or number
        zip_code: "10001",
        country: 4, // Adjust according to the country list
        mobile: "123-456-7890",
        role: "2", // Adjust role ID or reference
        designation: "Software Engineer",
        manager_name: "Jane Smith",
        manager_email: "jane.smith@example.com",
        manager_employee_id: "EMP-123",
        employee_id: "EMP-001",
        employment_date: new Date("2023-01-01"),
        department_id: "D001", // Adjust department ID
        function_group_id: "FG001", // Adjust function group ID
        organization: "PF2.0",
        updated_by: "Admin",
      };
      const mockUserId = "user-123";

      (UserDetails.update as jest.Mock).mockResolvedValueOnce([1]);

      const result = await userService.updateUserDetails(
        mockUserDetails,
        mockUserId
      );

      expect(UserDetails.update).toHaveBeenCalledWith(
        {
          department_id: mockUserDetails.department_id,
          designation: mockUserDetails.designation,
          employment_date: mockUserDetails.employment_date,
          manager_email: mockUserDetails.manager_email,
          manager_employee_id: mockUserDetails.manager_employee_id,
          manager_name: mockUserDetails.manager_name,
          employee_id: mockUserDetails.employee_id,
          function_group_id: mockUserDetails.function_group_id,
          mobile: mockUserDetails.mobile,
          modified_datetime: expect.any(Date),
        },
        {
          where: {
            user_id: mockUserId,
          },
        }
      );
    });
  });

  describe("roles", () => {
    it("should successfully retrieve roles", async () => {
      const mockRoles = [{ id: 1, name: "Admin" }];

      (BusinessTeams.findAll as jest.Mock).mockResolvedValueOnce(mockRoles);

      const result = await userService.roles();

      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.message).toBe(constants.SUCCESS_MESSAGE);
      expect(result.data?.roles).toEqual(mockRoles);
    });

    it("should return an error if roles retrieval fails", async () => {
      (BusinessTeams.findAll as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to retrieve roles")
      );

      const result = await userService.roles();

      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.message).toBe(constants.FAILED_MESSAGE);
    });
  });

  describe("profiles", () => {
    it("should successfully retrieve profiles", async () => {
      const mockProfiles = [{ id: 1, name: "Developer" }];

      (Profile.findAll as jest.Mock).mockResolvedValueOnce(mockProfiles);

      const result = await userService.profiles();

      expect(result.statusCode).toBe(constants.SUCCESS);
      expect(result.message).toBe(constants.SUCCESS_MESSAGE);
      expect(result.data?.profiles).toEqual(mockProfiles);
    });

    it("should return an error if profiles retrieval fails", async () => {
      (Profile.findAll as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to retrieve profiles")
      );

      const result = await userService.profiles();

      expect(result.statusCode).toBe(constants.FAILED);
      expect(result.message).toBe(constants.FAILED_MESSAGE);
    });
  });

  describe("getSortParameters", () => {
    it("should return the correct sort parameters for valid inputs", () => {
      const sortBy = "first_name";
      const sortOrder = "ASC";

      const result = userService.getSortParameters(sortBy, sortOrder);

      expect(result).toEqual([sortBy, "ASC"]);
    });

    it("should default to 'created_datetime' if sortBy is invalid", () => {
      const sortBy = "invalid_column";
      const sortOrder = "DESC";

      const result = userService.getSortParameters(sortBy, sortOrder);

      expect(result).toEqual(["created_datetime", "DESC"]);
    });

    it("should default to 'ASC' if sortOrder is invalid", () => {
      const sortBy = "first_name";
      const sortOrder = "invalid_order";

      const result = userService.getSortParameters(sortBy, sortOrder);

      expect(result).toEqual([sortBy, "DESC"]);
    });
  });

  describe("buildWhereClause", () => {
    it("should build the whereClause with search and filters", () => {
      const filters = {
        user_name: { startsWith: "John" },
        status: { value: "active" },
      };
      const search = "john.doe@example.com";

      const whereClause = userService.buildWhereClause(filters, search);

      const whereClauseAsTyped = whereClause as WhereClause;

      expect(whereClause).toBeDefined();
      expect(whereClauseAsTyped["first_name"]).toEqual({
        [Op.iLike]: "John%",
      });
      expect(whereClauseAsTyped["status"]).toEqual("active");
    });

    it("should return an empty whereClause when no filters are provided", () => {
      const filters = {};
      const search = "";

      const whereClause = userService.buildWhereClause(filters, search);

      expect(whereClause).toEqual({});
    });
  });
});
