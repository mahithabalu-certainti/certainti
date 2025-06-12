import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";
import { ProjectFiscal } from "./projectFiscal";
import { KeyContact } from "./keyContactDetails";
export interface ProjectAttributes {
  rid?: string;
  r_number?: string;
  eid?: string;
  project_code: string;
  industry_rid: string;
  industry_name?: string;
  account_rid: string;
  account_fiscal_rid?: string | null;
  program_name?: string | null;
  project_name?: string | null;

  project_startdate?: Date | null;
  project_enddate?: Date | null;
  project_type: "Fixed" | "Time & Material";
  project_classification_rid?: string | null;
  project_classification_other?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  project_status: "Active" | "Inactive";
  country?: string | null;
  region?: string | null;
  comments?: string | null;
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

  total_fte_prj_res?: number | null;
  total_subcon_prj_res?: number | null;

  total_effort_prj_res?: number | null;
  total_effort_fte_prj_res?: number | null;
  total_effort_subcon_prj_res?: number | null;

  total_cost_prj_res?: number | null;
  total_cost_fte_prj_res?: number | null;
  total_cost_subcon_prj_res?: number | null;
  total_cost_nonlabor_prj_res?: number | null;

  total_fte_prj_task?: number | null;
  total_subcon_prj_task?: number | null;

  total_effort_prj_task?: number | null;
  total_effort_fte_prj_task?: number | null;
  total_effort_subcon_prj_task?: number | null;

  total_cost_prj_task?: number | null;
  total_cost_fte_prj_task?: number | null;
  total_cost_subcon_prj_task?: number | null;
  total_cost_nonlabor_prj_task?: number | null;

  qre_potential?: number | null;
  qre_adjustment?: number | null;
  qre_final?: number | null;
  qre_cost_total?: number | null;
  qre_cost_fte?: number | null;
  qre_cost_subcon?: number | null;
  qre_cost_nonlabor?: number | null;

  rd_credits_total?: number | null;
  rd_credits_fte?: number | null;
  rd_credits_subcon?: number | null;
  rd_credits_nonlabor?: number | null;

  auto_send_ai_interaction: boolean;
  auto_access_rd?: boolean;
  max_ai_interaction: number;

  blended_rate_fte?: number | null;
  blended_rate_subcon?: number | null;
  blended_rate?: number | null;

  assessment_status?: string | null;

  created_datetime?: Date;
  modified_datetime?: Date;
  created_by: string;
  modified_by?: string | null;
}

interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, "rid"> {}

