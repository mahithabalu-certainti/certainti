import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

interface TaskSummaryAttributes {
  rid: string;
  r_number: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
    task_rid: string;
  attach_to: string;
  attachment_level: string;
  task_name: string;
  description?: string;
  fiscal_year: number;
  assigned_to: string;
  status_rid: string;
  priority_rid: string;
  effective_start_datetime: Date;
  effective_end_datetime: Date;
}

export interface TaskSummaryCreationAttributes
  extends Optional<TaskSummaryAttributes, "rid"> {}

export class TaskSummary
  extends Model<TaskSummaryAttributes, TaskSummaryCreationAttributes>
  implements TaskSummaryAttributes
{
  public rid!: string;
  public r_number!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
    public task_rid!: string;
  public attach_to!: string;
  public attachment_level!: string;
  public task_name!: string;
  public description?: string;
  public fiscal_year!: number;
  public assigned_to!: string;
  public status_rid!: string;
  public priority_rid!: string;
  public effective_start_datetime!: Date;
  public effective_end_datetime!: Date;


  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return TaskSummary.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'D001-' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: { type: DataTypes.STRING(20), allowNull: false },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        task_rid: { type: DataTypes.STRING(50), allowNull: false },
        attach_to: { type: DataTypes.STRING(50), allowNull: false },
        attachment_level: { type: DataTypes.STRING(50), allowNull: false },
        task_name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.STRING(2000), allowNull: true },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: false },
        assigned_to: { type: DataTypes.STRING(50), allowNull: false },
        status_rid: { type: DataTypes.STRING(50), allowNull: false },
        priority_rid: { type: DataTypes.STRING(50), allowNull: false },
        effective_start_datetime: { type: DataTypes.DATE, allowNull: false },
        effective_end_datetime: { type: DataTypes.DATE, allowNull: false },
      },
      {
        sequelize,
        schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
        tableName: "task_summary",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
