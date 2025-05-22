import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";
import { Project } from "./project";

export interface ProjectFiscalAttributes {
  rid?: string;
  r_number?: string;
  project_rid: string;
  project_name: string;
  eid?: string;
  fiscal_year: number;
  account_rid: string;

  max_ai_interaction?: number;
  expiry_duration?: number | null;
  autosend_interaction?: boolean;
  project_status?: string;
  project_startdate?: Date | null;
  project_enddate?: Date | null;

  total_fte_prj?: number;
  total_fte_from_prj_res?: number;
  total_fte_from_tasks?: number;

  total_subcon_prj?: number;
  total_subcon_from_prj_res?: number;
  total_subcon_from_tasks?: number;

  total_nonlabor_prj?: number;
  total_nonlabor_from_prj_res?: number;

  total_resources_prj?: number;
  total_resources_from_prj_res?: number;
  total_resources_from_tasks?: number;

  total_hours_prj?: number;
  total_hours_fte_prj?: number;
  total_hours_subcon_prj?: number;
  total_hours_from_prj_res?: number;
  total_hours_fte_from_prj_res?: number;
  total_hours_subcon_from_prj_res?: number;
  total_hours_from_tasks?: number;
  total_hours_fte_from_tasks?: number;
  total_hours_subcon_from_tasks?: number;

  total_cost_prj?: number;
  total_cost_fte_prj?: number;
  total_cost_subcon_prj?: number;
  total_cost_nonlabor_prj?: number;

  total_cost_fte_from_prj_res?: number;
  total_cost_subcon_from_prj_res?: number;
  total_cost_nonlabor_from_prj_res?: number;
  total_cost_from_prj_res?: number;

  total_cost_fte_from_tasks?: number;
  total_cost_subcon_from_tasks?: number;
  total_cost_from_tasks?: number;

  total_cost_prj_blended?: number;
  total_cost_fte_prj_blended?: number;
  total_cost_subcon_prj_blended?: number;
  total_cost_from_prj_res_blended?: number;
  total_cost_fte_from_prj_res_blended?: number;
  total_cost_subcon_from_prj_res_blended?: number;
  total_cost_from_tasks_blended?: number;
  total_cost_fte_from_tasks_blended?: number;
  total_cost_subcon_from_tasks_blended?: number;

  blended_rate_fte?: string;
  blended_rate_subcon?: string;

  rd_percent_potential_ai?: number;
  rd_percent_adjustment?: number;
  rd_percent_final?: number;

  qre_fte?: number;
  qre_subcon?: number;
  qre_nonlabor?: number;
  qre_final?: number;

  rd_credits_fte_fed_level?: number;
  rd_credits_subcon_fed_level?: number;
  rd_credits_nonlabor_fed_level?: number;
  rd_credits_fed_level?: number;
  rd_credits_total?: number;

  interaction_cc_list?: string | null;
  created_by: string;
  modified_by?: string | null;
  created_datetime?: Date;
  modified_datetime?: Date;
  claim_status?: string | null;
}

interface ProjectFiscalCreationAttributes
  extends Optional<ProjectFiscalAttributes, "rid"> {}

