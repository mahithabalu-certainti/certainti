import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
import { ProjectFiscal } from "./projectFiscal";

export interface KeyContactDetailsAttributes {
  rid?: string;
  entity_rid: string;
  entity_type: string;
  r_number?: string | null;
  key_contact_name?: string | null;
  key_contact_email?: string | null;
  key_contact_role: string | null;
  is_primary_contact: boolean;
  include_in_communication?: boolean | null;
  status_rid: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface KeyContactDetailsCreationAttributes
  extends Optional<KeyContactDetailsAttributes, "rid"> {}

export class KeyContact
  extends Model<
    KeyContactDetailsAttributes,
    KeyContactDetailsCreationAttributes
  >
  implements KeyContactDetailsAttributes
{
  public rid?: string;
  public entity_rid!: string;
  public entity_type!: string;
  public r_number?: string | null;
  public key_contact_name!: string | null;
  public key_contact_email!: string | null;
  public key_contact_role!: string | null;
  public is_primary_contact!: boolean;
  public include_in_communication?: boolean | null;
  public status_rid!:string;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize, schemaName: string) {
    KeyContact.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          allowNull: false,
          primaryKey: true,
        },
         r_number: {
          type: DataTypes.STRING(14),
          allowNull: true,
          unique: true,
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
        entity_rid: {
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
        status_rid: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "key_contact_details",
        timestamps: false,
        underscored: true,
      }
    );

    // KeyContact.belongsTo(ProjectFiscal, {
    //   foreignKey: 'entity_rid',
    //   targetKey: 'rid',
    //   as: 'project',
    // });

    return KeyContact;
  }
}

export async function setupKeyContactsSequence(sequelize: Sequelize, schemaName:string) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".key_contact_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".key_contact_details
          ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.KEY_CONTACT_DETAILS}-' || LPAD(nextval('"${schemaName}".key_contact_seq')::text, 10, '0')`);

    console.log("Key contact sequence setup complete");
  } catch (error) {
    console.error("Error setting up Key contact sequence:", error);
  }
}
