
import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface AiTechnicalSummaryAttributes {
  rid: string;
  r_number?: string;
  eid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  project_rid: string;
  fiscal_year: number;
  project_fiscal_rid?: string;
  technical_summary?: string;
  version?: number;
  status?: string;
  entity_transaction_rid?: string;
  technical_summary_refinement_prompt?: string;
}

export interface AiTechnicalSummaryCreationAttributes
  extends Optional<AiTechnicalSummaryAttributes, "rid"> {}

export class AiTechnicalSummary
  extends Model<AiTechnicalSummaryAttributes, AiTechnicalSummaryCreationAttributes>
  implements AiTechnicalSummaryAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public project_rid!: string;
  public fiscal_year!: number;
  public project_fiscal_rid?: string;
  public technical_summary?: string;
  public version?: number;
  public status?: string;
  public entity_transaction_rid?: string;
  public technical_summary_refinement_prompt?: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return AiTechnicalSummary.init(
      {
        rid: {
          type: DataTypes.STRING(50),
           defaultValue: Sequelize.literal( `'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
          defaultValue: Sequelize.literal(`'ATS-' || LPAD(nextval('"${schemaName}".interaction_history_seq')::TEXT, 10, '0')`),
        },
        eid: { type: DataTypes.STRING(50), allowNull: true },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: false },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: false },
        project_fiscal_rid: { type: DataTypes.STRING(50), allowNull: true },
        technical_summary: { type: DataTypes.TEXT, allowNull: true },
        version: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
        status: { type: DataTypes.STRING(50), allowNull: true },
        entity_transaction_rid: { type: DataTypes.STRING(50), allowNull: true },
        technical_summary_refinement_prompt: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "ai_technical_summary",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
