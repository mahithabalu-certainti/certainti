process.env.KEY_VAULT_URI = "https://mock-keyvault.vault.azure.net";
process.env.ORGDB_NAME = "rdcredits_orgdb";
process.env.ORGDB_PASSWORD = "myuser";
process.env.ORGDB_USERNAME = "mysecretpassword";
process.env.ORGDB_ENDPOINT = "localhost";

process.env.MAINDB_NAME = "certainty_local";
process.env.MAINDB_USERNAME = "Sumi@2271";
process.env.MAINDB_PASSWORD = "postgres";
process.env.MAINDB_ENDPOINT = "localhost";

import { ProjectService } from "../../src/services/projectService";
import SchemaService from "../../src/services/schemaService";
import { Project } from "../../src/models/project";
import { ProjectFiscal } from "../../src/models/projectFiscal";
import { ProjectTimeline } from "../../src/models/projectTimeline";
import * as orgDataSource from "../../src/config/orgDataSource";
import * as mainDataSource from "../../src/config/mainDataSource";
import { HttpStatus } from "../../src/utils/constants";
import moment from "moment";
import { ProjectHistory } from "../../src/models/projectHistory";
import { Op, Sequelize } from "sequelize";

jest.mock("../../src/services/schemaService", () => {
  return jest.fn().mockImplementation(() => ({
    createNewSchema: jest.fn(),
    insertAccountDetails: jest.fn(),
    updateAccountDetails: jest.fn(),
    fetchAccountDetails: jest.fn(),
    checkAccountIdAndNumber: jest.fn(),
    fetchParentAccount: jest.fn(),
    checkIfSchemaExists: jest.fn(),
    insertProjectGeoData: jest.fn(),
    fetchAccountByNumber: jest.fn(),
  }));
});

jest.mock("../../src/models/project", () => ({
  Project: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    initialize: jest.fn(),
  },
}));

jest.mock("../../src/models/projectFiscal", () => ({
  ProjectFiscal: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    initialize: jest.fn(),
  },
}));

jest.mock("../../src/models/projectTimeline", () => ({
  ProjectTimeline: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    initialize: jest.fn(),
  },
}));

jest.mock("../../src/models/projectHistory", () => ({
  ProjectHistory: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    initialize: jest.fn(),
    sync: jest.fn(),
  },
}));

jest.mock("../../src/config/orgDataSource");
jest.mock("../../src/config/mainDataSource");

