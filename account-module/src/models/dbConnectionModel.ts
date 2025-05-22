import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constant";
interface DatabaseConnectionAttributes {
  rid: string;
  r_number?: string;
  eid: number;
  database_name: string;
  created_datetime?: Date;
  modified_datetime?: Date;
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

  static initialize(sequelize: Sequelize) {
    DatabaseConnection.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        eid: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        database_name: {
          type: DataTypes.STRING(255),
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
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "DatabaseConnection",
        tableName: "database_connection",
        timestamps: false,
      }
    );
  }
}

export async function setupDbConnectionSequence(sequelize: Sequelize) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query('CREATE SEQUENCE IF NOT EXISTS db_connection_seq START 1');
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE database_connection
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.DATABASE_CONNECTION} ' || LPAD(nextval('db_connection_seq')::text, 10, '0')`);
    
    console.log('DbConnection sequence setup complete');
  } catch (error) {
    console.error('Error setting up DbConnection sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}

