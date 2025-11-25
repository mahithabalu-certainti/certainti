import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface RuleScopeMapAttributes {
  rid?: string;
  eid?: string | null;
  r_number?: string | null;
  rule_rid: string;
  scope_entity_type: string;  // e.g., "case", "task"
  scope_entity_rid: string;
  is_active?: boolean;
  created_by: number;
  modified_by?: number;
  created_datetime?: Date;
  modified_datetime?: Date;
}

export interface RuleScopeMapCreationAttributes
  extends Optional<RuleScopeMapAttributes, "rid"> { }

export class RuleScopeMap
  extends Model<RuleScopeMapAttributes, RuleScopeMapCreationAttributes>
  implements RuleScopeMapAttributes {
  public rid!: string;
  public eid!: string;
  public r_number!: string;
  public rule_rid!: string;
  public scope_entity_type!: string;
  public scope_entity_rid!: string;
  public is_active?: boolean;
  public created_by!: number;
  public modified_by?: number;

  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    RuleScopeMap.init(
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

        scope_entity_type: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        scope_entity_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
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
        modelName: "RuleScopeMap",
        tableName: "workflow_rule_scope_map",
        schema: MAIN_SCHEMA_NAME,
        timestamps: false, // using custom timestamp columns
      }
    );

    return RuleScopeMap;
  }
}

