import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/dataSource';

// Define the interface for the attributes of the Module model
interface ModuleAttributes {
  module_id: number;
  module_name: string;
  parent_module_id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the interface for the creation attributes (optional fields like createdAt, updatedAt)
interface ModuleCreationAttributes extends Optional<ModuleAttributes, 'module_id'> {}

// Define the Module model class extending Sequelize's Model class
export class Module extends Model<ModuleAttributes, ModuleCreationAttributes> implements ModuleAttributes {
  public module_id!: number;
  public module_name!: string;
  public parent_module_id!: number;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
Module.init(
  {
    module_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    module_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parent_module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Module',
    tableName: 'module',
    timestamps: true,
  }
);
