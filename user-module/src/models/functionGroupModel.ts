import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";
import { Department } from "./departmentModel";

interface FunctionGroupAttributes {
  function_group_id: string;
  function_group_name: string;
  department_id: string;
  created_at?: Date;
  updated_at?: Date;
}

interface FunctionGroupCreationAttributes
  extends Optional<
    FunctionGroupAttributes,
    "function_group_id" | "created_at" | "updated_at"
  > {}

export class FunctionGroup
  extends Model<FunctionGroupAttributes, FunctionGroupCreationAttributes>
  implements FunctionGroupAttributes
{
  public function_group_id!: string;
  public function_group_name!: string;
  public department_id!: string;
  public created_at?: Date;
  public updated_at?: Date;
}

FunctionGroup.init(
  {
    function_group_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    function_group_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    department_id: {
      type: DataTypes.UUID,
      references: {
        model: "departments",
        key: "department_id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "FunctionGroup",
    tableName: process.env.FUNCTION_GROUP_TABLE_NAME || "function_groups",
    freezeTableName: true,
    timestamps: true,
    hooks: {
      beforeUpdate: (functionGroup: FunctionGroup) => {
        functionGroup.updated_at = new Date();
      },
    },
  }
);

FunctionGroup.belongsTo(Department, { foreignKey: "department_id" });

export default FunctionGroup;
