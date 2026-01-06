import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface ConditionAttributes {
  rid: string;
  eid?: string | null;
  r_number?: string | null;
  rule_rid: String;
  category_rid: String;
  logical_operator: String;
  field_rid: string;
  operator_rid: string;
  value_rid: string;
  data_type: string;
  sequence: number;
  group_id: number;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

export interface ConditionCreationAttributes
  extends Optional<ConditionAttributes, "rid"> { }

export class Condition
  extends Model<ConditionAttributes, ConditionCreationAttributes>
  implements ConditionAttributes {
  public rid!: string;
  public eid!: string;
  public r_number!: string;
  public rule_rid!: string;
  public category_rid!: string;
  public logical_operator!: string;
  public field_rid!: string;
  public operator_rid!: string;
  public value_rid!: string;
  public data_type!: string;
  public sequence!: number;
  public group_id!: number;
  public created_by!: string;
  public modified_by?: string;

  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    Condition.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
        },

        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },

        eid: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        rule_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        category_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        logical_operator: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        field_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        operator_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        value_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        data_type: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        sequence: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        group_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        created_by: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        modified_by: {
          type: DataTypes.INTEGER,
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
      },
      {
        sequelize,
        modelName: "Condition",
        tableName: "workflow_rule_condition",
        schema: MAIN_SCHEMA_NAME,
        timestamps: false, // using custom timestamp columns
      }
    );
    return Condition;
  }
}
