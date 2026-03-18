import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface AiAssessmentAuditAttributes {
  rid: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  transaction_id: string;
  project_rid: string;
  project_fiscal_rid: string;
  account_rid: string;
  is_qre_processed: boolean;
  is_tech_summary_processed: boolean;
  is_interaction_question_processed: boolean;
  data_ingestion?: boolean;
  ai_assessment_request_api_status: string;
  interaction_question_error_message?: JSON;
  qre_error_message?: JSON;
  tech_summary_error_message?: JSON;
  data_ingestion_error_message?: JSON;
  is_four_part_assessment_processed? : boolean
  four_part_assessment_error_message? : JSON
}

export interface AiAssessmentAuditCreationAttributes extends Optional<AiAssessmentAuditAttributes, "rid" | "modified_by" | "modified_datetime"> {}

export class AiAssessmentAudit extends Model<AiAssessmentAuditAttributes, AiAssessmentAuditCreationAttributes> implements AiAssessmentAuditAttributes {
  public rid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public transaction_id!: string;
  public project_rid!: string;
  public project_fiscal_rid!: string;
  public account_rid!: string;
  public is_qre_processed!: boolean;
  public is_tech_summary_processed!: boolean;
  public is_interaction_question_processed!: boolean;
  public data_ingestion?: boolean;
  public ai_assessment_request_api_status!: string;
  public interaction_question_error_message?: JSON;
  public qre_error_message?: JSON;
  public tech_summary_error_message?: JSON;
  public data_ingestion_error_message?: JSON;
  public is_four_part_assessment_processed? : boolean
  public four_part_assessment_error_message? : JSON

  static initialize(sequelize: Sequelize, schemaName: string = MAIN_SCHEMA_NAME) {
    return AiAssessmentAudit.init(
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
        is_qre_processed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        is_tech_summary_processed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        is_interaction_question_processed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
       data_ingestion: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
        ai_assessment_request_api_status: { type: DataTypes.TEXT, allowNull: false },
        interaction_question_error_message:{
          type: DataTypes.JSON,
          allowNull: true
        },
        qre_error_message:{
          type: DataTypes.JSON,
          allowNull: true
        },
        tech_summary_error_message:{
          type: DataTypes.JSON,
          allowNull: true
        },
        data_ingestion_error_message:{
          type: DataTypes.JSON,
          allowNull: true
        },
        is_four_part_assessment_processed : { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        four_part_assessment_error_message:{
          type: DataTypes.JSON,
          allowNull: true
        }
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "ai_assessment_audit",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
