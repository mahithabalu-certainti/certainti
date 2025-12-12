export interface GeoBasedRuleFormData {
    rid?: string;
    rule_name?: string;
    country?: string;
    region?: string;
    is_federal?: string | boolean;
    effective_start_date?: string;
    effective_end_date?: string;
    created_datetime?: string;
    modified_datetime?: string;
}

export interface GeoBasedRulePayload {
    rule_name: string;
    country: string;
    region: string;
    is_federal: boolean;
    effective_start_date: string;
    effective_end_date: string;
    rid?: string;
}
