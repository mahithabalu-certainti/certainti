import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { UserPermissionAccess } from "./userPermissionAccessModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface UserPermissionAccessHistoryAttributes {
  rid: string;
  user_permission_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
  created_by?: string;
  created_datetime?: Date;
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
  public created_by?: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    UserPermissionAccessHistory.init(
      {
        rid: { 
          type: DataTypes.STRING(50), 
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true 
        },
        created_by: { 
          type: DataTypes.STRING(50),
          allowNull: true 
        },
        modified_by: { 
          type: DataTypes.STRING(50),
          allowNull: true 
        },
        created_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false,
          defaultValue: DataTypes.NOW  
        },
        modified_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false,
          defaultValue: DataTypes.NOW  
        },
        user_permission_access_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: {
            tableName : "user_permission_access",
            schema : `${MAIN_SCHEMA_NAME}`
          }, key: "rid" },
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
        
      },
      {
        sequelize,
        modelName: "UserPermissionAccessHistory",
        tableName: "user_permission_access_history",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );

    // Define association with UserPermissionAccess model
    UserPermissionAccessHistory.belongsTo(UserPermissionAccess, { 
      foreignKey: "user_permission_access_rid", 
      as: "user_permission_access" 
    });
  }
}