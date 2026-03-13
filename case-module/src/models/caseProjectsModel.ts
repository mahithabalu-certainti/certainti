import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CaseProjectAttributes {
  rid: string;
  r_number?: string | null;
  eid?: string;
  created_by: string;
  modified_by?: string | null;
  created_datetime?: Date | null;
  modified_datetime?: Date | null;
  case_rid: string;
  account_rid: string;
  project_rid?: string | null;
  project_fiscal_rid?: string | null;
  project_group?: string | null;
  project_code: string;
  industry_rid?: string | null;
  industry_name?: string | null;
  fiscal_year: number | null;
  project_name?: string | null;
  program_name?: string | null;
  project_classification_rid?: string | null;
  project_classification_other?: string | null;
  project_client_group?: string | null;
  auto_send_ai_interaction: boolean | null;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  max_ai_interaction: number | null;
  expiry_duration?: number | null;
  auto_access_rd?: boolean | null;
  project_startdate?: Date | null;
  project_enddate?: Date | null;
  total_fte_prj: number | null;
  total_fte_from_prj_res: number | null;
  total_fte_from_tasks: number | null;
  total_subcon_prj: number | null;
  total_subcon_from_prj_res: number | null;
  total_subcon_from_tasks: number | null;
  total_nonlabor_prj: number | null;
  total_nonlabor_from_prj_res: number | null;
  total_resources_prj: number | null;
  total_resources_from_prj_res: number | null;
  total_resources_from_tasks: number | null;
  total_effort_prj: number | null;
  total_effort_fte_prj: number | null;
  total_effort_subcon_prj: number | null;
  total_effort_from_prj_res: number | null;
  total_effort_fte_from_prj_res: number | null;
  total_effort_subcon_from_prj_res: number | null;
  total_effort_from_tasks: number | null;
  total_effort_fte_from_tasks: number | null;
  total_effort_subcon_from_tasks: number | null;
  total_cost_prj: number | null;
  total_cost_fte_prj: number | null;
  total_cost_subcon_prj: number | null;
  total_cost_nonlabor_prj: number | null;
  total_cost_from_prj_res: number | null;
  total_cost_fte_from_prj_res: number | null;
  total_cost_subcon_from_prj_res: number | null;
  total_cost_nonlabor_from_prj_res: number | null;
  total_cost_from_tasks: number | null;
  total_cost_fte_from_tasks: number | null;
  total_cost_subcon_from_tasks: number | null;
  total_cost_prj_blended: number | null;
  total_cost_fte_prj_blended: number | null;
  total_cost_subcon_prj_blended: number | null;
  total_cost_from_prj_res_blended: number | null;
  total_cost_fte_from_prj_res_blended: number | null;
  total_cost_subcon_from_prj_res_blended: number | null;
  total_cost_from_tasks_blended: number | null;
  total_cost_fte_from_tasks_blended: number | null;
  total_cost_subcon_from_tasks_blended: number | null;
  blended_rate_fte: number | null;
  blended_rate_subcon: number | null;
  rd_percent_potential_ai: number | null;
  rd_percent_adjustment: number | null;
  rd_percent_final: number | null;
  qre_fte: number | null;
  qre_subcon: number | null;
  qre_nonlabor: number | null;
  qre_final: number | null;
  rd_credits_fte_fed_level: number | null;
  rd_credits_subcon_fed_level: number | null;
  rd_credits_nonlabor_fed_level: number | null;
  rd_credits_fed_level: number | null;
  rd_credits_total: number | null;
  interaction_cc_list?: string | null;
  assessment_status?: string | null;
  claim_status?: string | null;
  comments?: string | null;
  project_description?: string | null;
  status_rid?: string | null;
  project_type_rid?: string | null;
  effective_total_fte: number | null;
  effective_total_subcon: number | null;
  effective_total_nonlabor: number | null;
  effective_cost: number | null;
  effective_effort: number | null;
  effective_fte_cost: number | null;
  effective_fte_effort: number | null;
  effective_subcon_cost: number | null;
  effective_subcon_effort: number | null;
  effective_nonlabor_cost: number | null;
  effective_metric_type?: string | null;
  default_metric_type?: string | null;
  is_rd_claim_qualified: boolean | null;
  rd_percent_potential_ai_updated: number | null;
  total_nonlabor_from_tasks: number | null;
  is_assesed?: boolean | null;
}

