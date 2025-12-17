import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CaseProjectTaskAttributes {
  rid: string;
  r_number?: string;
  eid?: string | null;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  project_task_rid: string;
  case_project_rid: string;
  account_rid: string;
  case_rid: string;
  project_rid: string;
  project_fiscal_rid: string;
  project_resource_code: string;
  resource_rid: string;
  fiscal_year: number;
  start_date?: Date | null;
  end_date?: Date | null;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  total_hours_pro_task?: number | null;
  total_cost_pro_task?: number | null;
  comments?: string | null;
  status_rid?: string | null;
  project_resource_rid?: string | null;
  task_name?: string | null;
  task_type_rid?: string | null;
  task_classification_rid?: string | null;
  task_description?: string | null;
}

export interface CaseProjectTaskCreationAttributes
  extends Optional<CaseProjectTaskAttributes, "rid"> { }

export class CaseProjectTask
  extends Model<CaseProjectTaskAttributes, CaseProjectTaskCreationAttributes>
  implements CaseProjectTaskAttributes {
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public project_task_rid!: string;
  public case_project_rid!: string;
  public account_rid!: string;
  public case_rid!: string;
  public project_rid!: string;
  public project_fiscal_rid!: string;
  public project_resource_code!: string;
  public resource_rid!: string;
  public fiscal_year!: number;
  public start_date?: Date;
  public end_date?: Date;
  public country_rid?: string;
  public region_rid?: string;
  public currency_rid?: string;
  public total_hours_pro_task?: number;
  public total_cost_pro_task?: number;
  public comments?: string;
  public status_rid?: string;
  public project_resource_rid?: string;
  public task_name?: string;
  public task_type_rid?: string;
  public task_classification_rid?: string;
  public task_description?: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CaseProjectTask.init(
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
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        project_task_rid: { type: DataTypes.STRING(50), allowNull: false },
        case_project_rid: { type: DataTypes.STRING(50), allowNull: false },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        case_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_fiscal_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_resource_code: { type: DataTypes.STRING(50), allowNull: false },
        resource_rid: { type: DataTypes.STRING(50), allowNull: false },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: false },
        start_date: { type: DataTypes.DATEONLY, allowNull: true },
        end_date: { type: DataTypes.DATEONLY, allowNull: true },
        country_rid: { type: DataTypes.STRING(50), allowNull: true },
        region_rid: { type: DataTypes.STRING(50), allowNull: true },
        currency_rid: { type: DataTypes.STRING(50), allowNull: true },
        total_hours_pro_task: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        total_cost_pro_task: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        comments: { type: DataTypes.STRING(2000), allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
        project_resource_rid: { type: DataTypes.STRING(100), allowNull: true },
        task_name: { type: DataTypes.TEXT, allowNull: true },
        task_type_rid: { type: DataTypes.STRING(50), allowNull: true },
        task_classification_rid: { type: DataTypes.STRING(50), allowNull: true },
        task_description: { type: DataTypes.STRING(2000), allowNull: true },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_project_task",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

export async function setupCaseProjectTaskSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".case_project_tasks_seq START 1`
    );

    await sequelize.query(`
      ALTER TABLE "${schemaName}".case_project_task
      ALTER COLUMN r_number SET DEFAULT 'CPTA-' || LPAD(nextval('"${schemaName}".case_project_tasks_seq')::text, 10, '0')
    `);

    logMessage("CaseProjectTask sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up CaseProjectTask sequence: ${error}`);
  }
}