export class ProjectFiscal
  extends Model<ProjectFiscalAttributes, ProjectFiscalCreationAttributes>
  implements ProjectFiscalAttributes
{
  public rid?: string;
  public r_number?: string;
  public project_rid!: string;
  public project_name!: string;
  public eid?: string;
  public fiscal_year!: number;
  public account_rid!: string;

  public max_ai_interaction?: number;
  public expiry_duration?: number;
  public autosend_interaction?: boolean;
  public project_status?: string;
  public project_startdate?: Date | null;
  public project_enddate?: Date | null;

  public total_fte_prj?: number;
  public total_fte_from_prj_res?: number;
  public total_fte_from_tasks?: number;

  public total_subcon_prj?: number;
  public total_subcon_from_prj_res?: number;
  public total_subcon_from_tasks?: number;

  public total_nonlabor_prj?: number;
  public total_nonlabor_from_prj_res?: number;

  public total_resources_prj?: number;
  public total_resources_from_prj_res?: number;
  public total_resources_from_tasks?: number;

  public total_hours_prj?: number;
  public total_hours_fte_prj?: number;
  public total_hours_subcon_prj?: number;
  public total_hours_from_prj_res?: number;
  public total_hours_fte_from_prj_res?: number;
  public total_hours_subcon_from_prj_res?: number;
  public total_hours_from_tasks?: number;
  public total_hours_fte_from_tasks?: number;
  public total_hours_subcon_from_tasks?: number;

  public total_cost_prj?: number;
  public total_cost_fte_prj?: number;
  public total_cost_subcon_prj?: number;
  public total_cost_nonlabor_prj?: number;

  public total_cost_fte_from_prj_res?: number;
  public total_cost_subcon_from_prj_res?: number;
  public total_cost_nonlabor_from_prj_res?: number;
  public total_cost_from_prj_res?: number;

  public total_cost_fte_from_tasks?: number;
  public total_cost_subcon_from_tasks?: number;
  public total_cost_from_tasks?: number;

  public total_cost_prj_blended?: number;
  public total_cost_fte_prj_blended?: number;
  public total_cost_subcon_prj_blended?: number;
  public total_cost_from_prj_res_blended?: number;
  public total_cost_fte_from_prj_res_blended?: number;
  public total_cost_subcon_from_prj_res_blended?: number;
  public total_cost_from_tasks_blended?: number;
  public total_cost_fte_from_tasks_blended?: number;
  public total_cost_subcon_from_tasks_blended?: number;

  public blended_rate_fte?: string;
  public blended_rate_subcon?: string;

  public rd_percent_potential_ai?: number;
  public rd_percent_adjustment?: number;
  public rd_percent_final?: number;

  public qre_fte?: number;
  public qre_subcon?: number;
  public qre_nonlabor?: number;
  public qre_final?: number;

  public rd_credits_fte_fed_level?: number;
  public rd_credits_subcon_fed_level?: number;
  public rd_credits_nonlabor_fed_level?: number;
  public rd_credits_fed_level?: number;
  public rd_credits_total?: number;

  public interaction_cc_list?: string | null;
  public created_by!: string;
  public modified_by?: string | null;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public claim_status?: string | null;

  static initialize(sequelize: Sequelize, schema: string) {
    const model = ProjectFiscal.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        project_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        project_name: {
          type: DataTypes.STRING(200),
          allowNull: false,
        },
        eid: DataTypes.UUID,
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        account_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        max_ai_interaction: DataTypes.INTEGER,
        expiry_duration: DataTypes.INTEGER,
        autosend_interaction: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        project_status: DataTypes.STRING(20),
        project_startdate: DataTypes.DATE,
        project_enddate: DataTypes.DATE,
        total_fte_prj: DataTypes.DOUBLE,
        total_fte_from_prj_res: DataTypes.DOUBLE,
        total_fte_from_tasks: DataTypes.DOUBLE,
        total_subcon_prj: DataTypes.DOUBLE,
        total_subcon_from_prj_res: DataTypes.DOUBLE,
        total_subcon_from_tasks: DataTypes.DOUBLE,
        total_nonlabor_prj: DataTypes.DECIMAL(13, 2),
        total_nonlabor_from_prj_res: DataTypes.DECIMAL(13, 2),
        total_resources_prj: DataTypes.DOUBLE,
        total_resources_from_prj_res: DataTypes.DOUBLE,
        total_resources_from_tasks: DataTypes.DOUBLE,
        total_hours_prj: DataTypes.DOUBLE,
        total_hours_fte_prj: DataTypes.DOUBLE,
        total_hours_subcon_prj: DataTypes.DOUBLE,
        total_hours_from_prj_res: DataTypes.DOUBLE,
        total_hours_fte_from_prj_res: DataTypes.DOUBLE,
        total_hours_subcon_from_prj_res: DataTypes.DOUBLE,
        total_hours_from_tasks: DataTypes.DOUBLE,
        total_hours_fte_from_tasks: DataTypes.DOUBLE,
        total_hours_subcon_from_tasks: DataTypes.DOUBLE,
        total_cost_prj: DataTypes.DECIMAL(13, 2),
        total_cost_fte_prj: DataTypes.DECIMAL(13, 2),
        total_cost_subcon_prj: DataTypes.DECIMAL(13, 2),
        total_cost_nonlabor_prj: DataTypes.DECIMAL(13, 2),
        total_cost_fte_from_prj_res: DataTypes.DECIMAL(13, 2),
        total_cost_subcon_from_prj_res: DataTypes.DECIMAL(13, 2),
        total_cost_nonlabor_from_prj_res: DataTypes.DECIMAL(13, 2),
        total_cost_from_prj_res: DataTypes.DECIMAL(13, 2),
        total_cost_fte_from_tasks: DataTypes.DECIMAL(13, 2),
        total_cost_subcon_from_tasks: DataTypes.DECIMAL(13, 2),
        total_cost_from_tasks: DataTypes.DECIMAL(13, 2),
        total_cost_prj_blended: DataTypes.DECIMAL(13, 2),
        total_cost_fte_prj_blended: DataTypes.DECIMAL(13, 2),
        total_cost_subcon_prj_blended: DataTypes.DECIMAL(13, 2),
        total_cost_from_prj_res_blended: DataTypes.DECIMAL(13, 2),
        total_cost_fte_from_prj_res_blended: DataTypes.DECIMAL(13, 2),
        total_cost_subcon_from_prj_res_blended: DataTypes.DECIMAL(13, 2),
        total_cost_from_tasks_blended: DataTypes.DECIMAL(13, 2),
        total_cost_fte_from_tasks_blended: DataTypes.DECIMAL(13, 2),
        total_cost_subcon_from_tasks_blended: DataTypes.DECIMAL(13, 2),
        blended_rate_fte: DataTypes.STRING,
        blended_rate_subcon: DataTypes.STRING,
        rd_percent_potential_ai: DataTypes.DOUBLE,
        rd_percent_adjustment: DataTypes.DOUBLE,
        rd_percent_final: DataTypes.DOUBLE,
        qre_fte: DataTypes.DECIMAL(13, 2),
        qre_subcon: DataTypes.DECIMAL(13, 2),
        qre_nonlabor: DataTypes.DECIMAL(13, 2),
        qre_final: DataTypes.DECIMAL(13, 2),
        rd_credits_fte_fed_level: DataTypes.DECIMAL(13, 2),
        rd_credits_subcon_fed_level: DataTypes.DECIMAL(13, 2),
        rd_credits_nonlabor_fed_level: DataTypes.DECIMAL(13, 2),
        rd_credits_fed_level: DataTypes.DECIMAL(13, 2),
        rd_credits_total: DataTypes.DECIMAL(13, 2),
        interaction_cc_list: DataTypes.TEXT,
        created_by: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        modified_by: DataTypes.UUID,
        created_datetime: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        claim_status: DataTypes.STRING(30),
      },
      {
        sequelize,
        schema,
        tableName: "project_fiscal",
        timestamps: false,
        underscored: true,
      }
    );

    ProjectFiscal.belongsTo(Project, {
      foreignKey: 'project_rid',
      targetKey: 'rid',
      as: 'project',
    });

    Project.hasMany(ProjectFiscal, {
      foreignKey: 'project_rid',
      sourceKey: 'rid',
      as: 'ProjectFiscal',
    });

    return model;
  }
}

export async function setupProjectFiscal(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_fiscal_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".project_fiscal
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_FISCAL} ' || LPAD(nextval('"${schemaName}".project_fiscal_seq')::text, 10, '0')`);
    
    console.log('Project fiscal sequence setup complete');
  } catch (error) {
    console.error('Error setting up Project fiscal sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
