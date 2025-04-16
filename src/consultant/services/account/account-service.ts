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
  ParentAccountApiResponse,
  StatesApiResponse,
} from '../../types';
import {
  AccountDetailUrl,
  AccountListURL,
  CityUrl,
  CurrencyUrl,
  ParentAccountUrl,
  StateUrl,
} from '../urls/account-url';

export const fetchAccountFields = async (
  acctounId: string
): Promise<AccountFieldsApiResponse> => {
  const { data } = await accountServiceApi.get<AccountFieldsApiResponse>(
    AccountDetailUrl(acctounId)
  );
  return data;
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
