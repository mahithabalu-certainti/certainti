import { useQuery } from '@tanstack/react-query';
import {
  AccountFieldsApiResponse,
  CurrencyApiResponse,
  ParentAccountApiResponse,
  RegionApiResponse,
} from '../../types';
import {
  fetchAccountFields,
  fetchCurrency,
  fetchParentAccounts,
  fetchRegion,
} from './account-service';

// Fetch Account Fields Hook
export const useFetchAccountFields = (accountId: string) => {
  return useQuery<AccountFieldsApiResponse, Error>({
    queryKey: ['accountFields', accountId],
    queryFn: () => fetchAccountFields(accountId),
    enabled: !!accountId, // Only fetch if accountId exists
  });
};

export const useFetchParentAccounts = () => {
  return useQuery<ParentAccountApiResponse, Error>({
    queryKey: ['parentAccount'],
    queryFn: fetchParentAccounts,
    retry: 0,
  });
};

export const useFetchCurrency = () => {
  return useQuery<CurrencyApiResponse, Error>({
    queryKey: ['currency'],
    queryFn: fetchCurrency,
    retry: 0,
  });
};

export const useFetchRegion = () => {
  return useQuery<RegionApiResponse, Error>({
    queryKey: ['region'],
    queryFn: fetchRegion,
    retry: 0,
  });
};
