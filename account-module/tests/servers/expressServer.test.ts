import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    setTimeout: jest.fn(),
  };
  const mockExpress = jest.fn(() => mockApp);
  Object.defineProperty(mockExpress, 'json', {
    value: jest.fn(() => 'jsonMiddleware')
  });
  return mockExpress;
});

jest.mock('cors', () => {
  return jest.fn(() => 'corsMiddleware');
});

jest.mock('../../src/routes', () => 'routesMiddleware');
jest.mock('../../src/middlewares/requestLoggerMiddleware', () => 'requestLoggerMiddleware');
jest.mock('../../src/utils/rateLimiter', () => ({
  rateLimiter: 'rateLimiterMiddleware',
}));

describe('Express Server Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize express server with all middleware', () => {
    const express = require('express');
    const cors = require('cors');
    
    // Import the module after mocking dependencies
    const initExpressServer = require('../../src/servers/expressServer').default;
    
    const { app } = initExpressServer();
    
    // Verify express was initialized
    expect(express).toHaveBeenCalled();
    
    // Verify middleware was added in the correct order
    expect(express.json).toHaveBeenCalled();
    expect(cors).toHaveBeenCalledWith({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    });
    
    // Check middleware registration order
    expect(app.use).toHaveBeenNthCalledWith(1, 'jsonMiddleware');
    expect(app.use).toHaveBeenNthCalledWith(2, 'corsMiddleware');
    expect(app.use).toHaveBeenNthCalledWith(3, 'requestLoggerMiddleware');
    expect(app.use).toHaveBeenNthCalledWith(4, '/api', 'rateLimiterMiddleware');
    expect(app.use).toHaveBeenNthCalledWith(6, '/api', 'routesMiddleware');
    
    // Check timeout middleware
    const timeoutMiddlewareCall = app.use.mock.calls[4][0];
    const mockNext = jest.fn();
    const mockRes = {
      setTimeout: jest.fn((timeout, callback) => {
        (callback as () => void)();
        return mockRes;
      }),
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes),
    };
    
    timeoutMiddlewareCall({}, mockRes, mockNext);
    expect(mockRes.setTimeout).toHaveBeenCalledWith(30000, expect.any(Function));
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(408);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      status: "error", 
      message: "Request timed out" 
    });
  });
});