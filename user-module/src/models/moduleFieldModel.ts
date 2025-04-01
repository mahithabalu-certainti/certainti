import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";

interface ModuleFieldsAttributes {
  module_field_id: number;
  module_id: number;
  module_subsection?: string | null;
  field_name: string;
  description?: string | null;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface ModuleFieldsCreationAttributes
  extends Optional<ModuleFieldsAttributes, "module_field_id"> {}

export class ModuleFields
  extends Model<ModuleFieldsAttributes, ModuleFieldsCreationAttributes>
  implements ModuleFieldsAttributes
{
  public module_field_id!: number;
  public module_id!: number;
  public module_subsection?: string | null;
  public field_name!: string;
  public description?: string | null;

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;
}

// Initialize the model
ModuleFields.init(
  {
    module_field_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "module",
        key: "module_id",
      },
    },
    module_subsection: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    field_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
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
    modelName: "ModuleFields",
    tableName: "module_fields",
    timestamps: false,
  }
);
