
import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface ActivitiesAttributes {
  rid: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  attach_to?: string;
  attachment_level?: string;
  activity_type?: string;
  status_rid?: string;
  effective_start_datetime?: Date;
  effective_end_datetime?: Date;
  subject?: string;
  description?: string;
  email_sent_datetime?: Date;
  priority_rid?: string;
  assigned_to?: string;
  task_name?: string;
  task_template_rid?: string;
  remainder_interval?: number;
  task_repeat_frequency?: string;
  event_url?: string;
  event_code?: string;
  event_password?: string;
  transcript?: string;
  event_platform?: string;
  event_time?: string;
  invitees_list?: string;
  attendees_list?: string;
  mom?: string;
  to_email?: string[];
  cc_email?: string[];
  sender_email?: string;
  fiscal_year?: number;
  body_html?: string;
  meeting_participants?: string[];
  meeting_invite?: string;
  meeting_id?:string;
  call_platform?: string;
  minutes_of_meeting?: string;
  caller_id?: string;
  call_participants?: string[];
  recurrence_days?: string[];
  recurrence_interval?: number;
  recurrence_type?: string;
}

export interface ActivitiesCreationAttributes extends Optional<ActivitiesAttributes, "rid"> {}

export class Activities extends Model<ActivitiesAttributes, ActivitiesCreationAttributes> implements ActivitiesAttributes {
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public attach_to?: string;
  public attachment_level?: string;
  public activity_type?: string;
  public status_rid?: string;
  public start_datetime?: Date;
  public effective_end_datetime?: Date;
  public subject?: string;
  public description?: string;
  public email_sent_datetime?: Date;
  public priority_rid?: string;
  public assigned_to?: string;
  public task_name?: string;
  public task_template_rid?: string;
  public remainder_interval?: number;
  public task_repeat_frequency?: string;
  public event_url?: string;
  public event_code?: string;
  public event_password?: string;
  public transcript?: string;
  public event_platform?: string;
  public event_time?: string;
  public invitees_list?: string;
  public attendees_list?: string;
  public mom?: string;
  public to_email?: string[];
  public cc_email?: string[];
  public sender_email?: string;
  public fiscal_year?: number
  public body_html?: string;
  public meeting_participants?: string[];
  public meeting_invite?: string;
  public meeting_id?:string;
  public call_platform?: string;
  public minutes_of_meeting?: string
  public caller_id?: string;
  public call_participants?: string[];
  public recurrence_days?: string[];
  public recurrence_interval?: number;
  public recurrence_type?: string;

  static initialize(sequelize: Sequelize, schemaName: string = MAIN_SCHEMA_NAME) {
    return Activities.init({
      rid: {
        type: DataTypes.STRING(50),
        defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
        primaryKey: true,
      },
      r_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      created_by: { type: DataTypes.STRING(50), allowNull: false },
      modified_by: { type: DataTypes.STRING(50), allowNull: true },
      created_datetime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      modified_datetime: { type: DataTypes.DATE, allowNull: true },
      account_rid: { type: DataTypes.STRING(50), allowNull: false },
      attach_to: { type: DataTypes.STRING(50), allowNull: true },
      attachment_level: { type: DataTypes.STRING(50), allowNull: true },
      activity_type: { type: DataTypes.STRING(50), allowNull: true },
      status_rid: { type: DataTypes.STRING(50), allowNull: true },
      effective_start_datetime: { type: DataTypes.DATE, allowNull: true },
      effective_end_datetime: { type: DataTypes.DATE, allowNull: true },
      subject: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      email_sent_datetime: { type: DataTypes.DATE, allowNull: true },
      priority_rid: { type: DataTypes.STRING(50), allowNull: true },
      assigned_to: { type: DataTypes.STRING(50), allowNull: true },
      task_name: { type: DataTypes.STRING(255), allowNull: true },
      task_template_rid: { type: DataTypes.STRING(50), allowNull: true },
      remainder_interval: { type: DataTypes.INTEGER, allowNull: true },
      task_repeat_frequency: { type: DataTypes.STRING(50), allowNull: true },
      event_url: { type: DataTypes.STRING(255), allowNull: true },
      event_code: { type: DataTypes.STRING(50), allowNull: true },
      event_password: { type: DataTypes.STRING(50), allowNull: true },
      transcript: { type: DataTypes.TEXT, allowNull: true },
      event_platform: { type: DataTypes.STRING(50), allowNull: true },
      event_time: { type: DataTypes.STRING(50), allowNull: true },
      invitees_list: { type: DataTypes.TEXT, allowNull: true },
      attendees_list: { type: DataTypes.TEXT, allowNull: true },
      mom: { type: DataTypes.TEXT, allowNull: true },
      to_email: { type: DataTypes.JSONB, allowNull: true },
      cc_email: { type: DataTypes.JSONB, allowNull: true },
      sender_email: { type: DataTypes.STRING(255), allowNull: true },
      fiscal_year: { type: DataTypes.INTEGER, allowNull: true },
      body_html: { type: DataTypes.TEXT, allowNull: true },
      meeting_participants: { type: DataTypes.JSONB, allowNull: true },
      meeting_invite: { type: DataTypes.TEXT, allowNull: true },
      meeting_id: { type: DataTypes.STRING(255), allowNull: true },
      call_platform: { type: DataTypes.STRING(255), allowNull: true },
      minutes_of_meeting: { type: DataTypes.TEXT, allowNull: true },
      caller_id: { type: DataTypes.STRING(255), allowNull: true },
      call_participants: { type: DataTypes.JSONB, allowNull: true },
      recurrence_days: { type: DataTypes.JSONB, allowNull: true },
      recurrence_interval: { type: DataTypes.INTEGER, allowNull: true },
      recurrence_type: { type: DataTypes.STRING(255), allowNull: true },
    }, {
      sequelize,
      schema: schemaName,
      tableName: "activities",
      timestamps: false,
      underscored: true,
      indexes: [
        { name: "idx_activities_account_rid", fields: ["account_rid"] },
        { name: "idx_activities_rid", fields: ["rid"] },
        { name: "idx_activities_status_rid", fields: ["status_rid"] },
        { name: "idx_activities_assigned_to", fields: ["assigned_to"] },
        { name: "idx_activities_activity_type", fields: ["activity_type"] },
        { name: "idx_activities_task_template_rid", fields: ["task_template_rid"] },
      ],
    });
  }
}
