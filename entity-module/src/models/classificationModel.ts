import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Project } from "./project";
interface ClassificationAttributes {
  rid: string; // UUID
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
          allowNull: true,
          defaultValue: null,
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
