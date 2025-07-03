import SchemaService from '../../src/services/schemaService';
import { initOrgSequelize } from '../../src/config/orgdbDataSource';

// Mock the database connection
jest.mock('../../src/config/orgdbDataSource', () => ({
  initOrgSequelize: jest.fn()
}));

describe('SchemaService', () => {
  let schemaService: SchemaService;
  const mockSequelize = {
    createSchema: jest.fn(),
    query: jest.fn()
  };
  
  beforeEach(() => {
    schemaService = new SchemaService();
    (initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
    jest.clearAllMocks();
  });
  
  describe('createNewSchema', () => {
    it('should create a new schema and tables', async () => {
      await schemaService.createNewSchema('12345');
      
      expect(initOrgSequelize).toHaveBeenCalled();
      expect(mockSequelize.createSchema).toHaveBeenCalledWith('platform_v2_12345', {});
      expect(mockSequelize.query).toHaveBeenCalled();
    });
    
    it('should throw an error when schema creation fails', async () => {
      mockSequelize.createSchema.mockRejectedValue(new Error('Schema creation failed'));
      
      await expect(schemaService.createNewSchema('12345')).rejects.toThrow('Error creating schema and tables.');
      
      expect(initOrgSequelize).toHaveBeenCalled();
      expect(mockSequelize.createSchema).toHaveBeenCalledWith('platform_v2_12345', {});
    });
  });
  
  describe('insertAccountDetails', () => {
    it('should insert account details', async () => {
      const accountData = {
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
        auto_access_rd: true
      };
      
      await schemaService.insertAccountDetails('12345', accountData as any, 'account-rid');
      
      expect(initOrgSequelize).toHaveBeenCalled();
      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO "platform_v2_12345"."account_details"'),
        expect.objectContaining({
          replacements: expect.objectContaining({
            account_rid: 'account-rid',
            max_ai_interactions: 3,
            autosend_interaction: true
          })
        })
      );
    });
  });
  
  describe('updateAccountDetails', () => {
    it('should update account details', async () => {
      const accountData = {
        max_ai_interactions: 4,
        autosend_interaction: false,
        primary_contact_email: 'updated@example.com',
        primary_contact_number: '9876543210',
        finance_poc_name: 'Updated Finance POC',
        finance_poc_email: 'updated-finance@example.com',
        finance_poc_number: '1234567890',
        project_manager: 'Updated Project Manager',
        auto_access_rd: false
      };
      
      await schemaService.updateAccountDetails('account-rid', accountData as any, '12345');
      
      expect(initOrgSequelize).toHaveBeenCalled();
      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "platform_v2_12345"."account_details"'),
        expect.objectContaining({
          replacements: expect.objectContaining({
            account_rid: 'account-rid',
            max_ai_interactions: 4,
            autosend_interaction: false
          })
        })
      );
    });
  });
  
  describe('fetchAccountDetails', () => {
    it('should fetch account details', async () => {
      const mockAccountDetails = [
        [{
          id: 1,
          name: 'Test Account'
        }],
        null
      ];

      // Use mockSequelize instead of pool
      mockSequelize.query.mockResolvedValue([
        [{
          id: 1,
          name: 'Test Account'
        }],
        null
      ]);

      const result = await schemaService.fetchAccountDetails('12345', 'account-rid');
      expect(result).toEqual(mockAccountDetails);
    });
  });
});