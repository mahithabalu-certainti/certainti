import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CaseKeyContactDetailsAttributes {
  rid: string;
  r_number?: string | null;
  created_by?: string | null;
  modified_by?: string | null;
  created_datetime?: Date;
  modified_datetime?: Date;
  key_contact_rid: string;
  case_project_rid: string;
  case_rid: string;
  entity_rid: string;
  account_rid: string;
  entity_type: string;
  key_contact_name?: string | null;
  key_contact_email?: string | null;
  key_contact_role?: string | null;
  is_primary_contact?: boolean | null;
  include_in_communication?: boolean | null;
  interaction_cc_recipient?: boolean | null;
  status_rid?: string | null;

}

export interface CaseKeyContactDetailsCreationAttributes
  extends Optional<CaseKeyContactDetailsAttributes, "rid"> { }

export class CaseKeyContactDetails
  extends Model<CaseKeyContactDetailsAttributes, CaseKeyContactDetailsCreationAttributes>
  implements CaseKeyContactDetailsAttributes {
  public rid!: string;
  public r_number?: string | null;
  public created_by?: string | null;
  public modified_by?: string | null;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public key_contact_rid!: string;
  public case_project_rid!: string;
  public case_rid!: string;
  public entity_rid!: string;
  public account_rid!: string;
  public entity_type!: string;
  public key_contact_name?: string | null;
  public key_contact_email?: string | null;
  public key_contact_role?: string | null;
  public is_primary_contact?: boolean | null;
  public include_in_communication?: boolean | null;
  public interaction_cc_recipient?: boolean | null;
  public status_rid?: string | null;


  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CaseKeyContactDetails.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
        },
        r_number: {
          type: DataTypes.STRING(30),
          allowNull: true,
          unique: false, // not specified as unique in DDL
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        key_contact_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        case_project_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        case_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        entity_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        entity_type: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        key_contact_name: {
          type: DataTypes.STRING(128),
          allowNull: true,
        },
        key_contact_email: {
          type: DataTypes.STRING(125),
          allowNull: true,
        },
        key_contact_role: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        is_primary_contact: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        include_in_communication: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        interaction_cc_recipient: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        status_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },

      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_key_contact_details",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

export async function setupCaseKeyContactSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {

    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".case_key_contact_seq START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1`
    );

    await sequelize.query(`
      ALTER TABLE "${schemaName}".case_key_contact_details
      ALTER COLUMN r_number SET DEFAULT 'CKEY-' || LPAD(nextval('"${schemaName}".case_key_contact_seq')::text, 10, '0')
    `);

    logMessage("CaseKeyContactDetails sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up CaseKeyContactDetails sequence: ${error}`);
  }
}
