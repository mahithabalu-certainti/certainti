import { jest } from '@jest/globals';
import { Sequelize } from 'sequelize';
import { Region } from '../../src/models/regionModel';
import { Country } from '../../src/models/countryModel';
import { Currency } from '../../src/models/currencyModel';

// Mock the Currency model
jest.mock('../../src/models/currencyModel', () => {
  const { Model, DataTypes } = require('sequelize');
  class MockCurrency extends Model {
    static initialize(sequelize: Sequelize) {
      return super.init({
        rid: {
          type: DataTypes.UUID,
          primaryKey: true
        }
      }, {
        sequelize,
        tableName: 'currencies'
      });
    }
  }
  return { Currency: MockCurrency };
});

// Mock the Country model to ensure associations can be set up
jest.mock('../../src/models/countryModel', () => {
  const { Model, DataTypes } = require('sequelize');
  class MockCountry extends Model {
    static initialize(sequelize: Sequelize) {
      return super.init({
        rid: {
          type: DataTypes.UUID,
          primaryKey: true
        },
        default_currency_rid: DataTypes.UUID
      }, {
        sequelize,
        tableName: 'countries'
      });
    }
  }
  return { Country: MockCountry };
});

describe('Region Model', () => {
  let sequelize: Sequelize;
  
  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });

    // Initialize Currency model before Country
    Currency.initialize(sequelize as any);
    Country.initialize(sequelize as any);
    Region.initialize(sequelize as any);
  });

  it('should have correct attributes', () => {
    const attributes = Region.getAttributes();
    
    expect(attributes.rid).toBeDefined();
    expect(attributes.r_number).toBeDefined();
    expect(attributes.country_rid).toBeDefined();
    expect(attributes.country_name).toBeDefined();
    expect(attributes.region_name).toBeDefined();
    expect(attributes.created_datetime).toBeDefined();
    expect(attributes.modified_datetime).toBeDefined();
  });

  it('should have UUID as primary key', () => {
    const attributes = Region.getAttributes();
    
    expect(attributes.rid.primaryKey).toBe(true);
    expect(String(attributes.rid.type)).toContain('UUID');
  });

  it('should have required fields', () => {
    const attributes = Region.getAttributes();
    
    expect(attributes.r_number.allowNull).toBe(false);
    expect(attributes.country_rid.allowNull).toBe(false);
    expect(attributes.country_name.allowNull).toBe(false);
    expect(attributes.region_name.allowNull).toBe(false);
  });

  it('should have association with Country', () => {
    const associations = Region.associations;
    
    expect(associations.country).toBeDefined();
    expect(associations.country.foreignKey).toBe('country_rid');
  });
});