import { CaseDetails, CaseFormFields, CaseFormPayload } from '../../../types';

export const generateCaseNamePrefix = (
  accName: string,
  country: string,
  year: string
) => {
  return `${accName}-${country}-${year}-`;
};

export const transformCaseFormPayload = (
  accountId: string,
  formData: CaseFormFields,
  isEditView: boolean,
  originalData?: CaseDetails
): CaseFormPayload => {
  const basePayload: CaseFormPayload = {
    account_rid: accountId || formData.account_rid || '',
    case_owner_rid: formData.case_owner || '',
    case_name: formData.case_name || '',
    description: formData.description || '',
    fiscal_year: formData.fiscal_year || 0,
    filing_type_rid: formData.filing_type || '',
    case_startdate: formData.case_startdate || '',
    planned_submission_date: formData.planned_submission_date || '',
    statutory_submission_date: formData.statutory_submission_date || '',
    heat_light_power: formData.heat_light_power || null,
    total_nonlabor_cost: formData.total_nonlabor_cost || null,
    tax_liability: formData.tax_liability || null,
    status_rid: formData.status_rid,
  };

  if (isEditView && originalData) {
    return {
      ...basePayload,
      case_rid: originalData.rid,
    };
  }
  return basePayload;
};
