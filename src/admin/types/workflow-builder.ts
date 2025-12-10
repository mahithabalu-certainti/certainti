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

// --------------- Create Rule ---------------
export interface RuleOperationPayload {
  field_rid: string;
  operator_rid: string;
  value_rid: string;
}

export interface RuleConditionCategoryPayload {
  category_rid: string;
  cateogry_operator?: 'AND' | 'OR';
  operations: RuleOperationPayload[];
}

export interface CreateRulePayload {
  rule_name: string;
  description?: string;
  event_rid: string;
  condition_rid: string;
  condition_categories: RuleConditionCategoryPayload[];
  action_rid: string[];
}
