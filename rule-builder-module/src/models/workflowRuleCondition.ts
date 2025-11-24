import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface ConditionAttributes {
  rid: string;
  eid?: string | null;
  r_number?: string | null;
  logical_operator: String;
  field_name: string;
  operator: string;
  value: string;
  data_type: string;
  sequence: number;
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
  public logical_operator!: string;
  public field_name!: string;
  public operator!: string;
  public value!: string;
  public data_type!: string;
  public sequence!: number;
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

        logical_operator: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        field_name: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        operator: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        value: {
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
