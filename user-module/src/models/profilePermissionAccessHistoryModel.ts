import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ProfilePermissionAccess } from "./profilePermissionAccessModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface ProfilePermissionAccessHistoryAttributes {
  rid: string;
  profile_permission_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
  created_by?: string;
  created_datetime?: Date;
}

interface ProfilePermissionAccessHistoryCreationAttributes extends Optional<ProfilePermissionAccessHistoryAttributes, "rid"> {}

export class ProfilePermissionAccessHistory
  extends Model<ProfilePermissionAccessHistoryAttributes, ProfilePermissionAccessHistoryCreationAttributes>
  implements ProfilePermissionAccessHistoryAttributes
{
  public rid!: string;
  public profile_permission_access_rid!: string;
  public attribute_name!: string;
  public old_value!: string;
  public new_value!: string;
  public modified_by?: string;
  public modified_datetime?: Date;
  public created_by?: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ProfilePermissionAccessHistory.init(
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
        profile_permission_access_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: {
            tableName : "profile_permission_access",
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
        modelName: "ProfilePermissionAccessHistory",
        tableName: "profile_permission_access_history",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );

    // Define association with ProfilePermissionAccess model
    ProfilePermissionAccessHistory.belongsTo(ProfilePermissionAccess, { 
      foreignKey: "profile_permission_access_rid", 
      as: "profile_permission_access" 
    });
  }
}