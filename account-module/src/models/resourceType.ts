import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constant";
interface ResourceTypeAttributes {
  rid: string;
  resource_type_name: string;
  resource_type_description?: string;
  status?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface ResourceTypeCreationAttributes
  extends Optional<ResourceTypeAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class ResourceType
  extends Model<ResourceTypeAttributes, ResourceTypeCreationAttributes>
  implements ResourceTypeAttributes
{
  public rid!: string;
  public resource_type_name!: string;
  public resource_type_description?: string;
  public status?: string;
  public created_by?: string;
  public modified_by?: string;
  

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    // Initialize the model
    ResourceType.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
          allowNull: false,
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.STRING(50),
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
        },
        resource_type_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        resource_type_description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: true,
        }
      },
      {
        sequelize,
        modelName: "ResourceType",
        tableName: "resource_type",
        timestamps: false,
      }
    );
    return ResourceType;
  }
}
