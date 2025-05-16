import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ProfilePermissionAccess } from "./profilePermissionAccessModel";

interface ProfilePermissionAccessHistoryAttributes {
  rid: string;
  profile_permission_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
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

  static initialize(sequelize: Sequelize) {
    ProfilePermissionAccessHistory.init(
      {
        rid: { 
          type: DataTypes.UUID, 
          defaultValue: DataTypes.UUIDV4, 
          primaryKey: true 
        },
        profile_permission_access_rid: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "profile_permission_access", key: "rid" },
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
        modelName: "ProfilePermissionAccessHistory",
        tableName: "profile_permission_access_history",
        timestamps: false,
      }
    );

    // Define association with ProfilePermissionAccess model
    ProfilePermissionAccessHistory.belongsTo(ProfilePermissionAccess, { 
      foreignKey: "profile_permission_access_rid", 
      as: "profile_permission_access" 
    });
  }
}