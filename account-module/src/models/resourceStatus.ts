import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
interface ResourceStatusAttributes {
  rid: string;
  resource_status_name: string;
  resource_status_description?: string;
  status?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface ResourceStatusCreationAttributes
  extends Optional<ResourceStatusAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class ResourceStatus
  extends Model<ResourceStatusAttributes, ResourceStatusCreationAttributes>
  implements ResourceStatusAttributes
{
  public rid!: string;
  public resource_status_name!: string;
  public resource_status_description?: string;
  public status?: string;
  public created_by?: string;
  public modified_by?: string;
  

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    // Initialize the model
    ResourceStatus.init(
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
        resource_status_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        resource_status_description: {
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
        modelName: "ResourceStatus",
        tableName: "resource_status",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`
      }
    );
    return ResourceStatus;
  }
}
