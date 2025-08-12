// Mock Azure dependencies before any imports
process.env.KEY_VAULT_URI = 'https://mock-keyvault.vault.azure.net/';
process.env.NODE_ENV = 'test';

import { ProjectInjestionTaskService } from '../../../src/services/projectTask/projectTaskService';
import { ProjectTaskSchemaService } from '../../../src/services/projectTask/schemaService';
import { ProjectResourceSchemaService } from '../../../src/services/projectResource/schemaService';
import { HttpStatus } from '../../../src/utils/constants';
import { ICreateProjectTask, IUpdateProjectTask } from '../../../src/utils/types';

// Mock Azure dependencies
jest.mock('../../../src/utils/azureSecrets', () => ({
  getSecret: jest.fn().mockResolvedValue('mocked-secret'),
}));

jest.mock('../../../src/config/orgDataSource', () => ({
  initOrgSequelize: jest.fn().mockResolvedValue({
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    }),
  }),
}));

jest.mock('../../../src/config/mainDataSource', () => ({
  initMainDbSequelize: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([]),
  }),
}));

// Mock Decimal.js completely
// Update the Decimal mock at the top of the file
jest.mock('decimal.js', () => {
  const mockDecimalInstance = {
    isZero: jest.fn().mockReturnValue(false),
    isNaN: jest.fn().mockReturnValue(false),
    plus: jest.fn().mockImplementation(function(this: any, other) {
      // Simulate addition
      const thisValue = Number(this._value || 0);
      const otherValue = Number(other._value || other || 0);
      const sum = thisValue + otherValue;
      return {
        gt: jest.fn().mockImplementation((limit) => sum > limit),
        toString: jest.fn().mockReturnValue(String(sum)),
        plus: jest.fn().mockImplementation((another) => {
          const anotherValue = Number(another._value || another || 0);
          return {
            gt: jest.fn().mockImplementation((limit) => (sum + anotherValue) > limit),
            toString: jest.fn().mockReturnValue(String(sum + anotherValue))
          };
        })
      };
    }),
    div: jest.fn().mockImplementation(function(this: any, divisor) {
      // Simulate division
      const thisValue = Number(this._value || 0);
      const divisorValue = Number(divisor || 1);
      const result = thisValue / divisorValue;
      return {
        plus: jest.fn().mockImplementation((other) => {
          const otherValue = Number(other._value || other || 0);
          return {
            gt: jest.fn().mockImplementation((limit) => (result + otherValue) > limit),
            toString: jest.fn().mockReturnValue(String(result + otherValue))
          };
        }),
        gt: jest.fn().mockImplementation((limit) => result > limit),
        toString: jest.fn().mockReturnValue(String(result))
      };
    }),
    gt: jest.fn().mockImplementation(function(this: any, limit) {
      return Number(this._value || 0) > limit;
    }),
    toNumber: jest.fn().mockImplementation(function(this: any) {
      return Number(this._value || 0);
    }),
    toString: jest.fn().mockImplementation(function(this: any) {
      return String(this._value || 0);
    }),
    _value: 0
  };

  return jest.fn().mockImplementation((value) => {
    // Return a mock instance with all necessary methods
    return {
      ...mockDecimalInstance,
      _value: value,
      // Override specific behaviors based on the input value
      isZero: jest.fn().mockReturnValue(value === 0 || value === '0'),
      isNaN: jest.fn().mockReturnValue(isNaN(value)),
    };
  });
});

// Mock dependencies
jest.mock('../../../src/services/projectTask/schemaService');
jest.mock('../../../src/services/projectResource/schemaService');

