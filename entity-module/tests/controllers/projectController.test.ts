import { Request, Response } from "express";
import configurations from "../../src/config/config";
import * as helpers from "../../src/utils/helpers";
import { HttpStatus } from "../../src/utils/constants";
import projectController from "../../src/controllers/projectController";

jest.mock("../../src/config/config", () => ({
  getInstance: jest.fn().mockReturnValue({
    getServices: jest.fn().mockReturnValue({
      projectServices: {
        createProject: jest.fn(),
        createProjectTables: jest.fn(),
        createProjectRecords: jest.fn(),
        updateProjectRecords: jest.fn(),
        addProjectTimeline: jest.fn(),
        addProjectFiscalRecords: jest.fn(),
        updateProjectFiscal: jest.fn(),
        updateProjectHistory: jest.fn(),
        throwServiceError: jest.fn(),
        projectById: jest.fn(),
        projectList: jest.fn(),
      },
    }),
  }),
}));

jest.mock("../../src/utils/helpers", () => ({
  validateRequest: jest.fn(),
  handleSuccessResponse: jest.fn(),
  handleErrorResponse: jest.fn(),
  successLog: jest.fn(),
  errorLog: jest.fn(),
}));

const createMockRequest = (): Request => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    get: jest.fn().mockImplementation((name: string) => {
      return undefined;
    }),
  } as unknown as Request;
};

const createMockResponse = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

describe("Project Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const services = configurations.getInstance().getServices();

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    jest.clearAllMocks();
  });

  describe("create project", () => {
    it("should create project on success", async () => {
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        name: "Test Project",
      });
      (services.projectServices.createProject as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: { id: "proj-id", name: "Test Project" },
      });

      await projectController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(helpers.validateRequest).toHaveBeenCalledWith(
        mockRequest,
        expect.anything(),
        mockResponse
      );
      expect(services.projectServices.createProject).toHaveBeenCalledWith({
        name: "Test Project",
      });
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(mockResponse, {
        id: "proj-id",
        name: "Test Project",
      });
    });

    it("should return early if validation fails", async () => {
      (helpers.validateRequest as jest.Mock).mockResolvedValue(null);

      await projectController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(services.projectServices.createProject).not.toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).not.toHaveBeenCalled();
      expect(helpers.handleErrorResponse).not.toHaveBeenCalled();
    });

    it("should handle service failure response", async () => {
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        name: "Test Project",
      });
      (services.projectServices.createProject as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.BAD_REQUEST,
        errorMessage: "Service failure",
      });

      await projectController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Service failure"
      );
    });

    it("should handle unexpected errors", async () => {
      (helpers.validateRequest as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      await projectController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Unexpected error"
      );
    });
  });

  describe("update project", () => {
    it("should update project on success", async () => {
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        id: "proj-id",
        name: "Updated Project",
      });

      (
        services.projectServices.updateProjectRecords as jest.Mock
      ).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: { id: "proj-id", name: "Updated Project" },
      });

      await projectController.updateProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(helpers.validateRequest).toHaveBeenCalledWith(
        mockRequest,
        expect.anything(),
        mockResponse
      );
      expect(
        services.projectServices.updateProjectRecords
      ).toHaveBeenCalledWith({
        id: "proj-id",
        name: "Updated Project",
      });
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(mockResponse, {
        id: "proj-id",
        name: "Updated Project",
      });
    });

    it("should return early if validation fails", async () => {
      (helpers.validateRequest as jest.Mock).mockResolvedValue(null);

      await projectController.updateProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(
        services.projectServices.updateProjectRecords
      ).not.toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).not.toHaveBeenCalled();
      expect(helpers.handleErrorResponse).not.toHaveBeenCalled();
    });

    it("should handle service failure response", async () => {
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        id: "proj-id",
        name: "Updated Project",
      });

      (
        services.projectServices.updateProjectRecords as jest.Mock
      ).mockResolvedValue({
        statusCode: HttpStatus.BAD_REQUEST,
        errorMessage: "Failed to update project",
      });

      await projectController.updateProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Failed to update project"
      );
    });

    it("should handle unexpected errors", async () => {
      (helpers.validateRequest as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected failure");
      });

      await projectController.updateProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Unexpected failure"
      );
    });
  });

  describe("project detail", () => {
    it("should return project data successfully", async () => {
      const mockData = {
        rid: "proj-001",
        project_ref_id: "REF001",
        name: "Test Project",
      };

      (services.projectServices.projectById as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: mockData,
      });

      await projectController.projectById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(mockResponse, {
        rid: "proj-001",
        name: "Test Project",
        project_ref_id: "REF001",
      });
    });

    it("should return error response if project not found", async () => {
      (services.projectServices.projectById as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.FAILED,
        errorMessage: "Project not found",
      });

      await projectController.projectById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Project not found"
      );
    });

    it("should return error response if service throws exception", async () => {
      (services.projectServices.projectById as jest.Mock).mockRejectedValue(
        new Error("Unexpected error")
      );

      await projectController.projectById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Unexpected error"
      );
    });
  });

  describe("project list", () => {
    const mockReq = {
      params: { accountNumber: "ACC0001" },
      query: {},
    } as unknown as Request;

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const mockValidatedValue = {
      page: "1",
      limit: "10",
      filters: JSON.stringify({ status: { equals: "Active" } }),
      fiscalYear: "2024",
      search: "Test",
      sortBy: "project_ref_id",
      sortOrder: "desc",
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return project list successfully", async () => {
      (helpers.validateRequest as jest.Mock).mockResolvedValue(
        mockValidatedValue
      );

      (services.projectServices.projectList as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: [{ project_ref_id: "PRJ-1234", name: "Sample Project" }],
      });

      await projectController.projectList(
        mockReq as Request,
        mockResponse as Response
      );

      expect(services.projectServices.projectList).toHaveBeenCalledWith(
        "ACC0001",
        "2024",
        1,
        10,
        "Test",
        { status: { equals: "Active" } },
        "project_ref_id",
        "desc"
      );

      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(mockResponse, [
        { project_ref_id: "PRJ-1234", name: "Sample Project" },
      ]);
    });

    it("should exit early if validation fails", async () => {
      (helpers.validateRequest as jest.Mock).mockResolvedValue(null);

      await projectController.projectList(mockReq, mockRes);

      expect(services.projectServices.projectList).not.toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).not.toHaveBeenCalled();
      expect(helpers.handleErrorResponse).not.toHaveBeenCalled();
    });

    it("should handle invalid JSON filters gracefully", async () => {
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        ...mockValidatedValue,
        filters: "{invalidJson}",
      });

      (services.projectServices.projectList as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: [],
      });

      await projectController.projectList(mockReq, mockRes);

      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(mockRes, []);
    });

    it("should handle service failure response", async () => {
      (helpers.validateRequest as jest.Mock).mockResolvedValue(
        mockValidatedValue
      );
      (services.projectServices.projectList as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.BAD_REQUEST,
        errorMessage: "Service failed",
      });

      await projectController.projectList(mockReq, mockRes);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockRes,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Service failed"
      );
    });

    it("should handle unexpected exceptions", async () => {
      (helpers.validateRequest as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      await projectController.projectList(mockReq, mockRes);

      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockRes,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Unexpected error"
      );
    });
  });
});
