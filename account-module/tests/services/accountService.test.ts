// First, mock Azure Secrets
jest.mock('../../src/utils/azureSecrets', () => ({
  getSecret: jest.fn().mockResolvedValue('mock-secret'),
  keyVaultUrl: 'https://mock-keyvault.vault.azure.net',
  DefaultAzureCredential: jest.fn()
}));

// Now we can set environment variables and import dependencies
process.env.KEY_VAULT_URI = 'https://mock-keyvault.vault.azure.net';

import AccountService from '../../src/services/accountService';
import { Account } from '../../src/models/accountModel';
import { Country } from '../../src/models/countryModel';
import { Currency } from '../../src/models/currencyModel';
import SchemaService from '../../src/services/schemaService';
import { HttpStatus } from '../../src/utils/constant';

jest.mock('../../src/models/accountModel', () => ({
  Account: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  }
}));

jest.mock('../../src/models/countryModel', () => ({
  Country: {}
}));

jest.mock('../../src/models/currencyModel', () => ({
  Currency: {}
}));

jest.mock('../../src/services/schemaService', () => {
  return jest.fn().mockImplementation(() => ({
    createNewSchema: jest.fn(),
    insertAccountDetails: jest.fn(),
    updateAccountDetails: jest.fn(),
    fetchAccountDetails: jest.fn()
  }));
});

describe('AccountService', () => {
  let accountService: AccountService;
  let mockSchemaService: jest.Mocked<SchemaService>;
  
  beforeEach(() => {
    mockSchemaService = new SchemaService() as jest.Mocked<SchemaService>;
    // Remove the constructor argument if AccountService doesn't accept any parameters
    accountService = new AccountService();
    jest.clearAllMocks();
  });
  
  describe('accountList', () => {
    it('should return account list on success', async () => {
      const mockAccounts = [
        { id: 1, name: 'Account 1' },
        { id: 2, name: 'Account 2' }
      ];
      
      (Account.findAll as jest.Mock).mockResolvedValue(mockAccounts);
      (Account.count as jest.Mock).mockResolvedValue(2);
      
      const result = await accountService.accountList(1, 10, '', {}, 'created_datetime', 'DESC');
      
      expect(Account.findAll).toHaveBeenCalled();
      expect(Account.count).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          account: mockAccounts,
          count: 2
        }
      });
    });
    
    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      (Account.findAll as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await accountService.accountList(1, 10, '', {}, 'created_datetime', 'DESC');
      
      expect(Account.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: errorMessage
      });
    });
  });
  
  describe('createAccount', () => {
    it('should create an account on success', async () => {
      const accountData = {
        account_name: 'Test Account',
        r_number: '12345',
        country_rid: 'country-rid',
        currency_rid: 'currency-rid',
        max_ai_interactions: 3,
        autosend_interaction: true,
        fiscal_start_date: '2023-01-01',
        fiscal_end_date: '2023-12-31',
        primary_contact_email: 'test@example.com',
        primary_contact_number: '1234567890',
        finance_poc_name: 'Finance POC',
        finance_poc_email: 'finance@example.com',
        finance_poc_number: '0987654321',
        project_manager: 'Project Manager',
        auto_access_rd: true,
        storage_type: 'separate_db'
      };
      
      const createdAccount = { 
        ...accountData, 
        rid: 'account-rid' 
      };
      
      (Account.create as jest.Mock).mockResolvedValue(createdAccount);
      mockSchemaService.createNewSchema.mockResolvedValue(undefined);
      mockSchemaService.insertAccountDetails.mockResolvedValue(undefined);
      
      const result = await accountService.createAccount(accountData as any);
      
      expect(Account.create).toHaveBeenCalledWith(expect.objectContaining({
        account_name: 'Test Account',
        r_number: '12345'
      }));
      expect(mockSchemaService.createNewSchema).toHaveBeenCalledWith('12345');
      expect(mockSchemaService.insertAccountDetails).toHaveBeenCalledWith('12345', accountData, 'account-rid');
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          account: createdAccount
        }
      });
    });
    
    it('should handle errors', async () => {
      const accountData = {
        account_name: 'Test Account'
      };
      
      const errorMessage = 'Database error';
      (Account.create as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await accountService.createAccount(accountData as any);
      
      expect(Account.create).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: errorMessage
      });
    });
  });
  
  describe('accountById', () => {
    it('should return account by id on success', async () => {
      const mockAccount = {
        rid: 'account-rid',
        account_name: 'Test Account',
        r_number: '12345',
        storage_type: 'separate_db'
      };
      
      const mockAccountDetails = [
        [{ id: 1, name: 'Account Details' }],
        { metadata: 'some metadata' }
      ] as [unknown[], unknown];
      
      (Account.findOne as jest.Mock).mockResolvedValue(mockAccount);
      mockSchemaService.fetchAccountDetails.mockResolvedValue(mockAccountDetails);
      
      const result = await accountService.accountById('account-rid');
      
      expect(Account.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          rid: 'account-rid'
        }
      }));
      expect(mockSchemaService.fetchAccountDetails).toHaveBeenCalledWith('12345', 'account-rid');
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          accountById: mockAccount,
          accountDetails: mockAccountDetails[0][0]
        }
      });
    });
    
    // Update the other test cases similarly
    it('should handle parent account storage type', async () => {
      const mockAccount = {
        rid: 'account-rid',
        account_name: 'Test Account',
        r_number: '12345',
        storage_type: 'store_in_parent',
        parent_account_rid: 'parent-rid'
      };
      
      const mockParentAccount = {
        rid: 'parent-rid',
        r_number: '67890'
      };
      
      // Update to return a tuple
      const mockAccountDetails = [
        [{ id: 1, name: 'Account Details' }],
        { metadata: 'some metadata' }
      ] as [unknown[], unknown];
      
      (Account.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(mockParentAccount);
      
      mockSchemaService.fetchAccountDetails.mockResolvedValue(mockAccountDetails);
      
      const result = await accountService.accountById('account-rid');
      
      expect(Account.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          rid: 'account-rid'
        }
      }));
      expect(Account.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          rid: 'parent-rid'
        }
      }));
      expect(mockSchemaService.fetchAccountDetails).toHaveBeenCalledWith('67890', 'account-rid');
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          accountById: mockAccount,
          accountDetails: mockAccountDetails[0][0]
        }
      });
    });
    
    it('should handle empty account details', async () => {
      const mockAccount = {
        rid: 'account-rid',
        account_name: 'Test Account',
        r_number: '12345',
        storage_type: 'separate_db'
      };
      
      (Account.findOne as jest.Mock).mockResolvedValue(mockAccount);
      // Update to return an empty array in the tuple format
      mockSchemaService.fetchAccountDetails.mockResolvedValue([[], null]);
      
      const result = await accountService.accountById('account-rid');
      
      expect(result.data?.accountDetails).toEqual({});
    });
  });
});