import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
import  AccountDetails from "./accountDetails";
import { Project } from "./project";
import { ProjectResource } from "./projectResource";
import { Resources } from "./resource";

interface ProjectTaskAttributes {
  rid?: string;
  r_number?: string;
  eid?: string | null;
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;

  account_rid: string;
  project_rid: string;
  project_resource_code: string;
  resource_rid: string;
  fiscal_year: number;

  start_date?: Date | null;
  end_date?: Date | null;

  status_rid: string | null;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;

  total_hours_pro_task?: number | null;
  total_cost_pro_task?: number | null;

  salary?: number | null;
  bonus?: number | null;
  insurance?: number | null;
  deductions?: number | null;
  comments?: string | null;

  description?: string | null;
}

type ProjectTaskCreationAttributes = Optional<ProjectTaskAttributes, "rid">;

export class ProjectTask
  extends Model<ProjectTaskAttributes, ProjectTaskCreationAttributes>
  implements ProjectTaskAttributes
{
  public rid!: string;
  public r_number!: string;
  public eid!: string | null;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime!: Date;
  public modified_datetime?: Date;

  public account_rid!: string;
  public project_rid!: string;
  public project_resource_code!: string;
  public resource_rid!: string;
  public fiscal_year!: number;

  public start_date?: Date | null;
  public end_date?: Date | null;

  public status_rid!: string | null;
  public country_rid?: string | null;
  public region_rid?: string | null;
  public currency_rid?: string | null;

  public total_hours_pro_task?: number | null;
  public total_cost_pro_task?: number | null;

  public salary?: number | null;
  public insurance?: number | null;
  public deductions?: number | null;
  public bonus?: number | null;
  public comments?: string | null;
  public description?: string | null;

  static initialize(sequelize: Sequelize, schema: string) {
    ProjectTask.init(
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
        eid: { type: DataTypes.STRING(120), allowNull: true },
        created_by: { type: DataTypes.STRING, allowNull: false },
        modified_by: { type: DataTypes.STRING },
        created_datetime: { type: DataTypes.DATE, allowNull: false },
        modified_datetime: { type: DataTypes.DATE },

        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_resource_code: { type: DataTypes.STRING(100), allowNull: false },
        resource_rid: { type: DataTypes.STRING(50), allowNull: false },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: false },

        start_date: { type: DataTypes.DATE },
        end_date: { type: DataTypes.DATE },

        status_rid: { type: DataTypes.STRING(50) },
        country_rid: { type: DataTypes.STRING(50) },
        region_rid: { type: DataTypes.STRING(50) },
        currency_rid: { type: DataTypes.STRING(50) },

        total_hours_pro_task: { type: DataTypes.DECIMAL(18, 2) },
        total_cost_pro_task: { type: DataTypes.DECIMAL(18, 2) },

        salary: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        bonus: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        insurance: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        deductions: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
        comments: { type: DataTypes.TEXT, allowNull: true},
        description: { type: DataTypes.STRING(2000), allowNull: true },
      },
      {
        sequelize,
        modelName: "ProjectTask",
        tableName: "project_task",
        schema,
        timestamps: false,
      }
    );

    return ProjectTask;
  }

  static associate(models: any) {
    ProjectTask.belongsTo(models.AccountDetails, {
      foreignKey: 'account_rid',
      targetKey: 'account_rid',
      as: 'account'
    });

    ProjectTask.belongsTo(models.Project, {
      foreignKey: 'project_rid',
      targetKey: 'rid',
      as: 'project'
    });

    ProjectTask.belongsTo(models.ProjectResource, {
      foreignKey: 'project_resource_rid',
      targetKey: 'rid',
      as: 'projectResource'
    });

    ProjectTask.belongsTo(models.Resources, {
      foreignKey: 'resource_rid',
      targetKey: 'rid',
      as: 'resource'
    });
  }
}

export async function setupProjectTaskSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_tasks_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".project_task
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_TASK}-' || LPAD(nextval('"${schemaName}".project_tasks_seq')::text, 10, '0')`);

    console.log("Project Task sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project task sequence:", error);
  }
}