export class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public rid?: string;
  public r_number?: string;
  public eid?: string;
  public project_code!: string;
  public industry_rid!: string;
  public industry_name?: string;
  public account_rid!: string;
  public account_fiscal_rid?: string | null;
  public program_name?: string | null;
  public project_name?: string | null;

  public project_startdate?: Date | null;
  public project_enddate?: Date | null;
  public project_type!: "Fixed" | "Time & Material";
  public project_classification_rid?: string | null;
  public project_classification_other?: string | null;
  public project_client_group?: string | null;
  public project_group?: string | null;
  public project_status!: "Active" | "Inactive";
  public country?: string | null;
  public region?: string | null;
  public comments?: string | null;
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

  public total_fte_prj_res?: number | null;
  public total_subcon_prj_res?: number | null;

  public total_effort_prj_res?: number | null;
  public total_effort_fte_prj_res?: number | null;
  public total_effort_subcon_prj_res?: number | null;

  public total_cost_prj_res?: number | null;
  public total_cost_fte_prj_res?: number | null;
  public total_cost_subcon_prj_res?: number | null;
  public total_cost_nonlabor_prj_res?: number | null;

  public total_fte_prj_task?: number | null;
  public total_subcon_prj_task?: number | null;

  public total_effort_prj_task?: number | null;
  public total_effort_fte_prj_task?: number | null;
  public total_effort_subcon_prj_task?: number | null;

  public total_cost_prj_task?: number | null;
  public total_cost_fte_prj_task?: number | null;
  public total_cost_subcon_prj_task?: number | null;
  public total_cost_nonlabor_prj_task?: number | null;

  public qre_potential?: number | null;
  public qre_adjustment?: number | null;
  public qre_final?: number | null;
  public qre_cost_total?: number | null;
  public qre_cost_fte?: number | null;
  public qre_cost_subcon?: number | null;
  public qre_cost_nonlabor?: number | null;

  public rd_credits_total?: number | null;
  public rd_credits_fte?: number | null;
  public rd_credits_subcon?: number | null;
  public rd_credits_nonlabor?: number | null;

  public auto_send_ai_interaction!: boolean;
  public auto_access_rd?: boolean;
  public max_ai_interaction!: number;

  public blended_rate_fte?: number | null;
  public blended_rate_subcon?: number | null;
  public blended_rate?: number | null;

  public assessment_status?: string | null;

  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by!: string;
  public modified_by?: string | null;

  static initialize(sequelize: Sequelize, schemaName: string) {
    const model = Project.init(
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
        eid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        project_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        industry_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        industry_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        account_fiscal_rid: {
          type: DataTypes.UUID,
          allowNull: true,
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
        project_type: {
          type: DataTypes.ENUM("Fixed", "Time & Material"),
          allowNull: false,
        },
        project_classification_rid: {
          type: DataTypes.UUID,
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
        project_status: {
          type: DataTypes.ENUM("Active", "Inactive"),
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
        comments: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },

        assessment_status: {
          type: DataTypes.STRING(150),
          allowNull: true
        },

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
        total_effort_fte_prj_res: DataTypes.DECIMAL(18, 2),
        total_effort_subcon_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_fte_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_subcon_prj_res: DataTypes.DECIMAL(18, 2),
        total_cost_nonlabor_prj_res: DataTypes.DECIMAL(18, 2),

        total_fte_prj_task: DataTypes.INTEGER,
        total_subcon_prj_task: DataTypes.INTEGER,
        total_effort_prj_task: DataTypes.DECIMAL(18, 2),
        total_effort_fte_prj_task: DataTypes.DECIMAL(18, 2),
        total_effort_subcon_prj_task: DataTypes.DECIMAL(18, 2),
        total_cost_prj_task: DataTypes.DECIMAL(18, 2),
        total_cost_fte_prj_task: DataTypes.DECIMAL(18, 2),
        total_cost_subcon_prj_task: DataTypes.DECIMAL(18, 2),
        total_cost_nonlabor_prj_task: DataTypes.DECIMAL(18, 2),

        qre_potential: DataTypes.DECIMAL(18, 2),
        qre_adjustment: DataTypes.DECIMAL(18, 2),
        qre_final: DataTypes.DECIMAL(18, 2),
        qre_cost_total: DataTypes.DECIMAL(18, 2),
        qre_cost_fte: DataTypes.DECIMAL(18, 2),
        qre_cost_subcon: DataTypes.DECIMAL(18, 2),
        qre_cost_nonlabor: DataTypes.DECIMAL(18, 2),

        rd_credits_total: DataTypes.DECIMAL(18, 2),
        rd_credits_fte: DataTypes.DECIMAL(18, 2),
        rd_credits_subcon: DataTypes.DECIMAL(18, 2),
        rd_credits_nonlabor: DataTypes.DECIMAL(18, 2),

        auto_send_ai_interaction: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        auto_access_rd: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        max_ai_interaction: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        blended_rate_fte: DataTypes.DECIMAL(18, 2),
        blended_rate_subcon: DataTypes.DECIMAL(18, 2),
        blended_rate: DataTypes.DECIMAL(18, 2),

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
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "project",
        timestamps: false,
        underscored: true,
      }
    );

    Project.hasMany(ProjectFiscal, {
      foreignKey: 'project_rid',
      sourceKey: 'rid',
      as: 'ProjectFiscal',
    });

    // Project.hasMany(KeyContact, {
    //   foreignKey: 'entity_rid',
    //   sourceKey: 'rid',
    //   as: 'ProjectKeyContact',
    // });

    return model;
  }
}

export async function setupProjectSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".project
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT} ' || LPAD(nextval('"${schemaName}".project_seq')::text, 10, '0')`);

    console.log("Project sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project sequence:", error);
  }
}
