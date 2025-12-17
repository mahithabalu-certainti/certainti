import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ActionCategoryTypePayload,
  ActionCategoryTypeResponse,
  ActionTypePayload,
  ActionTypeResponse,
  ConditionCategoryPayload,
  ConditionCategoryResponse,
  ConditionListPayload,
  ConditionListResponse,
  CreateRulePayload,
  RuleCategoryFieldsPayload,
  RuleCategoryFieldsResponse,
  RuleDetails,
  RuleFieldOperatorsPayload,
  RuleFieldOperatorsResponse,
  RuleFieldValuesPayload,
  RuleFieldValuesResponse,
  ScopeEventListPayload,
  ScopeEventListResponse,
  ScopeListResponse,
  WorkflowRuleListItem,
  WorkflowRuleListURLParams,
} from '../../types';
// import {
//   ActionCategoryTypeMockData,
//   ActionTypeMockData,
//   ConditionCategoryMockData,
//   ConditionListMockData,
//   RuleCategoryFieldsMockData,
//   RuleFieldOperatorsMockData,
//   RuleFieldValuesMockData,
//   ScopeEventListMockData,
//   ScopeListMockData,
// } from '../../mockdata/workflow-builder';
import { CommonApiResponse } from '../../../common-service';
import { ruleBuilderServiceApi } from '../../../api/api';
import {
  RuleDetailsMockData,
  WorkflowRuleListMockData,
} from '../../mockdata/workflow-builder';

