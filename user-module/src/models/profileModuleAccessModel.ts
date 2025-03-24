import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";

interface ProfileModuleAccessAttributes {
  profile_module_id: number;
  profile_id: number;
  module_id: number;
  is_tab_enabled: boolean;
  write: boolean;
  edit: boolean;
  delete: boolean;
  read: boolean;
  list: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProfileModuleAccessCreationAttributes
  extends Optional<ProfileModuleAccessAttributes, "profile_module_id"> {}

// Define the ProfileModuleAccess model class extending Sequelize's Model class
export class ProfileModuleAccess
  extends Model<
    ProfileModuleAccessAttributes,
    ProfileModuleAccessCreationAttributes
  >
  implements ProfileModuleAccessAttributes
{
  public profile_module_id!: number;
  public profile_id!: number;
  public module_id!: number;
  public is_tab_enabled!: boolean;
  public write!: boolean;
  public edit!: boolean;
  public delete!: boolean;
  public read!: boolean;
  public list!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
ProfileModuleAccess.init(
  {
    profile_module_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_tab_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    write: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    edit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    delete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    list: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "ProfileModuleAccess",
    tableName: "profile_module_access",
    timestamps: true,
  }
);
