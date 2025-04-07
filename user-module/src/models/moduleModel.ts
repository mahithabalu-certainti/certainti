import { DataTypes, Model, Optional, Sequelize } from "sequelize";

// Define the interface for the attributes of the Module model
interface ModuleAttributes {
  module_id: number;
  module_name: string;
  parent_module_id: number;
  created_datetime?: Date;
  modified_datetime?: Date;
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface ModuleCreationAttributes
  extends Optional<ModuleAttributes, "module_id"> {}

// Define the Module model class extending Sequelize's Model class
export class Module
  extends Model<ModuleAttributes, ModuleCreationAttributes>
  implements ModuleAttributes
{
  public module_id!: number;
  public module_name!: string;
  public parent_module_id!: number;

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
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
        modelName: "Module",
        tableName: "module",
        timestamps: false,
      }
    );
  }
}
