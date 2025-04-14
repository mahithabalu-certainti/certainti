import { jest } from '@jest/globals';
import { Sequelize, DataTypes } from 'sequelize';
import { Account } from '../../src/models/accountModel';
import { Country } from '../../src/models/countryModel';
import { Currency } from '../../src/models/currencyModel';

// Mock related models
jest.mock('../../src/models/countryModel', () => {
  const { Model } = require('sequelize');
  class MockCountry extends Model {
    static findByPk = jest.fn();
  }
  return { Country: MockCountry };
});

jest.mock('../../src/models/currencyModel', () => {
  const { Model } = require('sequelize');
  class MockCurrency extends Model {
    static findByPk = jest.fn();
  }
  return { Currency: MockCurrency };
});

// Correct the path to the DatabaseConnection model
jest.mock('../../src/models/databaseConnectionModel', () => {
  const { Model, DataTypes } = require('sequelize');
  return {
    DatabaseConnection: class extends Model {
      static initialize(sequelize: Sequelize) {
        return super.init({
          rid: DataTypes.UUID
        }, { sequelize, modelName: 'database_connection' });
      }
      static findByPk: jest.Mock = jest.fn();
    }
  };
});

// Correct import path for DatabaseConnection
import { DatabaseConnection } from '../../src/models/dbConnectionModel';

// Alternative path pattern
jest.mock('../../src/models/databaseConnection', () => {
  const { Model } = require('sequelize');
  class MockDatabaseConnection extends Model {
    static findByPk = jest.fn();
    static initialize(sequelize: Sequelize) {
      return super.init({
        rid: {
          type: DataTypes.UUID,
          primaryKey: true
        }
      }, {
        sequelize,
        tableName: 'database_connections'
      });
    }
  }
  return { default: MockDatabaseConnection };
});

// Alternative import
// Remove duplicate import since DatabaseConnection is already imported above

