import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { UserPermissionAccess } from "./userPermissionAccessModel";

interface UserPermissionAccessHistoryAttributes {
  rid: string;
  user_permission_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
}

interface UserPermissionAccessHistoryCreationAttributes extends Optional<UserPermissionAccessHistoryAttributes, "rid"> {}

export class UserPermissionAccessHistory
  extends Model<UserPermissionAccessHistoryAttributes, UserPermissionAccessHistoryCreationAttributes>
  implements UserPermissionAccessHistoryAttributes
{
  public rid!: string;
  public user_permission_access_rid!: string;
  public attribute_name!: string;
  public old_value!: string;
  public new_value!: string;
  public modified_by?: string;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    UserPermissionAccessHistory.init(
      {
        rid: { 
          type: DataTypes.UUID, 
          defaultValue: DataTypes.UUIDV4, 
          primaryKey: true 
        },
        user_permission_access_rid: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "user_permission_access", key: "rid" },
        },
        attribute_name: { 
          type: DataTypes.STRING, 
          allowNull: false 
        },
        old_value: { 
          type: DataTypes.TEXT, 
          allowNull: true 
        },
        new_value: { 
          type: DataTypes.TEXT, 
          allowNull: true 
        },
        modified_by: { 
          type: DataTypes.STRING,
          allowNull: true 
        },
        modified_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false,
          defaultValue: DataTypes.NOW  
        },
      },
      {
        sequelize,
        modelName: "UserPermissionAccessHistory",
        tableName: "user_permission_access_history",
        timestamps: false,
      }
    );

    // Define association with UserPermissionAccess model
    UserPermissionAccessHistory.belongsTo(UserPermissionAccess, { 
      foreignKey: "user_permission_access_rid", 
      as: "user_permission_access" 
    });
  }
}