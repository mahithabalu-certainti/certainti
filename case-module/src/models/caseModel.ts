import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { log } from "console";
import { logMessage } from "../utils/helpers";

interface CaseAttributes {
  rid: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  case_name: string;
  description?: string;
  fiscal_year: number;
  filing_type_rid: string;
  case_owner_rid: string;
  case_startdate?: Date;
  planned_submission_date?: Date;
  statutory_submission_date?: Date;
  status_rid?: string;
  case_total_projects?: number;
  case_total_qualified_projects?: number;
  case_total_project_cost?: number;
  case_total_rd_cost?: number;
  case_total_qre_cost?: number;
  case_completion_percentage?: number;
  case_total_qualified_project_cost?: number;
  total_nonlabor_cost?: number;
  heat_light_power?: number;
  submitted_datetime?: Date;
  approved_datetime?: Date;
  tax_liability_sc?: number;
  tax_liability_ct?: number;
  tax_liability_ga?: number;
  financial_working_signoff? : boolean;
  rd_form_signoff?:boolean;
  employers_pension_contribution? : number
  other_can? : number
  other_on? : number
  other_uk? : number
  other_irl? : number
  material_software_cost? : number;
  sub_contracts? : number;
  cloud_software?: number;
  unpaid_amounts_paid? : number;
  unpaid_amounts? : number;
  aggregated_turnover? : number;
  total_expenses ? : number;
  taxable_income ? : number;
  export_sales_revenue? : number;

  energy_consortia_amount_usa? :number;
  basic_research_payments_usa? :number;
  qualified_org_baseamount_usa? :number;
  lease_costs_of_computers_usa?:number;

  lease_costs_of_computers_nj? : number;
  lease_costs_of_computers_il? : number;
  lease_costs_of_computers_ca? : number;
  lease_costs_of_computers_az? : number;
  lease_costs_of_computers_id? : number;

  illinois_rd_credit_partnership_corp? : number;
  illinois_research_payments_corp_only? : number;

  basic_research_payments_ma? : number
  basic_research_payments_id? : number

  qualified_computer_rental_time_expenses? : number
 
  credit_carry_forward_py_ga? : number
  credit_carry_forward_py_sc? : number
  credit_carry_forward_py_tx? : number
  current_year_gross_receipts?: number
  other_credits_total_ga?: number,
  other_credits_total_sc?: number,
  rrc_credit_280_c? : string
  asc_credit_280_c? : string
  parent_case_rid?: string;
  assessment_methodology? : string;

  tax_liability_ri?: number;
  credit_carry_forward_py_ri?: number;

  basic_research_payments_ia?: number;
  qualified_org_baseamount_ia?: number;
  non_qualifying_wages_ia?: number;
  non_qualifying_contract_expenses_ia?:number;
  cost_of_supplies_ia?: number;
  rac_share_ia?: number;
  supplement_rac_ia?: number;
  passthrough_supplement_rac_ia?: number;

  machinery_equipments_ks?: number;
  tax_liability_ks?: number;

  llet_credit_ky?:number;
  corporation_tax_credit_ky?:number;
  individual_tax_credit_ky? : number;

  energy_consortia_amount_dc? :number;
  basic_research_payments_dc? :number;
  qualified_org_baseamount_dc? :number;
  lease_costs_of_computers_dc?:number;
   credit_shared_wages_dc?:number;
  pass_through_research_credit_dc?:number;
  amount_allocated_beneficiaries_dc?:number;

  qualified_computer_rental_time_expenses_wi?: number;
  research_supplies_expenses_wi?: number;
  additional_pass_through_credits_wi?: number;
  is_fiduciary_wi?: boolean;
  fiduciary_beneficiary_credit_wi?: number;
  orphan_drug_qualified_expenses_wi?: number;
  credit_offset_tax_wi?:number;
  credit_carry_forward_py_wi?: number;

  credit_carry_forward_py_me?: number;

  credit_carry_forward_py_il?: number;
  income_tax_amount_il?: number;

  lease_costs_of_computers_mn?:number;
  credit_tax_limit_mn?:number;
  basic_research_amount_mn?:number;
  nonprofit_development_contributions_mn?:number;
  credit_carry_over_mn?:number;

