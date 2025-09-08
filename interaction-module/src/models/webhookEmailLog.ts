import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";

export interface WebhookEmailLogAttributes {
  rid: string;
  created_by: string;
  created_datetime: Date;

  email_subject: string;
  email_sender: string;
  attachment_name?: string | null;
  extracted_answers?: string | null;
  uploaded_time: Date;
  status:
    | "SUCCESS"
    | "FAILED"
    | "MISSING_ATTACHMENT"
    | "INVALID_FORMAT"
    | "NO_MATCH_FOUND";
  error_message?: string | null;
}

export interface WebhookEmailLogCreationAttributes
  extends Optional<WebhookEmailLogAttributes, "rid" | "error_message"> {}

export class WebhookEmailLog
  extends Model<WebhookEmailLogAttributes, WebhookEmailLogCreationAttributes>
  implements WebhookEmailLogAttributes
{
  public rid!: string;
  public created_by!: string;
  public created_datetime!: Date;

  public email_subject!: string;
  public email_sender!: string;
  public attachment_name?: string | null;
  public extracted_answers?: string | null;
  public uploaded_time!: Date;
  public status!:
    | "SUCCESS"
    | "FAILED"
    | "MISSING_ATTACHMENT"
    | "INVALID_FORMAT"
    | "NO_MATCH_FOUND";
  public error_message?: string | null;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return WebhookEmailLog.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        email_subject: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        email_sender: {
          type: DataTypes.STRING(200),
          allowNull: false,
        },
        attachment_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        extracted_answers: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        uploaded_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(
            "SUCCESS",
            "FAILED",
            "MISSING_ATTACHMENT",
            "INVALID_FORMAT",
            "NO_MATCH_FOUND"
          ),
          allowNull: false,
        },
        error_message: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "webhook_email_history",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
