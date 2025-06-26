import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface DepartmentAttributes {
  department_id: string;
  department_name: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
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
  public created_by?: string;
  public modified_by?: string;

  static initialize(sequelize: Sequelize) {
    // Define the model using Sequelize
    Department.init(
      {
        department_id: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
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
          defaultValue: null,
        },
        department_name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
      
      },
      {
        sequelize,
        modelName: "Department",
        tableName: process.env.DEPARTMENT_TABLE || "departments",
        freezeTableName: true,
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
        hooks: {
          beforeUpdate: (department: Department) => {
            department.modified_datetime = new Date();
          },
        },
      }
    );
  }
}
