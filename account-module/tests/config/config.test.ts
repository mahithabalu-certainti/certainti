import { jest } from '@jest/globals';
import { NODE_ENV } from '../../src/utils/constant';

// Mock dependencies
jest.mock('winston', () => {
  return {
    createLogger: jest.fn().mockReturnValue('mockLogger'),
    transports: {
      Console: jest.fn(),
    },
    format: {
      combine: jest.fn().mockReturnValue('combinedFormat'),
      colorize: jest.fn().mockReturnValue('colorizedFormat'),
      timestamp: jest.fn().mockReturnValue('timestampFormat'),
      printf: jest.fn().mockImplementation(function(formatFn) {
        // Test the printf format function with sample data
        const result = (formatFn as (info: { timestamp: string; level: string; message: string; method: string; url: string }) => string)({
          timestamp: '2023-01-01T00:00:00Z',
          level: 'info',
          message: 'Test message',
          method: 'GET',
          url: '/test'
        });
        return result;
      }),
    },
  };
});

jest.mock('../../src/services', () => {
  return jest.fn().mockImplementation(() => 'mockServices');
});

describe('Configurations', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let Configurations: any;
  
  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the module registry before each test
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it('should create a singleton instance', () => {
    // Import the module after resetting
    Configurations = require('../../src/config/config').default;
    
    const instance1 = Configurations.getInstance();
    const instance2 = Configurations.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should initialize logger with development configuration', () => {
    // Set environment to development
    process.env.NODE_ENV = NODE_ENV.DEV;
    
    const { createLogger, format, transports } = require('winston');
    
    // Import the module after setting environment
    Configurations = require('../../src/config/config').default;
    Configurations.getInstance();
    
    expect(createLogger).toHaveBeenCalledWith({
      level: 'info',
      format: 'combinedFormat',
      transports: [expect.any(Object)],
    });
    
    expect(format.combine).toHaveBeenCalled();
    expect(format.colorize).toHaveBeenCalledWith({ level: true });
    expect(format.timestamp).toHaveBeenCalled();
    expect(format.printf).toHaveBeenCalled();
    expect(transports.Console).toHaveBeenCalled();
  });

  it('should initialize logger with non-development configuration', () => {
    // Set environment to production
    process.env.NODE_ENV = NODE_ENV.PROD;
    
    const { createLogger } = require('winston');
    
    // Import the module after setting environment
    Configurations = require('../../src/config/config').default;
    Configurations.getInstance();
    
    expect(createLogger).toHaveBeenCalledWith({
      level: 'debug',
      format: 'combinedFormat',
      transports: [expect.any(Object)],
    });
  });

  it('should test the printf format function with all parameters', () => {
    const { format } = require('winston');
    
    // Import the module
    Configurations = require('../../src/config/config').default;
    Configurations.getInstance();
    
    // The printf function is tested in the mock implementation
    expect(format.printf).toHaveBeenCalled();
    
    // Define a type for the log info object
    type LogInfo = {
      timestamp?: string;
      level: string;
      message: string;
      method: string;
      url?: string;
    };
    
    // Get the format function with proper type assertion
    const formatFn = format.printf.mock.calls[0][0] as (info: LogInfo) => string;
    
    // Test with all parameters
    const result1 = formatFn({
      timestamp: '2023-01-01T00:00:00Z',
      level: 'info',
      message: 'Test message',
      method: 'GET',
      url: '/test'
    });
    
    expect(result1).toBe('[info] -> Test message GET | /test | 2023-01-01T00:00:00Z');
    
    // Test without url
    const result2 = formatFn({
      timestamp: '2023-01-01T00:00:00Z',
      level: 'info',
      message: 'Test message',
      method: 'GET',
    });
    
    expect(result2).toBe('[info] -> Test message GET  | 2023-01-01T00:00:00Z');
    
    // Test without timestamp
    const result3 = formatFn({
      level: 'info',
      message: 'Test message',
      method: 'GET',
      url: '/test'
    });
    
    expect(result3).toBe('[info] -> Test message GET | /test ');
  });

  it('should return services instance', () => {
    // Import the module
    Configurations = require('../../src/config/config').default;
    
    const instance = Configurations.getInstance();
    const services = instance.getServices();
    
    expect(services).toBe('mockServices');
  });

  it('should return logger instance', () => {
    // Import the module
    Configurations = require('../../src/config/config').default;
    
    const instance = Configurations.getInstance();
    const logger = instance.getLogger();
    
    expect(logger).toBe('mockLogger');
  });
});