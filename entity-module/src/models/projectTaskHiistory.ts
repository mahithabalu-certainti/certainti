import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

interface ProjectTaskHistoryAttributes {
  rid?: string;
  project_task_rid: string;
  r_number?: string;
  attribute_name: string;
  old_value?: string;
  new_value: string;
  modified_by: string;
  created_by: string;
  modified_datetime?: Date;
  created_datetime?: Date;
}

interface ProjectTaskHistoryCreationAttributes
  extends Optional<ProjectTaskHistoryAttributes, "rid"> {}

export class ProjectTaskHistory
  extends Model<
    ProjectTaskHistoryAttributes,
    ProjectTaskHistoryCreationAttributes
  >
  implements ProjectTaskHistoryAttributes
{
  public rid?: string;
  public project_task_rid!: string;
  public r_number?: string;
  public attribute_name!: string;
  public old_value?: string;
  public new_value!: string;
  public modified_datetime?: Date;
  public modified_by!: string;
  public created_by!: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize, schemaName: string) {
    ProjectTaskHistory.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true,
        },
        project_task_rid: {
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
          allowNull: false,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "project_task_history",
        timestamps: false,
        underscored: true,
      }
    );
    return ProjectTaskHistory;
  }
}

export async function setupProjectTaskHistorySequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_task_history_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".project_task_history
        ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_TASK_HISTORY}-' || LPAD(nextval('"${schemaName}".project_task_history_seq')::text, 10, '0')`);

    console.log("Project sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project sequence:", error);
  }
}
