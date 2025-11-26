export interface ICreateRule {
    rule_name: string;
    description: string;
    is_active: true;
    scope_type: 3;
    trigger_type: 1;
    trigger_event: string;
    schedule_offset_type: string | null;
    schedule_offset_value: string | null;
    created_by: string,
    modified_by: string
}