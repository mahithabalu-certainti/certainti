import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";

interface ProfileAttributes {
  rid: string; // UUID
  r_number?: string;
  eid?: number;
  profile_name: string;
  profile_description?: string;
  profile_status?: string;
  created_by?: string;
  modified_by?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the interface for the creation attributes (optional fields like createdAt, updatedAt)
interface ProfileCreationAttributes
  extends Optional<ProfileAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class Profile
  extends Model<ProfileAttributes, ProfileCreationAttributes>
  implements ProfileAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: number;
  public profile_name!: string;
  public profile_description?: string;
  public profile_status?: string;
  public created_by?: string;
  public modified_by?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
Profile.init(
  {
    rid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    r_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    profile_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profile_description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profile_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    modified_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Profile",
    tableName: "profile",
    timestamps: true,
  }
);
