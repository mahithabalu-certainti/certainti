import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CaseProjectResourceFiscalAttributes {
  rid: string;
  r_number?: string;
  eid?: string | null;
  created_by: string;
  modified_by?: string | null;
  created_datetime: Date;
  modified_datetime?: Date | null;
  project_resource_fiscal_rid?: string;
  case_project_rid: string;
  account_rid: string;
  case_rid: string;
  project_rid: string;
  resource_rid: string;
  fiscal_year: number;
  total_hours_pro_res?: number | null;
  total_cost_pro_res?: number | null;
  status_rid?: string | null;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  effort_project_resource_level?: number | null;
  cost_project_resource_level?: number | null;
  cost_project_task_level?: number | null;
  blended_cost_project_task_level?: number | null;
  blended_cost_project_resource_level?: number | null;
  effort_project_task_level?: number | null;
  total_hours_from_tasks?: number | null;
  total_cost_from_tasks?: number | null;
  total_cost_from_tasks_blended?: number | null;
  rd_percent_potential_ai?: number | null;
  rd_percent_adjustment?: number | null;
  rd_percent_final?: number | null;
  qre_fte?: number | null;
  qre_subcon?: number | null;
  qre_nonlabor?: number | null;
  qre_final?: number | null;
  rd_credits_fte_region_level?: number | null;
  rd_credits_subcon_region_level?: number | null;
  rd_credits_nonlabor_region_level?: number | null;
  rd_credits_region_level?: number | null;
  rd_credits_fte_fed_level?: number | null;
  rd_credits_subcon_fed_level?: number | null;
  rd_credits_nonlabor_fed_level?: number | null;
  rd_credits_fed_level?: number | null;
  rd_credits_total?: number | null;
  description?: string | null;
  project_fiscal_rid: string;
}

export interface CaseProjectResourceFiscalCreationAttributes
  extends Optional<CaseProjectResourceFiscalAttributes, "rid"> {}

export class CaseProjectResourceFiscal
  extends Model<CaseProjectResourceFiscalAttributes, CaseProjectResourceFiscalCreationAttributes>
  implements CaseProjectResourceFiscalAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime!: Date;
  public modified_datetime?: Date;
  public project_resource_fiscal_rid?: string;
  public case_project_rid!: string;
  public account_rid!: string;
  public case_rid!: string;
  public project_rid!: string;
  public resource_rid!: string;
  public fiscal_year!: number;
  public total_hours_pro_res?: number;
  public total_cost_pro_res?: number;
  public status_rid?: string;
  public country_rid?: string;
  public region_rid?: string;
  public currency_rid?: string;
  public effort_project_resource_level?: number;
  public cost_project_resource_level?: number;
  public cost_project_task_level?: number;
  public blended_cost_project_task_level?: number;
  public blended_cost_project_resource_level?: number;
  public effort_project_task_level?: number;
  public total_hours_from_tasks?: number;
  public total_cost_from_tasks?: number;
  public total_cost_from_tasks_blended?: number;
  public rd_percent_potential_ai?: number;
  public rd_percent_adjustment?: number;
  public rd_percent_final?: number;
  public qre_fte?: number;
  public qre_subcon?: number;
  public qre_nonlabor?: number;
  public qre_final?: number;
  public rd_credits_fte_region_level?: number;
  public rd_credits_subcon_region_level?: number;
  public rd_credits_nonlabor_region_level?: number;
  public rd_credits_region_level?: number;
  public rd_credits_fte_fed_level?: number;
  public rd_credits_subcon_fed_level?: number;
  public rd_credits_nonlabor_fed_level?: number;
  public rd_credits_fed_level?: number;
  public rd_credits_total?: number;
  public description?: string;
  public project_fiscal_rid!: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CaseProjectResourceFiscal.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        eid: { type: DataTypes.STRING(120), allowNull: true },
        created_by: { type: DataTypes.STRING(255), allowNull: false },
        modified_by: { type: DataTypes.STRING(255), allowNull: true },
        created_datetime: { type: DataTypes.DATE, allowNull: false },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        project_resource_fiscal_rid: { type: DataTypes.STRING(50), allowNull: false },  
        case_project_rid: { type: DataTypes.STRING(50), allowNull: false },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        case_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: false },
        resource_rid: { type: DataTypes.STRING(50), allowNull: false },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: false },
        total_hours_pro_res: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        total_cost_pro_res: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
        country_rid: { type: DataTypes.STRING(50), allowNull: true },
        region_rid: { type: DataTypes.STRING(50), allowNull: true },
        currency_rid: { type: DataTypes.STRING(50), allowNull: true },
        effort_project_resource_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        cost_project_resource_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        cost_project_task_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        blended_cost_project_task_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        blended_cost_project_resource_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        effort_project_task_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        total_hours_from_tasks: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        total_cost_from_tasks: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        total_cost_from_tasks_blended: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_percent_potential_ai: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_percent_adjustment: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_percent_final: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        qre_fte: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        qre_subcon: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        qre_nonlabor: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        qre_final: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_credits_fte_region_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_credits_subcon_region_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_credits_nonlabor_region_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_credits_region_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_credits_fte_fed_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_credits_subcon_fed_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_credits_nonlabor_fed_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_credits_fed_level: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        rd_credits_total: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        description: { type: DataTypes.STRING(2000), allowNull: true },
        project_fiscal_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: false, 
          defaultValue: 'TEMPORARY_ID' 
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_project_resource_fiscal",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

export async function setupCaseProjectResourceFiscalSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".case_project_resource_fiscal_seq START 1`
    );

    await sequelize.query(`
      ALTER TABLE "${schemaName}".case_project_resource_fiscal
      ALTER COLUMN r_number SET DEFAULT 'CPRSF-' || LPAD(nextval('"${schemaName}".case_project_resource_fiscal_seq')::text, 10, '0')
    `);

    logMessage("CaseProjectResourceFiscal sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up CaseProjectResourceFiscal sequence: ${error}`);
  }
}