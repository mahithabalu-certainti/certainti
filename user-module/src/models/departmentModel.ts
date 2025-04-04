import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";

interface DepartmentAttributes {
  department_id: string; // UUID
  department_name: string;
  created_at?: Date;
  updated_at?: Date;
}

interface DepartmentCreationAttributes
  extends Optional<
    DepartmentAttributes,
    "department_id" | "created_at" | "updated_at"
  > {}

export class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes
{
  public department_id!: string;
  public department_name!: string;
  public created_at?: Date;
  public updated_at?: Date;
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
    }
  },
  {
    sequelize,
    modelName: "Department",
    tableName: process.env.DEPARTMENT_TABLE || "departments",
    freezeTableName: true,
    timestamps: true,
    hooks: {
      beforeUpdate: (department: Department) => {
        department.updated_at = new Date();
      },
    },
  }
);

export default Department;
