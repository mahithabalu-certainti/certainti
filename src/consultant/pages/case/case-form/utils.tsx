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

    // ============ Non-US Fields ============
    heat_light_power: formData.heat_light_power || null,
    total_nonlabor_cost: formData.total_nonlabor_cost || null,
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

    // ============ US - Federal Fields ============
    current_year_gross_receipts: formData.current_year_gross_receipts || null,
    qualified_computer_rental_time_expenses:
      formData.qualified_computer_rental_time_expenses || null,

    // ============ US - Arizona (AZ) ============
    lease_costs_of_computers_az: formData.lease_costs_of_computers_az || null,

    // ============ US - California (CA) ============
    lease_costs_of_computers_ca: formData.lease_costs_of_computers_ca || null,

    // ============ US - Connecticut (CT) ============
    tax_liability_ct: formData.tax_liability_ct || null,

    // ============ US - District of Columbia (DC) ============
    basic_research_payments_dc: formData.basic_research_payments_dc || null,
    energy_consortia_amount_dc: formData.energy_consortia_amount_dc || null,
    qualified_org_baseamount_dc: formData.qualified_org_baseamount_dc || null,
    lease_costs_of_computers_dc: formData.lease_costs_of_computers_dc || null,

    // ============ US - Georgia (GA) ============
    tax_liability_ga: formData.tax_liability_ga || null,
    credit_carry_forward_py_ga: formData.credit_carry_forward_py_ga || null,
    other_credits_total_ga: formData.other_credits_total_ga || null,

    // ============ US - Idaho (ID) ============
    lease_costs_of_computers_id: formData.lease_costs_of_computers_id || null,
    basic_research_payments_id: formData.basic_research_payments_id || null,

    // ============ US - Illinois (IL) ============
    lease_costs_of_computers_il: formData.lease_costs_of_computers_il || null,
    illinois_rd_credit_partnership_corp:
      formData.illinois_rd_credit_partnership_corp || null,
    illinois_research_payments_corp_only:
      formData.illinois_research_payments_corp_only || null,

    // ============ US - Iowa (IA) ============
    basic_research_payments_ia: formData.basic_research_payments_ia || null,
    qualified_org_baseamount_ia: formData.qualified_org_baseamount_ia || null,
    cost_of_supplies_ia: formData.cost_of_supplies_ia || null,
    rac_share_ia: formData.rac_share_ia || null,
    supplemental_rac_ia: formData.supplemental_rac_ia || null,
    pass_through_supplemental_rac_ia:
      formData.pass_through_supplemental_rac_ia || null,
    non_qualifying_ia_wages: formData.non_qualifying_ia_wages || null,

    // ============ US - Kansas (KS) ============
    tax_liability_ks: formData.tax_liability_ks || null,
    machinery_equipments_ks: formData.machinery_equipments_ks || null,

    // ============ US - Kentucky (KY) ============
    llet_credit_ky: formData.llet_credit_ky || null,
    corporation_tax_credit_ky: formData.corporation_tax_credit_ky || null,
    individual_tax_credit_ky: formData.individual_tax_credit_ky || null,

    // ============ US - Massachusetts (MA) ============
    basic_research_payments_ma: formData.basic_research_payments_ma || null,

    // In transformCaseFormPayload function, add Maine section:

    // ============ US - Maine (ME) ============
    credit_carry_forward_py_me: formData.credit_carry_forward_py_me || null,

    // In transformCaseFormPayload function, update Minnesota section:

    // ============ US - Minnesota (MN) ============
    nonprofit_development_contributions_mn:
      formData.nonprofit_development_contributions_mn || null,
    basic_research_amount_mn: formData.basic_research_amount_mn || null,
    credit_carry_over_mn: formData.credit_carry_over_mn || null,
    credit_tax_limit_mn: formData.credit_tax_limit_mn || null,
    lease_costs_of_computers_mn: formData.lease_costs_of_computers_mn || null,

    // ============ US - Nebraska (NE) ============
    off_campus_research_expenses_ne:
      formData.off_campus_research_expenses_ne || null,
    payroll_factor_on_campus_ne: formData.payroll_factor_on_campus_ne || null,
    payroll_factor_off_campus_ne: formData.payroll_factor_off_campus_ne || null,
    property_factor_on_campus_ne: formData.property_factor_on_campus_ne || null,
    property_factor_off_campus_ne:
      formData.property_factor_off_campus_ne || null,
    credit_distributed_ne: formData.credit_distributed_ne || null,
    credit_tax_refunds_ne: formData.credit_tax_refunds_ne || null,

    // ============ US - New Jersey (NJ) ============
    lease_costs_of_computers_nj: formData.lease_costs_of_computers_nj || null,

    // ============ US - South Carolina (SC) ============
    tax_liability_sc: formData.tax_liability_sc || null,
    credit_carry_forward_py_sc: formData.credit_carry_forward_py_sc || null,
    other_credits_total_sc: formData.other_credits_total_sc || null,

    // ============ US - Texas (TX) ============
    credit_carry_forward_py_tx: formData.credit_carry_forward_py_tx || null,

    // In transformCaseFormPayload function, update Vermont section:

    // ============ US - Vermont (VT) ============
    // credit_attributable_to_shared_wages_vt: formData.credit_attributable_to_shared_wages_vt || null,
    basic_research_payments_vt: formData.basic_research_payments_vt || null,
    energy_consortia_amount_vt: formData.energy_consortia_amount_vt || null,
    qualified_org_baseamount_vt: formData.qualified_org_baseamount_vt || null,
    lease_costs_of_computers_vt: formData.lease_costs_of_computers_vt || null,

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
