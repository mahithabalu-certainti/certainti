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
  tax_liability?: number;
  financial_working_signoff? : boolean
  employers_pension_contribution? : number
  other? : number
  material_software_cost? : number;
  sub_contracts? : number;
  cloud_software?: number;
  unpaid_amounts_paid? : number;
  unpaid_amounts? : number;
  aggregated_turnover? : number;
  total_expenses ? : number;
  taxable_income ? : number;
  export_sales_revenue? : number;
  illinois_cost_of_supplies? : number;
  illinois_lease_costs_of_computers? : number;
  illinois_rd_credit_partnership_corp? : number;
  illinois_research_payments_corp_only? : number;
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
  public tax_liability?: number;
  public financial_working_signoff? : boolean
  public employers_pension_contribution? : number
  public other? : number
  public material_software_cost? : number;
  public sub_contracts? : number;
  public cloud_software?: number;
  public unpaid_amounts_paid? : number;
  public unpaid_amounts? : number;
  public aggregated_turnover? : number;
  public total_expenses ? : number;
  public taxable_income ? : number;
  public export_sales_revenue? : number;
  public illinois_cost_of_supplies? : number;
  public illinois_lease_costs_of_computers? : number;
  public illinois_rd_credit_partnership_corp? : number;
  public llinois_research_payments_corp_only? : number;

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
        tax_liability: { type: DataTypes.DECIMAL, allowNull: true },
        financial_working_signoff : {type : DataTypes.BOOLEAN, defaultValue : false},
        employers_pension_contribution : {type : DataTypes.DECIMAL, allowNull : true},
        other : {type : DataTypes.DECIMAL, allowNull : true},
        material_software_cost : {type : DataTypes.DECIMAL, allowNull : true},
        sub_contracts : {type : DataTypes.DECIMAL, allowNull : true},
        cloud_software: {type : DataTypes.DECIMAL, allowNull : true},
        unpaid_amounts_paid : {type : DataTypes.DECIMAL, allowNull : true},
        unpaid_amounts : {type : DataTypes.DECIMAL, allowNull : true},
        aggregated_turnover : {type : DataTypes.DECIMAL, allowNull : true},
        total_expenses : {type : DataTypes.DECIMAL, allowNull : true},
        taxable_income : {type : DataTypes.DECIMAL, allowNull : true},
        export_sales_revenue : {type : DataTypes.DECIMAL, allowNull : true},
        illinois_cost_of_supplies : {type : DataTypes.DECIMAL, allowNull : true},
        illinois_lease_costs_of_computers : {type : DataTypes.DECIMAL, allowNull : true},
        illinois_rd_credit_partnership_corp : {type : DataTypes.DECIMAL, allowNull : true},
        illinois_research_payments_corp_only : {type : DataTypes.DECIMAL, allowNull : true}
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