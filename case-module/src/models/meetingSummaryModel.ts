import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface MeetingSummaryAttributes {
    rid: string;
    r_number?: string;
    created_by: string;
    modified_by?: string;
    created_datetime?: Date;
    modified_datetime?: Date;
    activity_rid: string;
    account_rid: string;
    attach_to?: string;
    attachment_level?: string;
    status_rid?: string;
    effective_start_datetime?: Date;
    effective_end_datetime?: Date;
    subject?: string;
    meeting_participants?: any; // json in DB
    meeting_invite?: string;
    meeting_id?: string;
    minutes_of_meeting?: string;
    recurrence_days?: any; // json in DB
    recurrence_interval?: number;
    recurrence_type?: string;
    time_zone?: string;
    effective_start_time?: string;
    effective_end_time?: string;
    invited_by?: string;
    recurrence_day_of_month?: number;
    recurrence_monthly_index?: string;
}

export interface MeetingSummaryCreationAttributes extends Optional<MeetingSummaryAttributes, "rid"> { }

export class MeetingSummary extends Model<MeetingSummaryAttributes, MeetingSummaryCreationAttributes> implements MeetingSummaryAttributes {
    public rid!: string;
    public r_number?: string;
    public created_by!: string;
    public modified_by?: string;
    public created_datetime?: Date;
    public modified_datetime?: Date;
    public activity_rid!: string;
    public account_rid!: string;
    public attach_to?: string;
    public attachment_level?: string;
    public status_rid?: string;
    public effective_start_datetime?: Date;
    public effective_end_datetime?: Date;
    public subject?: string;
    public meeting_participants?: any;
    public meeting_invite?: string;
    public meeting_id?: string;
    public minutes_of_meeting?: string;
    public recurrence_days?: any;
    public recurrence_interval?: number;
    public recurrence_type?: string;
    public time_zone?: string;
    public effective_start_time?: string;
    public effective_end_time?: string;
    public invited_by?: string;
    public recurrence_day_of_month?: number;
    public recurrence_monthly_index?: string;

    static initialize(sequelize: Sequelize, schemaName: string) {
        return MeetingSummary.init({
            rid: {
                type: DataTypes.STRING(50),
                primaryKey: true,
                defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
            },
            r_number: {
                type: DataTypes.STRING(50),
                allowNull: true,
                defaultValue: Sequelize.literal(`'MS-' || lpad(nextval('trd365.meeting_summary_seq')::text, 10, '0')`),
            },
            created_by: { type: DataTypes.STRING(50), allowNull: false },
            modified_by: { type: DataTypes.STRING(50), allowNull: true },
            created_datetime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            modified_datetime: { type: DataTypes.DATE, allowNull: true },
            activity_rid: { type: DataTypes.STRING(50), allowNull: false },
            account_rid: { type: DataTypes.STRING(50), allowNull: false },
            attach_to: { type: DataTypes.STRING(50), allowNull: true },
            attachment_level: { type: DataTypes.STRING(50), allowNull: true },
            status_rid: { type: DataTypes.STRING(50), allowNull: true },
            effective_start_datetime: { type: DataTypes.DATE, allowNull: true },
            effective_end_datetime: { type: DataTypes.DATE, allowNull: true },
            subject: { type: DataTypes.STRING(255), allowNull: true },
            meeting_participants: { type: DataTypes.JSON, allowNull: true },
            meeting_invite: { type: DataTypes.TEXT, allowNull: true },
            meeting_id: { type: DataTypes.STRING(255), allowNull: true },
            minutes_of_meeting: { type: DataTypes.TEXT, allowNull: true },
            recurrence_days: { type: DataTypes.JSON, allowNull: true },
            recurrence_interval: { type: DataTypes.INTEGER, allowNull: true },
            recurrence_type: { type: DataTypes.STRING(50), allowNull: true },
            time_zone: { type: DataTypes.STRING(50), allowNull: true },
            effective_start_time: { type: DataTypes.STRING(50), allowNull: true },
            effective_end_time: { type: DataTypes.STRING(50), allowNull: true },
            invited_by: { type: DataTypes.STRING(50), allowNull: true },
            recurrence_day_of_month: { type: DataTypes.INTEGER, allowNull: true },
            recurrence_monthly_index: { type: DataTypes.STRING(50), allowNull: true },
        }, {
            sequelize,
            schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
            tableName: "meeting_summary",
            timestamps: false,
            underscored: true,
            indexes: [
                { name: "meeting_summary_pkey", unique: true, fields: ["rid"] }
            ]
        });
    }
}
