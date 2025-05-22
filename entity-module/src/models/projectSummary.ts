import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";

export interface ProjectSummaryAttributes {
  rid?: string;
  r_number?: string;

  project_id: string;
  project_number: string;
  project_code: string;
  industry_rid: string;
  industry_name?: string;
  account_rid: string;
  program_name?: string | null;
  project_name?: string | null;
  project_startdate?: Date | null;
  project_enddate?: Date | null;
  project_status: "Active" | "Inactive";
  fiscal_year: number;
  project_type: "Fixed" | "Time & Material";
  project_classification_rid?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;

  country?: string | null;
  region?: string | null;
  currency?: string | null;

  total_effort?: string | null;
  total_cost?: string | null;
  total_fte?: number;
  total_sub_con?: number;
  total_non_labor_cost?: string | null;
  total_fte_cost?: string | null;
  total_sub_con_cost?: string | null;
  comments?: string | null;

  qualified_research_expenditure?: number | null;
  is_rd_qualified?: boolean | null;
  qre?: number | null;

  project_point_of_contact?: string | null;
  financial_consultant?: string | null;
  technical_consultant?: string | null;

  created_datetime?: Date;
  modified_datetime?: Date;
  created_by: string;
  modified_by?: string | null;
}

interface ProjectSummaryCreationAttributes
  extends Optional<ProjectSummaryAttributes, "rid"> {}

export class ProjectSummary
  extends Model<ProjectSummaryAttributes, ProjectSummaryCreationAttributes>
  implements ProjectSummaryAttributes
{
  public rid?: string;
  public r_number?: string;
  public project_id!: string;
  public project_code!: string;
  public account_rid!: string;
  public industry_rid!: string;
  public industry_name?: string;
  public program_name?: string | null;
  public project_name?: string | null;
  public project_startdate?: Date | null;
  public project_enddate?: Date | null;
  public project_status!: "Active" | "Inactive";
  public project_type!: "Fixed" | "Time & Material";
  public project_classification_rid?: string | null;
  public project_client_group?: string | null;
  public project_group?: string | null;
  public fiscal_year!: number;
  public country?: string | null;
  public region?: string | null;
  public currency?: string | null;
  public total_effort?: string | null;
  public total_cost?: string | null;
  public total_fte?: number;
  public total_sub_con?: number;
  public total_non_labor_cost?: string | null;
  public total_fte_cost?: string | null;
  public total_sub_con_cost?: string | null;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by!: string;
  public modified_by?: string | null;
  public comments?: string | null;
  public qualified_research_expenditure?: number | null;
  public is_rd_qualified?: boolean | null;
  public qre?: number | null;
  public project_point_of_contact?: string | null;
  public technical_consultant?: string | null;
  public financial_consultant?: string | null;
  public project_number!: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    ProjectSummary.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        project_number: {
          type: DataTypes.STRING(200),
          allowNull: false,
        },
        project_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        account_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        project_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: false,
        },
        industry_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        industry_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        program_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        project_name: DataTypes.STRING(255),
        project_startdate: DataTypes.DATE,
        project_enddate: DataTypes.DATE,
        project_status: {
          type: DataTypes.ENUM("Active", "Inactive"),
          allowNull: false,
        },
        project_type: {
          type: DataTypes.ENUM("Fixed", "Time & Material"),
          allowNull: false,
        },
        project_classification_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        project_client_group: DataTypes.STRING(200),
        project_group: DataTypes.STRING(150),
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        country: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        region: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        currency: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        total_effort: DataTypes.DOUBLE,
        total_cost: DataTypes.DOUBLE,
        total_fte: DataTypes.INTEGER,
        total_sub_con: DataTypes.INTEGER,
        total_fte_cost: DataTypes.DOUBLE,
        total_sub_con_cost: DataTypes.DOUBLE,
        total_non_labor_cost: DataTypes.DOUBLE,
        qualified_research_expenditure: {
          type: DataTypes.DOUBLE,
          allowNull: true,
        },
        is_rd_qualified: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        qre: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        project_point_of_contact: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        technical_consultant: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        financial_consultant: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        created_by: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        modified_by: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        comments: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName ? schemaName : "public",
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
      "CREATE SEQUENCE IF NOT EXISTS project_summary_seq START 1"
    );

    await sequelize.query(`ALTER TABLE project_summary
        ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_SUMMARY} ' || LPAD(nextval('project_summary_seq')::text, 10, '0')`);

    console.log("Project summary sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project summary sequence:", error);
  }
}
