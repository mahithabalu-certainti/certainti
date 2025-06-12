import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";
import { ProjectSummary } from "./projectSummary";

export interface ProjectFiscalSummaryAttributes {
  rid?: string;
  r_number?: string;
  project_rid: string;
  project_fiscal_rid: string;
  eid?: string | null;
  project_code: string;
  industry_rid: string | null;
  industry_name?: string | null;
  account_rid: string;
  account_fiscal_rid?: string | null;
  program_name?: string | null;
  project_name?: string | null;
  fiscal_year: number;
  project_startdate?: Date | null;
  project_enddate?: Date | null;
  project_type: "Fixed" | "Time & Material";
  project_classification_rid?: string | null;
  project_classification_other?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  project_status?: string;
  country?: string | null;
  region?: string | null;
  comments?: string;
  currency?: string | null;

  total_fte?: number | null;
  total_subcon?: number | null;
  total_effort?: number | null;
  total_cost?: number | null;
  total_effort_fte?: number | null;
  total_effort_subcon?: number | null;
  total_cost_fte?: number | null;
  total_cost_subcon?: number | null;
  total_cost_nonlabor?: number | null;

  total_fte_prj_res?: number;
  total_subcon_prj_res?: number;
  total_effort_prj_res?: number;
  total_cost_prj_res?: number;
  total_effort_fte_prj_res?: number;
  total_effort_subcon_prj_res?: number;
  total_cost_fte_prj_res?: number;
  total_cost_subcon_prj_res?: number;
  total_cost_nonlabor_prj_res?: number;

  total_fte_prj_task?: number;
  total_subcon_prj_task?: number;
  total_effort_prj_task?: number;
  total_cost_prj_task?: number;
  total_effort_fte_prj_task?: number;
  total_effort_subcon_prj_task?: number;
  total_cost_fte_prj_task?: number;
  total_cost_subcon_prj_task?: number;
  total_cost_nonlabor_prj_task?: number;

  qre_potential?: number;
  qre_adjustment?: number;
  qre_final?: number;
  qre_cost_total?: number;
  qre_cost_fte?: number;
  qre_cost_subcon?: number;
  qre_cost_nonlabor?: number;

  is_rd_qualified?: boolean | null;

  rd_credits_total?: number;
  rd_credits_fte?: number;
  rd_credits_subcon?: number;
  rd_credits_nonlabor?: number;

  auto_send_ai_interaction: boolean;
  auto_access_rd?: boolean;
  max_ai_interaction: number;

  blended_rate_fte?: number | null;
  blended_rate_subcon?: number | null;
  blended_rate?: number | null;

  project_point_of_contact?: string | null;
  technical_point_of_contact?: string | null;
  financial_consultant?: string | null;

  assessment_status?: string | null;

  created_datetime?: Date;
  modified_datetime?: Date;
  created_by: string;
  modified_by?: string;
}

interface ProjectFiscalSummaryCreationAttributes
  extends Optional<ProjectFiscalSummaryAttributes, "rid"> {}

