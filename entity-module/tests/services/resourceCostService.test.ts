import { Sequelize, Op } from 'sequelize';
import ResourceCostService from '../../src/services/resourceCostService';
import * as resourceCostServiceModule from '../../src/services/resourceCostService';
import { ResourceCost } from '../../src/models/resourceCost';
import { ResourceFiscal } from '../../src/models/resourceFiscal';
import { ResourceCostTimeline } from '../../src/models/resourceCostTimeline';
import { ResourceCostHistory } from '../../src/models/resourceCostHistory';
import { Resources } from '../../src/models/resource';
import resourceCostSchemaService from '../../src/services/resourceCostSchemaService';
import SchemaService from '../../src/services/schemaService';
import { HttpStatus, MAIN_SCHEMA_NAME, SCHEMANAME_PREFIX } from '../../src/utils/constants';
import { initOrgSequelize } from '../../src/config/orgDataSource';
import { initMainDbSequelize } from '../../src/config/mainDataSource';
import moment from 'moment';
import Decimal from 'decimal.js';

// Mock dependencies
jest.mock('sequelize');
jest.mock('../../src/utils/azureSecrets');
jest.mock('../../src/services/resourceCostSchemaService');
jest.mock('../../src/services/schemaService');
jest.mock('../../src/config/orgDataSource');
jest.mock('../../src/config/mainDataSource');
jest.mock('../../src/models/resourceCost');
jest.mock('../../src/models/resourceFiscal');
jest.mock('../../src/models/resourceCostTimeline');
jest.mock('../../src/models/resourceCostHistory');
jest.mock('../../src/models/resource');

