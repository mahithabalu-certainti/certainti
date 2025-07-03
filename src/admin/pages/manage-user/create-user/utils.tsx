import { YesNo } from '../../../../consultant/types';
import { UserDetail, UserPayload, UserRole } from '../../../types/manage-user';

export const transFormPayload = (
  data: Partial<UserDetail>,
  isEditView: boolean,
  userData?: UserDetail,
  isConsultantFirm?: string
): UserPayload => {
  const basePayload: UserPayload = {
    first_name: data.first_name,
    last_name: data.last_name,
    is_consultant_firm: isConsultantFirm === YesNo.Yes ? true : false,
    org_id: data.org_id || '',
    status_rid: data.status || '',
    street: data.street || '',
    zip_code: data.zip_code || '',
    role: data.role_rid || '',
    profile_id: data.profile_rid || '',
    country_rid: data.country_rid || null,
    city_rid: data.city_rid || null,
    region_rid: data.region_rid || null,
    phone: data.phone || null,
    organization: data.organization,
  };

  if (isEditView && userData) {
    return {
      ...basePayload,
      rid: userData.rid,
      azure_id: userData.azure_id,
    };
  }

  return {
    ...basePayload,
    email: data.email,
    created_by: UserRole.Admin,
  };
};
