import request from 'supertest';
import express from 'express';

// Set required environment variables before imports
process.env.ORGDB_NAME = 'test-orgdb-name';
process.env.ORGDB_USERNAME = 'test-orgdb-username';
process.env.ORGDB_PASSWORD = 'test-orgdb-password';
process.env.ORGDB_ENDPOINT = 'test-orgdb-endpoint';
process.env.MAINDB_NAME = 'test-maindb-name';
process.env.MAINDB_USERNAME = 'test-maindb-username';
process.env.MAINDB_PASSWORD = 'test-maindb-password';
process.env.MAINDB_ENDPOINT = 'test-maindb-endpoint';
process.env.NODE_ENV = 'test';

// Add Azure Secrets mock
jest.mock('../../src/utils/azureSecrets', () => ({
  getSecret: jest.fn().mockResolvedValue('mock-secret'),
  keyVaultUrl: 'https://mock-keyvault.vault.azure.net',
}));

import accountRoutes from '../../src/routes/accountRoutes';

// Update the controller mock to include all required methods
jest.mock('../../src/controllers/accountController', () => ({
  accounts: jest.fn((req, res) => res.status(200).json([])),
  globalAccounts: jest.fn((req, res) => res.status(200).json([])),
  createAccount: jest.fn((req, res) => res.status(201).json({
    message: 'Account created',
    account: { id: 1, account_name: 'Test Account' }
  })),
  getAccount: jest.fn((req, res) => res.status(200).json({})),
  updateAccount: jest.fn((req, res) => res.status(200).json({})),
  deleteAccount: jest.fn((req, res) => res.status(200).json({})),
  accountById: jest.fn((req, res) => res.status(200).json({}))
}));

// Also mock geoDataController since it's referenced in routes
// Update geoDataController mock to include all required methods
jest.mock('../../src/controllers/geoDataController', () => ({
  country: jest.fn((req, res) => res.status(200).json([])),
  currency: jest.fn((req, res) => res.status(200).json([])),
  regions: jest.fn((req, res) => res.status(200).json([])),
  states: jest.fn((req, res) => res.status(200).json([]))
}));

// Import the controller after mocking
import * as accountController from '../../src/controllers/accountController';

describe('Account Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/accounts', accountRoutes);
    
    // Reset mock implementations
    jest.clearAllMocks();
  });

  describe('POST /accounts', () => {
    it('should create a new account', async () => {
      const response = await request(app)
        .post('/accounts/new')  // Changed to include '/accounts' prefix
        .send({ account_name: 'Test Account' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Account created');
      expect(response.body).toHaveProperty('account');
      
      // Fix: Use a safer approach to check if any create-related function was called
      const mockController = accountController as unknown as Record<string, jest.Mock>;
      const createFnCalled = Object.keys(mockController)
        .some(key => key.includes('create') && mockController[key].mock.calls.length > 0);
      expect(createFnCalled).toBe(true);
    });
  });

  // Similar approach for other tests
  // ...
});