describe('ResourceCostService', () => {
  let service: ResourceCostService;
  let mockSequelize: any;
  let mockMainDbSequelize: any;
  let getCurrencyThresholdSpy: jest.SpyInstance;
  let getResourceStatusesSpy: jest.SpyInstance;

  beforeAll(() => {
    // Set up spies for module functions
    getCurrencyThresholdSpy = jest.spyOn(resourceCostServiceModule, 'getCurrencyThreshold');
    getResourceStatusesSpy = jest.spyOn(resourceCostServiceModule, 'getResourceStatuses');
    
    // Set default return values for the spied functions
    getCurrencyThresholdSpy.mockResolvedValue(10000);
    getResourceStatusesSpy.mockResolvedValue(new Map([
      ['Active', 'status1'], 
      ['Anomaly', 'status2'], 
      ['Duplicate', 'status3']
    ]));
  });

  beforeEach(() => {
    service = new ResourceCostService();
    
    // Create mock Sequelize objects instead of real instances
    mockSequelize = {
      query: jest.fn(),
      authenticate: jest.fn(),
      close: jest.fn()
    };
    
    mockMainDbSequelize = {
      query: jest.fn(),
      authenticate: jest.fn(),
      close: jest.fn()
    };

    // Reset mocks but keep default implementations
    getResourceStatusesSpy.mockClear();
    getCurrencyThresholdSpy.mockClear();
    
    // Reset to default behavior
    getCurrencyThresholdSpy.mockResolvedValue(10000);
    getResourceStatusesSpy.mockResolvedValue(new Map([
      ['Active', 'status1'], 
      ['Anomaly', 'status2'], 
      ['Duplicate', 'status3']
    ]));
    
    // Clear all other mocks
    (initOrgSequelize as jest.Mock).mockClear();
    (initMainDbSequelize as jest.Mock).mockClear();
    (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockClear();
    (resourceCostSchemaService.validateSchema as jest.Mock).mockClear();
    (ResourceCost.initialize as jest.Mock).mockClear();
    (ResourceCost.findOne as jest.Mock).mockClear();
    (ResourceCost.create as jest.Mock).mockClear();
    (ResourceCost.update as jest.Mock).mockClear();

    (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
    (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
  });

  afterAll(() => {
    // Restore spies
    getCurrencyThresholdSpy.mockRestore();
    getResourceStatusesSpy.mockRestore();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('resourceCostsForFinancialHighlights', () => {
    const defaultParams = {
      page: 1,
      limit: 10,
      search: '',
      filters: {},
      sortBy: 'created_datetime',
      sortOrder: 'ASC',
      accountNumber: 'ACC123',
      fiscalYear: 2023,
      project_rid: 'proj123',
      account_rid: 'acc123',
    };

    it('should return resource costs successfully', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockSchemaName = `${SCHEMANAME_PREFIX}123`; // Fixed: only digits are kept
      const mockResult = {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { projectResourceFiscal: [], count: 0 },
      };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (resourceCostSchemaService.getSortParametersForFinancialHighlights as jest.Mock).mockReturnValue(['created_datetime', 'ASC']);
      (resourceCostSchemaService.processCountryFilter as jest.Mock).mockResolvedValue(null);
      (resourceCostSchemaService.buildSearchConditionForFinancialHighlights as jest.Mock).mockReturnValue({});
      (resourceCostSchemaService.buildFilterConditionsForFinancialHighlights as jest.Mock).mockReturnValue({});
      (resourceCostSchemaService.executeQueriesForFinancialHighlights as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.resourceCostsForFinancialHighlights(
        defaultParams.page,
        defaultParams.limit,
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.project_rid,
        defaultParams.account_rid
      );

      expect(result).toEqual(mockResult);
      expect(resourceCostSchemaService.validateSchema).toHaveBeenCalledWith('ACC123', 'project_resource_fiscal');
      expect(resourceCostSchemaService.executeQueriesForFinancialHighlights).toHaveBeenCalledWith(
        mockSchemaName,
        {},
        {},
        'created_datetime',
        'ASC',
        defaultParams.limit,
        0,
        defaultParams.search,
        defaultParams.account_rid,
        defaultParams.project_rid
      );
    });

    it('should return error if schema does not exist', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(false);
      (resourceCostSchemaService.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Account schema does not exist',
      });

      const result = await service.resourceCostsForFinancialHighlights(
        defaultParams.page,
        defaultParams.limit,
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.project_rid,
        defaultParams.account_rid
      );

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Account schema does not exist',
      });
    });

    it('should return error if database connection is not available', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (resourceCostSchemaService.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Database connection not available',
      });
      (initOrgSequelize as jest.Mock).mockResolvedValue(null);

      const result = await service.resourceCostsForFinancialHighlights(
        defaultParams.page,
        defaultParams.limit,
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.project_rid,
        defaultParams.account_rid
      );

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Database connection not available',
      });
    });

    it('should handle currency filter error', async () => {
      const mockError = { statusCode: HttpStatus.FAILED, message: 'Currency error' };
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (resourceCostSchemaService.processCountryFilter as jest.Mock).mockResolvedValue(mockError);

      const result = await service.resourceCostsForFinancialHighlights(
        defaultParams.page,
        defaultParams.limit,
        defaultParams.search,
        { country: 'US' },
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.project_rid,
        defaultParams.account_rid
      );

      expect(result).toEqual(mockError);
    });

    it('should handle unexpected errors', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const result = await service.resourceCostsForFinancialHighlights(
        defaultParams.page,
        defaultParams.limit,
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.project_rid,
        defaultParams.account_rid
      );

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Unexpected error',
      });
    });
  });

  describe('exportResourceCostsForFinancialHighlights', () => {
    const defaultParams = {
      search: '',
      filters: {},
      sortBy: 'created_datetime',
      sortOrder: 'ASC',
      accountNumber: 'ACC123',
      fiscalYear: 2023,
      project_rid: 'proj123',
      account_rid: 'acc123',
      userId: 'user123',
    };

    it('should export resource costs successfully', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockSchemaName = `${SCHEMANAME_PREFIX}ACC123`;
      const mockResult = {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { financialHighlights: [] },
      };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (resourceCostSchemaService.getSortParametersForFinancialHighlights as jest.Mock).mockReturnValue(['created_datetime', 'ASC']);
      (resourceCostSchemaService.processCountryFilter as jest.Mock).mockResolvedValue(null);
      (resourceCostSchemaService.buildSearchConditionForFinancialHighlights as jest.Mock).mockReturnValue({});
      (resourceCostSchemaService.buildFilterConditionsForFinancialHighlights as jest.Mock).mockReturnValue({});
      (resourceCostSchemaService.exportresourceCostDetailsForFinancialHighlights as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.exportResourceCostsForFinancialHighlights(
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.project_rid,
        defaultParams.account_rid,
        defaultParams.userId
      );

      expect(result).toEqual(mockResult);
      expect(resourceCostSchemaService.validateSchema).toHaveBeenCalledWith('ACC123', 'project_resource_fiscal');
    });

    it('should return error if schema does not exist', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(false);
      (resourceCostSchemaService.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Account schema does not exist',
      });

      const result = await service.exportResourceCostsForFinancialHighlights(
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.project_rid,
        defaultParams.account_rid,
        defaultParams.userId
      );

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Account schema does not exist',
      });
    });
  });

  describe('resourceCostList', () => {
    const defaultParams = {
      page: 1,
      limit: 10,
      search: '',
      filters: {},
      sortBy: 'created_datetime',
      sortOrder: 'ASC',
      accountNumber: 'ACC123',
      fiscalYear: 2023,
      resourceRid: 'res123',
    };

    it('should return resource cost list successfully', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockSchemaName = `${SCHEMANAME_PREFIX}ACC123`;
      const mockResult = {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { resourceCost: [], count: 0 },
      };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (resourceCostSchemaService.getSortParameters as jest.Mock).mockReturnValue(['created_datetime', 'ASC']);
      (resourceCostSchemaService.processCurrencyFilter as jest.Mock).mockResolvedValue(null);
      (resourceCostSchemaService.buildSearchCondition as jest.Mock).mockReturnValue({});
      (resourceCostSchemaService.buildFilterConditions as jest.Mock).mockReturnValue({});
      (resourceCostSchemaService.executeQueries as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.resourceCostList(
        defaultParams.page,
        defaultParams.limit,
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.resourceRid
      );

      expect(result).toEqual(mockResult);
      expect(resourceCostSchemaService.validateSchema).toHaveBeenCalledWith('ACC123', 'resource_cost');
    });

    it('should return error if schema does not exist', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(false);
      (resourceCostSchemaService.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Account schema does not exist',
      });

      const result = await service.resourceCostList(
        defaultParams.page,
        defaultParams.limit,
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.resourceRid
      );

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Account schema does not exist',
      });
    });
  });

  describe('exportResourceCostList', () => {
    const defaultParams = {
      search: '',
      filters: {},
      sortBy: 'created_datetime',
      sortOrder: 'ASC',
      accountNumber: 'ACC123',
      fiscalYear: 2023,
      resourceRid: 'res123',
      userId: 'user123',
    };

    it('should export resource cost list successfully', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockSchemaName = `${SCHEMANAME_PREFIX}ACC123`;
      const mockResult = {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { resourceCost: [] },
      };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (resourceCostSchemaService.getSortParameters as jest.Mock).mockReturnValue(['created_datetime', 'ASC']);
      (resourceCostSchemaService.processCurrencyFilter as jest.Mock).mockResolvedValue(null);
      (resourceCostSchemaService.buildSearchCondition as jest.Mock).mockReturnValue({});
      (resourceCostSchemaService.buildFilterConditions as jest.Mock).mockReturnValue({});
      (resourceCostSchemaService.exportresourceCostDetails as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.exportResourceCostList(
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.resourceRid,
        defaultParams.userId
      );

      expect(result).toEqual(mockResult);
      expect(resourceCostSchemaService.validateSchema).toHaveBeenCalledWith('ACC123', 'resource_cost');
    });
  });

  describe('createResourceCost', () => {
    const defaultResourceCost = {
      eid: 'eid123',
      account_rid: 'acc123',
      resource_type_rid: 'type123',
      resource_rid: 'res123',
      resource_code: 'code123',
      effective_from: '2023-01-01',
      end_date: '2023-12-31',
      salary: 1000,
      deductions: 100,
      insurance: 50,
      bonus: 200,
      resource_cost: 500,
      net_resource_cost: 1150,
      effort_in_hrs: 2000,
      currency_rid: 'cur123',
      accountNumber: 'ACC123',
      resource_number: 'num123',
      comments: 'Test comment',
      fiscal_year: 2023,
    };

    it('should create resource cost successfully', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockSchemaName = `${SCHEMANAME_PREFIX}123`;
      const mockResourceCost = { ...defaultResourceCost, rid: 'rc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      
      // Mock resourceCostServiceModule.getResourceStatuses function
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCost.create as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceFiscal.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceFiscal.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});

      const result = await service.createResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { resourceCost: mockResourceCost },
      });
      expect(ResourceCost.create).toHaveBeenCalled();
      expect(ResourceCostTimeline.create).toHaveBeenCalledWith(expect.objectContaining({
        event_name: 'Create',
        event_status: 'Success',
      }));
    });

    it('should return prompt if duplicate exists and userPreference is empty', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockExistingCost = { rid: 'rc123' };
      const statusMap = new Map([['Active', 'status1'], ['Anomaly', 'status2'], ['Duplicate', 'status3']]);

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockExistingCost);

      const result = await service.createResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.PROMPT,
        message: 'Entered compensation details already exists for the resource. Would you like to create another compensation with same values?',
        data: { resourceCost: mockExistingCost },
      });
    });

    it('should mark as Anomaly if effort_in_hrs exceeds 3000', async () => {
      const anomalyResourceCost = { ...defaultResourceCost, effort_in_hrs: 4000 };
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = { ...anomalyResourceCost, rid: 'rc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      
      // Mock different query responses based on the query string
      (mockMainDbSequelize.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('currency_threshold')) {
          return Promise.resolve([{ currency_threshold: 10000 }]);
        } else if (query.includes('resource_status')) {
          return Promise.resolve([
            { rid: 'status1', resource_status_name: 'Active' },
            { rid: 'status2', resource_status_name: 'Anomaly' },
            { rid: 'status3', resource_status_name: 'Duplicate' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCost.create as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceFiscal.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceFiscal.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});

      await service.createResourceCost(anomalyResourceCost, 'user123', '');

      expect(ResourceCost.create).toHaveBeenCalledWith(expect.objectContaining({
        status_rid: 'status2',
      }));
    });

    it('should handle invalid number format', async () => {
      const invalidResourceCost = { ...defaultResourceCost, salary: 'invalid' as any };
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);

      const result = await service.createResourceCost(invalidResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Invalid number format for salary: invalid',
      });
    });
  });

  describe('updateResourceCost', () => {
    const defaultResourceCost = {
      eid: 'eid123',
      effective_from: '2023-01-01',
      end_date: '2023-12-31',
      salary: 1000,
      deductions: 100,
      insurance: 50,
      bonus: 200,
      resource_cost: 500,
      net_resource_cost: 1150,
      effort_in_hrs: 2000,
      currency_rid: 'cur123',
      resource_rid: 'res123',
      accountNumber: 'ACC123',
      rid: 'rc123',
      fiscal_year: 2023,
      comments: 'Test comment',
      status_rid: 'status1',
    };

    it('should update resource cost successfully', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockSchemaName = `${SCHEMANAME_PREFIX}ACC123`;
      const mockOriginalCost = { ...defaultResourceCost, toJSON: jest.fn().mockReturnValue(defaultResourceCost) };
      const mockUpdatedCost = [{ ...defaultResourceCost, rid: 'rc123' }];
      const statusMap = new Map([['Active', 'status1'], ['Anomaly', 'status2'], ['Duplicate', 'status3']]);

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOriginalCost) // First call - find original record
        .mockResolvedValueOnce(null) // Second call - find existing duplicate records  
        .mockResolvedValueOnce(null); // Third call - find existing cost with same values
      getResourceStatusesSpy.mockResolvedValue(statusMap);
      (ResourceCost.update as jest.Mock).mockResolvedValue([1, mockUpdatedCost]);
      (ResourceFiscal.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceFiscal.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});
      (ResourceCostHistory.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostHistory.create as jest.Mock).mockResolvedValue({});

      const result = await service.updateResourceCost(defaultResourceCost, 'user123', 'yes');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { affectedCounts: 1, resourceCost: mockUpdatedCost[0] },
      });
      expect(ResourceCost.update).toHaveBeenCalled();
      expect(ResourceCostTimeline.create).toHaveBeenCalledWith(expect.objectContaining({
        event_name: 'Update',
        event_status: 'Success',
      }));
    });

    it('should return error if resource cost not found', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.updateResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Resource cost record not found',
      });
    });

    it('should return error if record is marked as Duplicate', async () => {
      const mockOriginalCost = { 
        ...defaultResourceCost, 
        status_rid: 'status3', 
        toJSON: jest.fn().mockReturnValue(defaultResourceCost) 
      };
      const statusMap = new Map([['Active', 'status1'], ['Anomaly', 'status2'], ['Duplicate', 'status3']]);

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockOriginalCost);
      
      // Override the spy for this specific test to ensure status mapping works
      getResourceStatusesSpy.mockResolvedValueOnce(statusMap);

      const result = await service.updateResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: HttpStatus.BAD_REQUEST_MESSAGE,
        errorMessage: 'Please resolve the other duplicate records of this data.',
      });
    });
  });

  describe('resourceCostById', () => {
    it('should retrieve resource cost by ID successfully', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockSchemaName = `${SCHEMANAME_PREFIX}ACC123`;
      const mockResourceCost = {
        rid: 'rc123',
        effective_from: new Date('2023-01-01'),
        end_date: new Date('2023-12-31'),
        currency_rid: 'cur123',
        created_by: 'user1',
        modified_by: 'user2',
        Resource: { resource_startdate: new Date('2023-01-01'), resource_enddate: new Date('2023-12-31'), status_rid: 'status1' },
        toJSON: jest.fn().mockReturnValue({
          rid: 'rc123',
          effective_from: new Date('2023-01-01'),
          end_date: new Date('2023-12-31'),
          currency_rid: 'cur123',
          created_by: 'user1',
          modified_by: 'user2',
          Resource: { resource_startdate: new Date('2023-01-01'), resource_enddate: new Date('2023-12-31'), status_rid: 'status1' },
        }),
      };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockResourceCost);
      (mockMainDbSequelize.query as jest.Mock)
        .mockResolvedValueOnce([{ currency_name: 'USD', currency_code: 'USD', currency_symbol: '$' }])
        .mockResolvedValueOnce([{ status_name: 'Active' }])
        .mockResolvedValueOnce([{ full_name: 'John Doe' }])
        .mockResolvedValueOnce([{ full_name: 'Jane Doe' }])
        .mockResolvedValueOnce([{ status_name: 'Active' }]);

      const result = await service.resourceCostById('rc123', 'ACC123');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCostById: expect.objectContaining({
            currency_name: 'USD',
            currency_code: 'USD',
            currency_symbol: '$',
            status_name: 'Active',
            created_by: 'John Doe',
            modified_by: 'Jane Doe',
          }),
        },
      });
    });

    it('should return error if schema does not exist', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(false);

      const result = await service.resourceCostById('rc123', 'ACC123');

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Account schema does not exist',
      });
    });
  });

  describe('acceptResourceCostStatus', () => {
    it('should update status to Active successfully', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockSchemaName = `${SCHEMANAME_PREFIX}123`;
      const mockResourceCost = { rid: 'rc123', currency_rid: 'cur123', effort_in_hrs: '2000', salary: '1000', resource_cost: '500' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      
      // Mock different query responses based on the query string
      (mockMainDbSequelize.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('currency_threshold')) {
          return Promise.resolve([{ currency_threshold: 10000 }]);
        } else if (query.includes('resource_status')) {
          return Promise.resolve([
            { rid: 'status1', resource_status_name: 'Active' },
            { rid: 'status2', resource_status_name: 'Anomaly' },
            { rid: 'status3', resource_status_name: 'In-Active' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceCost.update as jest.Mock).mockResolvedValue([1]);

      const result = await service.acceptResourceCostStatus('rc123', 'ACC123', 'accept', 'Duplicate');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { updateStatus: [1] },
      });
      expect(ResourceCost.update).toHaveBeenCalledWith(
        { status_rid: 'status1' },
        { where: { rid: 'rc123' } }
      );
    });

    it('should mark as Anomaly if effort_in_hrs exceeds 3000', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = { rid: 'rc123', currency_rid: 'cur123', effort_in_hrs: '4000', salary: '1000', resource_cost: '500' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      
      // Mock different query responses based on the query string
      (mockMainDbSequelize.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('currency_threshold')) {
          return Promise.resolve([{ currency_threshold: 10000 }]);
        } else if (query.includes('resource_status')) {
          return Promise.resolve([
            { rid: 'status1', resource_status_name: 'Active' },
            { rid: 'status2', resource_status_name: 'Anomaly' },
            { rid: 'status3', resource_status_name: 'In-Active' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceCost.update as jest.Mock).mockResolvedValue([1]);

      await service.acceptResourceCostStatus('rc123', 'ACC123', 'accept', 'Duplicate');

      expect(ResourceCost.update).toHaveBeenCalledWith(
        { status_rid: 'status2' },
        { where: { rid: 'rc123' } }
      );
    });
  });

  describe('getResourceCostsByResourceIds', () => {
    it('should fetch resource costs by IDs successfully', async () => {
      const mockAccountNumber = 'ACC123';
      const mockResourceIds = ['res1', 'res2'];
      const mockSchemaName = `${MAIN_SCHEMA_NAME}_${mockAccountNumber.replace(/\D/g, '')}`;
      const mockResults = [{ rid: 'rc1', resource_rid: 'res1' }, { rid: 'rc2', resource_rid: 'res2' }];

      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (mockSequelize.query as jest.Mock).mockResolvedValue(mockResults);

      const result = await service.getResourceCostsByResourceIds(mockAccountNumber, mockResourceIds);

      expect(result).toEqual(mockResults);
      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining(`FROM "${mockSchemaName}".resource_cost`),
        expect.objectContaining({
          replacements: { resourceIds: mockResourceIds },
          type: 'SELECT',
        })
      );
    });

    it('should return empty array for empty resourceIds', async () => {
      const result = await service.getResourceCostsByResourceIds('ACC123', []);

      expect(result).toEqual([]);
      expect(mockSequelize.query).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (mockSequelize.query as jest.Mock).mockRejectedValue(new Error('Query error'));

      await expect(service.getResourceCostsByResourceIds('ACC123', ['res1'])).rejects.toThrow('Query error');
    });
  });

  describe('formatDateForDb', () => {
    it('should format valid date correctly', () => {
      const result = service['formatDateForDb']('2023-01-01');
      expect(result).toBeInstanceOf(Date);
      expect(moment(result).format('YYYY-MM-DD')).toBe('2023-01-01');
    });

    it('should return null for invalid date', () => {
      const result = service['formatDateForDb']('invalid');
      expect(result).toBeNull();
    });

    it('should return null for undefined date', () => {
      const result = service['formatDateForDb'](undefined);
      expect(result).toBeNull();
    });
  });

  describe('fetchUserNames', () => {
    it('should fetch user names successfully', async () => {
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock)
        .mockResolvedValueOnce([{ full_name: 'John Doe' }])
        .mockResolvedValueOnce([{ full_name: 'Jane Doe' }]);

      const result = await service['fetchUserNames']({ created_by: 'user1', modified_by: 'user2' });

      expect(result).toEqual({
        created_by_name: 'John Doe',
        modified_by_name: 'Jane Doe',
      });
    });

    it('should handle errors gracefully', async () => {
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockRejectedValue(new Error('Query error'));

      const result = await service['fetchUserNames']({ created_by: 'user1', modified_by: 'user2' });

      expect(result).toEqual({
        created_by_name: '',
        modified_by_name: '',
      });
    });
  });

  describe('resourceCostServiceModule.getCurrencyThreshold', () => {
    beforeEach(() => {
      // Restore the original function for these tests
      getCurrencyThresholdSpy.mockRestore();
      getCurrencyThresholdSpy = jest.spyOn(resourceCostServiceModule, 'getCurrencyThreshold');
    });

    afterEach(() => {
      // Reset back to default mock behavior after these tests
      getCurrencyThresholdSpy.mockResolvedValue(10000);
    });

    it('should fetch currency threshold with currency_rid', async () => {
      // Mock the sequelize query directly for this test (not using spy)
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValueOnce([{ currency_threshold: 10000 }]);

      const result = await resourceCostServiceModule.getCurrencyThreshold(mockMainDbSequelize, 'cur123');

      expect(result).toBe(10000);
      expect(mockMainDbSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT currency_threshold'),
        expect.objectContaining({ replacements: { currency_rid: 'cur123' } })
      );
    });

    it('should fetch USD threshold if no currency_rid', async () => {
      // Mock the sequelize query to return USD threshold
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValueOnce([{ currency_threshold: 5000 }]);

      const result = await resourceCostServiceModule.getCurrencyThreshold(mockMainDbSequelize);

      expect(result).toBe(5000);
      expect(mockMainDbSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining("currency_code = 'USD'"),
        expect.any(Object)
      );
    });

    it('should return null if no result', async () => {
      // Mock the sequelize query to return empty result
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValueOnce([]);

      const result = await resourceCostServiceModule.getCurrencyThreshold(mockMainDbSequelize, 'cur123');

      expect(result).toBeNull();
    });
  });

  describe('resourceCostServiceModule.getResourceStatuses', () => {
    beforeEach(() => {
      // Restore the original function for these tests
      getResourceStatusesSpy.mockRestore();
      getResourceStatusesSpy = jest.spyOn(resourceCostServiceModule, 'getResourceStatuses');
    });

    afterEach(() => {
      // Reset back to default mock behavior after these tests
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));
    });

    it('should fetch resource statuses successfully', async () => {
      const mockResults = [
        { rid: 'status1', resource_status_name: 'Active' },
        { rid: 'status2', resource_status_name: 'Anomaly' },
        { rid: 'status3', resource_status_name: 'Duplicate' },
      ];
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue(mockResults);

      // Don't override the spy - use the spy's default return value
      const result = await resourceCostServiceModule.getResourceStatuses(mockMainDbSequelize);

      expect(result).toEqual(new Map([
        ['Active', 'status1'],
        ['Anomaly', 'status2'],
        ['Duplicate', 'status3'],
      ]));
    });

    it('should return null on error', async () => {
      (mockMainDbSequelize.query as jest.Mock).mockRejectedValueOnce(new Error('Query error'));

      const result = await resourceCostServiceModule.getResourceStatuses(mockMainDbSequelize);

      expect(result).toBeNull();
    });

    it('should handle non-array results', async () => {
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValueOnce(null);

      const result = await resourceCostServiceModule.getResourceStatuses(mockMainDbSequelize);

      expect(result).toBeNull();
    });

    it('should handle undefined results', async () => {
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await resourceCostServiceModule.getResourceStatuses(mockMainDbSequelize);

      expect(result).toBeNull();
    });
  });

  describe('createResourceCost - Additional edge cases', () => {
    const defaultResourceCost = {
      eid: 'eid123',
      account_rid: 'acc123',
      resource_type_rid: 'type123',
      resource_rid: 'res123',
      resource_code: 'code123',
      effective_from: '2023-01-01',
      end_date: '2023-12-31',
      salary: 1000,
      deductions: 100,
      insurance: 50,
      bonus: 200,
      resource_cost: 500,
      net_resource_cost: 1150,
      effort_in_hrs: 2000,
      currency_rid: 'cur123',
      accountNumber: 'ACC123',
      resource_number: 'num123',
      comments: 'Test comment',
      fiscal_year: 2023,
    };

    it('should handle resource cost schema validation failure', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock)
        .mockResolvedValueOnce(false) // resource_cost table validation fails
        .mockResolvedValueOnce(true);  // resource_cost_timeline table validation passes

      const result = await service.createResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Account schema or resource_cost table could not be created',
      });
    });

    it('should handle timeline table validation failure', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock)
        .mockResolvedValueOnce(true)  // resource_cost table validation passes
        .mockResolvedValueOnce(false); // resource_cost_timeline table validation fails

      const result = await service.createResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Account schema or resource_cost_timeline table could not be created',
      });
    });

    it('should proceed with creation when userPreference is "yes"', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockExistingCost = { rid: 'rc123' };
      const mockResourceCost = { ...defaultResourceCost, rid: 'rc124' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('currency_threshold')) {
          return Promise.resolve([{ currency_threshold: 10000 }]);
        } else if (query.includes('resource_status')) {
          return Promise.resolve([
            { rid: 'status1', resource_status_name: 'Active' },
            { rid: 'status2', resource_status_name: 'Anomaly' },
            { rid: 'status3', resource_status_name: 'Duplicate' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockExistingCost);
      (ResourceCost.create as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceFiscal.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceFiscal.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});

      const result = await service.createResourceCost(defaultResourceCost, 'user123', 'yes');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { resourceCost: mockResourceCost },
      });
    });

    it('should mark as Anomaly if salary exceeds currency threshold', async () => {
      const anomalyResourceCost = { ...defaultResourceCost, salary: 15000 };
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = { ...anomalyResourceCost, rid: 'rc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      
      (mockMainDbSequelize.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('currency_threshold')) {
          return Promise.resolve([{ currency_threshold: 10000 }]);
        } else if (query.includes('resource_status')) {
          return Promise.resolve([
            { rid: 'status1', resource_status_name: 'Active' },
            { rid: 'status2', resource_status_name: 'Anomaly' },
            { rid: 'status3', resource_status_name: 'Duplicate' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCost.create as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceFiscal.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceFiscal.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});

      await service.createResourceCost(anomalyResourceCost, 'user123', '');

      expect(ResourceCost.create).toHaveBeenCalledWith(expect.objectContaining({
        status_rid: 'status2',
      }));
    });

    it('should handle ResourceFiscal update when existing fiscal record exists', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = { ...defaultResourceCost, rid: 'rc123' };
      const mockExistingFiscal = { update: jest.fn().mockResolvedValue({}) };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCost.create as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceFiscal.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceFiscal.findOne as jest.Mock).mockResolvedValue(mockExistingFiscal);
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});

      await service.createResourceCost(defaultResourceCost, 'user123', '');

      expect(mockExistingFiscal.update).toHaveBeenCalled();
    });

    it('should handle timeline creation error gracefully', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = { ...defaultResourceCost, rid: 'rc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCost.create as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceFiscal.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceFiscal.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockRejectedValue(new Error('Timeline error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.createResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { resourceCost: mockResourceCost },
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create timeline entry:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('updateResourceCost - Additional edge cases', () => {
    const defaultResourceCost = {
      eid: 'eid123',
      effective_from: '2023-01-01',
      end_date: '2023-12-31',
      salary: 1000,
      deductions: 100,
      insurance: 50,
      bonus: 200,
      resource_cost: 500,
      net_resource_cost: 1150,
      effort_in_hrs: 2000,
      currency_rid: 'cur123',
      resource_rid: 'res123',
      accountNumber: 'ACC123',
      rid: 'rc123',
      fiscal_year: 2023,
      comments: 'Test comment',
      status_rid: 'status1',
    };

    it('should return prompt when existing cost found and userPreference is empty', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockOriginalCost = { ...defaultResourceCost, toJSON: jest.fn().mockReturnValue(defaultResourceCost) };
      const mockExistingCost = { rid: 'rc456', resource_rid: 'res123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOriginalCost) // First call - find original record
        .mockResolvedValueOnce(null) // Second call - find existing duplicate records  
        .mockResolvedValueOnce(mockExistingCost); // Third call - find existing cost with same values
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));

      const result = await service.updateResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.PROMPT,
        message: 'Compensation details already exists for the resource. Would to like proceed updating with same values ?',
        data: {
          affectedCounts: 0,
          resourceCost: [],
        },
      });
    });

    it('should proceed with update when userPreference is yes and existing cost found', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockOriginalCost = { ...defaultResourceCost, toJSON: jest.fn().mockReturnValue(defaultResourceCost) };
      const mockExistingCost = { rid: 'rc456', resource_rid: 'res123' };
      const mockUpdatedCost = [{ ...defaultResourceCost, rid: 'rc123' }];

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOriginalCost) // First call - find original record
        .mockResolvedValueOnce(null) // Second call - find existing duplicate records  
        .mockResolvedValueOnce(mockExistingCost); // Third call - find existing cost with same values
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));
      (ResourceCost.update as jest.Mock).mockResolvedValue([1, mockUpdatedCost]);
      (ResourceFiscal.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceFiscal.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});
      (ResourceCostHistory.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostHistory.create as jest.Mock).mockResolvedValue({});

      const result = await service.updateResourceCost(defaultResourceCost, 'user123', 'yes');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          affectedCounts: 1,
          resourceCost: mockUpdatedCost[0],
        },
      });
    });

    it('should handle ResourceFiscal update when existing fiscal record exists', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockOriginalCost = { ...defaultResourceCost, toJSON: jest.fn().mockReturnValue(defaultResourceCost) };
      const mockUpdatedCost = [{ ...defaultResourceCost, rid: 'rc123', resource_rid: 'res123' }];
      const mockExistingFiscal = { update: jest.fn().mockResolvedValue({}) };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOriginalCost) // First call - find original record
        .mockResolvedValueOnce(null) // Second call - find existing duplicate records  
        .mockResolvedValueOnce(null); // Third call - find existing cost with same values
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));
      (ResourceCost.update as jest.Mock).mockResolvedValue([1, mockUpdatedCost]);
      (ResourceFiscal.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceFiscal.findOne as jest.Mock).mockResolvedValue(mockExistingFiscal);
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});
      (ResourceCostHistory.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostHistory.create as jest.Mock).mockResolvedValue({});

      const result = await service.updateResourceCost(defaultResourceCost, 'user123', 'yes');

      expect(mockExistingFiscal.update).toHaveBeenCalled();
      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
    });

    it('should handle timeline creation error in catch block', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockOriginalCost = { 
        ...defaultResourceCost, 
        account_rid: 'acc123',
        toJSON: jest.fn().mockReturnValue(defaultResourceCost) 
      };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOriginalCost) // First call - find original record
        .mockResolvedValueOnce(null) // Second call - find existing duplicate records  
        .mockResolvedValueOnce(null); // Third call - find existing cost with same values
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));
      (ResourceCost.update as jest.Mock).mockRejectedValue(new Error('Update failed'));
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockRejectedValue(new Error('Timeline error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.updateResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Update failed',
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create timeline entry for failed update:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('acceptResourceCostStatus - Additional edge cases', () => {
    it('should handle reject action', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = { rid: 'rc123', currency_rid: 'cur123', effort_in_hrs: '2000', salary: '1000', resource_cost: '500' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      
      (mockMainDbSequelize.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('currency_threshold')) {
          return Promise.resolve([{ currency_threshold: 10000 }]);
        } else if (query.includes('resource_status')) {
          return Promise.resolve([
            { rid: 'status1', resource_status_name: 'Active' },
            { rid: 'status2', resource_status_name: 'Anomaly' },
            { rid: 'status3', resource_status_name: 'In-Active' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceCost.update as jest.Mock).mockResolvedValue([1]);

      const result = await service.acceptResourceCostStatus('rc123', 'ACC123', 'reject', 'Duplicate');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { updateStatus: [1] },
      });
      expect(ResourceCost.update).toHaveBeenCalledWith(
        { status_rid: 'status3' },
        { where: { rid: 'rc123' } }
      );
    });

    it('should handle non-Duplicate type', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      
      (mockMainDbSequelize.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('resource_status')) {
          return Promise.resolve([
            { rid: 'status1', resource_status_name: 'Active' },
            { rid: 'status2', resource_status_name: 'Anomaly' },
            { rid: 'status3', resource_status_name: 'In-Active' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.update as jest.Mock).mockResolvedValue([1]);

      const result = await service.acceptResourceCostStatus('rc123', 'ACC123', 'accept', 'Anomaly');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { updateStatus: [1] },
      });
      expect(ResourceCost.update).toHaveBeenCalledWith(
        { status_rid: 'status1' },
        { where: { rid: 'rc123' } }
      );
    });

    it('should mark as Anomaly if resource_cost exceeds currency threshold', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = { rid: 'rc123', currency_rid: 'cur123', effort_in_hrs: '2000', salary: '1000', resource_cost: '15000' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      
      (mockMainDbSequelize.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('currency_threshold')) {
          return Promise.resolve([{ currency_threshold: 10000 }]);
        } else if (query.includes('resource_status')) {
          return Promise.resolve([
            { rid: 'status1', resource_status_name: 'Active' },
            { rid: 'status2', resource_status_name: 'Anomaly' },
            { rid: 'status3', resource_status_name: 'In-Active' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceCost.update as jest.Mock).mockResolvedValue([1]);

      await service.acceptResourceCostStatus('rc123', 'ACC123', 'accept', 'Duplicate');

      expect(ResourceCost.update).toHaveBeenCalledWith(
        { status_rid: 'status2' },
        { where: { rid: 'rc123' } }
      );
    });
  });

  describe('resourceCostById - Additional edge cases', () => {
    it('should return resource cost when found but without currency/status data', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = {
        rid: 'rc123',
        effective_from: new Date('2023-01-01'),
        end_date: new Date('2023-12-31'),
        currency_rid: 'cur123',
        created_by: 'user1',
        modified_by: 'user2',
        Resource: { resource_startdate: new Date('2023-01-01'), resource_enddate: new Date('2023-12-31'), status_rid: 'status1' },
        toJSON: jest.fn().mockReturnValue({
          rid: 'rc123',
          effective_from: new Date('2023-01-01'),
          end_date: new Date('2023-12-31'),
          currency_rid: 'cur123',
          created_by: 'user1',
          modified_by: 'user2',
          Resource: { resource_startdate: new Date('2023-01-01'), resource_enddate: new Date('2023-12-31'), status_rid: 'status1' },
        }),
      };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockResourceCost);
      (resourceCostSchemaService.assignCurrencyRid as jest.Mock).mockResolvedValue(undefined);
      (mockMainDbSequelize.query as jest.Mock)
        .mockResolvedValueOnce([]) // Empty currency result
        .mockResolvedValueOnce([]) // Empty status result
        .mockResolvedValueOnce([{ full_name: 'John Doe' }]) // created_by user
        .mockResolvedValueOnce([{ full_name: 'Jane Doe' }]) // modified_by user
        .mockResolvedValueOnce([{ status_name: 'Active' }]); // resource status

      const result = await service.resourceCostById('rc123', 'ACC123');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCostById: expect.objectContaining({
            currency_name: '',
            currency_code: '',
            currency_symbol: '',
            status_name: '',
            created_by: 'John Doe',
            modified_by: 'Jane Doe',
          }),
        },
      });
    });

    it('should return resource cost when no resource cost found', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.resourceCostById('rc123', 'ACC123');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCostById: null,
        },
      });
    });

    it('should handle missing Resource association', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = {
        rid: 'rc123',
        effective_from: new Date('2023-01-01'),
        end_date: new Date('2023-12-31'),
        currency_rid: 'cur123',
        created_by: 'user1',
        modified_by: 'user2',
        Resource: null,
        toJSON: jest.fn().mockReturnValue({
          rid: 'rc123',
          effective_from: new Date('2023-01-01'),
          end_date: new Date('2023-12-31'),
          currency_rid: 'cur123',
          created_by: 'user1',
          modified_by: 'user2',
          Resource: null,
        }),
      };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockResourceCost);
      (resourceCostSchemaService.assignCurrencyRid as jest.Mock).mockResolvedValue(undefined);
      (mockMainDbSequelize.query as jest.Mock)
        .mockResolvedValueOnce([{ currency_name: 'USD', currency_code: 'USD', currency_symbol: '$' }])
        .mockResolvedValueOnce([{ status_name: 'Active' }])
        .mockResolvedValueOnce([{ full_name: 'John Doe' }])
        .mockResolvedValueOnce([{ full_name: 'Jane Doe' }]);

      const result = await service.resourceCostById('rc123', 'ACC123');

      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
      expect((result.data?.resourceCostById as any)?.Resource).toBeNull();
    });
  });

  describe('createResourceCostHistory - Additional edge cases', () => {
    it('should handle table creation failure gracefully', async () => {
      const originalCost = { rid: 'rc123', salary: 1000 };
      const newCost = { rid: 'rc123', salary: 2000 };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(false);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // This should not throw, should handle errors gracefully
      await service['createResourceCostHistory'](originalCost, newCost, 'user123', 'ACC123');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to create history entries:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle database connection failure gracefully', async () => {
      const originalCost = { rid: 'rc123', salary: 1000 };
      const newCost = { rid: 'rc123', salary: 2000 };

      (initOrgSequelize as jest.Mock).mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // This should not throw, should handle errors gracefully
      await service['createResourceCostHistory'](originalCost, newCost, 'user123', 'ACC123');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to create history entries:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle individual attribute history creation errors', async () => {
      const originalCost = { 
        rid: 'rc123', 
        salary: 1000, 
        effective_from: new Date('2023-01-01'),
        end_date: new Date('2023-12-31') 
      };
      const newCost = { 
        rid: 'rc123', 
        salary: 2000, 
        effective_from: new Date('2023-02-01'),
        end_date: new Date('2024-01-31') 
      };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (ResourceCostHistory.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostHistory.create as jest.Mock).mockRejectedValue(new Error('Create failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Should not throw, should handle errors gracefully
      await service['createResourceCostHistory'](originalCost, newCost, 'user123', 'ACC123');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating history for attribute effective_from:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('exportResourceCostList - Additional edge cases', () => {
    const defaultParams = {
      search: '',
      filters: {},
      sortBy: 'created_datetime',
      sortOrder: 'ASC',
      accountNumber: 'ACC123',
      fiscalYear: 2023,
      resourceRid: 'res123',
      userId: 'user123',
    };

    it('should handle currency filter processing', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockError = { statusCode: HttpStatus.FAILED, message: 'Currency error' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (resourceCostSchemaService.processCurrencyFilter as jest.Mock).mockResolvedValue(mockError);

      const result = await service.exportResourceCostList(
        defaultParams.search,
        { currency: 'USD' },
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.resourceRid,
        defaultParams.userId
      );

      expect(result).toEqual(mockError);
    });

    it('should handle database connection not available', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(null);
      (resourceCostSchemaService.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Database connection not available',
      });

      const result = await service.exportResourceCostList(
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.resourceRid,
        defaultParams.userId
      );

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Database connection not available',
      });
    });
  });

  describe('exportResourceCostsForFinancialHighlights - Additional edge cases', () => {
    const defaultParams = {
      search: '',
      filters: {},
      sortBy: 'created_datetime',
      sortOrder: 'ASC',
      accountNumber: 'ACC123',
      fiscalYear: 2023,
      project_rid: 'proj123',
      account_rid: 'acc123',
      userId: 'user123',
    };

    it('should handle currency filter processing', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockError = { statusCode: HttpStatus.FAILED, message: 'Country filter error' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (resourceCostSchemaService.processCountryFilter as jest.Mock).mockResolvedValue(mockError);

      const result = await service.exportResourceCostsForFinancialHighlights(
        defaultParams.search,
        { country: 'US' },
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.project_rid,
        defaultParams.account_rid,
        defaultParams.userId
      );

      expect(result).toEqual(mockError);
    });

    it('should handle database connection not available', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(null);
      (resourceCostSchemaService.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Database connection not available',
      });

      const result = await service.exportResourceCostsForFinancialHighlights(
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.project_rid,
        defaultParams.account_rid,
        defaultParams.userId
      );

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Database connection not available',
      });
    });
  });

  describe('resourceCostList - Additional edge cases', () => {
    const defaultParams = {
      page: 1,
      limit: 10,
      search: '',
      filters: {},
      sortBy: 'created_datetime',
      sortOrder: 'ASC',
      accountNumber: 'ACC123',
      fiscalYear: 2023,
      resourceRid: 'res123',
    };

    it('should handle currency filter processing', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockError = { statusCode: HttpStatus.FAILED, message: 'Currency error' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (resourceCostSchemaService.processCurrencyFilter as jest.Mock).mockResolvedValue(mockError);

      const result = await service.resourceCostList(
        defaultParams.page,
        defaultParams.limit,
        defaultParams.search,
        { currency: 'USD' },
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.resourceRid
      );

      expect(result).toEqual(mockError);
    });

    it('should handle database connection not available', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue({ accountNumber: 'ACC123', accountId: 'acc123' });
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(null);
      (resourceCostSchemaService.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Database connection not available',
      });

      const result = await service.resourceCostList(
        defaultParams.page,
        defaultParams.limit,
        defaultParams.search,
        defaultParams.filters,
        defaultParams.sortBy,
        defaultParams.sortOrder,
        defaultParams.accountNumber,
        defaultParams.fiscalYear,
        defaultParams.resourceRid
      );

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Database connection not available',
      });
    });
  });

  describe('getOrgSequelize and getMainDbSequelize methods', () => {
    it('should reuse existing sequelize connection', async () => {
      // Access private method via index accessor
      const getOrgSequelize = service['getOrgSequelize'].bind(service);
      const getMainDbSequelize = service['getMainDbSequelize'].bind(service);

      // First call should create connection
      const orgConn1 = await getOrgSequelize();
      const mainConn1 = await getMainDbSequelize();

      // Second call should reuse existing connection
      const orgConn2 = await getOrgSequelize();
      const mainConn2 = await getMainDbSequelize();

      expect(orgConn1).toBe(orgConn2);
      expect(mainConn1).toBe(mainConn2);
    });
  });

  describe('createResourceCost - Error scenarios in try block', () => {
    const defaultResourceCost = {
      eid: 'eid123',
      account_rid: 'acc123',
      resource_type_rid: 'type123',
      resource_rid: 'res123',
      resource_code: 'code123',
      effective_from: '2023-01-01',
      end_date: '2023-12-31',
      salary: 1000,
      deductions: 100,
      insurance: 50,
      bonus: 200,
      resource_cost: 500,
      net_resource_cost: 1150,
      effort_in_hrs: 2000,
      currency_rid: 'cur123',
      accountNumber: 'ACC123',
      resource_number: 'num123',
      comments: 'Test comment',
      fiscal_year: 2023,
    };

    it('should handle ResourceCost.create error in try block', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCost.create as jest.Mock).mockRejectedValue(new Error('Creation failed'));
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});

      const result = await service.createResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Creation failed',
      });
    });

    it('should handle ResourceFiscal error gracefully', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = { ...defaultResourceCost, rid: 'rc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(null);
      (ResourceCost.create as jest.Mock).mockResolvedValue(mockResourceCost);
      (ResourceFiscal.initialize as jest.Mock).mockImplementation(() => { throw new Error('Fiscal error'); });
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.createResourceCost(defaultResourceCost, 'user123', '');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { resourceCost: mockResourceCost },
      });
      expect(consoleSpy).toHaveBeenCalledWith('Error updating resource fiscal:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('updateResourceCost - Error scenarios', () => {
    const defaultResourceCost = {
      eid: 'eid123',
      effective_from: '2023-01-01',
      end_date: '2023-12-31',
      salary: 1000,
      deductions: 100,
      insurance: 50,
      bonus: 200,
      resource_cost: 500,
      net_resource_cost: 1150,
      effort_in_hrs: 2000,
      currency_rid: 'cur123',
      resource_rid: 'res123',
      accountNumber: 'ACC123',
      rid: 'rc123',
      fiscal_year: 2023,
      comments: 'Test comment',
      status_rid: 'status1',
    };

    it('should handle ResourceFiscal error gracefully during update', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockOriginalCost = { ...defaultResourceCost, toJSON: jest.fn().mockReturnValue(defaultResourceCost) };
      const mockUpdatedCost = [{ ...defaultResourceCost, rid: 'rc123', resource_rid: 'res123' }];

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (mockMainDbSequelize.query as jest.Mock).mockResolvedValue([{ currency_threshold: 10000 }]);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOriginalCost) // First call - find original record
        .mockResolvedValueOnce(null) // Second call - find existing duplicate records  
        .mockResolvedValueOnce(null); // Third call - find existing cost with same values
      getResourceStatusesSpy.mockResolvedValue(new Map([
        ['Active', 'status1'], 
        ['Anomaly', 'status2'], 
        ['Duplicate', 'status3']
      ]));
      (ResourceCost.update as jest.Mock).mockResolvedValue([1, mockUpdatedCost]);
      (ResourceFiscal.initialize as jest.Mock).mockImplementation(() => { throw new Error('Fiscal error'); });
      (ResourceCostTimeline.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostTimeline.create as jest.Mock).mockResolvedValue({});
      (ResourceCostHistory.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCostHistory.create as jest.Mock).mockResolvedValue({});

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.updateResourceCost(defaultResourceCost, 'user123', 'yes');

      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
      expect(consoleSpy).toHaveBeenCalledWith('Error updating resource fiscal:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Additional utility method coverage', () => {
    it('should handle edge cases in throwServiceError', () => {
      const error = new Error('Test error');
      const result = service['throwServiceError'](error);
      
      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Test error',
      });
    });
  });

  describe('resourceCostById - query error scenarios', () => {
    it('should handle missing status_rid in Resource association', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };
      const mockResourceCost = {
        rid: 'rc123',
        effective_from: new Date('2023-01-01'),
        end_date: new Date('2023-12-31'),
        currency_rid: 'cur123',
        created_by: 'user1',
        modified_by: 'user2',
        Resource: { 
          resource_startdate: new Date('2023-01-01'), 
          resource_enddate: new Date('2023-12-31'), 
          status_rid: null 
        },
        toJSON: jest.fn().mockReturnValue({
          rid: 'rc123',
          effective_from: new Date('2023-01-01'),
          end_date: new Date('2023-12-31'),
          currency_rid: 'cur123',
          created_by: 'user1',
          modified_by: 'user2',
          Resource: { 
            resource_startdate: new Date('2023-01-01'), 
            resource_enddate: new Date('2023-12-31'), 
            status_rid: null 
          },
        }),
      };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(mockResourceCost);
      (resourceCostSchemaService.assignCurrencyRid as jest.Mock).mockResolvedValue(undefined);
      (mockMainDbSequelize.query as jest.Mock)
        .mockResolvedValueOnce([{ currency_name: 'USD', currency_code: 'USD', currency_symbol: '$' }])
        .mockResolvedValueOnce([{ status_name: 'Active' }])
        .mockResolvedValueOnce([{ full_name: 'John Doe' }])
        .mockResolvedValueOnce([{ full_name: 'Jane Doe' }]);

      const result = await service.resourceCostById('rc123', 'ACC123');

      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
      expect((result.data?.resourceCostById as any)?.Resource?.status_name).toBeUndefined();
    });
  });

  describe('acceptResourceCostStatus - Resource not found scenarios', () => {
    it('should handle case where resource cost is not found for duplicate type', async () => {
      const mockAccount = { accountNumber: 'ACC123', accountId: 'acc123' };

      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockResolvedValue(mockAccount);
      (resourceCostSchemaService.validateSchema as jest.Mock).mockResolvedValue(true);
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);
      
      (mockMainDbSequelize.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('resource_status')) {
          return Promise.resolve([
            { rid: 'status1', resource_status_name: 'Active' },
            { rid: 'status2', resource_status_name: 'Anomaly' },
            { rid: 'status3', resource_status_name: 'In-Active' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      (ResourceCost.initialize as jest.Mock).mockReturnValue(undefined);
      (ResourceCost.findOne as jest.Mock).mockResolvedValue(null); // Resource cost not found
      (ResourceCost.update as jest.Mock).mockResolvedValue([1]);

      const result = await service.acceptResourceCostStatus('rc123', 'ACC123', 'accept', 'Duplicate');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { updateStatus: [1] },
      });
      expect(ResourceCost.update).toHaveBeenCalledWith(
        { status_rid: 'status1' }, // Should default to Active since no resource found
        { where: { rid: 'rc123' } }
      );
    });

    it('should handle acceptResourceCostStatus error', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockRejectedValue(new Error('Service error'));

      const result = await service.acceptResourceCostStatus('rc123', 'ACC123', 'accept', 'Duplicate');

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Service error',
      });
    });
  });

  describe('resourceCostById - exception handling', () => {
    it('should handle error in resourceCostById', async () => {
      (SchemaService.prototype.fetchAccountByNumber as jest.Mock).mockRejectedValue(new Error('Service error'));

      const result = await service.resourceCostById('rc123', 'ACC123');

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Service error',
      });
    });
  });

  describe('Connection caching', () => {
    it('should cache and reuse database connections', async () => {
      // Reset service instance to test connection caching
      service = new ResourceCostService();
      
      // Mock the init functions to return the same instance
      (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
      (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainDbSequelize);

      // Call methods that use both connections
      await service['getOrgSequelize']();
      await service['getMainDbSequelize']();
      
      // Call again to test caching
      await service['getOrgSequelize']();
      await service['getMainDbSequelize']();

      // Should only be called once due to caching
      expect(initOrgSequelize).toHaveBeenCalledTimes(1);
      expect(initMainDbSequelize).toHaveBeenCalledTimes(1);
    });
  });
});