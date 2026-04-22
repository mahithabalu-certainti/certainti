import { Request, Response, NextFunction } from "express";
import { constants } from "../../src/utils/constant";
import { checkUserStatusMiddleware } from "../../src/middlewares/azureMiddleware";

// Mocks
jest.mock("../../src/config/dataSource", () => ({
  initSequelize: jest.fn(),
}));

const { initSequelize } = require("../../src/config/dataSource");

describe("checkUserStatusMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {}, originalUrl: "/api/test" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return 400 if no user id headers", async () => {
    await checkUserStatusMiddleware()(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(constants.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: constants.BAD_REQUEST_MESSAGE,
      message: "User ID is required in headers",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should proceed if x-azure-id is present and user is active", async () => {
    req.headers = { "x-azure-id": "azure-123" };
    const mockUser = { status: "active", rid: "user-1", profile_rid: "profile-1", email: "test@test.com" };
    initSequelize.mockResolvedValue({
      query: jest.fn().mockResolvedValue([mockUser]),
    });
    await checkUserStatusMiddleware()(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it("should proceed if x-user-id is present and user is active", async () => {
    req.headers = { "x-user-id": "user-123" };
    const mockUser = { status: "active", rid: "user-123", profile_rid: "profile-1", email: "test@test.com" };
    initSequelize.mockResolvedValue({
      query: jest.fn().mockResolvedValue([mockUser]),
    });
    await checkUserStatusMiddleware()(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it("should return 403 if user is not found", async () => {
    req.headers = { "x-azure-id": "azure-123" };
    initSequelize.mockResolvedValue({
      query: jest.fn().mockResolvedValue([]),
    });
    await checkUserStatusMiddleware()(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(constants.FORBIDDEN);
    expect(res.json).toHaveBeenCalledWith({
      error: constants.FORBIDDEN_MESSAGE,
      message: "User account is inactive. Please contact administrator.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if user is inactive", async () => {
    req.headers = { "x-azure-id": "azure-123" };
    const mockUser = { status: "inactive", rid: "user-1", profile_rid: "profile-1", email: "test@test.com" };
    initSequelize.mockResolvedValue({
      query: jest.fn().mockResolvedValue([mockUser]),
    });
    await checkUserStatusMiddleware()(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(constants.FORBIDDEN);
    expect(res.json).toHaveBeenCalledWith({
      error: constants.FORBIDDEN_MESSAGE,
      message: "User account is inactive. Please contact administrator.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should skip permission check if permissionName is NA", async () => {
    req.headers = { "x-azure-id": "azure-123" };
    const mockUser = { status: "active", rid: "user-1", profile_rid: "profile-1", email: "test@test.com" };
    initSequelize.mockResolvedValue({
      query: jest.fn().mockResolvedValue([mockUser]),
    });
    await checkUserStatusMiddleware("NA")(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it("should proceed if permissionName is provided and user has permission", async () => {
    req.headers = { "x-azure-id": "azure-123" };
    const mockUser = { status: "active", rid: "user-1", profile_rid: "profile-1", email: "test@test.com" };
    // Mock the DB for user lookup, permission lookup, profile access, user access
    initSequelize.mockResolvedValue({
      query: jest
        .fn()
        // user lookup
        .mockResolvedValueOnce([mockUser])
        // permission lookup
        .mockResolvedValueOnce([{ rid: "perm-1" }])
        // profile access (enabled)
        .mockResolvedValueOnce([{ is_enabled: true }])
        // user access (disabled)
        .mockResolvedValueOnce([{ is_enabled: false }])
    });
    await checkUserStatusMiddleware("PERM_NAME")(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it("should return 403 if permissionName is provided and user does not have permission", async () => {
    req.headers = { "x-azure-id": "azure-123" };
    const mockUser = { status: "active", rid: "user-1", profile_rid: "profile-1", email: "test@test.com" };
    // Mock the DB for user lookup, permission lookup, profile access, user access, denial insert
    initSequelize.mockResolvedValue({
      query: jest
        .fn()
        // user lookup
        .mockResolvedValueOnce([mockUser])
        // permission lookup
        .mockResolvedValueOnce([{ rid: "perm-1" }])
        // profile access (disabled)
        .mockResolvedValueOnce([{ is_enabled: false }])
        // user access (disabled)
        .mockResolvedValueOnce([{ is_enabled: false }])
        // denial insert
        .mockResolvedValueOnce([])
    });
    await checkUserStatusMiddleware("PERM_NAME")(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(constants.FORBIDDEN);
    expect(res.json).toHaveBeenCalledWith({
      error: constants.FORBIDDEN_MESSAGE,
      message: "User API access denied. Please contact administrator.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 500 if an error is thrown", async () => {
    req.headers = { "x-azure-id": "azure-123" };
    initSequelize.mockRejectedValue(new Error("DB error"));
    await checkUserStatusMiddleware()(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(constants.FAILED);
    expect(res.json).toHaveBeenCalledWith({
      error: constants.FAILED_MESSAGE,
      message: "Failed to verify user status",
    });
    expect(next).not.toHaveBeenCalled();
  });
});