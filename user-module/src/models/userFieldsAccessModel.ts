import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { User } from "./userModel";
import { PermissionField } from "./permissionFieldModel";

interface UserFieldsAccessAttributes {
  rid: string;
  user_id: string;
  permission_field_id: string;
  read: boolean;
  edit: boolean;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface UserFieldsAccessCreationAttributes extends Optional<UserFieldsAccessAttributes, "rid"> {}

export class UserFieldsAccess
  extends Model<UserFieldsAccessAttributes, UserFieldsAccessCreationAttributes>
  implements UserFieldsAccessAttributes
{
  public rid!: string;
  public user_id!: string;
  public permission_field_id!: string;
  public read!: boolean;
  public edit!: boolean;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    UserFieldsAccess.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        user_id: {
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
        modelName: "UserFieldsAccess",
        tableName: "user_fields_access",
        timestamps: false,
        hooks: {
          beforeUpdate: (record) => {
            record.setDataValue("modified_datetime", new Date());
          },
        },
        indexes: [
          {
            name: 'idx_user_fields_access_user_id',
            fields: ['user_id']
          }
        ]
      }
    );

    UserFieldsAccess.belongsTo(User, { foreignKey: "user_id", as: "user" });
    UserFieldsAccess.belongsTo(PermissionField, { foreignKey: "permission_field_id", as: "permission_field" });
  }
}
