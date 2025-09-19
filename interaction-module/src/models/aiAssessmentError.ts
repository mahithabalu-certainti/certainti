
import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface AiAssessmentErrorAttributes {
  rid: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  project_rid: string;
  transaction_id: string;
  errorMessage: JSON;
}

export interface AiAssessmentErrorCreationAttributes
  extends Optional<AiAssessmentErrorAttributes, "rid"> {}

export class AiAssessmentError
  extends Model<AiAssessmentErrorAttributes, AiAssessmentErrorCreationAttributes>
  implements AiAssessmentErrorAttributes
{
  public rid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public project_rid!: string;
  public transaction_id!: string;
  public errorMessage!: JSON;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return AiAssessmentError.init(
      {
        rid: {
          type: DataTypes.STRING(50),
           defaultValue: Sequelize.literal( `'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: false },
        transaction_id: { type: DataTypes.STRING(50), allowNull: false },
        errorMessage: { type: DataTypes.JSON, allowNull: false },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "ai_assessment_error",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
