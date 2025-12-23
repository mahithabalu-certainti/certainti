// Scope Event List
export interface ScopeEventListPayload {
  scope_type_rid: string;
  status_rid?: string;
}

export interface ScopeEventItem {
  rid: string;
  event_name: string;
  description: string;
  scope_type_name: string;
  scope_type_rid: string;
}

export interface ScopeEventListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ScopeEventItem[];
}

// Scope List
export interface ScopeList {
  rid: string;
  name: string;
}

export interface ScopeListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    scopes: ScopeList[];
  };
}

//Condition List
export interface ConditionListPayload {
  event_rid: string;
  status_rid?: string;
}

export interface ConditionItem {
  rid: string;
  condition_name: string;
  description: string;
  condition_type: string;
}

export interface ConditionListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ConditionItem[];
}

//Condition Category
export interface ConditionCategoryPayload {
  condition_rid: string;
  status_rid?: string;
}

export interface ConditionCategoryItem {
  rid: string;
  category_name: string;
  description: string;
}

export interface ConditionCategoryResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ConditionCategoryItem[];
}

// -------- Action Types--------
export interface ActionTypePayload {
  scope_rid: string;
  action_type_rid: string;
  status_rid?: string;
}

export interface ActionTypeItem {
  rid: string;
  name: string;
  description: string;
  action_type_name: string;
  action_type_rid: string;
}

export interface ActionTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ActionTypeItem[];
}

// -------- Action Category Types --------
export interface ActionCategoryTypePayload {
  scope_rid: string;
  status_rid?: string;
}

export interface ActionCategoryTypeItem {
  rid: string;
  name: string;
}

export interface ActionCategoryTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ActionCategoryTypeItem[];
}

//-------- Category Fields --------
export interface RuleCategoryFieldsPayload {
  category_rid: string;
  status_rid?: string;
}

export interface RuleCategoryFieldItem {
  rid: string;
  name: string;
}

export interface RuleCategoryFieldsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: RuleCategoryFieldItem[];
}

// --------------- Field Operators ---------------
export interface RuleFieldOperatorsPayload {
  field_rid: string;
  status_rid?: string;
}

export interface RuleFieldOperatorItem {
  rid: string;
  name: string;
}

export interface RuleFieldOperatorsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: RuleFieldOperatorItem[];
}

// --------------- Field Values ---------------
export interface RuleFieldValuesPayload {
  field_rid: string;
  status_rid?: string;
}

export interface RuleFieldValueItem {
  rid: string;
  name: string;
}

export interface RuleFieldValuesResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: RuleFieldValueItem[];
}

// --------------- Create / Update Rule ---------------
export interface RuleConditionCategoryPayload {
  category_rid: string;
  category_operator?: 'AND' | 'OR';
  field_rid: string;
  operator_rid: string;
  value_rid: string;
}

export interface CreateRulePayload {
  rule_name: string;
  description?: string;
  trigger_type: number;
  scope_type_rid: string;
  event_rid: string;
  condition_rid: string;
  condition_categories: RuleConditionCategoryPayload[];
  action_rid: string[];
  created_by?: string;
  email_template_rid?: string;
  in_app_template_rid?: string;
}

export interface UpdateRulePayload extends CreateRulePayload {
  rule_rid: string;
  modified_by: string;
}

// --------- Details ---------
export interface RuleDetails {
  rule: {
    rid: string;
    r_number: string | null;
    eid: string | null;
    rule_name: string;
    description: string;
    event_rid: string;
    trigger_type: number;
    condition_rid: string;
    is_active: boolean;
    scope_type_rid: string;
    schedule_offset_type: string | null;
    schedule_offset_value: string | null;
    created_by: string;
    modified_by: string | null;
    created_datetime: string;
    modified_datetime: string | null;
  };

  event: {
    event_rid: string;
    event_name: string;
    description: string;
  };

  condition: {
    condition_rid: string;
    condition_name: string;
    description: string;
    condition_type: 'IF' | 'ELSE_IF' | 'ELSE';
  };

  conditions: {
    category_rid: string;
    category_name: string;
    category_description: string;
    category_operator: 'AND' | 'OR' | null;
    field_rid: string;
    field_name: string;
    operator_rid: string;
    operator_name: string;
    value_rid: string;
    value_name: string;
  }[];

  actions: {
    action_rid: string;
    action_name: string;
    description: string;
    action_type_rid: string;
  }[];
}

export interface RuleDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: RuleDetails;
}

// --------- LIST ---------
export interface WorkflowRuleListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  search?: string;
}

export interface WorkflowRuleExportListURLParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  search?: string;
  timezone?: string;
}

export type WorkflowRuleListItem = {
  rid: string;
  r_number: string | null;
  rule_name: string;
  description?: string;
  event_rid: string;
  condition_rid: string;
  scope_type_rid: string;
  scope_type_name: string;
  is_active: boolean;
  is_rule_mapped: boolean;
  created_by: string;
  created_user_name: string;
  modified_by: string | null;
  modified_user_name: string | null;
  created_datetime: string;
  modified_datetime: string | null;
};

export interface WorkflowRuleListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    rules: WorkflowRuleListItem[];
    count: number;
  };
}

// ---------- Create Rule Map ----------
export type ApplyType = 'INDIVIDUAL' | 'ALL';

export interface CreateRuleMapPayload {
  scope_type_rid: string;
  rule_rid: string;
  apply_type: ApplyType;
  scope_entity_rid: string[];
  created_by: string;
}

// ---------- Update Rule Map ----------
export interface UpdateRuleMapPayload {
  scope_type_rid: string;
  rule_rid: string;
  apply_type: ApplyType;
  scope_entity_rid: string[];
  modified_by: string;
}

// ---------- Get Rule Map Details ----------
export interface GetRuleMapDetailsPayload {
  rule_rid: string;
}

export interface RuleMapDetails {
  scope_type_rid: string;
  rule_rid: string;
  apply_type: ApplyType;
  scope_entity_rid: string[];
}

export interface GetRuleMapDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: RuleMapDetails;
}

// ---------- Update Rule Status ----------
export interface UpdateRuleStatusPayload {
  rule_rid: string;
  is_active: boolean;
}
