import { DataTypes, Model, Optional, Sequelize } from "sequelize";
interface IndustryAttributes {
  rid: string; // UUID
  r_number?: string;
  eid?: number;
  industry_name: string;
  industry_description?: string;
  industry_status?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface IndustryCreationAttributes
  extends Optional<IndustryAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class Industry
  extends Model<IndustryAttributes, IndustryCreationAttributes>
  implements IndustryAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: number;
  public industry_name!: string;
  public industry_description?: string;
  public industry_status?: string;
  public created_by?: string;
  public modified_by?: string;

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    // Initialize the model
    Industry.init(
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
        industry_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        industry_description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        industry_status: {
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
        modelName: "Industry",
        tableName: "industry",
        timestamps: false,
      }
    );
  }
}
