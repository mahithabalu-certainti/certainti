import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
interface ProjectTypeAttributes {
  rid: string;
  project_type_name: string;
  project_type_description?: string;
  status?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface ProjectTypeCreationAttributes
  extends Optional<ProjectTypeAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class ProjectType
  extends Model<ProjectTypeAttributes, ProjectTypeCreationAttributes>
  implements ProjectTypeAttributes
{
  public rid!: string;
  public project_type_name!: string;
  public project_type_description?: string;
  public status?: string;
  public created_by?: string;
  public modified_by?: string;
  

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    // Initialize the model
    ProjectType.init(
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
        project_type_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        project_type_description: {
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
        modelName: "ProjectType",
        tableName: "project_type",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`
      }
    );
    return ProjectType;
  }
}
