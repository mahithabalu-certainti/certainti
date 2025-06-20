import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ProfileMenuAccess } from "./profileMenuAccessModel";
import { ENV_PREFIX } from "../utils/constant";

interface ProfileMenuAccessHistoryAttributes {
  rid: string;
  profile_menu_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
  created_by?: string;
  created_datetime?: Date;
}

interface ProfileMenuAccessHistoryCreationAttributes extends Optional<ProfileMenuAccessHistoryAttributes, "rid"> {}

export class ProfileMenuAccessHistory
  extends Model<ProfileMenuAccessHistoryAttributes, ProfileMenuAccessHistoryCreationAttributes>
  implements ProfileMenuAccessHistoryAttributes
{
  public rid!: string;
  public profile_menu_access_rid!: string;
  public attribute_name!: string;
  public old_value!: string;
  public new_value!: string;
  public modified_by?: string;
  public modified_datetime?: Date;
  public created_by?: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ProfileMenuAccessHistory.init(
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
        profile_menu_access_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: "profile_menu_access", key: "rid" },
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
        modelName: "ProfileMenuAccessHistory",
        tableName: "profile_menu_access_history",
        timestamps: false,
      }
    );

    // Define association with ProfileMenuAccess model
    ProfileMenuAccessHistory.belongsTo(ProfileMenuAccess, { 
      foreignKey: "profile_menu_access_rid", 
      as: "profile_menu_access" 
    });
  }
}