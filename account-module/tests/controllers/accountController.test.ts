import { Request, Response } from 'express';
import accountController from '../../src/controllers/accountController';
import configurations from '../../src/config/config';
import { HttpStatus } from '../../src/utils/constant';
import * as helpers from '../../src/utils/helpers';

// Mock the services
jest.mock('../../src/config/config', () => ({
  getInstance: jest.fn().mockReturnValue({
    getServices: jest.fn().mockReturnValue({
      accountServices: {
        accountList: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        globalAccounts: jest.fn(),
        accountById: jest.fn()
      }
    })
  })
}));

// Mock the helpers
jest.mock('../../src/utils/helpers', () => ({
  validateRequest: jest.fn(),
  handleSuccessResponse: jest.fn(),
  handleErrorResponse: jest.fn(),
  successLog: jest.fn(),
  errorLog: jest.fn()
}));

describe('Account Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const services = configurations.getInstance().getServices();
  
  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    jest.clearAllMocks();
  });
  
  describe('accounts', () => {
    it('should return accounts list on success', async () => {
      // Mock validateRequest to return valid data
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        page: '1',
        limit: '10',
        search: '',
        filters: '{}',
        sortBy: 'created_datetime',
        sortOrder: 'DESC'
      });
      
      // Mock accountList to return success
      (services.accountServices.accountList as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: [{ id: 'test-id', name: 'Test Account' }]
      });
      
      await accountController.accounts(mockRequest as Request, mockResponse as Response);
      
      expect(helpers.validateRequest).toHaveBeenCalled();
      expect(services.accountServices.accountList).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ id: 'test-id', name: 'Test Account' }]
      );
    });
    
    it('should handle error when validation fails', async () => {
      // Mock validateRequest to return null (validation failed)
      (helpers.validateRequest as jest.Mock).mockResolvedValue(null);
      
      await accountController.accounts(mockRequest as Request, mockResponse as Response);
      
      expect(helpers.validateRequest).toHaveBeenCalled();
      expect(services.accountServices.accountList).not.toHaveBeenCalled();
    });
    
    it('should handle error when service fails', async () => {
      // Mock validateRequest to return valid data
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        page: '1',
        limit: '10'
      });
      
      // Mock accountList to return error
      (services.accountServices.accountList as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.BAD_REQUEST,
        errorMessage: 'Service error'
      });
      
      await accountController.accounts(mockRequest as Request, mockResponse as Response);
      
      expect(helpers.validateRequest).toHaveBeenCalled();
      expect(services.accountServices.accountList).toHaveBeenCalled();
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        'Service error'
      );
    });
    
    it('should handle exceptions', async () => {
      // Mock validateRequest to throw error
      (helpers.validateRequest as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      await accountController.accounts(mockRequest as Request, mockResponse as Response);
      
      expect(helpers.validateRequest).toHaveBeenCalled();
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.FAILED,
        HttpStatus.FAILED_MESSAGE,
        'Test error'
      );
    });
  });
  
  // Apply the same fix to the rest of the test cases
  describe('createAccount', () => {
    it('should create account on success', async () => {
      // Mock validateRequest to return valid data
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        account_name: 'Test Account'
      });
      
      // Mock createAccount to return success
      (services.accountServices.createAccount as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: { id: 'test-id', name: 'Test Account' }
      });
      
      await accountController.createAccount(mockRequest as Request, mockResponse as Response);
      
      expect(helpers.validateRequest).toHaveBeenCalled();
      expect(services.accountServices.createAccount).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        { id: 'test-id', name: 'Test Account' }
      );
    });
  });
  
  // Continue with the same pattern for other test cases
  describe('updateAccount', () => {
    it('should update account on success', async () => {
      // Mock validateRequest to return valid data
      (helpers.validateRequest as jest.Mock).mockResolvedValue({
        rid: 'test-id',
        account_name: 'Updated Account'
      });
      
      // Mock updateAccount to return success
      (services.accountServices.updateAccount as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: { id: 'test-id', name: 'Updated Account' }
      });
      
      await accountController.updateAccount(mockRequest as Request, mockResponse as Response);
      
      expect(helpers.validateRequest).toHaveBeenCalled();
      expect(services.accountServices.updateAccount).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        { id: 'test-id', name: 'Updated Account' }
      );
    });
  });
  
  describe('globalAccounts', () => {
    it('should return global accounts on success', async () => {
      // Mock globalAccounts to return success
      (services.accountServices.globalAccounts as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: [{ id: 'global-id', name: 'Global Account' }]
      });
      
      await accountController.globalAccounts(mockRequest as Request, mockResponse as Response);
      
      expect(services.accountServices.globalAccounts).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ id: 'global-id', name: 'Global Account' }]
      );
    });
  });
  
  describe('accountById', () => {
    it('should return account by id on success', async () => {
      // Set up request params
      mockRequest.params = { id: 'test-id' };
      
      // Mock accountById to return success
      (services.accountServices.accountById as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: { id: 'test-id', name: 'Test Account' }
      });
      
      await accountController.accountById(mockRequest as Request, mockResponse as Response);
      
      expect(services.accountServices.accountById).toHaveBeenCalledWith('test-id');
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        { id: 'test-id', name: 'Test Account' }
      );
    });
  });
});