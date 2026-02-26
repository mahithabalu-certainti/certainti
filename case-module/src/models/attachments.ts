import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { MAIN_SCHEMA_NAME, ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
import { DocumentCategory } from "./documentCategory";
import { DocumentType } from "./documentType";

export interface AttachmentAttributes {
  rid: string;
  r_number?: string;
  created_datetime: Date;
  created_by: string;
  modified_datetime?: Date;
  modified_by?: string | null;
  browse_file: string;
  document_name: string;
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  fiscal_year: number;
  format: string;
  size_in_mb: number;
  document_category_rid: string;
  document_type_rid: string;
  document_category_others?: string | null;
  document_type_others?: string | null;
  comments?: string | null;
}

export interface AttachmentCreationAttributes 
  extends Optional<AttachmentAttributes, "rid" | "r_number" | "created_datetime" | "modified_datetime"> {}

export class Attachment
  extends Model<AttachmentAttributes, AttachmentCreationAttributes>
  implements AttachmentAttributes
{
  public rid!: string;
  public r_number?: string;
  public created_datetime!: Date;
  public created_by!: string;
  public modified_datetime?: Date;
  public modified_by?: string | null;
  public browse_file!: string;
  public account_rid!: string;
  public document_name!: string;
  public attach_to!: string;
  public attachment_level!: string;
  public fiscal_year!: number;
  public format!: string;
  public size_in_mb!: number;
  public document_category_rid!: string;
  public document_type_rid!: string;
  public document_category_others?: string | null;
  public document_type_others?: string | null;
  public comments?: string | null;

  static initialize(sequelize: Sequelize, schemaName: string ) {
    Attachment.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        browse_file: {
          type: DataTypes.STRING(1000),
          allowNull: false,
        },
        document_name: {
          type: DataTypes.STRING(100),
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
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        format: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
        size_in_mb: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        document_category_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        document_type_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        document_category_others: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        document_type_others: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        comments: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Attachment",
        tableName: "attachments",
        timestamps: false, // We're managing created/modified dates manually
        schema: schemaName,
      }
    );

    return Attachment;
  }
}

export async function setupAttachmentSeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".attachment_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".attachments
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.ATTACHMENT}-' || LPAD(nextval('"${schemaName}".attachment_seq')::text, 10, '0')`);
    
    console.log('Attachment sequence setup complete');
  } catch (error) {
    console.error('Error setting up attachment sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}