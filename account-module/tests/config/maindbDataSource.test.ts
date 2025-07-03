import { jest } from '@jest/globals';
import type { Mock } from 'jest-mock';

// Mock dependencies
jest.mock('sequelize', () => {
  const mockAuthenticate = jest.fn();
  const mockSequelizeInstance = {
    authenticate: mockAuthenticate,
    define: jest.fn(),
    models: {},
  };
  
  const MockSequelize = jest.fn(() => mockSequelizeInstance);
  return {
    Sequelize: Object.assign(MockSequelize, {
      DataTypes: {
        STRING: 'STRING',
        INTEGER: 'INTEGER',
        DATE: 'DATE',
        BOOLEAN: 'BOOLEAN',
      }
    })
  };
});

jest.mock('../../src/utils/azureSecrets', () => {
  const mockSecrets: Record<string, string> = {
    'main-db-name': 'test_db',
    'main-db-user': 'test_user',
    'main-db-password': 'test_password',
    'main-db-host': 'test.host.com',
  };
  
  return {
    getSecret: jest.fn(async (secretName) => mockSecrets[secretName as string] || ''),
  };
});

// Mock console methods
console.log = jest.fn();
console.error = jest.fn();

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`Process.exit called with code: ${code}`);
});

describe('MainDB Data Source', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockConsoleError: Mock;
  
  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
    
    // Set up console.error mock
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {}) as jest.Mock;
    
    // Set required env variables
    process.env.MAINDB_NAME = 'main-db-name';
    process.env.MAINDB_USERNAME = 'main-db-user';
    process.env.MAINDB_PASSWORD = 'main-db-password';
    process.env.MAINDB_ENDPOINT = 'main-db-host';
    process.env.NODE_ENV = 'development';
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the module registry before each test
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    mockConsoleError.mockRestore();
  });

  it('should throw error if required env variables are missing', () => {
    delete process.env.MAINDB_NAME;
    
    expect(() => {
      require('../../src/config/maindbDataSource');
    }).toThrow('Missing required environment variable: MAINDB_NAME');
  });

  it('should initialize sequelize with correct configuration', async () => {
    const { initSequelize } = require('../../src/config/maindbDataSource');
    const { Sequelize } = require('sequelize');
    
    await initSequelize();
    
    expect(Sequelize).toHaveBeenCalledWith(
      'test_db',
      'test_user',
      'test_password',
      expect.objectContaining({
        host: 'test.host.com',
        dialect: 'postgres',
        port: 5432,
        logging: true,
        define: {
          freezeTableName: true,
          timestamps: false,
        },
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      })
    );
  });

  it('should return existing sequelize instance if already initialized', async () => {
    const { initSequelize } = require('../../src/config/maindbDataSource');
    const { Sequelize } = require('sequelize');
    
    await initSequelize();
    await initSequelize();
    
    expect(Sequelize).toHaveBeenCalledTimes(1);
  });

  it('should throw error if getAzureSecrets fails', async () => {
    const { getSecret } = require('../../src/utils/azureSecrets');
    getSecret.mockRejectedValueOnce(new Error('Azure error'));
    
    const { initSequelize } = require('../../src/config/maindbDataSource');
    
    await expect(initSequelize()).rejects.toThrow('Error fetching Azure secrets: Azure error');
  });

  it('should throw error if any required secret is missing', async () => {
    const { getSecret } = require('../../src/utils/azureSecrets');
    getSecret.mockResolvedValueOnce('');
    
    const { initSequelize } = require('../../src/config/maindbDataSource');
    
    await expect(initSequelize()).rejects.toThrow('One or more required database secrets are missing.');
  });

  it('should exit process if sequelize authentication fails', async () => {
    const { Sequelize } = require('sequelize');
    const sequelizeInstance = new Sequelize();
    sequelizeInstance.authenticate.mockRejectedValueOnce(new Error('Auth failed'));
    
    const { initSequelize } = require('../../src/config/maindbDataSource');
    
    await expect(initSequelize()).rejects.toThrow('Process.exit called with code: 1');
    
    expect(sequelizeInstance.authenticate).toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith('Unable to connect to the database:', expect.any(Error));
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  it('should initialize sequelize successfully', async () => {
    const { Sequelize } = require('sequelize');
    const sequelizeInstance = new Sequelize();
    sequelizeInstance.authenticate.mockResolvedValueOnce(undefined);
    
    const { initSequelize } = require('../../src/config/maindbDataSource');
    
    const result = await initSequelize();
    
    expect(sequelizeInstance.authenticate).toHaveBeenCalled();
    expect(result).toBe(sequelizeInstance);
  });
});