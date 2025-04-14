import { Request, Response, NextFunction } from 'express';
import requestLogger from '../../src/middlewares/requestLoggerMiddleware';
import configurations from '../../src/config/config';

// Define custom interface to match the one in the middleware
interface CustomRequest extends Request {
  requestId?: string;
}

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid')
}));

jest.mock('../../src/config/config', () => ({
  getInstance: jest.fn().mockReturnValue({
    getLogger: jest.fn().mockReturnValue({
      info: jest.fn()
    })
  })
}));

describe('Request Logger Middleware', () => {
  let mockRequest: Partial<CustomRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  
  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      originalUrl: '/test-url'
    };
    
    mockResponse = {
      setHeader: jest.fn(),
      json: jest.fn().mockReturnThis()
    };
    
    nextFunction = jest.fn();
  });
  
  it('should add requestId to the request object', () => {
    requestLogger(mockRequest as any, mockResponse as any, nextFunction);
    
    expect(mockRequest.requestId).toBe('test-uuid');
  });
  
  it('should set X-Request-ID header', () => {
    requestLogger(mockRequest as any, mockResponse as any, nextFunction);
    
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', 'test-uuid');
  });
  
  it('should override response.json to include requestId', () => {
    requestLogger(mockRequest as any, mockResponse as any, nextFunction);
    
    // Get the overridden json function
    const overriddenJson = mockResponse.json;
    
    // Call it with test data
    const testData = { message: 'test' };
    overriddenJson && overriddenJson(testData);
    
    // Original json should be called with modified data
    expect(testData).toHaveProperty('requestId', 'test-uuid');
  });
  
  it('should log the incoming request', () => {
    const logger = configurations.getInstance().getLogger();
    
    requestLogger(mockRequest as any, mockResponse as any, nextFunction);
    
    expect(logger.info).toHaveBeenCalledWith('Incoming request:', expect.objectContaining({
      method: 'GET',
      url: '/test-url',
      timestamp: expect.any(String)
    }));
  });
  
  it('should call next function', () => {
    requestLogger(mockRequest as any, mockResponse as any, nextFunction);
    
    expect(nextFunction).toHaveBeenCalled();
  });
});