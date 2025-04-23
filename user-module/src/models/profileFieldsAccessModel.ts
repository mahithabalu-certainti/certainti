import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Profile } from "./profileModel";
import { PermissionField } from "./permissionFieldModel";

interface ProfileFieldsAccessAttributes {
  rid: string;
  profile_id: string;
  permission_field_id: string;
  read: boolean;
  edit: boolean;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface ProfileFieldsAccessCreationAttributes extends Optional<ProfileFieldsAccessAttributes, "rid"> {}

export class ProfileFieldsAccess
  extends Model<ProfileFieldsAccessAttributes, ProfileFieldsAccessCreationAttributes>
  implements ProfileFieldsAccessAttributes
{
  public rid!: string;
  public profile_id!: string;
  public permission_field_id!: string;
  public read!: boolean;
  public edit!: boolean;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ProfileFieldsAccess.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        profile_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        permission_field_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        read: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        edit: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        created_by: DataTypes.STRING,
        modified_by: DataTypes.STRING,
        created_datetime: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: "ProfileFieldsAccess",
        tableName: "profile_fields_access",
        timestamps: false,
        hooks: {
          beforeUpdate: (record) => {
            record.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );

    ProfileFieldsAccess.belongsTo(Profile, {
      foreignKey: "profile_id",
      as: "profile",
    });

    ProfileFieldsAccess.belongsTo(PermissionField, {
      foreignKey: "permission_field_id",
      as: "permission_field",
    });
  }
}
