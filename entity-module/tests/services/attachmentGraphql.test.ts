process.env.KEY_VAULT_URI = 'https://mocked-key-vault-url.vault.azure.net/';

import { Sequelize } from 'sequelize';
import AttachmentGraphqlServies from '../../src/services/attachmentGraphqlService';
import { initMainDbSequelize } from '../../src/config/mainDataSource';
import { initOrgSequelize } from '../../src/config/orgDataSource';
import Configurations from '../../src/config/config';
import { setInlineForAttachments } from '../../src/utils/helpers';
import { HttpStatus, STATUS_MESSAGE, rawQueries, MAIN_SCHEMA_NAME } from '../../src/utils/constants';
import { AttachmentService } from '../../src/services/attachmentService';

// Mock dependencies before importing the module
jest.mock('../../src/utils/azureSecrets', () => ({
  getSecret: jest.fn().mockResolvedValue('mocked-db-secret'),
}));

jest.mock('../../src/config/mainDataSource', () => ({
  initMainDbSequelize: jest.fn().mockResolvedValue({
    query: jest.fn(),
  }),
}));

jest.mock('../../src/config/orgDataSource', () => ({
  initOrgSequelize: jest.fn().mockResolvedValue({
    query: jest.fn(),
  }),
}));

jest.mock('../../src/services/attachmentService', () => ({
  AttachmentService: jest.fn().mockImplementation(() => ({
    getAttachments: jest.fn(),
  })),
}));

jest.mock('../../src/config/config', () => ({
  __esModule: true,
  default: class {
    private static instance: any;
    static getInstance() {
      if (!this.instance) {
        this.instance = {
          getServices: jest.fn().mockReturnValue({
            attachmentServices: new (require('../../src/services/attachmentService').AttachmentService)(),
          }),
        };
      }
      return this.instance;
    }
  },
}));

jest.mock('../../src/utils/helpers');
jest.mock('../../src/utils/constants', () => {
  const actual = jest.requireActual('../../src/utils/constants');
  return {
    ...actual,
    HttpStatus: {
      NOT_FOUND: 404,
      BAD_REQUEST: 400,
      SUCCESS: 200,
    },
    STATUS_MESSAGE: {
      accountNoFound: 'Account not found',
      noAttachmentRecordFound: 'No attachment record found',
      docCatInvalid: 'Invalid document category',
      docTypeInvalid: 'Invalid document type',
      noDataToUpdate: 'No data to update',
      attachmentUpdatedSuccess: 'Attachment updated successfully',
      separateDb: 'separate_db',
    },
    MAIN_SCHEMA_NAME: 'main',
    rawQueries: {
      fetchParentAccount: jest.fn(),
      fetchSchemaName: jest.fn(),
      findAttachementDetails: jest.fn(),
      checkDocCategoryExists: jest.fn(),
      checkDocTypeExists: jest.fn(),
      updateAttachmentQuery: jest.fn(),
      updateAttachmentSummary: jest.fn(),
      insertAttachementTimeline: jest.fn(),
    },
  };
});

