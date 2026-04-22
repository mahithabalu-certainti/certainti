import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  accountServiceApi,
  caseServiceApi,
  resourceServiceApi,
} from '../../../api/api';
import {
  AccountFieldsApiResponse,
  AccountList,
  AccountListResponse,
  AccountListURLParams,
  CitysApiResponse,
  ClassificationApiResponse,
  ColorCodeApiResponse,
  CurrencyApiResponse,
  FinancialStateProps,
  FinancialStatesApiResponse,
  GlobalAccountListParams,
  GlobalAccountListResponse,
  IndustrysApiResponse,
  keyContactRolesApiResponse,
  ParentAccountApiResponse,
  StatesApiResponse,
} from '../../types';
import {
  AccountDetailUrl,
  CityUrl,
  ClassificationUrl,
  ColorCodeUrl,
  CurrencyUrl,
  getAccountExportUrl,
  getKeyContactRolesUrl,
  GloablAcconuntsListURL,
  GlobalAccountUrl,
  IndustryUrl,
  ParentAccountUrl,
  StateUrl,
} from '../urls/account-url';
// import { mockAccountDetails } from '../../mockdata';

export const fetchAccountFields = async (
  acctounId: string
): Promise<AccountFieldsApiResponse> => {
  const { data } = await accountServiceApi.get<AccountFieldsApiResponse>(
    AccountDetailUrl(acctounId)
  );
  // await new Promise((resolve) => setTimeout(resolve, 2000));
  // return mockAccountDetails;
  return data;
};

export const fetchGlobalAccounts = async (): Promise<{
  accounts: AccountList[];
  count: number;
}> => {
  const response =
    await accountServiceApi.get<GlobalAccountListResponse>(GlobalAccountUrl);
  return {
    accounts: response.data.data.gloablAcconunt,
    count: response.data.data.count,
  };
};

export const fetchAccounts = async (
  params: AccountListURLParams = {}
): Promise<{ accounts: AccountList[]; count: number; totalResult: number }> => {
  const response = await accountServiceApi.post<AccountListResponse>(
    '/api/accounts/list',
    params
  );
  return {
    accounts: response.data.data.account.data,
    count: response?.data?.data?.count,
    totalResult: response?.data?.data?.account?.total,
  };
};

export const useAccounts = (
  params: AccountListURLParams = {},
  refreshAccountTrigger?: number
): UseQueryResult<
  {
    accounts: AccountList[];
    count: number;
    totalResult: number;
  },
  Error
> => {
  return useQuery<
    { accounts: AccountList[]; count: number; totalResult: number },
    Error
  >({
    queryKey: ['accounts', params, refreshAccountTrigger],
    queryFn: () => fetchAccounts(params),
    retry: 0,
  });
};

export const fetchParentAccounts =
  async (): Promise<ParentAccountApiResponse> => {
    const { data } =
      await accountServiceApi.get<ParentAccountApiResponse>(ParentAccountUrl);
    return data;
  };

export const fetchIndustrys = async (): Promise<IndustrysApiResponse> => {
  const { data } =
    await accountServiceApi.get<IndustrysApiResponse>(IndustryUrl);
  return data;
};

export const fetchCurrency = async (): Promise<CurrencyApiResponse> => {
  const { data } =
    await accountServiceApi.get<CurrencyApiResponse>(CurrencyUrl);
  return data;
};

export const fetchColorCodes = async (): Promise<ColorCodeApiResponse> => {
  const { data } =
    await accountServiceApi.get<ColorCodeApiResponse>(ColorCodeUrl);
  return data;
};

export const fetchClassification =
  async (): Promise<ClassificationApiResponse> => {
    const { data } =
      await resourceServiceApi.get<ClassificationApiResponse>(
        ClassificationUrl
      );
    return data;
  };

export const fetchState = async (
  countryId: string | string[] | null,
  status?: string
): Promise<StatesApiResponse> => {
  const { data } = await accountServiceApi.get<StatesApiResponse>(
    StateUrl(countryId, status)
  );
  return data;
};

export const fetchFinancialState = async (
  params: FinancialStateProps
): Promise<FinancialStatesApiResponse> => {
  if (params.caseId) {
    const { data } = await caseServiceApi.get<FinancialStatesApiResponse>(
      `/api/cases/regions/${params.accountId}/${params.caseId}`
    );
    return data;
  }
  const { data } = await resourceServiceApi.get<FinancialStatesApiResponse>(
    `/api/financialHighlight/regions/${params.accountId}/${params.countryId}/${params.fiscalYear}`
  );
  return data;
};

export const fetchCity = async (stateId: string): Promise<CitysApiResponse> => {
  const { data } = await accountServiceApi.get<CitysApiResponse>(
    CityUrl(stateId)
  );
  return data;
};

export const exportAccountList = async (params: AccountListURLParams = {}) => {
  const url = getAccountExportUrl(params);
  const response = await accountServiceApi.get(url);

  const base64Data = response.data?.data;

  if (!base64Data) {
    console.error('No base64 data found in the response.');
    return;
  }

  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Trigger download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'account_records.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const fetchKeyContactRoles = async (
  entityType: string
): Promise<keyContactRolesApiResponse> => {
  try {
    const { data } = await accountServiceApi.get<keyContactRolesApiResponse>(
      getKeyContactRolesUrl(entityType)
    );
    return data;
  } catch (error) {
    console.error('Error fetching key contact roles:', error);
    throw error;
  }
};

export const useKeyContactRoles = (entityType: string) => {
  return useQuery<keyContactRolesApiResponse, Error>({
    queryKey: ['keyContactRoles'], // Unique query key
    queryFn: () => fetchKeyContactRoles(entityType),
    retry: 0,
    enabled: !!entityType,
  });
};

// Global account list
export const fetchGlobalAccountList = async (
  params: GlobalAccountListParams
): Promise<{ accounts: AccountList[]; count: number }> => {
  const response = await accountServiceApi.get<GlobalAccountListResponse>(
    GloablAcconuntsListURL(params)
  );
  return {
    accounts: response.data.data.gloablAcconunt,
    count: response.data.data.count,
  };
};

export const useGlobalAccountsList = (
  params: GlobalAccountListParams,
  fetchAccount: boolean
): UseQueryResult<{ accounts: AccountList[]; count: number }, Error> => {
  return useQuery<{ accounts: AccountList[]; count: number }, Error>({
    queryKey: ['global-accounts-list', params],
    queryFn: () => fetchGlobalAccountList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!fetchAccount,
  });
};
