import { GeoBasedRuleFormData, GeoBasedRulePayload } from '../types';

export const transformGeoBasedRulePayload = (
    formData: Partial<GeoBasedRuleFormData>,
    isEditView: boolean
): GeoBasedRulePayload => {
    const payload: GeoBasedRulePayload = {
        rule_name: formData.rule_name || '',
        country: formData.country || '',
        region: formData.region || '',
        is_federal: formData.is_federal === 'true' || formData.is_federal === true,
        effective_start_date: formData.effective_start_date || '',
        effective_end_date: formData.effective_end_date || '',
    };

    if (isEditView && formData.rid) {
        payload.rid = formData.rid;
    }
    return payload;
};