describe('AttachmentGraphqlServies', () => {
  let attachmentGraphqlServices: AttachmentGraphqlServies;
  let mockMainSequelize: any;
  let mockOrgSequelize: any;
  let mockAttachmentService: any;

  beforeEach(() => {
    jest.resetModules(); // Reset module state to ensure mocks are applied
    mockMainSequelize = {
      query: jest.fn(),
    };
    mockOrgSequelize = {
      query: jest.fn(),
    };
    mockAttachmentService = new (require('../../src/services/attachmentService').AttachmentService)();

    (initMainDbSequelize as jest.Mock).mockResolvedValue(mockMainSequelize);
    (initOrgSequelize as jest.Mock).mockResolvedValue(mockOrgSequelize);
    (Configurations.getInstance().getServices as jest.Mock).mockReturnValue({
      attachmentServices: mockAttachmentService,
    });

    attachmentGraphqlServices = new AttachmentGraphqlServies();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateInlineGraphqlDetails', () => {
    const mockData = {
      rid: 'doc123',
      account_rid: 'acc123',
      fiscal_year: 2023,
      document_category_rid: 'cat123',
      document_type_rid: 'type123',
      document_category_others: 'Other Category',
      document_type_others: 'Other Type',
      comments: 'Test comment',
      userId: 'user123',
    };

    const mockAttachmentData = {
      rid: 'doc123',
      r_number: 'r123',
      created_datetime: '2023-01-01T00:00:00Z',
      created_by: 'user123',
      modified_datetime: '2023-01-02T00:00:00Z',
      modified_by: 'user123',
      account_rid: 'acc123',
      document_name: 'doc.pdf',
      attach_to: 'to1',
      attachment_level: 'level1',
      fiscal_year: 2022,
      format: 'pdf',
      size_in_mb: '1.5',
      document_category_rid: 'cat456',
      document_type_rid: 'type456',
      document_category_others: null,
      document_type_others: null,
      comments: 'Old comment',
      document_type: 'Type A',
      document_category: 'Category A',
      uploaded_by: 'user123',
      attached_to: 'to1',
      browse_file: 'file://doc.pdf',
    };

    const mockGetAttachmentsResponse = {
      data: {
        attachments: [
          {
            rid: 'doc123',
            r_number: 'r123',
            created_datetime: '2023-01-01T00:00:00Z',
            created_by: 'user123',
            modified_datetime: '2023-01-02T00:00:00Z',
            modified_by: 'user123',
            account_rid: 'acc123',
            document_name: 'doc.pdf',
            attach_to: 'to1',
            attachment_level: 'level1',
            fiscal_year: 2023,
            format: 'pdf',
            size_in_mb: '1.5',
            document_category_rid: 'cat123',
            document_type_rid: 'type123',
            document_category_others: 'Other Category',
            document_type_others: 'Other Type',
            comments: 'Test comment',
            document_type: 'Type B',
            document_category: 'Category B',
            uploaded_by: 'user123',
            attached_to: 'to1',
            browse_file: 'file://doc.pdf',
          },
        ],
      },
    };

    it('should return NOT_FOUND when account does not exist', async () => {
      (rawQueries.fetchParentAccount as jest.Mock).mockResolvedValue('SELECT * FROM main.account WHERE rid = :account_rid');
      mockMainSequelize.query.mockResolvedValue([[], {}]);

      const result = await attachmentGraphqlServices.updateInlineGraphqlDetails(mockData);

      expect(rawQueries.fetchParentAccount).toHaveBeenCalledWith('acc123', expect.any(Object));
      expect(mockMainSequelize.query).toHaveBeenCalledWith('SELECT * FROM main.account WHERE rid = :account_rid');
      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.accountNoFound,
        data: null,
      });
    });

    it('should return NOT_FOUND when attachment does not exist', async () => {
      (rawQueries.fetchParentAccount as jest.Mock).mockResolvedValue('SELECT * FROM main.account WHERE rid = :account_rid');
      (rawQueries.fetchSchemaName as jest.Mock).mockReturnValue('main_acc123');
      (rawQueries.findAttachementDetails as jest.Mock).mockReturnValue("SELECT * FROM main_acc123.attachments WHERE rid = 'doc123' AND account_rid = 'acc123'");
      mockMainSequelize.query.mockResolvedValue([[{ rid: 'acc123', r_number: 'ACC-123', storage_type: 'separate_db' }], {}]);
      mockOrgSequelize.query.mockResolvedValue([[], {}]);

      const result = await attachmentGraphqlServices.updateInlineGraphqlDetails(mockData);

      expect(rawQueries.findAttachementDetails).toHaveBeenCalledWith('main_acc123', 'doc123', 'acc123');
      expect(mockOrgSequelize.query).toHaveBeenCalledWith("SELECT * FROM main_acc123.attachments WHERE rid = 'doc123' AND account_rid = 'acc123'");
      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.noAttachmentRecordFound,
        data: null,
      });
    });

    it('should return NOT_FOUND when document category is invalid', async () => {
      (rawQueries.fetchParentAccount as jest.Mock).mockResolvedValue('SELECT * FROM main.account WHERE rid = :account_rid');
      (rawQueries.fetchSchemaName as jest.Mock).mockReturnValue('main_acc123');
      (rawQueries.findAttachementDetails as jest.Mock).mockReturnValue("SELECT * FROM main_acc123.attachments WHERE rid = 'doc123' AND account_rid = 'acc123'");
      (rawQueries.checkDocCategoryExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_categories WHERE rid = :document_category_rid');
      mockMainSequelize.query
        .mockResolvedValueOnce([[{ rid: 'acc123', r_number: 'ACC-123', storage_type: 'separate_db' }], {}])
        .mockResolvedValueOnce([[], {}]);
      mockOrgSequelize.query.mockResolvedValue([[mockAttachmentData], {}]);

      const result = await attachmentGraphqlServices.updateInlineGraphqlDetails(mockData);

      expect(mockMainSequelize.query).toHaveBeenCalledWith('SELECT 1 FROM main.document_categories WHERE rid = :document_category_rid');
      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.docCatInvalid,
        data: null,
      });
    });

    it('should return NOT_FOUND when document type is invalid', async () => {
      (rawQueries.fetchParentAccount as jest.Mock).mockResolvedValue('SELECT * FROM main.account WHERE rid = :account_rid');
      (rawQueries.fetchSchemaName as jest.Mock).mockReturnValue('main_acc123');
      (rawQueries.findAttachementDetails as jest.Mock).mockReturnValue("SELECT * FROM main_acc123.attachments WHERE rid = 'doc123' AND account_rid = 'acc123'");
      (rawQueries.checkDocCategoryExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_categories WHERE rid = :document_category_rid');
      (rawQueries.checkDocTypeExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_types WHERE rid = :document_type_rid');
      mockMainSequelize.query
        .mockResolvedValueOnce([[{ rid: 'acc123', r_number: 'ACC-123', storage_type: 'separate_db' }], {}])
        .mockResolvedValueOnce([[{ id: 'cat123' }], {}])
        .mockResolvedValueOnce([[], {}]);
      mockOrgSequelize.query.mockResolvedValue([[mockAttachmentData], {}]);

      const result = await attachmentGraphqlServices.updateInlineGraphqlDetails(mockData);

      expect(mockMainSequelize.query).toHaveBeenCalledWith('SELECT 1 FROM main.document_types WHERE rid = :document_type_rid');
      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.docTypeInvalid,
        data: null,
      });
    });

    it('should return BAD_REQUEST when no data to update', async () => {
      (rawQueries.fetchParentAccount as jest.Mock).mockResolvedValue('SELECT * FROM main.account WHERE rid = :account_rid');
      (rawQueries.fetchSchemaName as jest.Mock).mockReturnValue('main_acc123');
      (rawQueries.findAttachementDetails as jest.Mock).mockReturnValue("SELECT * FROM main_acc123.attachments WHERE rid = 'doc123' AND account_rid = 'acc123'");
      (rawQueries.checkDocCategoryExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_categories WHERE rid = :document_category_rid');
      (rawQueries.checkDocTypeExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_types WHERE rid = :document_type_rid');
      mockMainSequelize.query
        .mockResolvedValueOnce([[{ rid: 'acc123', r_number: 'ACC-123', storage_type: 'separate_db' }], {}])
        .mockResolvedValueOnce([[{ id: 'cat123' }], {}])
        .mockResolvedValueOnce([[{ id: 'type123' }], {}]);
      mockOrgSequelize.query.mockResolvedValue([[mockAttachmentData], {}]);
      (setInlineForAttachments as jest.Mock).mockReturnValue({
        statusMessage: STATUS_MESSAGE.noDataToUpdate,
        data: [],
      });

      const result = await attachmentGraphqlServices.updateInlineGraphqlDetails({
        ...mockData,
        fiscal_year: 2022,
        document_category_rid: 'cat456',
        document_type_rid: 'type456',
      });

      expect(setInlineForAttachments).toHaveBeenCalledWith(mockAttachmentData, {
        ...mockData,
        fiscal_year: 2022,
        document_category_rid: 'cat456',
        document_type_rid: 'type456',
      });
      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: STATUS_MESSAGE.noDataToUpdate,
        data: null,
      });
    });

    it('should successfully update attachment and return structured data', async () => {
      (rawQueries.fetchParentAccount as jest.Mock).mockResolvedValue('SELECT * FROM main.account WHERE rid = :account_rid');
      (rawQueries.fetchSchemaName as jest.Mock).mockReturnValue('main_acc123');
      (rawQueries.findAttachementDetails as jest.Mock).mockReturnValue("SELECT * FROM main_acc123.attachments WHERE rid = 'doc123' AND account_rid = 'acc123'");
      (rawQueries.checkDocCategoryExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_categories WHERE rid = :document_category_rid');
      (rawQueries.checkDocTypeExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_types WHERE rid = :document_type_rid');
      (rawQueries.updateAttachmentQuery as jest.Mock).mockReturnValue('UPDATE main_acc123.attachments SET fiscal_year = 2023, document_category_rid = "cat123", document_type_rid = "type123", modified_by = "user123", modified_datetime = NOW() WHERE rid = "doc123"');
      (rawQueries.updateAttachmentSummary as jest.Mock).mockReturnValue('UPDATE main.attachment_summary SET ... WHERE rid = "doc123"');
      (rawQueries.insertAttachementTimeline as jest.Mock).mockReturnValue('INSERT INTO main_acc123.attachment_timeline ...');
      mockMainSequelize.query
        .mockResolvedValueOnce([[{ rid: 'acc123', r_number: 'ACC-123', storage_type: 'separate_db' }], {}])
        .mockResolvedValueOnce([[{ id: 'cat123' }], {}])
        .mockResolvedValueOnce([[{ id: 'type123' }], {}])
        .mockResolvedValueOnce([[{ id: 'summary123' }], {}]);
      mockOrgSequelize.query
        .mockResolvedValueOnce([[mockAttachmentData], {}])
        .mockResolvedValueOnce([[{ id: 'attachment123' }], {}])
        .mockResolvedValueOnce([[], {}]);
      (setInlineForAttachments as jest.Mock).mockReturnValue({
        statusMessage: null,
        data: [
          'fiscal_year = 2023',
          'document_category_rid = "cat123"',
          'document_type_rid = "type123"',
          'modified_by = "user123"',
          'modified_datetime = NOW()',
        ],
      });
      mockAttachmentService.getAttachments.mockReset();
      mockAttachmentService.getAttachments.mockImplementation((...args : any) => {
        console.log('getAttachments called with:', args);
        return Promise.resolve(mockGetAttachmentsResponse);
      });

      const result = await attachmentGraphqlServices.updateInlineGraphqlDetails(mockData);

      console.log('getAttachments mock calls:', mockAttachmentService.getAttachments.mock.calls);
      console.log('getAttachments mock results:', mockAttachmentService.getAttachments.mock.results);

      expect(mockAttachmentService.getAttachments).toHaveBeenCalledTimes(1);
      expect(mockAttachmentService.getAttachments).toHaveBeenCalledWith(
        'user123',
        'level1',
        'to1',
        'acc123',
        1,
        1,
        '',
        expect.any(Object),
        'created_datetime',
        'DESC',
        0,
        { document_rid: 'doc123' }
      );
      expect(setInlineForAttachments).toHaveBeenCalledWith(mockAttachmentData, mockData);
      expect(rawQueries.updateAttachmentQuery).toHaveBeenCalledWith('main_acc123', expect.any(Object), mockData);
      expect(rawQueries.insertAttachementTimeline).toHaveBeenCalledWith('main_acc123', mockData, expect.any(Object));
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.attachmentUpdatedSuccess,
        data: {
          document_rid: 'doc123',
          r_number: mockGetAttachmentsResponse.data.attachments[0].r_number,
          created_datetime: mockGetAttachmentsResponse.data.attachments[0].created_datetime,
          created_by: mockGetAttachmentsResponse.data.attachments[0].created_by,
          modified_datetime: mockGetAttachmentsResponse.data.attachments[0].modified_datetime,
          modified_by: mockGetAttachmentsResponse.data.attachments[0].modified_by,
          account_rid: mockGetAttachmentsResponse.data.attachments[0].account_rid,
          document_name: mockGetAttachmentsResponse.data.attachments[0].document_name,
          attach_to: mockGetAttachmentsResponse.data.attachments[0].attach_to,
          attachment_level: mockGetAttachmentsResponse.data.attachments[0].attachment_level,
          fiscal_year: mockGetAttachmentsResponse.data.attachments[0].fiscal_year,
          format: mockGetAttachmentsResponse.data.attachments[0].format,
          size_in_mb: mockGetAttachmentsResponse.data.attachments[0].size_in_mb,
          document_category_rid: mockGetAttachmentsResponse.data.attachments[0].document_category_rid,
          document_type_rid: mockGetAttachmentsResponse.data.attachments[0].document_type_rid,
          document_category_others: mockGetAttachmentsResponse.data.attachments[0].document_category_others,
          document_type_others: mockGetAttachmentsResponse.data.attachments[0].document_type_others,
          comments: mockGetAttachmentsResponse.data.attachments[0].comments,
          document_type: mockGetAttachmentsResponse.data.attachments[0].document_type,
          document_category: mockGetAttachmentsResponse.data.attachments[0].document_category,
          uploaded_by: mockGetAttachmentsResponse.data.attachments[0].uploaded_by,
          attached_to: mockGetAttachmentsResponse.data.attachments[0].attached_to,
          browse_file: mockGetAttachmentsResponse.data.attachments[0].browse_file,
        },
      });
    });

    it('should handle empty getAttachments response', async () => {
      (rawQueries.fetchParentAccount as jest.Mock).mockResolvedValue('SELECT * FROM main.account WHERE rid = :account_rid');
      (rawQueries.fetchSchemaName as jest.Mock).mockReturnValue('main_acc123');
      (rawQueries.findAttachementDetails as jest.Mock).mockReturnValue("SELECT * FROM main_acc123.attachments WHERE rid = 'doc123' AND account_rid = 'acc123'");
      (rawQueries.checkDocCategoryExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_categories WHERE rid = :document_category_rid');
      (rawQueries.checkDocTypeExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_types WHERE rid = :document_type_rid');
      (rawQueries.updateAttachmentQuery as jest.Mock).mockReturnValue('UPDATE main_acc123.attachments SET fiscal_year = 2023, document_category_rid = "cat123", document_type_rid = "type123", modified_by = "user123", modified_datetime = NOW() WHERE rid = "doc123"');
      (rawQueries.updateAttachmentSummary as jest.Mock).mockReturnValue('UPDATE main.attachment_summary SET ... WHERE rid = "doc123"');
      (rawQueries.insertAttachementTimeline as jest.Mock).mockReturnValue('INSERT INTO main_acc123.attachment_timeline ...');
      mockMainSequelize.query
        .mockResolvedValueOnce([[{ rid: 'acc123', r_number: 'ACC-123', storage_type: 'separate_db' }], {}])
        .mockResolvedValueOnce([[{ id: 'cat123' }], {}])
        .mockResolvedValueOnce([[{ id: 'type123' }], {}])
        .mockResolvedValueOnce([[{ id: 'summary123' }], {}]);
      mockOrgSequelize.query
        .mockResolvedValueOnce([[mockAttachmentData], {}])
        .mockResolvedValueOnce([[{ id: 'attachment123' }], {}])
        .mockResolvedValueOnce([[], {}]);
      (setInlineForAttachments as jest.Mock).mockReturnValue({
        statusMessage: null,
        data: [
          'fiscal_year = 2023',
          'document_category_rid = "cat123"',
          'document_type_rid = "type123"',
          'modified_by = "user123"',
          'modified_datetime = NOW()',
        ],
      });
      mockAttachmentService.getAttachments.mockReset();
      mockAttachmentService.getAttachments.mockImplementation((...args : any) => {
        console.log('getAttachments called with (empty case):', args);
        return Promise.resolve({ data: { attachments: [] } });
      });

      const result = await attachmentGraphqlServices.updateInlineGraphqlDetails(mockData);

      console.log('getAttachments mock calls (empty case):', mockAttachmentService.getAttachments.mock.calls);
      console.log('getAttachments mock results (empty case):', mockAttachmentService.getAttachments.mock.results);

      expect(mockAttachmentService.getAttachments).toHaveBeenCalledTimes(1);
      expect(mockAttachmentService.getAttachments).toHaveBeenCalledWith(
        'user123',
        'level1',
        'to1',
        'acc123',
        1,
        1,
        '',
        expect.any(Object),
        'created_datetime',
        'DESC',
        0,
        { document_rid: 'doc123' }
      );
      expect(setInlineForAttachments).toHaveBeenCalledWith(mockAttachmentData, mockData);
      expect(rawQueries.updateAttachmentQuery).toHaveBeenCalledWith('main_acc123', expect.any(Object), mockData);
      expect(rawQueries.insertAttachementTimeline).toHaveBeenCalledWith('main_acc123', mockData, null);
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.attachmentUpdatedSuccess,
        data: null,
      });
    });

    it('should handle undefined getAttachments response', async () => {
      (rawQueries.fetchParentAccount as jest.Mock).mockResolvedValue('SELECT * FROM main.account WHERE rid = :account_rid');
      (rawQueries.fetchSchemaName as jest.Mock).mockReturnValue('main_acc123');
      (rawQueries.findAttachementDetails as jest.Mock).mockReturnValue("SELECT * FROM main_acc123.attachments WHERE rid = 'doc123' AND account_rid = 'acc123'");
      (rawQueries.checkDocCategoryExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_categories WHERE rid = :document_category_rid');
      (rawQueries.checkDocTypeExists as jest.Mock).mockReturnValue('SELECT 1 FROM main.document_types WHERE rid = :document_type_rid');
      (rawQueries.updateAttachmentQuery as jest.Mock).mockReturnValue('UPDATE main_acc123.attachments SET fiscal_year = 2023, document_category_rid = "cat123", document_type_rid = "type123", modified_by = "user123", modified_datetime = NOW() WHERE rid = "doc123"');
      (rawQueries.updateAttachmentSummary as jest.Mock).mockReturnValue('UPDATE main.attachment_summary SET ... WHERE rid = "doc123"');
      (rawQueries.insertAttachementTimeline as jest.Mock).mockReturnValue('INSERT INTO main_acc123.attachment_timeline ...');
      mockMainSequelize.query
        .mockResolvedValueOnce([[{ rid: 'acc123', r_number: 'ACC-123', storage_type: 'separate_db' }], {}])
        .mockResolvedValueOnce([[{ id: 'cat123' }], {}])
        .mockResolvedValueOnce([[{ id: 'type123' }], {}])
        .mockResolvedValueOnce([[{ id: 'summary123' }], {}]);
      mockOrgSequelize.query
        .mockResolvedValueOnce([[mockAttachmentData], {}])
        .mockResolvedValueOnce([[{ id: 'attachment123' }], {}])
        .mockResolvedValueOnce([[], {}]);
      (setInlineForAttachments as jest.Mock).mockReturnValue({
        statusMessage: null,
        data: [
          'fiscal_year = 2023',
          'document_category_rid = "cat123"',
          'document_type_rid = "type123"',
          'modified_by = "user123"',
          'modified_datetime = NOW()',
        ],
      });
      mockAttachmentService.getAttachments.mockReset();
      mockAttachmentService.getAttachments.mockImplementation((...args : any) => {
        console.log('getAttachments called with (undefined case):', args);
        return Promise.resolve(undefined);
      });

      const result = await attachmentGraphqlServices.updateInlineGraphqlDetails(mockData);

      console.log('getAttachments mock calls (undefined case):', mockAttachmentService.getAttachments.mock.calls);
      console.log('getAttachments mock results (undefined case):', mockAttachmentService.getAttachments.mock.results);

      expect(mockAttachmentService.getAttachments).toHaveBeenCalledTimes(1);
      expect(mockAttachmentService.getAttachments).toHaveBeenCalledWith(
        'user123',
        'level1',
        'to1',
        'acc123',
        1,
        1,
        '',
        expect.any(Object),
        'created_datetime',
        'DESC',
        0,
        { document_rid: 'doc123' }
      );
      expect(setInlineForAttachments).toHaveBeenCalledWith(mockAttachmentData, mockData);
      expect(rawQueries.updateAttachmentQuery).toHaveBeenCalledWith('main_acc123', expect.any(Object), mockData);
      expect(rawQueries.insertAttachementTimeline).toHaveBeenCalledWith('main_acc123', mockData, null);
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.attachmentUpdatedSuccess,
        data: null,
      });
    });
  });
});