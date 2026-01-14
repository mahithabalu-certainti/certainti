import { useQuery } from '@tanstack/react-query';
import {
  AccountFieldsApiResponse,
  CitysApiResponse,
  ClassificationApiResponse,
  ColorCodeApiResponse,
  CurrencyApiResponse,
  FinancialStateProps,
  FinancialStatesApiResponse,
  IndustrysApiResponse,
  ParentAccountApiResponse,
  StatesApiResponse,
} from '../../types';
import {
  fetchAccountFields,
  fetchCity,
  fetchClassification,
  fetchColorCodes,
  fetchCurrency,
  fetchFinancialState,
  fetchIndustrys,
  fetchParentAccounts,
  fetchState,
} from './account-service';

// Fetch Account Fields Hook
export const useFetchAccountFields = (accountId: string) => {
  return useQuery<AccountFieldsApiResponse, Error>({
    queryKey: ['accountFields', accountId],
    queryFn: () => fetchAccountFields(accountId),
    enabled: !!accountId, // Only fetch if accountId exists
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
  });
};

export const useFetchParentAccounts = () => {
  return useQuery<ParentAccountApiResponse, Error>({
    queryKey: ['parentAccount'],
    queryFn: fetchParentAccounts,
    retry: 0,
  });
};

export const useFetchIndustrys = () => {
  return useQuery<IndustrysApiResponse, Error>({
    queryKey: ['industrys'],
    queryFn: fetchIndustrys,
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

export const useFetchCurrency = () => {
  return useQuery<CurrencyApiResponse, Error>({
    queryKey: ['currency'],
    queryFn: fetchCurrency,
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};
export const useFetchClassification = () => {
  return useQuery<ClassificationApiResponse, Error>({
    queryKey: ['classification'],
    queryFn: fetchClassification,
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

export const useFetchState = (
  countryId: string | string[] | null,
  status?: string
) => {
  return useQuery<StatesApiResponse, Error>({
    queryKey: ['states', countryId, status], // Add countryId to query key
    queryFn: () => fetchState(countryId, status),
    retry: 0,
    enabled: !!countryId && countryId.length > 0, // Only fetch if countryId exists
  });
};

export const useFetchFinancialStates = (params: FinancialStateProps) => {
  return useQuery<FinancialStatesApiResponse, Error>({
    queryKey: ['financialStates', params],
    queryFn: () => fetchFinancialState(params),
    retry: 0,
    enabled:
      !!params.accountId &&
      (!!params.caseId || (!!params.countryId && !!params.fiscalYear)),
  });
};

export const useFetchCity = (stateId: string) => {
  return useQuery<CitysApiResponse, Error>({
    queryKey: ['city', stateId], // Add countryId to query key
    queryFn: () => fetchCity(stateId),
    retry: 0,
    enabled: !!stateId, // Only fetch if countryId exists
  });
};

export const useFetchColorCodes = () => {
  return useQuery<ColorCodeApiResponse, Error>({
    queryKey: ['colorCodes'],
    queryFn: fetchColorCodes,
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};
