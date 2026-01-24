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
    other: formData.other || null,
    status_rid: formData.status_rid,
    illinois_research_payments_corp_only:
      formData.illinois_research_payments_corp_only || null,
    lease_costs_of_computers: formData.lease_costs_of_computers || null,
    qualified_computer_rental_time_expenses:
      formData.qualified_computer_rental_time_expenses || null,
    basic_research_payments: formData.basic_research_payments || null,
    illinois_rd_credit_partnership_corp:
      formData.illinois_rd_credit_partnership_corp || null,
    credit_carry_forward_py: formData.credit_carry_forward_py || null,
    gross_receipts: formData.gross_receipts || null,
  };

  if (isEditView && originalData) {
    return {
      ...basePayload,
      case_rid: originalData.rid,
    };
  }
  return basePayload;
};