describe("ProjectService", () => {
  let projectService: ProjectService;
  let mockSchemaService: jest.Mocked<SchemaService>;

  const validProjectData = {
    account_number: "12345",
    account_id: "acc-001",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    projectService = new ProjectService();
    mockSchemaService = projectService[
      "schemaService"
    ] as jest.Mocked<SchemaService>;
  });

  const mockProjectData = {
    project_ref_id: "REF123",
    industry: "Tech",
    account_id: "acc-001",
    account_number: "12345",
    program_name: "Test Program",
    client_organization: "Test Org",
    project_start_date: moment("01/01/2024", "MM/DD/YYYY").toDate(),
    project_end_date: moment("12/31/2024", "MM/DD/YYYY").toDate(),
    project_type: "Fixed" as "Fixed" | "Time & Material",
    project_classification: "Class A",
    project_client_group: "Group A",
    project_group: "PG1",
    project_summary: "Summary",
    status: "Active" as "Active" | "Inactive",
    fiscal_year: 2024,
    country: "USA",
    region: "North America",
    currency: "USD",
    project_manager: "John Doe",
    project_lead: "Jane Doe",
    spoc_name: "Alice",
    spoc_email: "alice@test.com",
    spoc_mobile: "1234567890",
    created_by: "creator-uuid",
  };

  describe("create project", () => {
    it("should create a new project and return success response", async () => {
      mockSchemaService.checkAccountIdAndNumber.mockResolvedValue({
        isAccountExist: true,
        dataStorage: "store_in_account",
        parentAccountId: "",
      });

      mockSchemaService.fetchParentAccount.mockResolvedValue("12345");

      mockSchemaService.checkIfSchemaExists.mockResolvedValue(true);

      const mockSequelize = {};
      (orgDataSource.initOrgSequelize as jest.Mock).mockResolvedValue(
        mockSequelize
      );

      const mockCreate = jest
        .fn()
        .mockResolvedValue({ rid: "project-rid", ...mockProjectData });

      const mockFindOne = jest.fn().mockResolvedValue(null);

      (Project.initialize as jest.Mock).mockResolvedValue({
        create: mockCreate,
        findOne: mockFindOne,
      });

      (ProjectFiscal.initialize as jest.Mock).mockResolvedValue({
        sync: jest.fn(),
        create: mockCreate,
      });

      (ProjectTimeline.initialize as jest.Mock).mockResolvedValue({
        sync: jest.fn(),
        create: mockCreate,
      });

      const response = await projectService.createProject(mockProjectData);

      expect(response.statusCode).toBe(HttpStatus.SUCCESS);
      expect(response.message).toBe(HttpStatus.SUCCESS_MESSAGE);
      expect(response.data?.project).toHaveProperty("project_ref_id", "REF123");
      expect(mockCreate).toHaveBeenCalled();
    });

    it("should return failure response if account does not exist", async () => {
      mockSchemaService.checkAccountIdAndNumber.mockResolvedValue({
        isAccountExist: false,
        dataStorage: "",
        parentAccountId: "",
      });

      const response = await projectService.createProject(mockProjectData);

      expect(response.statusCode).toBe(HttpStatus.FAILED);
      expect(response.message).toBe(HttpStatus.FAILED_MESSAGE);
      expect(response.errorMessage).toMatch(/Invalid account number/i);
    });

    it("should return failure if project schema does not exist", async () => {
      mockSchemaService.checkAccountIdAndNumber.mockResolvedValue({
        isAccountExist: false,
        dataStorage: "",
        parentAccountId: "",
      });

      mockSchemaService.checkIfSchemaExists.mockResolvedValue(false);

      const response = await projectService.createProject(mockProjectData);

      expect(response.statusCode).toBe(HttpStatus.FAILED);
      expect(response.errorMessage).toMatch(
        /Invalid account number or account ID. The specified account was not found./i
      );
    });

    it("should return failure if reference ID already exists", async () => {
      mockSchemaService.checkAccountIdAndNumber.mockResolvedValue({
        isAccountExist: true,
        dataStorage: "store_in_account",
        parentAccountId: "",
      });

      mockSchemaService.checkIfSchemaExists.mockResolvedValue(true);

      (orgDataSource.initOrgSequelize as jest.Mock).mockResolvedValue({});

      const mockFindOne = jest
        .fn()
        .mockResolvedValue({ project_ref_id: "REF123" });

      (Project.initialize as jest.Mock).mockResolvedValue({
        findOne: mockFindOne,
        create: jest.fn(),
      });

      const response = await projectService.createProject(mockProjectData);

      expect(response.statusCode).toBe(HttpStatus.FAILED);
      expect(response.errorMessage).toMatch(/reference ID must be unique/i);
    });
  });

  describe("update project", () => {
    const mockUpdateData = {
      project_id: "proj-001",
      project_ref_id: "REF789",
      client_organization: "Test",
      account_number: "12345",
      account_id: "acc-001",
      program_name: "Updated Program",
      project_description: "Updated desc",
      status: "Active" as "Active" | "Inactive",
      project_start_date: moment("01/01/2024", "MM/DD/YYYY").toDate(),
      project_end_date: moment("12/31/2024", "MM/DD/YYYY").toDate(),
      project_lead: "Lead",
      project_manager: "Manager",
      project_type: "Fixed" as "Fixed" | "Time & Material",
      spoc_name: "Spoc",
      industry: "IT",
      fiscal_year: 2024,
      total_effort: 100,
      total_cost: 5000,
      total_fte: 5,
      total_sub_con: 2,
      total_non_labor_cost: 500,
      total_fte_effort: 80,
      total_sub_con_effort: 20,
      total_fte_cost: 4000,
      total_sub_con_cost: 1000,
      auto_send_ai_interaction: false,
      auto_access_rd: false,
      max_ai_interaction: 10,
      blended_rate_fte: "100",
      blended_rate_sub_con: "150",
      created_by: "user-id",
    };

    it("should update project records successfully", async () => {
      mockSchemaService.checkAccountIdAndNumber.mockResolvedValue({
        isAccountExist: true,
        dataStorage: "store_in_account",
        parentAccountId: "",
      });

      const mockFindOne = jest
        .fn()
        .mockResolvedValueOnce({ rid: "proj-001" })
        .mockResolvedValueOnce(null);

      const mockUpdate = jest.fn().mockResolvedValue([1]);

      (orgDataSource.initOrgSequelize as jest.Mock).mockResolvedValue({});

      (Project.initialize as jest.Mock).mockResolvedValue({
        findOne: mockFindOne,
        update: mockUpdate,
      });

      (ProjectFiscal.initialize as jest.Mock).mockResolvedValue({
        sync: jest.fn(),
        findOne: mockFindOne,
        update: mockUpdate,
      });

      (ProjectHistory.initialize as jest.Mock).mockResolvedValue({
        sync: jest.fn(),
        findOne: mockFindOne,
        update: mockUpdate,
        findAll: jest.fn().mockResolvedValue([]),
        bulkCreate: jest.fn(),
      });

      const response = await projectService.updateProjectRecords(
        mockUpdateData
      );

      expect(response.statusCode).toBe(HttpStatus.SUCCESS);
      expect(response.message).toBe(HttpStatus.SUCCESS_MESSAGE);
      expect(response.data?.project).toEqual([1]);
    });

    it("should fail if account does not exist", async () => {
      mockSchemaService.checkAccountIdAndNumber.mockResolvedValue({
        isAccountExist: false,
        dataStorage: "",
        parentAccountId: "",
      });

      await expect(
        projectService.updateProjectRecords(mockUpdateData)
      ).rejects.toThrow(
        /Error updating project: Invalid account number or account ID. The specified account was not found./i
      );
    });

    it("should fail if duplicate project_ref_id exists", async () => {
      mockSchemaService.checkAccountIdAndNumber.mockResolvedValue({
        isAccountExist: true,
        dataStorage: "store_in_account",
        parentAccountId: "",
      });

      const mockFindOne = jest
        .fn()
        .mockResolvedValueOnce({ rid: "proj-001" })
        .mockResolvedValueOnce({ project_ref_id: "REF789" });

      (orgDataSource.initOrgSequelize as jest.Mock).mockResolvedValue({});

      (Project.initialize as jest.Mock).mockResolvedValue({
        findOne: mockFindOne,
      });

      await expect(
        projectService.updateProjectRecords(mockUpdateData)
      ).rejects.toThrow(/Duplicate Project Ref ID/i);
    });

    it("should fail if project ID not found", async () => {
      mockSchemaService.checkAccountIdAndNumber.mockResolvedValue({
        isAccountExist: true,
        dataStorage: "store_in_account",
        parentAccountId: "",
      });

      const mockFindOne = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      (orgDataSource.initOrgSequelize as jest.Mock).mockResolvedValue({});

      (Project.initialize as jest.Mock).mockResolvedValue({
        findOne: mockFindOne,
      });

      await expect(
        projectService.updateProjectRecords(mockUpdateData)
      ).rejects.toThrow(/Invalid project ID/i);
    });
  });

  describe("projectById", () => {
    const mockAccountNumber = "12345";
    const mockProjectId = "proj-001";
    const mockProject = {
      rid: "proj-001",
      country: "country-id",
      region: "region-id",
      currency: "currency-id",
    };
    const mockGeoProject = {
      ...mockProject,
      country_name: "India",
      state_name: "Karnataka",
      city_name: "INR",
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return project data successfully", async () => {
      const mockFindOne = jest.fn().mockResolvedValue(mockProject);
      const mockProjectModel = { findOne: mockFindOne };

      (orgDataSource.initOrgSequelize as jest.Mock).mockResolvedValue({});
      (mainDataSource.initMainDbSequelize as jest.Mock).mockResolvedValue({});

      (Project.initialize as jest.Mock).mockResolvedValue(mockProjectModel);

      mockSchemaService.fetchAccountByNumber.mockResolvedValue({
        accountNumber: mockAccountNumber,
        accountId: "",
        accountName: "Test account",
      });

      mockSchemaService.checkIfSchemaExists.mockResolvedValue(true);

      (mockSchemaService.insertProjectGeoData as jest.Mock).mockResolvedValue(
        mockGeoProject
      );

      const response = await projectService.projectById(
        mockAccountNumber,
        mockProjectId
      );

      expect(response.statusCode).toBe(HttpStatus.SUCCESS);
      expect(response.message).toBe(HttpStatus.SUCCESS_MESSAGE);
      expect(response.data?.project).toEqual(mockGeoProject);
    });

    it("should return null project data if project not found", async () => {
      const mockFindOne = jest.fn().mockResolvedValue(null);
      const mockProjectModel = { findOne: mockFindOne };

      mockSchemaService.fetchAccountByNumber.mockResolvedValue({
        accountNumber: mockAccountNumber,
        accountId: "",
        accountName: "Test account",
      });

      mockSchemaService.checkIfSchemaExists.mockResolvedValue(true);

      (orgDataSource.initOrgSequelize as jest.Mock).mockResolvedValue({});
      (mainDataSource.initMainDbSequelize as jest.Mock).mockResolvedValue({});
      (Project.initialize as jest.Mock).mockResolvedValue(mockProjectModel);

      const response = await projectService.projectById(
        mockAccountNumber,
        mockProjectId
      );

      expect(response.statusCode).toBe(HttpStatus.SUCCESS);
      expect(response.message).toBe(HttpStatus.SUCCESS_MESSAGE);
      expect(response.data?.project).toBeNull();
    });

    it("should throw error if something fails", async () => {
      mockSchemaService.fetchAccountByNumber.mockResolvedValue({
        accountNumber: mockAccountNumber,
        accountId: "",
        accountName: "Test account",
      });

      mockSchemaService.checkIfSchemaExists.mockResolvedValue(true);

      (orgDataSource.initOrgSequelize as jest.Mock).mockRejectedValue(
        new Error("DB connection failed")
      );

      await expect(
        projectService.projectById(mockAccountNumber, mockProjectId)
      ).rejects.toThrow("Error fetching project by ID: DB connection failed");
    });
  });

  describe("projectList", () => {
    const mockAccountNumber = "12345";
    const mockAccountId = "acc-id";
    const mockProject = {
      dataValues: {
        r_number: "PRO0001",
        project_ref_id: "PRJ-1234",
        industry: "IT",
        project_start_date: "2025-01-01T00:00:00.000Z",
        project_end_date: "2025-12-31T00:00:00.000Z",
        project_type: "Fixed",
        project_classification: "Software",
        project_client_group: "Group A",
        project_group: "Team Alpha",
        status: "Active",
        account_rid: mockAccountId,
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return project list successfully", async () => {
      const mockFindAll = jest.fn().mockResolvedValue([mockProject]);
      const mockProjectModel = { findAll: mockFindAll };

      mockSchemaService.fetchAccountByNumber.mockResolvedValue({
        accountNumber: "ACCT-R-001",
        accountId: mockAccountId,
        accountName: "Test Account",
      });

      mockSchemaService.checkIfSchemaExists.mockResolvedValue(true);

      (orgDataSource.initOrgSequelize as jest.Mock).mockResolvedValue({});
      (Project.initialize as jest.Mock).mockResolvedValue(mockProjectModel);

      const response = await projectService.projectList(
        mockAccountNumber,
        2025,
        1,
        10,
        "Test Search",
        { status: { equals: "Active" } },
        "project_ref_id",
        "desc"
      );

      expect(mockSchemaService.fetchAccountByNumber).toHaveBeenCalledWith(
        mockAccountNumber
      );
      expect(mockSchemaService.checkIfSchemaExists).toHaveBeenCalledWith(
        "ACCT-R-001"
      );

      expect(Project.initialize).toHaveBeenCalled();

      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account_rid: mockAccountId,
            fiscal_year: 2025,
          }),
          order: [["project_ref_id", "DESC"]],
          offset: 0,
          limit: 10,
          attributes: expect.any(Array),
        })
      );

      expect(response.statusCode).toBe(HttpStatus.SUCCESS);
      expect(response.message).toBe(HttpStatus.SUCCESS_MESSAGE);
      expect(response.data?.projects[0].dataValues.account_name).toBe(
        "Test Account"
      );
      expect(response.data?.projects[0].dataValues.account_number).toBe(
        "ACCT-R-001"
      );
    });
  });

  describe("getSortParameters", () => {
    it("should return valid sortBy and sortOrder when inputs are valid", () => {
      const [sortBy, sortOrder] = projectService.getSortParameters(
        "project_ref_id",
        "asc"
      );
      expect(sortBy).toBe("project_ref_id");
      expect(sortOrder).toBe("ASC");
    });

    it("should return default sortBy if input is invalid", () => {
      const [sortBy, sortOrder] = projectService.getSortParameters(
        "invalid_column",
        "asc"
      );
      expect(sortBy).toBe("created_datetime");
      expect(sortOrder).toBe("ASC");
    });

    it("should return sortOrder as DESC when input is 'desc'", () => {
      const [sortBy, sortOrder] = projectService.getSortParameters(
        "status",
        "desc"
      );
      expect(sortBy).toBe("status");
      expect(sortOrder).toBe("DESC");
    });

    it("should fallback to DESC if sortOrder is invalid", () => {
      const [sortBy, sortOrder] = projectService.getSortParameters(
        "status",
        "something-else"
      );
      expect(sortBy).toBe("status");
      expect(sortOrder).toBe("DESC");
    });

    it("should default both sortBy and sortOrder when both inputs are invalid", () => {
      const [sortBy, sortOrder] = projectService.getSortParameters(
        "unknown_field",
        "badOrder"
      );
      expect(sortBy).toBe("created_datetime");
      expect(sortOrder).toBe("DESC");
    });
  });

  describe("buildWhereClause", () => {
    it("should return whereClause with search condition only", () => {
      const result = projectService.buildWhereClause({}, "blockchain");

      expect(result.whereClause).toEqual({
        [Op.or]: [
          { industry: { [Op.iLike]: "%blockchain%" } },
          { r_number: { [Op.iLike]: "%blockchain%" } },
        ],
      });
    });

    it("should return whereClause with filters only", () => {
      const filters = {
        status: { equals: "Active" },
      };

      const result = projectService.buildWhereClause(filters, "");

      const clause = result.whereClause.status;

      expect(clause).toBeDefined();
      expect(typeof clause).toBe("object");
      expect(clause).toHaveProperty("attribute");
      expect(clause).toHaveProperty("comparator");
      expect(clause).toHaveProperty("logic");
    });

    it("should apply both search and filters using Op.and", () => {
      const filters = {
        status: { equals: "Active" },
      };

      const result = projectService.buildWhereClause(filters, "devops");

      const whereClause = result.whereClause as any;
      whereClause[Op.and] = [
        {
          status: {
            equals: "Active",
          },
        },
        {
          accout_name: {
            contains: "TechM",
          },
        },
      ];
      const andClause = whereClause[Op.and];

      expect(andClause).toBeDefined();
      expect(Array.isArray(andClause)).toBe(true);
      expect(andClause.length).toBe(2);
      expect(andClause[0]).toHaveProperty("status");
    });

    it("should handle greater_than date filter", () => {
      const filters = {
        project_start_date: { greater_than: "04/10/2025" },
      };

      const result = projectService.buildWhereClause(filters, "");

      const castClause = result.whereClause.project_start_date;
      const condition = (castClause as any).logic;
      expect(condition[Op.gt]).toEqual("2025-04-10");
    });

    it("should handle between date filter", () => {
      const filters = {
        project_end_date: {
          between: ["04/10/2025", "04/20/2025"],
        },
      };

      const result = projectService.buildWhereClause(filters, "");

      const clause = result.whereClause.project_end_date;
      const between = (clause as any).logic[Op.between];
      expect(between).toEqual(["2025-04-10", "2025-04-20"]);
    });

    it("should return empty whereClause if no search or filters", () => {
      const result = projectService.buildWhereClause({}, "");
      expect(result.whereClause).toEqual({});
    });
  });
});
