import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";

// Define the interface for the attributes of the ProfileApiAccess model
interface ProfileApiAccessAttributes {
  api_access_id: number;
  api_id: number;
  profile_id: number;
  created_datetime?: Date;
  modified_datetime?: Date;
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface ProfileApiAccessCreationAttributes
  extends Optional<ProfileApiAccessAttributes, "api_access_id"> {}

// Define the ProfileApiAccess model class extending Sequelize's Model class
export class ProfileApiAccess
  extends Model<ProfileApiAccessAttributes, ProfileApiAccessCreationAttributes>
  implements ProfileApiAccessAttributes
{
  public api_access_id!: number;
  public api_id!: number;
  public profile_id!: number;

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;
}

// Initialize the model
ProfileApiAccess.init(
  {
    api_access_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    api_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modified_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "ProfileApiAccess",
    tableName: "profile_api_access",
    timestamps: false,
  }
);
