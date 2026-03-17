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
  originalData?: CaseDetails,
  isAmendmentType?: boolean,
  hasParentCase?: boolean,
  amendmentCaseInfo?: CaseFormPayload['amendment_case_info']
): CaseFormPayload => {
  const basePayload: CaseFormPayload = {
    account_rid: accountId || formData.account_rid || '',
    case_owner_rid: formData.case_owner || '',
    parent_case_rid:
      isAmendmentType && formData.parent_case_rid
        ? formData.parent_case_rid
        : '',
    case_name: formData.case_name || '',
    description: formData.description || '',
    fiscal_year: formData.fiscal_year || 0,
    filing_type_rid: formData.filing_type || '',
    case_startdate: formData.case_startdate || '',
    planned_submission_date: formData.planned_submission_date || '',
    statutory_submission_date: formData.statutory_submission_date || '',
    heat_light_power: formData.heat_light_power || null,
    total_nonlabor_cost: formData.total_nonlabor_cost || null,
    tax_liability_sc: formData.tax_liability_sc || null,
    tax_liability_ct: formData.tax_liability_ct || null,
    tax_liability_ga: formData.tax_liability_ga || null,
    total_expenses: formData.total_expenses || null,
    aggregated_turnover: formData.aggregated_turnover || null,
    unpaid_amounts_paid: formData.unpaid_amounts_paid || null,
    unpaid_amounts: formData.unpaid_amounts || null,
    cloud_software: formData.cloud_software || null,
    sub_contracts: formData.sub_contracts || null,
    public_sub_contracts: formData.public_sub_contracts || null,
    material_software_cost: formData.material_software_cost || null,
    employers_pension_contribution:
      formData.employers_pension_contribution || null,
    taxable_income: formData.taxable_income || null,
    export_sales_revenue: formData.export_sales_revenue || null,
    other_can: formData.other_can || null,
    other_on: formData.other_on || null,
    other_uk: formData.other_uk || null,
    other_irl: formData.other_irl || null,
    status_rid: formData.status_rid,
    illinois_research_payments_corp_only:
      formData.illinois_research_payments_corp_only || null,
    lease_costs_of_computers_az: formData.lease_costs_of_computers_az || null,
    lease_costs_of_computers_ca: formData.lease_costs_of_computers_ca || null,
    lease_costs_of_computers_id: formData.lease_costs_of_computers_id || null,
    lease_costs_of_computers_il: formData.lease_costs_of_computers_il || null,
    lease_costs_of_computers_nj: formData.lease_costs_of_computers_nj || null,
    other_credits_total_ga: formData.other_credits_total_ga || null,
    other_credits_total_sc: formData.other_credits_total_sc || null,
    qualified_computer_rental_time_expenses:
      formData.qualified_computer_rental_time_expenses || null,
    basic_research_payments_ma: formData.basic_research_payments_ma || null,
    basic_research_payments_id: formData.basic_research_payments_id || null,
    illinois_rd_credit_partnership_corp:
      formData.illinois_rd_credit_partnership_corp || null,
    credit_carry_forward_py: formData.credit_carry_forward_py || null,
    current_year_gross_receipts: formData.current_year_gross_receipts || null,
    ...(!isEditView
      ? {
          amendment_case_info:
            isAmendmentType && !hasParentCase && amendmentCaseInfo
              ? amendmentCaseInfo
              : [],
        }
      : {}),
  };

  if (isEditView && originalData) {
    return {
      ...basePayload,
      case_rid: originalData.rid,
    };
  }
  return basePayload;
};
