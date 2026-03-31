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
  public lease_costs_of_computers_nj? : number;
  public lease_costs_of_computers_il? : number;
  public lease_costs_of_computers_ca? : number;
  public lease_costs_of_computers_az? : number;
  public lease_costs_of_computers_id? : number;
  public illinois_rd_credit_partnership_corp? : number;
  public llinois_research_payments_corp_only? : number;
  public basic_research_payments_ma? : number
  public basic_research_payments_id? : number
  public qualified_computer_rental_time_expenses? : number;
  public current_year_gross_receipts?: number
  public other_credits_total_ga?: number
  public other_credits_total_sc?: number
  public rrc_credit_280_c? : string
  public asc_credit_280_c? : string
  public parent_case_rid?: string;
  public credit_carry_forward_py_ga? : number
  public credit_carry_forward_py_sc? : number
  public credit_carry_forward_py_tx? : number
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
        current_year_gross_receipts: {type : DataTypes.DECIMAL, allowNull : true},
        other_credits_total_ga: {type : DataTypes.DECIMAL, allowNull : true},
        other_credits_total_sc: {type : DataTypes.DECIMAL, allowNull : true},
        rrc_credit_280_c : {type : DataTypes.STRING(10), defaultValue : "No"},
        asc_credit_280_c : {type : DataTypes.STRING(10), defaultValue : "No"},
        parent_case_rid : {type : DataTypes.STRING(50), allowNull : true   },
        credit_carry_forward_py_ga : {type : DataTypes.DECIMAL, allowNull : true},
        credit_carry_forward_py_sc : {type : DataTypes.DECIMAL, allowNull : true},
        credit_carry_forward_py_tx : {type : DataTypes.DECIMAL, allowNull : true},
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