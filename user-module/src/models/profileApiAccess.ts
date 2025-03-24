import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";

// Define the interface for the attributes of the ProfileApiAccess model
interface ProfileApiAccessAttributes {
  api_access_id: number;
  api_id: number;
  profile_id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the interface for the creation attributes (optional fields like createdAt, updatedAt)
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
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
  },
  {
    sequelize,
    modelName: "ProfileApiAccess",
    tableName: "profile_api_access",
    timestamps: true,
  }
);
