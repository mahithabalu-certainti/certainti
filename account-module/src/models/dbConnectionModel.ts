import { DataTypes, Model, Optional, Sequelize } from "sequelize";
interface DatabaseConnectionAttributes {
  rid: string;
  r_number: string;
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
  public r_number!: string;
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
          type: DataTypes.STRING(255),
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

