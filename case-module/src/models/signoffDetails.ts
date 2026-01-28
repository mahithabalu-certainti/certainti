import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface SignoffDetailsAttributes {
  rid: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  signoff_type_rid: string;
  case_rid: string;
  account_rid: string;
}

export interface SignoffDetailsCreationAttributes
  extends Optional<SignoffDetailsAttributes, "rid"> {}

export class SignoffDetails
  extends Model<
    SignoffDetailsAttributes,
    SignoffDetailsCreationAttributes
  >
  implements SignoffDetailsAttributes
{
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public signoff_type_rid!: string;
  public case_rid!: string;
  public account_rid!: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return SignoffDetails.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          primaryKey: true,
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
        },
        r_number: {
          type: DataTypes.STRING(50),
          allowNull: true,
          unique: true,
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
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        signoff_type_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        case_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "signoff_details",
        timestamps: false,
        underscored: true,
        indexes: [
          {
            name: "idx_signoff_details_rid",
            fields: ["rid"],
          },
          {
            name: "idx_signoff_details_case_rid",
            fields: ["case_rid"],
          },
          {
            name: "idx_signoff_details_account_rid",
            fields: ["account_rid"],
          },
          {
            name: "idx_signoff_details_signoff_type_rid",
            fields: ["signoff_type_rid"],
          },
        ],
      }
    );
  }
}

export async function setupSignoffDetailsSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".signoff_details_seq START 1`
    );

    await sequelize.query(`
      ALTER TABLE "${schemaName}".signoff_details
      ALTER COLUMN r_number
      SET DEFAULT 'CSOFF-' || LPAD(
        nextval('"${schemaName}".signoff_details_seq')::text,
        10,
        '0'
      )
    `);

    logMessage("Signoff details sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up signoff details sequence: ${error}`);
  }
}
