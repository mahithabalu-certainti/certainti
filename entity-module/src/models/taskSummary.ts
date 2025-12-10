import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX , MAIN_SCHEMA_NAME} from "../utils/constants";

interface TaskSummaryAttributes {
  rid?: string;
  r_number: string;
  created_by: string;
  modified_by?: string | null;
  created_datetime: Date;
  modified_datetime?: Date | null;

  account_rid: string;
  attach_to: string;
  attachment_level: string;
  task_name: string;
  description?: string | null;
  fiscal_year: number;
  assigned_to: string;
  status_rid: string;
  priority_rid: string;
  effective_start_datetime: Date;
  effective_end_datetime: Date;
  task_rid: string;
}

type TaskSummaryCreationAttributes = Optional<TaskSummaryAttributes, "rid">;

export class TaskSummary
  extends Model<TaskSummaryAttributes, TaskSummaryCreationAttributes>
  implements TaskSummaryAttributes
{
  public rid!: string;
  public r_number!: string;
  public created_by!: string;
  public modified_by?: string | null;
  public created_datetime!: Date;
  public modified_datetime?: Date | null;

  public account_rid!: string;
  public attach_to!: string;
  public attachment_level!: string;
  public task_name!: string;
  public description?: string | null;
  public fiscal_year!: number;
  public assigned_to!: string;
  public status_rid!: string;
  public priority_rid!: string;
  public effective_start_datetime!: Date;
  public effective_end_datetime!: Date;
  public task_rid!: string;

  static initialize(sequelize: Sequelize) {
    TaskSummary.init(
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
          allowNull: false,
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
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        attach_to: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        attachment_level: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        task_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        assigned_to: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        status_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        priority_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        effective_start_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        effective_end_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        task_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "TaskSummary",
        tableName: "task_summary",
        schema: MAIN_SCHEMA_NAME,
        timestamps: false,
      }
    );

    return TaskSummary;
  }

  static associate(models: any) {
    TaskSummary.belongsTo(models.AccountDetails, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "account",
    });

    TaskSummary.belongsTo(models.Resources, {
      foreignKey: "status_rid",
      targetKey: "rid",
      as: "status",
    });

    TaskSummary.belongsTo(models.Resources, {
      foreignKey: "priority_rid",
      targetKey: "rid",
      as: "priority",
    });

    TaskSummary.belongsTo(models.Resources, {
      foreignKey: "assigned_to",
      targetKey: "rid",
      as: "assignedTo",
    });

    TaskSummary.belongsTo(models.ProjectTask, {
      foreignKey: "task_rid",
      targetKey: "rid",
      as: "task",
    });
  }
}

export async function setupTaskSummarySequence(
  sequelize: Sequelize,
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${MAIN_SCHEMA_NAME}.task_summary_seq" START 1`
    );

    await sequelize.query(`ALTER TABLE "${MAIN_SCHEMA_NAME}".task_summary
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX}-' || LPAD(nextval('"${MAIN_SCHEMA_NAME}".task_summary_seq')::text, 10, '0')`);

    console.log("Task Summary sequence setup complete");
  } catch (error) {
    console.error("Error setting up Task Summary sequence:", error);
  }
}