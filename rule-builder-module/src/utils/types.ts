export interface ICreateRule {
    rule_rid: string;
    rule_name: string;
    description: string;
    is_active: true;
    scope_type: number;
    trigger_type: number;
    trigger_event: string;
    schedule_offset_type: string | null;
    schedule_offset_value: string | null;
    created_by: string,
    modified_by: string
}


export interface ICreateCondition {
    condition_rid: string;
    rule_rid: string;
    field_name: string;
    operator: string;
    value: string;
    data_type: string;
    logical_operator: string;
    sequence: number;
    group_id: number;
    created_by: string,
    modified_by: string
}