  property_factor_off_campus_ne?: number;
  property_factor_on_campus_ne?: number;
  payroll_factor_off_campus_ne?: number;
  payroll_factor_on_campus_ne?: number;
  off_campus_research_expenses_ne?: number;
  credit_tax_refunds_ne?: number;
  credit_distributed_ne?: number;

  energy_consortia_amount_vt? :number;
  basic_research_payments_vt? :number;
  qualified_org_baseamount_vt? :number;
  lease_costs_of_computers_vt?:number;
  credit_shared_wages_vt?:number;
  pass_through_research_credit_vt?:number;
  amount_allocated_beneficiaries_vt?:number;

  rural_basic_rd_credit_nm?:number;
  additional_tech_jobs_rd_credit_nm?:number;
  rural_additional_tech_jobs_rd_credit_nm?:number;
  




}

export interface CaseCreationAttributes
  extends Optional<CaseAttributes, "rid"> {}

export class Case
  extends Model<CaseAttributes, CaseCreationAttributes>
  implements CaseAttributes
{
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public case_name!: string;
  public description?: string;
  public fiscal_year!: number;
  public filing_type_rid!: string;
  public case_owner_rid!: string;
  public case_startdate!: Date;
  public planned_submission_date!: Date;
  public statutory_submission_date!: Date;
  public status_rid!: string;
  public case_total_projects?: number;
  public case_total_qualified_projects?: number;
  public case_total_project_cost?: number;
  public case_total_rd_cost?: number;
  public case_total_qre_cost?: number;
  public case_completion_percentage?: number;
  public case_total_qualified_project_cost?: number;
  public submitted_datetime?: Date;
  public approved_datetime?: Date;
  public total_nonlabor_cost?: number;
  public heat_light_power?: number;
  public tax_liability_sc?: number;
  public tax_liability_ct?: number;
  public tax_liability_ga?: number;
  public financial_working_signoff? : boolean;
  public rd_form_signoff?: boolean;
  public employers_pension_contribution? : number
  public other_can? : number
  public other_on? : number
  public other_uk? : number
  public other_irl? : number
  public material_software_cost? : number;
  public sub_contracts? : number;
  public cloud_software?: number;
  public unpaid_amounts_paid? : number;
  public unpaid_amounts? : number;
  public aggregated_turnover? : number;
  public total_expenses ? : number;
  public taxable_income ? : number;
  public export_sales_revenue? : number;
  public energy_consortia_amount_usa? : number;
  public basic_research_payments_usa? : number;
  public qualified_org_baseamount_usa? : number;
  public lease_costs_of_computers_nj? : number;
  public lease_costs_of_computers_il? : number;
  public lease_costs_of_computers_ca? : number;
  public lease_costs_of_computers_az? : number;
  public lease_costs_of_computers_id? : number;
  public illinois_rd_credit_partnership_corp? : number;
  public illinois_research_payments_corp_only? : number;
  public basic_research_payments_ma? : number
  public basic_research_payments_id? : number
  public qualified_computer_rental_time_expenses? : number;
  public qualified_computer_rental_time_expenses_wi?: number;
  public research_supplies_expenses_wi?: number;
  public additional_pass_through_credits_wi?: number;
  public is_fiduciary_wi?: boolean;
  public fiduciary_beneficiary_credit_wi?: number;
  public orphan_drug_qualified_expenses_wi?: number;
  public credit_offset_tax_wi?:number;
  public credit_carry_forward_py_wi? : number
  public current_year_gross_receipts?: number
  public other_credits_total_ga?: number
  public other_credits_total_sc?: number
  public rrc_credit_280_c? : string
  public asc_credit_280_c? : string
  public parent_case_rid?: string;
  public credit_carry_forward_py_ga? : number
  public credit_carry_forward_py_sc? : number
  public credit_carry_forward_py_tx? : number
  public assessment_methodology? : string

  public tax_liability_ri?:number;
  public credit_carry_forward_py_ri?:number;

  public basic_research_payments_ia?:number;
  public qualified_org_baseamount_ia?:number;
  public non_qualifying_wages_ia?:number;
  public non_qualifying_contract_expenses_ia?:number;
  public cost_of_supplies_ia?:number;
  public rac_share_ia?:number;
  public supplement_rac_ia?:number;
  public passthrough_supplement_rac_ia?:number;

  public tax_liability_ks?: number ;
  public machinery_equipments_ks?: number;

  public llet_credit_ky?:number;
  public corporation_tax_credit_ky?: number;
  public individual_tax_credit_ky?: number;

  public energy_consortia_amount_dc? :number;
  public basic_research_payments_dc? :number;
  public qualified_org_baseamount_dc? :number;

  public lease_costs_of_computers_dc?:number;
  public energy_consortia_amount_vt? :number;
  public basic_research_payments_vt? :number;
  public qualified_org_baseamount_vt? :number;
  public lease_costs_of_computers_vt?:number;

  public credit_carry_forward_py_me?:number;

  public lease_costs_of_computers_mn?:number;
  public basic_research_amount?:number;
  public nonprofit_development_contributions_mn?:number;
  public credit_tax_limit_mn?:number;
  public credit_carry_over_mn?:number;

  public property_factor_off_campus_ne?: number;
  public property_factor_on_campus_ne?: number;
  public payroll_factor_off_campus_ne?: number;
  public payroll_factor_on_campus_ne?: number;
  public off_campus_research_expenses_ne?: number;
  public credit_tax_refunds_ne?: number;
  public credit_distributed_ne?: number;
  public lease_costs_of_computers_usa?:number;
  public rural_basic_rd_credit_nm?: number;
  public additional_tech_jobs_rd_credit_nm?: number;
  public rural_additional_tech_jobs_rd_credit_nm?: number;
  public credit_carry_forward_py_il?: number;
  public income_tax_amount_il?: number;
  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return Case.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false, 
          defaultValue: DataTypes.NOW
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        case_name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: false },
        filing_type_rid: { type: DataTypes.STRING(100), allowNull: false },
        case_owner_rid: { type: DataTypes.STRING(50), allowNull: false },
        case_startdate: { type: DataTypes.DATEONLY, allowNull: false },
        planned_submission_date: { type: DataTypes.DATEONLY, allowNull: false },
        statutory_submission_date: { type: DataTypes.DATEONLY, allowNull: false },
        status_rid: { type: DataTypes.STRING(50), allowNull: false },
        case_total_projects: { type: DataTypes.INTEGER, allowNull: true },
        case_total_qualified_projects: { type: DataTypes.INTEGER, allowNull: true },
        case_total_project_cost: { type: DataTypes.DECIMAL, allowNull: true },
        case_total_rd_cost: { type: DataTypes.DECIMAL, allowNull: true },
        case_total_qre_cost: { type: DataTypes.DECIMAL, allowNull: true },
        case_completion_percentage: { type: DataTypes.DECIMAL, allowNull: true },
        case_total_qualified_project_cost: { type: DataTypes.DECIMAL, allowNull: true },
        submitted_datetime: { type: DataTypes.DATE, allowNull: true },
        approved_datetime: { type: DataTypes.DATE, allowNull: true },
        total_nonlabor_cost: { type: DataTypes.DECIMAL, allowNull: true },
        heat_light_power: { type: DataTypes.DECIMAL, allowNull: true },
        tax_liability_sc: {type : DataTypes.DECIMAL, allowNull : true},
        tax_liability_ct : {type : DataTypes.DECIMAL, allowNull : true},
        tax_liability_ga: {type : DataTypes.DECIMAL, allowNull : true},
        financial_working_signoff : {type : DataTypes.BOOLEAN, defaultValue : false},
        rd_form_signoff : {type : DataTypes.BOOLEAN, defaultValue : false},
        employers_pension_contribution : {type : DataTypes.DECIMAL, allowNull : true},
        other_can : {type : DataTypes.DECIMAL, allowNull : true},
        other_on : {type : DataTypes.DECIMAL, allowNull : true},
        other_uk : {type : DataTypes.DECIMAL, allowNull : true},
        other_irl : {type : DataTypes.DECIMAL, allowNull : true},
        material_software_cost : {type : DataTypes.DECIMAL, allowNull : true},
        sub_contracts : {type : DataTypes.DECIMAL, allowNull : true},
        cloud_software: {type : DataTypes.DECIMAL, allowNull : true},
        unpaid_amounts_paid : {type : DataTypes.DECIMAL, allowNull : true},
        unpaid_amounts : {type : DataTypes.DECIMAL, allowNull : true},
        aggregated_turnover : {type : DataTypes.DECIMAL, allowNull : true},
        total_expenses : {type : DataTypes.DECIMAL, allowNull : true},
        taxable_income : {type : DataTypes.DECIMAL, allowNull : true},
        export_sales_revenue : {type : DataTypes.DECIMAL, allowNull : true},
        
        energy_consortia_amount_usa: { type: DataTypes.DECIMAL, allowNull: true },
        basic_research_payments_usa: { type: DataTypes.DECIMAL, allowNull: true },
        qualified_org_baseamount_usa: { type: DataTypes.DECIMAL, allowNull: true },
        lease_costs_of_computers_usa: { type: DataTypes.DECIMAL, allowNull: true },

        lease_costs_of_computers_nj: { type: DataTypes.DECIMAL, allowNull: true },
        lease_costs_of_computers_il: { type: DataTypes.DECIMAL, allowNull: true },
        lease_costs_of_computers_ca: { type: DataTypes.DECIMAL, allowNull: true },
        lease_costs_of_computers_az: { type: DataTypes.DECIMAL, allowNull: true },
        lease_costs_of_computers_id: { type: DataTypes.DECIMAL, allowNull: true },

        illinois_rd_credit_partnership_corp : {type : DataTypes.DECIMAL, allowNull : true},
        illinois_research_payments_corp_only : {type : DataTypes.DECIMAL, allowNull : true},
        basic_research_payments_ma : {type : DataTypes.DECIMAL, allowNull : true},
        basic_research_payments_id : {type : DataTypes.DECIMAL, allowNull : true},
        qualified_computer_rental_time_expenses : {type : DataTypes.DECIMAL, allowNull : true},
        qualified_computer_rental_time_expenses_wi: {type : DataTypes.DECIMAL, allowNull : true},
        research_supplies_expenses_wi: {type : DataTypes.DECIMAL, allowNull : true},
        additional_pass_through_credits_wi: {type : DataTypes.DECIMAL, allowNull : true},
        is_fiduciary_wi: {type : DataTypes.BOOLEAN, defaultValue : false},
        fiduciary_beneficiary_credit_wi: {type : DataTypes.DECIMAL, allowNull : true},
        orphan_drug_qualified_expenses_wi: {type : DataTypes.DECIMAL, allowNull : true},
        credit_offset_tax_wi:{type : DataTypes.DECIMAL, allowNull : true},
        credit_carry_forward_py_wi: {type : DataTypes.DECIMAL, allowNull : true},
        current_year_gross_receipts: {type : DataTypes.DECIMAL, allowNull : true},
        other_credits_total_ga: {type : DataTypes.DECIMAL, allowNull : true},
        other_credits_total_sc: {type : DataTypes.DECIMAL, allowNull : true},
        rrc_credit_280_c : {type : DataTypes.STRING(10), defaultValue : "No"},
        asc_credit_280_c : {type : DataTypes.STRING(10), defaultValue : "No"},
        parent_case_rid : {type : DataTypes.STRING(50), allowNull : true   },
        
        credit_carry_forward_py_ga : {type : DataTypes.DECIMAL, allowNull : true},
        credit_carry_forward_py_sc : {type : DataTypes.DECIMAL, allowNull : true},
        credit_carry_forward_py_tx : {type : DataTypes.DECIMAL, allowNull : true},
        assessment_methodology : {type : DataTypes.TEXT, allowNull : true},
        tax_liability_ri: { type : DataTypes.DECIMAL, allowNull : true},
        credit_carry_forward_py_ri:{ type : DataTypes.DECIMAL, allowNull : true},

        basic_research_payments_ia: { type : DataTypes.DECIMAL, allowNull : true},
        qualified_org_baseamount_ia: { type : DataTypes.DECIMAL, allowNull : true},
        non_qualifying_wages_ia: { type : DataTypes.DECIMAL, allowNull : true},
        non_qualifying_contract_expenses_ia: { type : DataTypes.DECIMAL, allowNull : true},
        cost_of_supplies_ia: { type : DataTypes.DECIMAL, allowNull : true},
        rac_share_ia: { type : DataTypes.DECIMAL, allowNull : true},
        supplement_rac_ia: { type : DataTypes.DECIMAL, allowNull : true},
        passthrough_supplement_rac_ia: { type : DataTypes.DECIMAL, allowNull : true},

        tax_liability_ks: { type : DataTypes.DECIMAL, allowNull : true},
        machinery_equipments_ks: { type : DataTypes.DECIMAL, allowNull : true},
        llet_credit_ky: { type : DataTypes.DECIMAL, allowNull : true},
        corporation_tax_credit_ky: { type : DataTypes.DECIMAL, allowNull : true},
        individual_tax_credit_ky: { type : DataTypes.DECIMAL, allowNull : true},

        basic_research_payments_dc: {type : DataTypes.DECIMAL, allowNull : true},
        energy_consortia_amount_dc: {type : DataTypes.DECIMAL, allowNull : true},
        qualified_org_baseamount_dc: {type : DataTypes.DECIMAL, allowNull : true},
        lease_costs_of_computers_dc: {type : DataTypes.DECIMAL, allowNull : true},

        basic_research_payments_vt: {type : DataTypes.DECIMAL, allowNull : true},
        energy_consortia_amount_vt: {type : DataTypes.DECIMAL, allowNull : true},
        qualified_org_baseamount_vt: {type : DataTypes.DECIMAL, allowNull : true},
        lease_costs_of_computers_vt: {type : DataTypes.DECIMAL, allowNull : true},

        credit_carry_forward_py_me: {type : DataTypes.DECIMAL, allowNull : true},

        lease_costs_of_computers_mn: { type: DataTypes.DECIMAL, allowNull: true },
        credit_tax_limit_mn: { type: DataTypes.DECIMAL, allowNull: true },
        basic_research_amount_mn: { type: DataTypes.DECIMAL, allowNull: true },
        nonprofit_development_contributions_mn: { type: DataTypes.DECIMAL, allowNull: true },
        credit_carry_over_mn: { type: DataTypes.DECIMAL, allowNull: true },
         property_factor_off_campus_ne: { type: DataTypes.DECIMAL, allowNull: true },
         property_factor_on_campus_ne: { type: DataTypes.DECIMAL, allowNull: true },
         payroll_factor_off_campus_ne: { type: DataTypes.DECIMAL, allowNull: true },
         payroll_factor_on_campus_ne: { type: DataTypes.DECIMAL, allowNull: true },
         off_campus_research_expenses_ne: { type: DataTypes.DECIMAL, allowNull: true },
         credit_tax_refunds_ne: { type: DataTypes.DECIMAL, allowNull: true },
         credit_distributed_ne: { type: DataTypes.DECIMAL, allowNull: true },
         rural_basic_rd_credit_nm: { type: DataTypes.DECIMAL, allowNull: true },
         additional_tech_jobs_rd_credit_nm: { type: DataTypes.DECIMAL, allowNull: true },
         rural_additional_tech_jobs_rd_credit_nm: { type: DataTypes.DECIMAL, allowNull: true },
          credit_carry_forward_py_il: { type: DataTypes.DECIMAL, allowNull: true },
         income_tax_amount_il: { type: DataTypes.DECIMAL, allowNull: true }
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "cases",
        timestamps: false,
        underscored: true,
        indexes: [
          {
            name: "idx_cases_account_rid",
            fields: ["account_rid"],
          },
          {
            name: "idx_cases_case_rid",
            fields: ["rid"],
          },
          {
            name: "idx_cases_case_name",
            fields: ["case_name"],
          },
          {
            name: "idx_cases_case_owner_rid",
            fields: ["case_owner_rid"],
          }
        ],
      }
    );
  }
}
export async function setupCaseSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".cases_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".cases
      ALTER COLUMN r_number SET DEFAULT 'CAS-' || LPAD(nextval('"${schemaName}".cases_seq')::text, 10, '0')`);

    logMessage("Cases sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up Cases sequence: ${error}`);
  }
}