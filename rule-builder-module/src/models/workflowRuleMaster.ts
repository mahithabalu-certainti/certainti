import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface RuleMasterAttributes {
  rid: string;
  eid?: string | null;
  r_number?: string | null;
  rule_name: string;
  description: string;
  event_rid: string;
  trigger_type: number;
  condition_rid: string;
  is_active?: boolean;
  scope_type_rid: string;
  schedule_offset_type?: string | null;
  schedule_offset_value?: string | null;
  created_by: string;
  modified_by?: string;
  in_app_template_rid?: string | null;
  email_template_rid?: string | null;
  created_datetime?: Date;
  modified_datetime?: Date;
}

export interface RuleMasterCreationAttributes
  extends Optional<RuleMasterAttributes, "rid" | "is_active" | "created_datetime" | "modified_datetime"> { }

export class RuleMaster
  extends Model<RuleMasterAttributes, RuleMasterCreationAttributes>
  implements RuleMasterAttributes {
  public rid!: string;
  public eid!: string;
  public r_number!: string;
  public rule_name!: string;
  public description!: string;
  public event_rid!: string;
  public trigger_type!: number;
  public condition_rid!: string;
  public is_active?: boolean;
  public scope_type_rid!: string;
  public schedule_offset_type?: string | null;
  public schedule_offset_value?: string | null;
  public in_app_template_rid?: string | null;
  public email_template_rid?: string | null;
  public created_by!: string;
  public modified_by?: string;

  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    RuleMaster.init(
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

        rule_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        description: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        event_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        trigger_type: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        condition_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },

        scope_type_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        schedule_offset_type: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        schedule_offset_value: {
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

        in_app_template_rid: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        email_template_rid: {
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
        modelName: "RuleMaster",
        tableName: "workflow_rule_master",
        schema: MAIN_SCHEMA_NAME,
        timestamps: false, // using custom timestamp columns
      }
    );

    return RuleMaster;
  }
}
