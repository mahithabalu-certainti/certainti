import { jest } from '@jest/globals';
import { Sequelize, DataTypes } from 'sequelize';
import { DatabaseConnection } from '../../src/models/dbConnectionModel';

describe('DatabaseConnection Model', () => {
  let sequelize: Sequelize;
  
  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:');
    DatabaseConnection.initialize(sequelize as any);
  });

  it('should have correct attributes', () => {
    const attributes = DatabaseConnection.getAttributes();
    
    expect(attributes.rid).toBeDefined();
    expect(attributes.r_number).toBeDefined();
    expect(attributes.eid).toBeDefined();
    expect(attributes.database_name).toBeDefined();
    expect(attributes.created_datetime).toBeDefined();
    expect(attributes.modified_datetime).toBeDefined();
  });

  it('should have UUID as primary key', () => {
    const attributes = DatabaseConnection.getAttributes();
    
    expect(attributes.rid.primaryKey).toBe(true);
    // Fix: Check the type using instanceof or comparing with DataTypes.UUID
    expect(attributes.rid.type instanceof DataTypes.UUID).toBeTruthy();
  });

  it('should have required fields', () => {
    const attributes = DatabaseConnection.getAttributes();
    
    expect(attributes.database_name.allowNull).toBe(false);
  });

  it('should have optional fields', () => {
    const attributes = DatabaseConnection.getAttributes();
    
    expect(attributes.r_number.allowNull).toBe(true);
    expect(attributes.eid.allowNull).toBe(true);
  });
});