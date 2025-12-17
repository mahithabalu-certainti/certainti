export interface ICreateRule {
    rule_rid: string;
    rule_name: string;
    description: string;
    is_active: true;
    scope_type_rid: string;
    trigger_type: number;
    event_rid: string;
    condition_rid: string;
    schedule_offset_type: string | null;
    schedule_offset_value: string | null;
    created_by: string,
    modified_by: string 
}

export interface IUpdateRule {
    rule_rid: string;
    rule_name: string;
    description: string;
    is_active: true;
    scope_type_rid: string;
    trigger_type: number;
    event_rid: string;
    condition_rid: string;
    schedule_offset_type: string | null;
    schedule_offset_value: string | null;
    modified_by: string
}



export interface ICreateCondition {
    condition_rid: string;
    rule_rid: string;
    category_rid: string;
    field_rid: string;
    operator_rid: string;
    value_rid: string;
    data_type: string;
    logical_operator: string;
    sequence: number;
    group_id: number;
    created_by: string,
    modified_by: string
}

export interface ICreateAction {
    action_rid: string;
    rule_rid: string;
    target_user: string;
    new_value: string;
    action_order: number;
    created_by: string,
    modified_by: string
}


export interface ICreateScope {
    scope_rid: string;
    rule_rid: string;
    scope_entity_type: string;
    scope_entity_rid: string;
    is_active: boolean;
    created_by: string,
    modified_by: string
}

export interface ICreateSchedule {
    schedule_rid: string;
    rule_rid: string;
    related_task_rid: string;
    scheduled_datetime: Date;
    executed_datetime: Date;
    executed: boolean,
    created_by: string,
    modified_by: string
}

export interface ICreateAudit {
    audit_rid: string;
    rule_rid: string;
    action: string;
    old_value: string;
    new_value: string;
    notes: string;
    created_by: string,
    modified_by: string
}

export interface ICreateTrigger {
    trigger_rid: string;
    rule_rid: string;
    event_name: string;
    event_time: Date;
    context_entity_id: string;
    status: string;
    message: string;
    created_by: string,
    modified_by: string
}

export interface ICreateRuleMap {
    rule_rid: string;
    apply_type: string;
    created_by: string,
    modified_by: string
}


export interface ICreateRuleMapWithScope {
    rule_rid: string;
    scope_type_rid: string;
    apply_type: string;
    scope_entity_rid: string[];
    created_by: string,
    modified_by: string
}

export interface IListSCopeEvent {
    scope_type_rid: string;
    status_rid: string;
}

export type ScopeEventRows = {
    rid: string;
    event_name: string;
    description: string;
    scope_type_name: string;
    scope_type_rid: string;
}

export type EventConditions = {
    rid: string;
    condition_name: string;
    description: string;
    condition_type: string;
}

export type ConditionCategory = {
    rid: string;
    category_name: string;
    description: string;
}

export type Fields = {
    rid: string;
    name: string;
}

export type Operators = {
    rid: string;
    name: string;
}

export type Values = {
    rid: string;
    name: string;
}

export type actionTypes = {
    rid: string;
    name: string;
}

export type actions = {
    rid: string;
    name: string;
    description: string;
    action_type_name: string;
    action_type_rid: string;
}