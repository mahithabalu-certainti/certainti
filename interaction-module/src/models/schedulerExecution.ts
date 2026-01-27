import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

interface SchedulerExecutionsAttributes {
  rid: string;
  started_at?: Date;
  completed_at?: Date;
  status: string;
  error_message?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  scheduler_name?: string;
}

type SchedulerExecutionsCreationAttributes = Optional<
  SchedulerExecutionsAttributes,
  "rid"
>;

export class SchedulerExecutions
  extends Model<
    SchedulerExecutionsAttributes,
    SchedulerExecutionsCreationAttributes
  >
  implements SchedulerExecutionsAttributes
{
  public rid!: string;
  public started_at?: Date;
  public completed_at?: Date;
  public status!: string;
  public error_message?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public scheduler_name?: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return SchedulerExecutions.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
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
        scheduler_name: { type: DataTypes.STRING(100), allowNull: true}
      },
      {
        sequelize,
        schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
        tableName: "scheduler_executions",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
