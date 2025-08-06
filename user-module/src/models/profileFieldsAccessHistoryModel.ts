import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ProfileFieldsAccess } from "./profileFieldsAccessModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface ProfileFieldsAccessHistoryAttributes {
  rid: string;
  profile_fields_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
  created_by?: string;
  created_datetime?: Date;
}

interface ProfileFieldsAccessHistoryCreationAttributes extends Optional<ProfileFieldsAccessHistoryAttributes, "rid"> {}

export class ProfileFieldsAccessHistory
  extends Model<ProfileFieldsAccessHistoryAttributes, ProfileFieldsAccessHistoryCreationAttributes>
  implements ProfileFieldsAccessHistoryAttributes
{
  public rid!: string;
  public profile_fields_access_rid!: string;
  public attribute_name!: string;
  public old_value!: string;
  public new_value!: string;
  public modified_by?: string;
  public modified_datetime?: Date;
  public created_by?: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ProfileFieldsAccessHistory.init(
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
          allowNull: true
        },
        profile_fields_access_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: 
          { 
            model: {
              tableName : "profile_fields_access",
              schema : `${MAIN_SCHEMA_NAME}`
            }, 
            key: "rid" 
          },
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
        modelName: "ProfileFieldsAccessHistory",
        tableName: "profile_fields_access_history",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );

    // Define association with ProfileFieldsAccess model
    ProfileFieldsAccessHistory.belongsTo(ProfileFieldsAccess, { 
      foreignKey: "profile_fields_access_rid", 
      as: "profile_fields_access" 
    });
  }
}