import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('sequelize', () => {
  const mockSequelize = jest.fn().mockImplementation(() => ({
    authenticate: jest.fn().mockImplementation(async () => {}),
  }));
  return { Sequelize: mockSequelize };
});

jest.mock('../../src/utils/azureSecrets', () => {
  const mockSecrets: Record<string, string> = {
    'org-db-name': 'test_org_db',
    'org-db-user': 'test_org_user',
    'org-db-password': 'test_org_password',
    'org-db-host': 'test.org.host.com',
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

describe('OrgDB Data Source', () => {
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
    
    // Set required env variables
    process.env.ORGDB_NAME = 'org-db-name';
    process.env.ORGDB_USERNAME = 'org-db-user';
    process.env.ORGDB_PASSWORD = 'org-db-password';
    process.env.ORGDB_ENDPOINT = 'org-db-host';
    process.env.NODE_ENV = 'development';
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the module registry before each test
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it('should throw error if required env variables are missing', () => {
    delete process.env.ORGDB_NAME;
    
    expect(() => {
      require('../../src/config/orgdbDataSource');
    }).toThrow('Missing environment variable: ORGDB_NAME');
  });

  it('should initialize sequelize with correct configuration', async () => {
    const { initOrgSequelize } = require('../../src/config/orgdbDataSource');
    const { Sequelize } = require('sequelize');
    
    await initOrgSequelize();
    
    expect(Sequelize).toHaveBeenCalledWith(
      'test_org_db',
      'test_org_user',
      'test_org_password',
      expect.objectContaining({
        host: 'test.org.host.com',
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
    const { initOrgSequelize } = require('../../src/config/orgdbDataSource');
    const { Sequelize } = require('sequelize');
    
    await initOrgSequelize();
    await initOrgSequelize();
    
    expect(Sequelize).toHaveBeenCalledTimes(1);
  });

  it('should throw error if getAzureSecrets fails', async () => {
    const { getSecret } = require('../../src/utils/azureSecrets');
    getSecret.mockRejectedValueOnce(new Error('Azure error'));
    
    const { initOrgSequelize } = require('../../src/config/orgdbDataSource');
    
    await expect(initOrgSequelize()).rejects.toThrow('Error fetching Azure secrets: Azure error');
  });

  it('should throw error if any required secret is missing', async () => {
    const { getSecret } = require('../../src/utils/azureSecrets');
    getSecret.mockResolvedValueOnce('');
    
    const { initOrgSequelize } = require('../../src/config/orgdbDataSource');
    
    try {
      await initOrgSequelize();
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain('Process.exit called with code: 1');
      } else {
        fail('Expected error to be an instance of Error');
      }
    }
    
    expect(console.error).toHaveBeenCalledWith(
      'One or more required database secrets are missing.'
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit process if sequelize authentication fails', async () => {
    const { Sequelize } = require('sequelize');
    const mockAuthenticate = jest.fn().mockRejectedValueOnce(new Error('Auth failed') as never);
    
    // Update the Sequelize mock for this specific test
    (Sequelize as jest.Mock).mockImplementationOnce(() => ({
      authenticate: mockAuthenticate
    }));
    
    const { initOrgSequelize } = require('../../src/config/orgdbDataSource');
    
    try {
      await initOrgSequelize();
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain('Process.exit called with code: 1');
      } else {
        fail('Expected error to be an instance of Error');
      }
    }
    
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'Unable to connect to the database:',
      expect.any(Error)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});