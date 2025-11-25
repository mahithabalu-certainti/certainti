import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface RuleAuditAttributes {
  rid?: string;
  eid?: string | null;
  r_number?: string | null;
  rule_rid: string;
  action: string;
  old_value: string;
  new_value: string;
  notes: string;
  created_by: string;
  modified_by: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

export interface RuleAuditCreationAttributes
  extends Optional<RuleAuditAttributes, "rid"> { }

export class RuleAudit
  extends Model<RuleAuditAttributes, RuleAuditCreationAttributes>
  implements RuleAuditAttributes {
  public rid!: string;
  public eid!: string;
  public r_number!: string;
  public rule_rid!: string;
  public action!: string;
  public old_value!: string;
  public new_value!: string;
  public notes!: string;
  public created_by!: string;
  public modified_by!: string;

  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    RuleAudit.init(
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

        action: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        old_value: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        new_value: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        notes: {
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
        modelName: "RuleAudit",
        tableName: "workflow_rule_audit",
        schema: MAIN_SCHEMA_NAME,
        timestamps: false, // using custom timestamp columns
      }
    );

    return RuleAudit;
  }
}


// export const createAuditEntry = async (data: RuleAudit) => {
//   const query = `
//     INSERT INTO workflow_rule_audit
//     (rid,rule_rid, action, old_value, new_value, notes, created_by)
//     VALUES ($1,$2,$3,$4,$5,$6,$7)
//     RETURNING *;
//   `;
//   const values = [data.rid, data.ruleRid, data.action, data.oldValue ?? null, data.newValue ?? null, data.notes ?? null, data.createdBy];
//   const res = await db.query(query, values);
//   return res.rows[0];
// };

// export const getAuditById = async (rid: number) => {
//   const res = await db.query(`SELECT * FROM workflow_rule_audit WHERE rid=$1`, [rid]);
//   return res.rows[0];
// };

// export const getAuditsByRule = async (ruleRid: number) => {
//   const res = await db.query(`SELECT * FROM workflow_rule_audit WHERE rule_rid=$1 ORDER BY rid DESC`, [ruleRid]);
//   return res.rows;
// };

// export const deleteAuditEntry = async (rid: number) => {
//   await db.query(`DELETE FROM workflow_rule_audit WHERE rid=$1`, [rid]);
//   return { message: "Audit entry deleted successfully" };
// };
