import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
interface IndustryAttributes {
  rid: string; 
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
        }
      },
      {
        sequelize,
        modelName: "Industry",
        tableName: "industry",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`
      }
    );
    return Industry;
  }
}

export async function setupIndustrySequence(sequelize: Sequelize) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS ${MAIN_SCHEMA_NAME}.industry_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE ${MAIN_SCHEMA_NAME}.industry
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.INDUSTRY}-' || LPAD(nextval('${MAIN_SCHEMA_NAME}.industry_seq')::text, 10, '0')`);
    
    console.log('Industry sequence setup complete');
  } catch (error) {
    console.error('Error setting up Industry sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
