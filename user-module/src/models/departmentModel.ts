import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";

interface DepartmentAttributes {
  department_id: string; // UUID
  department_name: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface DepartmentCreationAttributes
  extends Optional<
    DepartmentAttributes,
    "department_id" | "created_datetime" | "modified_datetime"
  > {}

export class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes
{
  public department_id!: string;
  public department_name!: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
}

// Define the model using Sequelize
Department.init(
  {
    department_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    department_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    modelName: "Department",
    tableName: process.env.DEPARTMENT_TABLE || "departments",
    freezeTableName: true,
    timestamps: false,
    hooks: {
      beforeUpdate: (department: Department) => {
        department.modified_datetime = new Date();
      },
    },
  }
);

export default Department;