describe('ProjectInjestionTaskService - Comprehensive Coverage', () => {
  let service: ProjectInjestionTaskService;
  let mockProjectTaskSchema: jest.Mocked<ProjectTaskSchemaService>;
  let mockProjectResourceSchema: jest.Mocked<ProjectResourceSchemaService>;
  let mockSequelize: any;
  let mockTransaction: any;

  const validTaskData: ICreateProjectTask = {
    start_date: '2023-01-01',
    end_date: '2023-01-03',
    total_hours_pro_task: 24,
    project_fiscal_rid: 'proj-1',
    account_rid: 'acc-1',
    resource_code: 'RES001',
    resource_id: 'res-1',
    fiscal_year: 2023,
    country_rid: 'country-1',
    created_by: 'user-1',
  };

  const validUpdateData: IUpdateProjectTask = {
    ...validTaskData,
    project_task_rid: 'task-1',
  };

  const mockResource = {
    resource_rid: 'res-1',
    resource_code: 'RC001',
    account_rid: 'acc-1'
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    mockSequelize = {
      transaction: jest.fn().mockResolvedValue(mockTransaction),
    };

    // Set up working mocks
    mockProjectTaskSchema = {
      getSequelize: jest.fn().mockResolvedValue(mockSequelize),
      createProjectTaskTables: jest.fn().mockResolvedValue(undefined),
      addProjectTask: jest.fn().mockResolvedValue({ rid: 'task-1' }),
      addProjectTaskTimeline: jest.fn().mockResolvedValue(undefined),
      startAggregation: jest.fn().mockResolvedValue(undefined),
      getExistingEffortInProjectTask: jest.fn().mockResolvedValue([]),
      updateProjectTask: jest.fn().mockResolvedValue([1]),
      addProjctTaskHistory: jest.fn().mockResolvedValue(undefined),
      startUpdateAggregation: jest.fn().mockResolvedValue(undefined),
      validateProjectTaskById: jest.fn().mockResolvedValue({ rid: 'task-1' }),
    } as any;

    mockProjectResourceSchema = {
      fetchValidAccountNumberById: jest.fn().mockResolvedValue({ 
        accountNumber: 'ACC123', 
        accountId: 'acc-1', 
        accountName: 'Test Account' 
      }),
      validateResourceByCode: jest.fn().mockResolvedValue({ rid: 'res-1', resource_code: 'RES001' }),
      validateProjectFiscalById: jest.fn().mockResolvedValue({ rid: 'proj-1' }),
      validateResourceById: jest.fn().mockResolvedValue({ rid: 'res-1', resource_code: 'RES001' }),
    } as any;

    service = new ProjectInjestionTaskService();
    service.projectTaskSchema = mockProjectTaskSchema;
    service['projectResourceSchema'] = mockProjectResourceSchema;
  });

  describe('Core Functionality', () => {
    it('should create a project task successfully', async () => {
      const result = await service.createProjectTask(validTaskData, 'user-1');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { projectTask: { rid: 'task-1' } },
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should update a project task successfully', async () => {
      const result = await service.updateProjectTask(validUpdateData, 'user-1');

      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { projectTask: [1] },
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle validation errors gracefully', async () => {
      mockProjectResourceSchema.fetchValidAccountNumberById.mockResolvedValue({ 
        accountNumber: null, 
        accountId: 'acc-1', 
        accountName: 'Test Account' 
      });

      const result = await service.createProjectTask(validTaskData, 'user-1');

      expect(result).toEqual({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid account ID',
        errorMessage: 'Invalid account ID',
      });
    });

    it('should handle transaction errors', async () => {
      mockProjectTaskSchema.addProjectTask.mockRejectedValue(new Error('DB Error'));

      await expect(service.createProjectTask(validTaskData, 'user-1')).rejects.toMatchObject({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'DB Error',
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should run aggregation after inline update', async () => {
      const projectTaskData = {
        rid: 'task-1',
        userId: 'user-1',
        account_rid: 'acc-1',
        resource_code: 'RES001',
        project_fiscal_rid: 'proj-1',
      };
      const fullTaskData = { total_hours_pro_task: 10 } as any;

      await service.runAggregationAfterInlineUpdate('ACC123', projectTaskData, fullTaskData);

      expect(mockProjectTaskSchema.startUpdateAggregation).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should validate project task inputs', async () => {
      const input = {
        account_rid: 'acc-1',
        resource_code: 'RES001',
        project_fiscal_rid: 'proj-1',
        projectResourceSchema: mockProjectResourceSchema,
      };

      const result = await service.validateProjectTaskInputs(input);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('accountNumber', 'ACC123');
    });

    it('should validate project task update inputs', async () => {
      const input = {
        account_rid: 'acc-1',
        resource_code: 'RES001',
        project_fiscal_rid: 'proj-1',
        project_task_rid: 'task-1',
        projectResourceSchema: mockProjectResourceSchema,
        projectTaskSchema: mockProjectTaskSchema,
      };

      const result = await service.validateProjectTaskUpdateInputs(input);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('accountNumber', 'ACC123');
    });

    it('should format service errors correctly', () => {
      const error = new Error('Test Error');
      const result = service['throwServiceError'](error);

      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Test Error',
      });
    });

    it('should validate per day effort limits', () => {
      const existingTasks = [] as any[];
      const newEffort = { div: jest.fn().mockReturnValue({ plus: jest.fn().mockReturnValue({ gt: jest.fn().mockReturnValue(false) }) }) } as any;
      const start = new Date('2023-01-01');
      const end = new Date('2023-01-01');

      const result = service['validatePerDayEffortLimit'](existingTasks, newEffort, start, end);

      expect(result).toEqual({ success: true });
    });
  });

  describe('Error Handling Coverage', () => {
    it('should handle invalid resource code', async () => {
      mockProjectResourceSchema.validateResourceByCode.mockResolvedValue(null);

      const result = await service.createProjectTask(validTaskData, 'user-1');

      expect(result).toEqual({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Invalid resource code: resource doesn't exist",
      });
    });

    it('should handle project validation failure', async () => {
      mockProjectResourceSchema.validateProjectFiscalById.mockRejectedValue(new Error('Project not found'));

      const result = await service.createProjectTask(validTaskData, 'user-1');

      expect(result).toEqual({
        success: false,
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Project not found',
      });
    });

    it('should handle invalid task ID in update', async () => {
      mockProjectTaskSchema.validateProjectTaskById.mockRejectedValue(new Error('Task not found'));

      const result = await service.updateProjectTask(validUpdateData, 'user-1');

      expect(result).toEqual({
        success: false,
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Task not found',
      });
    });

    it('should handle aggregation errors', async () => {
      const projectTaskData = {
        rid: 'task-1',
        userId: 'user-1',
        account_rid: 'acc-1',
        resource_code: 'RES001',
        project_fiscal_rid: 'proj-1',
      };
      const fullTaskData = { total_hours_pro_task: 10 } as any;

      mockProjectTaskSchema.startUpdateAggregation.mockRejectedValue(new Error('Aggregation failed'));

      await expect(service.runAggregationAfterInlineUpdate('ACC123', projectTaskData, fullTaskData))
        .rejects.toThrow('Aggregation failed');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should skip aggregation when no relevant fields updated', async () => {
      const projectTaskData = { rid: 'task-1', userId: 'user-1', account_rid: 'acc-1' };
      const fullTaskData = { total_hours_pro_task: 10 } as any;

      await service.runAggregationAfterInlineUpdate('ACC123', projectTaskData, fullTaskData);

      expect(mockProjectTaskSchema.startUpdateAggregation).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should handle validation error in input validation', async () => {
      const invalidSchema = {
        fetchValidAccountNumberById: jest.fn().mockRejectedValue(new Error('Validation failed')),
      } as any;

      const input = {
        account_rid: 'acc-1',
        resource_code: 'RES001',
        project_fiscal_rid: 'proj-1',
        projectResourceSchema: invalidSchema,
      };

      const result = await service.validateProjectTaskInputs(input);

      expect(result).toEqual({
        success: false,
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Validation failed',
      });
    });
  });

  describe('Edge Cases and Complete Coverage', () => {
    it('should handle zero effort values', async () => {
      const zeroEffortTask = { ...validTaskData, total_hours_pro_task: 0 };

      const result = await service.createProjectTask(zeroEffortTask, 'user-1');

      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
    });

    it('should handle NaN effort values', async () => {
      // Mock Decimal to return isNaN = true
      const mockDecimalNaN = jest.fn().mockImplementation(() => ({
        isZero: jest.fn().mockReturnValue(false),
        isNaN: jest.fn().mockReturnValue(true), // This should trigger the NaN branch
        plus: jest.fn().mockReturnValue({ gt: jest.fn().mockReturnValue(false) }),
        div: jest.fn().mockReturnValue({ plus: jest.fn().mockReturnValue({ gt: jest.fn().mockReturnValue(false) }) }),
        gt: jest.fn().mockReturnValue(false),
      }));
      
      const originalDecimal = (global as any).Decimal;
      (global as any).Decimal = mockDecimalNaN;

      const nanEffortTask = { ...validTaskData, total_hours_pro_task: 'invalid' };
      const result = await service.createProjectTask(nanEffortTask as any, 'user-1');

      (global as any).Decimal = originalDecimal;
      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
    });

    it('should handle missing start_date with end_date', async () => {
      const missingStartDateTask = { 
        ...validTaskData, 
        start_date: undefined,
        end_date: '2023-01-03'
      };

      const result = await service.createProjectTask(missingStartDateTask as any, 'user-1');

      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
    });

    it('should handle effort exceeding duration limits with dates', async () => {
      // Mock the validatePerDayEffortLimit to return failure to trigger the error
      jest.spyOn(service as any, 'validatePerDayEffortLimit').mockReturnValue({
        success: false,
        errorMessage: 'Effort cannot exceed the total hours in the duration'
      });

      const taskWithDateRange = {
        ...validTaskData,
        start_date: '2023-01-01',
        end_date: '2023-01-03',
        total_hours_pro_task: 100, // High effort to trigger validation
      };

      const result = await service.createProjectTask(taskWithDateRange, 'user-1');

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation Error',
        errorMessage: 'Effort cannot exceed the total hours in the duration',
      });
    });
    });

    it('should handle effort exceeding single day limit', async () => {
  // Mock Decimal to simulate effort > 24 hours
  const originalDecimal = (global as any).Decimal;
  (global as any).Decimal = jest.fn().mockImplementation((value) => {
    return {
      isZero: jest.fn().mockReturnValue(false),
      isNaN: jest.fn().mockReturnValue(false),
      gt: jest.fn().mockImplementation((limit) => Number(value) > limit),
      plus: jest.fn().mockReturnValue({
        gt: jest.fn().mockReturnValue(true), // Always say effort > 24
        toString: jest.fn().mockReturnValue('30')
      }),
      div: jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('30')
      }),
      toString: jest.fn().mockReturnValue(String(value))
    };
  });

  const singleDayTask = {
    ...validTaskData,
    start_date: '2023-01-01',
    end_date: undefined, // Single day task
    total_hours_pro_task: 30, // More than 24 hours
  };

  const result = await service.createProjectTask(singleDayTask, 'user-1');

  (global as any).Decimal = originalDecimal;
  expect(result).toEqual({
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Validation Error',
    errorMessage: 'Effort cannot exceed 24 hours for the day',
  });
});

