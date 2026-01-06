import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { log } from "console";
import { logMessage } from "../utils/helpers";

export interface CaseTimelineAttributes {
  rid?: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  entity_rid: string;
  event_name?: string;
  event_type?: string;
  event_status?: string;
  event_datetime?: Date;
  description?: string;
}

export interface CaseTimelineCreationAttributes
  extends Optional<CaseTimelineAttributes, "rid"> {}

export class CaseTimeline
  extends Model<
    CaseTimelineAttributes,
    CaseTimelineCreationAttributes
  >
  implements CaseTimelineAttributes
{
  public rid?: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public entity_rid!: string;
  public event_name?: string;
  public event_type?: string;
  public event_status?: string;
  public event_datetime?: Date;
  public description?: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return CaseTimeline.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: {
              tableName: 'account_details',
              schema: schemaName // or whatever your main schema name is
            },
            key: 'account_rid'
          },
          onUpdate: 'CASCADE'
        },
        entity_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: 'cases',
            key: 'rid'
          },
          onUpdate: 'CASCADE'
        },
        event_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        event_type: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        event_status: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        event_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        description: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_timeline",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
export async function setupCaseTimelineSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".cases_timeline_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".cases_timeline
      ALTER COLUMN r_number SET DEFAULT 'CST-' || LPAD(nextval('"${schemaName}".cases_timeline_seq')::text, 10, '0')`);

   logMessage("Cases timeline sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up Cases timeline sequence: ${error}`);
  }
}