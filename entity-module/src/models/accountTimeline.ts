import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import {
  ENV_PREFIX,
  R_NUMBER_PREFIX,
} from "../utils/constants";
import AccountDetails from "./accountDetails";

interface AccountTimelineAttributes {
  rid?: string;
  r_number?: string;
  created_by: string;
  created_datetime?: Date;
  account_rid: string;
  event_type_rid?: string | null;
  event_name?: string | null;
  entity_rid: string;
  entity_name: string;
  created_by_name?: string | null;
  document_rid?: string | null;
  descriptions?: string | null;
  source_record_count?: number | null;
}

interface AccountTimelineCreationAttributes
  extends Optional<AccountTimelineAttributes, "rid"> {}

export class AccountTimeline
  extends Model<
    AccountTimelineAttributes,
    AccountTimelineCreationAttributes
  >
  implements AccountTimelineAttributes
{
  public rid?: string;
  public r_number?: string;
  public created_by!: string;
  public created_datetime?: Date;
  public account_rid!: string;
  public event_type_rid?: string | null;
  public event_name?: string | null;
  public entity_rid!: string;
  public entity_name!: string;
  public created_by_name?: string | null;
  public document_rid?: string | null;
  public descriptions?: string | null;
  public source_record_count?: number | null;

  static initialize(sequelize: Sequelize, schemaName: string) {
    const model = AccountTimeline.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          allowNull: false,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        event_type_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        event_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        entity_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        entity_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        created_by_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        document_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        descriptions: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        source_record_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "account_timeline",
        timestamps: false,
        underscored: true,
      }
    );

    AccountTimeline.belongsTo(AccountDetails, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "account_timeline_account",
    });

    return model;
  }
}

export async function setupAccountTimelineSeq(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".account_timeline_seq START 1`
    );

    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".account_timeline
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.ACCOUNT_TIMELINE}-' || LPAD(nextval('"${schemaName}".account_timeline_seq')::text, 10, '0')`);

    console.log("Account timeline sequence setup complete");
  } catch (error) {
    console.error("Error setting up Account timeline sequence:", error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
