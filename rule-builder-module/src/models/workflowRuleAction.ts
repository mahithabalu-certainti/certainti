import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface RuleActionAttributes {
  rid?: string;
  eid?: string | null;
  r_number?: string | null;
  rule_rid: string;
  action_type: string; // e.g., notify_user, change_status
  target_user: string;
  new_value: string | null;
  action_order: number;
  message_template: string;
  metadata: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

export interface RuleActionCreationAttributes
  extends Optional<RuleActionAttributes, "rid"> { }

export class RuleAction
  extends Model<RuleActionAttributes, RuleActionCreationAttributes>
  implements RuleActionAttributes {
  public rid!: string;
  public eid!: string;
  public r_number!: string;
  public rule_rid!: string;
  public action_type!: string;
  public target_user!: string;
  public new_value!: string;
  public action_order!: number;
  public message_template!: string;
  public metadata!: string;
  public created_by!: string;
  public modified_by?: string;

  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    RuleAction.init(
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

        action_type: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        target_user: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        new_value: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        action_order: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: true,
        },

        message_template: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        metadata: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        created_by: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        modified_by: {
          type: DataTypes.STRING,
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
        modelName: "RuleAction",
        tableName: "workflow_rule_action",
        schema: MAIN_SCHEMA_NAME,
        timestamps: false, // using custom timestamp columns
      }
    );

    return RuleAction;
  }
}