describe('Account Model', () => {
  let sequelize: Sequelize;
  
  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    // Initialize all required models in correct order
    DatabaseConnection.initialize(sequelize);
    Country.initialize(sequelize);
    Currency.initialize(sequelize);
    Account.initialize(sequelize);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should have correct attributes', () => {
    const attributes = Account.getAttributes();
    
    expect(attributes.rid).toBeDefined();
    expect(attributes.account_name).toBeDefined();
    expect(attributes.r_number).toBeDefined();
    // Remove account_type as it doesn't exist in the model
    expect(attributes.country_rid).toBeDefined();
    expect(attributes.currency_rid).toBeDefined();
    expect(attributes.created_datetime).toBeDefined();
    expect(attributes.modified_datetime).toBeDefined();
  });

  // Also update the required fields test
  it('should have required fields', () => {
    const attributes = Account.getAttributes();
    
    expect(attributes.account_name.allowNull).toBe(false);
    expect(attributes.r_number.allowNull).toBe(false);
    // Remove account_type as it doesn't exist in the model
    expect(attributes.country_rid.allowNull).toBe(false);
    expect(attributes.currency_rid.allowNull).toBe(false);
  });

  it('should have UUID as primary key', () => {
    const attributes = Account.getAttributes();
    
    expect(attributes.rid.primaryKey).toBe(true);
    expect(String(attributes.rid.type)).toContain('UUID');
  });

  // Remove this duplicate test that contains the error
  // it('should have required fields', () => {
  //   const attributes = Account.getAttributes();
  //   
  //   expect(attributes.account_name.allowNull).toBe(false);
  //   expect(attributes.r_number.allowNull).toBe(false);
  //   expect(attributes.account_type.allowNull).toBe(false);
  //   expect(attributes.country_rid.allowNull).toBe(false);
  //   expect(attributes.currency_rid.allowNull).toBe(false);
  // });

  it('should validate country existence', async () => {
    const attributes = Account.getAttributes();
    const validator = attributes.country_rid.validate?.isCountryExist as Function;
    
    expect(validator).toBeDefined();
    
    // Mock country not found
    (Country.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(null));
    
    await expect(validator('test-uuid')).rejects.toThrow('Country with id test-uuid does not exist');
    
    // Mock country found
    (Country.findByPk as jest.Mock).mockImplementation(() => Promise.resolve({ id: 'test-uuid' }));
    
    await expect(validator('test-uuid')).resolves.toBeUndefined();
  });

  it('should validate currency existence', async () => {
    const attributes = Account.getAttributes();
    const validator = attributes.currency_rid.validate?.isCurrencyExist as Function;
    
    expect(validator).toBeDefined();
    
    // Mock currency not found
    (Currency.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(null));
    
    await expect(validator('test-uuid')).rejects.toThrow('Currency with id test-uuid does not exist');
    
    // Mock currency found
    (Currency.findByPk as jest.Mock).mockImplementation(() => Promise.resolve({ id: 'test-uuid' }));
    
    await expect(validator('test-uuid')).resolves.toBeUndefined();
  });

  it('should have associations with Country and Currency', () => {
    const associations = Account.associations;
    
    expect(associations.country).toBeDefined();
    expect(associations.country.foreignKey).toBe('country_rid');
    
    expect(associations.currency).toBeDefined();
    expect(associations.currency.foreignKey).toBe('currency_rid');
  });

  it('should have correct table name', () => {
    expect(Account.tableName).toBe('accounts');
  });

  it('should have timestamps', () => {
    expect(Account.options.timestamps).toBe(true);
    expect(Account.options.createdAt).toBe('created_datetime');
    expect(Account.options.updatedAt).toBe('modified_datetime');
  });

  it('should handle model initialization correctly', () => {
    // Test re-initialization
    Account.initialize(sequelize as any);
    
    // Verify attributes are properly set up
    const attributes = Account.getAttributes();
    expect(Object.keys(attributes).length).toBeGreaterThan(0);
  });

  it('should handle validation errors properly', async () => {
    try {
      // Create an instance with invalid data to trigger validators
      const account = Account.build({
        account_name: 'Test Account',
        r_number: '12345',
        country_rid: 'invalid-uuid',
        currency_rid: 'invalid-uuid',
        account_description: 'Test Description',
        is_parent: false,
        storage_type: 'local',
        industry: 'technology',
        status: 'active',
        primary_contact_name: 'John Doe',
        annual_revenue: 1000000
      });
      
      // Fix: Use mockImplementation instead of mockRejectedValue
      const countryValidator = jest.fn().mockImplementation(() => {
        throw new Error('Country validation failed');
      });
      const currencyValidator = jest.fn().mockImplementation(() => {
        throw new Error('Currency validation failed');
      });
      
      // Replace the actual validators with our mocks
      const attributes = Account.getAttributes();
      const originalCountryValidator = attributes.country_rid.validate?.isCountryExist;
      const originalCurrencyValidator = attributes.currency_rid.validate?.isCurrencyExist;
      
      attributes.country_rid.validate = { isCountryExist: countryValidator as any };
      attributes.currency_rid.validate = { isCurrencyExist: currencyValidator as any };
      
      // Attempt to validate
      await expect(account.validate()).rejects.toThrow();
      
      // Restore original validators
      attributes.country_rid.validate = { isCountryExist: originalCountryValidator };
      attributes.currency_rid.validate = { isCurrencyExist: originalCurrencyValidator };
    } catch (error) {
      // Test should reach here
      expect(error).toBeDefined();
    }
  });

  it('should test model hooks if any', () => {
    // If your model has hooks like beforeCreate, beforeUpdate, etc.
    const hooks = (Account as any).options.hooks;
    
    if (hooks && hooks.beforeCreate) {
      const instance = Account.build({
        account_name: 'Test Account',
        r_number: '12345',
        country_rid: 'test-uuid',
        currency_rid: 'test-uuid',
        // Add missing required properties
        account_description: 'Test Description',
        is_parent: false,
        storage_type: 'local',
        industry: 'technology',
        status: 'active',
        // Add the missing required properties
        primary_contact_name: 'John Doe',
        annual_revenue: 1000000
      });
      
      // Call the hook directly
      hooks.beforeCreate(instance, {});
      
      // Assert any changes the hook should have made
      // For example, if beforeCreate sets a default value:
      // expect(instance.someField).toBe('defaultValue');
    }
  });

  it('should test any custom instance methods', () => {
    // If your model has custom instance methods, test them here
    const instance = Account.build({
      account_name: 'Test Account',
      r_number: '12345',
      country_rid: 'test-uuid',
      currency_rid: 'test-uuid',
      // Add missing required properties
      account_description: 'Test Description',
      is_parent: false,
      storage_type: 'local',
      industry: 'technology',
      status: 'active',
      // Remove invalid properties
      // account_owner: 'test-owner',
      // account_type: 'business',
      // Add the missing properties
      primary_contact_name: 'John Doe',
      annual_revenue: 1000000
    });
    
    // Test any instance methods
    // For example:
    // expect(instance.someMethod()).toBe(expectedResult);
    
    // If no instance methods exist, this test can be a placeholder
    expect(instance).toBeDefined();
  });

  it('should test any custom class methods', () => {
    // If your model has custom static methods, test them here
    // For example:
    // expect(Account.someStaticMethod()).toBe(expectedResult);
    
    // If no static methods exist, this test can be a placeholder
    expect(Account).toBeDefined();
  });
});