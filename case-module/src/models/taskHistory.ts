import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { logMessage } from "../utils/helpers";

export interface TaskHistoryAttributes {
  rid?: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  task_rid: string;
  attribute_name: string;
  old_value?: string;
  new_value?: string;
}

export interface TaskHistoryCreationAttributes
  extends Optional<TaskHistoryAttributes, "rid"> {}

export class TaskHistory
  extends Model<TaskHistoryAttributes, TaskHistoryCreationAttributes>
  implements TaskHistoryAttributes
{
  public rid?: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public task_rid!: string;
  public attribute_name!: string;
  public old_value?: string;
  public new_value?: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return TaskHistory.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: {
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
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        task_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        attribute_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        old_value: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        new_value: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        }
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "task_history",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

export async function setupTaskHistorySequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".task_history_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".task_history
      ALTER COLUMN r_number SET DEFAULT 'TSH-' || LPAD(nextval('"${schemaName}".task_history_seq')::text, 10, '0')`);

    logMessage("Task history sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up Task history sequence: ${error}`);
  }
}