it('should handle effort limit violations', () => {
  const existingTasks = [
    { start_date: new Date('2023-01-01'), end_date: new Date('2023-01-01'), total_hours_pro_task: '15' }
  ] as any[];
  
  const mockNewEffort = {
    div: jest.fn().mockReturnValue({
      plus: jest.fn().mockReturnValue({
        gt: jest.fn().mockReturnValue(true), // Simulate > 24
        toString: jest.fn().mockReturnValue('27')
      }),
      toString: jest.fn().mockReturnValue('12')
    })
  } as any;

  const result = service['validatePerDayEffortLimit'](
    existingTasks, 
    mockNewEffort, 
    new Date('2023-01-01'), 
    new Date('2023-01-01')
  );
  
  expect(result.success).toBe(false);
  expect(result.errorMessage).toContain('Effort exceeds 24 hours on');
});

it('should handle update with single day effort exceeding limit', async () => {
  // Mock Decimal to simulate effort > 24 hours
  const originalDecimal = (global as any).Decimal;
  (global as any).Decimal = jest.fn().mockImplementation((value) => {
    return {
      isZero: jest.fn().mockReturnValue(false),
      isNaN: jest.fn().mockReturnValue(false),
      gt: jest.fn().mockImplementation((limit) => Number(value) > limit),
      plus: jest.fn().mockReturnValue({
        gt: jest.fn().mockReturnValue(true), // Always say effort > 24
        toString: jest.fn().mockReturnValue('30')
      }),
      div: jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('30')
      }),
      toString: jest.fn().mockReturnValue(String(value))
    };
  });

  const singleDayUpdateTask = {
    ...validUpdateData,
    start_date: '2023-01-01',
    end_date: undefined, // Single day task
    total_hours_pro_task: 30, // More than 24 hours
  };

  const result = await service.updateProjectTask(singleDayUpdateTask, 'user-1');

  (global as any).Decimal = originalDecimal;
  expect(result).toEqual({
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Validation Error',
    errorMessage: 'Effort cannot exceed 24 hours for the day',
  });
});

    it('should handle task creation failure (undefined result)', async () => {
      mockProjectTaskSchema.addProjectTask.mockResolvedValue(undefined as any);

      const result = await service.createProjectTask(validTaskData, 'user-1');

      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle update task failure (zero affected rows)', async () => {
      mockProjectTaskSchema.updateProjectTask.mockResolvedValue([0]);

      const result = await service.updateProjectTask(validUpdateData, 'user-1');

      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle database connection failure in createProjectTask', async () => {
      mockProjectTaskSchema.getSequelize.mockRejectedValue(new Error('Connection failed'));

      await expect(service.createProjectTask(validTaskData, 'user-1')).rejects.toThrow('Connection failed');
    });

    it('should handle database connection failure in updateProjectTask', async () => {
      mockProjectTaskSchema.getSequelize.mockRejectedValue(new Error('Connection failed'));

      await expect(service.updateProjectTask(validUpdateData, 'user-1')).rejects.toThrow('Connection failed');
    });

    it('should handle rollback failure in runAggregationAfterInlineUpdate', async () => {
      mockTransaction.rollback.mockRejectedValue(new Error('Rollback failed'));
      mockProjectTaskSchema.startUpdateAggregation.mockRejectedValue(new Error('Aggregation failed'));
      
      const projectTaskData = {
        rid: 'task-1',
        userId: 'user-1',
        account_rid: 'acc-1',
        resource_code: 'RES001',
        project_fiscal_rid: 'proj-1',
      };
      const fullTaskData = { total_hours_pro_task: 10 } as any;

      await expect(service.runAggregationAfterInlineUpdate('ACC123', projectTaskData, fullTaskData))
        .rejects.toThrow('Aggregation failed');
    });

    it('should handle validateProjectTaskUpdateInputs with missing task validation', async () => {
      const input = {
        account_rid: 'acc-1',
        resource_code: 'RES001', 
        project_fiscal_rid: 'proj-1',
        project_task_rid: 'task-1',
        projectResourceSchema: mockProjectResourceSchema,
        projectTaskSchema: mockProjectTaskSchema,
      };

      // First test successful base validation, then task validation failure
      const result = await service.validateProjectTaskUpdateInputs(input);
      expect(result.success).toBe(true);

      // Now test task validation failure
      mockProjectTaskSchema.validateProjectTaskById.mockRejectedValue(new Error('Task validation failed'));
      const failResult = await service.validateProjectTaskUpdateInputs(input);
      expect(failResult).toEqual({
        success: false,
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: 'Task validation failed',
      });
    });

    it('should handle missing resolved resource code without resource_rid', async () => {
      const projectTaskData = {
        rid: 'task-1',
        userId: 'user-1',
        account_rid: 'acc-1',
        // No resource_code and no resource_rid
        project_fiscal_rid: 'proj-1',
        total_hours_pro_task: 10,
      };
      const fullTaskData = { 
        account_rid: 'acc-1',
        project_fiscal_rid: 'proj-1'
      } as any;

      await service.runAggregationAfterInlineUpdate('ACC123', projectTaskData, fullTaskData);

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should handle missing resource code with valid resource_rid', async () => {
      const projectTaskData = {
        rid: 'task-1',
        userId: 'user-1',
        account_rid: 'acc-1',
        resource_rid: 'res-1',
        project_fiscal_rid: 'proj-1',
        total_hours_pro_task: 10,  // This triggers shouldRunAggregation
        // No resource_code provided - this should trigger validateResourceById call
      };
      const fullTaskData = { 
        account_rid: 'acc-1',
        resource_rid: 'old-res-1',  // Different from new to trigger aggregation
        project_fiscal_rid: 'proj-1'
      } as any;

      // Mock the validateResourceById to be called and return the resource
      mockProjectResourceSchema.validateResourceById.mockResolvedValueOnce(mockResource);
      
      // Mock the validation to succeed
      service['validateProjectTaskUpdateInputs'] = jest.fn().mockResolvedValue({
        success: true,
        resourceData: mockResource,
        projectData: { fiscal_year: 2023 },
        taskData: projectTaskData
      });

      await service.runAggregationAfterInlineUpdate('ACC123', projectTaskData, fullTaskData);

      // The service should call validateResourceById when resource_code is missing but resource_rid is provided
      expect(mockProjectResourceSchema.validateResourceById).toHaveBeenCalledWith('ACC123', 'res-1', 'acc-1');
    });

    it('should handle invalid resource_rid', async () => {
      mockProjectResourceSchema.validateResourceById.mockResolvedValue(null);
      
      const projectTaskData = {
        rid: 'task-1',
        userId: 'user-1',
        account_rid: 'acc-1',
        resource_rid: 'invalid-res',
        project_fiscal_rid: 'proj-1',
      };
      const fullTaskData = { total_hours_pro_task: 10 } as any;

      await service.runAggregationAfterInlineUpdate('ACC123', projectTaskData, fullTaskData);

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should handle complex date ranges', async () => {
      const multiDayTask = {
        ...validTaskData,
        start_date: '2023-01-01',
        end_date: '2023-01-05',
        total_hours_pro_task: 40,
      };

      const result = await service.createProjectTask(multiDayTask, 'user-1');

      expect(result.statusCode).toBe(HttpStatus.SUCCESS);
    });

    it('should validate per day effort with existing tasks', () => {
      const existingTasks = [
        { start_date: new Date('2023-01-01'), end_date: new Date('2023-01-01'), total_hours_pro_task: 10 }
      ] as any[];
      
      // Create a mock Decimal that properly chains calls
      const mockDecimalForNewEffort = {
        div: jest.fn().mockReturnValue({
          plus: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue(false)
          })
        })
      } as any;

      const result = service['validatePerDayEffortLimit'](existingTasks, mockDecimalForNewEffort, new Date('2023-01-01'), new Date('2023-01-01'));

      expect(result.success).toBe(true);
    });

    it('should handle effort limit violations', () => {
      // Test the validatePerDayEffortLimit method to trigger the gt(24) branch
      const existingTasks = [
        { start_date: new Date('2023-01-01'), end_date: new Date('2023-01-01'), total_hours_pro_task: '15' }
      ] as any[];
      
      const originalDecimal = (global as any).Decimal;
      
      // Mock Decimal to simulate exceeding 24 hour daily limit
      (global as any).Decimal = jest.fn().mockImplementation((value) => {
        const numValue = Number(value) || 0;
        
        return {
          div: jest.fn().mockReturnValue({
            toString: jest.fn().mockReturnValue(String(numValue))
          }),
          plus: jest.fn().mockImplementation((other) => {
            const otherValue = Number(other?.toString?.() || other || 0);
            const total = numValue + otherValue;
            return {
              gt: jest.fn().mockImplementation((limit) => {
                return total > Number(limit); // 15 + 12 = 27 > 24
              }),
              toString: jest.fn().mockReturnValue(String(total))
            };
          }),
          gt: jest.fn().mockImplementation((limit) => {
            return numValue > Number(limit);
          }),
          toString: jest.fn().mockReturnValue(String(numValue))
        };
      });

      const mockNewEffort = new (global as any).Decimal(12); // 12 + 15 = 27 > 24

      const result = service['validatePerDayEffortLimit'](
        existingTasks, 
        mockNewEffort, 
        new Date('2023-01-01'), 
        new Date('2023-01-01')
      );

      (global as any).Decimal = originalDecimal;
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Effort exceeds 24 hours on');
    });