export class ProjectFiscalSummary
  extends Model<
    ProjectFiscalSummaryAttributes,
    ProjectFiscalSummaryCreationAttributes
  >
  implements ProjectFiscalSummaryAttributes
{
  public rid?: string;
  public r_number?: string;
  public project_rid!: string;
  public project_fiscal_rid!: string;
  public eid?: string | null;
  public project_code!: string;
  public industry_rid!: string | null;
  public industry_name?: string | null;
  public account_rid!: string;
  public account_fiscal_rid?: string | null;
  public program_name?: string | null;
  public project_name?: string | null;
  public fiscal_year!: number;
  public project_startdate?: Date;
  public project_enddate?: Date;
  public project_type!: "Fixed" | "Time & Material";
  public project_classification_rid?: string | null;
  public project_classification_other?: string | null;
  public project_client_group?: string | null;
  public project_group?: string | null;
  public project_status?: string;
  public country?: string | null;
  public region?: string | null;
  public comments?: string;
  public currency?: string | null;

  public total_fte?: number | null;
  public total_subcon?: number | null;
  public total_effort?: number | null;
  public total_cost?: number | null;
  public total_effort_fte?: number | null;
  public total_effort_subcon?: number | null;
  public total_cost_fte?: number | null;
  public total_cost_subcon?: number | null;
  public total_cost_nonlabor?: number | null;

  public total_fte_prj_res?: number;
  public total_subcon_prj_res?: number;
  public total_effort_prj_res?: number;
  public total_cost_prj_res?: number;
  public total_effort_fte_prj_res?: number;
  public total_effort_subcon_prj_res?: number;
  public total_cost_fte_prj_res?: number;
  public total_cost_subcon_prj_res?: number;
  public total_cost_nonlabor_prj_res?: number;

  public total_fte_prj_task?: number;
  public total_subcon_prj_task?: number;
  public total_effort_prj_task?: number;
  public total_cost_prj_task?: number;
  public total_effort_fte_prj_task?: number;
  public total_effort_subcon_prj_task?: number;
  public total_cost_fte_prj_task?: number;
  public total_cost_subcon_prj_task?: number;
  public total_cost_nonlabor_prj_task?: number;

  public qre_potential?: number;
  public qre_adjustment?: number;
  public qre_final?: number;
  public qre_cost_total?: number;
  public qre_cost_fte?: number;
  public qre_cost_subcon?: number;
  public qre_cost_nonlabor?: number;

  public is_rd_qualified?: boolean | null;

  public rd_credits_total?: number;
  public rd_credits_fte?: number;
  public rd_credits_subcon?: number;
  public rd_credits_nonlabor?: number;

  public auto_send_ai_interaction!: boolean;
  public auto_access_rd?: boolean;
  public max_ai_interaction!: number;

  public blended_rate_fte?: number | null;
  public blended_rate_subcon?: number | null;
  public blended_rate?: number | null;

  public assessment_status?: string | null;

  public project_point_of_contact?: string | null;
  public technical_point_of_contact?: string | null;
  public financial_consultant?: string | null;

  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by!: string;
  public modified_by?: string;

  static initialize(sequelize: Sequelize, schema: string) {
    ProjectFiscalSummary.init(
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
        project_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        project_fiscal_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        eid: DataTypes.UUID,
        project_code: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        industry_rid: DataTypes.UUID,
        industry_name: DataTypes.STRING,
        account_rid: DataTypes.UUID,
        account_fiscal_rid: DataTypes.UUID,
        program_name: DataTypes.STRING,
        project_name: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        fiscal_year: DataTypes.INTEGER,
        project_startdate: DataTypes.DATE,
        project_enddate: DataTypes.DATE,
        project_type: DataTypes.ENUM("Fixed", "Time & Material"),
        project_classification_rid: DataTypes.UUID,
        project_classification_other: DataTypes.STRING,
        project_client_group: DataTypes.STRING,
        project_group: DataTypes.STRING,
        project_status: DataTypes.STRING,
        country: DataTypes.UUID,
        region: DataTypes.UUID,
        comments: DataTypes.STRING(2000),
        currency: DataTypes.UUID,

        total_fte: DataTypes.INTEGER,
        total_subcon: DataTypes.INTEGER,

        total_effort: DataTypes.DECIMAL(18, 2),
        total_cost: DataTypes.DECIMAL(18, 2),

        total_effort_fte: DataTypes.DECIMAL(18, 2),
        total_effort_subcon: DataTypes.DECIMAL(18, 2),
        total_cost_fte: DataTypes.DECIMAL(18, 2),
        total_cost_subcon: DataTypes.DECIMAL(18, 2),
        total_cost_nonlabor: DataTypes.DECIMAL(18, 2),

        total_fte_prj_res: DataTypes.INTEGER,
        total_subcon_prj_res: DataTypes.INTEGER,
        total_effort_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_prj_res: DataTypes.DECIMAL(18, 2),
        total_effort_fte_prj_res: DataTypes.DECIMAL(18, 2),
        total_effort_subcon_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_fte_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_subcon_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_nonlabor_prj_res: DataTypes.DECIMAL(18, 2),

        total_fte_prj_task: DataTypes.INTEGER,
        total_subcon_prj_task: DataTypes.INTEGER,
        total_effort_prj_task: DataTypes.DECIMAL(18, 2),
        total_cost_prj_task: DataTypes.DECIMAL(18, 2),
        total_effort_fte_prj_task: DataTypes.DECIMAL(18, 2),
        total_effort_subcon_prj_task: DataTypes.DECIMAL(18, 2),
        total_cost_fte_prj_task: DataTypes.DECIMAL(18, 2),
        total_cost_subcon_prj_task: DataTypes.DECIMAL(18, 2),
        total_cost_nonlabor_prj_task: DataTypes.DECIMAL(18, 2),

        qre_potential: DataTypes.INTEGER,
        qre_adjustment: DataTypes.DECIMAL(18, 2),
        qre_final: DataTypes.DECIMAL(18, 2),
        qre_cost_total: DataTypes.DECIMAL(18, 2),
        qre_cost_fte: DataTypes.DECIMAL(18, 2),
        qre_cost_subcon: DataTypes.DECIMAL(18, 2),
        qre_cost_nonlabor: DataTypes.DECIMAL(18, 2),

        is_rd_qualified: DataTypes.BOOLEAN,
        rd_credits_total: DataTypes.DECIMAL,
        rd_credits_fte: DataTypes.DECIMAL,
        rd_credits_subcon: DataTypes.DECIMAL,
        rd_credits_nonlabor: DataTypes.DECIMAL,

        auto_send_ai_interaction: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        auto_access_rd: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        max_ai_interaction: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        assessment_status: {
          type: DataTypes.STRING(150),
          allowNull: true
        },
        blended_rate_fte: DataTypes.DECIMAL(18, 2),
        blended_rate_subcon: DataTypes.DECIMAL(18, 2),
        blended_rate: DataTypes.DECIMAL(18, 2),
        project_point_of_contact: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        technical_point_of_contact: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        financial_consultant: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
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
        modified_by: DataTypes.UUID,
      },
      {
        sequelize,
        schema,
        tableName: "project_fiscal_summary",
        timestamps: false,
        underscored: true,
      }
    );

    ProjectFiscalSummary.belongsTo(ProjectSummary, {
      foreignKey: "project_rid",
      targetKey: "rid",
      as: "project",
    });

    ProjectSummary.hasMany(ProjectFiscalSummary, {
      foreignKey: "project_rid",
      sourceKey: "rid",
      as: "ProjectFiscal",
    });

    return ProjectFiscalSummary;
  }
}

export async function setupProjectFiscal(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_fiscal_summary_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".project_fiscal_summary
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_FISCAL} ' || LPAD(nextval('"${schemaName}".project_fiscal_seq')::text, 10, '0')`);

    console.log("Project fiscal sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project fiscal sequence:", error);
  }
}
