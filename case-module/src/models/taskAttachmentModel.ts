import { DataTypes, Model, Optional, Sequelize } from "sequelize"
import { ENV_PREFIX } from "../utils/constants"
import { logMessage } from "../utils/helpers"

interface TaskAttachmentsAttributes {
    rid : string
    r_number? : string
    created_by : string
    created_datetime : Date
    modified_by? : string
    modified_datetime? : Date
    account_rid : string
    case_rid : string
    task_rid : string
    browse_file : string
    document_name : string
    format : string
    size : string
    is_file_deleted : boolean
    comments_rid? : string
}

export interface TaskAttachmentsCreationAttributes 
extends Optional<TaskAttachmentsAttributes , "rid"> {}

export class TaskAttachments 
extends Model<TaskAttachmentsAttributes, TaskAttachmentsCreationAttributes>
implements TaskAttachmentsAttributes {
    public rid! : string
    public r_number? : string
    public created_by! : string
    public created_datetime! : Date
    public modified_by? : string
    public modified_datetime? : Date
    public account_rid! : string
    public case_rid! : string
    public task_rid! : string
    public browse_file! : string
    public document_name! : string
    public format! : string
    public size! : string
    public is_file_deleted! : boolean
    public comments_rid? : string

    static initialise (sequelize : Sequelize, schemaName : string) {
        return TaskAttachments.init({
            rid : {
                type : DataTypes.STRING(50),
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
            browse_file : {
                type : DataTypes.STRING(2000),
                allowNull : true
            },
            size : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            document_name : {
                type : DataTypes.STRING(64),
                allowNull : true
            },
            format : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            is_file_deleted : {
                type : DataTypes.BOOLEAN,
                allowNull : true,
                defaultValue : false
            },
            comments_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            }
        }, {
            sequelize,
            schema : schemaName,
            tableName : "task_attachments",
            timestamps : false,
            underscored : true
        })
    }
}

export async function setupTaskAttachmentsSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".task_attachments_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".task_attachments
      ALTER COLUMN r_number SET DEFAULT 'TATT-' || LPAD(nextval('"${schemaName}".task_attachments_seq')::text, 10, '0')`);

    logMessage("Task Attachments sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up Task Attachments sequence: ${error}`);
  }
}