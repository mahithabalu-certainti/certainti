
import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CaseProjectFiscalRegionAttributes {
  rid: string;
  r_number?: string | null;
  eid?: string | null;
  created_by: string;
  modified_by?: string | null;
  created_datetime?: Date | null;
  modified_datetime?: Date | null;
  project_fiscal_region_rid: string;
  case_rid: string;
  case_project_rid: string;
  project_rid: string;
  project_code: string;
  industry_rid?: string | null;
  industry_name?: string | null;
  fiscal_year: number;
  project_name?: string | null;
  program_name?: string | null;
  project_type_rid?: string | null;
  project_classification_rid?: string | null;
  project_classification_other?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  auto_send_ai_interaction: boolean;
  account_rid: string;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  max_ai_interaction: number;
  expiry_duration?: number | null;
  auto_access_rd?: boolean | null;
  status_rid: string;
  project_startdate?: Date | null;
  project_enddate?: Date | null;
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
  total_cost_from_prj_res?: number | null;
  total_cost_fte_from_prj_res?: number | null;
  total_cost_subcon_from_prj_res?: number | null;
  total_cost_nonlabor_from_prj_res?: number | null;
  total_cost_from_tasks?: number | null;
  total_cost_fte_from_tasks?: number | null;
  total_cost_subcon_from_tasks?: number | null;
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
  effective_total_fte?: number | null;
  effective_total_subcon?: number | null;
  effective_total_nonlabor?: number | null;
  effective_cost?: number | null;
  effective_effort?: number | null;
  effective_fte_cost?: number | null;
  effective_fte_effort?: number | null;
  effective_subcon_cost?: number | null;
  effective_subcon_effort?: number | null;
  effective_nonlabor_cost?: number | null;
  effective_metric_type?: string | null;
  default_metric_type?: string | null;
  interaction_cc_list?: string | null;
  assessment_status?: string | null;
  claim_status?: string | null;
  comments?: string | null;
  project_description?: string | null;
  project_fiscal_rid: string;
  total_nonlabor_from_tasks?: number | null;
  is_rd_claim_qualified? : boolean
}

export interface CaseProjectFiscalRegionCreationAttributes
  extends Optional<CaseProjectFiscalRegionAttributes, "rid"> {}

export class CaseProjectFiscalRegion
  extends Model<CaseProjectFiscalRegionAttributes, CaseProjectFiscalRegionCreationAttributes>
  implements CaseProjectFiscalRegionAttributes
{
  public rid!: string;
  public r_number?: string | null;
  public eid?: string | null;
  public created_by!: string;
  public modified_by?: string | null;
  public created_datetime?: Date | null;
  public modified_datetime?: Date | null;
  public project_fiscal_region_rid!: string;
  public case_rid!: string;
  public case_project_rid!: string;
  public project_rid!: string;
  public project_code!: string;
  public industry_rid?: string | null;
  public industry_name?: string | null;
  public fiscal_year!: number;
  public project_name?: string | null;
  public program_name?: string | null;
  public project_type_rid?: string | null;
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
  public auto_access_rd?: boolean | null;
  public status_rid!: string;
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
  public total_cost_from_prj_res?: number | null;
  public total_cost_fte_from_prj_res?: number | null;
  public total_cost_subcon_from_prj_res?: number | null;
  public total_cost_nonlabor_from_prj_res?: number | null;
  public total_cost_from_tasks?: number | null;
  public total_cost_fte_from_tasks?: number | null;
  public total_cost_subcon_from_tasks?: number | null;
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
  public effective_total_fte?: number | null;
  public effective_total_subcon?: number | null;
  public effective_total_nonlabor?: number | null;
  public effective_cost?: number | null;
  public effective_effort?: number | null;
  public effective_fte_cost?: number | null;
  public effective_fte_effort?: number | null;
  public effective_subcon_cost?: number | null;
  public effective_subcon_effort?: number | null;
  public effective_nonlabor_cost?: number | null;
  public effective_metric_type?: string | null;
  public default_metric_type?: string | null;
  public interaction_cc_list?: string | null;
  public assessment_status?: string | null;
  public claim_status?: string | null;
  public comments?: string | null;
  public project_description?: string | null;
  public project_fiscal_rid!: string;
  public total_nonlabor_from_tasks?: number | null;
  public is_rd_claim_qualified? : boolean

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CaseProjectFiscalRegion.init(
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
          allowNull: true,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        project_fiscal_region_rid: {
          type: DataTypes.STRING(50),
          allowNull: false, 
        },
        case_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        case_project_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        project_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
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
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        project_type_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        project_classification_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        project_classification_other: {
          type: DataTypes.STRING(255),
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
        status_rid: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        project_startdate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        project_enddate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        total_fte_prj: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_fte_from_prj_res: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_fte_from_tasks: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_subcon_prj: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_subcon_from_prj_res: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_subcon_from_tasks: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_nonlabor_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_nonlabor_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_resources_prj: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_resources_from_prj_res: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_resources_from_tasks: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_effort_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_effort_fte_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_effort_subcon_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_effort_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_effort_fte_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_effort_subcon_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_effort_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_effort_fte_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_effort_subcon_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_fte_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_subcon_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_nonlabor_prj: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_fte_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_subcon_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_nonlabor_from_prj_res: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_fte_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_subcon_from_tasks: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_prj_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_fte_prj_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_subcon_prj_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_from_prj_res_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_fte_from_prj_res_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_subcon_from_prj_res_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_from_tasks_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_fte_from_tasks_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_subcon_from_tasks_blended: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        blended_rate_fte: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        blended_rate_subcon: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        rd_percent_potential_ai: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        rd_percent_adjustment: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        rd_percent_final: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qre_fte: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qre_subcon: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qre_nonlabor: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qre_final: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        rd_credits_fte_fed_level: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        rd_credits_subcon_fed_level: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        rd_credits_nonlabor_fed_level: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        rd_credits_fed_level: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        rd_credits_total: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        effective_total_fte: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        effective_total_subcon: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        effective_total_nonlabor: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        effective_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        effective_effort: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        effective_fte_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        effective_fte_effort: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        effective_subcon_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        effective_subcon_effort: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        effective_nonlabor_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        effective_metric_type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        default_metric_type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        interaction_cc_list: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        assessment_status: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        claim_status: {
          type: DataTypes.STRING(255),
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
        project_fiscal_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'TEMPORARY_ID',
        },
        total_nonlabor_from_tasks: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        is_rd_claim_qualified : {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        }
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_project_fiscal_region",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

export async function setupCaseProjectFiscalRegionSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".case_project_fiscal_region_seq INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1`
    );

    await sequelize.query(`
      ALTER TABLE "${schemaName}".case_project_fiscal_region
      ALTER COLUMN r_number SET DEFAULT 'CPFIR-' || LPAD(nextval('"${schemaName}".case_project_fiscal_region_seq')::text, 10, '0')
    `);

    logMessage("CaseProjectFiscalRegion sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up CaseProjectFiscalRegion sequence: ${error}`);
  }
}