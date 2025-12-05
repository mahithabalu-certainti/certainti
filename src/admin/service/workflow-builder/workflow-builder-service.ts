import { useQuery } from '@tanstack/react-query';
import {
  ActionCategoryTypePayload,
  ActionCategoryTypeResponse,
  ActionTypePayload,
  ActionTypeResponse,
  ConditionCategoryPayload,
  ConditionCategoryResponse,
  ConditionListPayload,
  ConditionListResponse,
  ScopeEventListPayload,
  ScopeEventListResponse,
  ScopeListResponse,
} from '../../types';
import {
  ActionCategoryTypeMockData,
  ActionTypeMockData,
  ConditionCategoryMockData,
  ConditionListMockData,
  ScopeEventListMockData,
  ScopeListMockData,
} from '../../mockdata/workflow-builder';

// Scope List
export const fetchScopeList = async (): Promise<ScopeListResponse> => {
  try {
    // const { data } = await caseServiceApi.get<ScopeListResponse>(
    //   '/api/workflow/scopeList'
    // );
    // return data;
    console.log('scope-list');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return ScopeListMockData;
  } catch (error) {
    console.error('Error fetching scope list:', error);
    throw error;
  }
};

export const useGetScopeList = () => {
  return useQuery<ScopeListResponse, Error>({
    queryKey: ['get-scope-list'],
    queryFn: () => fetchScopeList(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// Scope Event List
export const fetchScopeEventList = async (
  params: ScopeEventListPayload
): Promise<ScopeEventListResponse> => {
  try {
    // const { data } = await caseServiceApi.post<ScopeEventListResponse>(
    //   'api/workflow/scopeEventList',
    //   params
    // );
    // return data;
    console.log('scope-event-list', params);
    const { scope_type_rid } = params;

    // Simulate 2-second delay (optional)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Filter logic
    let filteredData = ScopeEventListMockData.data;

    if (scope_type_rid && scope_type_rid.trim() !== '') {
      filteredData = filteredData.filter(
        (item) => item.scope_type_rid === scope_type_rid
      );
    }

    return {
      ...ScopeEventListMockData,
      data: filteredData,
    };
  } catch (error) {
    console.error('Error fetching scope event list:', error);
    throw error;
  }
};

export const useGetScopeEventList = (params: ScopeEventListPayload) => {
  return useQuery<ScopeEventListResponse, Error>({
    queryKey: ['get-scope-event-list', params],
    queryFn: () => fetchScopeEventList(params),
    retry: 0,
    gcTime: 0,
    enabled: true,
  });
};

//Condition List
export const fetchConditionList = async (
  params: ConditionListPayload
): Promise<ConditionListResponse> => {
  try {
    // const { data } = await caseServiceApi.post<ConditionListResponse>(
    //   '/api/workflow/eventConditions',
    //   params
    // );

    // return data;
    console.log('condition-list', params);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return ConditionListMockData;
  } catch (error) {
    console.error('Error fetching condition list:', error);
    throw error;
  }
};

export const useGetConditionList = (
  params: ConditionListPayload,
  enabled: boolean
) => {
  return useQuery<ConditionListResponse, Error>({
    queryKey: ['get-condition-list', params],
    queryFn: () => fetchConditionList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!enabled,
  });
};

//Condition Category
export const fetchConditionCategoryList = async (
  params: ConditionCategoryPayload
): Promise<ConditionCategoryResponse> => {
  try {
    // const { data } = await caseServiceApi.post<ConditionCategoryResponse>(
    //   '/api/workflow/conditionCategory',
    //   params
    // );

    // return data;
    console.log('condition-category-list', params);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return ConditionCategoryMockData;
  } catch (error) {
    console.error('Error fetching condition category list:', error);
    throw error;
  }
};

export const useGetConditionCategoryList = (
  params: ConditionCategoryPayload,
  enabled: boolean
) => {
  return useQuery<ConditionCategoryResponse, Error>({
    queryKey: ['get-condition-category-list', params],
    queryFn: () => fetchConditionCategoryList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!enabled,
  });
};

// -------- Action Types--------
export const fetchActionTypes = async (
  params: ActionTypePayload
): Promise<ActionTypeResponse> => {
  try {
    // const { data } = await caseServiceApi.post<ActionTypeResponse>(
    //   '/api/workflow/scopeActions',
    //   params
    // );
    // return data;
    console.log('action-type', params);
    const { action_type_rid } = params;

    // Simulate 2-second delay (optional)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Filter logic
    let filteredData = ActionTypeMockData.data;

    if (action_type_rid && action_type_rid.trim() !== '') {
      filteredData = filteredData.filter(
        (item) => item.action_type_rid === action_type_rid
      );
    }

    return {
      ...ScopeEventListMockData,
      data: filteredData,
    };
  } catch (error) {
    console.error('Error fetching scope action types:', error);
    throw error;
  }
};

export const useGetActionTypes = (params: ActionTypePayload) => {
  return useQuery<ActionTypeResponse, Error>({
    queryKey: ['get-action-types', params],
    queryFn: () => fetchActionTypes(params),
    retry: 0,
    gcTime: 0,
    enabled: true,
  });
};

// -------- Action Category Types --------
export const fetchActionCategoryTypes = async (
  params: ActionCategoryTypePayload
): Promise<ActionCategoryTypeResponse> => {
  try {
    // const { data } = await caseServiceApi.post<ActionCategoryTypeResponse>(
    //   '/api/workflow/scopeActionTypes',
    //   params
    // );

    // return data;
    console.log('action-category-list', params);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return ActionCategoryTypeMockData;
  } catch (error) {
    console.error('Error fetching action category types:', error);
    throw error;
  }
};

export const useGetActionCategoryTypes = (
  params: ActionCategoryTypePayload,
  enabled: boolean
) => {
  return useQuery<ActionCategoryTypeResponse, Error>({
    queryKey: ['get-action-category-types', params],
    queryFn: () => fetchActionCategoryTypes(params),
    retry: 0,
    gcTime: 0,
    enabled: !!enabled,
  });
};
