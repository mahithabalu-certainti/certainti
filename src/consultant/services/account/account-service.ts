import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { accountServiceApi } from '../../../api/api';
import {
  AccountFieldsApiResponse,
  AccountList,
  AccountListResponse,
  AccountListURLParams,
  CitysApiResponse,
  CurrencyApiResponse,
  GlobalAccountListResponse,
  IndustrysApiResponse,
  ParentAccountApiResponse,
  StatesApiResponse,
} from '../../types';
import {
  AccountDetailUrl,
  AccountListURL,
  CityUrl,
  CurrencyUrl,
  getAccountExportUrl,
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
): Promise<{ accounts: AccountList[]; count: number }> => {
  const response = await accountServiceApi.get<AccountListResponse>(
    AccountListURL(params)
  );
  return {
    accounts: response.data.data.account,
    count: response.data.data.count,
  };
};

export const useAccounts = (
  params: AccountListURLParams = {},
  options?: UseQueryOptions<{ accounts: AccountList[]; count: number }, Error>
): UseQueryResult<{ accounts: AccountList[]; count: number }, Error> => {
  return useQuery<{ accounts: AccountList[]; count: number }, Error>({
    queryKey: ['accounts', params],
    queryFn: () => fetchAccounts(params),
    retry: 0,
    ...options,
  });
};

export const fetchParentAccounts =
  async (): Promise<ParentAccountApiResponse> => {
    const { data } =
      await accountServiceApi.get<ParentAccountApiResponse>(ParentAccountUrl);
    return data;
  };

  export const fetchIndustrys =
  async (): Promise<IndustrysApiResponse> => {
    const { data } =
      await accountServiceApi.get<IndustrysApiResponse>(IndustryUrl);
    return data;
  };

export const fetchCurrency = async (): Promise<CurrencyApiResponse> => {
  const { data } =
    await accountServiceApi.get<CurrencyApiResponse>(CurrencyUrl);
  return data;
};

export const fetchState = async (
  countryId: string
): Promise<StatesApiResponse> => {
  const { data } = await accountServiceApi.get<StatesApiResponse>(
    StateUrl(countryId)
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
