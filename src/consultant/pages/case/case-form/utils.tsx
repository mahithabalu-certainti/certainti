import { caseformPayload } from '../../../types/cases-details';

export const transFormPayload = (
  formData: Partial<caseformPayload>
  // isEdit: boolean
) => {
  const data: Partial<caseformPayload> = {
    case_type: formData.case_type,
    case_name: formData.case_name,
    owner: formData.owner,
    fiscal_year: formData.fiscal_year,
    country: formData.country,
    state: formData.state,
    description: formData.description,
  };

  // if (isEdit) {
  //   delete data.resource_rid;
  //   delete data.account_rid;
  //   delete data.resource_type_rid;
  // }

  return data;
};
