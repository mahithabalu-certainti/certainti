import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ProfileModuleAccess } from "./profileModuleAccessModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface ProfileModuleAccessHistoryAttributes {
  rid: string;
  profile_module_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
  created_by?: string;
  created_datetime?: Date;
}

interface ProfileModuleAccessHistoryCreationAttributes extends Optional<ProfileModuleAccessHistoryAttributes, "rid"> {}

export class ProfileModuleAccessHistory
  extends Model<ProfileModuleAccessHistoryAttributes, ProfileModuleAccessHistoryCreationAttributes>
  implements ProfileModuleAccessHistoryAttributes
{
  public rid!: string;
  public profile_module_access_rid!: string;
  public attribute_name!: string;
  public old_value!: string;
  public new_value!: string;
  public modified_by?: string;
  public modified_datetime?: Date;
  public created_by?: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ProfileModuleAccessHistory.init(
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
        profile_module_access_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: {
            tableName : "profile_module_access",
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
        modelName: "ProfileModuleAccessHistory",
        tableName: "profile_module_access_history",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );

    // Define association with ProfileModuleAccess model
    ProfileModuleAccessHistory.belongsTo(ProfileModuleAccess, { 
      foreignKey: "profile_module_access_rid", 
      as: "profile_module_access" 
    });
  }
}