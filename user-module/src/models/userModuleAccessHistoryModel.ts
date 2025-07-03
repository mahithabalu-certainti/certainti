import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { UserModuleAccess } from "./userModuleAccessModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface UserModuleAccessHistoryAttributes {
  rid: string;
  user_module_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
  created_by?: string;
  created_datetime?: Date;
}

interface UserModuleAccessHistoryCreationAttributes extends Optional<UserModuleAccessHistoryAttributes, "rid"> {}

export class UserModuleAccessHistory
  extends Model<UserModuleAccessHistoryAttributes, UserModuleAccessHistoryCreationAttributes>
  implements UserModuleAccessHistoryAttributes
{
  public rid!: string;
  public user_module_access_rid!: string;
  public attribute_name!: string;
  public old_value!: string;
  public new_value!: string;
  public modified_by?: string;
  public modified_datetime?: Date;
  public created_by?: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    UserModuleAccessHistory.init(
      {
        rid: { 
          type: DataTypes.STRING(50), 
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true 
        },
        created_by: { 
          type: DataTypes.STRING,
          allowNull: true 
        },
        created_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false,
          defaultValue: DataTypes.NOW  
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
        user_module_access_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: {
            tableName : "user_module_access",
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
        modelName: "UserModuleAccessHistory",
        tableName: "user_module_access_history",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );

    // Define association with UserModuleAccess model
    UserModuleAccessHistory.belongsTo(UserModuleAccess, { 
      foreignKey: "user_module_access_rid", 
      as: "user_module_access" 
    });
  }
}