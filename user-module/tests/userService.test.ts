import UserService from "../src/services/userService";
import { constants } from "../src/utils/constant";
import { User, BusinessTeams, Profile } from "../src/models";

jest.mock("../src/models/userModel", () => ({
  User: {
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
        email_address: "john.doe@example.com",
        profile: "1",
        active: "Active",
        street: "123 Main St",
        city: 2,
        state: 3,
        zip_code: "10001",
        country: 4,
        role: "1",
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
          email: mockUserData.email_address,
          profile_rid: mockUserData.profile,
          status: mockUserData.active,
          street: mockUserData.street,
          city: mockUserData.city,
          state: mockUserData.state,
          zip_code: mockUserData.zip_code,
          country: mockUserData.country,
          role_rid: mockUserData.role,
        })
      );
    });

    it("should return an error if user creation fails", async () => {
      const mockUserData = {
        first_name: "John",
        last_name: "Doe",
        email_address: "john.doe@example.com",
        profile: "1",
        active: "Active",
        street: "123 Main St",
        city: 2,
        state: 3,
        zip_code: "10001",
        country: 3,
        role: "1",
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
        profile: "1",
        active: "Active",
        street: "123 Main St",
        city: 2,
        state: 3,
        zip_code: "10001",
        country: 4,
        role: "1",
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
        profile: "1",
        active: "Active",
        street: "123 Main St",
        city: 2,
        state: 2,
        zip_code: "ABC",
        country: 4,
        role: "1",
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
        profile: "1",
        active: "Active",
        street: "123 Main St",
        city: 2,
        state: 3,
        zip_code: "10001",
        country: 4,
        role: "1",
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
});