export interface CaseProjectCreationAttributes
  extends Optional<CaseProjectAttributes, "rid"> { }

export class CaseProject
  extends Model<CaseProjectAttributes, CaseProjectCreationAttributes>
  implements CaseProjectAttributes {
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public case_rid!: string;
  public account_rid!: string;
  public project_rid?: string;
  public project_fiscal_rid?: string;
  public project_group?: string;
  public project_code!: string;
  public industry_rid?: string;
  public industry_name?: string;
  public fiscal_year!: number;
  public project_name?: string;
  public program_name?: string;
  public project_classification_rid?: string;
  public project_classification_other?: string;
  public project_client_group?: string;
  public auto_send_ai_interaction!: boolean;
  public country_rid?: string;
  public region_rid?: string;
  public currency_rid?: string;
  public max_ai_interaction!: number;
  public expiry_duration?: number;
  public auto_access_rd?: boolean;
  public project_startdate?: Date;
  public project_enddate?: Date;
  public total_fte_prj!: number;
  public total_fte_from_prj_res!: number;
  public total_fte_from_tasks!: number;
  public total_subcon_prj!: number;
  public total_subcon_from_prj_res!: number;
  public total_subcon_from_tasks!: number;
  public total_nonlabor_prj!: number;
  public total_nonlabor_from_prj_res!: number;
  public total_resources_prj!: number;
  public total_resources_from_prj_res!: number;
  public total_resources_from_tasks!: number;
  public total_effort_prj!: number;
  public total_effort_fte_prj!: number;
  public total_effort_subcon_prj!: number;
  public total_effort_from_prj_res!: number;
  public total_effort_fte_from_prj_res!: number;
  public total_effort_subcon_from_prj_res!: number;
  public total_effort_from_tasks!: number;
  public total_effort_fte_from_tasks!: number;
  public total_effort_subcon_from_tasks!: number;
  public total_cost_prj!: number;
  public total_cost_fte_prj!: number;
  public total_cost_subcon_prj!: number;
  public total_cost_nonlabor_prj!: number;
  public total_cost_from_prj_res!: number;
  public total_cost_fte_from_prj_res!: number;
  public total_cost_subcon_from_prj_res!: number;
  public total_cost_nonlabor_from_prj_res!: number;
  public total_cost_from_tasks!: number;
  public total_cost_fte_from_tasks!: number;
  public total_cost_subcon_from_tasks!: number;
  public total_cost_prj_blended!: number;
  public total_cost_fte_prj_blended!: number;
  public total_cost_subcon_prj_blended!: number;
  public total_cost_from_prj_res_blended!: number;
  public total_cost_fte_from_prj_res_blended!: number;
  public total_cost_subcon_from_prj_res_blended!: number;
  public total_cost_from_tasks_blended!: number;
  public total_cost_fte_from_tasks_blended!: number;
  public total_cost_subcon_from_tasks_blended!: number;
  public blended_rate_fte!: number;
  public blended_rate_subcon!: number;
  public rd_percent_potential_ai!: number;
  public rd_percent_adjustment!: number;
  public rd_percent_final!: number;
  public qre_fte!: number;
  public qre_subcon!: number;
  public qre_nonlabor!: number;
  public qre_final!: number;
  public rd_credits_fte_fed_level!: number;
  public rd_credits_subcon_fed_level!: number;
  public rd_credits_nonlabor_fed_level!: number;
  public rd_credits_fed_level!: number;
  public rd_credits_total!: number;
  public interaction_cc_list?: string;
  public assessment_status?: string;
  public claim_status?: string;
  public comments?: string;
  public project_description?: string;
  public status_rid?: string;
  public project_type_rid?: string;
  public effective_total_fte!: number;
  public effective_total_subcon!: number;
  public effective_total_nonlabor!: number;
  public effective_cost!: number;
  public effective_effort!: number;
  public effective_fte_cost!: number;
  public effective_fte_effort!: number;
  public effective_subcon_cost!: number;
  public effective_subcon_effort!: number;
  public effective_nonlabor_cost!: number;
  public is_assesed?: boolean | null;
  public effective_metric_type?: string;
  public default_metric_type?: string;
  public is_rd_claim_qualified!: boolean;
  public rd_percent_potential_ai_updated!: number;
  public total_nonlabor_from_tasks!: number;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CaseProject.init(
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
        eid: { type: DataTypes.STRING(50), allowNull: true },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        case_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            model: {
              tableName: "cases",
              schema: schemaName
            },
            key: "rid"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: true },
        project_fiscal_rid: { type: DataTypes.STRING(50), allowNull: true },
        project_group: { type: DataTypes.TEXT, allowNull: true },
        project_code: { type: DataTypes.STRING(120), allowNull: false },
        industry_rid: { type: DataTypes.STRING(50), allowNull: true },
        industry_name: { type: DataTypes.STRING(100), allowNull: true },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: false },
        project_name: { type: DataTypes.STRING(200), allowNull: true },
        program_name: { type: DataTypes.TEXT, allowNull: true },
        project_classification_rid: { type: DataTypes.STRING(50), allowNull: true },
        project_classification_other: { type: DataTypes.TEXT, allowNull: true },
        project_client_group: { type: DataTypes.TEXT, allowNull: true },
        auto_send_ai_interaction: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false
        },
        country_rid: { type: DataTypes.STRING(50), allowNull: true },
        region_rid: { type: DataTypes.STRING(50), allowNull: true },
        currency_rid: { type: DataTypes.STRING(50), allowNull: true },
        max_ai_interaction: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        expiry_duration: { type: DataTypes.INTEGER, allowNull: true },
        auto_access_rd: { type: DataTypes.BOOLEAN, allowNull: true },
        project_startdate: { type: DataTypes.DATE, allowNull: true },
        project_enddate: { type: DataTypes.DATE, allowNull: true },
        total_fte_prj: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        total_fte_from_prj_res: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        total_fte_from_tasks: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        total_subcon_prj: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        total_subcon_from_prj_res: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        total_subcon_from_tasks: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        total_nonlabor_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_nonlabor_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_resources_prj: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        total_resources_from_prj_res: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        total_resources_from_tasks: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        total_effort_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_effort_fte_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_effort_subcon_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_effort_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_effort_fte_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_effort_subcon_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_effort_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_effort_fte_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_effort_subcon_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_fte_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_subcon_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_nonlabor_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_fte_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_subcon_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_nonlabor_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_fte_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_subcon_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_prj_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_fte_prj_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_subcon_prj_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_from_prj_res_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_fte_from_prj_res_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_subcon_from_prj_res_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_from_tasks_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_fte_from_tasks_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_cost_subcon_from_tasks_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        blended_rate_fte: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        blended_rate_subcon: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        rd_percent_potential_ai: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        rd_percent_adjustment: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        rd_percent_final: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        qre_fte: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        qre_subcon: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        qre_nonlabor: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        qre_final: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        rd_credits_fte_fed_level: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        rd_credits_subcon_fed_level: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        rd_credits_nonlabor_fed_level: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        rd_credits_fed_level: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        rd_credits_total: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        interaction_cc_list: { type: DataTypes.TEXT, allowNull: true },
        assessment_status: { type: DataTypes.TEXT, allowNull: true },
        claim_status: { type: DataTypes.TEXT, allowNull: true },
        comments: { type: DataTypes.STRING(2000), allowNull: true },
        project_description: { type: DataTypes.STRING(2000), allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
        project_type_rid: { type: DataTypes.STRING(50), allowNull: true },
        effective_total_fte: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        effective_total_subcon: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        effective_total_nonlabor: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        effective_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        effective_effort: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        effective_fte_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        effective_fte_effort: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        effective_subcon_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        effective_subcon_effort: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        effective_nonlabor_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        effective_metric_type: { type: DataTypes.STRING(50), allowNull: true },
        default_metric_type: { type: DataTypes.STRING(50), allowNull: true },
        is_rd_claim_qualified: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false
        },
        rd_percent_potential_ai_updated: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          defaultValue: 0
        },
        total_nonlabor_from_tasks: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        is_assesed: {
          type: DataTypes.BOOLEAN,
          allowNull: true
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_projects",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

export async function setupCaseProjectSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".case_projects_seq 
       INCREMENT 1
       START 1
       MINVALUE 1
       MAXVALUE 9223372036854775807
       CACHE 1`
    );

    await sequelize.query(`
      ALTER TABLE "${schemaName}".case_projects
      ALTER COLUMN r_number SET DEFAULT 'CSP-' || LPAD(nextval('"${schemaName}".case_projects_seq')::text, 10, '0')
    `);

    logMessage("CaseProjects sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up CaseProjects sequence: ${error}`);
  }
}