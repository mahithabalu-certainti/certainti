import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
import { ProjectSummary } from "./projectSummary";

export interface ProjectFiscalSummaryAttributes {
  rid: string;
  r_number?: string;
  project_rid: string;
  project_fiscal_rid: string;
  eid?: string;

  created_datetime?: Date;
  modified_datetime?: Date;
  created_by: string;
  modified_by?: string | null;

  project_code: string;

  industry_rid: string | null;
  industry_name?: string | null;

  fiscal_year: number;
  project_name?: string | null;
  program_name?: string | null;

  account_rid: string;

  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;

  max_ai_interaction: number;
  expiry_duration?: number | null;
  auto_access_rd?: boolean;

  project_status?: string;
  project_startdate?: Date | null;
  project_enddate?: Date | null;

  project_type: "Fixed" | "Time & Material";

  project_client_group?: string | null;
  project_group?: string | null;

  project_classification_rid?: string | null;
  project_classification_other?: string | null;

  auto_send_ai_interaction: boolean;

  total_fte_prj?: number | null;
  total_fte_from_prj_res?: number | null;
  total_fte_from_tasks?: number | null;

  total_subcon_prj?: number | null;
  total_subcon_from_prj_res?: number | null;
  total_subcon_from_tasks?: number | null;

  total_nonlabor_prj?: number | null;
  total_nonlabor_from_prj_res?: number | null;

  total_resources_prj?: number | null;
  total_resources_from_prj_res?: number | null;
  total_resources_from_tasks?: number | null;

  total_effort_prj?: number | null;

  total_effort_fte_prj?: number | null;
  total_effort_subcon_prj?: number | null;

  total_effort_from_prj_res?: number | null;
  total_effort_fte_from_prj_res?: number | null;
  total_effort_subcon_from_prj_res?: number | null;

  total_effort_from_tasks?: number | null;
  total_effort_fte_from_tasks?: number | null;
  total_effort_subcon_from_tasks?: number | null;

  total_cost_prj?: number | null;
  total_cost_fte_prj?: number | null;
  total_cost_subcon_prj?: number | null;
  total_cost_nonlabor_prj?: number | null;

  total_cost_fte_from_prj_res?: number | null;
  total_cost_subcon_from_prj_res?: number | null;
  total_cost_nonlabor_from_prj_res?: number | null;
  total_cost_from_prj_res?: number | null;

  total_cost_fte_from_tasks?: number | null;
  total_cost_subcon_from_tasks?: number | null;
  total_cost_from_tasks?: number | null;

  total_cost_prj_blended?: number | null;
  total_cost_fte_prj_blended?: number | null;
  total_cost_subcon_prj_blended?: number | null;

  total_cost_from_prj_res_blended?: number | null;
  total_cost_fte_from_prj_res_blended?: number | null;
  total_cost_subcon_from_prj_res_blended?: number | null;

  total_cost_from_tasks_blended?: number | null;
  total_cost_fte_from_tasks_blended?: number | null;
  total_cost_subcon_from_tasks_blended?: number | null;

  blended_rate_fte?: number | null;
  blended_rate_subcon?: number | null;

  rd_percent_potential_ai?: number | null;
  rd_percent_adjustment?: number | null;
  rd_percent_final?: number | null;

  qre_fte?: number | null;
  qre_subcon?: number | null;
  qre_nonlabor?: number | null;
  qre_final?: number | null;

  rd_credits_fte_fed_level?: number | null;
  rd_credits_subcon_fed_level?: number | null;
  rd_credits_nonlabor_fed_level?: number | null;
  rd_credits_fed_level?: number | null;
  rd_credits_total?: number | null;

  interaction_cc_list?: string | null;
  assessment_status?: string | null;
  claim_status?: string | null;

  comments?: string | null;
  project_description?: string | null;

  project_point_of_contact?: string | null;
  technical_point_of_contact?: string | null;
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
  public rid!: string;
  public r_number?: string;
  public project_rid!: string;
  public project_fiscal_rid!: string;
  public eid?: string;

  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by!: string;
  public modified_by?: string;

  public project_code!: string;

  public industry_rid!: string;
  public industry_name?: string;

  public fiscal_year!: number;
  public project_name?: string;
  public program_name?: string | null;

  public project_type!: "Fixed" | "Time & Material";
  public project_classification_rid?: string | null;
  public project_classification_other?: string | null;

  public project_client_group?: string | null;
  public project_group?: string | null;

