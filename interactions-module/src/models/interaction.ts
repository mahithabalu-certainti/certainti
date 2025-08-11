
import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface InteractionAttributes {
  rid: string;
  r_number?: string;
  eid?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid?: string;
  project_id?: string;
  fiscal_year?: string;
  project_fiscal_rid?: string;
  interaction_source?: string;
  interaction_type_rid?: string;
  template_rid?: string;
  sent_by_rid?: string;
  sent_by_mail_id?: string;
  sent_on_datetime?: Date;
  sent_to?: string;
  parent_interaction_rid?: string;
  interaction_iteration?: number;
  last_resent_on?: Date;
  last_reminder_on?: Date;
  last_reminder_by?: Date;
  response_from?: string;
  response_updated_on?: Date;
  response_updated_by?: string;
  response_submitted_on?: string;
  response_submission_by?: string;
  response_source?: string;
  interaction_status_rid?: string;
  interaction_hashcode?: string;
  interaction_url?: string;
  interaction_age?: number;
}

export interface InteractionCreationAttributes extends Optional<InteractionAttributes, "rid"> {}

export class Interaction extends Model<InteractionAttributes, InteractionCreationAttributes> implements InteractionAttributes {
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid?: string;
  public project_id?: string;
  public fiscal_year?: string;
  public project_fiscal_rid?: string;
  public interaction_source?: string;
  public interaction_type_rid?: string;
  public template_rid?: string;
  public sent_by_rid?: string;
  public sent_by_mail_id?: string;
  public sent_on_datetime?: Date;
  public sent_to?: string;
  public parent_interaction_rid?: string;
  public interaction_iteration?: number;
  public last_resent_on?: Date;
  public last_reminder_on?: Date;
  public last_reminder_by?: Date;
  public response_from?: string;
  public response_updated_on?: Date;
  public response_updated_by?: string;
  public response_submitted_on?: string;
  public response_submission_by?: string;
  public response_source?: string;
  public interaction_status_rid?: string;
  public interaction_hashcode?: string;
  public interaction_url?: string;
  public interaction_age?: number;

  static initialize(sequelize: Sequelize, schemaName: string = MAIN_SCHEMA_NAME) {
    return Interaction.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        r_number: { type: DataTypes.STRING(120), allowNull: true },
        eid: { type: DataTypes.STRING(50), allowNull: true },
        created_by: { type: DataTypes.STRING(50), allowNull: true },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { type: DataTypes.DATE, allowNull: true },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        account_rid: { type: DataTypes.STRING(50), allowNull: true },
        project_id: { type: DataTypes.STRING(50), allowNull: true },
        fiscal_year: { type: DataTypes.STRING(50), allowNull: true },
        project_fiscal_rid: { type: DataTypes.STRING(50), allowNull: true },
        interaction_source: { type: DataTypes.STRING(255), allowNull: true },
        interaction_type_rid: { type: DataTypes.STRING(50), allowNull: true },
        template_rid: { type: DataTypes.STRING(50), allowNull: true },
        sent_by_rid: { type: DataTypes.STRING(50), allowNull: true },
        sent_by_mail_id: { type: DataTypes.STRING(255), allowNull: true },
        sent_on_datetime: { type: DataTypes.DATE, allowNull: true },
        sent_to: { type: DataTypes.STRING(255), allowNull: true },
        parent_interaction_rid: { type: DataTypes.STRING(50), allowNull: true },
        interaction_iteration: { type: DataTypes.INTEGER, allowNull: true },
        last_resent_on: { type: DataTypes.DATE, allowNull: true },
        last_reminder_on: { type: DataTypes.DATE, allowNull: true },
        last_reminder_by: { type: DataTypes.DATE, allowNull: true },
        response_from: { type: DataTypes.STRING(255), allowNull: true },
        response_updated_on: { type: DataTypes.DATE, allowNull: true },
        response_updated_by: { type: DataTypes.STRING(50), allowNull: true },
        response_submitted_on: { type: DataTypes.STRING(50), allowNull: true },
        response_submission_by: { type: DataTypes.STRING(50), allowNull: true },
        response_source: { type: DataTypes.STRING(255), allowNull: true },
        interaction_status_rid: { type: DataTypes.STRING(50), allowNull: true },
        interaction_hashcode: { type: DataTypes.STRING(255), allowNull: true },
        interaction_url: { type: DataTypes.STRING(255), allowNull: true },
        interaction_age: { type: DataTypes.INTEGER, allowNull: true },
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
