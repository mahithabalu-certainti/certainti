import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Profile } from "./profileModel";

interface ProfileHistoryAttributes {
  rid: string;
  profile_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
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

  static initialize(sequelize: Sequelize) {
    ProfileHistory.init(
      {
        rid: { 
          type: DataTypes.UUID, 
          defaultValue: DataTypes.UUIDV4, 
          primaryKey: true 
        },
        profile_rid: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "profile", key: "rid" },
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
        modelName: "ProfileHistory",
        tableName: "profile_history",
        timestamps: false,
      }
    );

    // Define association with Profile model
    ProfileHistory.belongsTo(Profile, { 
      foreignKey: "profile_rid", 
      as: "profile" 
    });
  }
}