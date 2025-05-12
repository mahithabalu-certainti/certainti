import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";

export interface KeyContactDetailsAttributes {
  rid?: string;
  account_rid?: string;
  key_contact_id?: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact?: boolean;
  include_in_communication?: boolean;
  status?: "Active" | "Inactive";
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface KeyContactDetailsCreationAttributes
  extends Optional<KeyContactDetailsAttributes, "rid"> {}

export class KeyContact
  extends Model<KeyContactDetailsAttributes, KeyContactDetailsCreationAttributes>
  implements KeyContactDetailsAttributes
{
  public rid?: string;
  public account_rid?: string;
  public key_contact_id?: string;
  public key_contact_name!: string;
  public key_contact_email!: string;
  public key_contact_role!: string;
  public is_primary_contact?: boolean;
  public include_in_communication?: boolean;
  public status!: "Active" | "Inactive";
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  

  static initialize(sequelize: Sequelize, schemaName: string) {
    return KeyContact.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        account_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },  
        key_contact_id: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        key_contact_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        key_contact_email: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        key_contact_role: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        is_primary_contact: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        include_in_communication: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(255),
          defaultValue: "active",
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        created_by: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.UUID,
          allowNull: true,
        }
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "key_contact_details",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeUpdate: (KeyContact) => {
            KeyContact.setDataValue("created_datetime", new Date());
            KeyContact.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );
  }
}
