import { Sequelize } from "sequelize";
import ImportGraphqlServices from "../../src/services/importGraphqlServices";
import { initOrgSequelize } from "../../src/config/orgDataSource";
import { initMainDbSequelize } from "../../src/config/mainDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../../src/utils/constants";
import { fetchImportListByRid, listAllImportedDatasQuery, listAllStageFailures, listAllLoadFailures } from "../../src/utils/rawQueries";
import { setInlineForImports } from "../../src/utils/helpers";
import { generateSasUrl } from "../../src/utils/blob";

// Mock dependencies
jest.mock("../../src/config/orgDataSource");
jest.mock("../../src/config/mainDataSource");
jest.mock("../../src/utils/rawQueries");
jest.mock("../../src/utils/helpers");
jest.mock("../../src/utils/blob");

describe("ImportGraphqlServices", () => {
  let service: ImportGraphqlServices;
  let mockOrgSequelize: any;
  let mockMainDbSequelize: any;

  const mockAccountRid = "ACC001";
  const mockImportRid = "IMP001";
  const mockEntityType = "resource";
  const mockFiscalYear = 2024;

  beforeEach(() => {
    // Create mock Sequelize instances
    mockOrgSequelize = {
      query: jest.fn(),
    };
    mockMainDbSequelize = {
      query: jest.fn(),
    };

    // Mock the initialization functions
    (initOrgSequelize as jest.Mock).mockResolvedValue(mockOrgSequelize);
    (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);

    // Mock raw queries
    (rawQueries.fetchParentAccount as jest.Mock) = jest.fn().mockReturnValue("SELECT query");
    (rawQueries.fetchSchemaName as jest.Mock) = jest.fn().mockReturnValue("test_schema");
    (rawQueries.fetchUserDetailsById as jest.Mock) = jest.fn().mockReturnValue("SELECT user query");
    (rawQueries.updateImport as jest.Mock) = jest.fn().mockReturnValue("UPDATE query");

    // Mock utility functions
    (listAllImportedDatasQuery as jest.Mock).mockReturnValue("SELECT imports query");
    (listAllStageFailures as jest.Mock).mockReturnValue("SELECT stage failures query");
    (listAllLoadFailures as jest.Mock).mockReturnValue("SELECT load failures query");
    (fetchImportListByRid as jest.Mock).mockReturnValue("SELECT import by rid query");
    (setInlineForImports as jest.Mock).mockReturnValue({ updated: "data" });
    (generateSasUrl as jest.Mock).mockResolvedValue("https://mocked-sas-url.com");

    service = new ImportGraphqlServices();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listAllImportedData", () => {
    const mockFilters = { status: "active" };
    const page = 1;
    const limit = 10;
    const sort = "r_number";
    const sortBy = "asc";

    it("should return imported data successfully", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockImportResult = [
        [
          { id: 1, name: "Import 1" },
          { id: 2, name: "Import 2" },
        ],
      ];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockImportResult);

      const result = await service.listAllImportedData(
        page,
        limit,
        sort,
        sortBy,
        mockAccountRid,
        mockFilters,
        mockFiscalYear
      );

      expect(mockMainDbSequelize.query).toHaveBeenCalledWith("SELECT query");
      expect(mockOrgSequelize.query).toHaveBeenCalledWith("SELECT imports query");
      expect(rawQueries.fetchParentAccount).toHaveBeenCalledWith(mockAccountRid, mockMainDbSequelize);
      expect(rawQueries.fetchSchemaName).toHaveBeenCalledWith("12345");
      expect(listAllImportedDatasQuery).toHaveBeenCalledWith(
        page,
        limit,
        sort,
        sortBy,
        mockAccountRid,
        mockFilters,
        "test_schema",
        false,
        mockFiscalYear
      );

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        data: mockImportResult[0],
      });
    });

    it("should return NOT_FOUND when no data exists", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockImportResult = [[]];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockImportResult);

      const result = await service.listAllImportedData(
        page,
        limit,
        sort,
        sortBy,
        mockAccountRid,
        mockFilters,
        mockFiscalYear
      );

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      });
    });

    it("should disable pagination when imported_by filter is present", async () => {
      const filtersWithImportedBy = { ...mockFilters, imported_by: "user123" };
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockImportResult = [[{ id: 1, name: "Import 1" }]];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockImportResult);

      await service.listAllImportedData(
        page,
        limit,
        sort,
        sortBy,
        mockAccountRid,
        filtersWithImportedBy,
        mockFiscalYear
      );

      expect(listAllImportedDatasQuery).toHaveBeenCalledWith(
        page,
        limit,
        sort,
        sortBy,
        mockAccountRid,
        mockFilters, // imported_by should be removed
        "test_schema",
        true, // pagination disabled
        mockFiscalYear
      );
    });
  });

  describe("listAllStageFailures", () => {
    it("should return stage failures successfully", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockStageFailuresResult = [
        [
          { id: 1, error: "Validation failed" },
          { id: 2, error: "Data format error" },
        ],
      ];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockStageFailuresResult);

      const result = await service.listAllStageFailures(mockAccountRid, mockImportRid, mockEntityType);

      expect(mockMainDbSequelize.query).toHaveBeenCalledWith("SELECT query");
      expect(mockOrgSequelize.query).toHaveBeenCalledWith("SELECT stage failures query");
      expect(rawQueries.fetchParentAccount).toHaveBeenCalledWith(mockAccountRid, mockMainDbSequelize);
      expect(rawQueries.fetchSchemaName).toHaveBeenCalledWith("12345");
      expect(listAllStageFailures).toHaveBeenCalledWith("test_schema", mockImportRid, mockEntityType);

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        data: mockStageFailuresResult[0],
      });
    });

    it("should return NOT_FOUND when no stage failures exist", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockStageFailuresResult = [[]];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockStageFailuresResult);

      const result = await service.listAllStageFailures(mockAccountRid, mockImportRid, mockEntityType);

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      });
    });
  });

  describe("listAllLoadFailures", () => {
    it("should return load failures successfully", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockLoadFailuresResult = [
        [
          { id: 1, error: "Database connection failed" },
          { id: 2, error: "Constraint violation" },
        ],
      ];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockLoadFailuresResult);

      const result = await service.listAllLoadFailures(mockAccountRid, mockImportRid, mockEntityType);

      expect(mockMainDbSequelize.query).toHaveBeenCalledWith("SELECT query");
      expect(mockOrgSequelize.query).toHaveBeenCalledWith("SELECT load failures query");
      expect(rawQueries.fetchParentAccount).toHaveBeenCalledWith(mockAccountRid, mockMainDbSequelize);
      expect(rawQueries.fetchSchemaName).toHaveBeenCalledWith("12345");
      expect(listAllLoadFailures).toHaveBeenCalledWith("test_schema", mockImportRid, mockEntityType);

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        data: mockLoadFailuresResult[0],
      });
    });

    it("should return NOT_FOUND when no load failures exist", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockLoadFailuresResult = [[]];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockLoadFailuresResult);

      const result = await service.listAllLoadFailures(mockAccountRid, mockImportRid, mockEntityType);

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      });
    });
  });

  describe("fetchUserDetails", () => {
    it("should return user details for valid user RIDs", async () => {
      const userRids = ["USER001", "USER002"];
      const mockUserDetails = [
        { rid: "USER001", first_name: "John", last_name: "Doe" },
        { rid: "USER002", first_name: "Jane", last_name: "Smith" },
      ];

      mockMainDbSequelize.query.mockResolvedValueOnce([mockUserDetails]);

      const result = await service.fetchUserDetails(userRids);

      expect(mockMainDbSequelize.query).toHaveBeenCalledWith(
        `SELECT rid, first_name, last_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (?,?)`,
        { replacements: userRids }
      );
      expect(result).toEqual(mockUserDetails);
    });

    it("should return empty array for empty user RIDs", async () => {
      const result = await service.fetchUserDetails([]);

      expect(result).toEqual([]);
      expect(mockMainDbSequelize.query).not.toHaveBeenCalled();
    });
  });

  describe("fetchImportById", () => {
    it("should return import details successfully", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockImportResult = [
        [
          {
            imports: {
              rid: mockImportRid,
              document_url: "original-url",
              imported_on: "2024-01-01T00:00:00.000Z",
              imported_by: "USER001",
            },
          },
        ],
      ];
      const mockUserDetailsResult = [[{ imported_by: { first_name: "John", last_name: "Doe" } }]];

      mockMainDbSequelize.query
        .mockResolvedValueOnce(mockParentAccountResult)
        .mockResolvedValueOnce(mockUserDetailsResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockImportResult);

      const result = await service.fetchImportById(mockAccountRid, mockImportRid);

      expect(mockMainDbSequelize.query).toHaveBeenCalledTimes(2);
      expect(mockOrgSequelize.query).toHaveBeenCalledWith("SELECT import by rid query");
      expect(generateSasUrl).toHaveBeenCalledWith("original-url");
      expect(rawQueries.fetchUserDetailsById).toHaveBeenCalledWith("USER001");

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        data: {
          imports: {
            rid: mockImportRid,
            document_url: "https://mocked-sas-url.com",
            imported_on: "2024-01-01T00:00:00.000Z",
            imported_by: { first_name: "John", last_name: "Doe" },
          },
        },
      });
    });

    it("should return NOT_FOUND when import does not exist", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockImportResult = [[]];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockImportResult);

      const result = await service.fetchImportById(mockAccountRid, mockImportRid);

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      });
    });
  });

  describe("inlineEditImportList", () => {
    const mockEditData = {
      account_rid: mockAccountRid,
      rid: mockImportRid,
      status: "updated",
    };

    it("should update import successfully", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockExistingImportData = {
        statusCode: HttpStatus.SUCCESS,
        data: {
          imports: {
            rid: mockImportRid,
            status: "original",
          },
        },
      };
      const mockUpdatedImportData = {
        statusCode: HttpStatus.SUCCESS,
        data: {
          imports: {
            rid: mockImportRid,
            status: "updated",
          },
        },
      };

      mockMainDbSequelize.query.mockResolvedValue(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValue([{ affectedRows: 1 }]);

      // Mock the fetchImportById calls
      const fetchImportByIdSpy = jest.spyOn(service, "fetchImportById");
      fetchImportByIdSpy
        .mockResolvedValueOnce(mockExistingImportData)
        .mockResolvedValueOnce(mockUpdatedImportData);

      const result = await service.inlineEditImportList(mockEditData);

      expect(fetchImportByIdSpy).toHaveBeenCalledTimes(2);
      expect(setInlineForImports).toHaveBeenCalledWith(mockExistingImportData.data, mockEditData);
      expect(rawQueries.updateImport).toHaveBeenCalledWith("test_schema", { updated: "data" }, mockImportRid);

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.importUpdatedSuccess,
        data: mockUpdatedImportData.data,
      });

      fetchImportByIdSpy.mockRestore();
    });

    it("should return BAD_REQUEST when no data to update", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockExistingImportData = {
        statusCode: HttpStatus.SUCCESS,
        data: {
          imports: {
            rid: mockImportRid,
            status: "original",
          },
        },
      };

      mockMainDbSequelize.query.mockResolvedValue(mockParentAccountResult);
      (setInlineForImports as jest.Mock).mockReturnValue(null);

      const fetchImportByIdSpy = jest.spyOn(service, "fetchImportById");
      fetchImportByIdSpy.mockResolvedValueOnce(mockExistingImportData);

      const result = await service.inlineEditImportList(mockEditData);

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: STATUS_MESSAGE.noDataToUpdate,
        data: null,
      });

      fetchImportByIdSpy.mockRestore();
    });
  });

  describe("Database Connection Management", () => {
    it("should reuse existing org sequelize connection", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockImportResult = [[{ id: 1, name: "Import 1" }]];

      mockMainDbSequelize.query.mockResolvedValue(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValue(mockImportResult);

      // First call
      await service.listAllImportedData(1, 10, "r_number", "asc", mockAccountRid, {}, mockFiscalYear);
      const firstCallCount = (initOrgSequelize as jest.Mock).mock.calls.length;

      // Second call
      await service.listAllImportedData(1, 10, "r_number", "asc", mockAccountRid, {}, mockFiscalYear);
      const secondCallCount = (initOrgSequelize as jest.Mock).mock.calls.length;

      // Should not initialize again
      expect(secondCallCount).toBe(firstCallCount);
    });

    it("should reuse existing main db sequelize connection", async () => {
      const userRids = ["USER001"];
      const mockUserDetails = [
        { rid: "USER001", first_name: "John", last_name: "Doe" }
      ];

      mockMainDbSequelize.query.mockResolvedValue([mockUserDetails]);

      // First call
      await service.fetchUserDetails(userRids);
      const firstCallCount = (initMainDbSequelize as jest.Mock).mock.calls.length;

      // Second call
      await service.fetchUserDetails(["USER002"]);
      const secondCallCount = (initMainDbSequelize as jest.Mock).mock.calls.length;

      // Should not initialize again
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors for org sequelize", async () => {
      (initOrgSequelize as jest.Mock).mockRejectedValue(new Error("Connection failed"));

      await expect(
        service.listAllImportedData(1, 10, "r_number", "asc", mockAccountRid, {}, mockFiscalYear)
      ).rejects.toThrow("Connection failed");
    });

    it("should handle database connection errors for main db sequelize", async () => {
      (initMainDbSequelize as jest.Mock).mockRejectedValue(new Error("Main DB connection failed"));

      await expect(service.fetchUserDetails(["USER001"])).rejects.toThrow("Main DB connection failed");
    });

    it("should handle query execution errors", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      mockMainDbSequelize.query.mockResolvedValue(mockParentAccountResult);
      mockOrgSequelize.query.mockRejectedValue(new Error("Query execution failed"));

      await expect(
        service.listAllImportedData(1, 10, "r_number", "asc", mockAccountRid, {}, mockFiscalYear)
      ).rejects.toThrow("Query execution failed");
    });

    it("should handle SAS URL generation errors", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockImportResult = [
        [
          {
            imports: {
              rid: mockImportRid,
              document_url: "original-url",
              imported_on: "2024-01-01T00:00:00.000Z",
              imported_by: "USER001",
            },
          },
        ],
      ];
      const mockUserDetailsResult = [[{ imported_by: { first_name: "John", last_name: "Doe" } }]];

      mockMainDbSequelize.query
        .mockResolvedValueOnce(mockParentAccountResult)
        .mockResolvedValueOnce(mockUserDetailsResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockImportResult);
      (generateSasUrl as jest.Mock).mockRejectedValue(new Error("SAS URL generation failed"));

      await expect(service.fetchImportById(mockAccountRid, mockImportRid)).rejects.toThrow(
        "SAS URL generation failed"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty filters object", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockImportResult = [[{ id: 1, name: "Import 1" }]];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockImportResult);

      const result = await service.listAllImportedData(1, 10, "r_number", "asc", mockAccountRid, {}, 0);

      expect(listAllImportedDatasQuery).toHaveBeenCalledWith(
        1,
        10,
        "r_number",
        "asc",
        mockAccountRid,
        {},
        "test_schema",
        false,
        0
      );
      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
    });

    it("should handle null import data in fetchImportById", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockImportResult = [[null]];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockImportResult);

      const result = await service.fetchImportById(mockAccountRid, mockImportRid);

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      });
    });

    it("should handle zero fiscal year", async () => {
      const mockParentAccountResult = [[{ r_number: "12345" }]];
      const mockImportResult = [[{ id: 1, name: "Import 1" }]];

      mockMainDbSequelize.query.mockResolvedValueOnce(mockParentAccountResult);
      mockOrgSequelize.query.mockResolvedValueOnce(mockImportResult);

      await service.listAllImportedData(1, 10, "r_number", "asc", mockAccountRid, {}, 0);

      expect(listAllImportedDatasQuery).toHaveBeenCalledWith(
        1,
        10,
        "r_number",
        "asc",
        mockAccountRid,
        {},
        "test_schema",
        false,
        0
      );
    });
  });
});
