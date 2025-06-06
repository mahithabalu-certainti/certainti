import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Department } from "./departmentModel";

interface FunctionGroupAttributes {
  function_group_id: string;
  function_group_name: string;
  department_id: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface FunctionGroupCreationAttributes
  extends Optional<
    FunctionGroupAttributes,
    "function_group_id" | "created_datetime" | "modified_datetime"
  > {}

export class FunctionGroup
  extends Model<FunctionGroupAttributes, FunctionGroupCreationAttributes>
  implements FunctionGroupAttributes
{
  public function_group_id!: string;
  public function_group_name!: string;
  public department_id!: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
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
        modelName: "FunctionGroup",
        tableName: process.env.FUNCTION_GROUP_TABLE_NAME || "function_groups",
        freezeTableName: true,
        timestamps: false,
        hooks: {
          beforeUpdate: (functionGroup: FunctionGroup) => {
            functionGroup.modified_datetime = new Date();
          },
        },
      }
    );

    FunctionGroup.belongsTo(Department, { foreignKey: "department_id" });
  }
}
