import { DataTypes, Model, Optional, Sequelize } from "sequelize"
import { ENV_PREFIX } from "../utils/constants"
import { logMessage } from "../utils/helpers"

interface TaskTagAttributes {
    rid : string
    r_number? : string
    created_by : string
    created_datetime : Date
    modified_by? : string
    modified_datetime? : Date
    case_rid : string
    account_rid : string
    task_rid : string
    tag_rid : string
}

export interface TaskTagCreationAttributes 
extends Optional<TaskTagAttributes, "rid"> {}

export class TaskTag 
extends Model<TaskTagAttributes, TaskTagCreationAttributes>
implements TaskTagAttributes {
    public rid! : string
    public r_number? : string
    public created_by! : string
    public created_datetime! : Date
    public modified_by? : string
    public modified_datetime? : Date
    public case_rid! : string
    public account_rid! : string
    public task_rid! : string
    public tag_rid! : string

    static initialise (sequelize : Sequelize, schemaName : string) {
        return TaskTag.init({
            rid : {
                type : DataTypes.STRING(50),
                defaultValue: Sequelize.literal(
                `'${ENV_PREFIX}' || gen_random_uuid()`),
                primaryKey : true
            },
            r_number : {
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
            case_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            account_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            task_rid : {
               type : DataTypes.STRING(50),
                allowNull : true 
            },
            tag_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            }
        }, {
            sequelize,
            schema : schemaName,
            tableName : "task_tags",
            timestamps : false,
            underscored : true
        })
    }
}

export async function setupTaskTagSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".task_tags_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".task_tags
      ALTER COLUMN r_number SET DEFAULT 'TTG-' || LPAD(nextval('"${schemaName}".task_tags_seq')::text, 10, '0')`);

    logMessage("TaskTags sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up TaskTags sequence: ${error}`);
  }
}