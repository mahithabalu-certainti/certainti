import { jest } from '@jest/globals';
import { Sequelize } from 'sequelize';
import { States } from '../../src/models/stateModel';
import { Country } from '../../src/models/countryModel';

// Mock Country model
jest.mock('../../src/models/countryModel', () => {
  const { Model, DataTypes } = require('sequelize');
  class MockCountry extends Model {
    static initialize(sequelize: Sequelize) {
      return super.init({
        rid: {
          type: DataTypes.UUID,
          primaryKey: true
        }
      }, {
        sequelize,
        tableName: 'countries'
      });
    }
  }
  return { Country: MockCountry };
});

describe('States Model', () => {
  let sequelize: Sequelize;
  
  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    // Initialize Country before States
    Country.initialize(sequelize as any);
    States.initialize(sequelize as any);
  });

  it('should have correct attributes', () => {
    const attributes = States.getAttributes();
    
    expect(attributes.rid).toBeDefined();
    expect(attributes.r_number).toBeDefined();
    expect(attributes.country_rid).toBeDefined();
    expect(attributes.state_name).toBeDefined();
    expect(attributes.created_datetime).toBeDefined();
    expect(attributes.modified_datetime).toBeDefined();
  });

  it('should have UUID as primary key', () => {
    const attributes = States.getAttributes();
    
    expect(attributes.rid.primaryKey).toBe(true);
    // Use a string comparison instead of DataTypes
    expect(String(attributes.rid.type)).toContain('UUID');
  });

  it('should have required fields', () => {
    const attributes = States.getAttributes();
    
    expect(attributes.r_number.allowNull).toBe(false);
    expect(attributes.country_rid.allowNull).toBe(false);
    expect(attributes.state_name.allowNull).toBe(false);
  });

  it('should have association with Country', () => {
    const associations = States.associations;
    
    expect(associations.country).toBeDefined();
    expect(associations.country.foreignKey).toBe('country_rid');
  });
});