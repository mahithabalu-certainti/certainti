import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";

interface ApiAttributes {
  api_id: number;
  module_id: number;
  api_name: string;
  endpoint: string;
  http_method: string;
  access_type: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface ApiCreationAttributes extends Optional<ApiAttributes, "api_id"> {}

export class Api
  extends Model<ApiAttributes, ApiCreationAttributes>
  implements ApiAttributes
{
  public api_id!: number;
  public module_id!: number;
  public api_name!: string;
  public endpoint!: string;
  public http_method!: string;
  public access_type!: string;

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;
}

Api.init(
  {
    api_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    api_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endpoint: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    http_method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    access_type: {
      type: DataTypes.STRING,
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
    modelName: "Api",
    tableName: "api",
    timestamps: false,
  }
);
