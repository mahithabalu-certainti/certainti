import { DataTypes, Model, Optional, Sequelize } from "sequelize"
import { ENV_PREFIX } from "../utils/constants"
import { logMessage } from "../utils/helpers"

interface TaskCommentsAttributes {
    rid : string
    r_number? : string
    created_by : string
    created_datetime : Date
    modified_by? : string
    modified_datetime? : Date
    case_rid : string
    account_rid : string
    task_rid : string
    comments : string
    is_file_deleted : boolean
}

export interface TaskCommentsCreationAttributes 
extends Optional<TaskCommentsAttributes, "rid"> {}

export class TaskComments 
extends Model<TaskCommentsAttributes, TaskCommentsCreationAttributes>
implements TaskCommentsAttributes {
    public rid! : string
    public r_number? : string
    public created_by! : string
    public created_datetime! : Date
    public modified_by? : string
    public modified_datetime? : Date
    public case_rid! : string
    public account_rid! : string
    public task_rid! : string
    public comments! : string
    public is_file_deleted! : boolean

    static initialise (sequelize : Sequelize, schemaName : string) {
        return TaskComments.init({
            rid : {
                type: DataTypes.STRING(50),
                defaultValue: Sequelize.literal(
                `'${ENV_PREFIX}' || gen_random_uuid()`
                ),
                primaryKey: true,
            },
            r_number: {
                type: DataTypes.STRING(20),
                allowNull: true,
                unique: true,
            },
            created_by : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            created_datetime : {
                type : DataTypes.DATE,
                allowNull : true
            },
            modified_by : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            modified_datetime : {
                type : DataTypes.DATE,
                allowNull : true
            },
            account_rid : {
                type : DataTypes.STRING(50),
                allowNull : true,
            },
            case_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            task_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            comments : {
                type : DataTypes.TEXT(),
                allowNull : true
            },
            is_file_deleted : {
                type : DataTypes.BOOLEAN(),
                allowNull : true
            }
        }, {
            sequelize,
            schema : schemaName,
            tableName : "task_comments",
            timestamps : false,
            underscored : true
        })
    }
}

export async function setupTaskCommentsSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".task_comments_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".task_comments
      ALTER COLUMN r_number SET DEFAULT 'TKCM-' || LPAD(nextval('"${schemaName}".task_comments_seq')::text, 10, '0')`);

    logMessage("TaskComments sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up TaskComments sequence: ${error}`);
  }
}