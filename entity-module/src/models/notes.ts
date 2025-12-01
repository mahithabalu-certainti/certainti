import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { MAIN_SCHEMA_NAME, ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
import { DocumentCategory } from "./documentCategory";
import { DocumentType } from "./documentType";

interface NotesAttributes {
  rid: string;
  r_number?: string;
  created_datetime: Date;
  created_by: string;
  modified_datetime?: Date;
  modified_by?: string | null;
  browse_file: string | null;
  document_name: string | null;
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  fiscal_year: number;
  format: string | null;
  size_in_mb: number | null;
  title : string;
  notes_owner : string;
  descriptions?: string | null;
}

interface NotesCreationAttributes 
  extends Optional<NotesAttributes, "rid" | "r_number" | "created_datetime" | "modified_datetime"> {}

export class Notes
  extends Model<NotesAttributes, NotesCreationAttributes>
  implements NotesAttributes
{
  public rid!: string;
  public r_number?: string;
  public created_datetime!: Date;
  public created_by!: string;
  public modified_datetime?: Date;
  public modified_by?: string | null;
  public browse_file!: string | null;
  public account_rid!: string;
  public document_name!: string | null;;
  public attach_to!: string;
  public attachment_level!: string;
  public fiscal_year!: number;
  public format!: string | null;;
  public size_in_mb!: number | null;;
  public title!: string;
  public notes_owner!: string;
  public descriptions?: string | null;

  static initialize(sequelize: Sequelize, schemaName: string ) {
    Notes.init(
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
          allowNull: true,
        },
        document_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
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
          allowNull: true,
        },
        size_in_mb: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        title: {
          type: DataTypes.STRING(64),
          allowNull: false,
        },
        notes_owner: {
          type: DataTypes.STRING(64),
          allowNull: false,
        },
        descriptions : {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Notes",
        tableName: "notes",
        timestamps: false, // We're managing created/modified dates manually
        schema: schemaName,
      }
    );

    return Notes;
  }
}

export async function setupNotesSeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".notes_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".notes
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.NOTES}-' || LPAD(nextval('"${schemaName}".notes_seq')::text, 10, '0')`);
    
    console.log('Notes sequence setup complete');
  } catch (error) {
    console.error('Error setting up notes sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}