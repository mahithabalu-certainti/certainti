// __tests__/accountGraphqlServices.test.ts

// Must set this before import to avoid error
process.env.KEY_VAULT_URI = 'https://mocked-key-vault-url.vault.azure.net/';

jest.mock('../../src/utils/azureSecrets', () => ({
  getSecret: jest.fn().mockResolvedValue('mocked-db-secret'),
}));

// You may also need to mock modules that depend on secrets
jest.mock('../../src/config/maindbDataSource', () => ({
  initSequelize: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([[{ rid: 'mocked' }]]),
  }),
}));
jest.mock('../../src/config/orgdbDataSource', () => ({
  initOrgSequelize: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([[{ rid: 'mocked' }]]),
  }),
}));

// Other mocks as needed
jest.mock('../../src/models/accountModel', () => ({
  Account: {
    findOne: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock('../../src/models/statusModel', () => ({
  Status: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../src/utils/helpers', () => ({
  setInlineValues: jest.fn(),
  setAccountDetails: jest.fn(),
  setKeyContactData: jest.fn(),
}));

import AccountGraphQlServices from '../../src/services/graphqlServices';
import { Account } from '../../src/models/accountModel';
import { Status } from '../../src/models/statusModel';
import * as dbConfig from '../../src/config/orgdbDataSource';
import * as mainDbConfig from '../../src/config/maindbDataSource';
import * as helpers from '../../src/utils/helpers';
import {
  HttpStatus,
  SCHEMANAME_PREFIX,
  STATUS,
  STATUS_MESSAGE,
  rawQueries
} from '../../src/utils/constant';

// jest.mock('../../src/models/accountModel');
// jest.mock('../../src/models/statusModel');
// jest.mock('../../src/config/orgdbDataSource');
// jest.mock('../../src/config/maindbDataSource');
// jest.mock('../../src/utils/helpers');

describe('AccountGraphQlServices.inlineEditAccount', () => {
  const service = new AccountGraphQlServices();

  const mockAccount = {
    rid: 'account-rid',
    r_number: 'ACC-1234',
    status_rid: 'status-rid',
    parent_account_rid: null
  };

  const mockStatus = {
    status_name: STATUS.active
  };

  const mockAccountDetails = [
    [{
      account_name: 'Old Account',
      website: 'http://old.com'
    }]
  ];

  const mockSetInlineValues = {
    newDbData: { account_name: 'New Account', modified_by: 'user-1', modified_datetime: expect.any(String) },
    newDbAccDetailsData: {
      account_name: 'New Account',
      website: 'http://new.com',
      modified_by: 'user-1',
      modified_datetime: 'NOW()'
    }
  };

  const mockInlineResponse = [
    [{
      rid: 'account-rid',
      account_name: 'New Account',
      r_number: 'ACC-1234',
      parent_account_rid: null,
      currency_rid: 'curr-123',
      total_project_hours: 100,
      total_projects: 5,
      total_project_cost: 20000,
      total_projects_rd_credits: 3000,
      qualifying_project_hours_fed: 50,
      qualifying_project_qre_fed: 1000,
      qualifying_project_rd_credits_fed: 1500,
      storage_type: 'cloud',
      professional_services_consultant: 'Consultant A',
      finance_lead: 'Lead A',
      finance_executive: 'Exec A',
      country: null,
      currency: null,
      industry: null,
      status: { status_name: 'Active' },
      parent_account: null,
      industry_name_other: null
    }]
  ];

  let sequelizeMock: any;
  let mainSequelizeMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock findOne and update
    (Account.findOne as jest.Mock).mockResolvedValue(mockAccount);
    (Status.findOne as jest.Mock).mockResolvedValue(mockStatus);
    (Account.update as jest.Mock).mockResolvedValue([1]);

    // Mock sequelize instances
    sequelizeMock = { query: jest.fn().mockResolvedValue(mockAccountDetails) };
    mainSequelizeMock = { query: jest.fn().mockResolvedValue(mockInlineResponse) };

    (dbConfig.initOrgSequelize as jest.Mock).mockResolvedValue(sequelizeMock);
    (mainDbConfig.initSequelize as jest.Mock).mockResolvedValue(mainSequelizeMock);

    // Mock helper functions
    (helpers.setInlineValues as jest.Mock).mockReturnValue(mockSetInlineValues);
    (helpers.setAccountDetails as jest.Mock).mockResolvedValue(undefined);
    (helpers.setKeyContactData as jest.Mock).mockResolvedValue(undefined);
  });

  it('should return success when account is active and updated successfully', async () => {
    const input = {
      account_rid: 'account-rid',
      account_name: 'New Account',
      website: 'http://new.com',
      userId: 'user-1'
    };

    const result : any = await service.inlineEditAccount(input);

    expect(result.statusCode).toBe(HttpStatus.SUCCESS);
    expect(result.statusMessage).toBe(STATUS_MESSAGE.accountUpdateSuccess);
    expect(result.data.account_name).toBe('New Account');
    expect(Account.update).toHaveBeenCalledWith(expect.objectContaining({
      account_name: 'New Account'
    }), {
      where: { rid: 'account-rid' }
    });
    expect(sequelizeMock.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM'));
    expect(mainSequelizeMock.query).toHaveBeenCalledWith(expect.stringContaining('WITH fetch_parent_account'));
  });

  it('should return BAD_REQUEST when account is inactive', async () => {
    (Status.findOne as jest.Mock).mockResolvedValueOnce({ status_name: STATUS.inactive });

    const result : any = await service.inlineEditAccount({ account_rid: 'account-rid' });

    expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(result.statusMessage).toBe(STATUS_MESSAGE.accountInactive);
  });

  it('should return NOT_FOUND when account is not found', async () => {
    (Account.findOne as jest.Mock).mockResolvedValueOnce(null);

    const result : any = await service.inlineEditAccount({ account_rid: 'invalid-id' });

    expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(result.statusMessage).toBe(STATUS_MESSAGE.accountNoFound);
  });

  it('should call setKeyContactData when key_contacts is present', async () => {
    const input = {
      account_rid: 'account-rid',
      key_contacts: [{ rid: 'kc-1' }],
      userId: 'user-1'
    };

    await service.inlineEditAccount(input);

    expect(helpers.setKeyContactData).toHaveBeenCalledWith(input, sequelizeMock, `"${SCHEMANAME_PREFIX}1234"`);
  });

  it('should not call setKeyContactData if key_contacts is an empty array', async () => {
  (Account.findOne as jest.Mock).mockResolvedValue({ rid: 'acc123', r_number: 'ACC-0001', parent_account_rid: null, status_rid: 'stat123' });
  (Status.findOne as jest.Mock).mockResolvedValue({ status_name: STATUS.active });
  (helpers.setInlineValues as jest.Mock).mockReturnValue({ newDbData: {}, newDbAccDetailsData: {} });

  const mockSequelize = { query: jest.fn().mockResolvedValue([[{}]]) };
  (dbConfig.initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
  (mainDbConfig.initSequelize as jest.Mock).mockResolvedValue(mockSequelize);

  const service = new AccountGraphQlServices();
  await service.inlineEditAccount({ account_rid: 'acc123', key_contacts: [] });

  expect(helpers.setKeyContactData).not.toHaveBeenCalled();
});

it('should return BAD_REQUEST if updateAccount returns empty array', async () => {
  (Account.findOne as jest.Mock).mockResolvedValue({
    rid: 'acc123',
    r_number: 'ACC-0001',
    parent_account_rid: null,
    status_rid: 'stat123'
  });

  (Status.findOne as jest.Mock).mockResolvedValue({ status_name: STATUS.active });

  (Account.update as jest.Mock).mockResolvedValue([0]); // return zero updated rows

  (helpers.setInlineValues as jest.Mock).mockReturnValue({
    newDbData: { account_name: 'TestName' },
    newDbAccDetailsData: {}
  });

  const mockSequelize = { query: jest.fn().mockResolvedValue([[{}]]) };

  (dbConfig.initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
  (mainDbConfig.initSequelize as jest.Mock).mockResolvedValue(mockSequelize);

  const service = new AccountGraphQlServices();

  const result : any = await service.inlineEditAccount({ account_rid: 'Acc-1234' });

  expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
  expect(result.statusMessage).toBe(STATUS_MESSAGE.accountUpdateFailed);
});

it('should return BAD_REQUEST if account status is not active', async () => {
  (Account.findOne as jest.Mock).mockResolvedValue({ rid: 'acc123', status_rid: 'stat123' });
  (Status.findOne as jest.Mock).mockResolvedValue({ status_name: 'In-Active' });

  const service = new AccountGraphQlServices();
  const result : any = await service.inlineEditAccount({ account_rid: 'acc123' });

  expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
  expect(result.statusMessage).toBe(STATUS_MESSAGE.accountInactive);
});

it('should return NOT_FOUND if status is not found', async () => {
  (Account.findOne as jest.Mock).mockResolvedValue({ rid: 'acc123', status_rid: 'stat123' });
  (Status.findOne as jest.Mock).mockResolvedValue(null);

  const service = new AccountGraphQlServices();
  const result : any = await service.inlineEditAccount({ account_rid: 'acc123' });

  expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
  expect(result.statusMessage).toBe(STATUS_MESSAGE.invalidStatus); // or use a new message if needed
});

it('should skip setKeyContactData when key_contacts is undefined', async () => {
  (Account.findOne as jest.Mock).mockResolvedValue({ rid: 'acc123', r_number: 'ACC-0001', parent_account_rid: null, status_rid: 'stat123' });
  (Status.findOne as jest.Mock).mockResolvedValue({ status_name: STATUS.active });
  (Account.update as jest.Mock).mockResolvedValue([1]);
  (helpers.setInlineValues as jest.Mock).mockReturnValue({
    newDbData: { account_name: 'UpdatedName' },
    newDbAccDetailsData: {}
  });

  const mockResponseData = {
    rid: 'acc123',
    account_name: 'UpdatedName',
    currency: null,
    country: null,
    industry: null,
    parent_account: null,
    status: null
  };
  const mockSequelize = { query: jest.fn().mockResolvedValue([[mockResponseData]]) };
  (dbConfig.initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
  (mainDbConfig.initSequelize as jest.Mock).mockResolvedValue(mockSequelize);

  const service = new AccountGraphQlServices();
  const result : any = await service.inlineEditAccount({ account_rid: 'acc123' });

  expect(helpers.setKeyContactData).not.toHaveBeenCalled();
  expect(result.statusCode).toBe(HttpStatus.SUCCESS);
});

it('should skip updateAccount and setAccountDetails if no data to update', async () => {
  (Account.findOne as jest.Mock).mockResolvedValue({ rid: 'acc123', r_number: 'ACC-0001', parent_account_rid: null, status_rid: 'stat123' });
  (Status.findOne as jest.Mock).mockResolvedValue({ status_name: STATUS.active });
  (helpers.setInlineValues as jest.Mock).mockReturnValue({
    newDbData: {},
    newDbAccDetailsData: {}
  });

  const mockSequelize = { query: jest.fn().mockResolvedValue([[{}]]) };
  (dbConfig.initOrgSequelize as jest.Mock).mockResolvedValue(mockSequelize);
  (mainDbConfig.initSequelize as jest.Mock).mockResolvedValue(mockSequelize);

  const service = new AccountGraphQlServices();
  const result : any = await service.inlineEditAccount({});

  // Account.update and setAccountDetails should NOT be called
  expect(Account.update).not.toHaveBeenCalled();
  expect(Account.update).not.toHaveBeenCalled();
  expect(helpers.setAccountDetails).not.toHaveBeenCalled();
  expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
  expect(result.statusMessage).toBe(STATUS_MESSAGE.noDataToUpdate);
});

});
