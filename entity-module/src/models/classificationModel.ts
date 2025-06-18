import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Project } from "./project";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
interface ClassificationAttributes {
  rid: string;
  r_number?: string;
  eid?: number;
  classification_name: string;
  classification_description?: string;
  classification_status?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface ClassificationCreationAttributes
  extends Optional<ClassificationAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class Classification
  extends Model<ClassificationAttributes, ClassificationCreationAttributes>
  implements ClassificationAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: number;
  public classification_name!: string;
  public classification_description?: string;
  public classification_status?: string;
  public created_by?: string;
  public modified_by?: string;

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    // Initialize the model
    Classification.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
          allowNull: false,
        },
        created_by: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        modified_by: {
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
          allowNull: true
        },
        classification_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        classification_description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        classification_status: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        
      },
      {
        sequelize,
        modelName: "Classification",
        tableName: "project_classification",
        timestamps: false,
      }
    );
  }
}