  public auto_send_ai_interaction!: boolean;

  public account_rid!: string;

  public country_rid?: string | null;
  public region_rid?: string | null;
  public currency_rid?: string | null;

  public max_ai_interaction!: number;
  public expiry_duration?: number | null;
  public auto_access_rd?: boolean;

  public project_status?: string;
  public project_startdate?: Date | null;
  public project_enddate?: Date | null;

  public total_fte_prj?: number | null;
  public total_fte_from_prj_res?: number | null;
  public total_fte_from_tasks?: number | null;

  public total_subcon_prj?: number | null;
  public total_subcon_from_prj_res?: number | null;
  public total_subcon_from_tasks?: number | null;

  public total_nonlabor_prj?: number | null;
  public total_nonlabor_from_prj_res?: number | null;

  public total_resources_prj?: number | null;
  public total_resources_from_prj_res?: number | null;
  public total_resources_from_tasks?: number | null;

  public total_effort_prj?: number | null;

  public total_effort_fte_prj?: number | null;
  public total_effort_subcon_prj?: number | null;

  public total_effort_from_prj_res?: number | null;
  public total_effort_fte_from_prj_res?: number | null;
  public total_effort_subcon_from_prj_res?: number | null;

  public total_effort_from_tasks?: number | null;
  public total_effort_fte_from_tasks?: number | null;
  public total_effort_subcon_from_tasks?: number | null;

  public total_cost_prj?: number | null;
  public total_cost_fte_prj?: number | null;
  public total_cost_subcon_prj?: number | null;
  public total_cost_nonlabor_prj?: number | null;

  public total_cost_fte_from_prj_res?: number | null;
  public total_cost_subcon_from_prj_res?: number | null;
  public total_cost_nonlabor_from_prj_res?: number | null;
  public total_cost_from_prj_res?: number | null;

  public total_cost_fte_from_tasks?: number | null;
  public total_cost_subcon_from_tasks?: number | null;
  public total_cost_from_tasks?: number | null;

  public total_cost_prj_blended?: number | null;
  public total_cost_fte_prj_blended?: number | null;
  public total_cost_subcon_prj_blended?: number | null;

  public total_cost_from_prj_res_blended?: number | null;
  public total_cost_fte_from_prj_res_blended?: number | null;
  public total_cost_subcon_from_prj_res_blended?: number | null;

  public total_cost_from_tasks_blended?: number | null;
  public total_cost_fte_from_tasks_blended?: number | null;
  public total_cost_subcon_from_tasks_blended?: number | null;

  public blended_rate_fte?: number | null;
  public blended_rate_subcon?: number | null;

  public rd_percent_potential_ai?: number | null;
  public rd_percent_adjustment?: number | null;
  public rd_percent_final?: number | null;

  public qre_fte?: number | null;
  public qre_subcon?: number | null;
  public qre_nonlabor?: number | null;
  public qre_final?: number | null;

  public rd_credits_fte_fed_level?: number | null;
  public rd_credits_subcon_fed_level?: number | null;
  public rd_credits_nonlabor_fed_level?: number | null;
  public rd_credits_fed_level?: number | null;
  public rd_credits_total?: number | null;

  public interaction_cc_list?: string | null;
  public assessment_status?: string | null;
  public claim_status?: string | null;

  public project_point_of_contact?: string | null;
  public technical_point_of_contact?: string | null;

