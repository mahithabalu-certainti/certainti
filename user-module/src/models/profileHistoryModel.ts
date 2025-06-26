import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Profile } from "./profileModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface ProfileHistoryAttributes {
  rid: string;
  profile_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
  created_by?: string;
  created_datetime?: Date;
}

interface ProfileHistoryCreationAttributes extends Optional<ProfileHistoryAttributes, "rid"> {}

export class ProfileHistory
  extends Model<ProfileHistoryAttributes, ProfileHistoryCreationAttributes>
  implements ProfileHistoryAttributes
{
  public rid!: string;
  public profile_rid!: string;
  public attribute_name!: string;
  public old_value!: string;
  public new_value!: string;
  public modified_by?: string;
  public modified_datetime?: Date;
  public created_by?: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ProfileHistory.init(
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
          allowNull: false
        },
        modified_by: { 
          type: DataTypes.STRING,
          allowNull: true 
        },
        modified_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false
        },
        profile_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: {
            tableName : "profile",
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
        }
      },
      {
        sequelize,
        modelName: "ProfileHistory",
        tableName: "profile_history",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );

    // Define association with Profile model
    ProfileHistory.belongsTo(Profile, { 
      foreignKey: "profile_rid", 
      as: "profile" 
    });
  }
}