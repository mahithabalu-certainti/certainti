import { jest } from '@jest/globals';
import { Sequelize } from 'sequelize';
import { Currency } from '../../src/models/currencyModel';

describe('Currency Model', () => {
  let sequelize: Sequelize;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
      dialect: 'sqlite' // explicitly specify the dialect
    });
    Currency.initialize(sequelize);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should have correct attributes', () => {
    const attributes = Currency.getAttributes();
    
    expect(attributes.rid).toBeDefined();
    expect(attributes.currency_code).toBeDefined();
    expect(attributes.currency_name).toBeDefined();
    expect(attributes.currency_symbol).toBeDefined();
    expect(attributes.created_datetime).toBeDefined();
    expect(attributes.modified_datetime).toBeDefined();
  });

  it('should have UUID as primary key', () => {
    const attributes = Currency.getAttributes();
    
    expect(attributes.rid.primaryKey).toBe(true);
    // Fix: Use String() to check if the type contains 'UUID'
    expect(String(attributes.rid.type)).toContain('UUID');
  });

  it('should have unique constraint on currency_code', () => {
    const attributes = Currency.getAttributes();
    
    expect(attributes.currency_code.unique).toBe(true);
  });

  it('should have required fields', () => {
    const attributes = Currency.getAttributes();
    
    expect(attributes.currency_code.allowNull).toBe(false);
    expect(attributes.currency_name.allowNull).toBe(false);
    expect(attributes.currency_symbol.allowNull).toBe(false);
  });
});