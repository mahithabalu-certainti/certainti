import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CaseHistorySubmissionAttributes {
  rid: string;
  r_number: string;
  eid: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  country_rid: string;
  state_rid?: string;
  account_rid: string;
  fiscal_year: string;
  total_project: number;
  total_qualified_project: number;
  total_project_cost: number;
  total_qualified_project_cost: number;
  total_qre: number;
  total_rd_credits: number;
  annual_gross_receipts?: number;
  total_fte_cost?: number;
  total_subcon_cost?: number;
  total_nonlabor_cost?: number;
}

export interface CaseHistorySubmissionCreationAttributes
  extends Optional<CaseHistorySubmissionAttributes, "rid" | "r_number"> {}

export class CaseHistorySubmission
  extends Model<CaseHistorySubmissionAttributes, CaseHistorySubmissionCreationAttributes>
  implements CaseHistorySubmissionAttributes
{
  public rid!: string;
  public r_number!: string;
  public eid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public fiscal_year!: string;
  public total_project!: number;
  public total_qualified_project!: number;
  public total_project_cost!: number;
  public total_qualified_project_cost!: number;
  public total_qre!: number;
  public total_rd_credits!: number;
  public annual_gross_receipts?: number;
  public country_rid!: string;
  public state_rid?: string;
  public total_fte_cost?: number;
  public total_subcon_cost?: number;
  public total_nonlabor_cost?: number;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CaseHistorySubmission.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
         r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        eid: {
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
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        country_rid: {
          type: DataTypes.STRING(50),
          allowNull: false, 
        },
        state_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        total_fte_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_subcon_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_nonlabor_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        total_project: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        total_qualified_project: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        total_project_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: false,
        },
        total_qualified_project_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: false,
        },
        total_qre: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: false,
        },
        total_rd_credits: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: false,
        },
        annual_gross_receipts: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_history_submission",
        timestamps: false,
        underscored: true,
        indexes: [
          {
            fields: ["account_rid"],
            name: "idx_case_history_submission_account_rid",
          }
        ],
      }
    );
  }
}

export async function setupCaseHistorySubmissionSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".case_history_submission_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".cases
      ALTER COLUMN r_number SET DEFAULT 'CHS-' || LPAD(nextval('"${schemaName}".case_history_submission_seq')::text, 10, '0')`);

    logMessage("Case history submission sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up Case history submission sequence: ${error}`);
  }
}