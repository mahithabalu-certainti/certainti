import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface RuleScheduleQueueAttributes {
  rid?: string;
  eid?: string | null;
  r_number?: string | null;
  rule_rid: string;
  related_task_rid: string;
  scheduled_datetime: Date;
  executed?: boolean;
  executed_datetime: Date;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

export interface RuleScheduleQueueCreationAttributes
  extends Optional<RuleScheduleQueueAttributes, "rid"> { }

export class RuleScheduleQueue
  extends Model<RuleScheduleQueueAttributes, RuleScheduleQueueCreationAttributes>
  implements RuleScheduleQueueAttributes {
  public rid!: string;
  public eid!: string;
  public r_number!: string;
  public rule_rid!: string;
  public related_task_rid!: string;
  public scheduled_datetime!: Date;
  public executed?: boolean;
  public executed_datetime!: Date;
  public created_by!: string;
  public modified_by?: string;

  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    RuleScheduleQueue.init(
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

        related_task_rid: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        scheduled_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
        },

        executed: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },

        executed_datetime: {
          type: DataTypes.DATE,
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
        modelName: "RuleScheduleQueue",
        tableName: "workflow_rule_schedule_queue",
        schema: MAIN_SCHEMA_NAME,
        timestamps: false, // using custom timestamp columns
      }
    );

    return RuleScheduleQueue;
  }
}


// export const createScheduleQueue = async (data: RuleScheduleQueue) => {
//   const query = `
//     INSERT INTO workflow_rule_schedule_queue
//     (rid,rule_rid, related_task_rid, scheduled_datetime)
//     VALUES ($1,$2,$3,$4)
//     RETURNING *;
//   `;
//   const values = [data.rid, data.ruleRid, data.relatedTaskRid, data.scheduledDatetime];
//   const res = await db.query(query, values);
//   return res.rows[0];
// };

// export const getScheduleById = async (rid: number) => {
//   const res = await db.query(`SELECT * FROM workflow_rule_schedule_queue WHERE rid=$1`, [rid]);
//   return res.rows[0];
// };

// export const getSchedulesByRule = async (ruleRid: number) => {
//   const res = await db.query(`SELECT * FROM workflow_rule_schedule_queue WHERE rule_rid=$1 ORDER BY rid DESC`, [ruleRid]);
//   return res.rows;
// };

// export const updateScheduleQueue = async (rid: number, data: Partial<RuleScheduleQueue>) => {
//   const query = `
//     UPDATE workflow_rule_schedule_queue
//     SET scheduled_datetime=$1, executed=$2, executed_datetime=$3
//     WHERE rid=$4
//     RETURNING *;
//   `;
//   const values = [data.scheduledDatetime, data.executed ?? false, data.executedDatetime ?? null, rid];
//   const res = await db.query(query, values);
//   return res.rows[0];
// };

// export const getPendingSchedules = async () => {
//   const query = `
//     SELECT * FROM workflow_rule_schedule_queue
//     WHERE executed = false
//   `;
//   const res = await db.query(query);
//   return res.rows;
// };

// export const markScheduleExecuted = async (rid: number) => {
//   const res = await db.query(`
//     UPDATE workflow_rule_schedule_queue
//     SET executed=true, executed_datetime=NOW()
//     WHERE rid=$1
//     RETURNING *;
//   `, [rid]);
//   return res.rows[0];
// };

// export const deleteScheduleQueue = async (rid: number) => {
//   await db.query(`DELETE FROM workflow_rule_schedule_queue WHERE rid=$1`, [rid]);
//   return { message: "Schedule queue entry deleted successfully" };
// };
