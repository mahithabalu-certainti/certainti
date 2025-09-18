import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
export interface AiAssessmentQreAttributes {
  rid: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  transaction_id: string;
  project_fiscal_rid: string;
  project_rid: string;
  account_rid: string;
  qre_percent: number;
  qre_detailed_breakdown?: JSON;
  version?: number;
}

export interface AiAssessmentQreCreationAttributes extends Optional<AiAssessmentQreAttributes, "rid"> {}


export class AiAssessmentQre extends Model<AiAssessmentQreAttributes, AiAssessmentQreCreationAttributes> implements AiAssessmentQreAttributes {
  public rid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public transaction_id!: string;
  public project_fiscal_rid!: string;
  public project_rid!: string;
  public account_rid!: string;
  public qre_percent!: number;
  public qre_detailed_breakdown?: JSON;
  public version?: number;

  static initialize(sequelize: Sequelize, schemaName: string = MAIN_SCHEMA_NAME) {
    return AiAssessmentQre.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        transaction_id: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_fiscal_rid: { type: DataTypes.STRING(50), allowNull: false },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        qre_percent: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
        qre_detailed_breakdown: { type: DataTypes.JSON, allowNull: true },
        version: { type: DataTypes.INTEGER, allowNull: true },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "ai_assessment_qre",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
