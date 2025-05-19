import { Request, Response } from 'express';
import geoDataController from '../../src/controllers/geoDataController';
import configurations from '../../src/config/config';
import { HttpStatus } from '../../src/utils/constant';
import * as helpers from '../../src/utils/helpers';
import { errorResponse } from '../../src/utils/apiResponse';

// Mock the services
jest.mock('../../src/config/config', () => ({
  getInstance: jest.fn().mockReturnValue({
    getServices: jest.fn().mockReturnValue({
      geoDataServices: {
        countries: jest.fn(),
        currencies: jest.fn(),
        regions: jest.fn(),
        states: jest.fn()
      }
    })
  })
}));

// Mock the helpers
jest.mock('../../src/utils/helpers', () => ({
  handleSuccessResponse: jest.fn(),
  handleErrorResponse: jest.fn(),
  successLog: jest.fn(),
  errorLog: jest.fn()
}));

// Mock the apiResponse
jest.mock('../../src/utils/apiResponse', () => ({
  errorResponse: jest.fn()
}));

describe('GeoData Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const services = configurations.getInstance().getServices();
  
  beforeEach(() => {
    mockRequest = {};
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    jest.clearAllMocks();
  });
  
  describe('country', () => {
    it('should return countries on success', async () => {
      // Mock countries to return success
      (services.geoDataServices.countries as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: [{ id: 'US', name: 'United States' }]
      });
      
      await geoDataController.country(mockRequest as Request, mockResponse as Response);
      
      expect(services.geoDataServices.countries).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ id: 'US', name: 'United States' }]
      );
    });
    
    it('should handle error when service fails', async () => {
      // Mock countries to return error
      (services.geoDataServices.countries as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.BAD_REQUEST,
        errorMessage: 'Service error',
        message: 'Service error'
      });
      
      await geoDataController.country(mockRequest as Request, mockResponse as Response);
      
      expect(services.geoDataServices.countries).toHaveBeenCalled();
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        'Service error'
      );
    });
    
    it('should handle exceptions', async () => {
      // Mock countries to throw error
      (services.geoDataServices.countries as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      await geoDataController.country(mockRequest as Request, mockResponse as Response);
      
      expect(services.geoDataServices.countries).toHaveBeenCalled();
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.FAILED,
        HttpStatus.FAILED_MESSAGE,
        'Test error'
      );
    });
  });
  
  describe('currency', () => {
    it('should return currencies on success', async () => {
      // Mock currencies to return success
      (services.geoDataServices.currencies as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: [{ code: 'USD', name: 'US Dollar' }]
      });
      
      await geoDataController.currency(mockRequest as Request, mockResponse as Response);
      
      expect(services.geoDataServices.currencies).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ code: 'USD', name: 'US Dollar' }]
      );
    });
  });
  
  describe('regions', () => {
    it('should return regions on success', async () => {
      // Mock regions to return success
      (services.geoDataServices.regions as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: [{ id: 'NA', name: 'North America' }]
      });
      
      await geoDataController.regions(mockRequest as Request, mockResponse as Response);
      
      expect(services.geoDataServices.regions).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ id: 'NA', name: 'North America' }]
      );
    });
  });
  
  describe('states', () => {
    it('should return states on success', async () => {
      // Mock states to return success
      (services.geoDataServices.states as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.SUCCESS,
        data: [{ id: 'CA', name: 'California' }]
      });
      
      await geoDataController.states(mockRequest as Request, mockResponse as Response);
      
      expect(services.geoDataServices.states).toHaveBeenCalled();
      expect(helpers.handleSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        [{ id: 'CA', name: 'California' }]
      );
    });
    
    it('should handle error when service fails', async () => {
      // Mock states to return error
      (services.geoDataServices.states as jest.Mock).mockResolvedValue({
        statusCode: HttpStatus.BAD_REQUEST,
        errorMessage: 'Service error',
        message: 'Service error'
      });
      
      await geoDataController.states(mockRequest as Request, mockResponse as Response);
      
      expect(services.geoDataServices.states).toHaveBeenCalled();
      expect(helpers.handleErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        'Service error'
      );
    });
    
    it('should handle exceptions', async () => {
      // Mock states to throw error
      (services.geoDataServices.states as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      await geoDataController.states(mockRequest as Request, mockResponse as Response);
      
      expect(services.geoDataServices.states).toHaveBeenCalled();
      expect(errorResponse).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.FAILED,
        HttpStatus.FAILED_MESSAGE,
        'Test error'
      );
    });
  });
});