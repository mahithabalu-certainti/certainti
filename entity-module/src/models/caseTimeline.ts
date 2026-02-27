import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { log } from "console";
import { logMessage } from "../utils/helpers";

export interface CaseTimelineAttributes {
  rid?: string;
  r_number?: string;
  created_by: string;
  created_datetime?: Date;
  account_rid: string;
  entity_rid: string;
  event_type_rid: string;
  case_rid?: string;
  event_name?: string;
  descriptions?: string;
  entity_name?: string;
  created_by_name?: string;
}

export interface CaseTimelineCreationAttributes
  extends Optional<CaseTimelineAttributes, "rid"> { }

export class CaseTimeline
  extends Model<
    CaseTimelineAttributes,
    CaseTimelineCreationAttributes
  >
  implements CaseTimelineAttributes {
  public rid?: string;
  public r_number?: string;
  public created_by!: string
  public created_datetime?: Date;
  public account_rid!: string;
  public entity_rid!: string;
  public event_type_rid!: string;
  public case_rid?: string;
  public event_name?: string;
  public descriptions?: string;
  public entity_name?: string;
  public created_by_name?: string;

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
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
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
        },
        event_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        event_type_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        created_by_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        case_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        entity_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        descriptions: {
          type: DataTypes.TEXT,
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