// Scope List
export const fetchScopeList = async (): Promise<ScopeListResponse> => {
  try {
    const { data } = await ruleBuilderServiceApi.get<ScopeListResponse>(
      '/api/workflow/scopeList'
    );
    return data;
    // console.log('scope-list');
    // await new Promise((resolve) => setTimeout(resolve, 1500));
    // return ScopeListMockData;
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
    const { data } = await ruleBuilderServiceApi.post<ScopeEventListResponse>(
      'api/workflow/scopeEventList',
      params
    );
    return data;
    // console.log('scope-event-list', params);
    // const { scope_type_rid } = params;

    // // Simulate 2-second delay (optional)
    // await new Promise((resolve) => setTimeout(resolve, 1500));

    // // Filter logic
    // let filteredData = ScopeEventListMockData.data;

    // if (scope_type_rid && scope_type_rid.trim() !== '') {
    //   filteredData = filteredData.filter(
    //     (item) => item.scope_type_rid === scope_type_rid
    //   );
    // }

    // return {
    //   ...ScopeEventListMockData,
    //   data: filteredData,
    // };
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
    const { data } = await ruleBuilderServiceApi.post<ConditionListResponse>(
      '/api/workflow/eventConditions',
      params
    );

    return data;
    // console.log('condition-list', params);
    // await new Promise((resolve) => setTimeout(resolve, 1500));
    // return ConditionListMockData;
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
    const { data } =
      await ruleBuilderServiceApi.post<ConditionCategoryResponse>(
        '/api/workflow/conditionCategory',
        params
      );

    return data;
    // console.log('condition-category-list', params);
    // await new Promise((resolve) => setTimeout(resolve, 1500));
    // return ConditionCategoryMockData;
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
    const { data } = await ruleBuilderServiceApi.post<ActionTypeResponse>(
      '/api/workflow/scopeActions',
      params
    );
    return data;
    // console.log('action-type', params);
    // const { action_type_rid } = params;

    // // Simulate 2-second delay (optional)
    // await new Promise((resolve) => setTimeout(resolve, 1500));

    // // Filter logic
    // let filteredData = ActionTypeMockData.data;

    // if (action_type_rid && action_type_rid.trim() !== '') {
    //   filteredData = filteredData.filter(
    //     (item) => item.action_type_rid === action_type_rid
    //   );
    // }

    // return {
    //   ...ScopeEventListMockData,
    //   data: filteredData,
    // };
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
    const { data } =
      await ruleBuilderServiceApi.post<ActionCategoryTypeResponse>(
        '/api/workflow/scopeActionTypes',
        params
      );

    return data;
    // console.log('action-category-list', params);
    // await new Promise((resolve) => setTimeout(resolve, 1500));
    // return ActionCategoryTypeMockData;
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

//-------- Category Fields --------
export const fetchRuleCategoryFields = async (
  params: RuleCategoryFieldsPayload
): Promise<RuleCategoryFieldsResponse> => {
  try {
    const { data } =
      await ruleBuilderServiceApi.post<RuleCategoryFieldsResponse>(
        '/api/workflow/ruleFields',
        params
      );

    return data;
    // console.log('rule-category-fields', params);
    // await new Promise((resolve) => setTimeout(resolve, 1500));
    // return RuleCategoryFieldsMockData;
  } catch (error) {
    console.error('Error fetching rule category fields:', error);
    throw error;
  }
};

export const useGetRuleCategoryFields = (params: RuleCategoryFieldsPayload) => {
  return useQuery<RuleCategoryFieldsResponse, Error>({
    queryKey: ['get-rule-category-fields', params],
    queryFn: () => fetchRuleCategoryFields(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.category_rid,
  });
};

// --------------- Field Operators ---------------
export const fetchRuleFieldOperators = async (
  params: RuleFieldOperatorsPayload
): Promise<RuleFieldOperatorsResponse> => {
  try {
    const { data } =
      await ruleBuilderServiceApi.post<RuleFieldOperatorsResponse>(
        '/api/workflow/ruleOperators',
        params
      );

    return data;
    // console.log('rule-field-operators', params);
    // await new Promise((resolve) => setTimeout(resolve, 1500));
    // return RuleFieldOperatorsMockData;
  } catch (error) {
    console.error('Error fetching rule field operators:', error);
    throw error;
  }
};

export const useGetRuleFieldOperators = (params: RuleFieldOperatorsPayload) => {
  return useQuery<RuleFieldOperatorsResponse, Error>({
    queryKey: ['get-rule-field-operators', params],
    queryFn: () => fetchRuleFieldOperators(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.field_rid,
  });
};

// --------------- Field Values ---------------
export const fetchRuleFieldValues = async (
  params: RuleFieldValuesPayload
): Promise<RuleFieldValuesResponse> => {
  try {
    const { data } = await ruleBuilderServiceApi.post<RuleFieldValuesResponse>(
      '/api/workflow/ruleFieldValues',
      params
    );

    return data;
    // console.log('rule-field-values', params);
    // await new Promise((resolve) => setTimeout(resolve, 1500));
    // return RuleFieldValuesMockData;
  } catch (error) {
    console.error('Error fetching rule field values:', error);
    throw error;
  }
};

export const useGetRuleFieldValues = (params: RuleFieldValuesPayload) => {
  return useQuery<RuleFieldValuesResponse, Error>({
    queryKey: ['get-rule-field-values', params],
    queryFn: () => fetchRuleFieldValues(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.field_rid,
  });
};

// --------------- Create Rule ---------------
export const getCreateRuleUrl = (): string => {
  return `/api/workflow/createRule`;
};

export const createRule = async (
  body: CreateRulePayload
): Promise<CommonApiResponse> => {
  try {
    const { data } = await ruleBuilderServiceApi.post<CommonApiResponse>(
      getCreateRuleUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error creating rule:', error);
    throw error;
  }
};

export const useCreateRule = () => {
  return useMutation<CommonApiResponse, Error, CreateRulePayload>({
    mutationFn: (body) => createRule({ ...body }),
  });
};

// ---------- LIST ------------
export const fetchWorkflowRuleList = async (
  params: WorkflowRuleListURLParams
): Promise<{ rules: WorkflowRuleListItem[]; count: number }> => {
  // const response = await ruleBuilderServiceApi.get<WorkflowRuleListResponse>(
  //   WorkflowRuleListURL(params)
  // );

  // return {
  //   rules: response.data.data.rules,
  //   count: response.data.data.count,
  // };
  console.log('workflow-rule-list-params', params);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    rules: WorkflowRuleListMockData.data.rules,
    count: WorkflowRuleListMockData.data.count,
  };
};

export const useWorkflowRuleList = (
  params: WorkflowRuleListURLParams,
  refreshKey?: number
): UseQueryResult<{ rules: WorkflowRuleListItem[]; count: number }, Error> => {
  return useQuery({
    queryKey: ['workflow-rule-list', params, refreshKey],
    queryFn: () => fetchWorkflowRuleList(params),
    retry: 0,
    gcTime: 0,
    enabled: true,
  });
};

// ---------- DETAILS ------------
export const fetchRuleDetails = async (
  ruleId: string
): Promise<RuleDetails> => {
  // const response = await ruleBuilderServiceApi.get<RuleDetailsResponse>(
  //   `/api/workflow/rules/${ruleId}`
  // );

  // return response.data.data;
  console.log('rule-details', ruleId);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return RuleDetailsMockData.data;
};

export const useGetRuleDetails = (
  ruleId: string,
  isEnable?: boolean
): UseQueryResult<RuleDetails | undefined, Error> => {
  return useQuery<RuleDetails | undefined, Error>({
    queryKey: ['rule-details', ruleId, isEnable],
    queryFn: () => fetchRuleDetails(ruleId),
    retry: 0,
    gcTime: 0,
    enabled: !!ruleId && isEnable,
  });
};
