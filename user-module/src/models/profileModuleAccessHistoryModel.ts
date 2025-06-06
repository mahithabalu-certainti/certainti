import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ProfileModuleAccess } from "./profileModuleAccessModel";

interface ProfileModuleAccessHistoryAttributes {
  rid: string;
  profile_module_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
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

  static initialize(sequelize: Sequelize) {
    ProfileModuleAccessHistory.init(
      {
        rid: { 
          type: DataTypes.UUID, 
          defaultValue: DataTypes.UUIDV4, 
          primaryKey: true 
        },
        profile_module_access_rid: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "profile_module_access", key: "rid" },
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
        modelName: "ProfileModuleAccessHistory",
        tableName: "profile_module_access_history",
        timestamps: false,
      }
    );

    // Define association with ProfileModuleAccess model
    ProfileModuleAccessHistory.belongsTo(ProfileModuleAccess, { 
      foreignKey: "profile_module_access_rid", 
      as: "profile_module_access" 
    });
  }
}