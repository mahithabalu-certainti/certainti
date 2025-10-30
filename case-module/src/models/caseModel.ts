import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

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
  form_type?: string;
  case_owner_rid: string;
  case_startdate?: Date;
  planned_submission_date?: Date;
  statutory_submission_date?: Date;
  status_rid?: string;
  case_total_projects?: number;
  case_total_project_cost?: number;
  case_total_rd_cost?: number;
  case_total_qre_cost?: number;
  submitted_datetime?: Date;
  approved_datetime?: Date;
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
  public case_total_project_cost?: number;
  public case_total_rd_cost?: number;
  public case_total_qre_cost?: number;
  public submitted_datetime?: Date;
  public approved_datetime?: Date;

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
        case_startdate: { type: DataTypes.DATE, allowNull: false },
        planned_submission_date: { type: DataTypes.DATE, allowNull: false },
        statutory_submission_date: { type: DataTypes.DATE, allowNull: false },
        status_rid: { type: DataTypes.STRING(50), allowNull: false },
        case_total_projects: { type: DataTypes.INTEGER, allowNull: true },
        case_total_project_cost: { type: DataTypes.DECIMAL, allowNull: true },
        case_total_rd_cost: { type: DataTypes.DECIMAL, allowNull: true },
        case_total_qre_cost: { type: DataTypes.DECIMAL, allowNull: true },
        submitted_datetime: { type: DataTypes.DATE, allowNull: true },
        approved_datetime: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "cases",
        timestamps: false,
        underscored: true,
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

    console.log("Cases sequence setup complete");
  } catch (error) {
    console.error("Error setting up Cases sequence:", error);
  }
}