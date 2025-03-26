import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";

interface DatabaseConnectionAttributes {
  rid: number;
  r_number: string;
  eid: number;
  database_name: string;
}

interface DatabaseConnectionCreationAttributes
  extends Optional<DatabaseConnectionAttributes, "rid"> {}

class DatabaseConnection
  extends Model<
    DatabaseConnectionAttributes,
    DatabaseConnectionCreationAttributes
  >
  implements DatabaseConnectionAttributes
{
  public rid!: number;
  public r_number!: string;
  public eid!: number;
  public database_name!: string;
}

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
  },
  {
    sequelize,
    modelName: "DatabaseConnection",
    tableName: "database_connection",
    timestamps: true,
  }
);

export default DatabaseConnection;
