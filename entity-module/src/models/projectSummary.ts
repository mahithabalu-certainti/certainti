import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constants";
export interface ProjectSummaryAttributes {
  rid?: string;
  r_number?: string;
  eid?: string;

  project_code: string;
  project_rid: string;

  created_datetime?: Date;
  modified_datetime?: Date;
  created_by: string;
  modified_by?: string | null;

  account_rid: string;

  program_name?: string | null;
  project_name?: string | null;
  project_startdate?: Date | null;
  project_enddate?: Date | null;

  industry_rid: string | null;
  industry_name?: string | null;

  project_type_rid: string;
  project_classification_rid?: string | null;
  project_classification_other?: string | null;

  project_client_group?: string | null;
  project_group?: string | null;
  status_rid?: string;

  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;

  total_effort?: number | null;
  total_cost?: number | null;

  total_fte?: number | null;
  total_subcon?: number | null;

  total_cost_fte?: number | null;
  total_cost_subcon?: number | null;
  total_cost_nonlabor?: number | null;

  blended_rate_fte?: number | null;
  blended_rate_subcon?: number | null;
  blended_rate?: number | null;

  project_description?: string | null;
  comments?: string | null;

  is_rd_qualified?: boolean;
  qre?: number | null;

  assessment_status?: string | null;

  project_point_of_contact?: string | null;
  technical_point_of_contact?: string | null;
}
interface ProjectSummaryCreationAttributes
  extends Optional<ProjectSummaryAttributes, "rid"> {}
export class ProjectSummary
  extends Model<ProjectSummaryAttributes, ProjectSummaryCreationAttributes>
  implements ProjectSummaryAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public project_code!: string;
  public project_rid!: string;

  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by!: string;
  public modified_by?: string | null;

  public account_rid!: string;

  public program_name?: string | null;
  public project_name?: string | null;

  public project_startdate?: Date | null;
  public project_enddate?: Date | null;

  public project_type_rid!: string;
  public project_classification_rid?: string | null;
  public project_classification_other?: string | null;

  public industry_rid!: string;
  public industry_name?: string;

  public project_client_group?: string | null;
  public project_group?: string | null;

  public status_rid!: string;

  public country_rid?: string | null;
  public region_rid?: string | null;
  public currency_rid?: string | null;

  public total_effort?: number | null;
  public total_cost?: number | null;
  public total_fte?: number | null;
  public total_subcon?: number | null;

  public total_cost_fte?: number | null;
  public total_cost_subcon?: number | null;
  public total_cost_nonlabor?: number | null;

  public blended_rate_fte?: number | null;
  public blended_rate_subcon?: number | null;
  public blended_rate?: number | null;

  public project_description?: string | null;
  public comments?: string | null;

  public is_rd_qualified?: boolean;
  public qre?: number | null;

  public assessment_status?: string | null;

  public project_point_of_contact?: string | null;
  public technical_point_of_contact?: string | null;

  static initialize(sequelize: Sequelize, schemaName: string) {
    ProjectSummary.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        eid: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        modified_datetime: {
          type: DataTypes.DATE,
        },
        project_code: {
          type: DataTypes.STRING(120),
          allowNull: false,
        },
        project_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        program_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        project_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        project_startdate: DataTypes.DATE,
        project_enddate: DataTypes.DATE,
        project_type_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        project_classification_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        project_classification_other: {
          type: DataTypes.STRING(300),
          allowNull: true,
        },
        project_client_group: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        project_group: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        status_rid: {
          type: DataTypes.ENUM("Active", "Inactive"),
          allowNull: false,
        },
        industry_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        industry_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        comments: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        project_description: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        assessment_status: {
          type: DataTypes.STRING(150),
          allowNull: true,
        },
        country_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        region_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        currency_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        total_fte: DataTypes.INTEGER,
        total_subcon: DataTypes.INTEGER,
        total_effort: DataTypes.DECIMAL(18, 2),
        total_cost: DataTypes.DECIMAL(18, 2),
        total_cost_fte: DataTypes.DECIMAL(18, 2),
        total_cost_subcon: DataTypes.DECIMAL(18, 2),
        total_cost_nonlabor: DataTypes.DECIMAL(18, 2),

        blended_rate_fte: DataTypes.DECIMAL(18, 2),
        blended_rate_subcon: DataTypes.DECIMAL(18, 2),
        blended_rate: DataTypes.DECIMAL(18, 2),

        is_rd_qualified: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        qre: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        project_point_of_contact: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        technical_point_of_contact: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
        tableName: "project_summary",
        timestamps: false,
        underscored: true,
      }
    );

    return ProjectSummary;
  }
}

export async function setupProjectSummarySequence(sequelize: Sequelize) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS ${MAIN_SCHEMA_NAME}.project_summary_seq START 1`
    );

    await sequelize.query(`ALTER TABLE ${MAIN_SCHEMA_NAME}.project_summary
        ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_SUMMARY}-' || LPAD(nextval('${MAIN_SCHEMA_NAME}.project_summary_seq')::text, 10, '0')`);

    console.log("Project summary sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project summary sequence:", error);
  }
}
