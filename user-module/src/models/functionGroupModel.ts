import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Department } from "./departmentModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface FunctionGroupAttributes {
  function_group_id: string;
  function_group_name: string;
  department_id: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
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
  public created_by?: string;
  public modified_by?: string;

  static initialize(sequelize: Sequelize) {
    FunctionGroup.init(
      {
        function_group_id: {
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
        function_group_name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        department_id: {
          type: DataTypes.STRING(50),
          references: {
            model: {
              tableName : "departments",
              schema : `${MAIN_SCHEMA_NAME}`
            },
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
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
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