  static initialize(sequelize: Sequelize, schema: string) {
    ProjectFiscalSummary.init(
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
          defaultValue: DataTypes.NOW,
          allowNull: true,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        project_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        project_fiscal_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        eid: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        project_code: {
          type: DataTypes.STRING(120),
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
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        project_name: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        program_name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        project_type: {
          type: DataTypes.ENUM("Fixed", "Time & Material"),
          allowNull: false,
        },
        project_classification_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        project_classification_other: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        project_client_group: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        project_group: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        auto_send_ai_interaction: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
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
        max_ai_interaction: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        expiry_duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        auto_access_rd: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        project_status: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        project_startdate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        project_enddate: {
          type: DataTypes.DATE,
          allowNull: true,
        },

        // FTE & Subcon
        total_fte_prj: DataTypes.INTEGER,
        total_fte_from_prj_res: DataTypes.INTEGER,
        total_fte_from_tasks: DataTypes.INTEGER,
        total_subcon_prj: DataTypes.INTEGER,
        total_subcon_from_prj_res: DataTypes.INTEGER,
        total_subcon_from_tasks: DataTypes.INTEGER,

        // Non-labor & Resources
        total_nonlabor_prj: DataTypes.DECIMAL(18, 2),
        total_nonlabor_from_prj_res: DataTypes.DECIMAL(18, 2),
        total_resources_prj: DataTypes.INTEGER,
        total_resources_from_prj_res: DataTypes.INTEGER,
        total_resources_from_tasks: DataTypes.INTEGER,

        // Effort
        total_effort_prj: DataTypes.DECIMAL(18, 2),
        total_effort_fte_prj: DataTypes.DECIMAL(18, 2),
        total_effort_subcon_prj: DataTypes.DECIMAL(18, 2),
        total_effort_from_prj_res: DataTypes.DECIMAL(18, 2),
        total_effort_fte_from_prj_res: DataTypes.DECIMAL(18, 2),
        total_effort_subcon_from_prj_res: DataTypes.DECIMAL(18, 2),
        total_effort_from_tasks: DataTypes.DECIMAL(18, 2),
        total_effort_fte_from_tasks: DataTypes.DECIMAL(18, 2),
        total_effort_subcon_from_tasks: DataTypes.DECIMAL(18, 2),

        // Cost
        total_cost_prj: DataTypes.DECIMAL(18, 2),
        total_cost_fte_prj: DataTypes.DECIMAL(18, 2),
        total_cost_subcon_prj: DataTypes.DECIMAL(18, 2),
        total_cost_nonlabor_prj: DataTypes.DECIMAL(18, 2),
        total_cost_from_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_fte_from_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_subcon_from_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_nonlabor_from_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_from_tasks: DataTypes.DECIMAL(18, 2),
        total_cost_fte_from_tasks: DataTypes.DECIMAL(18, 2),
        total_cost_subcon_from_tasks: DataTypes.DECIMAL(18, 2),

        // Blended cost
        total_cost_prj_blended: DataTypes.DECIMAL(18, 2),
        total_cost_fte_prj_blended: DataTypes.DECIMAL(18, 2),
        total_cost_subcon_prj_blended: DataTypes.DECIMAL(18, 2),
        total_cost_from_prj_res_blended: DataTypes.DECIMAL(18, 2),
        total_cost_fte_from_prj_res_blended: DataTypes.DECIMAL(18, 2),
        total_cost_subcon_from_prj_res_blended: DataTypes.DECIMAL(18, 2),
        total_cost_from_tasks_blended: DataTypes.DECIMAL(18, 2),
        total_cost_fte_from_tasks_blended: DataTypes.DECIMAL(18, 2),
        total_cost_subcon_from_tasks_blended: DataTypes.DECIMAL(18, 2),

        blended_rate_fte: DataTypes.DECIMAL(18, 2),
        blended_rate_subcon: DataTypes.DECIMAL(18, 2),

        // R&D & QRE
        rd_percent_potential_ai: DataTypes.DECIMAL(18, 2),
        rd_percent_adjustment: DataTypes.DECIMAL(18, 2),
        rd_percent_final: DataTypes.DECIMAL(18, 2),
        qre_fte: DataTypes.DECIMAL(18, 2),
        qre_subcon: DataTypes.DECIMAL(18, 2),
        qre_nonlabor: DataTypes.DECIMAL(18, 2),
        qre_final: DataTypes.DECIMAL(18, 2),
        rd_credits_fte_fed_level: DataTypes.DECIMAL(18, 2),
        rd_credits_subcon_fed_level: DataTypes.DECIMAL(18, 2),
        rd_credits_nonlabor_fed_level: DataTypes.DECIMAL(18, 2),
        rd_credits_fed_level: DataTypes.DECIMAL(18, 2),
        rd_credits_total: DataTypes.DECIMAL(18, 2),

        // Misc
        interaction_cc_list: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        assessment_status: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        claim_status: {
          type: DataTypes.STRING,
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
        schema,
        tableName: "project_fiscal_summary",
        timestamps: false,
        underscored: true,
      }
    );

    ProjectFiscalSummary.belongsTo(ProjectSummary, {
      foreignKey: "project_rid",
      as: "project",
    });

    ProjectSummary.hasMany(ProjectFiscalSummary, {
      foreignKey: "project_rid",
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
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_FISCAL}-' || LPAD(nextval('"${schemaName}".project_fiscal_seq')::text, 10, '0')`);

    console.log("Project fiscal sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project fiscal sequence:", error);
  }
}
