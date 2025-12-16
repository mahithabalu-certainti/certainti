import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CaseProjectResourceAttributes {
  rid: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  start_date?: Date | null;
  end_date?: Date | null;
  total_hours_pro_res?: number | null;
  total_cost_pro_res?: number | null;
  project_resource_rid: string;
  case_project_rid: string;
  case_rid: string;
  account_rid?: string | null;
  currency_rid?: string | null;
  description?: string | null;
  country_rid?: string | null;
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
  status_rid?: string | null;
  salary?: number | null;
  bonus?: number | null;
  insurance?: number | null;
  deductions?: number | null;
  assigned_skill_role_type_rid?: string | null;
  project_resource_code: string;
  eid?: string | null;
  project_rid: string;
  resource_rid: string;
  qre_percent?: number | null;
  region_rid?: string | null;
  fiscal_year: number;
  project_fiscal_rid: string;
  project_resource_role?: string | null;
  net_total_cost_pro_res?: number | null;
}

export interface CaseProjectResourceCreationAttributes
  extends Optional<CaseProjectResourceAttributes, "rid"> {}

export class CaseProjectResource
  extends Model<CaseProjectResourceAttributes, CaseProjectResourceCreationAttributes>
  implements CaseProjectResourceAttributes
{
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public project_resource_rid!: string; 
  public start_date?: Date;
  public end_date?: Date;
  public total_hours_pro_res?: number;
  public total_cost_pro_res?: number;
  public case_project_rid!: string;
  public case_rid!: string;
  public account_rid?: string;
  public currency_rid?: string;
  public description?: string;
  public country_rid?: string;
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
  public status_rid?: string;
  public salary?: number;
  public bonus?: number;
  public insurance?: number;
  public deductions?: number;
  public assigned_skill_role_type_rid?: string;
  public project_resource_code!: string;
  public eid?: string;
  public project_rid!: string;
  public resource_rid!: string;
  public qre_percent?: number;
  public region_rid?: string;
  public fiscal_year!: number;
  public project_fiscal_rid!: string;
  public project_resource_role?: string;
  public net_total_cost_pro_res?: number;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CaseProjectResource.init(
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
        },
        created_by: { 
          type: DataTypes.STRING(50), 
          allowNull: false 
        },
        modified_by: { 
          type: DataTypes.STRING(50), 
          allowNull: true 
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: { 
          type: DataTypes.DATE, 
          allowNull: true 
        },
        project_resource_rid: {
          type: DataTypes.STRING(50), 
          allowNull: false
        },
        start_date: { 
          type: DataTypes.DATEONLY, 
          allowNull: true 
        },
        end_date: { 
          type: DataTypes.DATEONLY, 
          allowNull: true 
        },
        total_hours_pro_res: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        total_cost_pro_res: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        case_project_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: false 
        },
        case_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: false 
        },
        account_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: true 
        },
        currency_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: true 
        },
        description: { 
          type: DataTypes.TEXT, 
          allowNull: true 
        },
        country_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: true 
        },
        effort_project_resource_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        cost_project_resource_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        cost_project_task_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        blended_cost_project_task_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        blended_cost_project_resource_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        effort_project_task_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        total_hours_from_tasks: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        total_cost_from_tasks: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        total_cost_from_tasks_blended: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_percent_potential_ai: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_percent_adjustment: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_percent_final: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        qre_fte: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        qre_subcon: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        qre_nonlabor: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        qre_final: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_credits_fte_region_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_credits_subcon_region_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_credits_nonlabor_region_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_credits_region_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_credits_fte_fed_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_credits_subcon_fed_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_credits_nonlabor_fed_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_credits_fed_level: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        rd_credits_total: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        status_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: true 
        },
        salary: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        bonus: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        insurance: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        deductions: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
        assigned_skill_role_type_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: true 
        },
        project_resource_code: { 
          type: DataTypes.STRING(100), 
          allowNull: false, 
          defaultValue: '' 
        },
        eid: { 
          type: DataTypes.STRING(120), 
          allowNull: true 
        },
        project_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: false, 
          defaultValue: '' 
        },
        resource_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: false, 
          defaultValue: '' 
        },
        qre_percent: { 
          type: DataTypes.DECIMAL(5, 2), 
          allowNull: true 
        },
        region_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: true 
        },
        fiscal_year: { 
          type: DataTypes.INTEGER, 
          allowNull: false, 
          defaultValue: 0 
        },
        project_fiscal_rid: { 
          type: DataTypes.STRING(50), 
          allowNull: false, 
          defaultValue: 'TEMPORARY_ID' 
        },
        project_resource_role: { 
          type: DataTypes.STRING(100), 
          allowNull: true 
        },
        net_total_cost_pro_res: { 
          type: DataTypes.DECIMAL(18, 2), 
          allowNull: true 
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_project_resource",
        timestamps: false,
        underscored: true,
      }
    );
  }
}