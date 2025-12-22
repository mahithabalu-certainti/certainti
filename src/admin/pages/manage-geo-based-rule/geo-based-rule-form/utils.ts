/* eslint-disable @typescript-eslint/no-explicit-any */
import { YesNo } from '../../../../consultant/types';
import { GeoBasedRuleFormData, GeoBasedRulePayload } from '../types';

export const transformGeoBasedRulePayload = (
    formData: Partial<GeoBasedRuleFormData> & Record<string, any>,
    isEditView: boolean,
    configDetails: any = {},
    ruleId?: string
): GeoBasedRulePayload => {
    const isFederal =
        formData.is_federal === YesNo.Yes ? true : false;
    const payload: GeoBasedRulePayload = {
        config_name: formData.config_name || '',
        status_rid: formData.status_rid || '',
        is_federal: isFederal,
        effective_start_date: formData.effective_start_date || '',
        effective_end_date: formData.effective_end_date || null,
    };

    // Extract dynamic fields based on configDetails keys
    if (configDetails && Object.keys(configDetails).length > 0) {
        Object.keys(configDetails).forEach((key) => {
            const config = configDetails[key];
            const items = config?.configItems || [];
            const sectionPayload: Record<string, any> = {};

            if (items.length > 0) {
                items.forEach((item: any) => {
                    if (formData[item.label] !== undefined) {
                        const value = formData[item.label];
                        if (item.type && item.type.toLowerCase().includes('numeric')) {
                            sectionPayload[item.label] =
                                value === '' || value === null ? null : Number(value);
                        } else {
                            sectionPayload[item.label] = value;
                        }
                    }
                });
                if (key === 'jurisdictionConfig' && config.config_rid) {
                    payload.jurisdiction_config_group_rid = config.config_rid;
                }
                if (key === 'platformConfig' && config.config_rid) {
                    payload.platform_config_group_rid = config.config_rid;
                }
                (payload as any)[key] = sectionPayload;
            }
        });
    }

    if (isEditView) {
        if (ruleId) {
            payload.config_rid = ruleId;
        }
    }
    return payload;
};
