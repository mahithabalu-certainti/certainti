import { GeoBasedRuleFormData, GeoBasedRulePayload } from '../types';

export const transformGeoBasedRulePayload = (
  formData: Partial<GeoBasedRuleFormData> & Record<string, any>,
  isEditView: boolean,
  configDetails: any = {},
  ruleId?: string
): GeoBasedRulePayload => {
  const payload: GeoBasedRulePayload = {
    config_name: formData.config_name || '',
    country: formData.country || '',
    state_rid: formData.region || '',
    status_rid: formData.status_rid || '',
    is_federal: formData.is_federal === 'true' || formData.is_federal === true,
    effective_start_date: formData.effective_start_date || '',
    effective_end_date: formData.effective_end_date || '',
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

        // Set IDs at root level based on the config key
        if (key === 'jurisdictionConfig' && config.config_rid) {
          payload.jurisdiction_config_group_rid = config.config_rid;
        }
        if (key === 'platformConfig' && config.config_rid) {
          payload.platform_config_group_rid = config.config_rid;
        }

        // Assign the section payload to the corresponding key (jurisdictionConfig or platformConfig)
        (payload as any)[key] = sectionPayload;
      }
    });
  }

  if (isEditView) {
    // if (formData.rid) {
    //     payload.rid = formData.rid;
    // }
    if (ruleId) {
      payload.config_rid = ruleId;
    }
  }
  console.log(payload);
  return payload;
};
