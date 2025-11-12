import { DataTypes, Model, Optional, Sequelize } from "sequelize"
import { ENV_PREFIX } from "../utils/constants"
import { logMessage } from "../utils/helpers"

interface CommentsAttachmentsAttributes {
    rid : string
    r_number? : string
    created_by : string
    created_datetime : Date
    modified_by? : string
    modified_datetime? : Date
    account_rid : string
    case_rid : string
    task_rid : string
    comments_rid : string
    browse_file : string
    document_name : string
    format : string
    size : string
    is_file_deleted : boolean
}

export interface CommentsAttachmentsCreationAttributes 
extends Optional<CommentsAttachmentsAttributes , "rid"> {}

export class CommentsAttachments 
extends Model<CommentsAttachmentsAttributes, CommentsAttachmentsCreationAttributes>
implements CommentsAttachmentsAttributes {
    public rid! : string
    public r_number? : string
    public created_by! : string
    public created_datetime! : Date
    public modified_by? : string
    public modified_datetime? : Date
    public account_rid! : string
    public case_rid! : string
    public task_rid! : string
    public comments_rid! : string
    public browse_file! : string
    public document_name! : string
    public format! : string
    public size! : string
    public is_file_deleted! : boolean

    static initialise (sequelize : Sequelize, schemaName : string) {
        return CommentsAttachments.init({
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
            comments_rid : {
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
            }
        }, {
            sequelize,
            schema : schemaName,
            tableName : "comments_attachments",
            timestamps : false,
            underscored : true
        })
    }
}

export async function setupCommentsAttachmentsSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".comments_attachments_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".comments_attachments
      ALTER COLUMN r_number SET DEFAULT 'CATT-' || LPAD(nextval('"${schemaName}".comments_attachments_seq')::text, 10, '0')`);

    logMessage("CommentsAttachments sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up CommentsAttachments sequence: ${error}`);
  }
}