// it('should handle complex validatePerDayEffortLimit scenarios', () => {
//   // Mock existing tasks with proper Decimal instances
//   const existingTasks = [
//     { 
//       start_date: new Date('2023-01-01'), 
//       end_date: new Date('2023-01-03'), 
//       total_hours_pro_task: '30' // 30 hours over 3 days = 10/day
//     },
//     { 
//       start_date: new Date('2023-01-02'), 
//       end_date: new Date('2023-01-02'), 
//       total_hours_pro_task: '8' // 8 hours on Jan 2
//     }
//   ] as any[];

//   // Create a mock new effort (20 hours over 5 days = 4/day)
//   const mockNewEffort = {
//     div: jest.fn().mockImplementation((divisor) => ({
//       toString: jest.fn().mockReturnValue('4'), // 20/5 = 4
//       plus: jest.fn().mockImplementation((other) => ({
//         gt: jest.fn().mockImplementation((limit) => {
//           // When checking against existing effort (10 + 4 + 8 = 22 > 24? No)
//           return false;
//         }),
//         toString: jest.fn().mockReturnValue('22')
//       }))
//     }))
//   } as any;

//   // Mock the Decimal constructor to return proper values
//   const originalDecimal = (global as any).Decimal;
//   (global as any).Decimal = jest.fn().mockImplementation((value) => {
//     const numValue = Number(value) || 0;
//     return {
//       isZero: jest.fn().mockReturnValue(numValue === 0),
//       isNaN: jest.fn().mockReturnValue(isNaN(numValue)),
//       plus: jest.fn().mockImplementation((other) => {
//         const otherValue = typeof other === 'object' ? other.toNumber() : Number(other) || 0;
//         return {
//           gt: jest.fn().mockReturnValue(false), // Never exceeds limit in this test
//           toString: jest.fn().mockReturnValue(String(numValue + otherValue))
//         };
//       }),
//       div: jest.fn().mockImplementation((divisor) => {
//         const divisorValue = Number(divisor) || 1;
//         return {
//           plus: jest.fn().mockImplementation((other) => {
//             const otherValue = typeof other === 'object' ? other.toNumber() : Number(other) || 0;
//             return {
//               gt: jest.fn().mockReturnValue(false),
//               toString: jest.fn().mockReturnValue(String((numValue / divisorValue) + otherValue))
//             };
//           }),
//           toString: jest.fn().mockReturnValue(String(numValue / divisorValue))
//         };
//       }),
//       gt: jest.fn().mockReturnValue(false),
//       toString: jest.fn().mockReturnValue(String(numValue)),
//       toNumber: jest.fn().mockReturnValue(numValue)
//     };
//   });

