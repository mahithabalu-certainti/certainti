import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

 interface InteractionAttributes {
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
  project_fiscal_rid: string;
  interaction_source_rid: string;
  interaction_type_rid: string;
  template_rid?: string;
  sent_by_rid?: string;
  sent_by_mail_id?: string;
  sent_on_datetime?: Date;
  parent_interaction_rid?: string | null;
  interaction_iteration?: number | null;
  last_resent_on?: Date;
  last_reminder_on?: Date;
  last_reminder_by?: string | null;
  response_from?: string;
  response_updated_on?: Date;
  response_updated_by?: string;
  response_submitted_on?: Date;
  response_submission_by?: string;
  response_source_rid?: string;
  status_rid?: string;
  interaction_url?: string;
  interaction_age?: number;
  recipient_email?: string | null;
  recipient_name?: string | null;
  attachment_count?: number;
  interaction_version?: number;
  account_interaction_rid?: string;
  type?: string;
}

export interface InteractionCreationAttributes
  extends Optional<InteractionAttributes, "rid"> {}

export class Interaction
  extends Model<InteractionAttributes, InteractionCreationAttributes>
  implements InteractionAttributes
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
  public project_fiscal_rid!: string;
  public interaction_source_rid!: string;
  public interaction_type_rid!: string;
  public template_rid?: string;
  public sent_by_rid?: string;
  public sent_by_mail_id?: string;
  public sent_on_datetime?: Date;
  public parent_interaction_rid?: string | null;
  public interaction_iteration?: number | null;
  public last_resent_on?: Date;
  public last_reminder_on?: Date;
  public last_reminder_by?: string | null;
  public response_from?: string;
  public response_updated_on?: Date;
  public response_updated_by?: string;
  public response_submitted_on?: Date;
  public response_submission_by?: string;
  public response_source_rid?: string;
  public status_rid?: string;
  public interaction_url?: string;
  public interaction_age?: number;
  public recipient_email?: string | null;
  public recipient_name?: string | null;
  public attachment_count?: number;
  public interaction_version?: number;
  public account_interaction_rid?: string;
  public type?: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return Interaction.init(
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
       // r_number: { type: DataTypes.STRING(120), allowNull: true },
        eid: { type: DataTypes.STRING(50), allowNull: true },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { type: DataTypes.DATE, allowNull: false , defaultValue: DataTypes.NOW},
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: false },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: true },
        project_fiscal_rid: { type: DataTypes.STRING(50), allowNull: false },
        account_interaction_rid: { type: DataTypes.STRING(50), allowNull: true },
        type: { type: DataTypes.STRING(50), allowNull: true },
        interaction_source_rid: { type: DataTypes.STRING(255), allowNull: true },
        interaction_type_rid: { type: DataTypes.STRING(50), allowNull: true },
        template_rid: { type: DataTypes.STRING(50), allowNull: true },
        sent_by_rid: { type: DataTypes.STRING(50), allowNull: true },
        sent_by_mail_id: { type: DataTypes.STRING(255), allowNull: true },
        sent_on_datetime: { type: DataTypes.DATE, allowNull: true },
        parent_interaction_rid: { type: DataTypes.STRING(50), allowNull: true },
        interaction_iteration: { type: DataTypes.INTEGER, allowNull: true },
        last_resent_on: { type: DataTypes.DATE, allowNull: true },
        last_reminder_on: { type: DataTypes.DATE, allowNull: true },
        last_reminder_by: { type: DataTypes.STRING(50), allowNull: true },
        response_from: { type: DataTypes.STRING(255), allowNull: true },
        response_updated_on: { type: DataTypes.DATE, allowNull: true },
        response_updated_by: { type: DataTypes.STRING(50), allowNull: true },
        response_submitted_on: { type: DataTypes.DATE, allowNull: true },
        response_submission_by: { type: DataTypes.STRING(50), allowNull: true },
        response_source_rid: { type: DataTypes.STRING(255), allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
        interaction_url: { type: DataTypes.STRING(255), allowNull: true },
        interaction_age: { type: DataTypes.INTEGER, allowNull: true },
        recipient_email: { type: DataTypes.STRING(255), allowNull: true },
        recipient_name: { type: DataTypes.STRING(255), allowNull: true },
        attachment_count: { type: DataTypes.INTEGER, allowNull: true },
        interaction_version: { type: DataTypes.INTEGER, allowNull: true }
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "interactions",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
