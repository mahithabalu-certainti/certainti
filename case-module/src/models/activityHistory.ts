import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { logMessage } from "../utils/helpers";

export interface ActivityHistoryAttributes {
  rid?: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  activity_rid: string;
  attribute_name: string;
  old_value?: string;
  new_value?: string;
  account_rid? : string
  activity_type? : string
}

export interface ActivityHistoryCreationAttributes
  extends Optional<ActivityHistoryAttributes, "rid"> {}

export class ActivityHistory
  extends Model<
    ActivityHistoryAttributes,
    ActivityHistoryCreationAttributes
  >
  implements ActivityHistoryAttributes
{
  public rid?: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public activity_rid!: string;
  public attribute_name!: string;
  public old_value?: string;
  public new_value?: string;
  public account_rid? : string;
  public activity_type? : string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return ActivityHistory.init(
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
        activity_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            model: 'activities',
            key: 'rid'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        attribute_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        old_value: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        new_value: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        account_rid : {
          type : DataTypes.STRING(50),
          allowNull : true
        },
        activity_type : {
          type : DataTypes.STRING(50),
          allowNull : true
        }
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "activity_history",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
export async function setupCaseHistorySequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".activity_history_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".activity_history
      ALTER COLUMN r_number SET DEFAULT 'ACH-' || LPAD(nextval('"${schemaName}".activity_history_seq')::text, 10, '0')`);
    logMessage("Activity history sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up Activity history sequence: ${error}`);
  }
}