//   const result = service['validatePerDayEffortLimit'](
//     existingTasks, 
//     mockNewEffort, 
//     new Date('2023-01-01'), 
//     new Date('2023-01-05')
//   );

//   (global as any).Decimal = originalDecimal;
  
//   expect(result.success).toBe(true);
// });

    it('should handle edge cases in validatePerDayEffortLimit branch coverage', () => {
      // Test case targeting specific conditional branches in validatePerDayEffortLimit
      const existingTasks = [
        { 
          start_date: new Date('2023-01-01'), 
          end_date: new Date('2023-01-01'), 
          total_hours_pro_task: '20' 
        },
        { 
          start_date: null, 
          end_date: new Date('2023-01-02'), 
          total_hours_pro_task: '10' 
        },
        { 
          start_date: new Date('2023-01-03'), 
          end_date: null, 
          total_hours_pro_task: '15' 
        },
        { 
          start_date: new Date('2023-01-04'), 
          end_date: new Date('2023-01-04'), 
          total_hours_pro_task: null 
        }
      ] as any[];

      const originalDecimal = (global as any).Decimal;
      
      (global as any).Decimal = jest.fn().mockImplementation((value) => {
        if (value === 0) {
          return {
            plus: jest.fn().mockImplementation((addValue) => {
              return {
                gt: jest.fn().mockReturnValue(false),
                toString: jest.fn().mockReturnValue('10')
              };
            })
          };
        } else if (value === '5') {
          return {
            div: jest.fn().mockReturnValue({
              toString: jest.fn().mockReturnValue('5')
            })
          };
        } else if (value === '20') {
          return {
            div: jest.fn().mockReturnValue({
              toString: jest.fn().mockReturnValue('20')
            })
          };
        }
        return {
          div: jest.fn().mockReturnValue({
            toString: jest.fn().mockReturnValue('2.5')
          })
        };
      });

      const mockNewEffort = {
        div: jest.fn().mockReturnValue({
          toString: jest.fn().mockReturnValue('2.5')
        })
      } as any;

      // This should trigger branches for tasks with null/undefined start_date, end_date, or total_hours_pro_task
      const result = service['validatePerDayEffortLimit'](
        existingTasks, 
        mockNewEffort, 
        new Date('2023-01-01'), 
        new Date('2023-01-02')
      );

      (global as any).Decimal = originalDecimal;
      
      expect(result.success).toBe(true);
    });

    it('should handle zero and NaN effort values to trigger isZero/isNaN branches', async () => {
      // Test zero effort value
      const zeroEffortData = {
        ...validTaskData,
        total_hours_pro_task: 0
      };

      const originalDecimal = (global as any).Decimal;
      (global as any).Decimal = jest.fn().mockImplementation((value) => {
        return {
          isZero: jest.fn().mockReturnValue(value === 0 || value === '0'),
          isNaN: jest.fn().mockReturnValue(false),
          gt: jest.fn().mockReturnValue(false),
          plus: jest.fn().mockReturnValue({ toString: () => '0' }),
          div: jest.fn().mockReturnValue({ toString: () => '0' })
        };
      });

      const result = await service.createProjectTask(zeroEffortData, 'test-user');

      (global as any).Decimal = originalDecimal;

      // Should succeed since zero effort skips validation
      expect(result.statusCode).toBe(200);
      expect(mockProjectTaskSchema.addProjectTask).toHaveBeenCalled();
    });

    it('should handle runAggregationAfterInlineUpdate without required fields', async () => {
      // Test case where aggregation should not run
      const projectTaskData = {
        rid: 'task-1',
        userId: 'user-1',
        account_rid: 'acc-1',
        // Not including resource_code, total_cost_pro_task, or total_hours_pro_task
        description: 'test task'
      };
      
      const fullTaskData = { 
        total_hours_pro_task: 10,
        resource_code: 'RES001',
        project_fiscal_rid: 'proj-1'
      } as any;

      const result = await service.runAggregationAfterInlineUpdate('account123', projectTaskData, fullTaskData);

      // Should return early without running aggregation
      expect(result).toBeUndefined();
    });

    it('should handle empty existing tasks in validatePerDayEffortLimit', () => {
      const existingTasks: any[] = [];
      const mockDecimal = {
        div: jest.fn().mockReturnValue({
          toString: jest.fn().mockReturnValue('12')
        })
      } as any;

      const result = service['validatePerDayEffortLimit'](existingTasks, mockDecimal, new Date('2023-01-01'), new Date('2023-01-01'));

      expect(result.success).toBe(true);
    });

    it('should handle tasks with missing date fields in validatePerDayEffortLimit', () => {
      const existingTasks = [
        { start_date: null, end_date: new Date('2023-01-01'), total_hours_pro_task: 10 },
        { start_date: new Date('2023-01-01'), end_date: null, total_hours_pro_task: 8 },
        { start_date: new Date('2023-01-01'), end_date: new Date('2023-01-01'), total_hours_pro_task: null }
      ] as any[];
      
      const mockDecimal = {
        div: jest.fn().mockReturnValue({
          toString: jest.fn().mockReturnValue('10')
        })
      } as any;

      const result = service['validatePerDayEffortLimit'](existingTasks, mockDecimal, new Date('2023-01-01'), new Date('2023-01-01'));

      expect(result.success).toBe(true);
    });

    it('should handle update with effort exceeding duration limits', async () => {
      // Create a proper test that triggers the duration limit validation in update
      const originalDecimal = (global as any).Decimal;
      
      // Mock Decimal constructor to simulate effort exceeding duration in update
      (global as any).Decimal = jest.fn().mockImplementation((value) => {
        const numValue = Number(value) || 0;
        
        return {
          isZero: jest.fn().mockReturnValue(numValue === 0),
          isNaN: jest.fn().mockReturnValue(false),
          gt: jest.fn().mockImplementation((limit) => {
            return numValue > Number(limit);
          }),
          toString: jest.fn().mockReturnValue(String(numValue)),
          plus: jest.fn().mockImplementation((other) => {
            const otherValue = Number(other?.toString?.() || other || 0);
            const total = numValue + otherValue;
            return {
              gt: jest.fn().mockImplementation((limit) => {
                return total > Number(limit); // This should trigger when total > maxAllowedEffort
              }),
              toString: jest.fn().mockReturnValue(String(total))
            };
          }),
          div: jest.fn().mockImplementation((divisor) => {
            const result = numValue / Number(divisor);
            return {
              toString: jest.fn().mockReturnValue(String(result)),
              plus: jest.fn().mockImplementation((other) => {
                const otherValue = Number(other?.toString?.() || other || 0);
                const total = result + otherValue;
                return {
                  gt: jest.fn().mockImplementation((limit) => {
                    return total > Number(limit);
                  }),
                  toString: jest.fn().mockReturnValue(String(total))
                };
              })
            };
          })
        };
      });

      // Mock the validatePerDayEffortLimit to return failure to trigger the 400 response
      jest.spyOn(service as any, 'validatePerDayEffortLimit').mockReturnValue({
        success: false,
        errorMessage: 'Effort cannot exceed the total hours in the duration'
      });

      const updateTaskWithDateRange = {
        ...validUpdateData,
        start_date: '2023-01-01',
        end_date: '2023-01-03',
        total_hours_pro_task: 100, // High effort to trigger validation
      };

      const result = await service.updateProjectTask(updateTaskWithDateRange, 'user-1');

      (global as any).Decimal = originalDecimal;
      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation Error',
        errorMessage: 'Effort cannot exceed the total hours in the duration',
      });
    });

    it('should handle update with single day effort exceeding limit', async () => {
      // Mock to check the single day limit validation in update
      const originalDecimal = (global as any).Decimal;
      
      (global as any).Decimal = jest.fn().mockImplementation((value) => {
        const numValue = Number(value) || 0;
        
        return {
          isZero: jest.fn().mockReturnValue(numValue === 0),
          isNaN: jest.fn().mockReturnValue(false),
          plus: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue(false),
            toString: jest.fn().mockReturnValue('10')
          }),
          div: jest.fn().mockReturnValue({
            toString: jest.fn().mockReturnValue(String(numValue / 1))
          }),
          gt: jest.fn().mockImplementation((limit) => {
            // Return true when comparing with 24 hour limit for values > 24
            return Number(limit) === 24 && numValue === 30;
          }),
          toString: jest.fn().mockReturnValue(String(numValue))
        };
      });

      const singleDayUpdateTask = {
        ...validUpdateData,
        start_date: '2023-01-01',
        end_date: undefined, // Single day task
        total_hours_pro_task: 30, // More than 24 hours
      };

      const result = await service.updateProjectTask(singleDayUpdateTask, 'user-1');

      (global as any).Decimal = originalDecimal;
      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation Error',
        errorMessage: 'Effort cannot exceed 24 hours for the day',
      });
    });

    it('should handle per-day effort limit violations in update', async () => {
      // Mock the validatePerDayEffortLimit to return failure
      jest.spyOn(service as any, 'validatePerDayEffortLimit').mockReturnValue({
        success: false,
        errorMessage: 'Effort exceeds 24 hours on 2023-01-01 for the resource'
      });

      const result = await service.updateProjectTask(validUpdateData, 'user-1');

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation Error',
        errorMessage: 'Effort exceeds 24 hours on 2023-01-01 for the resource',
      });
      // Don't check rollback since the validation happens after transaction setup
    });

    it('should handle aggregation with cost field changes', async () => {
      const projectTaskData = {
        rid: 'task-1',
        userId: 'user-1',
        account_rid: 'acc-1',
        resource_code: 'RES001', // This should trigger shouldRunAggregation
        total_cost_pro_task: 1000, // Cost field change should also trigger aggregation
        project_fiscal_rid: 'proj-1',
      };
      const fullTaskData = { 
        total_hours_pro_task: 10,
        resource_code: 'OLD-RES', // Different from projectTaskData to ensure aggregation runs
        project_fiscal_rid: 'proj-1'
      } as any;

      // Mock the validation to succeed and provide the necessary resource data
      jest.spyOn(service as any, 'validateProjectTaskUpdateInputs').mockResolvedValue({
        success: true,
        resourceData: mockResource,
        projectData: { fiscal_year: 2023 },
        taskData: projectTaskData
      });

      await service.runAggregationAfterInlineUpdate('ACC123', projectTaskData, fullTaskData);

      expect(mockProjectTaskSchema.startUpdateAggregation).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle validation project not found error differently', async () => {
      mockProjectResourceSchema.validateProjectFiscalById.mockResolvedValue(undefined as any);

      const result = await service.createProjectTask(validTaskData, 'user-1');

      expect(result).toEqual({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid project ID',
        errorMessage: 'Invalid project for the given account number',
      });
    });
  });
