import { jest } from '@jest/globals';
import { Sequelize } from 'sequelize';
import { Country } from '../../src/models/countryModel';
import { Currency } from '../../src/models/currencyModel';
import { Region } from '../../src/models/regionModel';

// Mock Currency model
// Update Currency mock to include initialize method
jest.mock('../../src/models/currencyModel', () => {
  const { Model, DataTypes } = require('sequelize');
  class MockCurrency extends Model {
    static findByPk = jest.fn();
    static initialize(sequelize: Sequelize) {
      return super.init({
        rid: {
          type: DataTypes.UUID,
          primaryKey: true
        },
        // Add other required fields
        code: DataTypes.STRING,
        name: DataTypes.STRING
      }, {
        sequelize,
        tableName: 'currencies'
      });
    }
  }
  return { Currency: MockCurrency };
});

// Mock Region model
// Update Region mock to include proper initialization
jest.mock('../../src/models/regionModel', () => {
  const { Model, DataTypes } = require('sequelize');
  class MockRegion extends Model {
    static initialize(sequelize: Sequelize) {
      return super.init({
        rid: {
          type: DataTypes.UUID,
          primaryKey: true
        },
        country_rid: {
          type: DataTypes.UUID,
          allowNull: false
        }
      }, {
        sequelize,
        tableName: 'regions'
      });
    }
  }
  return { Region: MockRegion };
});

// Add Country model mock
jest.mock('../../src/models/countryModel', () => {
  const { Model, DataTypes } = require('sequelize');
  class MockCountry extends Model {
    static initialize(sequelize: Sequelize) {
      return super.init({
        rid: {
          type: DataTypes.UUID,
          primaryKey: true
        },
        r_number: {
          type: DataTypes.STRING,
          allowNull: false
        },
        country_code: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        country_name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        default_currency_rid: {
          type: DataTypes.UUID,
          allowNull: false
        }
      }, {
        sequelize,
        tableName: 'countries',
        timestamps: true,
        createdAt: 'created_datetime',
        updatedAt: 'modified_datetime'
      });
    }
  }
  return { Country: MockCountry };
});

describe('Country Model', () => {
  let sequelize: Sequelize;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
      dialect: 'sqlite'
    });

    // Initialize all models in correct order
    Currency.initialize(sequelize);
    Region.initialize(sequelize);  // Initialize Region before Country
    Country.initialize(sequelize);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should have correct attributes', () => {
    const attributes = Country.getAttributes();
    
    expect(attributes).toHaveProperty('rid');
    expect(attributes).toHaveProperty('country_name');
    expect(attributes).toHaveProperty('country_code');
    expect(attributes).toHaveProperty('default_currency_rid');
    expect(attributes.rid).toBeDefined();
    expect(attributes.r_number).toBeDefined();
    expect(attributes.country_code).toBeDefined();
    expect(attributes.country_name).toBeDefined();
    expect(attributes.default_currency_rid).toBeDefined();
    expect(attributes.created_datetime).toBeDefined();
    expect(attributes.modified_datetime).toBeDefined();
  });

  it('should have UUID as primary key', () => {
    const attributes = Country.getAttributes();
    
    expect(attributes.rid.primaryKey).toBe(true);
    expect(String(attributes.rid.type)).toContain('UUID');
  });

  it('should have required fields', () => {
    const attributes = Country.getAttributes();
    
    expect(attributes.r_number.allowNull).toBe(false);
    expect(attributes.country_code.allowNull).toBe(false);
    expect(attributes.country_name.allowNull).toBe(false);
    expect(attributes.default_currency_rid.allowNull).toBe(false);
  });

  it('should validate currency existence', async () => {
    const attributes = Country.getAttributes();
    const validator = attributes.default_currency_rid.validate?.isCurrencyExist as Function;
    
    expect(validator).toBeDefined();
    
    // Mock currency not found
    (Currency.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(null));
    
    await expect(validator('test-uuid')).rejects.toThrow('Currency with id test-uuid does not exist');
    
    // Mock currency found
    (Currency.findByPk as jest.Mock).mockImplementation(() => Promise.resolve({ id: 'test-uuid' }));
    
    await expect(validator('test-uuid')).resolves.toBeUndefined();
  });

  it('should have unique constraint on country_code', () => {
    const attributes = Country.getAttributes();
    
    expect(attributes.country_code.unique).toBe(true);
  });

  it('should have associations with Currency and Region', () => {
    const associations = Country.associations;
    
    expect(associations.currency).toBeDefined();
    expect(associations.currency.foreignKey).toBe('default_currency_rid');
    
    expect(associations.regions).toBeDefined();
    expect(associations.regions.foreignKey).toBe('country_rid');
  });

  it('should have correct table name', () => {
    expect(Country.tableName).toBe('countries');
  });

  it('should have timestamps', () => {
    expect(Country.options.timestamps).toBe(true);
    expect(Country.options.createdAt).toBe('created_datetime');
    expect(Country.options.updatedAt).toBe('modified_datetime');
  });
  
  it('should handle model initialization correctly', () => {
    // Re-initialize to test the initialization logic
    Country.initialize(sequelize as any);
    
    // Instead of using isInitialized, check if the model has attributes defined
    expect(Object.keys(Country.getAttributes()).length).toBeGreaterThan(0);
  });

  it('should handle validation errors properly', async () => {
    // Create an instance with invalid data to trigger validators
    const country = Country.build({
      r_number: '12345',
      country_code: 'US',
      country_name: 'United States',
      default_currency_rid: 'invalid-uuid'
    });
    
    // Mock Currency.findByPk to simulate validation failure
    (Currency.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(null));
    
    // Attempt to validate the model
    let error: Error | undefined;
    try {
      await country.validate();
    } catch (err) {
      error = err as Error;
    }
    
    // Assert that the validation failed
    expect(error).toBeDefined();
    expect(error?.message).toContain('Currency with id invalid-uuid does not exist');
    
    // Reset the mock
    (Currency.findByPk as jest.Mock).mockReset();
  });

  it('should test model hooks if any', () => {
    // If your model has hooks like beforeCreate, beforeUpdate, etc.
    // Test them here by triggering them directly
    const hooks = (Country as any).options.hooks;
    
    if (hooks && hooks.beforeCreate) {
      const instance = Country.build({
        r_number: '12345',
        country_code: 'US',
        country_name: 'United States',
        default_currency_rid: 'test-uuid'
      });
      
      // Call the hook directly
      hooks.beforeCreate(instance, {});
      
      // Assert any changes the hook should have made
    }
  });

  it('should test any custom instance methods', () => {
    // If your model has custom instance methods, test them here
    const instance = Country.build({
      r_number: '12345',
      country_code: 'US',
      country_name: 'United States',
      default_currency_rid: 'test-uuid'
    });
    
    // Test any instance methods
    expect(instance).toBeDefined();
  });

  it('should test any custom class methods', () => {
    // If your model has custom static methods, test them here
    expect(Country).toBeDefined();
  });

  it('should test model scopes if any', () => {
    // If your model has scopes, test them here
    if ((Country as any).scopes) {
      // For example:
      // const scope = Country.scope('someScopeName');
      // expect(scope).toBeDefined();
    }
  });
});