import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

interface SchedulerTaskExecutionsAttributes {
  rid: string;
  execution_rid: string;
  task_name: string;
  started_at?: Date;
  completed_at?: Date | null;
  status: string;
  error_message?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

type SchedulerTaskExecutionsCreationAttributes = Optional<
  SchedulerTaskExecutionsAttributes,
  "rid"
>;

export class SchedulerTaskExecutions
  extends Model<
    SchedulerTaskExecutionsAttributes,
    SchedulerTaskExecutionsCreationAttributes
  >
  implements SchedulerTaskExecutionsAttributes
{
  public rid!: string;
  public execution_rid!: string;
  public task_name!: string;
  public started_at?: Date;
  public completed_at?: Date | null;
  public status!: string;
  public error_message?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return SchedulerTaskExecutions.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        execution_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        task_name: { type: DataTypes.STRING(100), allowNull: false },
        started_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
        completed_at: { type: DataTypes.DATE, allowNull: true },
        status: {
          type: DataTypes.ENUM("running", "success", "failed"),
          allowNull: false,
        },
        error_message: { type: DataTypes.TEXT, allowNull: true },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
        tableName: "scheduler_task_executions",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
