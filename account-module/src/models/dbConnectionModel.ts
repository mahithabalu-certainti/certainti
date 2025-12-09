import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
import { errorLog } from "../utils/helpers";
interface DatabaseConnectionAttributes {
  rid: string;
  r_number?: string;
  eid: number;
  database_name: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface DatabaseConnectionCreationAttributes
  extends Optional<DatabaseConnectionAttributes, "rid"> {}

export class DatabaseConnection
  extends Model<
    DatabaseConnectionAttributes,
    DatabaseConnectionCreationAttributes
  >
  implements DatabaseConnectionAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid!: number;
  public database_name!: string;
  public created_datetime!: Date;
  public modified_datetime!: Date;
  public created_by?: string;
  public modified_by?: string;

  static initialize(sequelize: Sequelize) {
    DatabaseConnection.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        eid: {
          type: DataTypes.INTEGER,
          allowNull: true,
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
          defaultValue: DataTypes.NOW,
        },
        database_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "DatabaseConnection",
        tableName: "database_connection",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`
      }
    );
  }
}

export async function setupDbConnectionSequence(sequelize: Sequelize) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS ${MAIN_SCHEMA_NAME}.db_connection_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE ${MAIN_SCHEMA_NAME}.database_connection
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.DATABASE_CONNECTION}-' || LPAD(nextval('${MAIN_SCHEMA_NAME}.db_connection_seq')::text, 5, '0')`);
    
  } catch (error) {
     errorLog("Error setting up database connection sequence:", (error as Error).message);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}

