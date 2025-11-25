import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface RuleTriggerLogAttributes {
  rid?: string;
  eid?: string | null;
  r_number?: string | null;
  rule_rid: string;
  event_name: string;
  event_time: Date;
  context_entity_id: string;
  status: string;
  message: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

export interface RuleTriggerLogCreationAttributes
  extends Optional<RuleTriggerLogAttributes, "rid"> { }

export class RuleTriggerLog
  extends Model<RuleTriggerLogAttributes, RuleTriggerLogCreationAttributes>
  implements RuleTriggerLogAttributes {
  public rid!: string;
  public eid!: string;
  public r_number!: string;
  public rule_rid!: string;
  public event_name!: string;
  public event_time!: Date;
  public context_entity_id!: string;
  public status!: string;
  public message!: string;
  public created_by!: string;
  public modified_by?: string;

  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    RuleTriggerLog.init(
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

        event_name: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        event_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },

        context_entity_id: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        message: {
          type: DataTypes.STRING,
          allowNull: true,
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
        modelName: "RuleTriggerLog",
        tableName: "workflow_rule_trigger_log",
        schema: MAIN_SCHEMA_NAME,
        timestamps: false, // using custom timestamp columns
      }
    );

    return RuleTriggerLog;
  }
}


// export const createTriggerLog = async (data: RuleTriggerLog) => {
//   const query = `
//     INSERT INTO workflow_rule_trigger_log
//     (rid,rule_rid, event_name, event_time, context_entity_id, status, message)
//     VALUES ($1,$2,$3,$4,$5,$6,$7)
//     RETURNING *;
//   `;
//   const values = [data.rid, data.ruleRid, data.eventName, data.eventTime, data.contextEntityId, data.status, data.message ?? null];
//   const res = await db.query(query, values);
//   return res.rows[0];
// };

// export const getTriggerLogById = async (rid: number) => {
//   const res = await db.query(`SELECT * FROM workflow_rule_trigger_log WHERE rid=$1`, [rid]);
//   return res.rows[0];
// };

// export const getTriggerLogsByRule = async (ruleRid: number) => {
//   const res = await db.query(`SELECT * FROM workflow_rule_trigger_log WHERE rule_rid=$1 ORDER BY rid DESC`, [ruleRid]);
//   return res.rows;
// };

// export const deleteTriggerLog = async (rid: number) => {
//   await db.query(`DELETE FROM workflow_rule_trigger_log WHERE rid=$1`, [rid]);
//   return { message: "Trigger log deleted successfully" };
// };
