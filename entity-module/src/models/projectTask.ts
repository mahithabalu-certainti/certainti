import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

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
  project_fiscal_rid: string;
  project_resource_code: string;
  resource_rid: string;
  fiscal_year: number;

  start_date?: Date | null;
  end_date?: Date | null;

  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;

  total_hours_pro_task?: number | null;
  total_cost_pro_task?: number | null;

  comments?: string | null;

  status_rid : string;
}

type ProjectTaskCreationAttributes = Optional<ProjectTaskAttributes, "rid">;

export class ProjectTask
  extends Model<ProjectTaskAttributes, ProjectTaskCreationAttributes>
  implements ProjectTaskAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime!: Date;
  public modified_datetime?: Date;

  public account_rid!: string;
  public project_rid!: string;
  public project_fiscal_rid!: string;
  public project_resource_code!: string;
  public resource_rid!: string;

  public fiscal_year!: number;

  public start_date?: Date;
  public end_date?: Date;

  public country_rid?: string | null;
  public region_rid?: string | null;
  public currency_rid?: string | null;

  public total_hours_pro_task?: number;
  public total_cost_pro_task?: number;

  public comments?: string;

  public status_rid!: string;

  static initialize(sequelize: Sequelize, schema: string) {
    ProjectTask.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
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
          type: DataTypes.STRING,
          allowNull: false,
        },
        modified_by: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        project_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        project_fiscal_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        project_resource_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        resource_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        start_date: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        end_date: {
          type: DataTypes.DATE,
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
        total_hours_pro_task: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_cost_pro_task: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        comments: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        status_rid : {
          type : DataTypes.STRING(50),
          allowNull : true
        }
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
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "account",
    });

    ProjectTask.belongsTo(models.Project, {
      foreignKey: "project_rid",
      targetKey: "rid",
      as: "project_task_project",
    });

    ProjectTask.belongsTo(models.ProjectFiscal, {
      foreignKey: "project_fiscal_rid",
      targetKey: "rid",
      as: "project",
    });

    ProjectTask.belongsTo(models.ProjectResource, {
      foreignKey: "project_resource_rid",
      targetKey: "rid",
      as: "projectResource",
    });

    ProjectTask.belongsTo(models.Resources, {
      foreignKey: "resource_rid",
      targetKey: "rid",
      as: "resource",
    });
    ProjectTask.belongsTo(models.Resources, {
      foreignKey: "resource_rid",
      targetKey: "rid",
      as: "resource",
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
