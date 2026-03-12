import { DataTypes, Model, Optional, Sequelize } from "sequelize"
import { ENV_PREFIX } from "../utils/constants"
import { logMessage } from "../utils/helpers"

interface DossierFormAttributes {
  rid : string
  r_number? : string
  created_by : string
  modified_by? : string
  created_datetime : Date
  modified_datetime? : Date
  case_rid : string
  account_rid : string
  browse_url : string
  document_name : string
  size : string
  extension : string
  dossier_metadata? : string
  dossier_version : number
}
interface DossierFormCreationAttributes extends Optional<DossierFormAttributes, "rid"> {}

export class DossierForm extends Model<DossierFormAttributes, DossierFormCreationAttributes>
implements DossierFormAttributes {
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime! : Date;
  public modified_datetime?: Date;
  public case_rid! : string
  public account_rid! : string
  public browse_url! : string
  public document_name! : string
  public size! : string
  public extension! : string
  public dossier_metadata? : string
  public dossier_version! : number

  static initialise (sequelize : Sequelize, schemaName : string) {
    return DossierForm.init({
      rid : {
        type : DataTypes.STRING,
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
      created_by: { type: DataTypes.STRING(50), allowNull: true },
      modified_by: { type: DataTypes.STRING(50), allowNull: true },
      created_datetime: { 
        type: DataTypes.DATE, 
        allowNull: false, 
        defaultValue: DataTypes.NOW
      },
      modified_datetime: { type: DataTypes.DATE, allowNull: true },
      case_rid : { type: DataTypes.STRING(50), allowNull: true },
      account_rid: { type: DataTypes.STRING(50), allowNull: true},
      browse_url : {type : DataTypes.STRING(500), allowNull : true},
      document_name : {type : DataTypes.STRING, allowNull : true},
      size : {type : DataTypes.STRING, allowNull : true},
      extension : {type : DataTypes.STRING, allowNull : true},
      dossier_metadata : {type : DataTypes.TEXT, allowNull : true},
      dossier_version : {type : DataTypes.BIGINT, allowNull : true}
    }, {
      sequelize,
      schema : schemaName,
      tableName: "dossier_form",
      timestamps: false,
      underscored: true,
    })
  }
}

export async function setupDossierFormSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".dossier_form_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".dossier_form
      ALTER COLUMN r_number SET DEFAULT 'DOSF-' || LPAD(nextval('"${schemaName}".dossier_form_seq')::text, 10, '0')`);

    logMessage("DossierForm sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up DossierForm sequence: ${error}`);
  }
}